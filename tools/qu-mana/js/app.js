// メインアプリケーション
class QuestionManager {
    constructor() {
        this.config = window.CONFIG;
        this.questions = {};
        this.statistics = {};
        this.currentUser = 'user_001'; // 簡易的なユーザー管理
        this.init();
    }

    init() {
        this.loadConfig();
        this.loadQuestions();
        this.loadStatistics();
        this.setupEventListeners();
        this.setupAutoSave();
        this.checkForUpdates();
    }

    loadConfig() {
        // 設定の読み込みと拡張
        this.config.version = this.config.VERSION || '1.0.0';
        this.config.lastSave = null;
        this.config.isDirty = false;
        
        // テーマ設定
        const savedTheme = localStorage.getItem(this.config.STORAGE_PREFIX + 'theme');
        if (savedTheme) {
            this.config.THEME = savedTheme;
        }
    }

    loadQuestions() {
        // 全ての問題タイプを読み込む
        Object.keys(this.config.QUESTION_TYPES).forEach(type => {
            const storageKey = this.config.STORAGE_PREFIX + 'questions_' + type;
            const questions = JSON.parse(localStorage.getItem(storageKey) || '[]');
            this.questions[type] = questions;
        });
    }

    loadStatistics() {
        const statsKey = this.config.STORAGE_PREFIX + 'statistics';
        const savedStats = JSON.parse(localStorage.getItem(statsKey) || '{}');
        
        this.statistics = {
            totalQuestions: 0,
            questionsByType: {},
            questionsByStatus: {},
            questionsByDifficulty: {},
            recentActivity: [],
            lastUpdated: new Date().toISOString(),
            ...savedStats
        };
        
        this.updateStatistics();
    }

    updateStatistics() {
        // 統計情報を更新
        this.statistics.totalQuestions = 0;
        this.statistics.questionsByType = {};
        this.statistics.questionsByStatus = {};
        this.statistics.questionsByDifficulty = {};
        
        Object.keys(this.questions).forEach(type => {
            const questions = this.questions[type];
            this.statistics.totalQuestions += questions.length;
            this.statistics.questionsByType[type] = questions.length;
            
            questions.forEach(question => {
                // ステータス別集計
                const status = question.status || 'draft';
                this.statistics.questionsByStatus[status] = (this.statistics.questionsByStatus[status] || 0) + 1;
                
                // 難易度別集計
                const difficulty = question.difficulty || 1;
                this.statistics.questionsByDifficulty[difficulty] = (this.statistics.questionsByDifficulty[difficulty] || 0) + 1;
            });
        });
        
        this.statistics.lastUpdated = new Date().toISOString();
        this.saveStatistics();
    }

    saveStatistics() {
        const statsKey = this.config.STORAGE_PREFIX + 'statistics';
        localStorage.setItem(statsKey, JSON.stringify(this.statistics));
    }

