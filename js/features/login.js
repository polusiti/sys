// Fixed login.js with better error handling for email constraint issue
// API Base URL (統一エンドポイント)
const API_BASE_URL = 'https://api.allfrom0.top';

// Admin token for API access
const getAdminToken = () => {
    return localStorage.getItem('questa_admin_token') || 'questa-admin-2024';
};

// ==============================
// パスキー認証機能
// ==============================

// Base64URL エンコード/デコードヘルパー関数
function base64urlEncode(buffer) {
    // null値とundefined値を安全に処理
    if (buffer === null || buffer === undefined) {
        return '';
    }

    try {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (error) {
        console.error('❌ base64urlEncode error:', error);
        return '';
    }
}

function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// FIXED: パスキー登録 - 複数のemail戦略で対応
async function handleRegister(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const displayName = document.getElementById('displayName').value.trim();
    const secretAnswer = document.getElementById('secretAnswer').value.trim();

    if (!userId || !displayName || !secretAnswer) {
        alert('すべての項目を入力してください');
        return;
    }

    // 自動email生成（プライバシー保護）
    const autoEmail = `${userId}@secure.learning-notebook.local`;
    console.log('Generated email:', autoEmail);

    // お問い合わせ番号を生成
    const encoder = new TextEncoder();
    const data = encoder.encode(secretAnswer.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const inquiryNumber = parseInt(hashHex.substring(0, 6), 16) % 1000000;
    const inquiryNumberString = inquiryNumber.toString().padStart(6, '0');

    try {
        // STRATEGY 1: Try with email field first
        let registerResponse = await tryRegister(userId, displayName, autoEmail, inquiryNumberString);

        if (!registerResponse.ok) {
            const errorData = await registerResponse.json();

            // STRATEGY 2: If email constraint error, try without email
            if (errorData.details && errorData.details.includes('NOT NULL constraint failed: users.email')) {
                console.log('🔧 Email constraint detected, trying alternative approach...');

                // Try with empty email
                registerResponse = await tryRegister(userId, displayName, '', inquiryNumberString);

                if (!registerResponse.ok) {
                    const errorData2 = await registerResponse.json();

                    // STRATEGY 3: Try with null-like email
                    if (errorData2.details && errorData2.details.includes('NOT NULL constraint failed')) {
                        registerResponse = await tryRegister(userId, displayName, 'NULL', inquiryNumberString);
                    }
                }
            }

            // STRATEGY 4: Try with different field names
            if (!registerResponse.ok) {
                const errorData3 = await registerResponse.json();
                if (errorData3.details && errorData3.details.includes('NOT NULL constraint failed')) {
                    // Try without email field entirely
                    registerResponse = await tryRegisterWithoutEmail(userId, displayName, inquiryNumberString);
                }
            }
        }

        const registerData = await registerResponse.json();

        if (!registerData.success) {
            if (registerData.error.includes('既に使用されています')) {
                alert('このユーザーID、表示名、またはお問い合わせ番号は既に使用されています。\n別の値でお試しください。');
            } else {
                alert(`登録エラー: ${registerData.error}\n詳細: ${registerData.details || '不明'}`);
            }
            return;
        }

        const internalUserId = registerData.user?.id || registerData.userId;

        // パスキー登録開始
        const beginResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/register/begin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                userId: internalUserId
            })
        });

        const options = await beginResponse.json();

        // WebAuthn credentials作成
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: base64urlDecode(options.challenge),
                rp: options.rp,
                user: {
                    id: base64urlDecode(options.user.id),
                    name: options.user.name,
                    displayName: options.user.displayName
                },
                pubKeyCredParams: options.pubKeyCredParams,
                authenticatorSelection: options.authenticatorSelection,
                timeout: options.timeout,
                attestation: options.attestation
            }
        });

        // パスキー登録完了
        // 認証データを安全に処理
        const safeAttestationObject = base64urlEncode(credential.response.attestationObject);

        const completeResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/register/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                userId: internalUserId,
                credential: {
                    id: credential.id,
                    rawId: base64urlEncode(credential.rawId),
                    response: {
                        clientDataJSON: base64urlEncode(credential.response.clientDataJSON),
                        attestationObject: safeAttestationObject
                    },
                    type: credential.type
                },
                challenge: options.challenge
            })
        });

        const completeData = await completeResponse.json();
        if (completeData.success) {
            alert(`パスキー登録が完了しました！\n\n秘密の質問の答えは忘れないようにしてください。\nデバイス紛失時の本人確認に使用します。\n\nログインしてください。`);
            showLoginForm();
        } else {
            alert(`パスキー登録エラー: ${completeData.error}`);
        }

    } catch (error) {
        console.error('❌ Registration error:', error);

        // モバイル固有のエラーハンドリング
        if (error.message && error.message.includes('base64urlEncode')) {
            alert('モバイルデバイスでの登録に問題が発生しました。\n\nこれはデバイス固有の制限です。しばらくして再度お試しください。\n\n詳細: ' + error.message);
            return;
        }

        handleRegistrationError(error);
    }
}

