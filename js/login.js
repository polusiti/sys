// API Base URL (D1ワーカー用エンドポイント)
const API_BASE_URL = 'https://testapp-d1-api.t88596565.workers.dev';

// Admin token for API access
const getAdminToken = () => {
    // ローカルストレージからトークンを取得、なければ固定トークンを使用
    return localStorage.getItem('questa_admin_token') || 'questa-admin-2024';
};

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

// パスキー登録 - email自動生成付き
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

    try {
        // お問い合わせ番号を生成（秘密の質問の答えから6桁の数字を生成）
        const encoder = new TextEncoder();
        const data = encoder.encode(secretAnswer.toLowerCase()); // 大文字小文字を統一
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        // ハッシュの最初の6文字を使って6桁の数字を生成
        const inquiryNumber = parseInt(hashHex.substring(0, 6), 16) % 1000000;
        const inquiryNumberString = inquiryNumber.toString().padStart(6, '0');

        // 1. ユーザー登録（お問い合わせ番号を送信）
        const requestData = {
            userId,
            displayName,
            email: autoEmail,  // 自動生成したemail
            inquiryNumber: inquiryNumberString
        };
        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAdminToken()}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        // デバッグ情報をコンソールとlocalStorageに保存
        const debugInfo = {
            timestamp: new Date().toISOString(),
            url: `${API_BASE_URL}/api/auth/register`,
            method: 'POST',
            headers: requestHeaders,
            body: requestData,
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            referer: document.referrer
        };

        console.log('🔍 API Request Debug Info:', debugInfo);
        localStorage.setItem('lastApiRequest', JSON.stringify(debugInfo));

        const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestData)
        });

        const registerData = await registerResponse.json();

        // レスポンス情報を記録
        const responseDebugInfo = {
            timestamp: new Date().toISOString(),
            status: registerResponse.status,
            statusText: registerResponse.statusText,
            headers: Object.fromEntries(registerResponse.headers.entries()),
            data: registerData,
            requestUrl: `${API_BASE_URL}/api/auth/register`
        };

        console.log('📥 API Response Debug Info:', responseDebugInfo);
        localStorage.setItem('lastApiResponse', JSON.stringify(responseDebugInfo));

        if (!registerData.success) {
            if (registerData.error.includes('既に使用されています')) {
                alert('このユーザーID、表示名、またはお問い合わせ番号は既に使用されています。\n別の値でお試しください。');
            } else {
                alert(`登録エラー: ${registerData.error}\n時間をおいて再度お試しください。`);
            }
            return;
        }

        const internalUserId = registerData.user.id;

        // 2. パスキー登録開始
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
                        attestationObject: base64urlEncode(credential.response.attestationObject)
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
        console.error('Registration error:', error);

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
}

// パスキーログイン
async function handleLogin(event) {
    event.preventDefault();

    try {
        // 1. パスキーログイン開始（ユーザーID不要）
        const beginResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/begin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({})
        });

        const options = await beginResponse.json();
        if (options.error) {
            alert(`ログインエラー: ${options.error}`);
            return;
        }

        // 2. WebAuthn credentials取得（allowCredentialsなし = すべてのパスキー）
        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: base64urlDecode(options.challenge),
                rpId: options.rpId,
                userVerification: options.userVerification || 'preferred',
                timeout: options.timeout || 60000
            }
        });

        // 3. パスキーログイン完了（userHandleでユーザー識別）
        const completeResponse = await fetch(`${API_BASE_URL}/api/auth/passkey/login/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({
                credential: {
                    id: assertion.id,
                    rawId: base64urlEncode(assertion.rawId),
                    response: {
                        clientDataJSON: base64urlEncode(assertion.response.clientDataJSON),
                        authenticatorData: base64urlEncode(assertion.response.authenticatorData),
                        signature: base64urlEncode(assertion.response.signature),
                        userHandle: assertion.response.userHandle ? base64urlEncode(assertion.response.userHandle) : null
                    },
                    type: assertion.type
                },
                challenge: options.challenge
            })
        });

        const completeData = await completeResponse.json();
        if (completeData.success) {
            // セッショントークンを保存
            localStorage.setItem('sessionToken', completeData.token);
            localStorage.setItem('currentUser', JSON.stringify(completeData.user));

            alert(`ようこそ、${completeData.user.displayName}さん！`);
            window.location.href = '/pages/subject-select.html';
        } else {
            alert(`ログインエラー: ${completeData.error}`);
        }

    } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('Failed to fetch')) {
            alert('サーバーに接続できません。\nネットワーク接続を確認して再度お試しください。');
        } else {
            alert(`ログイン中にエラーが発生しました。\n時間をおいて再度お試しください。\n\n詳細: ${error.message}`);
        }
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
    window.location.href = '/pages/subject-select.html';
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
                window.location.href = '/pages/subject-select.html';
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
