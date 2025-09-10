// Enhanced Authentication System with WebAuthn Support
// File: example/auth/auth-enhanced.js

class TestAppAuth {
  constructor() {
    this.token = localStorage.getItem('testapp_auth_token');
    this.user = JSON.parse(localStorage.getItem('testapp_user_data') || 'null');
    this.isAuthenticated = !!this.token;
    this.apiBase = 'https://testapp-auth.t88596565.workers.dev/api'; // Production API
    
    // WebAuthn settings
    this.rpId = window.location.hostname === '' ? 'localhost' : window.location.hostname;
    this.rpName = "TestApp認証システム";
    this.webAuthnCredentials = JSON.parse(localStorage.getItem('webauthn_credentials') || '[]');
    this.webAuthnSupported = this.checkWebAuthnSupport();
    
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
    
    // Check for existing WebAuthn credentials
    this.checkExistingWebAuthnCredentials();
  }
  
  // ========== WebAuthn Support Methods ==========
  
  checkWebAuthnSupport() {
    const isSupported = window.PublicKeyCredential && 
                      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
    return isSupported;
  }
  
  checkExistingWebAuthnCredentials() {
    if (this.webAuthnCredentials.length > 0) {
      console.log(`✅ ${this.webAuthnCredentials.length}個のWebAuthn認証情報が見つかりました`);
    }
  }
  
