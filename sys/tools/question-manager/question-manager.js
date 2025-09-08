class QuestionManager {
    constructor() {
        this.questions = [];
        this.filteredQuestions = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.config = null;
        this.currentUser = null;
        this.checkAuthentication();
    }

    checkAuthentication() {
        this.currentUser = AuthenticationSystem.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        this.loadUserInfo();
        this.init();
    }

    loadUserInfo() {
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userAvatar = document.getElementById('userAvatar');
        if (userName) userName.textContent = this.currentUser.displayName;
        if (userRole) userRole.textContent = this.getRoleDisplayName(this.currentUser.role);
        if (userAvatar) userAvatar.textContent = this.currentUser.displayName.charAt(0);
    }

    getRoleDisplayName(role) {
        const roleNames = { admin: '管理者', teacher: '教師' };
        return roleNames[role] || role;
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadAllQuestions();
            this.setupEventListeners();
            this.renderInterface();
            this.updateStats();
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showError('システムの初期化に失敗しました');
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/tools/question-manager/config.json');
            this.config = await response.json();
            console.log('設定を読み込みました:', this.config);
        } catch {
            // フォールバック設定
            this.config = {
                categories: {
                    subjects: [
                        { id: 'math', name: '数学', icon: '🔢' },
                        { id: 'english', name: '英語', icon: '🇺🇸' }
                    ],
                    formats: [
                        { id: 'A1', name: '4択問題' },
                        { id: 'F1', name: '分数入力' },
                        { id: 'F2', name: '自由記述' }
                    ],
                    difficulties: [
                        { level: 1, name: '基礎', color: '#22c55e' },
                        { level: 2, name: '標準', color: '#3b82f6' },
                        { level: 3, name: '応用', color: '#f59e0b' }
                    ]
                }
            };
        }
    }

    async loadAllQuestions() {
        const questionFiles = [
            '/data/questions/quiz-choice-questions.json',
            '/data/questions/quiz-f1-questions.json',
            '/data/questions/quiz-f2-questions.json'
        ];
        this.questions = [];
        for (const file of questionFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const questions = await response.json();
                    this.questions.push(...questions);
                }
            } catch (error) {
                console.warn(`ファイル読み込み失敗: ${file}`, error);
            }
        }
        this.filteredQuestions = [...this.questions];
        console.log(`${this.questions.length}問の問題を読み込みました`);
    }

    setupEventListeners() {
        document.getElementById('searchInput')?.addEventListener('input', () => this.filterQuestions());
        document.getElementById('subjectFilter')?.addEventListener('change', () => this.filterQuestions());
        document.getElementById('formatFilter')?.addEventListener('change', () => this.filterQuestions());
        document.getElementById('sortBy')?.addEventListener('change', () => this.sortQuestions());
    }

    renderInterface() {
        this.renderFilters();
        this.renderQuestionList();
        this.renderPagination();
    }

    renderFilters() {
        // 科目
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter && this.config.categories.subjects) {
            subjectFilter.innerHTML = '<option value="">すべての科目</option>';
            this.config.categories.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = `${subject.icon} ${subject.name}`;
                subjectFilter.appendChild(option);
            });
        }
        // 形式
        const formatFilter = document.getElementById('formatFilter');
        if (formatFilter && this.config.categories.formats) {
            formatFilter.innerHTML = '<option value="">すべての形式</option>';
            this.config.categories.formats.forEach(format => {
                const option = document.createElement('option');
                option.value = format.id;
                option.textContent = format.name;
                formatFilter.appendChild(option);
            });
        }
        // 難易度チェックボックス
        const difficultyFilters = document.getElementById('difficultyFilters');
        if (difficultyFilters && this.config.categories.difficulties) {
            difficultyFilters.innerHTML = '';
            this.config.categories.difficulties.forEach(diff => {
                const label = document.createElement('label');
                label.className = 'checkbox-item';
                label.innerHTML = `
                    <input type="checkbox" value="${diff.level}">
                    <span class="question-difficulty difficulty-${diff.level}"></span>
                    ${diff.name}
                `;
                label.addEventListener('change', () => this.filterQuestions());
                difficultyFilters.appendChild(label);
            });
        }
    }

    renderQuestionList() {
        const container = document.getElementById('questionItems');
        if (!container) return;
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.filteredQuestions.slice(start, end);
        if (pageItems.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #6b7280;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                    <div>問題が見つかりません</div>
                </div>
            `;
            return;
        }
        container.innerHTML = pageItems.map(q => this.renderQuestionItem(q)).join('');
    }

    renderQuestionItem(question) {
        // いつでもクリックして編集（管理者のみログイン可能のため）
        const clickAction = `editQuestion('${question.id}')`;
        return `
            <div class="question-item" onclick="${clickAction}">
                <div class="question-meta">
                    <span class="question-id">${question.id}</span>
                    <span class="question-format">${question.answerFormat || 'N/A'}</span>
                    <span class="question-difficulty difficulty-${question.difficulty}"></span>
                    <span style="font-size: 12px; color: #6b7280;">${this.getSubjectName(question.subject)}</span>
                </div>
                <div class="question-text">${this.truncateText((question.questionContent?.text || question.question || ''), 100)}</div>
                <div class="question-topic">${question.topic || ''}</div>
            </div>
        `;
    }

    filterQuestions() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const subjectFilter = document.getElementById('subjectFilter')?.value || '';
        const formatFilter = document.getElementById('formatFilter')?.value || '';
        const difficultyCheckboxes = document.querySelectorAll('#difficultyFilters input:checked');
        const selectedDifficulties = Array.from(difficultyCheckboxes).map(cb => parseInt(cb.value));

        this.filteredQuestions = this.questions.filter(question => {
            const text = (question.questionContent?.text || question.question || '').toLowerCase();
            const matchesSearch = !searchTerm ||
                text.includes(searchTerm) ||
                question.id.toLowerCase().includes(searchTerm) ||
                (question.tags && question.tags.some(tag => (tag || '').toLowerCase().includes(searchTerm)));
            const matchesSubject = !subjectFilter || question.subject === subjectFilter;
            const matchesFormat = !formatFilter || question.answerFormat === formatFilter;
            const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(question.difficulty);
            return matchesSearch && matchesSubject && matchesFormat && matchesDifficulty;
        });

        this.currentPage = 1;
        this.renderQuestionList();
        this.renderPagination();
        this.updateStats();
    }

    sortQuestions() {
        const sortBy = document.getElementById('sortBy')?.value || 'id';
        this.filteredQuestions.sort((a, b) => {
            switch (sortBy) {
                case 'subject': return (a.subject || '').localeCompare(b.subject || '');
                case 'difficulty': return a.difficulty - b.difficulty;
                case 'updated': return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                default: return a.id.localeCompare(b.id);
            }
        });
        this.renderQuestionList();
    }

    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;
        const totalPages = Math.ceil(this.filteredQuestions.length / this.itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        let pagination = '<div class="actions">';
        if (this.currentPage > 1) {
            pagination += `<button class="btn btn-secondary" onclick="questionManager.goToPage(${this.currentPage - 1})">前へ</button>`;
        }
        pagination += `<span style="margin: 0 15px;">Page ${this.currentPage} of ${totalPages}</span>`;
        if (this.currentPage < totalPages) {
            pagination += `<button class="btn btn-secondary" onclick="questionManager.goToPage(${this.currentPage + 1})">次へ</button>`;
        }
        pagination += '</div>';
        container.innerHTML = pagination;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderQuestionList();
        this.renderPagination();
    }

    updateStats() {
        const totalEl = document.getElementById('totalQuestions');
        const activeEl = document.getElementById('activeQuestions');
        const subjectsEl = document.getElementById('subjects');
        if (totalEl) totalEl.textContent = this.questions.length;
        if (activeEl) activeEl.textContent = this.questions.filter(q => q.active !== false).length;
        if (subjectsEl) {
            const subjects = new Set(this.questions.map(q => q.subject));
            subjectsEl.textContent = subjects.size;
        }
    }

    getSubjectName(subjectId) {
        const subject = this.config.categories.subjects.find(s => s.id === subjectId);
        return subject ? `${subject.icon} ${subject.name}` : subjectId;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    showError(message) {
        console.error(message);
        const container = document.getElementById('questionItems');
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #ef4444;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div>${message}</div>
                    <div style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                        <p>考えられる原因:</p>
                        <ul style="text-align: left; margin: 10px 0;">
                            <li>データファイルが見つからない</li>
                            <li>ネットワーク接続に問題がある</li>
                            <li>権限が不足している</li>
                        </ul>
                        <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 15px;">
                            🔄 再読み込み
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // 現在のフィルタ結果を取得
    getFilteredQuestions() {
        return this.filteredQuestions ?? [];
    }
}

// グローバル関数（権限チェックは削除）
let questionManager;

function createQuestion() {
    window.open('advanced-editor.html', '_blank');
}

function importQuestions() {
    window.open('bulk-import.html', '_blank', 'width=1000,height=800');
}

function exportQuestions() {
    try {
        const allQuestions = questionManager.questions || [];
        const filteredQuestions = questionManager.getFilteredQuestions();
        const difficultyCheckboxes = document.querySelectorAll('#difficultyFilters input:checked');
        const selectedDifficulties = Array.from(difficultyCheckboxes).map(cb => parseInt(cb.value));
        const exportData = {
            exportDate: new Date().toISOString(),
            totalQuestions: allQuestions.length,
            exportedQuestions: filteredQuestions.length,
            filters: {
                search: document.getElementById('searchInput')?.value || '',
                subject: document.getElementById('subjectFilter')?.value || '',
                difficulties: selectedDifficulties,
                format: document.getElementById('formatFilter')?.value || ''
            },
            questions: filteredQuestions
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questions-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📤 ${filteredQuestions.length}件の問題をエクスポートしました`, 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('エクスポートに失敗しました', 'error');
    }
}

