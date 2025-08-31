class AuthenticationSystem {
    constructor() {
        // 管理者のみ許可 (sys / izumiya)
        this.users = {
            "sys": {
                password: "izumiya",
                role: "admin",
                permissions: ["read", "write", "delete", "manage_users"],
                displayName: "管理者",
                email: "admin@example.com"
            }
        };
        
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
    }

    checkExistingSession() {
        const sessionData = localStorage.getItem("question_manager_session");
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                if (session.expires > now) {
                    this.currentUser = session.user;
                    // セッション有効時はダッシュボードにリダイレクト
                    if (!window.location.pathname.includes("dashboard")) {
                        window.location.replace("dashboard.html");
                    }
                    return;
                }
            } catch (e) {
                console.error("Session data corrupted:", e);
            }
        }
        localStorage.removeItem("question_manager_session");
        
        // ログインページ以外はログインページにリダイレクト
        if (!window.location.pathname.includes("login")) {
            window.location.replace("login.html");
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // リアルタイム入力検証
        const usernameField = document.getElementById("username");
        const passwordField = document.getElementById("password");
        
        if (usernameField) {
            usernameField.addEventListener("input", (e) => {
                this.clearError("username");
                this.validateField("username", e.target.value);
            });
        }

        if (passwordField) {
            passwordField.addEventListener("input", (e) => {
                this.clearError("password");
                this.validateField("password", e.target.value);
            });
        }

        // Enter キーでログイン
        document.addEventListener("keypress", (e) => {
            const loginBtn = document.getElementById("loginBtn");
            if (e.key === "Enter" && loginBtn && !loginBtn.disabled) {
                this.handleLogin();
            }
        });
    }

    validateField(fieldName, value) {
        const field = document.getElementById(fieldName);
        let isValid = true;

        switch (fieldName) {
            case "username":
                if (!value || value.trim().length < 3) {
                    this.showFieldError(fieldName, "ユーザー名は3文字以上で入力してください");
                    isValid = false;
                }
                break;
            case "password":
                if (!value || value.length < 3) {
                    this.showFieldError(fieldName, "パスワードは3文字以上で入力してください");
                    isValid = false;
                }
                break;
        }

        if (isValid) {
            field.classList.remove("error");
        } else {
            field.classList.add("error");
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = "block";
        }
    }

    clearError(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        if (field) field.classList.remove("error");
        if (errorElement) errorElement.style.display = "none";
    }

    async handleLogin() {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const remember = document.getElementById("remember")?.checked || false;
        const loginBtn = document.getElementById("loginBtn");

        // フィールド検証
        const isUsernameValid = this.validateField("username", username);
        const isPasswordValid = this.validateField("password", password);

        if (!isUsernameValid || !isPasswordValid) {
            this.showAlert("入力内容に誤りがあります", "error");
            return;
        }

        // ローディング状態
        this.setLoading(true);

        try {
            // 認証処理
            const authResult = this.authenticateUser(username, password);
            
            if (authResult.success) {
                this.currentUser = authResult.user;
                this.saveSessionAndRedirect(remember);
            } else {
                this.showAlert(authResult.message, "error");
            }
        } catch (error) {
            this.showAlert("ログインに失敗しました", "error");
            console.error("Login error:", error);
        } finally {
            this.setLoading(false);
        }
    }

    authenticateUser(username, password) {
        const user = this.users[username];
        
        if (!user) {
            return {
                success: false,
                message: "ユーザーが見つかりません"
            };
        }

        if (user.password !== password) {
            return {
                success: false,
                message: "パスワードが正しくありません"
            };
        }

        // 管理者権限チェック
        if (user.role !== "admin") {
            return {
                success: false,
                message: "管理者権限が必要です"
            };
        }

        return {
            success: true,
            user: {
                username: username,
                displayName: user.displayName,
                role: user.role,
                permissions: user.permissions,
                email: user.email,
                loginTime: new Date().toISOString()
            }
        };
    }

    saveSessionAndRedirect(remember = false) {
        try {
            const expiresIn = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7日 or 1日
            const sessionData = {
                user: this.currentUser,
                expires: new Date().getTime() + expiresIn,
                remember: remember
            };

            localStorage.setItem("question_manager_session", JSON.stringify(sessionData));
            
            // 統計用
            this.logAccess();
            
            // セッション保存後にダッシュボードにリダイレクト
            window.location.replace("dashboard.html");
        } catch (error) {
            console.error("セッション保存エラー:", error);
            this.showAlert("セッション保存に失敗しました: " + error.message, "error");
        }
    }

    logAccess() {
        try {
            const accessLog = JSON.parse(localStorage.getItem("access_log") || "[]");
            accessLog.push({
                user: this.currentUser.username,
                time: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
            
            // 最新100件のみ保持
            if (accessLog.length > 100) {
                accessLog.splice(0, accessLog.length - 100);
            }
            
            localStorage.setItem("access_log", JSON.stringify(accessLog));
        } catch (error) {
            console.error("アクセスログ記録エラー:", error);
        }
    }

    setLoading(isLoading) {
        const loginBtn = document.getElementById("loginBtn");
        const btnText = loginBtn?.querySelector(".btn-text");
        
        if (isLoading && loginBtn) {
            loginBtn.classList.add("loading");
            loginBtn.disabled = true;
            if (btnText) btnText.textContent = "ログイン中...";
        } else if (loginBtn) {
            loginBtn.classList.remove("loading");
            loginBtn.disabled = false;
            if (btnText) btnText.textContent = "ログイン";
        }
    }

    showAlert(message, type = "error") {
        const alertElement = document.getElementById("alertMessage");
        if (alertElement) {
            alertElement.textContent = message;
            alertElement.className = `alert ${type}`;
            alertElement.style.display = "block";
            
            setTimeout(() => {
                alertElement.style.display = "none";
            }, 5000);
        }
    }

    // 公開メソッド
    static getCurrentUser() {
        const sessionData = localStorage.getItem("question_manager_session");
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                if (session.expires > now) {
                    return session.user;
                }
            } catch (e) {
                console.error("Session data corrupted:", e);
            }
        }
        return null;
    }

    static logout() {
        try {
            localStorage.removeItem("question_manager_session");
            window.location.replace("login.html");
        } catch (error) {
            console.error("ログアウトエラー:", error);
            // フォールバック: 強制リダイレクト
            window.location.replace("login.html");
        }
    }

    static hasPermission(permission) {
        const user = AuthenticationSystem.getCurrentUser();
        return user && user.permissions && user.permissions.includes(permission);
    }
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
    window.auth = new AuthenticationSystem();
});
