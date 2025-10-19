// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    login(email) {
        if (email && email.includes('@')) {
            const user = {
                id: Date.now(),
                email: email
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;
            this.updateUserDisplay();
            return { success: true, message: 'ログインしました' };
        } else {
            return { success: false, message: '有効なメールアドレスを入力してください' };
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.hideUserInterface();
    }

    updateUserDisplay() {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (this.currentUser && userInfo && loginBtn && userName && userAvatar) {
            userInfo.style.display = 'inline-flex';
            loginBtn.style.display = 'none';
            userName.textContent = this.currentUser.email;
            userAvatar.textContent = this.currentUser.email.charAt(0).toUpperCase();
            
            // 統計も表示
            if (window.uiManager) {
                window.uiManager.showStats();
            }
        }
    }

    hideUserInterface() {
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        
        if (userInfo && loginBtn) {
            userInfo.style.display = 'none';
            loginBtn.style.display = 'block';
        }
        
        // 統計も非表示
        if (window.uiManager) {
            window.uiManager.hideStats();
        }
    }

    initializeUserInterface() {
        if (this.currentUser) {
            this.updateUserDisplay();
        }
    }
}

// Export for module use
export { AuthManager };