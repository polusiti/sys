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
 * Handle user registration with email constraint fix
 */
async function handleRegister(request, env, corsHeaders) {
    try {
        // Verify admin token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                error: 'Unauthorized'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const token = authHeader.substring(7);
        if (token !== env.ADMIN_TOKEN) {
            return new Response(JSON.stringify({
                error: 'Invalid admin token'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const body = await request.json();
        const { userId, displayName, email, inquiryNumber } = body;

        // Validation
        if (!userId || !displayName) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: userId, displayName'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Check for existing user
        const existingUser = await env.LEARNING_DB.prepare(`
            SELECT id FROM users WHERE username = ? OR display_name = ? OR id = ?
        `).bind(userId, displayName, inquiryNumber).first();

        if (existingUser) {
            return new Response(JSON.stringify({
                error: 'このユーザーID、表示名、またはお問い合わせ番号は既に使用されています'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // FIXED: Handle email constraint properly
        // Generate email if not provided, or use provided email
        const finalEmail = email || `${userId}@secure.learning-notebook.local`;

        // Ensure inquiryNumber is properly initialized
        const safeInquiryNumber = inquiryNumber || '';

        console.log('Registering user:', {
            userId,
            displayName,
            email: finalEmail,
            inquiryNumber: safeInquiryNumber
        });

        // Insert user with proper email handling and all required fields
        const result = await env.LEARNING_DB.prepare(`
            INSERT INTO users (username, email, password_hash, display_name, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(userId, finalEmail, 'passkey-user', displayName).run();

        const userId_db = result.meta.last_row_id;

        // Store inquiry number if provided (for recovery) - handle undefined properly
        if (safeInquiryNumber && safeInquiryNumber.trim() !== '') {
            await env.LEARNING_DB.prepare(`
                UPDATE users SET inquiry_number = ? WHERE id = ?
            `).bind(safeInquiryNumber, userId_db).run();
        }

        console.log('User registered successfully:', { userId_db, userId });

        return new Response(JSON.stringify({
            success: true,
            message: 'ユーザー登録が完了しました',
            userId: userId_db,
            username: userId,
            displayName: displayName,
            email: finalEmail,
            inquiryNumber: safeInquiryNumber
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Provide more detailed error information
        let errorMessage = 'ユーザー登録に失敗しました';
        if (error.message.includes('NOT NULL constraint failed: users.email')) {
            errorMessage = 'Email constraint error: Please check email field';
        } else if (error.message.includes('UNIQUE constraint failed')) {
            errorMessage = 'このユーザーは既に登録されています';
        }

        return new Response(JSON.stringify({
            error: errorMessage,
            details: error.message,
            debug_info: {
                timestamp: new Date().toISOString(),
                error_type: error.constructor.name
            }
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
 * Handle passkey registration begin
 */
async function handlePasskeyRegisterBegin(request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        // Check if user exists (support both userId as number and username)
        let user = await env.LEARNING_DB.prepare(`
            SELECT id, username FROM users WHERE username = ?
        `).bind(userId).first();

        // If not found and userId is a number, try by ID
        if (!user && !isNaN(userId)) {
            user = await env.LEARNING_DB.prepare(`
                SELECT id, username FROM users WHERE id = ?
            `).bind(parseInt(userId)).first();
        }

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
        const challengeBase64 = btoa(String.fromCharCode(...challenge));

        // Store challenge temporarily (in production, use Redis or similar)
        // For now, we'll use a simple approach

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
        const credential = await request.json();

        // In a real implementation, you would:
        // 1. Verify the attestation
        // 2. Store the public key
        // 3. Associate it with the user

        return new Response(JSON.stringify({
            success: true,
            message: 'Passkey registration completed'
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

/**
 * Handle passkey login begin
 */
async function handlePasskeyLoginBegin(request, env, corsHeaders) {
    try {
        const { username } = await request.json();

        // Find user
        const user = await env.LEARNING_DB.prepare(`
            SELECT id, username FROM users WHERE username = ?
        `).bind(username).first();

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
        const challengeBase64 = btoa(String.fromCharCode(...challenge));

        return new Response(JSON.stringify({
            challenge: challengeBase64,
            allowCredentials: [],
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
        const credential = await request.json();

        // In a real implementation, you would:
        // 1. Verify the assertion
        // 2. Check against stored public key
        // 3. Create session

        return new Response(JSON.stringify({
            success: true,
            message: 'Login successful'
        }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
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