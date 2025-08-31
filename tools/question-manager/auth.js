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
                    this.saveSessionAndRedirect();
                return;
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
            } else {
                this.showAlert(authResult.message, 'error');
            }
        } catch (error) {
            this.showAlert('ログインに失敗しました', 'error');
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

    saveSessionAndRedirect() {
        const role = this.currentUser.role;
        
        // Cloudflare環境では .html 拡張子を除去
        switch (role) {
            case 'admin':
                window.location.replace('dashboard');
                break;
            case 'teacher':
                window.location.replace('dashboard');
                break;
            case 'guest':
                window.location.replace('dashboard');
                break;
            default:
                window.location.replace('index.html');
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
        

    saveSessionAndRedirect() {
        try {
            const sessionData = {
                user: this.currentUser,
                expires: new Date().getTime() + (24 * 60 * 60 * 1000), // 1日
                remember: false
            };
            
            localStorage.setItem('question_manager_session', JSON.stringify(sessionData));
            this.logAccess();
            
            // セッション保存後にリダイレクト
            window.location.replace('dashboard.html');
        } catch (error) {
            console.error('セッション保存エラー:', error);
            this.showAlert('セッション保存に失敗しました: ' + error.message, 'error');
        }
    }

    static logout() {
        try {
            localStorage.removeItem('question_manager_session');
            window.location.replace('login.html');
        } catch (error) {
            console.error('ログアウトエラー:', error);
            // フォールバック: 強制リダイレクト
            window.location.replace('login.html');
        }
    }

