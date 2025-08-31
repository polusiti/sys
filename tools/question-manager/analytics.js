// 統計・分析システム
class QuestionAnalytics {
    constructor() {
        this.currentUser = null;
        this.checkAuth();
        this.init();
    }

    checkAuth() {
        this.currentUser = AuthenticationSystem.getCurrentUser();
        if (!this.currentUser || !this.currentUser.permissions.includes('read')) {
            window.location.href = 'login';
            return;
        }
    }

    async init() {
        await this.loadAnalyticsData();
        this.setupEventListeners();
    }

    async loadAnalyticsData() {
        try {
            const questions = await this.loadAllQuestions();
            const userActivity = this.getUserActivity();
            
            this.displayMetrics(questions, userActivity);
            this.displayRecentQuestions(questions);
            
        } catch (error) {
            console.error('Analytics data loading failed:', error);
            this.displayErrorState();
        }
    }

    async loadAllQuestions() {
        // IndexedDBから問題データを取得
        if (window.questionDB) {
            return await window.questionDB.getAllQuestions();
        }
        
        // フォールバック: LocalStorageから取得
        const localQuestions = JSON.parse(localStorage.getItem('mobile_questions') || '[]');
        
        // JSONファイルからも読み込み
        const questionFiles = [
            '/data/questions/quiz-choice-questions.json',
            '/data/questions/quiz-f1-questions.json', 
            '/data/questions/quiz-f2-questions.json'
        ];

        const allQuestions = [...localQuestions];
        
        for (const file of questionFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const questions = await response.json();
                    allQuestions.push(...questions);
                }
            } catch (error) {
                console.warn(`Failed to load ${file}:`, error);
            }
        }
        
        return allQuestions;
    }

    getUserActivity() {
        const accessLog = JSON.parse(localStorage.getItem('access_log') || '[]');
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        return accessLog.filter(log => {
            const logTime = new Date(log.time);
            return logTime > thirtyDaysAgo;
        });
    }

    displayMetrics(questions, userActivity) {
        // 総問題数
        document.getElementById('totalQuestions').textContent = questions.length;
        
        // アクティブユーザー数（過去30日）
        const uniqueUsers = new Set(userActivity.map(log => log.user));
        document.getElementById('activeUsers').textContent = uniqueUsers.size;
        
        // 作成効率（問題/日）
        const recentQuestions = questions.filter(q => {
            if (!q.metadata?.createdAt) return false;
            const createdDate = new Date(q.metadata.createdAt);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return createdDate > thirtyDaysAgo;
        });
        
        const creationRate = (recentQuestions.length / 30).toFixed(1);
        document.getElementById('creationRate').textContent = creationRate;
        
        // 平均難易度
        const totalDifficulty = questions.reduce((sum, q) => sum + (q.difficulty || 2), 0);
        const averageDifficulty = questions.length > 0 ? 
            (totalDifficulty / questions.length).toFixed(1) : '0.0';
        document.getElementById('averageDifficulty').textContent = averageDifficulty;
        
        // トレンド表示を更新
        this.updateTrends(questions, userActivity);
    }

    updateTrends(questions, userActivity) {
        // 前月との比較データを計算
        const now = new Date();
        const thisMonth = questions.filter(q => {
            if (!q.metadata?.createdAt) return false;
            const createdDate = new Date(q.metadata.createdAt);
            return createdDate.getMonth() === now.getMonth();
        });
        
        const lastMonth = questions.filter(q => {
            if (!q.metadata?.createdAt) return false;
            const createdDate = new Date(q.metadata.createdAt);
            return createdDate.getMonth() === now.getMonth() - 1;
        });
        
        const questionGrowth = lastMonth.length > 0 ? 
            (((thisMonth.length - lastMonth.length) / lastMonth.length) * 100).toFixed(0) : 0;
        
        // トレンド表示を更新
        const questionsTrend = document.getElementById('questionsTrend');
        if (questionGrowth > 0) {
            questionsTrend.textContent = `↗ 前月比 +${questionGrowth}%`;
            questionsTrend.className = 'trend-indicator trend-up';
        } else if (questionGrowth < 0) {
            questionsTrend.textContent = `↘ 前月比 ${questionGrowth}%`;
            questionsTrend.className = 'trend-indicator trend-down';
        } else {
            questionsTrend.textContent = '→ 前月と同等';
            questionsTrend.className = 'trend-indicator';
        }
    }

    displayRecentQuestions(questions) {
        const tbody = document.getElementById('questionsTableBody');
        const recentQuestions = questions
            .filter(q => q.metadata?.createdAt)
            .sort((a, b) => new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt))
            .slice(0, 20);

        if (recentQuestions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280;">
                        問題データがありません
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentQuestions.map(question => {
            const createdDate = new Date(question.metadata.createdAt).toLocaleDateString('ja-JP');
            const difficulty = question.difficulty || 2;
            const device = this.getDeviceFromMetadata(question);
            
            return `
                <tr>
                    <td><code>${question.id || 'N/A'}</code></td>
                    <td>${this.getSubjectName(question.subject)}</td>
                    <td><span class="difficulty-badge diff-${difficulty}">★${difficulty}</span></td>
                    <td>${createdDate}</td>
                    <td>${question.metadata.createdBy || 'システム'}</td>
                    <td>${device}</td>
                </tr>
            `;
        }).join('');
    }

    getSubjectName(subject) {
        const subjects = {
            'math': '数学',
            'english': '英語', 
            'science': '理科',
            'general': 'その他'
        };
        return subjects[subject] || subject || '不明';
    }

    getDeviceFromMetadata(question) {
        if (question.metadata?.template) {
            return '📱 スマホ';
        }
        if (question.metadata?.createdBy === 'mobile') {
            return '📱 スマホ';
        }
        return '💻 PC';
    }

    displayErrorState() {
        document.getElementById('totalQuestions').textContent = 'エラー';
        document.getElementById('activeUsers').textContent = 'エラー';
        document.getElementById('creationRate').textContent = 'エラー';
        document.getElementById('averageDifficulty').textContent = 'エラー';
        
        const tbody = document.getElementById('questionsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #ef4444;">
                    データの読み込みに失敗しました
                </td>
            </tr>
        `;
    }

    setupEventListeners() {
        // 自動更新（5分ごと）
        setInterval(() => {
            this.loadAnalyticsData();
        }, 5 * 60 * 1000);
    }

    // エクスポート機能
    exportAnalytics() {
        const data = {
            exportDate: new Date().toISOString(),
            totalQuestions: document.getElementById('totalQuestions').textContent,
            activeUsers: document.getElementById('activeUsers').textContent,
            creationRate: document.getElementById('creationRate').textContent,
            averageDifficulty: document.getElementById('averageDifficulty').textContent
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new QuestionAnalytics();
});

// グローバル関数
function exportAnalytics() {
    if (window.analytics) {
        window.analytics.exportAnalytics();
    }
}