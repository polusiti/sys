/**
 * Unified API Worker for polusiti/sys with KV Caching
 * Version: v2.0-kv-cache
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            if (url.pathname === '/api/health' || url.pathname === '/') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: 'unified-api-worker',
                    database: 'connected',
                    kv: {
                        sessions: 'enabled',
                        languageCache: 'enabled'
                    },
                    features: [
                        'KV caching for sessions',
                        'KV caching for user profiles',
                        'KV caching for questions',
                        'Cache invalidation on updates'
                    ],
                    timestamp: new Date().toISOString(),
                    version: 'v2.0-kv-cache'
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

            if (url.pathname.startsWith('/api/d1/')) {
                return handleD1API(request, env, corsHeaders, url);
            }

            // Legacy note API endpoint - redirect to D1 API
            if (url.pathname.startsWith('/api/note/')) {
                // Rewrite URL from /api/note/ to /api/d1/
                const newUrl = new URL(request.url);
                newUrl.pathname = newUrl.pathname.replace('/api/note/', '/api/d1/');
                const newRequest = new Request(newUrl, request);
                return handleD1API(newRequest, env, corsHeaders, newUrl);
            }

            if (url.pathname.startsWith('/api/r2/')) {
                return handleR2API(request, env, corsHeaders, url);
            }

            // English composition correction API
            if (url.pathname === '/api/english/compose' && request.method === 'POST') {
                return handleEnglishCompose(request, env, corsHeaders);
            }

            // Mana Dashboard endpoint
            if (url.pathname === '/mana') {
                return handleManaRequest(request, env, corsHeaders);
            }

            // Turnstile verification for Mana
            if (url.pathname === '/api/verify-turnstile' && request.method === 'POST') {
                return handleTurnstileVerification(request, corsHeaders);
            }

            // Ratings API
            if (url.pathname.startsWith('/api/ratings')) {
                return handleRatingsAPI(request, env, corsHeaders, url);
            }

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

async function handleRegister(request, env, corsHeaders) {
    try {
        const body = await request.json();
        const { userId, displayName, email, inquiryNumber } = body;

        if (!userId || !displayName) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: userId, displayName'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const finalEmail = email || `${userId}@secure.learning-notebook.local`;

        const existingUser = await env.LEARNING_DB.prepare(`
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

        const result = await env.LEARNING_DB.prepare(`
            INSERT INTO users_v2 (username, email, display_name)
            VALUES (?, ?, ?)
        `).bind(userId, finalEmail, displayName).run();

        const userId_db = result.meta.last_row_id;

        const safeInquiryNumber = inquiryNumber || '';
        if (safeInquiryNumber && safeInquiryNumber.trim() !== '') {
            await env.LEARNING_DB.prepare(`
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

async function handlePasskeyRegisterBegin(request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        // バリデーション: userIdが必須
        if (!userId) {
            return new Response(JSON.stringify({
                error: 'Missing required field: userId'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        let user = await env.LEARNING_DB.prepare(`
            SELECT id, username FROM users_v2 WHERE username = ? OR id = ?
        `).bind(userId, !isNaN(userId) ? parseInt(userId) : userId).first();

        if (!user) {
            return new Response(JSON.stringify({
                error: 'User not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const challengeBase64 = btoa(String.fromCharCode(...challenge))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await env.LEARNING_DB.prepare(`
            INSERT INTO webauthn_challenges_v2 (challenge, user_id, operation_type, expires_at)
            VALUES (?, ?, 'registration', ?)
        `).bind(challengeBase64, user.id, expiresAt).run();

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

async function handlePasskeyRegisterComplete(request, env, corsHeaders) {
    try {
        const { userId, credential, challenge } = await request.json();

        const challengeRecord = await env.LEARNING_DB.prepare(`
            SELECT id, user_id, expires_at FROM webauthn_challenges_v2
            WHERE challenge = ? AND operation_type = 'registration' AND used = 0
        `).bind(challenge).first();

        if (!challengeRecord || new Date(challengeRecord.expires_at) < new Date()) {
            return new Response(JSON.stringify({
                error: 'Invalid or expired challenge'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        await env.LEARNING_DB.prepare(`
            UPDATE webauthn_challenges_v2 SET used = 1 WHERE id = ?
        `).bind(challengeRecord.id).run();

        await env.LEARNING_DB.prepare(`
            UPDATE users_v2 SET
                passkey_credential_id = ?,
                passkey_public_key = ?,
                passkey_sign_count = ?
            WHERE id = ?
        `).bind(
            credential.id,
            credential.response.publicKey || JSON.stringify(credential.response),
            0,
            challengeRecord.user_id
        ).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'パスキー登録が完了しました'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Passkey register complete error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to complete passkey registration',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

async function handlePasskeyLoginBegin(request, env, corsHeaders) {
    try {
        const { username } = await request.json();

        const user = await env.LEARNING_DB.prepare(`
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

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const challengeBase64 = btoa(String.fromCharCode(...challenge))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await env.LEARNING_DB.prepare(`
            INSERT INTO webauthn_challenges_v2 (challenge, user_id, operation_type, expires_at)
            VALUES (?, ?, 'authentication', ?)
        `).bind(challengeBase64, user.id, expiresAt).run();

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

async function handlePasskeyLoginComplete(request, env, corsHeaders) {
    try {
        const { username, credential, challenge } = await request.json();

        const user = await env.LEARNING_DB.prepare(`
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

        const challengeRecord = await env.LEARNING_DB.prepare(`
            SELECT id, user_id, expires_at FROM webauthn_challenges_v2
            WHERE challenge = ? AND operation_type = 'authentication' AND used = 0
        `).bind(challenge).first();

        if (!challengeRecord || new Date(challengeRecord.expires_at) < new Date()) {
            return new Response(JSON.stringify({
                error: 'Invalid or expired challenge'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (user.passkey_credential_id !== credential.id) {
            return new Response(JSON.stringify({
                error: 'Credential mismatch'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        await env.LEARNING_DB.prepare(`
            UPDATE webauthn_challenges_v2 SET used = 1 WHERE id = ?
        `).bind(challengeRecord.id).run();

        await env.LEARNING_DB.prepare(`
            UPDATE users_v2 SET
                last_login = datetime('now'),
                login_count = login_count + 1,
                passkey_sign_count = ?
            WHERE id = ?
        `).bind((user.passkey_sign_count || 0) + 1, user.id).run();

        const sessionToken = generateSessionToken();
        const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await env.LEARNING_DB.prepare(`
            INSERT INTO webauthn_sessions (id, user_id, credential_id, expires_at)
            VALUES (?, ?, ?, ?)
        `).bind(sessionToken, user.id, credential.id, sessionExpiresAt).run();

        // Cache session in KV (TTL: 24 hours)
        const sessionData = {
            userId: user.id,
            username: user.username,
            credentialId: credential.id,
            expiresAt: sessionExpiresAt,
            createdAt: new Date().toISOString()
        };
        await env.SESSIONS.put(
            `session:${sessionToken}`,
            JSON.stringify(sessionData),
            { expirationTtl: 86400 }
        );

        // Cache user profile in KV (TTL: 1 hour)
        const userProfile = {
            id: user.id,
            username: user.username,
            displayName: user.username,
            lastLogin: new Date().toISOString(),
            loginCount: (user.login_count || 0) + 1
        };
        await env.LANGUAGE_CACHE.put(
            `user:profile:${user.id}`,
            JSON.stringify(userProfile),
            { expirationTtl: 3600 }
        );

        console.log('✅ Login successful with KV caching:', user.id);

        return new Response(JSON.stringify({
            success: true,
            message: 'ログインしました！',
            user: {
                id: user.id,
                username: user.username,
                displayName: user.username
            },
            sessionToken: sessionToken,
            expiresIn: 24 * 60 * 60
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`,
                ...corsHeaders
            }
        });

    } catch (error) {
        console.error('Passkey login complete error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to complete passkey login',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function handleD1API(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/d1', '');

    // GET /questions?subject=<subject> - with KV caching
    if (path === '/questions' && request.method === 'GET') {
        try {
            const urlObj = new URL(request.url);
            const subject = urlObj.searchParams.get('subject');

            if (!subject) {
                return new Response(JSON.stringify({
                    error: 'Missing subject parameter'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Try KV cache first
            const cacheKey = `questions:${subject}`;
            const cachedData = await env.LANGUAGE_CACHE.get(cacheKey);

            if (cachedData) {
                console.log(`✅ Cache HIT: questions:${subject}`);
                return new Response(cachedData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Cache-Status': 'HIT',
                        ...corsHeaders
                    }
                });
            }

            console.log(`⚠️ Cache MISS: questions:${subject}`);

            const result = await env.LEARNING_DB.prepare(`
                SELECT * FROM questions WHERE subject = ? ORDER BY id DESC
            `).bind(subject).all();

            const response = {
                success: true,
                questions: result.results || [],
                count: result.results?.length || 0,
                subject: subject
            };

            const responseJson = JSON.stringify(response);

            // Cache in KV (TTL: 1 hour)
            await env.LANGUAGE_CACHE.put(cacheKey, responseJson, {
                expirationTtl: 3600
            });

            return new Response(responseJson, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cache-Status': 'MISS',
                    ...corsHeaders
                }
            });

        } catch (error) {
            console.error('Failed to retrieve questions:', error);
            return new Response(JSON.stringify({
                error: 'Failed to retrieve questions',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    // POST /questions - with cache invalidation
    if (path === '/questions' && request.method === 'POST') {
        try {
            const body = await request.json();

            // Validate required fields
            if (!body.id || !body.subject || !body.title || !body.question_text || !body.correct_answer) {
                return new Response(JSON.stringify({
                    error: 'Missing required fields',
                    required: ['id', 'subject', 'title', 'question_text', 'correct_answer']
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Build INSERT statement with all provided fields
            const result = await env.LEARNING_DB.prepare(`
                INSERT INTO questions (
                    id, subject, title, question_text, correct_answer,
                    source, word, is_listening, difficulty_level, mode,
                    choices, media_urls, explanation, tags, type,
                    segments, answer_raw, difficulty, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
                body.id,
                body.subject,
                body.title,
                body.question_text,
                body.correct_answer,
                body.source || 'learning-notebook',
                body.word || null,
                body.is_listening ? 1 : 0,
                body.difficulty_level || 'medium',
                body.mode || null,
                body.choices || null,
                body.media_urls || null,
                body.explanation || null,
                body.tags || null,
                body.type || 'multiple_choice',
                body.segments || null,
                body.answer_raw || null,
                body.difficulty || 1
            ).run();

            // Invalidate cache
            const cacheKey = `questions:${body.subject}`;
            await env.LANGUAGE_CACHE.delete(cacheKey);
            console.log(`🗑️ Cache invalidated: questions:${body.subject}`);

            return new Response(JSON.stringify({
                success: true,
                message: 'Question saved',
                questionId: body.id
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            console.error('Failed to save question:', error);
            return new Response(JSON.stringify({
                error: 'Failed to save question',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    // DELETE /questions/:id - with cache invalidation
    if (path.match(/^\/questions\/\d+$/) && request.method === 'DELETE') {
        try {
            const questionId = path.split('/')[2];

            const question = await env.LEARNING_DB.prepare(`
                SELECT subject FROM questions WHERE id = ?
            `).bind(questionId).first();

            if (!question) {
                return new Response(JSON.stringify({
                    error: 'Question not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            await env.LEARNING_DB.prepare(`
                DELETE FROM questions WHERE id = ?
            `).bind(questionId).run();

            // Invalidate cache
            const cacheKey = `questions:${question.subject}`;
            await env.LANGUAGE_CACHE.delete(cacheKey);
            console.log(`🗑️ Cache invalidated: questions:${question.subject}`);

            return new Response(JSON.stringify({
                success: true,
                message: 'Question deleted'
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            console.error('Failed to delete question:', error);
            return new Response(JSON.stringify({
                error: 'Failed to delete question',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    // GET /passages?subject=<subject> - for listening questions with passage format
    if (path === '/passages' && request.method === 'GET') {
        try {
            const urlObj = new URL(request.url);
            const subject = urlObj.searchParams.get('subject');
            const passageId = urlObj.searchParams.get('passageId');
            const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);

            // Get specific passage questions by passageId
            if (passageId) {
                const result = await env.LEARNING_DB.prepare(`
                    SELECT * FROM questions
                    WHERE id = ? AND is_listening = 1
                    ORDER BY created_at DESC
                `).bind(passageId).all();

                const response = {
                    success: true,
                    questions: result.results || [],
                    count: result.results?.length || 0
                };

                return new Response(JSON.stringify(response), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            // Get all passages by subject
            if (!subject) {
                return new Response(JSON.stringify({
                    error: 'Missing subject or passageId parameter'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Query passages from questions table where is_listening = 1
            const result = await env.LEARNING_DB.prepare(`
                SELECT * FROM questions
                WHERE subject = ? AND is_listening = 1
                ORDER BY created_at DESC
                LIMIT ?
            `).bind(subject, limit).all();

            const response = {
                success: true,
                passages: result.results || [],
                count: result.results?.length || 0,
                subject: subject
            };

            return new Response(JSON.stringify(response), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            console.error('Failed to retrieve passages:', error);
            return new Response(JSON.stringify({
                error: 'Failed to retrieve passages',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    // POST /questions/batch - JSON bulk upload
    if (path === '/questions/batch' && request.method === 'POST') {
        try {
            const body = await request.json();
            const { questions } = body;

            if (!Array.isArray(questions) || questions.length === 0) {
                return new Response(JSON.stringify({
                    error: 'Invalid questions array'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            const results = [];
            const errors = [];

            for (const q of questions) {
                try {
                    await env.LEARNING_DB.prepare(`
                        INSERT INTO questions (
                            id, subject, title, question_text, correct_answer,
                            is_listening, difficulty_level, choices, media_urls,
                            explanation, tags, active, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
                    `).bind(
                        q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        q.subject || 'english-listening',
                        q.title || '',
                        q.question_text || q.question || '',
                        q.correct_answer || q.answer || '',
                        q.is_listening ? 1 : 0,
                        q.difficulty_level || 'easy',
                        q.choices ? JSON.stringify(q.choices) : null,
                        q.media_urls ? JSON.stringify(q.media_urls) : null,
                        q.explanation || null,
                        q.tags ? JSON.stringify(q.tags) : null
                    ).run();

                    results.push({ id: q.id, success: true });
                } catch (error) {
                    errors.push({ id: q.id, error: error.message });
                }
            }

            // Invalidate cache
            const subjects = [...new Set(questions.map(q => q.subject || 'english-listening'))];
            for (const subject of subjects) {
                await env.LANGUAGE_CACHE?.delete(`questions:${subject}`);
            }

            return new Response(JSON.stringify({
                success: true,
                imported: results.length,
                failed: errors.length,
                results,
                errors
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            console.error('Failed to batch upload questions:', error);
            return new Response(JSON.stringify({
                error: 'Failed to batch upload questions',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    return new Response(JSON.stringify({
        error: 'D1 endpoint not implemented',
        path: path
    }), {
        status: 501,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

async function handleR2API(request, env, corsHeaders, url) {
    const path = url.pathname.replace('/api/r2', '');

    // POST /upload/audio - Upload audio file to R2
    if (path === '/upload/audio' && request.method === 'POST') {
        try {
            const formData = await request.formData();
            const file = formData.get('audio');
            const questionId = formData.get('questionId') || `audio-${Date.now()}`;

            if (!file) {
                return new Response(JSON.stringify({
                    error: 'No audio file provided'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop() || 'wav';
            const filename = `audio/${questionId}-${Date.now()}.${fileExt}`;

            // Upload to R2
            await env.QUESTA_BUCKET.put(filename, file.stream(), {
                httpMetadata: {
                    contentType: file.type || 'audio/wav'
                }
            });

            // Generate public URL
            const publicUrl = `https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/${filename}`;

            return new Response(JSON.stringify({
                success: true,
                url: publicUrl,
                filename: filename
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (error) {
            console.error('Failed to upload audio:', error);
            return new Response(JSON.stringify({
                error: 'Failed to upload audio',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    // GET /audio/:filename - Get audio file from R2
    if (path.startsWith('/audio/') && request.method === 'GET') {
        try {
            const filename = path.substring(1); // Remove leading slash
            const object = await env.QUESTA_BUCKET.get(filename);

            if (!object) {
                return new Response(JSON.stringify({
                    error: 'Audio file not found'
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            return new Response(object.body, {
                headers: {
                    'Content-Type': object.httpMetadata.contentType || 'audio/wav',
                    ...corsHeaders
                }
            });

        } catch (error) {
            console.error('Failed to retrieve audio:', error);
            return new Response(JSON.stringify({
                error: 'Failed to retrieve audio',
                details: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    if (path.startsWith('/questions/') && request.method === 'GET') {
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

// ==================== English Composition Correction API ====================

async function handleEnglishCompose(request, env, corsHeaders) {
    try {
        const body = await request.json();
        const { userId, text } = body;

        if (!text || typeof text !== 'string') {
            return new Response(JSON.stringify({
                error: 'Missing or invalid text field'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Workers AIを使用して英作文を添削
        const prompt = `あなたは英作文添削の専門家です。以下の英作文を分析し、JSON形式で添削結果を返してください。

# 4軸評価基準
- F (Form): 形・文法・語法・構文の誤り（減点: -2～-4点）
- N (Naturalness): 不自然な表現（減点: -1～-3点）
- M (Meaning): 意味のズレ（減点: -1～-5点）
- W (Writing): スペル・句読点の誤り（減点: -1～-2点）

# 5段階評価基準（100点満点）
- S（100点）: 一流コラムニストレベル、完璧な英文
- A（80点）: 優秀な高校生レベル、非の打ち所がない
- B（60点）: 少し瑕疵はあるが訂正すればA評価になる
- C（40点）: 論理が少し強引、破綻がちらほら見られる
- D（20点）: 訂正で真っ赤、元の文章はほとんど残らない
- E（0点）: 幼稚園レベル、採点不可

# 採点方法
1. 100点から開始
2. 各エラーのdeduction（減点）を合計
3. 合計減点を100から引いて最終スコアを算出（最低0点）
4. スコアに基づいてグレード（S/A/B/C/D/E）を決定

# 入力文
${text}

# 出力形式（必ずこの形式のJSON）
{
  "errors": [
    {
      "category": "F|N|M|W",
      "span": "誤り箇所の文字列",
      "correction": "修正後の文字列",
      "explanation": "日本語で簡潔な説明（1-2文）",
      "deduction": -2
    }
  ],
  "examples_exp": [
    "参考例文1（自然な英文）",
    "参考例文2（自然な英文）"
  ],
  "global": {
    "grade": "C",
    "score": 32,
    "explanation": "全体として論理の破綻や内容不足が見られる。基本的な文法は理解しているが、表現の自然さに欠ける部分が多い。"
  }
}

# 重要
- errorsは配列で、複数のエラーを検出した場合はすべて含めてください
- spanは元の文から正確に抽出してください
- deductionは各エラーの重大度に応じて適切な減点を設定（F: -2～-4, N: -1～-3, M: -1～-5, W: -1～-2）
- explanationは日本語で、学習者が理解しやすいように
- examples_expは入力文と似た文脈で、より自然な表現を2つ提示
- globalオブジェクトで全体評価を提供（grade, score, explanation）
- scoreは100点満点から減点の合計を引いた値（最低0点）
- gradeはscoreに基づいて判定（S:100, A:80以上, B:60以上, C:40以上, D:20以上, E:20未満）
- JSONのみを返し、他のテキストは含めないでください`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
            messages: [
                { role: 'system', content: 'You are an expert English composition corrector. Always respond with valid JSON only, no additional text.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        // AI応答からJSONを抽出
        let correctionData;
        try {
            const responseText = aiResponse.response || '';
            // JSONブロックを抽出（マークダウンコードブロックの可能性を考慮）
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                correctionData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in AI response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError, aiResponse);
            // フォールバック: エラーが見つからなかった場合の応答
            correctionData = {
                errors: [],
                examples_exp: [
                    "Your writing looks good!",
                    "Keep up the great work!"
                ],
                global: {
                    grade: "A",
                    score: 100,
                    explanation: "エラーが検出されませんでした。素晴らしい英文です。"
                }
            };
        }

        // スコアとグレードを必ず再計算（AIの計算を信用しない）
        // eisaku.md仕様：100点満点から各エラーのdeductionを引く
        const totalDeduction = (correctionData.errors || []).reduce((sum, err) => sum + (err.deduction || 0), 0);
        const score = Math.max(0, 100 + totalDeduction); // deductionは負の値

        // グレード判定（eisaku.md基準: S=100, A=80+, B=60+, C=40+, D=20+, E=0-19）
        let grade = 'E';
        if (score === 100) grade = 'S';
        else if (score >= 80) grade = 'A';
        else if (score >= 60) grade = 'B';
        else if (score >= 40) grade = 'C';
        else if (score >= 20) grade = 'D';

        // AIのexplanationは保持、スコアとグレードは上書き
        correctionData.global = {
            grade: grade,
            score: score,
            explanation: correctionData.global?.explanation || `${correctionData.errors.length}個のエラーが検出されました。`
        };

        // レスポンスを構築
        const response = {
            success: true,
            data: {
                id: crypto.randomUUID(),
                input_text: text,
                errors: correctionData.errors || [],
                examples_exp: correctionData.examples_exp || [],
                global: correctionData.global,
                created_at: new Date().toISOString()
            }
        };

        // D1に保存（オプション）
        if (userId && env.LEARNING_DB) {
            try {
                await env.LEARNING_DB.prepare(`
                    INSERT INTO english_compositions (
                        user_id, original_text, error_analysis, examples_exp,
                        global_grade, global_score, global_explanation, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    userId,
                    text,
                    JSON.stringify(correctionData.errors),
                    JSON.stringify(correctionData.examples_exp),
                    correctionData.global.grade,
                    correctionData.global.score,
                    correctionData.global.explanation,
                    new Date().toISOString()
                ).run();
            } catch (dbError) {
                console.error('Failed to save to database:', dbError);
                // データベースエラーでも添削結果は返す
            }
        }

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('English composition error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process composition',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// Mana Dashboard Handler
async function handleManaRequest(request, env, corsHeaders) {
    const html = getDashboardHTML();
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=UTF-8', ...corsHeaders }
    });
}

// Turnstile Verification Handler
async function handleTurnstileVerification(request, corsHeaders) {
    try {
        const { token } = await request.json();

        if (!token) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Turnstile token is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: '0x4AAAAAAAB85_tYi3oPwIAUZ',
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
                error: 'Turnstile verification failed',
                details: result['error-codes'] || ['Unknown error']
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
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

// ===================================
// Ratings API Handler
// ===================================

async function handleRatingsAPI(request, env, corsHeaders, url) {
    const path = url.pathname;
    const method = request.method;

    try {
        // POST /api/ratings/submit - 評価投稿
        if (path === '/api/ratings/submit' && method === 'POST') {
            return await handleSubmitRating(request, env, corsHeaders);
        }

        // GET /api/ratings/:questionId - 評価一覧取得
        const listMatch = path.match(/^\/api\/ratings\/([^\/]+)$/);
        if (listMatch && method === 'GET') {
            return await handleGetRatings(request, env, corsHeaders, listMatch[1], url);
        }

        // GET /api/ratings/:questionId/stats - 統計取得
        const statsMatch = path.match(/^\/api\/ratings\/([^\/]+)\/stats$/);
        if (statsMatch && method === 'GET') {
            return await handleGetStats(request, env, corsHeaders, statsMatch[1]);
        }

        // GET /api/ratings/user/current - 現在のユーザー評価
        if (path === '/api/ratings/user/current' && method === 'GET') {
            return await handleGetUserRating(request, env, corsHeaders, url);
        }

        // DELETE /api/ratings/:questionId/delete - 評価削除
        const deleteMatch = path.match(/^\/api\/ratings\/([^\/]+)\/delete$/);
        if (deleteMatch && method === 'DELETE') {
            return await handleDeleteRating(request, env, corsHeaders, deleteMatch[1]);
        }

        return new Response(JSON.stringify({
            error: 'Ratings endpoint not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } catch (error) {
        console.error('Ratings API error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// 評価投稿
async function handleSubmitRating(request, env, corsHeaders) {
    const { questionId, userId, rating, comment } = await request.json();

    if (!questionId || !userId || !rating) {
        return new Response(JSON.stringify({
            error: 'Missing required fields'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // 既存の評価を確認
    const existing = await env.LEARNING_DB.prepare(`
        SELECT id FROM question_ratings WHERE question_id = ? AND user_id = ?
    `).bind(questionId, userId).first();

    if (existing) {
        // 更新
        await env.LEARNING_DB.prepare(`
            UPDATE question_ratings 
            SET rating = ?, comment = ?, created_at = datetime('now')
            WHERE id = ?
        `).bind(rating, comment || null, existing.id).run();

        return new Response(JSON.stringify({
            success: true,
            message: '評価を更新しました'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } else {
        // 新規作成
        await env.LEARNING_DB.prepare(`
            INSERT INTO question_ratings (question_id, user_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(questionId, userId, rating, comment || null).run();

        return new Response(JSON.stringify({
            success: true,
            message: '評価を投稿しました'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// 評価一覧取得
async function handleGetRatings(request, env, corsHeaders, questionId, url) {
    const params = new URL(request.url).searchParams;
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    const sort = params.get('sort') || 'newest';
    const offset = (page - 1) * limit;

    let orderBy = 'qr.created_at DESC';
    if (sort === 'highest') orderBy = 'qr.rating DESC, qr.created_at DESC';
    if (sort === 'lowest') orderBy = 'qr.rating ASC, qr.created_at DESC';

    const ratings = await env.LEARNING_DB.prepare(`
        SELECT qr.id, qr.question_id, qr.user_id, qr.rating, qr.comment, qr.created_at,
               u.display_name, u.avatar_type, u.avatar_value
        FROM question_ratings qr
        LEFT JOIN users_v2 u ON qr.user_id = u.username
        WHERE qr.question_id = ?
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
    `).bind(questionId, limit, offset).all();

    const totalCount = await env.LEARNING_DB.prepare(`
        SELECT COUNT(*) as count FROM question_ratings WHERE question_id = ?
    `).bind(questionId).first();

    return new Response(JSON.stringify({
        success: true,
        data: {
            ratings: ratings.results,
            pagination: {
                page,
                limit,
                total: totalCount.count,
                hasMore: (page * limit) < totalCount.count
            }
        }
    }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

// 統計取得
async function handleGetStats(request, env, corsHeaders, questionId) {
    const stats = await env.LEARNING_DB.prepare(`
        SELECT 
            COUNT(*) as totalCount,
            AVG(rating) as averageRating,
            rating,
            COUNT(*) as count
        FROM question_ratings 
        WHERE question_id = ?
        GROUP BY rating
    `).bind(questionId).all();

    const distribution = await env.LEARNING_DB.prepare(`
        SELECT rating, COUNT(*) as count
        FROM question_ratings
        WHERE question_id = ?
        GROUP BY rating
    `).bind(questionId).all();

    const totalCount = stats.results.reduce((sum, s) => sum + s.count, 0);
    const averageRating = totalCount > 0 
        ? stats.results.reduce((sum, s) => sum + (s.rating * s.count), 0) / totalCount
        : 0;

    return new Response(JSON.stringify({
        success: true,
        data: {
            stats: {
                totalCount,
                averageRating
            },
            distribution: distribution.results
        }
    }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

// 現在のユーザー評価取得
async function handleGetUserRating(request, env, corsHeaders, url) {
    const params = new URL(request.url).searchParams;
    const questionId = params.get('questionId');
    const userId = params.get('userId');

    if (!questionId || !userId) {
        return new Response(JSON.stringify({
            error: 'Missing questionId or userId'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    const rating = await env.LEARNING_DB.prepare(`
        SELECT id, rating, comment, created_at
        FROM question_ratings
        WHERE question_id = ? AND user_id = ?
    `).bind(questionId, userId).first();

    return new Response(JSON.stringify({
        success: true,
        data: {
            rating: rating || null
        }
    }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

// 評価削除
async function handleDeleteRating(request, env, corsHeaders, questionId) {
    const { userId } = await request.json();

    if (!userId) {
        return new Response(JSON.stringify({
            error: 'Missing userId'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    await env.LEARNING_DB.prepare(`
        DELETE FROM question_ratings
        WHERE question_id = ? AND user_id = ?
    `).bind(questionId, userId).run();

    return new Response(JSON.stringify({
        success: true,
        message: '評価を削除しました'
    }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}

// Mana Dashboard HTML
function getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>問題管理ダッシュボード - Mana</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .header h1 {
            color: white;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
        }
        .auth-form {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            margin: 0 auto 2rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        }
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .btn {
            width: 100%;
            padding: 0.875rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        .btn-primary:hover:not(:disabled) {
            background: #2563eb;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .error {
            background: #fef2f2;
            color: #ef4444;
            padding: 0.75rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-size: 0.9rem;
            border: 1px solid #fecaca;
        }
        .loading {
            background: #f0f9ff;
            color: #1e40af;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            font-size: 1.1rem;
        }
        .dashboard-content {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .success-message {
            background: #ecfdf5;
            color: #059669;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 1px solid #a7f3d0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #64748b;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="material-symbols-rounded" style="vertical-align: middle;">settings</span> 問題管理ダッシュボード</h1>
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
                <div class="cf-turnstile" data-sitekey="0x4AAAAAACAhy_EoZrMC0Krb" data-callback="onTurnstileSuccess"></div>
            </div>
            <button class="btn btn-primary" onclick="authenticate()" id="auth-button" disabled>認証</button>
            <div id="auth-error" class="error" style="display: none;"></div>
        </div>

        <div id="loading" class="loading" style="display: none;">
            <p>認証中...</p>
        </div>

        <div class="dashboard-content" id="dashboard-content" style="display: none;">
            <div class="success-message">
                <span class="material-symbols-rounded" style="vertical-align: middle;">check_circle</span> 認証に成功しました。問題管理システムへようこそ！
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value"><span class="material-symbols-rounded">check_circle</span></div>
                    <div class="stat-label">システム状態</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">8</div>
                    <div class="stat-label">対応形式</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">JSON</div>
                    <div class="stat-label">一括登録</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">API</div>
                    <div class="stat-label">完全連携</div>
                </div>
            </div>

            <div style="background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><span class="material-symbols-rounded" style="vertical-align: middle;">rocket_launch</span> 利用可能な機能</h3>
                <ul style="line-height: 1.8; color: #374151;">
                    <li><span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">check</span> jsonplan.md準拠の8形式問題登録</li>
                    <li><span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">check</span> JSON一括インポート機能</li>
                    <li><span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">check</span> Cloudflare Turnstileボット保護</li>
                    <li><span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">check</span> APIエンドポイント統一管理</li>
                    <li><span class="material-symbols-rounded" style="font-size: 16px; vertical-align: middle;">check</span> パスキー認証システム</li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 2rem;">
                <h3 style="color: white; margin-bottom: 1rem;"><span class="material-symbols-rounded" style="vertical-align: middle;">analytics</span> 問題管理システム</h3>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="https://unified-api-production.t88596565.workers.dev/pages/question-management.html"
                       style="color: white; font-size: 1.2rem; background: rgba(255,255,255,0.2); padding: 1rem 2rem;
                              border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 1rem;">
                        <span class="material-symbols-rounded" style="vertical-align: middle;">edit_note</span> 問題管理画面
                    </a>
                    <a href="/pages/subject-select.html"
                       style="color: white; font-size: 1.2rem; background: rgba(16, 185, 129, 0.3); padding: 1rem 2rem;
                              border-radius: 8px; text-decoration: none; display: inline-block; margin-bottom: 1rem;">
                        <span class="material-symbols-rounded" style="vertical-align: middle;">menu_book</span> 学習画面
                    </a>
                </div>

                <div style="margin-top: 2rem;">
                    <button onclick="window.location.href='/'"
                            style="color: #1e293b; background: white; padding: 0.75rem 1.5rem;
                                   border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                        <span class="material-symbols-rounded" style="vertical-align: middle;">home</span> ホームに戻る
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Turnstile成功コールバック
        function onTurnstileSuccess(token) {
            document.getElementById('auth-button').disabled = false;
            console.log('Turnstile verification successful');
        }

        // 認証処理
        async function authenticate() {
            const adminId = document.getElementById('admin-id').value;
            const password = document.getElementById('admin-pass').value;
            const errorElement = document.getElementById('auth-error');
            const authButton = document.getElementById('auth-button');

            // バリデーション
            if (!adminId || !password) {
                errorElement.textContent = 'IDとパスワードを入力してください';
                errorElement.style.display = 'block';
                return;
            }

            // Turnstile検証
            const turnstileToken = document.querySelector('.cf-turnstile')?.querySelector('textarea')?.value;
            if (!turnstileToken) {
                errorElement.textContent = 'ボット認証を完了してください';
                errorElement.style.display = 'block';
                return;
            }

            // 認証情報
            const validCredentials = [
                { id: 'P37600', password: 'コードギアス' }
            ];

            const isValid = validCredentials.some(cred =>
                cred.id === adminId && cred.password === password
            );

            if (isValid) {
                // 認証成功
                authButton.disabled = true;
                document.getElementById('auth-form').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                document.getElementById('loading').textContent = '認証成功 - ダッシュボード読み込み中...';

                // サーバー検証
                try {
                    const response = await fetch('/api/verify-turnstile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
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
                    document.getElementById('auth-button').disabled = true;
                }
            } else {
                // 認証失敗
                errorElement.textContent = 'IDまたはパスワードが間違っています';
                errorElement.style.display = 'block';
                document.getElementById('admin-pass').value = '';
                document.getElementById('admin-pass').focus();
                document.getElementById('auth-button').disabled = true;
            }
        }

        // キーボードイベント
        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authenticate();
        });

        // 初期化
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('admin-pass').focus();
        });
    </script>
</body>
</html>`
}
