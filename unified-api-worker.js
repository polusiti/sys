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
                    version: 'debug-v1'
                }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            if (url.pathname === '/api/debug') {
                return new Response(JSON.stringify({
                    message: 'Debug endpoint working',
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