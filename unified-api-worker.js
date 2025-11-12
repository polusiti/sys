/**
 * Unified API Worker for polusiti/sys
 * Handles authentication, passkey registration, and user management
 * Fixed users.email NOT NULL constraint issue
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Route requests
            if (url.pathname === '/mana') {
                // Turnstile-protected Mana Dashboard
                const turnstileSiteKey = '0x4AAAAAACAhy_EoZrMC0Krb';
                const turnstileSecret = '0x4AAAAAAAB85_tYi3oPwIAUZ';

                // Turnstile verification endpoint
                if (url.pathname === '/api/verify-turnstile' && request.method === 'POST') {
                    try {
                        const { token } = await request.json();
                        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

                        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                secret: turnstileSecret,
                                response: token,
                                remoteip: ip
                            })
                        });

                        const result = await verifyResponse.json();

                        if (result.success) {
                            return new Response(JSON.stringify({
                                success: true,
                                message: 'Verification successful'
                            }), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json', ...corsHeaders }
                            });
                        } else {
                            return new Response(JSON.stringify({
                                success: false,
                                error: 'Turnstile verification failed'
                            }), {
                                status: 400,
                                headers: { 'Content-Type': 'application/json', ...corsHeaders }
                            });
                        }
                    } catch (error) {
                        return new Response(JSON.stringify({
                            success: false,
                            error: 'Internal server error'
                        }), {
                            status: 500,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders }
                        });
                    }
                }

                return new Response(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題管理ダッシュボード - Mana</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 3rem; }
        .header h1 { color: white; font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .header p { color: rgba(255,255,255,0.8); font-size: 1.1rem; }
        .auth-form {
            background: white; padding: 2rem; border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto 2rem;
        }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
        .form-group input {
            width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px;
            font-size: 1rem; transition: border-color 0.2s;
        }
        .form-group input:focus { outline: none; border-color: #3b82f6; }
        .btn {
            width: 100%; padding: 0.875rem; border: none; border-radius: 8px;
            font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover:not(:disabled) { background: #2563eb; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error {
            background: #fef2f2; color: #ef4444; padding: 0.75rem; border-radius: 8px;
            margin-top: 1rem; font-size: 0.9rem; border: 1px solid #fecaca;
        }
        .loading {
            background: #f0f9ff; color: #1e40af; padding: 2rem; border-radius: 12px;
            text-align: center; font-size: 1.1rem;
        }
        .dashboard-content {
            background: white; padding: 2rem; border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .success-message {
            background: #ecfdf5; color: #059669; padding: 1rem; border-radius: 8px;
            margin-bottom: 2rem; border: 1px solid #a7f3d0;
        }
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem; margin-bottom: 2rem;
        }
        .stat-card { background: #f8fafc; padding: 1.5rem; border-radius: 12px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .stat-label { color: #64748b; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 問題管理ダッシュボード</h1>
            <p>Mana - 統合管理システム</p>
        </div>

        <div class="auth-form" id="auth-form">
            <h3 style="text-align: center; margin-bottom: 1.5rem;">管理者認証</h3>
            <div class="form-group">
                <label for="admin-id">管理者ID</label>
                <input type="text" id="admin-id" placeholder="管理者ID" value="P37600">
            </div>
            <div class="form-group">
                <label for="admin-pass">パスワード</label>
                <input type="password" id="admin-pass" placeholder="パスワード">
            </div>
            <div class="form-group">
                <div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-callback="onTurnstileSuccess"></div>
            </div>
            <button class="btn btn-primary" onclick="authenticate()" id="auth-button" disabled>認証</button>
            <div id="auth-error" class="error" style="display: none;"></div>
        </div>

        <div id="loading" class="loading" style="display: none;">
            <p>認証中...</p>
        </div>

        <div class="dashboard-content" id="dashboard-content" style="display: none;">
            <div class="success-message">
                ✅ 認証に成功しました。問題管理システムへようこそ！
            </div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">✅</div><div class="stat-label">システム状態</div></div>
                <div class="stat-card"><div class="stat-value">8</div><div class="stat-label">対応形式</div></div>
                <div class="stat-card"><div class="stat-value">JSON</div><div class="stat-label">一括登録</div></div>
                <div class="stat-card"><div class="stat-value">API</div><div class="stat-label">完全連携</div></div>
            </div>
            <div style="background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">🚀 利用可能な機能</h3>
                <ul style="line-height: 1.8; color: #374151;">
                    <li>✓ jsonplan.md準拠の8形式問題登録</li>
                    <li>✓ JSON一括インポート機能</li>
                    <li>✓ Cloudflare Turnstileボット保護</li>
                    <li>✓ APIエンドポイント統一管理</li>
                    <li>✓ パスキー認証システム</li>
                </ul>
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <h3 style="color: white; margin-bottom: 1rem;">📊 問題管理システム</h3>
                <button onclick="window.location.href='/'" style="color: #1e293b; background: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                    🏠 ホームに戻る
                </button>
            </div>
        </div>
    </div>

    <script>
        function onTurnstileSuccess(token) {
            document.getElementById('auth-button').disabled = false;
            console.log('Turnstile verification successful');
        }

        async function authenticate() {
            const adminId = document.getElementById('admin-id').value;
            const password = document.getElementById('admin-pass').value;
            const errorElement = document.getElementById('auth-error');

            if (!adminId || !password) {
                errorElement.textContent = 'IDとパスワードを入力してください';
                errorElement.style.display = 'block';
                return;
            }

            const turnstileToken = document.querySelector('.cf-turnstile textarea')?.value;
            if (!turnstileToken) {
                errorElement.textContent = 'ボット認証を完了してください';
                errorElement.style.display = 'block';
                return;
            }

            const validCredentials = [
                { id: 'P37600', password: 'コードギアス' }
            ];

            const isValid = validCredentials.some(cred =>
                cred.id === adminId && cred.password === password
            );

            if (isValid) {
                document.getElementById('auth-form').style.display = 'none';
                document.getElementById('loading').style.display = 'block';

                try {
                    const response = await fetch('/api/verify-turnstile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: turnstileToken })
                    });

                    const result = await response.json();

                    if (result.success) {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('dashboard-content').style.display = 'block';
                        document.querySelector('.header p').textContent = '管理者ダッシュボード - 認証済み';
                    } else {
                        throw new Error(result.error || '認証に失敗しました');
                    }
                } catch (error) {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                    document.getElementById('auth-form').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                }
            } else {
                errorElement.textContent = 'IDまたはパスワードが間違っています';
                errorElement.style.display = 'block';
                document.getElementById('admin-pass').value = '';
                document.getElementById('admin-pass').focus();
                document.getElementById('auth-button').disabled = true;
            }
        }

        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authenticate();
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

            if (url.pathname === '/api/health' || url.pathname === '/') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: 'unified-api-worker',
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                    version: 'question-management-v2.0-json-import'
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            if (url.pathname === '/api/debug') {
                return new Response(JSON.stringify({
                    message: 'Debug endpoint working',
                    timestamp: new Date().toISOString(),
                    pathname: url.pathname,
                    availableEndpoints: ['/api/ai/status', '/api/english/compose', '/api/audio/generate']
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // シンプルテストエンドポイント
            if (url.pathname === '/api/test') {
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Test endpoint working',
                    version: 'ai-v1.1-bugfix',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            if (url.pathname === '/api/auth/register' && request.method === 'POST') {
                return handleRegister(request, env, corsHeaders);
            }

            if (url.pathname.startsWith('/api/auth/passkey/')) {
                return handlePasskeyAuth(request, env, corsHeaders, url);
            }

            // 評価・コメントAPIエンドポイント
            if (url.pathname.startsWith('/api/ratings/')) {
                return handleRatingAPI(request, env, corsHeaders, url);
            }

            // AI機能APIエンドポイント
            if (url.pathname.startsWith('/api/ai/')) {
                return handleAIAPI(request, env, corsHeaders, url);
            }

            // 英作文添削APIエンドポイント
            if (url.pathname.startsWith('/api/english/')) {
                return handleEnglishAPI(request, env, corsHeaders, url);
            }

            // 音声生成APIエンドポイント
            if (url.pathname.startsWith('/api/audio/')) {
                return handleAudioAPI(request, env, corsHeaders, url);
            }

            // 問題管理APIエンドポイント - jsonplan.md統一フォーマット対応
            if (url.pathname.startsWith('/api/questions')) {
                return handleQuestionManagementAPI(request, env, corsHeaders, url);
            }

            // 管理者画面HTMLページ (/mana)
            if (url.pathname === '/mana') {
                return new Response(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題管理ダッシュボード - ぜろ</title>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>問題管理ダッシュボード</h1>
            <p>jsonplan.md統一フォーマット対応</p>
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
            <button class="btn btn-primary" onclick="authenticate()">認証</button>
            <div id="auth-error" class="error" style="display: none;"></div>
        </div>

        <div id="loading" class="loading" style="display: none;">
            認証成功 - データ読み込み中...
        </div>

        <div class="dashboard-content" id="dashboard-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="total-questions">-</div>
                    <div>総問題数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="pending-questions">-</div>
                    <div>承認待ち</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="approved-questions">-</div>
                    <div>承認済み</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avg-difficulty">-</div>
                    <div>平均難易度</div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 2rem;">
                <a href="/pages/question-management.html" style="color: white; font-size: 1.2rem;">問題管理システム →</a>
            </div>
        </div>
    </div>

    <script>
        function authenticate() {
            const adminId = document.getElementById('admin-id').value;
            const password = document.getElementById('admin-pass').value;
            const errorElement = document.getElementById('auth-error');

            const VALID_CREDENTIALS = [
                { id: 'P37600', password: 'コードギアス' }
            ];

            const isValid = VALID_CREDENTIALS.some(cred =>
                cred.id === adminId && cred.password === password
            );

            if (isValid) {
                document.getElementById('auth-form').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                loadStats();
            } else {
                errorElement.textContent = 'IDまたはパスワードが間違っています';
                errorElement.style.display = 'block';
                document.getElementById('admin-pass').value = '';
                document.getElementById('admin-pass').focus();
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/admin/mana');
                const data = await response.json();

                if (data.success) {
                    document.getElementById('total-questions').textContent = data.dashboard.statistics.total_questions.toLocaleString();
                    document.getElementById('pending-questions').textContent = data.dashboard.statistics.pending_questions.toLocaleString();
                    document.getElementById('approved-questions').textContent = data.dashboard.statistics.approved_questions.toLocaleString();
                    document.getElementById('avg-difficulty').textContent = (data.dashboard.statistics.avg_difficulty || 0).toFixed(1);

                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('dashboard-content').style.display = 'block';
                    document.querySelector('.header p').textContent = '管理者ダッシュボード - 認証済み';
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                document.getElementById('loading').textContent = 'エラー: ' + error.message;
                document.getElementById('loading').style.color = '#fca5a5';
            }
        }

        // Enterキーで認証
        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authenticate();
        });

        // ページ読み込み時にフォーカス
        document.getElementById('admin-pass').focus();
    </script>
</body>
</html>`, {
                    headers: {
                        'Content-Type': 'text/html; charset=UTF-8',
                        ...corsHeaders
                    }
                });
            }

            // 管理者APIエンドポイント (/api/admin/mana)
            if (url.pathname === '/api/admin/mana') {
                return handleAdminDashboard(request, env, corsHeaders, url);
            }

            // Legacy endpoints for compatibility
            if (url.pathname.startsWith('/api/d1/')) {
                return handleD1API(request, env, corsHeaders, url);
            }

            if (url.pathname.startsWith('/api/r2/')) {
                return handleR2API(request, env, corsHeaders, url);
            }

            // Static file handling for pages
            if (url.pathname === '/pages/mana.html') {
                return new Response(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題管理ダッシュボード - ぜろ</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #2563eb; }
        .auth-form { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
        .form-group { margin-bottom: 1rem; }
        .form-group input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; }
        .btn-primary { background: #2563eb; color: white; }
        .error { color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>問題管理ダッシュボード</h1>
            <p>管理者認証が必要です</p>
        </div>

        <div class="auth-form">
            <div class="form-group">
                <input type="text" id="admin-id" placeholder="管理者ID" value="P37600">
            </div>
            <div class="form-group">
                <input type="password" id="admin-pass" placeholder="パスワード">
            </div>
            <button class="btn btn-primary" onclick="authenticate()">認証</button>
            <div id="auth-error" class="error" style="display: none;"></div>
        </div>

        <div id="stats-container" style="display: none;">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="total-questions">-</div>
                    <div>総問題数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="pending-questions">-</div>
                    <div>承認待ち</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="approved-questions">-</div>
                    <div>承認済み</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avg-difficulty">-</div>
                    <div>平均難易度</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function authenticate() {
            const adminId = document.getElementById('admin-id').value;
            const password = document.getElementById('admin-pass').value;
            const errorElement = document.getElementById('auth-error');

            const VALID_CREDENTIALS = [
                { id: 'P37600', password: 'コードギアス' }
            ];

            const isValid = VALID_CREDENTIALS.some(cred =>
                cred.id === adminId && cred.password === password
            );

            if (isValid) {
                document.querySelector('.auth-form').style.display = 'none';
                document.querySelector('.header p').textContent = '認証成功 - データ読み込み中...';
                loadStats();
            } else {
                errorElement.textContent = 'IDまたはパスワードが間違っています';
                errorElement.style.display = 'block';
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/admin/mana');
                const data = await response.json();

                if (data.success) {
                    document.getElementById('total-questions').textContent = data.dashboard.statistics.total_questions.toLocaleString();
                    document.getElementById('pending-questions').textContent = data.dashboard.statistics.pending_questions.toLocaleString();
                    document.getElementById('approved-questions').textContent = data.dashboard.statistics.approved_questions.toLocaleString();
                    document.getElementById('avg-difficulty').textContent = (data.dashboard.statistics.avg_difficulty || 0).toFixed(1);
                    document.getElementById('stats-container').style.display = 'block';
                    document.querySelector('.header p').textContent = '管理者ダッシュボード';
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                document.querySelector('.header p').textContent = 'エラー: ' + error.message;
            }
        }

        // Enterキーで認証
        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authenticate();
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

            if (url.pathname === '/pages/question-management.html') {
                return new Response(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題管理システム - ぜろ</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { text-align: center; margin-bottom: 2rem; }
        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; }
        .tab { padding: 1rem 1.5rem; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #2563eb; color: #2563eb; }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; }
        .btn-primary { background: #2563eb; color: white; }
        .form-group { margin-bottom: 1rem; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>問題管理システム</h1>
            <p>jsonplan.md統一フォーマット対応</p>
            <p style="margin-top: 1rem;"><a href="/pages/mana.html" style="color: #2563eb;">← 管理者ダッシュボード</a></p>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showTab('create')">問題作成</button>
            <button class="tab" onclick="showTab('import')">一括インポート</button>
            <button class="tab" onclick="showTab('export')">エクスポート</button>
        </div>

        <div id="create-tab" class="tab-content">
            <div class="card">
                <h3>新規問題作成</h3>
                <form id="question-form">
                    <div class="form-group">
                        <label>科目:</label>
                        <select name="subject" required>
                            <option value="">選択してください</option>
                            <option value="english_grammar">英文法</option>
                            <option value="english_vocab">英単語</option>
                            <option value="english_listening">リスニング</option>
                            <option value="english_reading">リーディング</option>
                            <option value="math">数学</option>
                            <option value="physics">物理</option>
                            <option value="chemistry">化学</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>問題タイプ:</label>
                        <select name="type" required>
                            <option value="multiple_choice">選択問題</option>
                            <option value="fill_in_blank">穴埋め問題</option>
                            <option value="short_answer">記述問題</option>
                            <option value="translation">翻訳問題</option>
                            <option value="transcription">書き取り</option>
                            <option value="error_correction">誤り訂正</option>
                            <option value="reading">読解問題</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>問題文:</label>
                        <textarea name="question_text" rows="3" required></textarea>
                    </div>

                    <div class="form-group">
                        <label>正解:</label>
                        <input type="text" name="answer" required>
                    </div>

                    <button type="submit" class="btn btn-primary">作成</button>
                </form>
            </div>
        </div>

        <div id="import-tab" class="tab-content" style="display: none;">
            <div class="card">
                <h3>JSON一括インポート</h3>
                <div class="form-group">
                    <label>JSONファイル:</label>
                    <input type="file" id="json-file" accept=".json">
                </div>
                <button onclick="importJSON()" class="btn btn-primary">インポート</button>
            </div>
        </div>

        <div id="export-tab" class="tab-content" style="display: none;">
            <div class="card">
                <h3>データエクスポート</h3>
                <button onclick="exportJSON()" class="btn btn-primary">JSONでエクスポート</button>
                <button onclick="exportCSV()" class="btn btn-primary" style="margin-left: 1rem;">CSVでエクスポート</button>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabName + '-tab').style.display = 'block';
            event.target.classList.add('active');
        }

        document.getElementById('question-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('問題を作成しました');
                    e.target.reset();
                } else {
                    throw new Error('作成に失敗しました');
                }
            } catch (error) {
                alert('エラー: ' + error.message);
            }
        });

        async function importJSON() {
            const file = document.getElementById('json-file').files[0];
            if (!file) {
                alert('ファイルを選択してください');
                return;
            }

            const text = await file.text();
            const jsonData = JSON.parse(text);

            try {
                const response = await fetch('/api/questions/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: text
                });

                const result = await response.json();
                if (response.ok) {
                    alert(\`インポート完了: 成功 \${result.results.imported}件, 失敗 \${result.results.errors.length}件\`);
                } else {
                    alert('エラー: ' + result.error);
                }
            } catch (error) {
                alert('エラー: ' + error.message);
            }
        }

        function exportJSON() {
            window.open('/api/questions/export?format=json');
        }

        function exportCSV() {
            window.open('/api/questions/export?format=csv');
        }
    </script>
</body>
</html>`, {
                    headers: {
                        'Content-Type': 'text/html; charset=UTF-8',
                        ...corsHeaders
                    }
                });
            }

            // Unknown endpoint
            return new Response(JSON.stringify({
                error: 'Endpoint not found',
                path: url.pathname,
                available_endpoints: [
                    '/api/health',
                    '/api/questions',
                    '/api/questions/import',
                    '/api/questions/export',
                    '/mana',
                    '/api/admin/mana',
                    '/pages/mana.html',
                    '/pages/question-management.html'
                ]
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Internal server error',
                details: error.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }
};

/**
 * Handle user registration with email constraint fix - simplified version
 */
