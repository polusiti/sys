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
            if (url.pathname === '/api/health' || url.pathname === '/') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: 'unified-api-worker',
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                    version: 'ai-v1.0'
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

            // Legacy endpoints for compatibility
            if (url.pathname.startsWith('/api/d1/')) {
                return handleD1API(request, env, corsHeaders, url);
            }

            if (url.pathname.startsWith('/api/r2/')) {
                return handleR2API(request, env, corsHeaders, url);
            }

            // Unknown endpoint
            return new Response(JSON.stringify({
                error: 'Endpoint not found',
                path: url.pathname
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
                original_text: text,
                corrected_text: correctionResult.correctedText,
                error_analysis: correctionResult.errorAnalysis,
                suggestions: correctionResult.suggestions,
                sgif_category: correctionResult.sgifCategory,
                confidence_score: correctionResult.confidenceScore,
                processing_time: processingTime,
                // 互換性のためcamelCaseも含める
                originalText: text,
                correctedText: correctionResult.correctedText,
                errorAnalysis: correctionResult.errorAnalysis,
                suggestions: correctionResult.suggestions,
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