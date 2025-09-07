// Cloudflare Workers Authentication API
// File: workers/auth.js

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
        response = await handleRegister(request, env);
      } else if (path === '/api/auth/login' && request.method === 'POST') {
        response = await handleLogin(request, env);
      } else if (path === '/api/auth/logout' && request.method === 'POST') {
        response = await handleLogout(request, env);
      } else if (path === '/api/auth/me' && request.method === 'GET') {
        response = await handleGetUser(request, env);
      }
      // User progress routes
      else if (path === '/api/user/progress' && request.method === 'GET') {
        response = await handleGetProgress(request, env);
      } else if (path === '/api/user/progress' && request.method === 'POST') {
        response = await handleSaveProgress(request, env);
      } else if (path === '/api/user/sessions' && request.method === 'GET') {
        response = await handleGetSessions(request, env);
      }
      // Health check
      else if (path === '/api/health') {
        response = new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }));
      } else {
        response = new Response('Not Found', { status: 404 });
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

async function validateSession(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const sessionData = await env.SESSIONS.get(token);
  
  if (!sessionData) {
    return null;
  }
  
  return JSON.parse(sessionData);
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

// Authentication handlers
async function handleRegister(request, env) {
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
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Check if user exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).bind(email, username).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ 
        error: 'User with this email or username already exists' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Insert user
    const result = await env.DB.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
    ).bind(email, username, passwordHash).run();
    
    if (!result.success) {
      throw new Error('Failed to create user');
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User registered successfully',
      userId: result.meta.last_row_id
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ 
      error: 'Registration failed',
      message: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'Email and password required' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Hash password for comparison
    const passwordHash = await hashPassword(password);
    
    // Find user
    const user = await env.DB.prepare(
      'SELECT id, email, username, login_count FROM users WHERE email = ? AND password_hash = ?'
    ).bind(email, passwordHash).first();
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email or password' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Generate session token
    const sessionToken = generateSessionToken();
    const sessionData = {
      userId: user.id,
      email: user.email,
      username: user.username,
      loginTime: Date.now()
    };
    
    // Store session in KV (7 days expiry)
    await env.SESSIONS.put(sessionToken, JSON.stringify(sessionData), {
      expirationTtl: 7 * 24 * 60 * 60
    });
    
    // Update login info
    await env.DB.prepare(
      'UPDATE users SET last_login = datetime("now"), login_count = login_count + 1 WHERE id = ?'
    ).bind(user.id).run();
    
    return new Response(JSON.stringify({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        loginCount: user.login_count + 1
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

async function handleLogout(request, env) {
  try {
    const session = await validateSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Remove session from KV
    const authHeader = request.headers.get('Authorization');
    const token = authHeader.substring(7);
    await env.SESSIONS.delete(token);
    
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

async function handleGetUser(request, env) {
  try {
    const session = await validateSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({
      user: {
        id: session.userId,
        email: session.email,
        username: session.username
      }
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get user info' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Progress handlers
async function handleGetProgress(request, env) {
  try {
    const session = await validateSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const progress = await env.DB.prepare(
      'SELECT * FROM user_progress WHERE user_id = ?'
    ).bind(session.userId).all();
    
    return new Response(JSON.stringify({
      progress: progress.results || []
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get progress' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleSaveProgress(request, env) {
  try {
    const session = await validateSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const { subject, score, totalQuestions, duration } = await request.json();
    
    if (!subject || score === undefined || !totalQuestions) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Update or insert progress
    const accuracy = Math.round((score / totalQuestions) * 100 * 100) / 100;
    
    await env.DB.prepare(`
      INSERT INTO user_progress (user_id, subject, total_questions, correct_answers, best_score, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT (user_id, subject) DO UPDATE SET
        total_questions = total_questions + excluded.total_questions,
        correct_answers = correct_answers + excluded.correct_answers,
        best_score = MAX(best_score, excluded.best_score),
        updated_at = datetime('now')
    `).bind(session.userId, subject, totalQuestions, score, score).run();
    
    // Save session record
    await env.DB.prepare(`
      INSERT INTO study_sessions (user_id, subject, score, total_questions, accuracy, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(session.userId, subject, score, totalQuestions, accuracy, duration || 0).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Progress saved successfully'
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Save progress error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save progress' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleGetSessions(request, env) {
  try {
    const session = await validateSession(request, env);
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const sessions = await env.DB.prepare(
      'SELECT * FROM study_sessions WHERE user_id = ? ORDER BY completed_at DESC LIMIT 20'
    ).bind(session.userId).all();
    
    return new Response(JSON.stringify({
      sessions: sessions.results || []
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get sessions' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}