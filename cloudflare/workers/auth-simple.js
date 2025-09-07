// Simple Authentication API for testing without D1/KV
// File: workers/auth-simple.js

const USERS = new Map(); // In-memory storage for demo
const SESSIONS = new Map(); // In-memory storage for demo

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      let response;
      
      // Authentication routes
      if (path === '/api/auth/register' && request.method === 'POST') {
        response = await handleRegister(request);
      } else if (path === '/api/auth/login' && request.method === 'POST') {
        response = await handleLogin(request);
      } else if (path === '/api/auth/logout' && request.method === 'POST') {
        response = await handleLogout(request);
      } else if (path === '/api/auth/me' && request.method === 'GET') {
        response = await handleGetUser(request);
      }
      // Health check
      else if (path === '/api/health') {
        response = new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          version: '1.0.0-simple',
          storage: 'in-memory'
        }));
      } else {
        response = new Response(JSON.stringify({ error: 'Not Found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add CORS headers to response
      Object.keys(corsHeaders).forEach(key => {
        response.headers.set(key, corsHeaders[key]);
      });
      
      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      const errorResponse = new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
      return errorResponse;
    }
  },
};

// Utility functions
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSessionToken() {
  return crypto.randomUUID();
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function validateUsername(username) {
  return username && username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
}

async function handleRegister(request) {
  try {
    const { email, username, password } = await request.json();
    
    // Validation
    if (!email || !username || !password) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!validateUsername(username)) {
      return new Response(JSON.stringify({ 
        error: 'Username must be at least 3 characters and contain only letters, numbers, hyphens, and underscores' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!validatePassword(password)) {
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 8 characters' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Check if user exists (in memory)
    for (const [key, user] of USERS) {
      if (user.email === email || user.username === username) {
        return new Response(JSON.stringify({ 
          error: 'User with this email or username already exists' 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user (in memory)
    const userId = Date.now().toString();
    USERS.set(userId, {
      id: userId,
      email,
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User registered successfully',
      userId: userId
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ 
      error: 'Registration failed',
      message: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleLogin(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'Email and password required' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Hash password for comparison
    const passwordHash = await hashPassword(password);
    
    // Find user (in memory)
    let foundUser = null;
    for (const [key, user] of USERS) {
      if (user.email === email && user.passwordHash === passwordHash) {
        foundUser = user;
        break;
      }
    }
    
    if (!foundUser) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email or password' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Generate session token
    const sessionToken = generateSessionToken();
    const sessionData = {
      userId: foundUser.id,
      email: foundUser.email,
      username: foundUser.username,
      loginTime: Date.now()
    };
    
    // Store session (in memory)
    SESSIONS.set(sessionToken, sessionData);
    
    return new Response(JSON.stringify({
      success: true,
      token: sessionToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username
      }
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      error: 'Login failed',
      message: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleLogout(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const token = authHeader.substring(7);
    SESSIONS.delete(token);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ 
      error: 'Logout failed' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleGetUser(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const token = authHeader.substring(7);
    const sessionData = SESSIONS.get(token);
    
    if (!sessionData) {
      return new Response(JSON.stringify({ 
        error: 'Invalid session' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        username: sessionData.username
      }
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get user info' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}