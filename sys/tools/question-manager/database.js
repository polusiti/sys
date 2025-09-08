// データベース管理システム
class QuestionDatabase {
    constructor() {
        this.dbName = 'QuestionManagerDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('データベース初期化完了');
        } catch (error) {
            console.error('データベース初期化エラー:', error);
            this.fallbackToLocalStorage();
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 問題ストア
                if (!db.objectStoreNames.contains('questions')) {
                    const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
                    questionStore.createIndex('subject', 'subject', { unique: false });
                    questionStore.createIndex('difficulty', 'difficulty', { unique: false });
                    questionStore.createIndex('createdAt', 'metadata.createdAt', { unique: false });
                    questionStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }
                
                // ユーザー履歴ストア
                if (!db.objectStoreNames.contains('userHistory')) {
                    const historyStore = db.createObjectStore('userHistory', { keyPath: 'id', autoIncrement: true });
                    historyStore.createIndex('userId', 'userId', { unique: false });
                    historyStore.createIndex('questionId', 'questionId', { unique: false });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // 問題セットストア
                if (!db.objectStoreNames.contains('questionSets')) {
                    const setStore = db.createObjectStore('questionSets', { keyPath: 'id' });
                    setStore.createIndex('createdBy', 'createdBy', { unique: false });
                    setStore.createIndex('subject', 'subject', { unique: false });
                }
                
                // 統計情報ストア
                if (!db.objectStoreNames.contains('statistics')) {
                    const statsStore = db.createObjectStore('statistics', { keyPath: 'id' });
                    statsStore.createIndex('type', 'type', { unique: false });
                    statsStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    // 問題の保存
    async saveQuestion(question) {
        if (!this.db) {
            return this.saveToLocalStorage('questions', question);
        }
        
        try {
            const transaction = this.db.transaction(['questions'], 'readwrite');
            const store = transaction.objectStore('questions');
            
            // 保存前の処理
            question.metadata = question.metadata || {};
            question.metadata.updatedAt = new Date().toISOString();
            question.metadata.version = (question.metadata.version || 0) + 1;
            
            await store.put(question);
            
            // 統計更新
            this.updateStatistics('question_created', {
                subject: question.subject,
                difficulty: question.difficulty,
                createdBy: AuthenticationSystem.getCurrentUser()?.username
            });
            
            return { success: true, id: question.id };
        } catch (error) {
            console.error('問題保存エラー:', error);
            throw error;
        }
    }

    // 問題の取得
    async getQuestion(id) {
        if (!this.db) {
            return this.getFromLocalStorage('questions', id);
        }
        
        try {
            const transaction = this.db.transaction(['questions'], 'readonly');
            const store = transaction.objectStore('questions');
            const request = store.get(id);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('問題取得エラー:', error);
            throw error;
        }
    }

    // 問題の検索
    async searchQuestions(criteria = {}) {
        if (!this.db) {
            return this.searchInLocalStorage('questions', criteria);
        }
        
        try {
            const transaction = this.db.transaction(['questions'], 'readonly');
            const store = transaction.objectStore('questions');
            
            let request;
            if (criteria.subject) {
                const index = store.index('subject');
                request = index.getAll(criteria.subject);
            } else if (criteria.difficulty) {
                const index = store.index('difficulty');
                request = index.getAll(criteria.difficulty);
            } else {
                request = store.getAll();
            }
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    let results = request.result;
                    
                    // 追加フィルタリング
                    if (criteria.tags && criteria.tags.length > 0) {
                        results = results.filter(q => 
                            q.tags && q.tags.some(tag => criteria.tags.includes(tag))
                        );
                    }
                    
                    if (criteria.searchText) {
                        const searchLower = criteria.searchText.toLowerCase();
                        results = results.filter(q => 
                            q.questionContent.text.toLowerCase().includes(searchLower) ||
                            q.id.toLowerCase().includes(searchLower)
                        );
                    }
                    
                    // ソート
                    if (criteria.sortBy) {
                        results.sort((a, b) => {
                            const aVal = this.getValueByPath(a, criteria.sortBy);
                            const bVal = this.getValueByPath(b, criteria.sortBy);
                            return criteria.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
                        });
                    }
                    
                    resolve(results);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('問題検索エラー:', error);
            throw error;
        }
    }

    // 問題の削除
    async deleteQuestion(id) {
        if (!this.db) {
            return this.deleteFromLocalStorage('questions', id);
        }
        
        try {
            const transaction = this.db.transaction(['questions'], 'readwrite');
            const store = transaction.objectStore('questions');
            await store.delete(id);
            
            this.updateStatistics('question_deleted', { questionId: id });
            return { success: true };
        } catch (error) {
            console.error('問題削除エラー:', error);
            throw error;
        }
    }

    // 問題セットの作成
    async createQuestionSet(setData) {
        if (!this.db) {
            return this.saveToLocalStorage('questionSets', setData);
        }
        
        try {
            const transaction = this.db.transaction(['questionSets'], 'readwrite');
            const store = transaction.objectStore('questionSets');
            
            setData.id = setData.id || `SET_${Date.now()}`;
            setData.createdAt = new Date().toISOString();
            setData.createdBy = AuthenticationSystem.getCurrentUser()?.username;
            
            await store.put(setData);
            return { success: true, id: setData.id };
        } catch (error) {
            console.error('問題セット作成エラー:', error);
            throw error;
        }
    }

    // ランダム出題
    async getRandomQuestions(criteria = {}) {
        const count = criteria.count || 10;
        const questions = await this.searchQuestions(criteria);
        
        // Fisher-Yatesシャッフル
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        
        return questions.slice(0, count);
    }

    // 統計情報の更新
    async updateStatistics(type, data) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['statistics'], 'readwrite');
            const store = transaction.objectStore('statistics');
            
            const statRecord = {
                id: `${type}_${Date.now()}`,
                type: type,
                data: data,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            
            await store.put(statRecord);
        } catch (error) {
            console.error('統計更新エラー:', error);
        }
    }

    // 使用履歴の記録
    async recordUsage(questionId, result) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['userHistory'], 'readwrite');
            const store = transaction.objectStore('userHistory');
            
