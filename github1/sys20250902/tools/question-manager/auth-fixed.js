class AuthenticationSystem {
    constructor() {
        this.users = {};
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.loadUsers();
        this.checkExistingSession();
        this.setupEventListeners();
    }

    async loadUsers() {
        try {
            const response = await fetch('users.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            this.users = await response.json();
            console.log("ユーザー情報を読み込みました。");
        } catch (error) {
            console.error('ユーザー情報の読み込みに失敗しました:', error);
            // デフォルトユーザーを設定
            this.users = {
                "demo": {
                    "password": "demo",
                    "role": "admin",
                    "permissions": ["read", "write", "delete", "manage_users"],
                    "displayName": "デモユーザー",
                    "email": "demo@example.com"
                }
            };
        }
    }

    checkExistingSession() {
        const sessionStr = localStorage.getItem("question_manager_session");
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                const now = Date.now();

                const isValid =
                    session?.expires > now &&
                    session?.user?.role === "admin";

                if (isValid) {
                    this.currentUser = session.user;
                    // リダイレクトを条件付きに
                    if (!location.pathname.includes("dashboard") && 
                        !location.pathname.includes("mobile-creator") &&
                        !location.pathname.includes("advanced-editor") &&
                        !location.pathname.includes("bulk-import")) {
                        location.replace("dashboard.html");
                    }
                    return;
                }
            } catch (e) {
                console.error("Session parse error:", e);
            }
        }

        // セッションがない場合、ログインページへ（ただしスタンドアロン版は除く）
        if (!location.pathname.includes("login") && 
            !location.pathname.includes("mobile-creator-standalone") &&
            !location.pathname.includes("index.html")) {
            location.replace("login.html");
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

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showAlert('ユーザー名とパスワードを入力してください', 'error');
            return;
        }

        const user = this.users[username];
        if (user && user.password === password) {
            // セッション作成
            const session = {
                user: {
                    username: username,
                    role: user.role,
                    permissions: user.permissions,
                    displayName: user.displayName
                },
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24時間
            };

            localStorage.setItem("question_manager_session", JSON.stringify(session));
            this.currentUser = session.user;
            
            this.showAlert('ログインしました', 'success');
            
            // リダイレクト
            setTimeout(() => {
                location.replace("dashboard.html");
            }, 1000);
        } else {
            this.showAlert('ユーザー名またはパスワードが違います', 'error');
        }
    }

    logout() {
        localStorage.removeItem("question_manager_session");
        this.currentUser = null;
        location.replace("login.html");
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(permission) {
        return this.currentUser?.permissions?.includes(permission) || false;
    }

    showAlert(message, type = 'info') {
        // 既存のshowAlert関数があればそれを使う
        if (typeof showAlert === 'function') {
            showAlert(message, type);
        } else {
            alert(message);
        }
    }

    // デモモード用の簡易ログイン
    enableDemoMode() {
        const demoUser = {
            username: "demo",
            role: "admin",
            permissions: ["read", "write", "delete", "manage_users"],
            displayName: "デモユーザー"
        };
        
        const session = {
            user: demoUser,
            expires: Date.now() + (24 * 60 * 60 * 1000)
        };

        localStorage.setItem("question_manager_session", JSON.stringify(session));
        this.currentUser = demoUser;
        
        window.location.reload();
    }
}

// グローバルインスタンス
let authSystem = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthenticationSystem();
    window.auth = authSystem;
});

// ユーティリティ関数
function requireAuth() {
    if (!authSystem || !authSystem.getCurrentUser()) {
        location.replace("login.html");
        return false;
    }
    return true;
}

function requirePermission(permission) {
    if (!requireAuth()) return false;
    if (!authSystem.hasPermission(permission)) {
        showAlert('この操作には権限が必要です', 'error');
        return false;
    }
    return true;
}