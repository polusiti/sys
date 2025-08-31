class Dashboard {
    constructor() {
        this.currentUser = null;
        this.permissions = [];
        this.stats = {
            totalQuestions: 0,
            activeUsers: 0,
            todayCreated: 0,
            averageDifficulty: 0
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserInfo();
        this.setupPermissions();
        this.loadStatistics();
        this.loadRecentActivity();
        this.setupEventListeners();
    }

    checkAuthentication() {
        this.currentUser = AuthenticationSystem.getCurrentUser();
        
        if (!this.currentUser) {
            // セッションがない場合、ゲストとして自動ログイン
            this.autoLoginAsGuest();
            return;
        }
        
        this.permissions = this.currentUser.permissions || [];
    }
    
    autoLoginAsGuest() {
        // URLパラメーターをチェック
        const urlParams = new URLSearchParams(window.location.search);
        
        // デフォルトユーザー情報
        const defaultUsers = {
            'admin': {
                id: 'admin',
                role: 'admin', 
                permissions: ['read', 'write', 'delete', 'manage_users'],
                displayName: '管理者'
            },
            'teacher': {
                id: 'teacher',
                role: 'teacher',
                permissions: ['read', 'write'], 
                displayName: '教師'
            },
                permissions: ['read'],
                displayName: 'ゲスト'
            }
        };
        
        const userData = defaultUsers[role] || defaultUsers[.admin.];
        
        // セッション作成
        const session = {
            user: userData,
            loginTime: new Date().getTime(),
            expires: new Date().getTime() + (24 * 60 * 60 * 1000) // 24時間
        };
        
        localStorage.setItem('question_manager_session', JSON.stringify(session));
        this.currentUser = userData;
        this.permissions = userData.permissions || [];
        
        // ページを再読み込みして認証状態を反映
        if (window.location.search) {
            window.location.href = window.location.pathname;
        }
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
        const roleNames = {
            'admin': '管理者',
            'teacher': '教師',
