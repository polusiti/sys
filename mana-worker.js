/**
 * Mana Dashboard Worker for allfrom0.top/mana
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Handle Turnstile verification endpoint
        if (url.pathname === '/api/verify-turnstile' && request.method === 'POST') {
            return await handleTurnstileVerification(request, env, corsHeaders);
        }

        // Handle /mana path
        if (url.pathname === '/mana') {
            return new Response(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題管理ダッシュボード - ぜろ</title>

    <!-- Cloudflare Turnstile -->
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #1e293b;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 2rem; color: white; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .auth-form {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            margin: 0 auto;
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #2563eb;
            color: white;
        }
        .btn-primary:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
        }
        .error { color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; }

        /* ダッシュボード表示 */
        .dashboard-content { display: none; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 0.5rem;
        }
        .loading {
            text-align: center;
            color: white;
            font-size: 1.2rem;
            margin: 2rem 0;
        }
        .success-message {
            background: #10b981;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>問題管理ダッシュボード</h1>
            <p>jsonplan.md統一フォーマット対応 - 管理者認証システム</p>
        </div>

        <div class="auth-form" id="auth-form">
            <h3 style="text-align: center; margin-bottom: 1.5rem;">管理者認証</h3>
            <div class="form-group">
                <label>管理者ID:</label>
                <input type="text" id="admin-id" placeholder="管理者ID" value="P37600">
            </div>
            <div class="form-group">
                <label>パスワード:</label>
                <input type="password" id="admin-pass" placeholder="パスワード">
            </div>

            <!-- Cloudflare Turnstile -->
            <div class="form-group">
                <div class="cf-turnstile" data-sitekey="0x4AAAAAACAhy_EoZrMC0Krb" data-callback="onTurnstileSuccess"></div>
            </div>

            <button class="btn btn-primary" onclick="authenticate()" id="auth-button" disabled>認証</button>
            <div id="auth-error" class="error" style="display: none;"></div>
        </div>

        <div id="loading" class="loading" style="display: none;">
            認証成功 - システム状態を確認中...
        </div>

        <div class="dashboard-content" id="dashboard-content">
            <div class="success-message">
                ✅ 認証成功！問題管理システムにアクセス可能です
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">✅</div>
                    <div>管理者ダッシュボード</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">8</div>
                    <div>問題形式対応</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">JSON</div>
                    <div>一括投稿機能</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">API</div>
                    <div>RESTful対応</div>
                </div>
            </div>

            <div style="background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">🚀 利用可能な機能</h3>
                <ul style="line-height: 1.8; color: #374151;">
                    <li><strong>jsonplan.md統一フォーマット</strong> - 8種類全問題形式対応</li>
                    <li><strong>JSON一括投稿</strong> - 大規模問題データ登録</li>
                    <li><strong>管理者認証</strong> - 安全な認証システム</li>
                    <li><strong>RESTful API</strong> - 完全なCRUD操作</li>
                    <li><strong>統計分析</strong> - リアルタイムデータ分析</li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 2rem;">
                <h3 style="color: white; margin-bottom: 1rem;">📊 問題管理システム</h3>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="https://unified-api-production.t88596565.workers.dev/pages/question-management.html"
                       style="color: white; font-size: 1.2rem; background: rgba(255,255,255,0.2); padding: 1rem 2rem;
                              border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 1rem;">
                        問題管理システムを開く →
                    </a>
                    <a href="/pages/subject-select.html"
                       style="color: white; font-size: 1.2rem; background: rgba(16, 185, 129, 0.3); padding: 1rem 2rem;
                              border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 1rem;">
                        学習ページに移動 →
                    </a>
                </div>
                <div style="margin-top: 2rem;">
                    <button onclick="window.location.href='/'"
                            style="color: #1e293b; background: white; padding: 0.75rem 1.5rem;
                                   border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                        ← トップページに戻る
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Turnstileグローバル変数
        let turnstileToken = null;

        // Turnstile成功コールバック
        function onTurnstileSuccess(token) {
            turnstileToken = token;
            document.getElementById('auth-button').disabled = false;
            console.log('Turnstile verification successful');
        }

        function authenticate() {
            const adminId = document.getElementById('admin-id').value;
            const password = document.getElementById('admin-pass').value;
            const errorElement = document.getElementById('auth-error');
            const authButton = document.getElementById('auth-button');

            // Turnstile検証をチェック
            if (!turnstileToken) {
                errorElement.textContent = 'ボット認証を完了してください';
                errorElement.style.display = 'block';
                return;
            }

            const VALID_CREDENTIALS = [
                { id: 'P37600', password: 'コードギアス' }
            ];

            const isValid = VALID_CREDENTIALS.some(cred =>
                cred.id === adminId && cred.password === password
            );

            // サーバ側で検証
            verifyWithServer(adminId, password, turnstileToken)
                .then(result => {
                    if (result.success) {
                        document.getElementById('auth-form').style.display = 'none';
                        document.getElementById('loading').style.display = 'block';
                        document.getElementById('loading').textContent = '認証成功 - ダッシュボード読み込み中...';

                        setTimeout(() => {
                            document.getElementById('loading').style.display = 'none';
                            document.getElementById('dashboard-content').style.display = 'block';
                            document.querySelector('.header p').textContent = '管理者ダッシュボード - 認証済み';
                        }, 1000);
                    } else {
                        throw new Error(result.error || '認証に失敗しました');
                    }
                })
                .catch(error => {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                    document.getElementById('auth-pass').value = '';
                    document.getElementById('auth-pass').focus();
                    // Turnstileをリセット
                    if (window.turnstile) {
                        turnstile.reset();
                        turnstileToken = null;
                        document.getElementById('auth-button').disabled = true;
                    }
                });

        }

        async function verifyWithServer(adminId, password, token) {
            try {
                const response = await fetch('/api/verify-turnstile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: token,
                        adminId: adminId,
                        password: password
                    })
                });

                const result = await response.json();
                return result;
            } catch (error) {
                console.error('Server verification error:', error);
                throw new Error('サーバーとの通信に失敗しました');
            }
        }

        // Enterキーで認証
        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authenticate();
        });

        // ページ読み込み時にフォーカス
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('admin-pass').focus();
        });
    </script>
