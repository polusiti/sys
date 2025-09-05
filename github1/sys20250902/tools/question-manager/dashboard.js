class Dashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {
            totalQuestions: 0,
            activeUsers: 0,
            todayCreated: 0,
            averageDifficulty: 0
        };
        document.addEventListener("keydown", (e) => this.onKeyDown(e));
        this.init();
    }

    init() {
        this.checkAuthentication();
        if (!this.currentUser) return;
        this.loadUserInfo();
        this.loadStatistics();
        this.loadRecentActivity();
    }

    // 管理者セッション以外は即ログアウト（ゲスト表示を根本排除）
    checkAuthentication() {
        const user = window.auth?.getCurrentUser() || AuthenticationSystem?.getCurrentUser();
        if (!user || user.role !== "admin") {
            if (window.auth?.logout) {
                window.auth.logout();
            } else if (AuthenticationSystem?.logout) {
                AuthenticationSystem.logout();
            }
            return;
        }
        this.currentUser = user;
    }

    loadUserInfo() {
        const userName = document.getElementById("userName");
        const userRole = document.getElementById("userRole");
        const userAvatar = document.getElementById("userAvatar");

        if (userName) userName.textContent = this.currentUser.displayName || "管理者";
        if (userRole) userRole.textContent = "管理者";
        if (userAvatar) userAvatar.textContent = (this.currentUser.displayName || "管").charAt(0);
    }

    async loadStatistics() {
        try {
            const questions = await this.loadAllQuestions();
            this.stats.totalQuestions = questions.length;
            this.stats.activeUsers = this.getActiveUsersCount();
            this.stats.todayCreated = this.getTodayCreatedCount(questions);
            this.stats.averageDifficulty = this.calculateAverageDifficulty(questions);
            this.updateStatisticsDisplay();
        } catch (e) {
            console.error("Failed to load statistics:", e);
            this.setDefaultStatistics();
        }
    }

    async loadAllQuestions() {
        const files = [
            "/data/questions/quiz-choice-questions.json",
            "/data/questions/quiz-f1-questions.json",
            "/data/questions/quiz-f2-questions.json"
        ];
        const all = [];
        for (const f of files) {
            try {
                const res = await fetch(f);
                if (res.ok) all.push(...(await res.json()));
            } catch (e) {
                console.warn(`Failed to load ${f}:`, e);
            }
        }
        return all;
    }

    getActiveUsersCount() {
        const accessLog = JSON.parse(localStorage.getItem("access_log") || "[]");
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recent = new Set();
        accessLog.forEach((log) => {
            const t = new Date(log.time).getTime();
            if (t > oneDayAgo) recent.add(log.user);
        });
        return recent.size;
    }

    getTodayCreatedCount(questions) {
        const today = new Date().toDateString();
        return questions.filter((q) => {
            const created = new Date(q.metadata?.createdAt || 0).toDateString();
            return created === today;
        }).length;
    }

    calculateAverageDifficulty(questions) {
        if (!questions.length) return 0;
        const total = questions.reduce((s, q) => s + (q.difficulty || 1), 0);
        return (total / questions.length).toFixed(1);
    }

    updateStatisticsDisplay() {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        set("totalQuestions", this.stats.totalQuestions);
        set("activeUsers", this.stats.activeUsers);
        set("todayCreated", this.stats.todayCreated);
        set("averageDifficulty", this.stats.averageDifficulty);
    }

    setDefaultStatistics() {
        this.stats = { totalQuestions: 0, activeUsers: 0, todayCreated: 0, averageDifficulty: 0 };
        this.updateStatisticsDisplay();
    }

    loadRecentActivity() {
        const activityList = document.getElementById("recentActivity");
        if (!activityList) return;

        const accessLog = JSON.parse(localStorage.getItem("access_log") || "[]");
        if (!accessLog.length) return;

        const recent = accessLog.slice(-3).reverse();
        activityList.innerHTML = recent
            .map((log) => {
                const timeAgo = this.getTimeAgo(new Date(log.time));
                return `
                    <li>
                        <span>🔐 ${log.user}がログイン</span>
                        <span class="activity-time">${timeAgo}</span>
                    </li>
                `;
            })
            .join("");
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const mins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (mins < 1) return "今";
        if (mins < 60) return `${mins}分前`;
        if (hours < 24) return `${hours}時間前`;
        return `${days}日前`;
    }

    onKeyDown(e) {
        if (!(e.ctrlKey || e.metaKey)) return;
        switch (e.key) {
            case "n":
                e.preventDefault();
                this.openQuestionEditor();
                break;
            case "f":
                e.preventDefault();
                this.openQuestionManager();
                break;
            case "q":
                e.preventDefault();
                this.logout();
                break;
        }
    }

    // ナビゲーション
    openMobileCreator() {
        location.href = "mobile-creator.html";
    }
    openQuestionEditor() {
        window.open("advanced-editor.html", "_blank");
    }
    openQuestionManager() {
        location.href = "index.html";
    }
    openBulkImport() {
        window.open("bulk-import.html", "_blank", "width=1000,height=800");
    }
    openQuizTest() {
        window.open("../quiz/index.html", "_blank");
    }
    openAnalytics() {
        window.open("analytics.html", "_blank");
    }
    openUserManagement() {
        window.open("user-management.html", "_blank");
    }
    openEnhancedDashboard() {
        location.href = "enhanced-dashboard.html";
    }

    logout() {
        if (confirm("ログアウトしますか？")) {
            AuthenticationSystem.logout();
        }
    }
}

// グローバル関数（HTMLから呼ばれるハンドラ）
let dashboard;
document.addEventListener("DOMContentLoaded", () => {
    dashboard = new Dashboard();
});
function openMobileCreator() { dashboard?.openMobileCreator(); }
function openQuestionEditor() { dashboard?.openQuestionEditor(); }
function openQuestionManager() { dashboard?.openQuestionManager(); }
function openBulkImport() { dashboard?.openBulkImport(); }
function openQuizTest() { dashboard?.openQuizTest(); }
function openAnalytics() { dashboard?.openAnalytics(); }
function openUserManagement() { dashboard?.openUserManagement(); }
function logout() { dashboard?.logout(); }
