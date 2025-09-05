class AuthenticationSystem {
    constructor() {
        // ユーザー情報は users.json から読み込む
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
            this.showAlert('ユーザー情報の読み込みに失敗しました。', 'error');
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
                    session?.user?.role === "admin"; // admin以外は無効

                if (isValid) {
                    this.currentUser = session.user;
                    if (!location.pathname.includes("dashboard")) {
                        location.replace("dashboard.html");
                    }
                    return;
                }
            } catch (e) {
                console.error("Session parse error:", e);
            }
        }

        // 無効セッションは破棄してログインへ
        localStorage.removeItem("question_manager_session");
        if (!location.pathname.includes("login")) {
            location.replace("login.html");
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

        if (field) field.classList.toggle("error", !isValid);
        return isValid;
    }

    showFieldError(fieldName, message) {
        const el = document.getElementById(`${fieldName}Error`);
        if (el) {
            el.textContent = message;
            el.style.display = "block";
        }
    }

    clearError(fieldName) {
        const field = document.getElementById(fieldName);
        const el = document.getElementById(`${fieldName}Error`);
        if (field) field.classList.remove("error");
        if (el) el.style.display = "none";
    }

    async handleLogin() {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const remember = document.getElementById("remember")?.checked || false;

        const okU = this.validateField("username", username);
        const okP = this.validateField("password", password);
        if (!okU || !okP) {
            this.showAlert("入力内容に誤りがあります", "error");
            return;
        }

        this.setLoading(true);
        try {
            const auth = this.authenticateUser(username, password);
            if (auth.success) {
                this.currentUser = auth.user;
                this.saveSessionAndRedirect(remember);
            } else {
                this.showAlert(auth.message, "error");
            }
        } catch (e) {
            console.error("Login error:", e);
            this.showAlert("ログインに失敗しました", "error");
        } finally {
            this.setLoading(false);
        }
    }

    authenticateUser(username, password) {
        const user = this.users[username];
        if (!user) return { success: false, message: "ユーザーが見つかりません" };
        if (user.password !== password)
            return { success: false, message: "パスワードが正しくありません" };
        if (user.role !== "admin")
            return { success: false, message: "管理者権限が必要です" };

        return {
            success: true,
            user: {
                username,
                displayName: user.displayName,
                role: user.role,
                permissions: user.permissions,
                email: user.email,
                loginTime: new Date().toISOString()
            }
        };
    }

    saveSessionAndRedirect(remember = false) {
        const expiresIn = remember
            ? 7 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

        const session = {
            user: this.currentUser,
            expires: Date.now() + expiresIn,
            remember
        };

        try {
            localStorage.setItem("question_manager_session", JSON.stringify(session));
            this.logAccess();
            location.replace("dashboard.html");
        } catch (e) {
            console.error("Session save error:", e);
            this.showAlert("セッション保存に失敗しました: " + e.message, "error");
        }
    }

    logAccess() {
        try {
            const log = JSON.parse(localStorage.getItem("access_log") || "[]");
            log.push({
                user: this.currentUser.username,
                time: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
            if (log.length > 100) log.splice(0, log.length - 100);
            localStorage.setItem("access_log", JSON.stringify(log));
        } catch (e) {
            console.error("Access log error:", e);
        }
    }

    setLoading(isLoading) {
        const btn = document.getElementById("loginBtn");
        const text = btn?.querySelector(".btn-text");
        if (!btn) return;
        btn.classList.toggle("loading", isLoading);
        btn.disabled = !!isLoading;
        if (text) text.textContent = isLoading ? "ログイン中..." : "ログイン";
    }

    showAlert(message, type = "error") {
        const el = document.getElementById("alertMessage");
        if (!el) return;
        el.textContent = message;
        el.className = `alert ${type}`;
        el.style.display = "block";
        setTimeout(() => (el.style.display = "none"), 5000);
    }

    // 公開メソッド
    static getCurrentUser() {
        const sessionStr = localStorage.getItem("question_manager_session");
        if (!sessionStr) return null;
        try {
            const session = JSON.parse(sessionStr);
            if (session?.expires > Date.now()) return session.user || null;
        } catch (e) {
            console.error("Session parse error:", e);
        }
        return null;
    }

    static logout() {
        try {
            localStorage.removeItem("question_manager_session");
        } finally {
            location.replace("login.html");
        }
    }

    // ログイン済みなら常に許可（ページ側の「アクセス拒否」アラートを抑止）
    static hasPermission(_permission) {
        return !!AuthenticationSystem.getCurrentUser();
    }
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
    window.auth = new AuthenticationSystem();
});
