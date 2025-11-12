/**
 * Admin Dashboard Controller
 * 管理者ダッシュボード (/mana)
 */

class AdminDashboard {
    constructor() {
        this.isAuthenticated = false;
        this.dashboardData = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthentication();
    }

    setupEventListeners() {
        // 認証
        document.getElementById('auth-btn').addEventListener('click', () => {
            this.authenticate();
        });

        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.authenticate();
            }
        });

        // 更新ボタン
        document.getElementById('refresh-stats-btn').addEventListener('click', () => {
            this.loadDashboardData();
        });

        // クイックアクション
        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            window.location.href = '/pages/question-management.html';
        });
    }

    async checkAuthentication() {
        // ローカルストレージに認証情報があるかチェック
        const authData = localStorage.getItem('admin_auth');
        if (authData) {
            try {
                const { timestamp } = JSON.parse(authData);
                // 24時間以内なら認証済みとみなす
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    this.isAuthenticated = true;
                    this.showDashboard();
                    return;
                }
            } catch (e) {
                localStorage.removeItem('admin_auth');
            }
        }

        this.showAuthentication();
    }

    showAuthentication() {
        document.getElementById('auth-check').style.display = 'flex';
        document.getElementById('dashboard-content').style.display = 'none';
        document.getElementById('admin-pass').focus();
    }

    showDashboard() {
        document.getElementById('auth-check').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'block';
        this.loadDashboardData();
    }

    authenticate() {
        const adminId = document.getElementById('admin-id').value;
        const password = document.getElementById('admin-pass').value;
        const errorElement = document.getElementById('auth-error');

        // 固定の認証情報（実際の実装時はより安全な方法を使用）
        const VALID_CREDENTIALS = [
            { id: 'P37600', password: 'コードギアス' }
        ];

        const isValid = VALID_CREDENTIALS.some(cred =>
            cred.id === adminId && cred.password === password
        );

        if (isValid) {
            this.isAuthenticated = true;
            localStorage.setItem('admin_auth', JSON.stringify({
                id: adminId,
                timestamp: Date.now()
            }));
            this.showDashboard();
        } else {
            errorElement.textContent = 'IDまたはパスワードが間違っています';
            errorElement.style.display = 'block';
            document.getElementById('admin-pass').value = '';
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);

            const response = await fetch('/api/admin/mana');
            const data = await response.json();

            if (data.success) {
                this.dashboardData = data.dashboard;
                this.renderDashboard(data.dashboard);
            } else {
                throw new Error(data.error || 'データの読み込みに失敗しました');
            }
        } catch (error) {
            this.showError('ダッシュボードデータの読み込みに失敗しました: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderDashboard(data) {
        this.renderStats(data.statistics);
        this.renderSubjectStats(data.subjectStats);
        this.renderRecentQuestions(data.recentQuestions);
    }

    renderStats(stats) {
        document.getElementById('total-questions').textContent = stats.total_questions.toLocaleString();
        document.getElementById('pending-questions').textContent = stats.pending_questions.toLocaleString();
        document.getElementById('approved-questions').textContent = stats.approved_questions.toLocaleString();
        document.getElementById('avg-difficulty').textContent = (stats.avg_difficulty || 0).toFixed(1);
    }

    renderSubjectStats(subjectStats) {
        const container = document.getElementById('subject-stats-grid');
        const subjectNames = {
            'english_grammar': '英文法',
            'english_vocab': '英単語',
            'english_listening': 'リスニング',
            'english_reading': 'リーディング',
            'english_writing': '英作文',
            'math': '数学',
            'physics': '物理',
            'chemistry': '化学'
        };

        container.innerHTML = subjectStats.map(stat => `
            <div class="subject-stat-card">
                <h3>${subjectNames[stat.subject] || stat.subject}</h3>
                <div class="subject-stat-value">${stat.count.toLocaleString()}</div>
                <div class="subject-stat-detail">
                    平均難易度: ${(stat.avg_difficulty || 0).toFixed(1)}
                </div>
            </div>
        `).join('');
    }

    renderRecentQuestions(questions) {
        const container = document.getElementById('recent-questions-list');
        const typeNames = {
            'multiple_choice': '選択問題',
            'fill_in_blank': '穴埋め問題',
            'short_answer': '記述問題',
            'translation': '翻訳問題',
            'transcription': '書き取り',
            'error_correction': '誤り訂正'
        };

        const statusNames = {
            'pending': '承認待ち',
            'approved': '承認済み',
            'rejected': '却下',
            'needs_revision': '要修正'
        };

        if (questions.length === 0) {
            container.innerHTML = '<p class="no-data">最近の問題がありません</p>';
            return;
        }

        container.innerHTML = questions.map(question => `
            <div class="recent-question-card">
                <div class="recent-question-header">
                    <div class="recent-question-id">${question.id}</div>
                    <div class="recent-question-meta">
                        <span class="question-type">${typeNames[question.type] || question.type}</span>
                        <span class="validation-status status-${question.validation_status}">
                            ${statusNames[question.validation_status] || question.validation_status}
                        </span>
                    </div>
                </div>
                <div class="recent-question-content">
                    <p class="recent-question-text">${this.truncateText(question.question_text, 80)}</p>
                    <div class="recent-question-footer">
                        <span class="creation-date">${this.formatDate(question.created_at)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async exportAllData() {
        try {
            this.showLoading(true);

            const response = await fetch('/api/questions/export?format=json');
            if (!response.ok) throw new Error('エクスポートに失敗しました');

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `all_questions_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);

            this.showSuccess('データをエクスポートしました');
        } catch (error) {
            this.showError('エクスポートに失敗しました: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoading(show) {
        const button = document.getElementById('refresh-stats-btn');
        if (show) {
            button.disabled = true;
            button.innerHTML = '<span class="icon">⏳</span>読み込み中...';
        } else {
            button.disabled = false;
            button.innerHTML = '<span class="icon">🔄</span>更新';
        }
    }

    showError(message) {
        alert('エラー: ' + message);
    }

    showSuccess(message) {
        alert('成功: ' + message);
    }
}

// スタイル追加
const additionalStyles = `
<style>
.admin-dashboard {
    min-height: 100vh;
    background: #f8fafc;
}

.auth-check {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 100%;
    text-align: center;
}

.auth-content h2 {
    margin-top: 0;
    color: #1e293b;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
}

.auth-form input {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 1rem;
}

.dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.stats-section, .subject-stats-section, .recent-questions-section, .quick-actions-section {
    margin-bottom: 2rem;
}

.stats-section h2, .subject-stats-section h2, .recent-questions-section h2, .quick-actions-section h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #1e293b;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.subject-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.subject-stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    text-align: center;
}

.subject-stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2563eb;
    margin: 0.5rem 0;
}

.subject-stat-detail {
    font-size: 0.875rem;
    color: #64748b;
}

.quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.action-card {
    display: block;
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    cursor: pointer;
}

.action-card:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
    transform: translateY(-1px);
}

.action-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.action-card h3 {
    margin: 0.5rem 0;
    color: #1e293b;
}

.action-card p {
    margin: 0;
    color: #64748b;
    font-size: 0.875rem;
}

.recent-questions-list {
    display: grid;
    gap: 1rem;
}

.recent-question-card {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.recent-question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.recent-question-id {
    font-family: monospace;
    font-size: 0.875rem;
    color: #64748b;
}

.recent-question-meta {
    display: flex;
    gap: 0.5rem;
}

.question-type {
    background: #f1f5f9;
    color: #334155;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
}

.recent-question-text {
    margin: 0.5rem 0;
    color: #1e293b;
    line-height: 1.5;
}

.recent-question-footer {
    display: flex;
    justify-content: flex-end;
}

.creation-date {
    font-size: 0.875rem;
    color: #64748b;
}

.no-data {
    text-align: center;
    color: #64748b;
    padding: 2rem;
}
</style>
`;

// スタイルをDOMに追加
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});