    setupEventListeners() {
        // 自動保存のイベントリスナー
        window.addEventListener('beforeunload', (e) => {
            if (this.config.isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // オンライン/オフラインイベント
        window.addEventListener('online', () => {
            this.showNotification('オンラインに接続しました', 'success');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.showNotification('オフラインモードです', 'warning');
        });
    }

    setupAutoSave() {
        if (this.config.AUTO_SAVE) {
            setInterval(() => {
                if (this.config.isDirty) {
                    this.autoSave();
                }
            }, this.config.AUTO_SAVE_INTERVAL);
        }
    }

    autoSave() {
        try {
            this.saveAllQuestions();
            this.config.isDirty = false;
            this.config.lastSave = new Date().toISOString();
            this.showNotification('自動保存しました', 'success');
        } catch (error) {
            console.error('Auto save failed:', error);
            this.showNotification('自動保存に失敗しました', 'error');
        }
    }

    // 問題管理機能
    createQuestion(type, questionData) {
        const question = {
            id: this.generateId(type),
            type: type,
            ...questionData,
            created: new Date().toISOString(),
            created_by: this.currentUser,
            version: 1,
            status: 'draft',
            tags: questionData.tags || [],
            difficulty: questionData.difficulty || 1
        };

        this.questions[type].push(question);
        this.config.isDirty = true;
        this.updateStatistics();
        
        // アクティビティ記録
        this.recordActivity('create', type, question.id);
        
        return question;
    }

    updateQuestion(type, questionId, updateData) {
        const questionIndex = this.questions[type].findIndex(q => q.id === questionId);
        if (questionIndex === -1) {
            throw new Error('Question not found');
        }

        // バージョン管理
        const currentQuestion = this.questions[type][questionIndex];
        const updatedQuestion = {
            ...currentQuestion,
            ...updateData,
            modified: new Date().toISOString(),
            modified_by: this.currentUser,
            version: (currentQuestion.version || 1) + 1
        };

        this.questions[type][questionIndex] = updatedQuestion;
        this.config.isDirty = true;
        this.updateStatistics();
        
        // アクティビティ記録
        this.recordActivity('update', type, questionId);
        
        return updatedQuestion;
    }

    deleteQuestion(type, questionId) {
        const questionIndex = this.questions[type].findIndex(q => q.id === questionId);
        if (questionIndex === -1) {
            throw new Error('Question not found');
        }

        // 論理削除（ゴミ箱機能）
        const question = this.questions[type][questionIndex];
        question.status = 'deleted';
        question.deleted = new Date().toISOString();
        question.deleted_by = this.currentUser;
        
        this.config.isDirty = true;
        this.updateStatistics();
        
        // アクティビティ記録
        this.recordActivity('delete', type, questionId);
        
        return true;
    }

    publishQuestion(type, questionId) {
        return this.updateQuestion(type, questionId, { status: 'published' });
    }

    unpublishQuestion(type, questionId) {
        return this.updateQuestion(type, questionId, { status: 'draft' });
    }

    getQuestion(type, questionId) {
        return this.questions[type].find(q => q.id === questionId);
    }

    getQuestions(type, filters = {}) {
        let questions = this.questions[type] || [];
        
        // フィルタリング
        if (filters.status) {
            questions = questions.filter(q => q.status === filters.status);
        }
        
        if (filters.difficulty) {
            questions = questions.filter(q => q.difficulty === filters.difficulty);
        }
        
        if (filters.tags) {
            questions = questions.filter(q => 
                filters.tags.every(tag => q.tags.includes(tag))
            );
        }
        
        // 並び替え
        if (filters.sortBy === 'created') {
            questions.sort((a, b) => new Date(b.created) - new Date(a.created));
        } else if (filters.sortBy === 'modified') {
            questions.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        }
        
        return questions;
    }

    // データ保存機能
    saveAllQuestions() {
        Object.keys(this.questions).forEach(type => {
            const storageKey = this.config.STORAGE_PREFIX + 'questions_' + type;
            localStorage.setItem(storageKey, JSON.stringify(this.questions[type]));
        });
    }

    exportData(format = 'json') {
        const exportData = {
            questions: this.questions,
            statistics: this.statistics,
            config: this.config,
            exported: new Date().toISOString(),
            version: this.config.VERSION
        };

        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'csv':
                return this.exportToCSV(exportData);
            case 'txt':
                return this.exportToText(exportData);
            default:
                throw new Error('Unsupported export format');
        }
    }

    exportToCSV(data) {
        // CSVエクスポートの実装
        let csv = 'ID,Type,Question,Difficulty,Status,Created\n';
        
        Object.keys(data.questions).forEach(type => {
            data.questions[type].forEach(question => {
                csv += `${question.id},${question.type},"${question.text || question.word || ''}",${question.difficulty},${question.status},${question.created}\n`;
            });
        });
        
        return csv;
    }

    exportToText(data) {
        // テキストエクスポートの実装
        let text = `Question Manager Export\n`;
        text += `Generated: ${data.exported}\n`;
        text += `Total Questions: ${data.statistics.totalQuestions}\n\n`;
        
        Object.keys(data.questions).forEach(type => {
            text += `=== ${type} ===\n`;
            data.questions[type].forEach(question => {
                text += `ID: ${question.id}\n`;
                text += `Status: ${question.status}\n`;
                text += `Difficulty: ${question.difficulty}\n`;
                text += `Created: ${question.created}\n\n`;
            });
        });
        
        return text;
    }

    // アクティビティ記録
    recordActivity(action, type, questionId) {
        const activity = {
            action: action,
            type: type,
            questionId: questionId,
            timestamp: new Date().toISOString(),
            user: this.currentUser
        };

        this.statistics.recentActivity.unshift(activity);
        
        // 最近のアクティビティを制限
        if (this.statistics.recentActivity.length > this.config.MAX_RECENT_ITEMS) {
            this.statistics.recentActivity = this.statistics.recentActivity.slice(0, this.config.MAX_RECENT_ITEMS);
        }
        
        this.saveStatistics();
    }

    // 通知機能
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        // 背景色の設定
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // 3秒後に自動削除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // ユーティリティ関数
    generateId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `${type}_${timestamp}_${random}`;
    }

    checkForUpdates() {
        // 更新チェックの実装
        const lastUpdate = localStorage.getItem(this.config.STORAGE_PREFIX + 'last_update_check');
        const now = new Date().toISOString();
        
        if (!lastUpdate || new Date(now) - new Date(lastUpdate) > 24 * 60 * 60 * 1000) {
            // 24時間ごとに更新チェック
            localStorage.setItem(this.config.STORAGE_PREFIX + 'last_update_check', now);
            // ここで実際の更新チェックを実装
        }
    }

    syncData() {
        // データ同期の実装
        // Cloudflare R2や他のバックエンドとの同期
        console.log('Syncing data...');
    }

    // グローバルに公開
    window.qm = this;
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', function() {
    // 設定ファイルの読み込み
    const scripts = [
        '/sys/tools/question-manager/data/config.js',
        '/sys/tools/question-manager/data/question-types.js',
        '/sys/tools/question-manager/data/sample-data.js'
    ];
    
    let loadedCount = 0;
    scripts.forEach(script => {
        const scriptElement = document.createElement('script');
        scriptElement.src = script;
        scriptElement.onload = () => {
            loadedCount++;
            if (loadedCount === scripts.length) {
                // 全ての設定ファイルが読み込まれたらアプリを初期化
                window.app = new QuestionManager();
                
                // サンプルデータがまだない場合は読み込む
                const stats = JSON.parse(localStorage.getItem(window.CONFIG.STORAGE_PREFIX + 'statistics') || '{}');
                if (!stats.sampleDataLoaded) {
                    if (window.loadSampleData) {
                        window.loadSampleData();
                        window.location.reload();
                    }
                }
            }
        };
        scriptElement.onerror = () => {
            console.error('Failed to load script:', script);
        };
        document.head.appendChild(scriptElement);
    });
});