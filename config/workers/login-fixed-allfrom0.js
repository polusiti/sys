/**
 * Fixed login.js for allfrom0.top with proper API endpoints and guest login
 */

// API Base URL for allfrom0.top
const API_BASE_URL = 'https://api.allfrom0.top';

// Admin token for API access
const getAdminToken = () => {
    return 'questa-admin-2024';
};

// ==============================
// ゲストログイン機能
// ==============================

async function handleGuestLogin() {
    try {
        if (typeof window.triggerGuestLogin === 'function') {
            const result = await window.triggerGuestLogin();
            if (!result?.success) {
                throw new Error(result?.error || 'ゲストログインに失敗しました');
            }
        } else {
            throw new Error('authManagerが初期化されていません');
        }

        if (window.apiClient && typeof window.apiClient.setAdminToken === 'function') {
            window.apiClient.setAdminToken(getAdminToken());
        } else {
            localStorage.setItem('questa_admin_token', getAdminToken());
        }

        showNotification('ゲストログインしました', 'success');

        setTimeout(() => {
            window.location.href = '/pages/subject-select.html';
        }, 1500);

    } catch (error) {
        console.error('Guest login error:', error);
        showNotification(error.message || 'ゲストログインに失敗しました', 'error');
    }
}

// ==============================
// 通知機能
// ==============================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' :
          type === 'error' ? 'background: #ef4444;' :
          'background: #3b82f6;'}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==============================
// パスキー認証機能（オプション）
// ==============================

async function handlePasskeyLogin() {
    if (!window.PublicKeyCredential) {
        showNotification('このブラウザはパスキーに対応していません', 'error');
        return;
    }

    try {
        showNotification('パスキー認証を開始します...', 'info');

        const response = await fetch(`${API_BASE_URL}/api/auth/passkey/login/begin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                username: document.getElementById('username')?.value || 'P37600'
            })
        });

        if (!response.ok) {
            throw new Error('パスキー認証開始に失敗しました');
        }

        const credentialRequestOptions = await response.json();

        // パスキー認証
        const credential = await navigator.credentials.get({
            publicKey: credentialRequestOptions
        });

        showNotification('認証中...', 'info');

        const completeResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                credentialId: credential.id,
                response: {
                    authenticatorData: base64urlEncode(credential.response.authenticatorData),
                    clientDataJSON: base64urlEncode(credential.response.clientDataJSON),
                    signature: base64urlEncode(credential.response.signature),
                    userHandle: base64urlEncode(credential.response.userHandle)
                }
            })
        });

        if (!completeResponse.ok) {
            throw new Error('パスキー認証に失敗しました');
        }

        const result = await completeResponse.json();

        if (result.success) {
            // ユーザー情報を保存
            const userData = {
                username: result.user.username,
                email: result.user.email,
                isAdmin: true,
                loginTime: new Date().toISOString()
            };

            if (typeof window.establishSession === 'function') {
                window.establishSession(userData);
            }

            if (window.apiClient && typeof window.apiClient.setAdminToken === 'function') {
                window.apiClient.setAdminToken(getAdminToken());
            } else {
                localStorage.setItem('questa_admin_token', getAdminToken());
            }

            showNotification('管理者認証成功！', 'success');

            setTimeout(() => {
                window.location.href = '/mana';
            }, 1500);
        } else {
            throw new Error('認証に失敗しました');
        }

    } catch (error) {
        console.error('Passkey login error:', error);
        showNotification('パスキー認証に失敗しました: ' + error.message, 'error');
    }
}

// ==============================
// Base64URLヘルパー
// ==============================

function base64urlEncode(data) {
    if (!data) return '';

    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// ==============================
// DOM読み込み時の初期化
// ==============================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔐 Login system initialized for allfrom0.top');

    // ゲストログインボタン
    const guestLoginBtn = document.getElementById('guest-login-btn');
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', handleGuestLogin);
    }

    // パスキーログインボタン
    const passkeyLoginBtn = document.getElementById('passkey-login-btn');
    if (passkeyLoginBtn) {
        passkeyLoginBtn.addEventListener('click', handlePasskeyLogin);
    }

    // フォーム送信処理
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePasskeyLogin();
        });
    }

    // 既にログインしている場合はリダイレクト
    if (window.authReady) {
        await window.authReady;
    }

    const currentUser = typeof window.getCurrentUser === 'function'
        ? window.getCurrentUser()
        : null;

    if (currentUser) {
        if (currentUser.isAdmin) {
            window.location.href = '/mana';
        } else {
            window.location.href = '/pages/subject-select.html';
        }
    }
});

// CSSアニメーション追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
