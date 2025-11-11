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

        // Only handle /mana path
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
            <button class="btn btn-primary" onclick="authenticate()">認証</button>
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
                <a href="https://unified-api-production.t88596565.workers.dev/pages/question-management.html"
                   style="color: white; font-size: 1.2rem; background: rgba(255,255,255,0.2); padding: 1rem 2rem;
                          border-radius: 8px; text-decoration: none; display: inline-block;">
                    問題管理システムを開く →
                </a>
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

                // Simulate loading
                setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('dashboard-content').style.display = 'block';
                    document.querySelector('.header p').textContent = '管理者ダッシュボード - 認証済み';
                }, 1500);
            } else {
                errorElement.textContent = 'IDまたはパスワードが間違っています';
                errorElement.style.display = 'block';
                document.getElementById('admin-pass').value = '';
                document.getElementById('admin-pass').focus();
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

        // 404 for other paths
        return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
};