function validateAll() {
    try {
        const questions = questionManager.questions || [];
        const issues = [];
        questions.forEach((question, index) => {
            if (!question.id) issues.push(`問題 ${index + 1}: IDが未設定`);
            if (!question.questionContent?.text && !question.question) issues.push(`問題 ${question.id || index + 1}: 問題文が未入力`);
            if (!question.explanation?.text) issues.push(`問題 ${question.id || index + 1}: 解説が未入力`);
            if (['A1', 'A2', 'A3'].includes(question.answerFormat)) {
                if (!question.answerData?.choices || question.answerData.choices.length < 2) issues.push(`問題 ${question.id || index + 1}: 選択肢が不足`);
                if (!question.answerData?.correctAnswers || question.answerData.correctAnswers.length === 0) issues.push(`問題 ${question.id || index + 1}: 正解が未設定`);
            }
            const duplicates = questions.filter(q => q.id === question.id);
            if (duplicates.length > 1) issues.push(`問題 ${question.id}: IDが重複`);
        });
        if (issues.length === 0) {
            alert(`✅ 検証完了\n\n${questions.length}件の問題に問題はありませんでした。`);
        } else {
            alert(`⚠️ 検証結果\n\n${issues.length}件の問題が見つかりました:\n\n${issues.slice(0, 10).join('\n')}${issues.length > 10 ? '\n\n...他' + (issues.length - 10) + '件' : ''}`);
        }
        showToast(`🔍 ${questions.length}件の問題を検証しました`, issues.length === 0 ? 'success' : 'warning');
    } catch (error) {
        console.error('Validation failed:', error);
        alert('検証処理中にエラーが発生しました');
    }
}

