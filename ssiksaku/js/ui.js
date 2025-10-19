// UI management and interactions
class UIManager {
    constructor() {
        this.toastElement = null;
    }

    initialize() {
        this.toastElement = document.getElementById('toast');
        this.setupThemeToggle();
        this.setupSubjectCards();
        this.setupLoginButton();
        this.setupScrollProgress();
        this.setupKeyboardShortcuts();
        this.loadSavedTheme();
    }

    showToast(message, type = 'info') {
        if (!this.toastElement) return;

        this.toastElement.textContent = message;
        this.toastElement.className = `toast ${type}`;

        setTimeout(() => {
            this.toastElement.classList.add('show');
        }, 100);

        setTimeout(() => {
            this.toastElement.classList.remove('show');
        }, 3000);
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupSubjectCards() {
        const subjectCards = document.querySelectorAll('.subject-card');
        subjectCards.forEach(card => {
            card.addEventListener('click', () => {
                const subject = card.getAttribute('data-subject');
                if (card.classList.contains('coming-soon')) {
                    this.showToast('この科目は準備中です', 'info');
                    return;
                }
                if (subject) {
                    this.handleNavigation(subject);
                }
            });
        });
    }

    setupLoginButton() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (window.authManager) {
                    this.showLoginModal();
                }
            });
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (savedTheme === 'reading') {
            document.body.classList.add('reading-mode');
        }
    }

    handleNavigation(subject) {
        const paths = {
            'english': '/english/',
            'math': '/math/',
            'chemistry': '/chemistry/',
            'physics': '/physics/'
        };
        const path = paths[subject];
        if (path) {
            window.location.href = path;
        } else {
            this.showToast('このセクションは準備中です', 'info');
        }
    }

    showLoginModal() {
        const email = prompt('メールアドレスを入力してください:');
        if (email !== null) {
            const result = window.authManager.login(email);
            this.showToast(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                this.showStats();
            }
        }
    }

    showStats() {
        const statsSection = document.getElementById('statsSection');
        if (statsSection) {
            statsSection.style.display = 'grid';
            this.updateStats();
        }
    }

    hideStats() {
        const statsSection = document.getElementById('statsSection');
        if (statsSection) {
            statsSection.style.display = 'none';
        }
    }

    updateStats() {
        if (!window.statsManager) return;
        
        const stats = window.statsManager.getStats();

        const studyDaysEl = document.getElementById('studyDays');
        const totalQuestionsEl = document.getElementById('totalQuestions');
        const accuracyEl = document.getElementById('accuracy');
        const streakEl = document.getElementById('streak');

        if (studyDaysEl) studyDaysEl.textContent = stats.studyDays;
        if (totalQuestionsEl) totalQuestionsEl.textContent = stats.totalQuestions;
        if (accuracyEl) accuracyEl.textContent = `${stats.accuracy}%`;
        if (streakEl) streakEl.textContent = stats.streak;
    }


    setupScrollProgress() {
        const progressFill = document.getElementById('scrollProgressFill');
        if (!progressFill) return;

        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressFill.style.width = `${Math.min(scrolled, 100)}%`;
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 統計表示
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleStats();
            }

            // Ctrl/Cmd + D: テーマ切り替え
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }

            // Esc: モーダルを閉じる
            if (e.key === 'Escape') {
                // 将来的なモーダル対応
                this.closeModals();
            }
        });
    }

    toggleStats() {
        const statsSection = document.getElementById('statsSection');
        if (statsSection) {
            const isVisible = statsSection.style.display === 'grid';
            statsSection.style.display = isVisible ? 'none' : 'grid';
            
            if (!isVisible && window.uiManager) {
                window.uiManager.updateStats();
            }
        }
    }

    closeModals() {
        // 将来的なモーダル対応用
        console.log('Close modals');
    }

    cycleTheme() {
        const body = document.body;
        const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 
                           body.classList.contains('reading-mode') ? 'reading' : 'light';
        
        body.classList.remove('dark-mode', 'reading-mode');
        
        let nextTheme;
        if (currentTheme === 'light') {
            body.classList.add('dark-mode');
            nextTheme = 'dark';
        } else if (currentTheme === 'dark') {
            body.classList.add('reading-mode');
            nextTheme = 'reading';
        } else {
            nextTheme = 'light';
        }
        
        localStorage.setItem('theme', nextTheme);
        this.showToast(`テーマ: ${nextTheme === 'light' ? 'ライト' : nextTheme === 'dark' ? 'ダーク' : 'リーディング'}`, 'info');
    }
}

// Export for module use
export { UIManager };
