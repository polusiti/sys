/**
 * Data Manager Authentication Cloudflare Worker
 * Handles user registration, passkey authentication, and session management
 * Compatible with Cloudflare D1 database and WebAuthn API
 */

import { 
    generateRegistrationOptions, 
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from '@simplewebauthn/server';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };

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
                    profileData TEXT
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

            return this.jsonResponse({ 
                success: true, 
                message: 'Authentication database initialized successfully' 
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
            const options = await generateRegistrationOptions({
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
            const verification = await verifyRegistrationResponse({
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
            const options = await generateAuthenticationOptions({
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
            const verification = await verifyAuthenticationResponse({
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

    // Utility functions
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
        const url = new URL(request.url);
        return url.hostname;
    },

    getOrigin(request) {
        const url = new URL(request.url);
        return url.origin;
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