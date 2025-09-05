// 超簡易認証システム - sys/izumiyaのみ
class SimpleAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
    }

    checkExistingSession() {
        const session = localStorage.getItem("qm_session");
        if (session === "sys_logged_in") {
            this.currentUser = {
                username: "sys",
                displayName: "管理者",
                role: "admin",
                permissions: ["read", "write", "delete", "manage"]
            };
            
            // ダッシュボード以外ならリダイレクト
            if (!location.pathname.includes("dashboard") && 
                !location.pathname.includes("mobile-creator") &&
                !location.pathname.includes("advanced-editor") &&
                !location.pathname.includes("bulk-import") &&
                !location.pathname.includes("index.html")) {
                location.replace("dashboard.html");
            }
        } else {
            // ログインページ以外ならリダイレクト
            if (!location.pathname.includes("login") && 
                !location.pathname.includes("mobile-creator-standalone")) {
                location.replace("login.html");
            }
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // ログアウトボタン
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logoutBtn, .logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 唯一の管理者アカウントをチェック
        if (username === "sys" && password === "izumiya") {
            this.currentUser = {
                username: "sys",
                displayName: "管理者",
                role: "admin",
                permissions: ["read", "write", "delete", "manage"]
            };
            
            // セッション保存
            localStorage.setItem("qm_session", "sys_logged_in");
            
            // ダッシュボードへリダイレクト
            location.replace("dashboard.html");
        } else {
            this.showAlert('ユーザー名またはパスワードが違います', 'error');
        }
    }

    logout() {
        localStorage.removeItem("qm_session");
        this.currentUser = null;
        location.replace("login.html");
    }

    getCurrentUser() {
        return this.currentUser;
    }

    showAlert(message, type = 'error') {
        const alertDiv = document.getElementById('alertMessage');
        if (alertDiv) {
            alertDiv.textContent = message;
            alertDiv.className = `alert ${type}`;
            alertDiv.style.display = 'block';
            
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 3000);
        }
    }

    // デモモード（互換性のため）
    enableDemoMode() {
        this.currentUser = {
            username: "sys",
            displayName: "管理者",
            role: "admin",
            permissions: ["read", "write", "delete", "manage"]
        };
        localStorage.setItem("qm_session", "sys_logged_in");
    }
}

// グローバルインスタンス作成
window.auth = new SimpleAuth();

// 互換性のため
window.AuthenticationSystem = window.auth;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    // ログインページの初期化
    if (location.pathname.includes('login')) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = 'sys';
            usernameInput.focus();
        }
        
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
                }
            });
        }
    }
});