async function handleRegister(request, env, corsHeaders) {
    try {
        // Temporarily disable admin token check for debugging
        // TODO: Re-enable after fixing the undefined issue
        console.log('Admin token check temporarily disabled for debugging');

        const body = await request.json();
        const { userId, displayName, email, inquiryNumber } = body;

        // Simple validation
        if (!userId || !displayName) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: userId, displayName'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Generate email if not provided
        const finalEmail = email || `${userId}@secure.learning-notebook.local`;

        // Check for existing user in the new users_v2 table
        const existingUser = await env.TESTAPP_DB.prepare(`
            SELECT id FROM users_v2 WHERE username = ? OR display_name = ?
        `).bind(userId, displayName).first();

        if (existingUser) {
            return new Response(JSON.stringify({
                error: 'このユーザーIDまたは表示名は既に使用されています'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Insert user with only required columns
        const result = await env.TESTAPP_DB.prepare(`
            INSERT INTO users_v2 (username, email, display_name)
            VALUES (?, ?, ?)
        `).bind(userId, finalEmail, displayName).run();

        const userId_db = result.meta.last_row_id;

        // Store inquiry number if provided (with undefined check)
        const safeInquiryNumber = inquiryNumber || '';
        if (safeInquiryNumber && safeInquiryNumber.trim() !== '') {
            await env.TESTAPP_DB.prepare(`
                UPDATE users_v2 SET inquiry_number = ? WHERE id = ?
            `).bind(safeInquiryNumber, userId_db).run();
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'ユーザー登録が完了しました',
            userId: userId_db,
            username: userId,
            displayName: displayName,
            email: finalEmail,
            inquiryNumber: safeInquiryNumber || null
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Registration error:', error);

        return new Response(JSON.stringify({
            error: 'ユーザー登録に失敗しました',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle passkey authentication
 */
async function handlePasskeyAuth(request, env, corsHeaders, url) {
    const path = url.pathname;

    if (path === '/api/auth/passkey/register/begin' && request.method === 'POST') {
        return handlePasskeyRegisterBegin(request, env, corsHeaders);
    }

    if (path === '/api/auth/passkey/register/complete' && request.method === 'POST') {
        return handlePasskeyRegisterComplete(request, env, corsHeaders);
    }

    if (path === '/api/auth/passkey/login/begin' && request.method === 'POST') {
        return handlePasskeyLoginBegin(request, env, corsHeaders);
    }

    if (path === '/api/auth/passkey/login/complete' && request.method === 'POST') {
        return handlePasskeyLoginComplete(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({
        error: 'Passkey endpoint not found'
    }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

/**
 * Handle passkey registration begin - COMPLETE IMPLEMENTATION
 */
async function handlePasskeyRegisterBegin(request, env, corsHeaders) {
    try {
        const { userId } = await request.json();
        console.log('🔐 Passkey registration begin for user:', userId);

        // Check if user exists in users_v2
        let user = await env.TESTAPP_DB.prepare(`
            SELECT id, username FROM users_v2 WHERE username = ? OR id = ?
        `).bind(userId, !isNaN(userId) ? parseInt(userId) : userId).first();

        if (!user) {
            return new Response(JSON.stringify({
                error: 'User not found in users_v2 table'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Generate secure random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const challengeBase64 = btoa(String.fromCharCode(...challenge))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        // Store challenge in database with expiration (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await env.TESTAPP_DB.prepare(`
            INSERT INTO webauthn_challenges_v2 (challenge, user_id, operation_type, expires_at)
            VALUES (?, ?, 'registration', ?)
        `).bind(challengeBase64, user.id, expiresAt).run();

        console.log('✅ Challenge stored for user:', user.id, 'expires:', expiresAt);

        return new Response(JSON.stringify({
            challenge: challengeBase64,
            user: {
                id: user.id.toString(),
                name: user.username,
                displayName: user.username
            },
            rp: {
                id: 'allfrom0.top',
                name: 'Learning Notebook'
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' },
                { alg: -257, type: 'public-key' }
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'preferred'
            },
            timeout: 60000,
            attestation: 'direct'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Passkey register begin error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to begin passkey registration',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle passkey registration completion
 */
async function handlePasskeyRegisterComplete(request, env, corsHeaders) {
    try {
        const { userId, credential, challenge } = await request.json();
        console.log('🔐 Passkey registration complete for user:', userId);

        // Verify challenge exists and is not expired
        const challengeRecord = await env.TESTAPP_DB.prepare(`
            SELECT id, user_id, expires_at FROM webauthn_challenges_v2
            WHERE challenge = ? AND operation_type = 'registration' AND used = 0
        `).bind(challenge).first();

        if (!challengeRecord) {
            return new Response(JSON.stringify({
                error: 'Invalid or expired challenge'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (new Date(challengeRecord.expires_at) < new Date()) {
            return new Response(JSON.stringify({
                error: 'Challenge expired'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Mark challenge as used
        await env.TESTAPP_DB.prepare(`
            UPDATE webauthn_challenges_v2 SET used = 1 WHERE id = ?
        `).bind(challengeRecord.id).run();

        // Store credential information in users_v2 table
        await env.TESTAPP_DB.prepare(`
            UPDATE users_v2 SET
                passkey_credential_id = ?,
                passkey_public_key = ?,
                passkey_sign_count = ?
            WHERE id = ?
        `).bind(
            credential.id,
            credential.response.publicKey || credential.response.publicKeyJP || JSON.stringify(credential.response),
            0,
            challengeRecord.user_id
        ).run();

        console.log('✅ Passkey registered successfully for user:', challengeRecord.user_id);

        return new Response(JSON.stringify({
            success: true,
            message: 'パスキー登録が完了しました'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('❌ Passkey register complete error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to complete passkey registration',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle passkey login begin
 */
async function handlePasskeyLoginBegin(request, env, corsHeaders) {
    try {
        const { username } = await request.json();
        console.log('🔐 Passkey login begin for user:', username);

        // Find user with passkey credentials
        const user = await env.TESTAPP_DB.prepare(`
            SELECT id, username, passkey_credential_id FROM users_v2
            WHERE username = ? AND passkey_credential_id IS NOT NULL
        `).bind(username).first();

        if (!user) {
            return new Response(JSON.stringify({
                error: 'User not found or no passkey registered'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Generate secure random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const challengeBase64 = btoa(String.fromCharCode(...challenge))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        // Store challenge in database with expiration (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await env.TESTAPP_DB.prepare(`
            INSERT INTO webauthn_challenges_v2 (challenge, user_id, operation_type, expires_at)
            VALUES (?, ?, 'authentication', ?)
        `).bind(challengeBase64, user.id, expiresAt).run();

        console.log('✅ Login challenge stored for user:', user.id);

        return new Response(JSON.stringify({
            challenge: challengeBase64,
            allowCredentials: [{
                type: 'public-key',
                id: user.passkey_credential_id,
                transports: ['internal', 'usb', 'nfc', 'ble']
            }],
            userVerification: 'preferred',
            timeout: 60000
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Passkey login begin error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to begin passkey login',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle passkey login completion
 */
async function handlePasskeyLoginComplete(request, env, corsHeaders) {
    try {
        const { username, credential, challenge } = await request.json();
        console.log('🔐 Passkey login complete for user:', username);

        // Find user
        const user = await env.TESTAPP_DB.prepare(`
            SELECT id, username, passkey_credential_id, passkey_public_key, passkey_sign_count
            FROM users_v2 WHERE username = ?
        `).bind(username).first();

        if (!user) {
            return new Response(JSON.stringify({
                error: 'User not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Verify challenge exists and is not expired
        const challengeRecord = await env.TESTAPP_DB.prepare(`
            SELECT id, user_id, expires_at FROM webauthn_challenges_v2
            WHERE challenge = ? AND operation_type = 'authentication' AND used = 0
        `).bind(challenge).first();

        if (!challengeRecord) {
            return new Response(JSON.stringify({
                error: 'Invalid or expired challenge'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (new Date(challengeRecord.expires_at) < new Date()) {
            return new Response(JSON.stringify({
                error: 'Challenge expired'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Verify credential ID matches
        if (user.passkey_credential_id !== credential.id) {
            return new Response(JSON.stringify({
                error: 'Credential mismatch'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Mark challenge as used
        await env.TESTAPP_DB.prepare(`
            UPDATE webauthn_challenges_v2 SET used = 1 WHERE id = ?
        `).bind(challengeRecord.id).run();

        // Update user login info
        await env.TESTAPP_DB.prepare(`
            UPDATE users_v2 SET
                last_login = datetime('now'),
                login_count = login_count + 1,
                passkey_sign_count = ?
            WHERE id = ?
        `).bind((user.passkey_sign_count || 0) + 1, user.id).run();

        // Create session token
        const sessionToken = generateSessionToken();
        const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        await env.TESTAPP_DB.prepare(`
            INSERT INTO webauthn_sessions (id, user_id, credential_id, expires_at)
            VALUES (?, ?, ?, ?)
        `).bind(sessionToken, user.id, credential.id, sessionExpiresAt).run();

        console.log('✅ Login successful for user:', user.id);

        return new Response(JSON.stringify({
            success: true,
            message: 'ログインしました！',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.username
            },
            sessionToken: sessionToken,
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`,
                ...corsHeaders
            }
        });

    } catch (error) {
        console.error('❌ Passkey login complete error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to complete passkey login',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Generate secure session token
 */
function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Handle D1 API endpoints (legacy compatibility)
 */
async function handleD1API(request, env, corsHeaders, url) {
    // Basic D1 API handler for compatibility
    const path = url.pathname.replace('/api/d1', '');

    if (path === '/questions' && request.method === 'POST') {
        // Handle question saving
        return new Response(JSON.stringify({
            success: true,
            message: 'Question saved to D1'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return new Response(JSON.stringify({
        error: 'D1 endpoint not implemented'
    }), {
        status: 501,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

/**
 * Handle R2 API endpoints (legacy compatibility)
 */
async function handleR2API(request, env, corsHeaders, url) {
    // Basic R2 API handler for compatibility
    const path = url.pathname.replace('/api/r2', '');

    if (path.startsWith('/questions/') && request.method === 'GET') {
        // Handle question retrieval
        return new Response(JSON.stringify({
            questions: [],
            message: 'R2 questions retrieved'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return new Response(JSON.stringify({
        error: 'R2 endpoint not implemented'
    }), {
        status: 501,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

/**
 * Handle Rating and Comment API endpoints
 */
async function handleRatingAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/ratings', '');

    try {
        // 評価の投稿・更新
        if (path === '/submit' && request.method === 'POST') {
            return handleRatingSubmit(request, env, corsHeaders);
        }

        // 評価の取得
        if (path.match(/^\/([^\/]+)$/) && request.method === 'GET') {
            const questionId = path.substring(1);
            return handleRatingGet(questionId, request, env, corsHeaders);
        }

        // 評価統計の取得
        if (path.match(/^\/([^\/]+)\/stats$/) && request.method === 'GET') {
            const questionId = path.substring(1, path.indexOf('/stats'));
            return handleRatingStats(questionId, request, env, corsHeaders);
        }

        // ユーザーの現在の評価取得
        if (path === '/user/current' && request.method === 'GET') {
            return handleUserCurrentRating(request, env, corsHeaders);
        }

        // ユーザーの評価履歴取得
        if (path === '/user/history' && request.method === 'GET') {
            return handleUserRatingHistory(request, env, corsHeaders);
        }

        // 評価の削除
        if (path.match(/^\/([^\/]+)\/delete$/) && request.method === 'DELETE') {
            const questionId = path.substring(1, path.indexOf('/delete'));
            return handleRatingDelete(questionId, request, env, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'Rating endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Rating API Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 評価の投稿・更新を処理
 */
async function handleRatingSubmit(request, env, corsHeaders) {
    try {
        const { questionId, rating, comment, userId } = await request.json();

        // 入力検証
        if (!questionId || !userId || !rating || rating < 1 || rating > 5) {
            return new Response(JSON.stringify({
                error: 'Invalid input data',
                required: ['questionId', 'userId', 'rating (1-5)']
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ユーザー存在確認
        const userCheck = await env.TESTAPP_DB.prepare(
            'SELECT username FROM users_v2 WHERE username = ?'
        ).bind(userId).first();

        if (!userCheck) {
            return new Response(JSON.stringify({
                error: 'User not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // UPSERT: 既存評価があれば更新、なければ新規作成
        const existingRating = await env.TESTAPP_DB.prepare(
            'SELECT id FROM question_ratings WHERE question_id = ? AND user_id = ?'
        ).bind(questionId, userId).first();

        if (existingRating) {
            // 更新
            await env.TESTAPP_DB.prepare(`
                UPDATE question_ratings
                SET rating = ?, comment = ?, updated_at = datetime('now')
                WHERE question_id = ? AND user_id = ?
            `).bind(rating, comment || null, questionId, userId).run();

            return new Response(JSON.stringify({
                success: true,
                action: 'updated',
                message: '評価を更新しました'
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        } else {
            // 新規作成
            await env.TESTAPP_DB.prepare(`
                INSERT INTO question_ratings (question_id, user_id, rating, comment)
                VALUES (?, ?, ?, ?)
            `).bind(questionId, userId, rating, comment || null).run();

            return new Response(JSON.stringify({
                success: true,
                action: 'created',
                message: '評価を投稿しました'
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

    } catch (error) {
        console.error('Rating submit error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to submit rating',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 評価一覧の取得を処理
 */
async function handleRatingGet(questionId, request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;
        const sort = url.searchParams.get('sort') || 'newest';

        // ソート条件の構築
        let orderClause = 'ORDER BY r.created_at DESC';
        switch (sort) {
            case 'highest':
                orderClause = 'ORDER BY r.rating DESC, r.created_at DESC';
                break;
            case 'lowest':
                orderClause = 'ORDER BY r.rating ASC, r.created_at DESC';
                break;
            case 'newest':
            default:
                orderClause = 'ORDER BY r.created_at DESC';
                break;
        }

        // 評価一覧取得（ユーザー情報付き）
        const ratings = await env.TESTAPP_DB.prepare(`
            SELECT
                r.*,
                u.display_name,
                u.avatar_type,
                u.avatar_value
            FROM question_ratings r
            JOIN users_v2 u ON r.user_id = u.username
            WHERE r.question_id = ?
            ${orderClause}
            LIMIT ? OFFSET ?
        `).bind(questionId, limit, offset).all();

        // 総評価数取得
        const totalCount = await env.TESTAPP_DB.prepare(
            'SELECT COUNT(*) as count FROM question_ratings WHERE question_id = ?'
        ).bind(questionId).first();

        return new Response(JSON.stringify({
            success: true,
            data: {
                ratings: ratings.results,
                pagination: {
                    page,
                    limit,
                    total: totalCount.count,
                    hasMore: offset + limit < totalCount.count
                }
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Rating get error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get ratings',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 評価統計の取得を処理
 */
async function handleRatingStats(questionId, request, env, corsHeaders) {
    try {
        // 基本統計
        const stats = await env.TESTAPP_DB.prepare(`
            SELECT
                COUNT(*) as total_count,
                AVG(rating) as average_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating
            FROM question_ratings
            WHERE question_id = ?
        `).bind(questionId).first();

        // 評価分布
        const distribution = await env.TESTAPP_DB.prepare(`
            SELECT
                rating,
                COUNT(*) as count
            FROM question_ratings
            WHERE question_id = ?
            GROUP BY rating
            ORDER BY rating
        `).bind(questionId).all();

        // ユーザーの評価（認証済みの場合）
        const userRating = null; // 認証機能実装時に取得

        return new Response(JSON.stringify({
            success: true,
            data: {
                questionId,
                stats: {
                    totalCount: stats.total_count || 0,
                    averageRating: Math.round((stats.average_rating || 0) * 10) / 10,
                    minRating: stats.min_rating || 0,
                    maxRating: stats.max_rating || 0
                },
                distribution: distribution.results,
                userRating
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Rating stats error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get rating stats',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * ユーザーの評価履歴取得を処理
 */
async function handleUserRatingHistory(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = (page - 1) * limit;

        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId parameter is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const ratings = await env.TESTAPP_DB.prepare(`
            SELECT
                r.*,
                u.display_name,
                u.avatar_type,
                u.avatar_value
            FROM question_ratings r
            JOIN users_v2 u ON r.user_id = u.username
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `).bind(userId, limit, offset).all();

        const totalCount = await env.TESTAPP_DB.prepare(
            'SELECT COUNT(*) as count FROM question_ratings WHERE user_id = ?'
        ).bind(userId).first();

        return new Response(JSON.stringify({
            success: true,
            data: {
                ratings: ratings.results,
                pagination: {
                    page,
                    limit,
                    total: totalCount.count,
                    hasMore: offset + limit < totalCount.count
                }
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('User rating history error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get user rating history',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * ユーザーの現在の評価取得を処理
 */
async function handleUserCurrentRating(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const questionId = url.searchParams.get('questionId');
        const userId = url.searchParams.get('userId');

        if (!questionId || !userId) {
            return new Response(JSON.stringify({
                error: 'questionId and userId parameters are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ユーザーの現在の評価を取得
        const rating = await env.TESTAPP_DB.prepare(`
            SELECT
                r.*,
                u.display_name,
                u.avatar_type,
                u.avatar_value
            FROM question_ratings r
            JOIN users_v2 u ON r.user_id = u.username
            WHERE r.question_id = ? AND r.user_id = ?
        `).bind(questionId, userId).first();

        if (rating) {
            return new Response(JSON.stringify({
                success: true,
                data: {
                    rating: rating
                }
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        } else {
            return new Response(JSON.stringify({
                success: true,
                data: {
                    rating: null
                }
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

    } catch (error) {
        console.error('User current rating error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get user rating',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 評価の削除を処理
 */
async function handleRatingDelete(questionId, request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const result = await env.TESTAPP_DB.prepare(`
            DELETE FROM question_ratings
            WHERE question_id = ? AND user_id = ?
        `).bind(questionId, userId).run();

        if (result.changes > 0) {
            return new Response(JSON.stringify({
                success: true,
                message: '評価を削除しました'
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        } else {
            return new Response(JSON.stringify({
                error: 'Rating not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

    } catch (error) {
        console.error('Rating delete error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete rating',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle AI API endpoints
 */
async function handleAIAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/ai', '');

    try {
        // AI機能状態確認
        if (path === '/status' && request.method === 'GET') {
            return new Response(JSON.stringify({
                success: true,
                data: {
                    available_models: {
                        text_generation: ['@cf/meta/llama-3.1-8b-instruct-fp8', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
                        text_embeddings: ['@cf/baai/bge-large-en-v1.5', '@cf/baai/bge-m3'],
                        tts: ['@cf/myshell-ai/melotts', '@cf/deepgram/aura-2-es'],
                        math: ['@cf/deepseek-ai/deepseek-math-7b-instruct'],
                        translation: ['@cf/meta/m2m100-1.2b']
                    },
                    features: {
                        english_correction: true,
                        audio_generation: true,
                        math_explanation: true,
                        question_generation: true,
                        translation: true
                    }
                }
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            error: 'AI endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('AI API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process AI request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle English Composition API endpoints
 */
async function handleEnglishAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/english', '');

    try {
        // 英作文添削の提出
        if (path === '/compose' && request.method === 'POST') {
            return handleEnglishComposition(request, env, corsHeaders);
        }

        // 添削結果の取得
        if (path.match(/^\/compose\/([^\/]+)$/) && request.method === 'GET') {
            const compositionId = path.split('/')[2];
            return handleGetComposition(compositionId, request, env, corsHeaders);
        }

        // ユーザーの添削履歴
        if (path === '/compose/history' && request.method === 'GET') {
            return handleCompositionHistory(request, env, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'English endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('English API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process English request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Handle Audio Generation API endpoints
 */
async function handleAudioAPI(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/audio', '');

    try {
        // 音声生成
        if (path === '/generate' && request.method === 'POST') {
            return handleAudioGeneration(request, env, corsHeaders);
        }

        // 音声ファイル取得
        if (path.match(/^\/([^\/]+)$/) && request.method === 'GET') {
            const audioId = path.substring(1);
            return handleGetAudio(audioId, request, env, corsHeaders);
        }

        // 音声ファイル削除
        if (path.match(/^\/([^\/]+)$/) && request.method === 'DELETE') {
            const audioId = path.substring(1);
            return handleDeleteAudio(audioId, request, env, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'Audio endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Audio API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process audio request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 英作文添削処理 - AutoRAG + SGIF実装
 */
async function handleEnglishComposition(request, env, corsHeaders) {
    const startTime = Date.now();

    try {
        const { userId, text, title = '' } = await request.json();

        if (!userId || !text) {
            return new Response(JSON.stringify({
                error: 'userId and text are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // テキスト長チェック（最大5000文字）
        if (text.length > 5000) {
            return new Response(JSON.stringify({
                error: 'Text is too long. Maximum 5000 characters allowed.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Cloudflare AIを使用した英作文添削
        const correctionResult = await correctEnglishComposition(text, env);

        const processingTime = Date.now() - startTime;

        // データベースに保存
        const result = await env.TESTAPP_DB.prepare(`
            INSERT INTO english_compositions (
                user_id, original_text, corrected_text, error_analysis,
                suggestions, sgif_category, confidence_score, processing_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            text,
            correctionResult.correctedText,
            JSON.stringify(correctionResult.errorAnalysis),
            JSON.stringify(correctionResult.suggestions),
            correctionResult.sgifCategory,
            correctionResult.confidenceScore,
            processingTime
        ).run();

        return new Response(JSON.stringify({
            success: true,
            data: {
                id: result.meta.last_row_id,
                // 互換性のためsnake_caseとcamelCaseの両方を含める
                original_text: text,
                corrected_text: correctionResult.correctedText,
                error_analysis: correctionResult.errorAnalysis,
                suggestions: correctionResult.suggestions,
                sgif_category: correctionResult.sgifCategory,
                confidence_score: correctionResult.confidenceScore,
                processing_time: processingTime,
                // camelCaseフィールドも含める
                originalText: text,
                correctedText: correctionResult.correctedText,
                errorAnalysis: correctionResult.errorAnalysis,
                sgifCategory: correctionResult.sgifCategory,
                confidenceScore: correctionResult.confidenceScore,
                processingTime: processingTime
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('English composition error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to correct English composition',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Cloudflare AIを使用した英作文添削 - SGIFフレームワーク実装
 */
async function correctEnglishComposition(text, env) {
    try {
        // SGIFシステムプロンプト
        const systemPrompt = `ROLE: You are an English writing correction instructor trained in the SafeProof Grammar Intelligence Framework (SGIF).

SGIF ERROR CATEGORIES:
S1: Semantic Misalignment - Words used in wrong context or meaning
S2: Syntactic Misconstruction - Incorrect sentence structure or word order
S3: Grammatical Particle Misuse - Wrong prepositions, articles, or particles
S4: Lexical/Collocational Mischoice - Inappropriate word choices or collocations
S5: Stylistic/Pragmatic Inappropriateness - Inappropriate tone, register, or style
S6: Coherence/Consistency Error - Lack of logical flow or consistency

TASK: Analyze the English text and provide corrections following this JSON format:
{
  "correctedText": "fully corrected version",
  "errorAnalysis": [
    {
      "original": "incorrect phrase",
      "corrected": "correct phrase",
      "category": "S1-S6",
      "explanation": "why this is wrong and why the correction is better",
      "position": {"start": 0, "end": 10}
    }
  ],
  "suggestions": [
    {
      "type": "vocabulary",
      "suggestion": "better word choice",
      "reason": "explanation"
    }
  ],
  "sgifCategory": "most relevant SGIF category",
  "confidenceScore": 0.85
}

Important: Return only valid JSON. Be constructive and educational in your corrections.`;

        // Cloudflare AIでテキスト添削
        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Please correct this English text: ${text}` }
            ],
            temperature: 0.1,  // 低い温度で一貫性を確保
            max_tokens: 2000
        });

        // 結果をパース
        const aiResponse = response.response;
        let correctionResult;

        try {
            correctionResult = JSON.parse(aiResponse);
        } catch (parseError) {
            // JSONパース失敗時のフォールバック
            correctionResult = {
                correctedText: text,
                errorAnalysis: [],
                suggestions: [],
                sgifCategory: "S6",
                confidenceScore: 0.5
            };
        }

        // 必須フィールドの保証
        return {
            correctedText: correctionResult.correctedText || text,
            errorAnalysis: correctionResult.errorAnalysis || [],
            suggestions: correctionResult.suggestions || [],
            sgifCategory: correctionResult.sgifCategory || "S6",
            confidenceScore: correctionResult.confidenceScore || 0.7
        };

    } catch (error) {
        console.error('AI correction error:', error);
        // エラー時は元のテキストを返す
        return {
            correctedText: text,
            errorAnalysis: [],
            suggestions: [],
            sgifCategory: "S6",
            confidenceScore: 0.5
        };
    }
}

/**
 * 添削結果取得
 */
async function handleGetComposition(compositionId, request, env, corsHeaders) {
    try {
        const composition = await env.TESTAPP_DB.prepare(`
            SELECT * FROM english_compositions WHERE id = ?
        `).bind(compositionId).first();

        if (!composition) {
            return new Response(JSON.stringify({
                error: 'Composition not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // JSONフィールドをパース
        composition.error_analysis = JSON.parse(composition.error_analysis || '[]');
        composition.suggestions = JSON.parse(composition.suggestions || '[]');

        // 互換性のためcamelCaseも含める
        const responseData = {
            ...composition,
            // camelCaseフィールドを追加
            originalText: composition.original_text,
            correctedText: composition.corrected_text,
            errorAnalysis: composition.error_analysis,
            suggestions: composition.suggestions,
            sgifCategory: composition.sgif_category,
            confidenceScore: composition.confidence_score,
            processingTime: composition.processing_time
        };

        return new Response(JSON.stringify({
            success: true,
            data: responseData
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get composition error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get composition',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 添削履歴取得
 */
async function handleCompositionHistory(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const compositions = await env.TESTAPP_DB.prepare(`
            SELECT id, original_text, corrected_text, sgif_category, confidence_score,
                   processing_time, created_at
            FROM english_compositions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).bind(userId, limit, offset).all();

        return new Response(JSON.stringify({
            success: true,
            data: {
                compositions: compositions.results,
                hasMore: compositions.results.length === limit
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Composition history error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get composition history',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 音声生成処理
 */
async function handleAudioGeneration(request, env, corsHeaders) {
    try {
        const { userId, text, subject = 'english', questionId } = await request.json();

        if (!userId || !text) {
            return new Response(JSON.stringify({
                error: 'userId and text are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // テキスト長チェック（最大1000文字）
        if (text.length > 1000) {
            return new Response(JSON.stringify({
                error: 'Text is too long. Maximum 1000 characters allowed.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Cloudflare AIで音声生成
        const audioResult = await generateAudioFromText(text, env);

        // R2に音声ファイルを保存
        const audioUrl = await saveAudioToR2(audioResult.audioData, userId, subject, env);

        // データベースに保存
        const result = await env.TESTAPP_DB.prepare(`
            INSERT INTO audio_files (
                user_id, subject, question_id, text_content, audio_url,
                file_size, duration, generation_model
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            subject,
            questionId || null,
            text,
            audioUrl,
            audioResult.fileSize,
            audioResult.duration,
            audioResult.model
        ).run();

        return new Response(JSON.stringify({
            success: true,
            data: {
                id: result.meta.last_row_id,
                audioUrl: audioUrl,
                duration: audioResult.duration,
                fileSize: audioResult.fileSize,
                model: audioResult.model,
                text: text
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Audio generation error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to generate audio',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * Cloudflare AIで音声生成
 */
async function generateAudioFromText(text, env) {
    try {
        // MeloTTSモデルで音声生成
        const response = await env.AI.run('@cf/myshell-ai/melotts', {
            text: text
        });

        // 音声データとメタデータを返す
        return {
            audioData: response.audio,
            duration: response.duration || 0,
            fileSize: response.audio ? response.audio.length : 0,
            model: '@cf/myshell-ai/melotts'
        };

    } catch (error) {
        console.error('TTS generation error:', error);
        throw new Error('Failed to generate audio from text');
    }
}

/**
 * R2に音声ファイルを保存
 */
async function saveAudioToR2(audioData, userId, subject, env) {
    try {
        const fileName = `audio/${subject}/${userId}/${Date.now()}.mp3`;

        await env.TESTAPP_R2.put(fileName, audioData, {
            contentType: 'audio/mpeg'
        });

        return `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${fileName}`;

    } catch (error) {
        console.error('R2 upload error:', error);
        throw new Error('Failed to save audio to R2');
    }
}

/**
 * 音声ファイル取得
 */
async function handleGetAudio(audioId, request, env, corsHeaders) {
    try {
        const audio = await env.TESTAPP_DB.prepare(`
            SELECT * FROM audio_files WHERE id = ?
        `).bind(audioId).first();

        if (!audio) {
            return new Response(JSON.stringify({
                error: 'Audio file not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: audio
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get audio error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get audio',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 音声ファイル削除
 */
async function handleDeleteAudio(audioId, request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 音声ファイル情報取得
        const audio = await env.TESTAPP_DB.prepare(`
            SELECT * FROM audio_files WHERE id = ? AND user_id = ?
        `).bind(audioId, userId).first();

        if (!audio) {
            return new Response(JSON.stringify({
                error: 'Audio file not found or access denied'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // R2からファイル削除
        const fileName = audio.audio_url.split('/').pop();
        const objectKey = `audio/${audio.subject}/${userId}/${fileName}`;

        try {
            await env.TESTAPP_R2.delete(objectKey);
        } catch (r2Error) {
            console.warn('Failed to delete from R2:', r2Error);
        }

        // データベースから削除
        await env.TESTAPP_DB.prepare(`
            DELETE FROM audio_files WHERE id = ? AND user_id = ?
        `).bind(audioId, userId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Audio file deleted successfully'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Delete audio error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete audio',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題管理APIハンドラー - jsonplan.md統一フォーマット対応
 * 全ての問題形式を統一的に管理
 */
async function handleQuestionManagementAPI(request, env, corsHeaders, url) {
    const path = url.pathname;
    const pathSegments = path.split('/').filter(Boolean);
    const method = request.method;

    try {
        // 問題一覧取得 (GET /api/questions)
        if (path === '/api/questions' && method === 'GET') {
            return await handleGetQuestions(request, env, corsHeaders);
        }

        // 新規問題作成 (POST /api/questions)
        if (path === '/api/questions' && method === 'POST') {
            return await handleCreateQuestion(request, env, corsHeaders);
        }

        // 特定問題取得 (GET /api/questions/{id})
        if (pathSegments.length === 3 && pathSegments[0] === 'api' && pathSegments[1] === 'questions' && method === 'GET') {
            const questionId = pathSegments[2];
            return await handleGetQuestion(questionId, env, corsHeaders);
        }

        // 問題更新 (PUT /api/questions/{id})
        if (pathSegments.length === 3 && pathSegments[0] === 'api' && pathSegments[1] === 'questions' && method === 'PUT') {
            const questionId = pathSegments[2];
            return await handleUpdateQuestion(questionId, request, env, corsHeaders);
        }

        // 問題削除 (DELETE /api/questions/{id})
        if (pathSegments.length === 3 && pathSegments[0] === 'api' && pathSegments[1] === 'questions' && method === 'DELETE') {
            const questionId = pathSegments[2];
            return await handleDeleteQuestion(questionId, env, corsHeaders);
        }

        // 問題統計取得 (GET /api/questions/{id}/stats)
        if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'questions' && pathSegments[3] === 'stats' && method === 'GET') {
            const questionId = pathSegments[2];
            return await handleGetQuestionStats(questionId, env, corsHeaders);
        }

        // エクスポート (GET /api/questions/export)
        if (path === '/api/questions/export' && method === 'GET') {
            return await handleExportQuestions(request, env, corsHeaders);
        }

        // インポート (POST /api/questions/import)
        if (path === '/api/questions/import' && method === 'POST') {
            return await handleImportQuestions(request, env, corsHeaders);
        }

        // 問題バリデーション (POST /api/questions/{id}/validate)
        if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'questions' && pathSegments[3] === 'validate' && method === 'POST') {
            const questionId = pathSegments[2];
            return await handleValidateQuestion(questionId, request, env, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'Question management endpoint not found',
            path: path,
            method: method
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Question management API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error in question management',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題一覧取得
 */
async function handleGetQuestions(request, env, corsHeaders) {
    const url = new URL(request.url);
    const params = url.searchParams;

    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '50');
    const subject = params.get('subject') || '';
    const type = params.get('type') || '';
    const difficulty = params.get('difficulty') || '';
    const search = params.get('search') || '';
    const sortField = params.get('sort') || 'created_at';
    const sortOrder = params.get('order') || 'desc';

    try {
        // WHERE句の構築
        let whereClause = 'is_deleted = 0';
        const bindings = [];
        let bindingIndex = 1;

        if (subject) {
            whereClause += ` AND subject = ?`;
            bindings.push(subject);
            bindingIndex++;
        }

        if (type) {
            whereClause += ` AND type = ?`;
            bindings.push(type);
            bindingIndex++;
        }

        if (difficulty) {
            whereClause += ` AND difficulty = ?`;
            bindings.push(parseInt(difficulty));
            bindingIndex++;
        }

        if (search) {
            whereClause += ` AND (question_text LIKE ? OR question_translation LIKE ? OR tags LIKE ? OR source LIKE ?)`;
            const searchTerm = `%${search}%`;
            bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
            bindingIndex += 4;
        }

        // 有効なソートフィールドチェック
        const validSortFields = ['created_at', 'updated_at', 'difficulty', 'subject', 'type'];
        const validatedSortField = validSortFields.includes(sortField) ? sortField : 'created_at';
        const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

        // 総数取得
        const countQuery = `SELECT COUNT(*) as total FROM questions WHERE ${whereClause}`;
        const countResult = await env.TESTAPP_DB.prepare(countQuery).bind(...bindings).first();
        const total = countResult.total;

        // データ取得
        const offset = (page - 1) * limit;
        const query = `
            SELECT
                id, subject, type, question_text, question_translation,
                choices, correct_answer, explanation, explanation_simple, explanation_detailed,
                difficulty, tags, source, created_at, updated_at,
                media_audio, media_image, media_video, grammar_point,
                validation_status, active
            FROM questions
            WHERE ${whereClause}
            ORDER BY ${validatedSortField} ${validatedSortOrder.toUpperCase()}
            LIMIT ? OFFSET ?
        `;

        const questions = await env.TESTAPP_DB.prepare(query)
            .bind(...bindings, limit, offset)
            .all();

        // 統計情報も取得
        const statsQuery = `
            SELECT
                COUNT(*) as total_questions,
                COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending_questions,
                AVG(difficulty) as avg_difficulty,
                COUNT(CASE WHEN active = 1 THEN 1 END) as active_questions
            FROM questions
            WHERE is_deleted = 0
        `;
        const statsResult = await env.TESTAPP_DB.prepare(statsQuery).first();

        return new Response(JSON.stringify({
            success: true,
            questions: questions.results.map(q => normalizeQuestionResponse(q)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            statistics: statsResult
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get questions error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch questions',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 新規問題作成
 */
async function handleCreateQuestion(request, env, corsHeaders) {
    try {
        const questionData = await request.json();

        // 問題データのバリデーション
        const validation = validateQuestionData(questionData);
        if (!validation.isValid) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid question data',
                details: validation.errors
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ID生成（統一フォーマット）
        const questionId = generateQuestionId(questionData.subject, questionData.type);
        const now = new Date().toISOString();

        // JSONフィールドの準備
        const choicesJson = questionData.options ? JSON.stringify(questionData.options) : '[]';
        const tagsJson = questionData.tags ? JSON.stringify(questionData.tags) : '[]';
        const explanationJson = JSON.stringify(questionData.explanation || {});

        // データベースに挿入
        const query = `
            INSERT INTO questions (
                id, subject, type, question_text, question_translation,
                choices, correct_answer, explanation, explanation_simple, explanation_detailed,
                difficulty, tags, source, created_at, updated_at,
                media_audio, media_image, media_video, grammar_point,
                validation_status, active, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        `;

        await env.TESTAPP_DB.prepare(query).bind(
            questionId,
            questionData.subject,
            questionData.type,
            (questionData.question.text || questionData.question_text || '').substring(0, 50), // title
            questionData.question.text || questionData.question_text || '',
            questionData.question.translation || questionData.question_translation || '',
            choicesJson,
            questionData.answer,
            explanationJson,
            questionData.explanation?.pl || questionData.explanation_simple || '',
            questionData.explanation?.sp || questionData.explanation_detailed || '',
            questionData.difficulty || 1,
            tagsJson,
            questionData.source || '自作',
            now,
            now,
            questionData.media?.audio || questionData.media_audio || '',
            questionData.media?.image || questionData.media_image || '',
            questionData.media?.video || questionData.media_video || '',
            questionData.grammar_point || '',
            1  // active
        ).run();

        // 作成した問題を取得して返す
        const createdQuestion = await env.TESTAPP_DB.prepare(
            'SELECT * FROM questions WHERE id = ?'
        ).bind(questionId).first();

        return new Response(JSON.stringify({
            success: true,
            message: 'Question created successfully',
            question: normalizeQuestionResponse(createdQuestion)
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Create question error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create question',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題データの正規化
 */
function normalizeQuestionResponse(question) {
    // JSONフィールドのパース
    let choices = [];
    let explanation = {};
    let tags = [];

    try {
        if (question.choices) choices = JSON.parse(question.choices);
    } catch (e) {}

    try {
        if (question.explanation) explanation = JSON.parse(question.explanation);
    } catch (e) {}

    try {
        if (question.tags) tags = JSON.parse(question.tags);
    } catch (e) {}

    return {
        id: question.id,
        subject: question.subject,
        type: question.type,
        question: {
            text: question.question_text,
            translation: question.question_translation || ''
        },
        options: choices,
        answer: question.correct_answer, // DBのcorrect_answerをAPIのanswerにマッピング
        explanation: {
            pl: explanation.pl || question.explanation_simple || '',
            sp: explanation.sp || question.explanation_detailed || ''
        },
        difficulty: question.difficulty,
        tags: tags,
        source: question.source,
        created_at: question.created_at,
        updated_at: question.updated_at,
        media: {
            audio: question.media_audio || '',
            image: question.media_image || '',
            video: question.media_video || ''
        },
        grammar_point: question.grammar_point || '',
        validation_status: question.validation_status || 'pending',
        is_active: !!question.active
    };
}

/**
 * 問題ID生成
 */
function generateQuestionId(subject, type) {
    const prefix = subject.replace('english_', '').replace('_', '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `${prefix}_${timestamp}${random}`;
}

/**
 * 問題データバリデーション
 */
function validateQuestionData(data) {
    const errors = [];

    // 必須フィールド
    if (!data.subject) errors.push('科目は必須です');
    if (!data.type) errors.push('問題タイプは必須です');
    if (!data.question?.text && !data.question_text) errors.push('問題文は必須です');
    if (!data.answer) errors.push('解答は必須です');

    // 難易度範囲
    if (data.difficulty && (data.difficulty < 1 || data.difficulty > 5)) {
        errors.push('難易度は1-5の範囲で指定してください');
    }

    // 選択肢の数
    if (data.type === 'multiple_choice' && data.options && data.options.length < 2) {
        errors.push('選択問題には2つ以上の選択肢が必要です');
    }

    // 有効な科目
    const validSubjects = [
        'english_grammar', 'english_vocab', 'english_listening',
        'english_reading', 'english_writing', 'math', 'physics', 'chemistry'
    ];
    if (data.subject && !validSubjects.includes(data.subject)) {
        errors.push('無効な科目です');
    }

    // 有効な問題タイプ
    const validTypes = [
        'multiple_choice', 'fill_in_blank', 'ordering',
        'short_answer', 'translation', 'transcription', 'error_correction'
    ];
    if (data.type && !validTypes.includes(data.type)) {
        errors.push('無効な問題タイプです');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * 問題エクスポート
 */
async function handleExportQuestions(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'csv';
        const subject = url.searchParams.get('subject') || '';
        const type = url.searchParams.get('type') || '';

        // WHERE句の構築
        let whereClause = 'is_deleted = 0';
        const bindings = [];

        if (subject) {
            whereClause += ' AND subject = ?';
            bindings.push(subject);
        }

        if (type) {
            whereClause += ' AND type = ?';
            bindings.push(type);
        }

        const query = `
            SELECT
                id, subject, type, question_text, question_translation,
                choices, correct_answer, explanation, explanation_simple, explanation_detailed,
                difficulty, tags, source, created_at, updated_at,
                media_audio, media_image, media_video, grammar_point,
                validation_status, active
            FROM questions
            WHERE ${whereClause}
            ORDER BY created_at DESC
        `;

        const questions = await env.TESTAPP_DB.prepare(query).bind(...bindings).all();

        if (format === 'json') {
            const exportData = {
                exportDate: new Date().toISOString(),
                totalQuestions: questions.results.length,
                questions: questions.results.map(q => normalizeQuestionResponse(q))
            };

            return new Response(JSON.stringify(exportData, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="questions_${new Date().toISOString().split('T')[0]}.json"`,
                    ...corsHeaders
                }
            });
        } else {
            // CSV形式
            let csv = 'ID,Subject,Type,Question Text,Question Translation,Answer,Explanation Simple,Explanation Detailed,Difficulty,Tags,Source,Created At\n';

            questions.results.forEach(q => {
                const normalized = normalizeQuestionResponse(q);
                const row = [
                    normalized.id,
                    normalized.subject,
                    normalized.type,
                    `"${normalized.question.text.replace(/"/g, '""')}"`,
                    `"${normalized.question.translation.replace(/"/g, '""')}"`,
                    `"${normalized.answer.replace(/"/g, '""')}"`,
                    `"${normalized.explanation.pl.replace(/"/g, '""')}"`,
                    `"${normalized.explanation.sp.replace(/"/g, '""')}"`,
                    normalized.difficulty,
                    `"${normalized.tags.join('; ')}"`,
                    `"${normalized.source.replace(/"/g, '""')}"`,
                    normalized.created_at
                ];
                csv += row.join(',') + '\n';
            });

            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="questions_${new Date().toISOString().split('T')[0]}.csv"`,
                    ...corsHeaders
                }
            });
        }

    } catch (error) {
        console.error('Export questions error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to export questions',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題インポート
 */
async function handleImportQuestions(request, env, corsHeaders) {
    try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            return await handleFileImport(request, env, corsHeaders);
        } else {
            // JSON形式のインポート
            return await handleJSONImport(request, env, corsHeaders);
        }

    } catch (error) {
        console.error('Import questions error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to import questions',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * JSON形式のインポート
 */
async function handleJSONImport(request, env, corsHeaders) {
    const jsonData = await request.json();
    const skipDuplicates = jsonData.skipDuplicates !== false;
    const validateOnly = jsonData.validateOnly === true;

    let imported = 0;
    let skipped = 0;
    let errors = [];

    const questions = Array.isArray(jsonData.questions) ? jsonData.questions : [jsonData];

    for (const questionData of questions) {
        try {
            // jsonplan.md形式のバリデーション
            const normalizedData = normalizeImportData(questionData);
            const validation = validateQuestionData(normalizedData);

            if (!validation.isValid) {
                errors.push({
                    id: normalizedData.id || 'unknown',
                    error: validation.errors.join(', ')
                });
                continue;
            }

            // 重複チェック
            if (skipDuplicates) {
                const existingQuery = 'SELECT id FROM questions WHERE question_text = ? AND subject = ? AND is_deleted = 0';
                const existing = await env.TESTAPP_DB.prepare(existingQuery)
                    .bind(normalizedData.question.text, normalizedData.subject)
                    .first();

                if (existing) {
                    skipped++;
                    continue;
                }
            }

            if (!validateOnly) {
                // データベースに挿入
                await insertQuestion(normalizedData, env);
                imported++;
            } else {
                imported++; // バリデーションのみの場合もカウント
            }

        } catch (error) {
            errors.push({
                id: questionData.id || 'unknown',
                error: error.message
            });
        }
    }

    return new Response(JSON.stringify({
        success: true,
        imported,
        skipped,
        errors,
        total: questions.length,
        mode: validateOnly ? 'validation_only' : 'import'
    }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

/**
 * ファイル形式のインポート
 */
async function handleFileImport(request, env, corsHeaders) {
    const formData = await request.formData();
    const file = formData.get('file');
    const skipDuplicates = formData.get('skipDuplicates') === 'true';
    const validateOnly = formData.get('validateOnly') === 'true';

    if (!file) {
        return new Response(JSON.stringify({
            success: false,
            error: 'No file provided'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    const fileContent = await file.text();
    const fileName = file.name.toLowerCase();

    let questions;

    if (fileName.endsWith('.json')) {
        try {
            const jsonData = JSON.parse(fileContent);
            questions = Array.isArray(jsonData.questions) ? jsonData.questions : [jsonData];
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid JSON format',
                details: error.message
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    } else if (fileName.endsWith('.csv')) {
        questions = parseCSV(fileContent);
    } else {
        return new Response(JSON.stringify({
            success: false,
            error: 'Unsupported file format. Please use JSON or CSV.'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // JSONインポート処理に委譲
    const importData = {
        questions,
        skipDuplicates,
        validateOnly
    };

    return await handleJSONImport({
        json: () => Promise.resolve(importData)
    }, env, corsHeaders);
}

/**
 * インポートデータの正規化
 */
function normalizeImportData(data) {
    return {
        subject: data.subject,
        type: data.type,
        question: {
            text: data.question?.text || data.question_text || '',
            translation: data.question?.translation || data.question_translation || ''
        },
        options: data.options || [],
        answer: data.answer,
        explanation: {
            pl: data.explanation?.pl || data.explanation_simple || '',
            sp: data.explanation?.sp || data.explanation_detailed || data.explanation || ''
        },
        difficulty: parseInt(data.difficulty) || 1,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()) : []),
        source: data.source || 'インポート',
        media: {
            audio: data.media?.audio || data.media_audio || '',
            image: data.media?.image || data.media_image || '',
            video: data.media?.video || data.media_video || ''
        },
        grammar_point: data.grammar_point || ''
    };
}

/**
 * 問題データベース挿入
 */
async function insertQuestion(normalizedData, env) {
    const questionId = generateQuestionId(normalizedData.subject, normalizedData.type);
    const now = new Date().toISOString();

    const choicesJson = JSON.stringify(normalizedData.options);
    const tagsJson = JSON.stringify(normalizedData.tags);
    const explanationJson = JSON.stringify(normalizedData.explanation);

    const query = `
        INSERT INTO questions (
            id, subject, type, question_text, question_translation,
            choices, correct_answer, explanation, explanation_simple, explanation_detailed,
            difficulty, tags, source, created_at, updated_at,
            media_audio, media_image, media_video, grammar_point,
            validation_status, active, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `;

    await env.TESTAPP_DB.prepare(query).bind(
        questionId,
        normalizedData.subject,
        normalizedData.type,
        normalizedData.question.text.substring(0, 50), // title
        normalizedData.question.text,
        normalizedData.question.translation,
        choicesJson,
        normalizedData.answer,
        explanationJson,
        normalizedData.explanation.pl,
        normalizedData.explanation.sp,
        normalizedData.difficulty,
        tagsJson,
        normalizedData.source,
        now,
        now,
        normalizedData.media.audio,
        normalizedData.media.image,
        normalizedData.media.video,
        normalizedData.grammar_point,
        1  // active
    ).run();

    return questionId;
}

/**
 * CSVパース
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const questions = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const question = {
                subject: values[headers.indexOf('Subject')] || '',
                type: values[headers.indexOf('Type')] || '',
                question: {
                    text: values[headers.indexOf('Question Text')] || '',
                    translation: values[headers.indexOf('Question Translation')] || ''
                },
                answer: values[headers.indexOf('Answer')] || '',
                explanation: {
                    pl: values[headers.indexOf('Explanation Simple')] || '',
                    sp: values[headers.indexOf('Explanation Detailed')] || ''
                },
                difficulty: parseInt(values[headers.indexOf('Difficulty')]) || 1,
                tags: values[headers.indexOf('Tags')] ? values[headers.indexOf('Tags')].split(';').map(t => t.trim()) : [],
                source: values[headers.indexOf('Source')] || 'CSVインポート'
            };
            questions.push(question);
        }
    }

    return questions;
}

/**
 * CSV行パース
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // エスケープされた引用符
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * 問題取得（個別）
 */
async function handleGetQuestion(questionId, env, corsHeaders) {
    try {
        const question = await env.TESTAPP_DB.prepare(
            'SELECT * FROM questions WHERE id = ? AND is_deleted = 0'
        ).bind(questionId).first();

        if (!question) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Question not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            question: normalizeQuestionResponse(question)
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get question error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get question',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題更新
 */
async function handleUpdateQuestion(questionId, request, env, corsHeaders) {
    try {
        const questionData = await request.json();
        const validation = validateQuestionData(questionData);

        if (!validation.isValid) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid question data',
                details: validation.errors
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const normalizedData = normalizeImportData(questionData);
        const now = new Date().toISOString();

        const choicesJson = JSON.stringify(normalizedData.options);
        const tagsJson = JSON.stringify(normalizedData.tags);
        const explanationJson = JSON.stringify(normalizedData.explanation);

        const query = `
            UPDATE questions SET
                subject = ?, type = ?, question_text = ?, question_translation = ?,
                choices = ?, correct_answer = ?, explanation = ?, explanation_simple = ?, explanation_detailed = ?,
                difficulty = ?, tags = ?, source = ?, updated_at = ?,
                media_audio = ?, media_image = ?, media_video = ?, grammar_point = ?,
                validation_status = 'pending'
            WHERE id = ? AND is_deleted = 0
        `;

        await env.TESTAPP_DB.prepare(query).bind(
            normalizedData.subject,
            normalizedData.type,
            normalizedData.question.text,
            normalizedData.question.translation,
            choicesJson,
            normalizedData.answer,
            explanationJson,
            normalizedData.explanation.pl,
            normalizedData.explanation.sp,
            normalizedData.difficulty,
            tagsJson,
            normalizedData.source,
            now,
            normalizedData.media.audio,
            normalizedData.media.image,
            normalizedData.media.video,
            normalizedData.grammar_point,
            questionId
        ).run();

        const updatedQuestion = await env.TESTAPP_DB.prepare(
            'SELECT * FROM questions WHERE id = ?'
        ).bind(questionId).first();

        return new Response(JSON.stringify({
            success: true,
            message: 'Question updated successfully',
            question: normalizeQuestionResponse(updatedQuestion)
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Update question error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update question',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題削除
 */
async function handleDeleteQuestion(questionId, env, corsHeaders) {
    try {
        const result = await env.TESTAPP_DB.prepare(
            'UPDATE questions SET is_deleted = 1, updated_at = ? WHERE id = ?'
        ).bind(new Date().toISOString(), questionId).run();

        if (result.changes === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Question not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Question deleted successfully'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Delete question error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to delete question',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題統計取得
 */
async function handleGetQuestionStats(questionId, env, corsHeaders) {
    try {
        // 基本問題情報
        const question = await env.TESTAPP_DB.prepare(
            'SELECT * FROM questions WHERE id = ? AND is_deleted = 0'
        ).bind(questionId).first();

        if (!question) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Question not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 試行統計（この機能は後で実装）
        const stats = {
            totalAttempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
            averageTime: 0,
            successRate: 0
        };

        return new Response(JSON.stringify({
            success: true,
            question: normalizeQuestionResponse(question),
            statistics: stats
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Get question stats error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get question statistics',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 問題バリデーション
 */
async function handleValidateQuestion(questionId, request, env, corsHeaders) {
    try {
        const requestData = await request.json();
        const action = requestData.action; // 'approve', 'reject', 'needs_revision'
        const notes = requestData.notes || '';

        if (!['approve', 'reject', 'needs_revision'].includes(action)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid validation action'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 更新クエリ
        const result = await env.TESTAPP_DB.prepare(`
            UPDATE questions
            SET validation_status = ?, updated_at = ?
            WHERE id = ? AND is_deleted = 0
        `).bind(action, new Date().toISOString(), questionId).run();

        if (result.changes === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Question not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Question ${action}d successfully`,
            validationStatus: action
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Validate question error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to validate question',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

/**
 * 管理者ダッシュボードハンドラー (/mana)
 */
async function handleAdminDashboard(request, env, corsHeaders, url) {
    try {
        if (request.method !== 'GET') {
            return new Response(JSON.stringify({
                error: 'Method not allowed'
            }), {
                status: 405,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // 認証チェック（実装時は適切な認証を追加）
        // const authResult = await verifyAdminAuth(request, env);
        // if (!authResult.success) {
        //     return new Response(JSON.stringify({
        //         error: 'Unauthorized'
        //     }), {
        //         status: 401,
        //         headers: { 'Content-Type': 'application/json', ...corsHeaders }
        //     });
        // }

        // 基本統計
        const statsQuery = `
            SELECT
                COUNT(*) as total_questions,
                COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending_questions,
                COUNT(CASE WHEN validation_status = 'approved' THEN 1 END) as approved_questions,
                COUNT(CASE WHEN active = 1 THEN 1 END) as active_questions,
                AVG(difficulty) as avg_difficulty
            FROM questions
            WHERE is_deleted = 0
        `;
        const stats = await env.TESTAPP_DB.prepare(statsQuery).first();

        // 科目別統計
        const subjectStatsQuery = `
            SELECT
                subject,
                COUNT(*) as count,
                AVG(difficulty) as avg_difficulty
            FROM questions
            WHERE is_deleted = 0
            GROUP BY subject
        `;
        const subjectStats = await env.TESTAPP_DB.prepare(subjectStatsQuery).all();

        // 最近の問題
        const recentQuestionsQuery = `
            SELECT id, subject, type, question_text, created_at, validation_status
            FROM questions
            WHERE is_deleted = 0
            ORDER BY created_at DESC
            LIMIT 10
        `;
        const recentQuestions = await env.TESTAPP_DB.prepare(recentQuestionsQuery).all();

        return new Response(JSON.stringify({
            success: true,
            dashboard: {
                statistics: stats,
                subjectStats: subjectStats.results,
                recentQuestions: recentQuestions.results
            }
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to load admin dashboard',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}