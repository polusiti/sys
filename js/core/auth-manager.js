/**
 * 統一認証マネージャー
 * パスキー認証、ゲストログイン、セッション管理を統一
 */

class AuthManager {
    constructor(options = {}) {
        this.apiClient = options.apiClient || window.apiClient;
        this.storageKey = options.storageKey || 'auth_session';
        this.fallbackMode = options.fallbackMode !== false;

        // 認証状態
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authCallbacks = [];

        // 初期化（完了を Promise で共有）
        this.readyPromise = this.init();
    }

    // 初期化
    async init() {
        try {
            const savedSession = this.getStoredSession();
            if (savedSession && !this.isSessionExpired(savedSession)) {
                this.currentUser = savedSession.user;
                this.isAuthenticated = true;
                this.notifyAuthChange('login', savedSession.user);
            } else {
                this.clearStoredSession();
            }
        } catch (error) {
            console.error('Auth initialization failed:', error);
        }
    }

    // セッション保存
    setStoredSession(user) {
        const session = {
            user,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(session));
        } catch (error) {
            console.error('Failed to store session:', error);
        }
    }

    // セッション取得
    getStoredSession() {
        try {
            const session = localStorage.getItem(this.storageKey);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Failed to retrieve session:', error);
            return null;
        }
    }

    // セッション有効期限チェック
    isSessionExpired(session) {
        return new Date(session.expiresAt) < new Date();
    }

    // セッションクリア
    clearStoredSession() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    // ==============================
    // ゲストログイン
    // ==============================

    async guestLogin() {
        const guestUser = {
            id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: `guest_${Math.random().toString(36).substr(2, 6)}`,
            email: null,
            role: 'guest',
            isGuest: true,
            loginTime: new Date().toISOString()
        };

        this.establishSession(guestUser);

        return {
            success: true,
            user: guestUser,
            message: 'ゲストログインしました'
        };
    }

    // ==============================
    // パスキー認証
    // ==============================

    async beginPasskeyLogin(username) {
        try {
            return await this.apiClient.beginPasskeyLogin(username);
        } catch (error) {
            console.error('Passkey login begin failed:', error);
            throw this.handleAuthError(error, 'パスキー認証開始');
        }
    }

    async completePasskeyLogin(credential) {
        try {
            const response = await this.apiClient.completePasskeyLogin(credential);

            if (response.success) {
                const user = {
                    ...response.user,
                    isGuest: false,
                    role: response.user.isAdmin ? 'admin' : 'user'
                };

                this.establishSession(user);

                return {
                    success: true,
                    user,
                    message: 'パスキー認証成功'
                };
            } else {
                throw new Error(response.error || '認証に失敗しました');
            }

        } catch (error) {
            console.error('Passkey login complete failed:', error);
            throw this.handleAuthError(error, 'パスキー認証');
        }
    }

    // ==============================
    // ユーザー登録
    // ==============================

    async registerUser(userData) {
        try {
            return await this.apiClient.registerUser(userData);
        } catch (error) {
            console.error('User registration failed:', error);
            throw this.handleAuthError(error, 'ユーザー登録');
        }
    }

    async beginPasskeyRegistration(userData) {
        try {
            return await this.apiClient.beginPasskeyRegistration(userData);
        } catch (error) {
            console.error('Passkey registration begin failed:', error);
            throw this.handleAuthError(error, 'パスキー登録開始');
        }
    }

    async completePasskeyRegistration(credential) {
        try {
            const response = await this.apiClient.completePasskeyRegistration(credential);

            if (response.success) {
                return { success: true, message: 'パスキー登録完了' };
            } else {
                throw new Error(response.error || '登録に失敗しました');
            }

        } catch (error) {
            console.error('Passkey registration complete failed:', error);
            throw this.handleAuthError(error, 'パスキー登録');
        }
    }

    // ==============================
    // ログアウト
    // ==============================

    async logout() {
        const previousUser = this.currentUser;

        try {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.clearStoredSession();
            this.notifyAuthChange('logout', previousUser);

            return { success: true, message: 'ログアウトしました' };
        } catch (error) {
            console.error('Logout failed:', error);
            return { success: false, error: 'ログアウトに失敗しました' };
        }
    }

    // ==============================
    // 認証状態管理
    // ==============================

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }

    isGuest() {
        return this.currentUser?.isGuest || false;
    }

    isAdmin() {
        return this.currentUser?.role === 'admin' || this.currentUser?.isAdmin;
    }

    // ==============================
    // イベント管理
    // ==============================

    onAuthChange(callback) {
        if (typeof callback === 'function') {
            this.authCallbacks.push(callback);
        }
    }

    offAuthChange(callback) {
        const index = this.authCallbacks.indexOf(callback);
        if (index > -1) {
            this.authCallbacks.splice(index, 1);
        }
    }

    notifyAuthChange(event, data) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }

    // ==============================
    // エラーハンドリング
    // ==============================

    handleAuthError(error, context) {
        if (error.name === 'AbortError') {
            return new Error(`${context}がキャンセルされました`);
        }

        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            return new Error('ネットワーク接続エラー。接続を確認してください。');
        }

        if (error.message.includes('401')) {
            this.clearStoredSession();
            this.currentUser = null;
            this.isAuthenticated = false;
            return new Error('認証情報が無効です。再度ログインしてください。');
        }

        if (error.message.includes('403')) {
            return new Error('アクセス権限がありません。');
        }

        return error;
    }

    // ==============================
    // ユーティリティ
    // ==============================

    async checkAuthStatus() {
        try {
            const healthCheck = await this.apiClient.healthCheck();
            return {
                authenticated: this.isAuthenticated,
                apiAvailable: healthCheck.status === 'ok',
                user: this.currentUser
            };
        } catch (error) {
            return {
                authenticated: false,
                apiAvailable: false,
                error: error.message
            };
        }
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            throw new Error('認証が必要です。ログインしてください。');
        }
        return this.currentUser;
    }

    requireAdminAuth() {
        this.requireAuth();
        if (!this.isAdmin()) {
            throw new Error('管理者権限が必要です。');
        }
        return this.currentUser;
    }

    // セッション確立（既存ページ互換用）
    establishSession(user, options = {}) {
        if (!user) {
            return this.logout();
        }

        this.currentUser = user;
        this.isAuthenticated = true;

        if (options.persist !== false) {
            this.setStoredSession(user);
        }

        if (options.silent !== true) {
            this.notifyAuthChange('login', user);
        }

        return user;
    }
}

// グローバルインスタンス作成
const authManager = new AuthManager();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
}

if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.AuthManager = AuthManager;
    window.authReady = authManager.readyPromise || Promise.resolve();

    // グローバル関数を公開（既存ページとの互換性のため）
    window.getCurrentUser = () => authManager.getCurrentUser();
    window.requireAuthUser = () => authManager.requireAuth();
    window.requireAdminUser = () => authManager.requireAdminAuth();
    window.triggerGuestLogin = () => authManager.guestLogin();
    window.guestLogin = () => authManager.guestLogin();
    window.performLogout = () => authManager.logout();
    window.logout = () => authManager.logout();
    window.establishSession = (user, options) => authManager.establishSession(user, options);
}
