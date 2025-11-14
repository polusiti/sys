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

            if (url.pathname.startsWith('/api/r2/')) {
                return handleR2API(request, env, corsHeaders, url);
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
            const { subject, question, answer, type } = body;

            if (!subject || !question) {
                return new Response(JSON.stringify({
                    error: 'Missing required fields'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            const result = await env.LEARNING_DB.prepare(`
                INSERT INTO questions (subject, question, answer, type, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `).bind(subject, question, answer || '', type || 'text').run();

            // Invalidate cache
            const cacheKey = `questions:${subject}`;
            await env.LANGUAGE_CACHE.delete(cacheKey);
            console.log(`🗑️ Cache invalidated: questions:${subject}`);

            return new Response(JSON.stringify({
                success: true,
                message: 'Question saved',
                questionId: result.meta.last_row_id
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
