// Enhanced Database System with error handling
class QuestionDatabase {
    constructor() {
        this.dbName = 'QuestionManagerDB';
        this.dbVersion = 2;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // オブジェクトストアの作成
                if (!db.objectStoreNames.contains('questions')) {
                    const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
                    questionStore.createIndex('subject', 'subject', { unique: false });
                    questionStore.createIndex('topic', 'topic', { unique: false });
                    questionStore.createIndex('createdAt', 'createdAt', { unique: false });
                    questionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('templates')) {
                    db.createObjectStore('templates', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async saveQuestion(question) {
        try {
            if (!this.db) await this.init();
            
            // タイムスタンプを追加
            question.updatedAt = new Date().toISOString();
            if (!question.createdAt) {
                question.createdAt = question.updatedAt;
            }
            
            const transaction = this.db.transaction(['questions'], 'readwrite');
            const store = transaction.objectStore('questions');
            
            return new Promise((resolve, reject) => {
                const request = store.put(question);
                
                request.onsuccess = () => {
                    console.log('Question saved:', question.id);
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Save question error:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Save question failed:', error);
            // フォールバックとしてlocalStorageを使用
            this.saveToLocalStorage(question);
            return false;
        }
    }

    async getQuestion(id) {
        try {
            if (!this.db) await this.init();
            
            const transaction = this.db.transaction(['questions'], 'readonly');
            const store = transaction.objectStore('questions');
            
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                
                request.onsuccess = () => {
                    resolve(request.result);
                };
                
                request.onerror = (event) => {
                    console.error('Get question error:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Get question failed:', error);
            // localStorageから取得
            return this.getFromLocalStorage(id);
        }
    }

    async getQuestions(options = {}) {
        try {
            if (!this.db) await this.init();
            
            const { limit = 20, offset = 0, subject, topic, sortBy = 'updatedAt', sortOrder = 'desc' } = options;
            
            const transaction = this.db.transaction(['questions'], 'readonly');
            const store = transaction.objectStore('questions');
            
            let questions = [];
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                
                request.onsuccess = () => {
                    questions = request.result;
                    
                    // フィルタリング
                    if (subject) {
                        questions = questions.filter(q => q.subject === subject);
                    }
                    
                    if (topic) {
                        questions = questions.filter(q => q.topic === topic);
                    }
                    
                    // ソート
                    questions.sort((a, b) => {
                        const aVal = a[sortBy] || 0;
                        const bVal = b[sortBy] || 0;
                        return sortOrder === 'desc' ? 
                            new Date(bVal) - new Date(aVal) : 
                            new Date(aVal) - new Date(bVal);
                    });
                    
                    // ページネーション
                    resolve(questions.slice(offset, offset + limit));
                };
                
                request.onerror = (event) => {
                    console.error('Get questions error:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Get questions failed:', error);
            // localStorageから取得
            return this.getFromLocalStorage(options);
        }
    }

    async searchQuestions(query, options = {}) {
        try {
            const questions = await this.getQuestions(options);
            const searchTerm = query.toLowerCase();
            
            return questions.filter(q => 
                q.question?.toLowerCase().includes(searchTerm) ||
                q.topic?.toLowerCase().includes(searchTerm) ||
                q.explanation?.toLowerCase().includes(searchTerm) ||
                q.choices?.some(choice => choice.toLowerCase().includes(searchTerm))
            );
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    async deleteQuestion(id) {
        try {
            if (!this.db) await this.init();
            
            const transaction = this.db.transaction(['questions'], 'readwrite');
            const store = transaction.objectStore('questions');
            
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                
                request.onsuccess = () => {
                    console.log('Question deleted:', id);
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Delete question error:', event.target.error);
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Delete question failed:', error);
            this.deleteFromLocalStorage(id);
            return false;
        }
    }

    async getStats() {
        try {
            const questions = await this.getQuestions({ limit: 10000 });
            const stats = {
                total: questions.length,
                bySubject: {},
                byFormat: {},
                byDifficulty: {},
                recentActivity: []
            };
            
            questions.forEach(q => {
                // 教科別カウント
                if (q.subject) {
                    stats.bySubject[q.subject] = (stats.bySubject[q.subject] || 0) + 1;
                }
                
                // フォーマット別カウント
                if (q.answerFormat) {
                    stats.byFormat[q.answerFormat] = (stats.byFormat[q.answerFormat] || 0) + 1;
                }
                
                // 難易度別カウント
                if (q.difficulty) {
                    stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
                }
            });
            
            // 最近のアクティビティ
            stats.recentActivity = questions
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 10);
            
            return stats;
        } catch (error) {
            console.error('Get stats failed:', error);
            return null;
        }
    }

    // LocalStorageフォールバックメソッド
    saveToLocalStorage(question) {
        const questions = JSON.parse(localStorage.getItem('questions') || '[]');
        const index = questions.findIndex(q => q.id === question.id);
        
        if (index >= 0) {
            questions[index] = question;
        } else {
            questions.push(question);
        }
        
        localStorage.setItem('questions', JSON.stringify(questions));
    }

    getFromLocalStorage(id) {
        const questions = JSON.parse(localStorage.getItem('questions') || '[]');
        return questions.find(q => q.id === id) || null;
    }

    getFromLocalStorage(options = {}) {
        const questions = JSON.parse(localStorage.getItem('questions') || '[]');
        let filtered = [...questions];
        
        if (options.subject) {
            filtered = filtered.filter(q => q.subject === options.subject);
        }
        
        if (options.topic) {
            filtered = filtered.filter(q => q.topic === options.topic);
        }
        
        // ソート
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // ページネーション
        return filtered.slice(options.offset || 0, (options.limit || 20) + (options.offset || 0));
    }

    deleteFromLocalStorage(id) {
        const questions = JSON.parse(localStorage.getItem('questions') || '[]');
        const filtered = questions.filter(q => q.id !== id);
        localStorage.setItem('questions', JSON.stringify(filtered));
    }

    // データ移行
    async migrateFromLocalStorage() {
        const localQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
        if (localQuestions.length === 0) return;
        
        console.log(`Migrating ${localQuestions.length} questions to IndexedDB...`);
        
        for (const question of localQuestions) {
            await this.saveQuestion(question);
        }
        
        // 移行完了後、localStorageをクリア
        localStorage.removeItem('questions');
        console.log('Migration completed');
    }
}

// グローバルインスタンス
let dbInstance = null;

// データベースの初期化
async function initDatabase() {
    if (!dbInstance) {
        dbInstance = new QuestionDatabase();
        await dbInstance.init();
        
        // LocalStorageからの移行をチェック
        const localQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
        if (localQuestions.length > 0) {
            await dbInstance.migrateFromLocalStorage();
        }
    }
    return dbInstance;
}

// 互換性のためのグローバル関数
window.Database = {
    saveQuestion: async (question) => {
        const db = await initDatabase();
        return db.saveQuestion(question);
    },
    
    getQuestion: async (id) => {
        const db = await initDatabase();
        return db.getQuestion(id);
    },
    
    getQuestions: async (options) => {
        const db = await initDatabase();
        return db.getQuestions(options);
    },
    
    searchQuestions: async (query, options) => {
        const db = await initDatabase();
        return db.searchQuestions(query, options);
    },
    
    deleteQuestion: async (id) => {
        const db = await initDatabase();
        return db.deleteQuestion(id);
    },
    
    getStats: async () => {
        const db = await initDatabase();
        return db.getStats();
    },
    
    getInstance: async () => {
        return initDatabase();
    }
};

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    initDatabase().catch(console.error);
});