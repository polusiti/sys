class AuthenticationSystem {
    constructor() {
        this.users = {
            'admin': {
                password: 'admin123',
                role: 'admin',
                permissions: ['read', 'write', 'delete', 'manage_users'],
                displayName: '管理者',
                email: 'admin@example.com'
            },
            'teacher1': {
                password: 'teacher123',
                role: 'teacher',
                permissions: ['read', 'write'],
                displayName: '田中先生',
                email: 'tanaka@school.jp'
            },
            'teacher2': {
                password: 'teacher123',
                role: 'teacher',
                permissions: ['read', 'write'],
                displayName: '佐藤先生',
                email: 'sato@school.jp'
            },
            'guest': {
                password: '',
                role: 'guest',
                permissions: ['read'],
                displayName: 'ゲスト',
                email: 'guest@example.com'
            }
        };
        
        this.currentUser = null;
        this.selectedUserType = 'admin';
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
        this.loadDemoCredentials();
    }

    checkExistingSession() {
        const sessionData = localStorage.getItem('question_manager_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                if (session.expires > now) {
                    this.currentUser = session.user;
                    this.redirectToDashboard();
                    return;
                }
            } catch (e) {
                console.error('Session data corrupted:', e);
            }
        }
        localStorage.removeItem('question_manager_session');
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // リアルタイム入力検証
        document.getElementById('username').addEventListener('input', (e) => {
            this.clearError('username');
            this.validateField('username', e.target.value);
        });

        document.getElementById('password').addEventListener('input', (e) => {
            this.clearError('password');
            this.validateField('password', e.target.value);
        });

        // Enter キーでログイン
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !loginBtn.disabled) {
                this.handleLogin();
            }
        });
    }

    loadDemoCredentials() {
        // デモ用の認証情報を表示
        setTimeout(() => {
            this.showAlert('デモ認証情報: admin / admin123 または teacher1 / teacher123', 'success');
        }, 1000);
    }

    validateField(fieldName, value) {
        const field = document.getElementById(fieldName);
        let isValid = true;

        switch (fieldName) {
            case 'username':
                if (!value || value.trim().length < 3) {
                    this.showFieldError(fieldName, 'ユーザー名は3文字以上で入力してください');
                    isValid = false;
                }
                break;
            case 'password':
                if (!value || value.length < 3) {
                    this.showFieldError(fieldName, 'パスワードは3文字以上で入力してください');
                    isValid = false;
                }
                break;
        }

        if (isValid) {
            field.classList.remove('error');
        } else {
            field.classList.add('error');
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearError(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        if (field) field.classList.remove('error');
        if (errorElement) errorElement.style.display = 'none';
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        const loginBtn = document.getElementById('loginBtn');

        // フィールド検証
        const isUsernameValid = this.validateField('username', username);
        const isPasswordValid = this.validateField('password', password);

        if (!isUsernameValid || !isPasswordValid) {
            this.showAlert('入力内容に誤りがあります', 'error');
            return;
        }

        // ローディング状態
        this.setLoading(true);

        try {
            // 認証処理（実際のAPIコールをシミュレート）
            await this.simulateApiCall();
            
            const authResult = this.authenticateUser(username, password);
            
            if (authResult.success) {
                this.currentUser = authResult.user;
                this.createSession(remember);
                this.showAlert('ログイン成功！リダイレクトしています...', 'success');
                
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1500);
            } else {
                this.showAlert(authResult.message, 'error');
            }
        } catch (error) {
            this.showAlert('ログイン処理中にエラーが発生しました', 'error');
            console.error('Login error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    authenticateUser(username, password) {
        const user = this.users[username];
        
        if (!user) {
            return {
                success: false,
                message: 'ユーザーが見つかりません'
            };
        }

        if (user.password !== password) {
            return {
                success: false,
                message: 'パスワードが正しくありません'
            };
        }

        // 権限チェック
        const expectedRole = this.selectedUserType;
        if (user.role !== expectedRole && expectedRole !== 'teacher') {
            return {
                success: false,
                message: `${expectedRole === 'admin' ? '管理者' : '教師'}権限が必要です`
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

    createSession(remember = false) {
        const expiresIn = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7日 or 1日
        const sessionData = {
            user: this.currentUser,
            expires: new Date().getTime() + expiresIn,
            remember: remember
        };

        localStorage.setItem('question_manager_session', JSON.stringify(sessionData));
        
        // 統計用
        this.logAccess();
    }

    logAccess() {
        const accessLog = JSON.parse(localStorage.getItem('access_log') || '[]');
        accessLog.push({
            user: this.currentUser.username,
            time: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // 最新100件のみ保持
        if (accessLog.length > 100) {
            accessLog.splice(0, accessLog.length - 100);
        }
        
        localStorage.setItem('access_log', JSON.stringify(accessLog));
    }

    redirectToDashboard() {
        const role = this.currentUser.role;
        
        // Cloudflare環境では .html 拡張子を除去
        switch (role) {
            case 'admin':
                window.location.href = 'dashboard?role=admin';
                break;
            case 'teacher':
                window.location.href = 'dashboard?role=teacher';
                break;
            case 'guest':
                window.location.href = 'dashboard?role=guest';
                break;
            default:
                window.location.href = 'index';
        }
    }

    setLoading(isLoading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            btnText.textContent = 'ログイン中...';
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            btnText.textContent = 'ログイン';
        }
    }

    showAlert(message, type = 'error') {
        const alertElement = document.getElementById('alertMessage');
        alertElement.textContent = message;
        alertElement.className = `alert ${type}`;
        alertElement.style.display = 'block';
        
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }

    simulateApiCall() {
        return new Promise(resolve => {
            setTimeout(resolve, 800); // 800ms の遅延でAPI呼び出しをシミュレート
        });
    }

    // 公開メソッド
    static getCurrentUser() {
        const sessionData = localStorage.getItem('question_manager_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = new Date().getTime();
                
                if (session.expires > now) {
                    return session.user;
                }
            } catch (e) {
                console.error('Session data corrupted:', e);
            }
        }
        return null;
    }

    static logout() {
        localStorage.removeItem('question_manager_session');
        window.location.href = 'login';
    }

    static hasPermission(permission) {
        const user = AuthenticationSystem.getCurrentUser();
        return user && user.permissions && user.permissions.includes(permission);
    }
}

// グローバル関数
function selectUserType(type) {
    document.querySelectorAll('.user-type').forEach(el => {
        el.classList.remove('selected');
    });
    
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    if (window.auth) {
        window.auth.selectedUserType = type;
    }
    
    // プレースホルダーを更新
    const usernameField = document.getElementById('username');
    switch (type) {
        case 'admin':
            usernameField.placeholder = 'admin';
            break;
        case 'teacher':
            usernameField.placeholder = 'teacher1';
            break;
    }
}

function guestLogin() {
    if (window.auth) {
        window.auth.currentUser = {
            username: 'guest',
            displayName: 'ゲスト',
            role: 'guest',
            permissions: ['read'],
            email: 'guest@example.com',
            loginTime: new Date().toISOString()
        };
        
        window.auth.createSession(false);
        window.auth.showAlert('ゲストとしてログインしています...', 'success');
        
        setTimeout(() => {
            window.auth.redirectToDashboard();
        }, 1000);
    }
}

// セキュリティ対策
document.addEventListener('contextmenu', (e) => {
    // 右クリック無効化（開発環境では有効にする）
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        e.preventDefault();
    }
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthenticationSystem();
});