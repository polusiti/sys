/**
 * パスキー認証システム - WebAuthn実装
 * 安全で現代的なパスワードレス認証
 */

class PasskeyAuth {
    constructor() {
        this.currentUser = null;
        this.isWebAuthnSupported = this.checkWebAuthnSupport();
        this.rpId = window.location.hostname;
        this.rpName = "問題コメントシステム";
        
        // ローカルストレージでのユーザー管理
        this.users = this.loadUsers();
        
        console.log('🔐 パスキー認証システム初期化完了');
        console.log('🌐 WebAuthn対応:', this.isWebAuthnSupported);
    }
    
    // WebAuthn対応チェック
    checkWebAuthnSupport() {
        return window.PublicKeyCredential &&
               typeof window.PublicKeyCredential === "function" &&
               typeof navigator.credentials.create === "function" &&
               typeof navigator.credentials.get === "function";
    }
    
    // ユーザーデータ管理
    loadUsers() {
        try {
            const stored = localStorage.getItem('passkey_users');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('ユーザーデータ読み込みエラー:', error);
            return [];
        }
    }
    
    saveUsers() {
        try {
            localStorage.setItem('passkey_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('ユーザーデータ保存エラー:', error);
        }
    }
    
    // パスキー登録
    async registerPasskey(username, displayName) {
        if (!this.isWebAuthnSupported) {
            throw new Error('このブラウザはWebAuthnに対応していません');
        }
        
        if (!username || !displayName) {
            throw new Error('ユーザー名と表示名を入力してください');
        }
        
        try {
            console.log('📝 パスキー登録開始:', username);
            
            // ユーザーIDを生成（既存ユーザーをチェック）
            const existingUser = this.users.find(u => u.username === username);
            const userId = existingUser ? existingUser.id : this.generateUserId();
            
            // チャレンジを生成
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);
            
            // 認証子作成オプション
            const createCredentialOptions = {
                publicKey: {
                    rp: {
                        id: this.rpId,
                        name: this.rpName
                    },
                    user: {
                        id: this.stringToArrayBuffer(userId),
                        name: username,
                        displayName: displayName
                    },
                    challenge: challenge,
                    pubKeyCredParams: [
                        {
                            type: "public-key",
                            alg: -7 // ES256アルゴリズム
                        },
                        {
                            type: "public-key", 
                            alg: -257 // RS256アルゴリズム
                        }
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform", // 可能な限りプラットフォーム認証子を優先
                        userVerification: "preferred",
                        residentKey: "preferred"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            };
            
            console.log('📱 WebAuthn認証子作成中...');
            const credential = await navigator.credentials.create(createCredentialOptions);
            
            if (!credential) {
                throw new Error('認証子の作成に失敗しました');
            }
            
            // ユーザー情報を保存
            const userInfo = {
                id: userId,
                username: username,
                displayName: displayName,
                credentialId: this.arrayBufferToBase64(credential.rawId),
                publicKey: this.arrayBufferToBase64(credential.response.getPublicKey()),
                counter: credential.response.getAuthenticatorData ? 
                    this.getCounterFromAuthData(credential.response.getAuthenticatorData()) : 0,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };
            
            // 既存ユーザーを更新または新規追加
            if (existingUser) {
                const index = this.users.findIndex(u => u.id === userId);
                this.users[index] = userInfo;
            } else {
                this.users.push(userInfo);
            }
            
            this.saveUsers();
            console.log('✅ パスキー登録完了:', username);
            
            return userInfo;
            
        } catch (error) {
            console.error('❌ パスキー登録エラー:', error);
            throw new Error(`パスキー登録に失敗しました: ${error.message}`);
        }
    }
    
    // パスキー認証
    async authenticatePasskey(username = null) {
        if (!this.isWebAuthnSupported) {
            throw new Error('このブラウザはWebAuthnに対応していません');
        }
        
        try {
            console.log('🔐 パスキー認証開始');
            
            // チャレンジを生成
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);
            
            // 認証オプション
            const getCredentialOptions = {
                publicKey: {
                    challenge: challenge,
                    timeout: 60000,
                    rpId: this.rpId,
                    userVerification: "preferred"
                }
            };
            
            // 特定ユーザーの認証の場合
            if (username) {
                const user = this.users.find(u => u.username === username);
                if (user) {
                    getCredentialOptions.publicKey.allowCredentials = [{
                        type: "public-key",
                        id: this.base64ToArrayBuffer(user.credentialId)
                    }];
                }
            }
            
            console.log('🔍 認証チャレンジ実行中...');
            const assertion = await navigator.credentials.get(getCredentialOptions);
            
            if (!assertion) {
                throw new Error('認証に失敗しました');
            }
            
            // 認証されたユーザーを特定
            const credentialId = this.arrayBufferToBase64(assertion.rawId);
            const authenticatedUser = this.users.find(u => u.credentialId === credentialId);
            
            if (!authenticatedUser) {
                throw new Error('認証されたパスキーが見つかりません');
            }
            
            // 最終使用日時を更新
            authenticatedUser.lastUsed = new Date().toISOString();
            this.saveUsers();
            
            this.currentUser = authenticatedUser;
            console.log('✅ パスキー認証成功:', authenticatedUser.username);
            
            return authenticatedUser;
            
        } catch (error) {
            console.error('❌ パスキー認証エラー:', error);
            throw new Error(`パスキー認証に失敗しました: ${error.message}`);
        }
    }
    
    // ログアウト
    logout() {
        this.currentUser = null;
        console.log('👋 ログアウトしました');
    }
    
    // 現在のユーザー取得
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 登録済みユーザー一覧取得
    getRegisteredUsers() {
        return this.users.map(user => ({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            createdAt: user.createdAt,
            lastUsed: user.lastUsed
        }));
    }
    
    // ユーザー削除
    deleteUser(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
        
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = null;
        }
        
        console.log('🗑️ ユーザー削除完了');
    }
    
    // ユーティリティ関数
    generateUserId() {
        return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
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
    
    getCounterFromAuthData(authData) {
        // 簡易実装：実際はAuthenticatorDataを正しくパースする必要がある
        try {
            const dataView = new DataView(authData);
            return dataView.getUint32(authData.byteLength - 4, false);
        } catch {
            return 0;
        }
    }
    
    // デバイス情報取得
    async getDeviceInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString()
        };
        
        // 追加情報（利用可能な場合）
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                info.battery = {
                    level: battery.level,
                    charging: battery.charging
                };
            } catch (e) {
                // バッテリー情報が取得できない場合は無視
            }
        }
        
        return info;
    }
}

// パスキー認証システムのグローバルインスタンス
window.passkeyAuth = new PasskeyAuth();