// HELPER: Try registration with specific parameters
async function tryRegister(userId, displayName, email, inquiryNumber) {
    const requestData = {
        userId,
        displayName,
        inquiryNumber
    };

    // Only add email if it's provided and not empty string
    if (email && email !== '' && email !== 'NULL') {
        requestData.email = email;
    }

    const debugInfo = {
        timestamp: new Date().toISOString(),
        url: `${API_BASE_URL}/api/auth/register`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAdminToken()}`,
            'Accept': 'application/json'
        },
        body: requestData
    };

    console.log('🔍 API Request Debug Info:', debugInfo);
    localStorage.setItem('lastApiRequest', JSON.stringify(debugInfo));

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: debugInfo.headers,
        body: JSON.stringify(requestData)
    });

    const responseDebugInfo = {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        url: response.url
    };

    console.log('📥 API Response Debug Info:', responseDebugInfo);
    localStorage.setItem('lastApiResponse', JSON.stringify(responseDebugInfo));

    return response;
}

// HELPER: Try registration without email field
async function tryRegisterWithoutEmail(userId, displayName, inquiryNumber) {
    const requestData = {
        userId,
        displayName,
        inquiryNumber
    };

    const debugInfo = {
        timestamp: new Date().toISOString(),
        url: `${API_BASE_URL}/api/auth/register`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAdminToken()}`,
            'Accept': 'application/json'
        },
        body: requestData,
        strategy: 'no_email_field'
    };

    console.log('🔍 API Request (No Email Field):', debugInfo);

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: debugInfo.headers,
        body: JSON.stringify(requestData)
    });

    console.log('📥 API Response (No Email Field):', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
    });

    return response;
}

// Enhanced error handler
function handleRegistrationError(error) {
    // 500エラーの特別処理
    if (error.message.includes('500') || (error.message.includes('Failed to fetch') && navigator.onLine)) {
        const debugInfo = localStorage.getItem('lastApiResponse');
        console.log('📋 Last API Response:', debugInfo);

        alert('サーバーで一時的なエラーが発生しています。\n\nこれはブラウザ固有の問題です。\n以下の対策をお試しください：\n\n1. ページを更新（F5またはCtrl+R）\n2. ブラウザのキャッシュをクリア\n3. シークレットモードで試す\n4. 異なるブラウザで試す\n\n詳細はコンソールを確認してください。');
        return;
    }

    if (error.message.includes('Failed to fetch')) {
        alert('サーバーに接続できません。\nネットワーク接続を確認して再度お試しください。');
    } else {
        alert(`登録中にエラーが発生しました。\n時間をおいて再度お試しください。\n\n詳細: ${error.message}`);
    }
}

