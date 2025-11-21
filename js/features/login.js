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

// パスキー登録 - シンプル化版
async function handleRegister(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const displayName = document.getElementById('displayName').value.trim();
    const secretAnswer = document.getElementById('secretAnswer').value.trim();

    if (!userId || !displayName || !secretAnswer) {
        alert('すべての項目を入力してください');
        return;
    }

    // お問い合わせ番号を生成（秘密の質問の答えから）
    const encoder = new TextEncoder();
    const data = encoder.encode(secretAnswer.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const inquiryNumber = parseInt(hashHex.substring(0, 6), 16) % 1000000;
    const inquiryNumberString = inquiryNumber.toString().padStart(6, '0');

    try {
        // ユーザー登録（emailフィールドは送らない - NULL許可のため）
        const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userId,
                displayName,
                inquiryNumber: inquiryNumberString
            })
        });

        const registerData = await registerResponse.json();

        if (!registerData.success) {
            if (registerData.error && registerData.error.includes('既に使用されています')) {
                alert('このユーザーIDは既に使用されています。\n別のIDでお試しください。');
            } else {
                alert(`登録エラー: ${registerData.error || '不明なエラー'}\n詳細: ${registerData.details || ''}`);
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
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    requireResidentKey: false,
                    userVerification: 'required',
                    ...options.authenticatorSelection
                },
                timeout: options.timeout || 120000, // スマホ用に2分に延長
                attestation: 'direct'
            }
        });

        // パスキー登録完了
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
        if (error.name === 'NotAllowedError') {
            alert('パスキー登録がキャンセルされました。\n\nブラウザの設定で生体認証を許可してください。\n\nAndroid: 設定 > Google > パスワードとアカウント\niPhone: 設定 > Face IDとパスコード');
            return;
        } else if (error.name === 'NotSupportedError') {
            alert('このデバイスではパスキーがサポートされていません。\n\nゲストとしてご利用いただくか、パスワード認証をお試しください。');
            return;
        } else if (error.name === 'SecurityError') {
            alert('セキュリティエラーが発生しました。\n\nHTTPS接続でアクセスしているか確認してください。\n\n詳細: ' + error.message);
            return;
        } else if (error.message && error.message.includes('base64urlEncode')) {
            alert('モバイルデバイスでの登録に問題が発生しました。\n\nこれはデバイス固有の制限です。\n\n解決策:\n1. ブラウザを最新バージョンに更新\n2. 別のブラウザ（Chrome, Firefox, Safari）を試す\n3. ページを更新して再度実行');
            return;
        }

        // その他のエラー
        alert(`登録中にエラーが発生しました。\n時間をおいて再度お試しください。\n\n詳細: ${error.message || '不明なエラー'}`);
    }
}
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
                userVerification: 'required',
                timeout: options.timeout || 120000 // スマホ用に2分に延長
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

            const userInfo = completeData.user || {
                username,
                displayName: username,
                isGuest: false
            };

            if (typeof window.establishSession === 'function') {
                window.establishSession({
                    ...userInfo,
                    username: userInfo.username || username,
                    displayName: userInfo.displayName || username,
                    isGuest: false
                });
            }

            window.location.href = 'subject-select.html';
        } else {
            alert(`ログインエラー: ${completeData.error}`);
        }

    } catch (error) {
        console.error('❌ Login error:', error);

        // モバイル固有のエラーハンドリングを改善
        if (error.name === 'NotAllowedError') {
            alert('生体認証がキャンセルされました。\n\nブラウザの設定で生体認証を許可してください。\n\nAndroid: 設定 > Google > パスワードとアカウント\niPhone: 設定 > Face IDとパスコード');
            return;
        } else if (error.name === 'InvalidStateError') {
            alert('このユーザーはまだ登録されていません。\n\n先に新規登録を行ってください。');
            return;
        } else if (error.name === 'NotSupportedError') {
            alert('このデバイスではパスキーがサポートされていません。\n\nゲストとしてご利用いただくか、別の認証方法をお試しください。');
            return;
        } else if (error.name === 'SecurityError') {
            alert('セキュリティエラーが発生しました。\n\nHTTPS接続でアクセスしているか確認してください。\n\n詳細: ' + error.message);
            return;
        } else if (error.message && error.message.includes('base64urlEncode')) {
            alert('モバイルデバイスでの認証に問題が発生しました。\n\nこれはデバイス固有の制限です。\n\n解決策:\n1. ブラウザを最新バージョンに更新\n2. 別のブラウザ（Chrome, Firefox, Safari）を試す\n3. ページを更新して再度実行');
            return;
        } else if (error.message && error.message.includes('Failed to fetch')) {
            alert('サーバーに接続できません。\n\nネットワーク接続を確認して再度お試しください。\n\nまたは時間をおいてから再度アクセスしてください。');
            return;
        } else {
            alert(`ログイン中にエラーが発生しました。\n\nエラー: ${error.name}\n詳細: ${error.message}\n\n時間をおいて再度お試しください。`);
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

async function guestLogin() {
    console.log('🎯 Guest login initiated');

    try {
        if (typeof window.triggerGuestLogin === 'function') {
            const result = await window.triggerGuestLogin();
            if (!result?.success) {
                throw new Error(result?.error || 'ゲストログインに失敗しました');
            }
        }

        window.location.href = 'subject-select.html';
    } catch (error) {
        console.error('❌ Guest login error:', error);
        alert(error.message || 'ゲストログインに失敗しました。時間をおいて再度お試しください。');
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