function backupData() {
    try {
        const questions = questionManager.questions || [];
        const users = JSON.parse(localStorage.getItem('system_users') || '[]');
        const accessLog = JSON.parse(localStorage.getItem('access_log') || '[]');
        const mobileQuestions = JSON.parse(localStorage.getItem('mobile_questions') || '[]');
        const backupData = {
            backupDate: new Date().toISOString(),
            version: '1.0',
            data: {
                questions,
                mobileQuestions,
                users: users.map(user => ({
                    id: user.id,
                    displayName: user.displayName,
                    role: user.role,
                    permissions: user.permissions,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    isActive: user.isActive
                })),
                accessLog: accessLog.slice(-100),
                statistics: {
                    totalQuestions: questions.length,
                    totalUsers: users.length,
                    lastBackup: new Date().toISOString()
                }
            }
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
        history.push({ date: new Date().toISOString(), questionsCount: questions.length, usersCount: users.length });
        localStorage.setItem('backup_history', JSON.stringify(history.slice(-10)));
        showToast('💾 システムデータをバックアップしました', 'success');
    } catch (error) {
        console.error('Backup failed:', error);
        showToast('バックアップに失敗しました', 'error');
    }
}

function editQuestion(id) {
    const url = `advanced-editor.html?id=${id}`;
    window.open(url, '_blank');
}

function closeModal() {
    document.getElementById('questionModal')?.classList.remove('active');
}

// トースト通知
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#22c55e'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        transform: translateX(100px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.transform = 'translateX(0)'), 100);
    setTimeout(() => {
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    questionManager = new QuestionManager();
});