// 既存のログイン関数（変更なし）
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();

    if (!username) {
        alert('ユーザー名を入力してください');
        return;
    }

    try {
        // パスキーログイン開始
        const beginResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/begin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                username: username
            })
        });

        const options = await beginResponse.json();

        // WebAuthn credentials取得
        const credential = await navigator.credentials.get({
            publicKey: {
                challenge: base64urlDecode(options.challenge),
                allowCredentials: options.allowCredentials,
                userVerification: options.userVerification,
                timeout: options.timeout
            }
        });

        // パスキーログイン完了
        // userHandleを安全に処理（モバイル実機でnullの場合があるため）
        const userHandle = credential.response.userHandle;
        const safeUserHandle = base64urlEncode(userHandle);

        // デバッグ情報
        if (userHandle === null || userHandle === undefined) {
            console.log('🔍 Mobile device detected - userHandle is null/undefined');
            console.log('📱 UserHandle info:', {
                type: typeof userHandle,
                value: userHandle,
                length: userHandle ? userHandle.length : 'N/A'
            });
        } else {
            console.log('✅ UserHandle available:', safeUserHandle.substring(0, 20) + '...');
        }

        const completeResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                username: username,
                credential: {
                    id: credential.id,
                    rawId: base64urlEncode(credential.rawId),
                    response: {
                        clientDataJSON: base64urlEncode(credential.response.clientDataJSON),
                        authenticatorData: base64urlEncode(credential.response.authenticatorData),
                        signature: base64urlEncode(credential.response.signature),
                        userHandle: safeUserHandle
                    },
                    type: credential.type
                },
                challenge: options.challenge
            })
        });

        const completeData = await completeResponse.json();

        if (completeData.success) {
            alert('ログインしました！');
            // ユーザー情報をlocalStorageに保存
            const userInfo = {
                username: username,
                displayName: username, // APIから取得するか、仮の値
                isGuest: false
            };
            localStorage.setItem('currentUser', JSON.stringify(userInfo));

            // ログイン成功後の処理
            window.location.href = '../pages/subject-select.html';
        } else {
            alert(`ログインエラー: ${completeData.error}`);
        }

    } catch (error) {
        console.error('❌ Login error:', error);

        // モバイル固有のエラーハンドリング
        if (error.message && error.message.includes('base64urlEncode')) {
            alert('モバイルデバイスでの認証に問題が発生しました。\n\nこれはデバイス固有の制限です。しばらくして再度お試しください。\n\n詳細: ' + error.message);
            return;
        }

        if (error.name === 'NotAllowedError') {
            alert('認証がキャンセルされました。\n再度お試しください。');
        } else if (error.name === 'InvalidStateError') {
            alert('このユーザーはまだ登録されていません。\n先に登録してください。');
        } else if (error.message && error.message.includes('Failed to fetch')) {
            alert('サーバーに接続できません。\nネットワーク接続を確認して再度お試しください。');
        } else {
            alert(`ログイン中にエラーが発生しました。\n詳細: ${error.message}`);
        }
    }
}

// UI表示関数
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';

    console.log('✅ Showing login form');
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';

    console.log('✅ Showing register form');
}

// イベントリスナー登録
document.addEventListener('DOMContentLoaded', function() {
    // 登録フォーム
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // ログインフォーム
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // フォーム切り替えリンク
    const showLoginLink = document.getElementById('show-login');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', showLoginForm);
    }

    const showRegisterLink = document.getElementById('show-register');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', showRegisterForm);
    }
});

// ==============================
// ゲストログイン機能
// ==============================

function guestLogin() {
    console.log('🎯 Guest login initiated');

    try {
        // ゲストユーザーオブジェクトを作成
        const guestUser = {
            username: 'guest',
            displayName: 'ゲスト',
            isGuest: true,
            loginTime: new Date().toISOString()
        };

        console.log('👤 Creating guest user:', guestUser);

        // localStorageにゲストユーザー情報を保存
        localStorage.setItem('currentUser', JSON.stringify(guestUser));

        console.log('✅ Guest user saved to localStorage');

        // 学習ページにリダイレクト
        window.location.href = 'pages/subject-select.html';

    } catch (error) {
        console.error('❌ Guest login error:', error);
        alert('ゲストログインに失敗しました。時間をおいて再度お試しください。');
    }
}

// Export functions for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleRegister,
        handleLogin,
        guestLogin,
        showLoginForm,
        showRegisterForm
    };
}