  async registerWebAuthn(email, username) {
    try {
      if (!this.webAuthnSupported) {
        return { success: false, message: 'このブラウザはWebAuthnに対応していません' };
      }
      
      console.log(`🔄 WebAuthn登録開始: ${username}`);
      
      // ユーザーID生成
      const userId = this.generateUserId();
      
      // チャレンジ生成
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      // WebAuthn 認証子作成オプション
      const createOptions = {
        publicKey: {
          rp: {
            id: this.rpId,
            name: this.rpName,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: email,
            displayName: username,
          },
          challenge: challenge,
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: window.location.protocol === 'file:' ? "cross-platform" : "platform",
            userVerification: "preferred"
          },
          timeout: 60000,
          attestation: "direct"
        }
      };
      
      console.log('📝 WebAuthn認証子作成中...');
      
      const credential = await navigator.credentials.create(createOptions);
      
      if (credential) {
        // 認証情報を保存
        const credentialData = {
          id: credential.id,
          userId: userId,
          username: username,
          email: email,
          publicKey: this.arrayBufferToBase64(credential.response.publicKey),
          createdAt: new Date().toISOString()
        };
        
        this.webAuthnCredentials.push(credentialData);
        localStorage.setItem('webauthn_credentials', JSON.stringify(this.webAuthnCredentials));
        
        // 自動的にユーザーセッション作成
        this.user = {
          id: userId,
          username: username,
          email: email,
          loginTime: new Date().toISOString(),
          authMethod: 'webauthn'
        };
        
        this.isAuthenticated = true;
        localStorage.setItem('testapp_user_data', JSON.stringify(this.user));
        
        this.updateUI();
        
        console.log(`✅ WebAuthn登録成功: ${username}`);
        return { 
          success: true, 
          message: `🎉 "${username}" のパスキー登録が完了しました！`,
          authMethod: 'webauthn'
        };
        
      } else {
        throw new Error('認証子の作成に失敗しました');
      }
      
    } catch (error) {
      console.error('WebAuthn registration error:', error);
      return { 
        success: false, 
        message: `WebAuthn登録に失敗しました: ${error.message}` 
      };
    }
  }
  
  async authenticateWebAuthn() {
    try {
      if (!this.webAuthnSupported) {
        return { success: false, message: 'このブラウザはWebAuthnに対応していません' };
      }
      
      if (this.webAuthnCredentials.length === 0) {
        return { 
          success: false, 
          message: '登録されたパスキーがありません。まず登録を行ってください。' 
        };
      }
      
      console.log('🔄 WebAuthn認証開始...');
      
      // チャレンジ生成
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const getOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: this.webAuthnCredentials.map(cred => ({
            id: this.base64ToArrayBuffer(cred.id),
            type: 'public-key'
          })),
          userVerification: "preferred",
          timeout: 60000
        }
      };
      
      console.log('🔐 WebAuthn認証実行中...');
      
      const assertion = await navigator.credentials.get(getOptions);
      
      if (assertion) {
        // 認証成功 - ユーザー情報を取得
        const credId = this.arrayBufferToBase64(assertion.rawId);
        const matchedCred = this.webAuthnCredentials.find(cred => cred.id === credId);
        
        if (matchedCred) {
          this.user = {
            id: matchedCred.userId,
            username: matchedCred.username,
            email: matchedCred.email,
            loginTime: new Date().toISOString(),
            authMethod: 'webauthn'
          };
          
          this.isAuthenticated = true;
          localStorage.setItem('testapp_user_data', JSON.stringify(this.user));
          
          this.updateUI();
          this.migrateLocalProgress();
          
          console.log(`✅ WebAuthn認証成功: ${matchedCred.username}`);
          return { 
            success: true, 
            message: `🎉 "${matchedCred.username}" でログインしました！`,
            authMethod: 'webauthn'
          };
        } else {
          throw new Error('認証情報が見つかりません');
        }
      } else {
        throw new Error('認証に失敗しました');
      }
      
    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      return { 
        success: false, 
        message: `WebAuthn認証に失敗しました: ${error.message}` 
      };
    }
  }
  
  // ========== Original Methods (Enhanced) ==========
  
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
        return { 
          success: true, 
          message: data.message,
          requiresVerification: data.requiresVerification || false,
          email: data.email,
          authMethod: 'traditional'
        };
      } else {
        return { 
          success: false, 
          message: data.error || '登録に失敗しました。',
          passwordStrength: data.passwordStrength,
          authMethod: 'traditional'
        };
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
        this.user.authMethod = 'traditional';
        this.isAuthenticated = true;
        
        localStorage.setItem('testapp_auth_token', this.token);
        localStorage.setItem('testapp_user_data', JSON.stringify(this.user));
        
        this.updateUI();
        this.migrateLocalProgress();
        
        return { 
          success: true, 
          message: 'ログイン成功！',
          authMethod: 'traditional'
        };
      } else {
        return { 
          success: false, 
          message: data.error || 'ログインに失敗しました。',
          requiresVerification: data.requiresVerification || false,
          email: data.email,
          authMethod: 'traditional'
        };
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
  
  // ========== Progress Management (Unchanged) ==========
  
  async saveProgress(subject, score, totalQuestions, duration = 0) {
    if (!this.isAuthenticated) {
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
        best_score: data.correct
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
        }
      }
    }
  }
  
  // ========== UI Management (Enhanced) ==========
  
  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (this.isAuthenticated && this.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        if (userName) {
          const authIcon = this.user.authMethod === 'webauthn' ? '🔐' : '🔑';
          userName.textContent = `${authIcon} ${this.user.username}`;
        }
      }
      
      this.updateHeroSection();
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
    
    // WebAuthn状態表示
    this.updateWebAuthnStatus();
  }
  
  updateWebAuthnStatus() {
    const webAuthnStatus = document.getElementById('webAuthnStatus');
    if (webAuthnStatus) {
      if (this.webAuthnSupported) {
        webAuthnStatus.innerHTML = '✅ パスキー認証対応';
        webAuthnStatus.className = 'webauthn-supported';
      } else {
        webAuthnStatus.innerHTML = '❌ パスキー認証非対応';
        webAuthnStatus.className = 'webauthn-unsupported';
      }
    }
  }
  
  updateHeroSection() {
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && this.user) {
      const authMethod = this.user.authMethod === 'webauthn' ? 'パスキー' : 'パスワード';
      heroSubtitle.innerHTML = `こんにちは、${this.user.username}さん！<br>${authMethod}認証でログイン中です。`;
    }
  }
  
  // ========== Email Verification (Unchanged) ==========
  
  async verifyEmail(email, code) {
    try {
      const response = await fetch(`${this.apiBase}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'メール確認に失敗しました。' };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, message: 'ネットワークエラーが発生しました。' };
    }
  }
  
  async resendVerification(email) {
    try {
      const response = await fetch(`${this.apiBase}/auth/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || '確認コードの再送信に失敗しました。' };
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: 'ネットワークエラーが発生しました。' };
    }
  }
  
  // ========== Modal Management ==========
  
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
  
  // ========== Utility Methods ==========
  
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  // ========== WebAuthn Management Methods ==========
  
  getWebAuthnCredentials() {
    return this.webAuthnCredentials;
  }
  
  removeWebAuthnCredential(credentialId) {
    this.webAuthnCredentials = this.webAuthnCredentials.filter(cred => cred.id !== credentialId);
    localStorage.setItem('webauthn_credentials', JSON.stringify(this.webAuthnCredentials));
  }
  
  clearAllWebAuthnCredentials() {
    this.webAuthnCredentials = [];
    localStorage.removeItem('webauthn_credentials');
  }
}

// Initialize authentication system
const testAppAuth = new TestAppAuth();