// Frontend Authentication System
// File: assets/js/auth.js

class TestAppAuth {
  constructor() {
    this.token = localStorage.getItem('testapp_auth_token');
    this.user = JSON.parse(localStorage.getItem('testapp_user_data') || 'null');
    this.isAuthenticated = !!this.token;
    this.apiBase = 'https://testapp-auth.t88596565.workers.dev/api'; // Production API
    
    // Initialize auth state
    this.init();
  }
  
  async init() {
    if (this.token) {
      // Validate existing token
      const isValid = await this.validateToken();
      if (!isValid) {
        this.logout();
      } else {
        this.updateUI();
      }
    } else {
      this.updateUI();
    }
  }
  
  async validateToken() {
    try {
      const response = await fetch(`${this.apiBase}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        localStorage.setItem('testapp_user_data', JSON.stringify(this.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
  
  async register(email, username, password) {
    try {
      const response = await fetch(`${this.apiBase}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: '登録完了！ログインしてください。' };
      } else {
        return { success: false, message: data.error || '登録に失敗しました。' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'ネットワークエラーが発生しました。' };
    }
  }
  
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        
        localStorage.setItem('testapp_auth_token', this.token);
        localStorage.setItem('testapp_user_data', JSON.stringify(this.user));
        
        this.updateUI();
        this.migrateLocalProgress();
        
        return { success: true, message: 'ログイン成功！' };
      } else {
        return { success: false, message: data.error || 'ログインに失敗しました。' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'ネットワークエラーが発生しました。' };
    }
  }
  
  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.log('Logout request failed, continuing local logout');
    }
    
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    
    localStorage.removeItem('testapp_auth_token');
    localStorage.removeItem('testapp_user_data');
    
    this.updateUI();
  }
  
  async saveProgress(subject, score, totalQuestions, duration = 0) {
    if (!this.isAuthenticated) {
      // Save to localStorage for offline use
      this.saveProgressLocally(subject, score, totalQuestions);
      return { success: true, offline: true };
    }
    
    try {
      const response = await fetch(`${this.apiBase}/user/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          subject,
          score,
          totalQuestions,
          duration
        })
      });
      
      if (response.ok) {
        return { success: true, online: true };
      } else {
        // Fallback to localStorage
        this.saveProgressLocally(subject, score, totalQuestions);
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('Save progress error:', error);
      this.saveProgressLocally(subject, score, totalQuestions);
      return { success: true, offline: true };
    }
  }
  
  saveProgressLocally(subject, score, totalQuestions) {
    const key = `testapp_progress_${subject}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{"total": 0, "correct": 0, "sessions": 0}');
    
    existing.total += totalQuestions;
    existing.correct += score;
    existing.sessions += 1;
    existing.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(key, JSON.stringify(existing));
  }
  
  async getProgress() {
    if (!this.isAuthenticated) {
      return this.getLocalProgress();
    }
    
    try {
      const response = await fetch(`${this.apiBase}/user/progress`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.progress;
      } else {
        return this.getLocalProgress();
      }
    } catch (error) {
      console.error('Get progress error:', error);
      return this.getLocalProgress();
    }
  }
  
  getLocalProgress() {
    const subjects = ['english', 'chemistry', 'math', 'physics', 'japanese'];
    return subjects.map(subject => {
      const key = `testapp_progress_${subject}`;
      const data = JSON.parse(localStorage.getItem(key) || '{"total": 0, "correct": 0, "sessions": 0}');
      return {
        subject,
        total_questions: data.total,
        correct_answers: data.correct,
        best_score: data.correct // Simple approximation
      };
    }).filter(p => p.total_questions > 0);
  }
  
  async migrateLocalProgress() {
    const subjects = ['english', 'chemistry', 'math', 'physics', 'japanese'];
    
    for (const subject of subjects) {
      const key = `testapp_progress_${subject}`;
      const localData = localStorage.getItem(key);
      
      if (localData) {
        const data = JSON.parse(localData);
        if (data.total > 0) {
          await this.saveProgress(subject, data.correct, data.total);
          // Keep local data as backup, don't remove
        }
      }
    }
  }
  
  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (this.isAuthenticated && this.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        if (userName) userName.textContent = this.user.username;
      }
      
      // Update hero section for logged-in users
      this.updateHeroSection();
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
  }
  
  updateHeroSection() {
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && this.user) {
      heroSubtitle.innerHTML = `こんにちは、${this.user.username}さん！<br>今日も学習を続けましょう。`;
    }
  }
  
  showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }
  
  hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
}

// Initialize authentication system
const testAppAuth = new TestAppAuth();

// Auth modal functionality
document.addEventListener('DOMContentLoaded', function() {
  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      testAppAuth.showAuthModal();
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      testAppAuth.logout();
    });
  }
  
  // Tab switching
  const tabBtns = document.querySelectorAll('.auth-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchAuthTab(tab);
    });
  });
  
  // Form submissions
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
  
  // Close modal when clicking outside
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        testAppAuth.hideAuthModal();
      }
    });
  }
});

function switchAuthTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  
  // Show/hide forms
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showMessage('メールアドレスとパスワードを入力してください。', 'error');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'ログイン中...';
  
  try {
    const result = await testAppAuth.login(email, password);
    
    if (result.success) {
      showMessage(result.message, 'success');
      testAppAuth.hideAuthModal();
      // Clear form
      e.target.reset();
    } else {
      showMessage(result.message, 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'ログイン';
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('registerEmail').value;
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  
  if (!email || !username || !password) {
    showMessage('すべてのフィールドを入力してください。', 'error');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '登録中...';
  
  try {
    const result = await testAppAuth.register(email, username, password);
    
    if (result.success) {
      showMessage(result.message, 'success');
      // Switch to login tab
      switchAuthTab('login');
      // Clear form
      e.target.reset();
    } else {
      showMessage(result.message, 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '登録';
  }
}

function showMessage(message, type = 'info') {
  // Create or update message element
  let messageEl = document.getElementById('authMessage');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'authMessage';
    messageEl.className = 'auth-message';
    
    const authModal = document.querySelector('.auth-container');
    if (authModal) {
      authModal.insertBefore(messageEl, authModal.firstChild);
    }
  }
  
  messageEl.textContent = message;
  messageEl.className = `auth-message ${type}`;
  messageEl.style.display = 'block';
  
  // Hide after 5 seconds
  setTimeout(() => {
    if (messageEl) {
      messageEl.style.display = 'none';
    }
  }, 5000);
}

// Export for global use
window.testAppAuth = testAppAuth;