</body>
</html>`, {
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                    ...corsHeaders
                }
            });
        }

        // Handle static file for fixed login
        if (url.pathname === '/js/login-fixed-allfrom0.js') {
            return new Response(`/**
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

function handleGuestLogin() {
    try {
        // ゲストユーザー情報を設定
        const guestUser = {
            username: 'guest_' + Math.random().toString(36).substr(2, 9),
            email: null,
            inquiryNumber: null,
            isAdmin: false,
            loginTime: new Date().toISOString()
        };

        // LocalStorageに保存
        localStorage.setItem('currentUser', JSON.stringify(guestUser));
        localStorage.setItem('guestLoginTime', new Date().toISOString());

        // 管理者トークンも設定（APIアクセス用）
        localStorage.setItem('questa_admin_token', getAdminToken());

        // 成功メッセージ
        showNotification('ゲストログインしました', 'success');

        // manaに直接アクセス
        setTimeout(() => {
            window.location.href = '/mana';
        }, 1500);

    } catch (error) {
        console.error('Guest login error:', error);
        showNotification('ゲストログインに失敗しました', 'error');
    }
}

// ==============================
// 通知機能
// ==============================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification \${type}\`;
    notification.textContent = message;
    notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        \${type === 'success' ? 'background: #10b981;' :
          type === 'error' ? 'background: #ef4444;' :
          'background: #3b82f6;'}
    \`;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==============================
// DOM読み込み時の初期化
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Fixed login system initialized for allfrom0.top');

    // ゲストログインボタン - 複数の可能性に対応
    const guestLoginSelectors = [
        '#guest-login-btn',
        '.guest-login-btn',
        'button[data-action="guest-login"]',
        'a[data-action="guest-login"]'
    ];

    guestLoginSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('click', handleGuestLogin);
        });
    });

    // 任意のクリックイベントを監視してゲストログインを処理
    document.addEventListener('click', function(e) {
        if (e.target.textContent.includes('ゲスト') &&
            (e.target.textContent.includes('ログイン') || e.target.textContent.includes('利用'))) {
            e.preventDefault();
            handleGuestLogin();
        }
    });

    // 既にログインしている場合はmanaへリダイレクト
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.isAdmin) {
            // 管理者はmanaへ
        } else {
            // ゲストもmanaへアクセス可能に
            console.log('Guest user already logged in');
        }
    }
});

// CSSアニメーション追加
const style = document.createElement('style');
style.textContent = \`
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
\`;
document.head.appendChild(style);`, {
                headers: {
                    'Content-Type': 'application/javascript',
                    ...corsHeaders
                }
            });
        }

        // 404 for other paths
        return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
};

/**
 * Handle Turnstile verification
 */
async function handleTurnstileVerification(request, env, corsHeaders) {
    try {
        const { token, adminId, password } = await request.json();

        if (!token) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Turnstile token is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get client IP
        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

        // Verify Turnstile token
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: env.TURNSTILE_SECRET,
                response: token,
                remoteip: ip
            })
        });

        const result = await verifyResponse.json();

        if (!result.success) {
            console.error('Turnstile verification failed:', result);
            return new Response(JSON.stringify({
                success: false,
                error: 'Turnstile verification failed',
                details: result['error-codes'] || ['Unknown error']
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Verify admin credentials
        const VALID_CREDENTIALS = [
            { id: 'P37600', password: 'コードギアス' }
        ];

        const isValid = VALID_CREDENTIALS.some(cred =>
            cred.id === adminId && cred.password === password
        );

        if (!isValid) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid credentials'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Success
        return new Response(JSON.stringify({
            success: true,
            message: 'Authentication successful',
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Turnstile verification error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}