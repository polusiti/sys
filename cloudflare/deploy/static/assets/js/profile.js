// Profile Management System
// File: assets/js/profile.js

class ProfileManager {
  constructor(authSystem) {
    this.auth = authSystem;
    this.currentUser = null;
    this.userStats = null;
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.loadUserData();
  }
  
  setupEventListeners() {
    // Profile tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
    
    // Profile edit form
    const profileForm = document.getElementById('profileEditForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfile();
      });
    }
    
    // Password change form
    const passwordForm = document.getElementById('passwordChangeForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.changePassword();
      });
    }
    
    // Avatar upload
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        this.handleAvatarUpload(e);
      });
    }
    
    // Show profile button
    const showProfileBtn = document.getElementById('showProfileBtn');
    if (showProfileBtn) {
      showProfileBtn.addEventListener('click', () => {
        this.showProfile();
      });
    }
    
    // Back to main button
    const backToMainBtn = document.getElementById('backToMainBtn');
    if (backToMainBtn) {
      backToMainBtn.addEventListener('click', () => {
        this.hideProfile();
      });
    }
  }
  
  async loadUserData() {
    if (!this.auth.isAuthenticated) return;
    
    this.currentUser = this.auth.user;
    
    // Load user statistics (mock data for now)
    this.userStats = {
      totalSessions: 15,
      totalQuestions: 450,
      accuracy: 78,
      streak: 7,
      joinDate: new Date().toLocaleDateString()
    };
    
    this.updateProfileUI();
  }
  
  updateProfileUI() {
    if (!this.currentUser) return;
    
    // Update profile info
    const elements = {
      profileName: document.getElementById('profileName'),
      profileEmail: document.getElementById('profileEmail'),
      profileUsername: document.getElementById('profileUsername'),
      profileUsernameInput: document.getElementById('profileUsernameInput'),
      profileEmailInput: document.getElementById('profileEmailInput'),
      profileDisplayName: document.getElementById('profileDisplayName'),
      profileDisplayNameInput: document.getElementById('profileDisplayNameInput')
    };
    
    Object.keys(elements).forEach(key => {
      const element = elements[key];
      if (element) {
        if (key.includes('Input')) {
          const field = key.replace('Input', '').replace('profile', '').toLowerCase();
          if (field === 'displayname') {
            element.value = this.currentUser.displayName || this.currentUser.username;
          } else {
            element.value = this.currentUser[field] || '';
          }
        } else {
          const field = key.replace('profile', '').toLowerCase();
          if (field === 'displayname') {
            element.textContent = this.currentUser.displayName || this.currentUser.username;
          } else {
            element.textContent = this.currentUser[field] || '';
          }
        }
      }
    });
    
    // Update stats
    if (this.userStats) {
      const statElements = {
        statSessions: this.userStats.totalSessions,
        statQuestions: this.userStats.totalQuestions,
        statAccuracy: `${this.userStats.accuracy}%`,
        statStreak: this.userStats.streak
      };
      
      Object.keys(statElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = statElements[id];
        }
      });
    }
  }
  
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.profile-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${tabName}Section`).classList.add('active');
  }
  
  async saveProfile() {
    const formData = {
      username: document.getElementById('profileUsernameInput').value,
      displayName: document.getElementById('profileDisplayNameInput').value,
      email: document.getElementById('profileEmailInput').value
    };
    
    // Validation
    if (!formData.username || !formData.email) {
      this.showMessage('ユーザー名とメールアドレスは必須です', 'error');
      return;
    }
    
    try {
      // For now, update locally (API integration later)
      this.currentUser.username = formData.username;
      this.currentUser.displayName = formData.displayName;
      this.currentUser.email = formData.email;
      
      // Update localStorage
      localStorage.setItem('testapp_user_data', JSON.stringify(this.currentUser));
      
      this.updateProfileUI();
      this.showMessage('プロフィールを更新しました', 'success');
      
    } catch (error) {
      console.error('Profile update error:', error);
      this.showMessage('プロフィール更新に失敗しました', 'error');
    }
  }
  
  async changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showMessage('すべてのパスワードフィールドを入力してください', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showMessage('新しいパスワードが一致しません', 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      this.showMessage('新しいパスワードは8文字以上で入力してください', 'error');
      return;
    }
    
    try {
      // For now, simulate password change (API integration later)
      this.showMessage('パスワードを変更しました', 'success');
      
      // Clear form
      document.getElementById('passwordChangeForm').reset();
      
    } catch (error) {
      console.error('Password change error:', error);
      this.showMessage('パスワード変更に失敗しました', 'error');
    }
  }
  
  handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showMessage('画像ファイルを選択してください', 'error');
      return;
    }
    
    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      this.showMessage('ファイルサイズは2MB以下にしてください', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarElements = document.querySelectorAll('.profile-avatar-large, .user-avatar');
      avatarElements.forEach(avatar => {
        avatar.src = e.target.result;
      });
      
      // Save to localStorage (for demo)
      localStorage.setItem('testapp_user_avatar', e.target.result);
      
      this.showMessage('アバターを更新しました', 'success');
    };
    reader.readAsDataURL(file);
  }
  
  showProfile() {
    document.querySelector('.main').style.display = 'none';
    document.querySelector('.profile-dashboard').style.display = 'block';
    
    // Load fresh data
    this.loadUserData();
  }
  
  hideProfile() {
    document.querySelector('.profile-dashboard').style.display = 'none';
    document.querySelector('.main').style.display = 'block';
  }
  
  showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.profile-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `profile-message ${type}-message`;
    messageEl.textContent = message;
    
    // Insert at top of active section
    const activeSection = document.querySelector('.profile-section.active');
    if (activeSection) {
      activeSection.insertBefore(messageEl, activeSection.firstChild);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        messageEl.remove();
      }, 5000);
    }
  }
  
  loadSavedAvatar() {
    const savedAvatar = localStorage.getItem('testapp_user_avatar');
    if (savedAvatar) {
      const avatarElements = document.querySelectorAll('.profile-avatar-large, .user-avatar');
      avatarElements.forEach(avatar => {
        avatar.src = savedAvatar;
      });
    }
  }
}

// Initialize when auth system is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for auth system to be available
  if (typeof testAppAuth !== 'undefined') {
    window.profileManager = new ProfileManager(testAppAuth);
    profileManager.loadSavedAvatar();
  } else {
    // Retry after a short delay
    setTimeout(() => {
      if (typeof testAppAuth !== 'undefined') {
        window.profileManager = new ProfileManager(testAppAuth);
        profileManager.loadSavedAvatar();
      }
    }, 1000);
  }
});