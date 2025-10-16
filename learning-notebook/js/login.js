// API Base URL (本番環境用 - 必要に応じて変更してください)
const API_BASE_URL = 'https://data-manager-auth.t88596565.workers.dev';

// ==============================
// パスキー認証機能
// ==============================

// Base64URL エンコード/デコードヘルパー関数
function base64urlEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

// パスキー登録
async function handleRegister(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const displayName = document.getElementById('displayName').value.trim();
    const inquiryNumber = document.getElementById('inquiryNumber').value.trim();

    if (!userId || !displayName || !inquiryNumber) {
        alert('すべての項目を入力してください');
        return;
    }

    try {
        // 1. ユーザー登録
        const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, displayName, inquiryNumber })
        });

        const registerData = await registerResponse.json();
        if (!registerData.success) {
            alert(`登録エラー: ${registerData.error}`);
            return;
        }

        const internalUserId = registerData.user.id;

        // 2. パスキー登録開始
        const beginResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/register/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: internalUserId })
        });

        const options = await beginResponse.json();

        // 3. WebAuthn credentials作成
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

        // 4. パスキー登録完了
        const completeResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/register/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: internalUserId,
                credential: {
                    id: credential.id,
                    rawId: base64urlEncode(credential.rawId),
                    response: {
                        clientDataJSON: base64urlEncode(credential.response.clientDataJSON),
                        attestationObject: base64urlEncode(credential.response.attestationObject)
                    },
                    type: credential.type
                }
            })
        });

        const completeData = await completeResponse.json();
        if (completeData.success) {
            alert('パスキー登録が完了しました！ログインしてください。');
            showLoginForm();
        } else {
            alert(`パスキー登録エラー: ${completeData.error}`);
        }

    } catch (error) {
        console.error('Registration error:', error);
        alert(`エラーが発生しました: ${error.message}`);
    }
}

// パスキーログイン
async function handleLogin(event) {
    event.preventDefault();

    const userId = document.getElementById('loginUserId').value.trim();

    if (!userId) {
        alert('ユーザーIDを入力してください');
        return;
    }

    try {
        // 1. パスキーログイン開始
        const beginResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/begin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        const options = await beginResponse.json();
        if (options.error) {
            alert(`ログインエラー: ${options.error}`);
            return;
        }

        // 2. WebAuthn credentials取得
        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: base64urlDecode(options.challenge),
                rpId: options.rpId,
                allowCredentials: options.allowCredentials.map(cred => ({
                    id: base64urlDecode(cred.id),
                    type: cred.type
                })),
                userVerification: options.userVerification,
                timeout: options.timeout
            }
        });

        // 3. パスキーログイン完了
        const completeResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                assertion: {
                    id: assertion.id,
                    rawId: base64urlEncode(assertion.rawId),
                    response: {
                        clientDataJSON: base64urlEncode(assertion.response.clientDataJSON),
                        authenticatorData: base64urlEncode(assertion.response.authenticatorData),
                        signature: base64urlEncode(assertion.response.signature),
                        userHandle: assertion.response.userHandle ? base64urlEncode(assertion.response.userHandle) : null
                    },
                    type: assertion.type
                }
            })
        });

        const completeData = await completeResponse.json();
        if (completeData.success) {
            // セッショントークンを保存
            localStorage.setItem('sessionToken', completeData.sessionToken);
            localStorage.setItem('currentUser', JSON.stringify(completeData.user));

            alert(`ようこそ、${completeData.user.displayName}さん！`);
            window.location.href = 'subject-select.html';
        } else {
            alert(`ログインエラー: ${completeData.error}`);
        }

    } catch (error) {
        console.error('Login error:', error);
        alert(`エラーが発生しました: ${error.message}`);
    }
}

// ゲストログイン (セッショントークンなし)
function guestLogin() {
    const userData = {
        id: 'guest',
        userId: 'guest',
        displayName: 'ゲスト',
        isGuest: true
    };

    localStorage.setItem('currentUser', JSON.stringify(userData));
    window.location.href = 'subject-select.html';
}

// フォーム切り替え
function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// ページ読み込み時にログイン状態をチェック
window.addEventListener('DOMContentLoaded', async () => {
    const sessionToken = localStorage.getItem('sessionToken');

    if (sessionToken) {
        // セッションが有効か確認
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                localStorage.setItem('currentUser', JSON.stringify(userData));
                window.location.href = 'subject-select.html';
                return;
            }
        } catch (error) {
            console.error('Session check error:', error);
        }

        // セッション無効なら削除
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');
    }
});
