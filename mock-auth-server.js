/**
 * Mock Authentication Server for Development
 * Simulates Cloudflare Worker endpoints for local testing
 */

class MockAuthServer {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.challenges = new Map();
        this.mediaFiles = new Map();
        this.isRunning = false;
        
        // Initialize with some test data
        this.initializeTestData();
    }

    initializeTestData() {
        // Create a test user
        const testUser = {
            id: 'user_test_001',
            userId: 'testuser',
            displayName: 'テストユーザー',
            email: 'test@example.com',
            inquiryNumber: 'DM-2024-000001',
            registeredAt: new Date().toISOString(),
            status: 'active',
            role: 'user',
            storageQuota: 104857600, // 100MB
            storageUsed: 0
        };
        
        this.users.set('testuser', testUser);
        console.log('Mock server initialized with test user:', testUser);
    }

    async start() {
        if (this.isRunning) return;
        
        console.log('🚀 Starting Mock Authentication Server...');
        
        // Intercept fetch requests
        this.originalFetch = window.fetch;
        window.fetch = this.mockFetch.bind(this);
        
        this.isRunning = true;
        console.log('✅ Mock server is running on http://localhost:8787');
    }

    stop() {
        if (!this.isRunning) return;
        
        window.fetch = this.originalFetch;
        this.isRunning = false;
        console.log('🛑 Mock server stopped');
    }

    async mockFetch(url, options = {}) {
        // Only intercept localhost:8787 requests
        if (!url.includes('localhost:8787')) {
            return this.originalFetch(url, options);
        }

        console.log('🔄 Mock request:', options.method || 'GET', url);

        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const response = await this.handleRequest(path, options);
            
            return new Response(JSON.stringify(response.body), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        } catch (error) {
            console.error('Mock server error:', error);
            return new Response(JSON.stringify({ error: 'Mock server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    async handleRequest(path, options) {
        const method = options.method || 'GET';
        
        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return { status: 200, body: {} };
        }

        // Parse request body if present
        let body = null;
        if (options.body) {
            try {
                body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
            } catch (e) {
                body = options.body;
            }
        }

        // Route handling
        switch (true) {
            case path === '/api/auth/init':
                return this.handleInitDatabase();
                
            case path === '/api/auth/register':
                return this.handleRegisterUser(body);
                
            case path === '/api/auth/passkey/register/begin':
                return this.handleBeginPasskeyRegistration(body);
                
            case path === '/api/auth/passkey/register/complete':
                return this.handleCompletePasskeyRegistration(body);
                
            case path === '/api/auth/passkey/login/begin':
                return this.handleBeginPasskeyLogin(body);
                
            case path === '/api/auth/passkey/login/complete':
                return this.handleCompletePasskeyLogin(body);
                
            case path === '/api/auth/me':
                return this.handleGetCurrentUser(options);
                
            case path === '/api/auth/logout':
                return this.handleLogout(options);
                
            default:
                return { status: 404, body: { error: 'Not found' } };
        }
    }

    handleInitDatabase() {
        return {
            status: 200,
            body: {
                success: true,
                message: 'Mock database initialized successfully',
                tables: ['users', 'passkeys', 'sessions', 'challenges', 'media_files', 'media_access_log']
            }
        };
    }

    handleRegisterUser(userData) {
        const { userId, displayName, email } = userData;
        
        if (!userId || !displayName) {
            return {
                status: 400,
                body: { error: 'Missing required fields: userId, displayName' }
            };
        }

        if (this.users.has(userId)) {
            return {
                status: 409,
                body: { error: 'User ID already exists' }
            };
        }

        const inquiryNumber = this.generateInquiryNumber();
        const newUser = {
            id: 'user_' + Date.now(),
            userId,
            displayName,
            email: email || null,
            inquiryNumber,
            registeredAt: new Date().toISOString(),
            status: 'active',
            role: 'user',
            storageQuota: 104857600,
            storageUsed: 0
        };

        this.users.set(userId, newUser);
        
        return {
            status: 201,
            body: {
                success: true,
                user: newUser
            }
        };
    }

    handleBeginPasskeyRegistration(body) {
        const { userId } = body;
        const user = this.users.get(userId);
        
        if (!user) {
            return { status: 404, body: { error: 'User not found' } };
        }

        // Mock WebAuthn registration options
        const challenge = this.generateChallenge();
        const options = {
            challenge: challenge,
            rp: {
                name: 'Data Manager',
                id: 'localhost'
            },
            user: {
                id: new TextEncoder().encode(userId),
                name: userId,
                displayName: user.displayName
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
                userVerification: 'preferred',
                residentKey: 'preferred'
            },
            timeout: 300000,
            attestation: 'none'
        };

        this.challenges.set(challenge, {
            userId: user.id,
            type: 'registration',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });

        return { status: 200, body: options };
    }

    handleCompletePasskeyRegistration(body) {
        // For mock purposes, always succeed
        return {
            status: 200,
            body: {
                success: true,
                verified: true
            }
        };
    }

    handleBeginPasskeyLogin(body) {
        const { userId } = body;
        const user = this.users.get(userId);
        
        if (!user) {
            return { status: 404, body: { error: 'User not found' } };
        }

        const challenge = this.generateChallenge();
        const options = {
            challenge: challenge,
            rpId: 'localhost',
            allowCredentials: [{
                id: new TextEncoder().encode('mock_credential_id'),
                type: 'public-key'
            }],
            userVerification: 'preferred',
            timeout: 300000
        };

        this.challenges.set(challenge, {
            userId: user.id,
            type: 'authentication',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });

        return { status: 200, body: options };
    }

    handleCompletePasskeyLogin(body) {
        const { userId } = body;
        const user = this.users.get(userId);
        
        if (!user) {
            return { status: 404, body: { error: 'User not found' } };
        }

        // Create session
        const sessionToken = this.generateSessionToken();
        const session = {
            id: 'session_' + Date.now(),
            userId: user.id,
            sessionToken,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        this.sessions.set(sessionToken, session);

        return {
            status: 200,
            body: {
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
            }
        };
    }

    handleGetCurrentUser(options) {
        const sessionToken = this.getSessionTokenFromHeaders(options.headers);
        if (!sessionToken) {
            return { status: 401, body: { error: 'No session token' } };
        }

        const session = this.sessions.get(sessionToken);
        if (!session) {
            return { status: 401, body: { error: 'Invalid or expired session' } };
        }

        // Find user by session
        const user = Array.from(this.users.values()).find(u => u.id === session.userId);
        if (!user) {
            return { status: 404, body: { error: 'User not found' } };
        }

        return {
            status: 200,
            body: {
                id: user.id,
                userId: user.userId,
                displayName: user.displayName,
                email: user.email,
                inquiryNumber: user.inquiryNumber,
                role: user.role,
                storageQuota: user.storageQuota,
                storageUsed: user.storageUsed
            }
        };
    }

    handleLogout(options) {
        const sessionToken = this.getSessionTokenFromHeaders(options.headers);
        if (sessionToken) {
            this.sessions.delete(sessionToken);
        }
        return { status: 200, body: { success: true } };
    }

    getSessionTokenFromHeaders(headers) {
        if (!headers) return null;
        const authHeader = headers['Authorization'] || headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.replace('Bearer ', '');
        }
        return null;
    }

    generateInquiryNumber() {
        const year = new Date().getFullYear();
        const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        return `DM-${year}-${sequence}`;
    }

    generateChallenge() {
        return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    }

    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Global mock server instance
window.mockAuthServer = new MockAuthServer();

// Auto-start in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.mockAuthServer.start();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockAuthServer;
}