            const historyRecord = {
                userId: AuthenticationSystem.getCurrentUser()?.username,
                questionId: questionId,
                result: result, // correct, incorrect, skipped
                timestamp: new Date().toISOString(),
                timeSpent: result.timeSpent || 0
            };
            
            await store.put(historyRecord);
        } catch (error) {
            console.error('履歴記録エラー:', error);
        }
    }

    // データエクスポート
    async exportData(format = 'json') {
        const questions = await this.searchQuestions();
        
        if (format === 'json') {
            return {
                exportDate: new Date().toISOString(),
                version: '1.0',
                questions: questions,
                count: questions.length
            };
        } else if (format === 'csv') {
            return this.convertToCSV(questions);
        }
    }

    // CSVコンバーター
    convertToCSV(questions) {
        const headers = ['id', 'subject', 'difficulty', 'question', 'answerFormat', 'choices', 'correctAnswers', 'explanation'];
        const rows = [headers.join(',')];
        
        questions.forEach(q => {
            const row = [
                q.id,
                q.subject,
                q.difficulty,
                `"${q.questionContent.text.replace(/"/g, '""')}"`,
                q.answerFormat,
                q.answerData.choices ? `"${q.answerData.choices.join('|')}"` : '',
                q.answerData.correctAnswers ? q.answerData.correctAnswers.join(';') : '',
                `"${(q.explanation.text || '').replace(/"/g, '""')}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\\n');
    }

    // バックアップ作成
    async createBackup() {
        const exportData = await this.exportData();
        const backupData = {
            id: `backup_${Date.now()}`,
            createdAt: new Date().toISOString(),
            data: exportData,
            size: JSON.stringify(exportData).length
        };
        
        // バックアップをlocalStorageに保存
        const backups = JSON.parse(localStorage.getItem('question_backups') || '[]');
        backups.unshift(backupData);
        
        // 最新10件のみ保持
        if (backups.length > 10) {
            backups.splice(10);
        }
        
        localStorage.setItem('question_backups', JSON.stringify(backups));
        return backupData.id;
    }

    // LocalStorageフォールバック
    fallbackToLocalStorage() {
        console.log('IndexedDBが利用できません。LocalStorageを使用します。');
        this.db = null;
    }

    saveToLocalStorage(store, data) {
        const existing = JSON.parse(localStorage.getItem(store) || '[]');
        const index = existing.findIndex(item => item.id === data.id);
        
        if (index >= 0) {
            existing[index] = data;
        } else {
            existing.push(data);
        }
        
        localStorage.setItem(store, JSON.stringify(existing));
        return { success: true, id: data.id };
    }

    getFromLocalStorage(store, id) {
        const data = JSON.parse(localStorage.getItem(store) || '[]');
        return data.find(item => item.id === id);
    }

    searchInLocalStorage(store, criteria) {
        const data = JSON.parse(localStorage.getItem(store) || '[]');
        return data.filter(item => {
            if (criteria.subject && item.subject !== criteria.subject) return false;
            if (criteria.difficulty && item.difficulty !== criteria.difficulty) return false;
            if (criteria.searchText) {
                const searchLower = criteria.searchText.toLowerCase();
                if (!item.questionContent.text.toLowerCase().includes(searchLower) &&
                    !item.id.toLowerCase().includes(searchLower)) return false;
            }
            return true;
        });
    }

    deleteFromLocalStorage(store, id) {
        const data = JSON.parse(localStorage.getItem(store) || '[]');
        const filtered = data.filter(item => item.id !== id);
        localStorage.setItem(store, JSON.stringify(filtered));
        return { success: true };
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}

// グローバルインスタンス
window.questionDB = new QuestionDatabase();