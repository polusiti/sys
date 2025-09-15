/**
 * Data Manager Authentication Cloudflare Worker
 * Handles user registration, passkey authentication, and session management
 * Compatible with Cloudflare D1 database and simplified WebAuthn API
 */

// Simplified WebAuthn implementation for Cloudflare Workers
class SimpleWebAuthn {
    static generateRegistrationOptions(options) {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        // Convert challenge to base64 string for frontend compatibility
        const challengeBase64 = btoa(String.fromCharCode(...challenge));
        
        return {
            challenge: challengeBase64,
            rp: { name: options.rpName, id: options.rpID },
            user: {
                id: btoa(options.userID), // Convert to base64 string
                name: options.userName,
                displayName: options.userDisplayName
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: options.authenticatorSelection || {
                userVerification: 'preferred',
                residentKey: 'preferred'
            },
            timeout: 300000,
            attestation: options.attestationType || 'none'
        };
    }

    static generateAuthenticationOptions(options) {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        // Convert challenge to base64 string for frontend compatibility
        const challengeBase64 = btoa(String.fromCharCode(...challenge));
        
        return {
            challenge: challengeBase64,
            rpId: options.rpID,
            allowCredentials: options.allowCredentials || [],
            userVerification: options.userVerification || 'preferred',
            timeout: 300000
        };
    }

    static async verifyRegistrationResponse(options) {
        // Simplified verification for demo purposes
        // In production, implement proper CBOR decoding and signature verification
        return {
            verified: true,
            registrationInfo: {
                credentialPublicKey: 'mock_public_key',
                credentialID: options.response.id,
                counter: 0
            }
        };
    }

    static async verifyAuthenticationResponse(options) {
        // Simplified verification for demo purposes
        return {
            verified: true,
            authenticationInfo: {
                newCounter: 1
            }
        };
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Dynamic CORS headers based on origin
        const origin = request.headers.get('Origin');
        const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [
            'https://data.allfrom0.top',
            'https://polusiti.github.io',
            'http://localhost:3000',
            'http://127.0.0.1:5500'
        ];
        
        const corsHeaders = {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };
        
        // Set CORS origin
        if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            corsHeaders['Access-Control-Allow-Origin'] = origin;
        } else {
            corsHeaders['Access-Control-Allow-Origin'] = '*'; // Fallback for testing
        }

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Initialize database
            if (path === '/api/auth/init') {
                return await this.initializeDatabase(env, corsHeaders);
            }

            // User registration
            if (path === '/api/auth/register') {
                return await this.registerUser(request, env, corsHeaders);
            }

            // Passkey registration
            if (path === '/api/auth/passkey/register/begin') {
                return await this.beginPasskeyRegistration(request, env, corsHeaders);
            }
            
            if (path === '/api/auth/passkey/register/complete') {
                return await this.completePasskeyRegistration(request, env, corsHeaders);
            }

            // Passkey authentication
            if (path === '/api/auth/passkey/login/begin') {
                return await this.beginPasskeyLogin(request, env, corsHeaders);
            }
            
            if (path === '/api/auth/passkey/login/complete') {
                return await this.completePasskeyLogin(request, env, corsHeaders);
            }

            // Session management
            if (path === '/api/auth/me') {
                return await this.getCurrentUser(request, env, corsHeaders);
            }
            
            if (path === '/api/auth/logout') {
                return await this.logout(request, env, corsHeaders);
            }

            // User management
            if (path.startsWith('/api/auth/user/inquiry/')) {
                const inquiryNumber = path.split('/').pop();
                return await this.getUserByInquiryNumber(inquiryNumber, env, corsHeaders);
            }
            
            if (path === '/api/auth/profile') {
                return await this.updateUserProfile(request, env, corsHeaders);
            }

            // Media management endpoints
            if (path === '/api/media/upload') {
                return await this.uploadMedia(request, env, corsHeaders);
            }
            
            if (path === '/api/media/list') {
                return await this.listUserMedia(request, env, corsHeaders);
            }
            
            if (path.startsWith('/api/media/') && request.method === 'GET') {
                const mediaId = path.split('/').pop();
                return await this.getMediaFile(mediaId, request, env, corsHeaders);
            }
            
            if (path.startsWith('/api/media/') && request.method === 'DELETE') {
                const mediaId = path.split('/').pop();
                return await this.deleteMediaFile(mediaId, request, env, corsHeaders);
            }
            
            if (path.startsWith('/api/media/') && request.method === 'PUT') {
                const mediaId = path.split('/').pop();
                return await this.updateMediaFile(mediaId, request, env, corsHeaders);
            }

            // Admin endpoints
            if (path === '/api/admin/stats') {
                return await this.getAdminStats(request, env, corsHeaders);
            }
            
            if (path === '/api/admin/users') {
                return await this.getAdminUsers(request, env, corsHeaders);
            }
            
            if (path === '/api/admin/promote') {
                return await this.promoteUserToAdmin(request, env, corsHeaders);
            }

            // Public media access (no authentication required)
            if (path.startsWith('/api/public/media/')) {
                const mediaId = path.split('/').pop();
                return await this.getPublicMediaFile(mediaId, env, corsHeaders);
            }

            return this.jsonResponse({ error: 'Not found' }, 404, corsHeaders);
            
        } catch (error) {
            console.error('Authentication error:', error);
            return this.jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
        }
    },

    // Initialize authentication database tables
    async initializeDatabase(env, corsHeaders) {
        try {
            // Create users table
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    userId TEXT UNIQUE NOT NULL,
                    displayName TEXT NOT NULL,
                    email TEXT,
                    inquiryNumber TEXT UNIQUE NOT NULL,
                    registeredAt TEXT NOT NULL,
                    lastLoginAt TEXT,
                    status TEXT DEFAULT 'active',
                    role TEXT DEFAULT 'user',
                    profileData TEXT,
                    storageQuota INTEGER DEFAULT 104857600,
                    storageUsed INTEGER DEFAULT 0
                )
            `).run();

            // Create passkeys table
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS passkeys (
                    id TEXT PRIMARY KEY,
                    userId TEXT NOT NULL,
                    credentialId TEXT UNIQUE NOT NULL,
                    publicKey TEXT NOT NULL,
                    counter INTEGER DEFAULT 0,
                    createdAt TEXT NOT NULL,
                    lastUsedAt TEXT,
                    FOREIGN KEY (userId) REFERENCES users (id)
                )
            `).run();

            // Create sessions table
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    userId TEXT NOT NULL,
                    sessionToken TEXT UNIQUE NOT NULL,
                    createdAt TEXT NOT NULL,
                    expiresAt TEXT NOT NULL,
                    ipAddress TEXT,
                    userAgent TEXT,
                    FOREIGN KEY (userId) REFERENCES users (id)
                )
            `).run();

            // Create challenges table for WebAuthn
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS challenges (
                    id TEXT PRIMARY KEY,
                    challenge TEXT UNIQUE NOT NULL,
                    userId TEXT,
                    type TEXT NOT NULL,
                    createdAt TEXT NOT NULL,
                    expiresAt TEXT NOT NULL
                )
            `).run();

            // Create media files table for R2 storage metadata
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS media_files (
                    id TEXT PRIMARY KEY,
                    userId TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    originalName TEXT NOT NULL,
                    fileType TEXT NOT NULL,
                    fileSize INTEGER NOT NULL,
                    r2Path TEXT NOT NULL,
                    r2Key TEXT NOT NULL,
                    publicUrl TEXT,
                    subject TEXT,
                    category TEXT DEFAULT 'general',
                    description TEXT,
                    metadata TEXT,
                    uploadDate TEXT NOT NULL,
                    lastAccessed TEXT,
                    isPublic BOOLEAN DEFAULT FALSE,
                    downloadCount INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    FOREIGN KEY (userId) REFERENCES users (id)
                )
            `).run();

            // Create media access log table for analytics
            await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS media_access_log (
                    id TEXT PRIMARY KEY,
                    mediaId TEXT NOT NULL,
                    userId TEXT,
                    accessType TEXT NOT NULL,
                    ipAddress TEXT,
                    userAgent TEXT,
                    accessDate TEXT NOT NULL,
                    FOREIGN KEY (mediaId) REFERENCES media_files (id),
                    FOREIGN KEY (userId) REFERENCES users (id)
                )
            `).run();

            // Create indexes for better performance
            await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_media_files_user ON media_files(userId)
            `).run();
            
            await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_media_files_subject ON media_files(subject, category)
            `).run();
            
            await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(fileType)
            `).run();

            return this.jsonResponse({ 
                success: true, 
                message: 'Authentication and media database initialized successfully',
                tables: ['users', 'passkeys', 'sessions', 'challenges', 'media_files', 'media_access_log']
            }, 200, corsHeaders);
            
        } catch (error) {
            console.error('Database initialization error:', error);
            return this.jsonResponse({ 
                error: 'Database initialization failed',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Register new user
    async registerUser(request, env, corsHeaders) {
        try {
            const userData = await request.json();
            const { userId, displayName, email, inquiryNumber } = userData;

            // Validate required fields
            if (!userId || !displayName || !inquiryNumber) {
                return this.jsonResponse({ 
                    error: 'Missing required fields: userId, displayName, inquiryNumber' 
                }, 400, corsHeaders);
            }

            // Check if user already exists
            const existingUser = await env.DB.prepare(
                'SELECT id FROM users WHERE userId = ? OR inquiryNumber = ?'
            ).bind(userId, inquiryNumber).first();

            if (existingUser) {
                return this.jsonResponse({ 
                    error: 'User ID or inquiry number already exists' 
                }, 409, corsHeaders);
            }

            // Create new user
            const userIdGenerated = this.generateId();
            const now = new Date().toISOString();
            
            await env.DB.prepare(`
                INSERT INTO users (id, userId, displayName, email, inquiryNumber, registeredAt, status, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                userIdGenerated,
                userId,
                displayName,
                email || null,
                inquiryNumber,
                now,
                'active',
                'user'
            ).run();

            const newUser = {
                id: userIdGenerated,
                userId,
                displayName,
                email,
                inquiryNumber,
                registeredAt: now,
                status: 'active',
                role: 'user'
            };

            return this.jsonResponse({ 
                success: true, 
                user: newUser 
            }, 201, corsHeaders);
            
        } catch (error) {
            console.error('User registration error:', error);
            return this.jsonResponse({ 
                error: 'User registration failed',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Begin passkey registration
    async beginPasskeyRegistration(request, env, corsHeaders) {
        try {
            const { userId } = await request.json();
            
            // Get user
            const user = await env.DB.prepare(
                'SELECT * FROM users WHERE id = ?'
            ).bind(userId).first();

            if (!user) {
                return this.jsonResponse({ error: 'User not found' }, 404, corsHeaders);
            }

            // Generate registration options
            const options = SimpleWebAuthn.generateRegistrationOptions({
                rpName: 'Data Manager',
                rpID: this.getRpId(request),
                userID: userId,
                userName: user.userId,
                userDisplayName: user.displayName,
                attestationType: 'none',
                authenticatorSelection: {
                    userVerification: 'preferred',
                    residentKey: 'preferred'
                }
            });

            // Store challenge
            const challengeId = this.generateId();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
            
            await env.DB.prepare(`
                INSERT INTO challenges (id, challenge, userId, type, createdAt, expiresAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                challengeId,
                options.challenge,
                userId,
                'registration',
                new Date().toISOString(),
                expiresAt
            ).run();

            return this.jsonResponse(options, 200, corsHeaders);
            
        } catch (error) {
            console.error('Passkey registration begin error:', error);
            return this.jsonResponse({ 
                error: 'Failed to begin passkey registration',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Complete passkey registration
    async completePasskeyRegistration(request, env, corsHeaders) {
        try {
            const { userId, credential } = await request.json();
            
            // Get stored challenge
            const challenge = await env.DB.prepare(
                'SELECT challenge FROM challenges WHERE userId = ? AND type = ? AND expiresAt > ?'
            ).bind(userId, 'registration', new Date().toISOString()).first();

            if (!challenge) {
                return this.jsonResponse({ 
                    error: 'Invalid or expired challenge' 
                }, 400, corsHeaders);
            }

            // Verify registration response
            const verification = await SimpleWebAuthn.verifyRegistrationResponse({
                response: credential,
                expectedChallenge: challenge.challenge,
                expectedOrigin: this.getOrigin(request),
                expectedRPID: this.getRpId(request)
            });

            if (!verification.verified) {
                return this.jsonResponse({ 
                    error: 'Passkey registration verification failed' 
                }, 400, corsHeaders);
            }

            // Store passkey
            const passkeyId = this.generateId();
            const now = new Date().toISOString();
            
            await env.DB.prepare(`
                INSERT INTO passkeys (id, userId, credentialId, publicKey, counter, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                passkeyId,
                userId,
                credential.id,
                JSON.stringify(verification.registrationInfo),
                verification.registrationInfo.counter,
                now
            ).run();

            // Clean up challenge
            await env.DB.prepare(
                'DELETE FROM challenges WHERE userId = ? AND type = ?'
            ).bind(userId, 'registration').run();

            return this.jsonResponse({ 
                success: true, 
                verified: true 
            }, 200, corsHeaders);
            
        } catch (error) {
            console.error('Passkey registration complete error:', error);
            return this.jsonResponse({ 
                error: 'Failed to complete passkey registration',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Begin passkey login
    async beginPasskeyLogin(request, env, corsHeaders) {
        try {
            const { userId } = await request.json();
            
            // Get user
            const user = await env.DB.prepare(
                'SELECT * FROM users WHERE userId = ?'
            ).bind(userId).first();

            if (!user) {
                return this.jsonResponse({ error: 'User not found' }, 404, corsHeaders);
            }

            // Get user's passkeys
            const passkeys = await env.DB.prepare(
                'SELECT credentialId FROM passkeys WHERE userId = ?'
            ).bind(user.id).all();

            // Generate authentication options
            const options = SimpleWebAuthn.generateAuthenticationOptions({
                rpID: this.getRpId(request),
                allowCredentials: passkeys.results.map(pk => ({
                    id: pk.credentialId,
                    type: 'public-key'
                })),
                userVerification: 'preferred'
            });

            // Store challenge
            const challengeId = this.generateId();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
            
            await env.DB.prepare(`
                INSERT INTO challenges (id, challenge, userId, type, createdAt, expiresAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                challengeId,
                options.challenge,
                user.id,
                'authentication',
                new Date().toISOString(),
                expiresAt
            ).run();

            return this.jsonResponse(options, 200, corsHeaders);
            
        } catch (error) {
            console.error('Passkey login begin error:', error);
            return this.jsonResponse({ 
                error: 'Failed to begin passkey login',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Complete passkey login
    async completePasskeyLogin(request, env, corsHeaders) {
        try {
            const { userId, assertion } = await request.json();
            
            // Get user
            const user = await env.DB.prepare(
                'SELECT * FROM users WHERE userId = ?'
            ).bind(userId).first();

            if (!user) {
                return this.jsonResponse({ error: 'User not found' }, 404, corsHeaders);
            }

            // Get stored challenge
            const challenge = await env.DB.prepare(
                'SELECT challenge FROM challenges WHERE userId = ? AND type = ? AND expiresAt > ?'
            ).bind(user.id, 'authentication', new Date().toISOString()).first();

            if (!challenge) {
                return this.jsonResponse({ 
                    error: 'Invalid or expired challenge' 
                }, 400, corsHeaders);
            }

            // Get passkey
            const passkey = await env.DB.prepare(
                'SELECT * FROM passkeys WHERE credentialId = ? AND userId = ?'
            ).bind(assertion.id, user.id).first();

            if (!passkey) {
                return this.jsonResponse({ 
                    error: 'Passkey not found' 
                }, 404, corsHeaders);
            }

            // Verify authentication response
            const verification = await SimpleWebAuthn.verifyAuthenticationResponse({
                response: assertion,
                expectedChallenge: challenge.challenge,
                expectedOrigin: this.getOrigin(request),
                expectedRPID: this.getRpId(request),
                authenticator: JSON.parse(passkey.publicKey),
                expectedType: 'webauthn.get'
            });

            if (!verification.verified) {
                return this.jsonResponse({ 
                    error: 'Passkey authentication verification failed' 
                }, 400, corsHeaders);
            }

            // Update passkey counter and last used
            const now = new Date().toISOString();
            await env.DB.prepare(
                'UPDATE passkeys SET counter = ?, lastUsedAt = ? WHERE id = ?'
            ).bind(verification.authenticationInfo.newCounter, now, passkey.id).run();

            // Update user last login
            await env.DB.prepare(
                'UPDATE users SET lastLoginAt = ? WHERE id = ?'
            ).bind(now, user.id).run();

            // Create session
            const sessionToken = this.generateSessionToken();
            const sessionId = this.generateId();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
            
            await env.DB.prepare(`
                INSERT INTO sessions (id, userId, sessionToken, createdAt, expiresAt, ipAddress, userAgent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                sessionId,
                user.id,
                sessionToken,
                now,
                expiresAt,
                request.headers.get('cf-connecting-ip') || 'unknown',
                request.headers.get('user-agent') || 'unknown'
            ).run();

            // Clean up challenge
            await env.DB.prepare(
                'DELETE FROM challenges WHERE userId = ? AND type = ?'
            ).bind(user.id, 'authentication').run();

            return this.jsonResponse({ 
                success: true,
                sessionToken,
                user: {
                    id: user.id,
                    userId: user.userId,
                    displayName: user.displayName,
                    email: user.email,
                    inquiryNumber: user.inquiryNumber,
                    role: user.role
                }
            }, 200, corsHeaders);
            
        } catch (error) {
            console.error('Passkey login complete error:', error);
            return this.jsonResponse({ 
                error: 'Failed to complete passkey login',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Get current user from session
    async getCurrentUser(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'No session token' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(`
                SELECT s.*, u.* FROM sessions s 
                JOIN users u ON s.userId = u.id 
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            return this.jsonResponse({
                id: session.id,
                userId: session.userId,
                displayName: session.displayName,
                email: session.email,
                inquiryNumber: session.inquiryNumber,
                role: session.role
            }, 200, corsHeaders);
            
        } catch (error) {
            console.error('Get current user error:', error);
            return this.jsonResponse({ 
                error: 'Failed to get current user',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Logout user
    async logout(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (sessionToken) {
                await env.DB.prepare(
                    'DELETE FROM sessions WHERE sessionToken = ?'
                ).bind(sessionToken).run();
            }

            return this.jsonResponse({ success: true }, 200, corsHeaders);
            
        } catch (error) {
            console.error('Logout error:', error);
            return this.jsonResponse({ 
                error: 'Logout failed',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Get user by inquiry number
    async getUserByInquiryNumber(inquiryNumber, env, corsHeaders) {
        try {
            // This endpoint requires admin authentication
            const user = await env.DB.prepare(
                'SELECT id, userId, displayName, email, inquiryNumber, registeredAt, lastLoginAt, status, role FROM users WHERE inquiryNumber = ?'
            ).bind(inquiryNumber).first();

            if (!user) {
                return this.jsonResponse({ error: 'User not found' }, 404, corsHeaders);
            }

            return this.jsonResponse(user, 200, corsHeaders);
            
        } catch (error) {
            console.error('Get user by inquiry number error:', error);
            return this.jsonResponse({ 
                error: 'Failed to get user',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Update user profile
    async updateUserProfile(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(
                'SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?'
            ).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            const updates = await request.json();
            const allowedFields = ['displayName', 'email'];
            const updateFields = [];
            const updateValues = [];

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            }

            if (updateFields.length === 0) {
                return this.jsonResponse({ error: 'No valid fields to update' }, 400, corsHeaders);
            }

            updateValues.push(session.userId);
            
            await env.DB.prepare(
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
            ).bind(...updateValues).run();

            // Get updated user
            const updatedUser = await env.DB.prepare(
                'SELECT id, userId, displayName, email, inquiryNumber, role FROM users WHERE id = ?'
            ).bind(session.userId).first();

            return this.jsonResponse(updatedUser, 200, corsHeaders);
            
        } catch (error) {
            console.error('Update user profile error:', error);
            return this.jsonResponse({ 
                error: 'Failed to update profile',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Media Management Methods

    // Upload media file to R2 with authentication
    async uploadMedia(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            // Verify session
            const session = await env.DB.prepare(
                'SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?'
            ).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            // Get user info
            const user = await env.DB.prepare(
                'SELECT id, displayName, storageQuota, storageUsed FROM users WHERE id = ?'
            ).bind(session.userId).first();

            if (!user) {
                return this.jsonResponse({ error: 'User not found' }, 404, corsHeaders);
            }

            // Parse multipart form data
            const formData = await request.formData();
            const file = formData.get('file');
            const subject = formData.get('subject') || 'general';
            const category = formData.get('category') || 'general';
            const description = formData.get('description') || '';
            const isPublic = formData.get('isPublic') === 'true';

            if (!file) {
                return this.jsonResponse({ error: 'No file provided' }, 400, corsHeaders);
            }

            // Validate file type and size
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                                'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
            
            if (!allowedTypes.includes(file.type)) {
                return this.jsonResponse({ 
                    error: 'Unsupported file type',
                    allowedTypes: allowedTypes 
                }, 400, corsHeaders);
            }

            const maxFileSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxFileSize) {
                return this.jsonResponse({ 
                    error: 'File too large',
                    maxSize: maxFileSize,
                    fileSize: file.size 
                }, 400, corsHeaders);
            }

            // Check user storage quota
            if (user.storageUsed + file.size > user.storageQuota) {
                return this.jsonResponse({ 
                    error: 'Storage quota exceeded',
                    quota: user.storageQuota,
                    used: user.storageUsed,
                    needed: file.size 
                }, 413, corsHeaders);
            }

            // Generate unique filename and R2 path
            const fileExtension = file.name.split('.').pop();
            const mediaId = this.generateId();
            const filename = `${mediaId}.${fileExtension}`;
            const r2Key = `users/${user.id}/${subject}/${category}/${filename}`;

            // Upload to R2
            await env.MEDIA_BUCKET.put(r2Key, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                    contentDisposition: `attachment; filename="${file.name}"`
                },
                customMetadata: {
                    userId: user.id,
                    originalName: file.name,
                    uploadedBy: user.displayName,
                    subject: subject,
                    category: category
                }
            });

            // Generate public URL if public file
            let publicUrl = null;
            if (isPublic) {
                publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;
            }

            // Save metadata to D1
            const now = new Date().toISOString();
            await env.DB.prepare(`
                INSERT INTO media_files (
                    id, userId, filename, originalName, fileType, fileSize,
                    r2Path, r2Key, publicUrl, subject, category, description,
                    uploadDate, isPublic, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                mediaId, user.id, filename, file.name, file.type, file.size,
                r2Key, r2Key, publicUrl, subject, category, description,
                now, isPublic, 'active'
            ).run();

            // Update user storage usage
            await env.DB.prepare(
                'UPDATE users SET storageUsed = storageUsed + ? WHERE id = ?'
            ).bind(file.size, user.id).run();

            // Log the upload
            await this.logMediaAccess(env, mediaId, user.id, 'upload', request);

            return this.jsonResponse({
                success: true,
                mediaId: mediaId,
                filename: filename,
                originalName: file.name,
                fileType: file.type,
                fileSize: file.size,
                publicUrl: publicUrl,
                subject: subject,
                category: category,
                uploadDate: now
            }, 201, corsHeaders);

        } catch (error) {
            console.error('Media upload error:', error);
            return this.jsonResponse({ 
                error: 'Media upload failed',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // List user's media files
    async listUserMedia(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(
                'SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?'
            ).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            const url = new URL(request.url);
            const subject = url.searchParams.get('subject');
            const category = url.searchParams.get('category');
            const fileType = url.searchParams.get('fileType');
            const limit = parseInt(url.searchParams.get('limit')) || 50;
            const offset = parseInt(url.searchParams.get('offset')) || 0;

            let query = 'SELECT * FROM media_files WHERE userId = ? AND status = ?';
            let params = [session.userId, 'active'];

            if (subject) {
                query += ' AND subject = ?';
                params.push(subject);
            }

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            if (fileType) {
                query += ' AND fileType LIKE ?';
                params.push(`${fileType}%`);
            }

            query += ' ORDER BY uploadDate DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const files = await env.DB.prepare(query).bind(...params).all();

            return this.jsonResponse({
                success: true,
                files: files.results,
                count: files.results.length,
                limit: limit,
                offset: offset
            }, 200, corsHeaders);

        } catch (error) {
            console.error('List media error:', error);
            return this.jsonResponse({ 
                error: 'Failed to list media files',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Get specific media file
    async getMediaFile(mediaId, request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(
                'SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?'
            ).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            // Get media file metadata
            const media = await env.DB.prepare(
                'SELECT * FROM media_files WHERE id = ? AND status = ?'
            ).bind(mediaId, 'active').first();

            if (!media) {
                return this.jsonResponse({ error: 'Media file not found' }, 404, corsHeaders);
            }

            // Check permission (user owns file or file is public)
            if (media.userId !== session.userId && !media.isPublic) {
                return this.jsonResponse({ error: 'Access denied' }, 403, corsHeaders);
            }

            // Generate signed URL for R2 access
            const signedUrl = await this.generateSignedUrl(env, media.r2Key, 3600); // 1 hour

            // Update access log and download count
            await this.logMediaAccess(env, mediaId, session.userId, 'download', request);
            await env.DB.prepare(
                'UPDATE media_files SET downloadCount = downloadCount + 1, lastAccessed = ? WHERE id = ?'
            ).bind(new Date().toISOString(), mediaId).run();

            return this.jsonResponse({
                success: true,
                media: media,
                downloadUrl: signedUrl
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Get media file error:', error);
            return this.jsonResponse({ 
                error: 'Failed to get media file',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Delete media file
    async deleteMediaFile(mediaId, request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(
                'SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?'
            ).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            // Get media file
            const media = await env.DB.prepare(
                'SELECT * FROM media_files WHERE id = ? AND userId = ? AND status = ?'
            ).bind(mediaId, session.userId, 'active').first();

            if (!media) {
                return this.jsonResponse({ error: 'Media file not found or access denied' }, 404, corsHeaders);
            }

            // Delete from R2
            await env.MEDIA_BUCKET.delete(media.r2Key);

            // Mark as deleted in D1 (soft delete)
            await env.DB.prepare(
                'UPDATE media_files SET status = ?, deletedDate = ? WHERE id = ?'
            ).bind('deleted', new Date().toISOString(), mediaId).run();

            // Update user storage usage
            await env.DB.prepare(
                'UPDATE users SET storageUsed = storageUsed - ? WHERE id = ?'
            ).bind(media.fileSize, session.userId).run();

            // Log the deletion
            await this.logMediaAccess(env, mediaId, session.userId, 'delete', request);

            return this.jsonResponse({
                success: true,
                message: 'Media file deleted successfully'
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Delete media file error:', error);
            return this.jsonResponse({ 
                error: 'Failed to delete media file',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Update media file metadata
    async updateMediaFile(mediaId, request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(
                'SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?'
            ).bind(sessionToken, new Date().toISOString()).first();

            if (!session) {
                return this.jsonResponse({ error: 'Invalid or expired session' }, 401, corsHeaders);
            }

            const updates = await request.json();
            const allowedFields = ['description', 'isPublic', 'category'];
            const updateFields = [];
            const updateValues = [];

            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            }

            if (updateFields.length === 0) {
                return this.jsonResponse({ error: 'No valid fields to update' }, 400, corsHeaders);
            }

            updateValues.push(mediaId, session.userId);

            await env.DB.prepare(
                `UPDATE media_files SET ${updateFields.join(', ')} WHERE id = ? AND userId = ?`
            ).bind(...updateValues).run();

            // Get updated media file
            const updatedMedia = await env.DB.prepare(
                'SELECT * FROM media_files WHERE id = ? AND userId = ?'
            ).bind(mediaId, session.userId).first();

            return this.jsonResponse({
                success: true,
                media: updatedMedia
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Update media file error:', error);
            return this.jsonResponse({ 
                error: 'Failed to update media file',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Get public media file (no authentication required)
    async getPublicMediaFile(mediaId, env, corsHeaders) {
        try {
            const media = await env.DB.prepare(
                'SELECT * FROM media_files WHERE id = ? AND isPublic = 1 AND status = ?'
            ).bind(mediaId, 'active').first();

            if (!media) {
                return this.jsonResponse({ error: 'Public media file not found' }, 404, corsHeaders);
            }

            // Update access log and download count
            await this.logMediaAccess(env, mediaId, null, 'public_download', null);
            await env.DB.prepare(
                'UPDATE media_files SET downloadCount = downloadCount + 1, lastAccessed = ? WHERE id = ?'
            ).bind(new Date().toISOString(), mediaId).run();

            return this.jsonResponse({
                success: true,
                media: {
                    id: media.id,
                    filename: media.filename,
                    originalName: media.originalName,
                    fileType: media.fileType,
                    fileSize: media.fileSize,
                    publicUrl: media.publicUrl,
                    subject: media.subject,
                    category: media.category,
                    description: media.description,
                    uploadDate: media.uploadDate,
                    downloadCount: media.downloadCount
                }
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Get public media file error:', error);
            return this.jsonResponse({ 
                error: 'Failed to get public media file',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Generate signed URL for R2 access
    async generateSignedUrl(env, r2Key, expirationSeconds = 3600) {
        try {
            // Note: This is a simplified implementation
            // In production, you should use R2's signed URL feature
            return `${env.R2_PUBLIC_URL}/${r2Key}`;
        } catch (error) {
            console.error('Generate signed URL error:', error);
            throw error;
        }
    },

    // Log media access for analytics
    async logMediaAccess(env, mediaId, userId, accessType, request) {
        try {
            const logId = this.generateId();
            const ipAddress = request ? request.headers.get('cf-connecting-ip') || 'unknown' : 'unknown';
            const userAgent = request ? request.headers.get('user-agent') || 'unknown' : 'unknown';

            await env.DB.prepare(`
                INSERT INTO media_access_log (id, mediaId, userId, accessType, ipAddress, userAgent, accessDate)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                logId, mediaId, userId, accessType, ipAddress, userAgent, new Date().toISOString()
            ).run();
        } catch (error) {
            console.error('Log media access error:', error);
            // Don't throw error for logging failures
        }
    },

    // Admin Management Methods

    // Get admin statistics
    async getAdminStats(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(`
                SELECT u.role FROM sessions s 
                JOIN users u ON s.userId = u.id 
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, new Date().toISOString()).first();

            if (!session || session.role !== 'admin') {
                return this.jsonResponse({ error: 'Admin access required' }, 403, corsHeaders);
            }

            // Get system statistics
            const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').bind('active').first();
            const mediaCount = await env.DB.prepare('SELECT COUNT(*) as count FROM media_files WHERE status = ?').bind('active').first();
            const totalStorage = await env.DB.prepare('SELECT SUM(storageUsed) as total FROM users').first();
            const recentUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE registeredAt > ?').bind(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).first();

            return this.jsonResponse({
                success: true,
                stats: {
                    totalUsers: userCount.count || 0,
                    totalMedia: mediaCount.count || 0,
                    totalStorage: totalStorage.total || 0,
                    recentUsers: recentUsers.count || 0,
                    systemUptime: Date.now(), // Placeholder
                    lastUpdated: new Date().toISOString()
                }
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Get admin stats error:', error);
            return this.jsonResponse({ 
                error: 'Failed to get admin stats',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Get all users for admin management
    async getAdminUsers(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(`
                SELECT u.role FROM sessions s 
                JOIN users u ON s.userId = u.id 
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, new Date().toISOString()).first();

            if (!session || session.role !== 'admin') {
                return this.jsonResponse({ error: 'Admin access required' }, 403, corsHeaders);
            }

            const url = new URL(request.url);
            const limit = parseInt(url.searchParams.get('limit')) || 50;
            const offset = parseInt(url.searchParams.get('offset')) || 0;
            const search = url.searchParams.get('search');

            let query = `SELECT id, userId, displayName, email, inquiryNumber, registeredAt, lastLoginAt, status, role, storageUsed, storageQuota FROM users`;
            let params = [];

            if (search) {
                query += ` WHERE userId LIKE ? OR displayName LIKE ? OR email LIKE ?`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY registeredAt DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const users = await env.DB.prepare(query).bind(...params).all();

            // Get total count
            let countQuery = `SELECT COUNT(*) as total FROM users`;
            let countParams = [];
            
            if (search) {
                countQuery += ` WHERE userId LIKE ? OR displayName LIKE ? OR email LIKE ?`;
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }
            
            const totalCount = await env.DB.prepare(countQuery).bind(...countParams).first();

            return this.jsonResponse({
                success: true,
                users: users.results,
                pagination: {
                    total: totalCount.total,
                    limit: limit,
                    offset: offset,
                    hasMore: (offset + limit) < totalCount.total
                }
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Get admin users error:', error);
            return this.jsonResponse({ 
                error: 'Failed to get users',
                details: error.message 
            }, 500, corsHeaders);
        }
    },

    // Promote user to admin
    async promoteUserToAdmin(request, env, corsHeaders) {
        try {
            const sessionToken = this.getSessionTokenFromRequest(request);
            if (!sessionToken) {
                return this.jsonResponse({ error: 'Authentication required' }, 401, corsHeaders);
            }

            const session = await env.DB.prepare(`
                SELECT u.role FROM sessions s 
                JOIN users u ON s.userId = u.id 
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, new Date().toISOString()).first();

            if (!session || session.role !== 'admin') {
                return this.jsonResponse({ error: 'Admin access required' }, 403, corsHeaders);
            }

            const { userId, role } = await request.json();
            
            if (!userId || !role) {
                return this.jsonResponse({ error: 'userId and role are required' }, 400, corsHeaders);
            }

            if (!['user', 'admin'].includes(role)) {
                return this.jsonResponse({ error: 'Invalid role. Must be user or admin' }, 400, corsHeaders);
            }

            // Update user role
            const result = await env.DB.prepare(
                'UPDATE users SET role = ? WHERE id = ?'
            ).bind(role, userId).run();

            if (result.changes === 0) {
                return this.jsonResponse({ error: 'User not found' }, 404, corsHeaders);
            }

            // Get updated user info
            const updatedUser = await env.DB.prepare(
                'SELECT id, userId, displayName, email, role FROM users WHERE id = ?'
            ).bind(userId).first();

            return this.jsonResponse({
                success: true,
                message: `User role updated to ${role}`,
                user: updatedUser
            }, 200, corsHeaders);

        } catch (error) {
            console.error('Promote user error:', error);
            return this.jsonResponse({ 
                error: 'Failed to update user role',
                details: error.message 
            }, 500, corsHeaders);
        }
    },
    generateId() {
        return crypto.randomUUID();
    },

    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    getSessionTokenFromRequest(request) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.replace('Bearer ', '');
        }
        return null;
    },

    getRpId(request) {
        // Use the Origin header to get the frontend domain, not the Worker domain
        const origin = request.headers.get('Origin');
        if (origin) {
            const originUrl = new URL(origin);
            return originUrl.hostname;
        }
        
        // Fallback to known domains
        const allowedDomains = [
            'data.allfrom0.top',
            'polusiti.github.io',
            'localhost'
        ];
        
        // Default to the primary domain
        return 'data.allfrom0.top';
    },

    getOrigin(request) {
        // Use the Origin header to get the frontend origin, not the Worker origin
        const origin = request.headers.get('Origin');
        if (origin) {
            return origin;
        }
        
        // Fallback to default origin
        return 'https://data.allfrom0.top';
    },

    jsonResponse(data, status = 200, headers = {}) {
        return new Response(JSON.stringify(data), {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });
    }
};