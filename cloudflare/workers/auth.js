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
      } else if (path === '/api/auth/verify' && request.method === 'POST') {
        response = await handleVerifyEmail(request, env);
      } else if (path === '/api/auth/resend' && request.method === 'POST') {
        response = await handleResendVerification(request, env);
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

function validatePasswordStrength(password) {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    strength: [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
  };
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateUsername(username) {
  return username && username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
}

// Authentication handlers
async function handleVerifyEmail(request, env) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return new Response(JSON.stringify({ 
        error: 'メールアドレスと確認コードが必要です' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Find user with verification code
    const user = await env.DB.prepare(
      'SELECT id, email, username, verification_code, verification_expires FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'ユーザーが見つかりません' 
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (user.verification_code !== code) {
      return new Response(JSON.stringify({ 
        error: '確認コードが違います' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(user.verification_expires);
    if (now > expiresAt) {
      return new Response(JSON.stringify({ 
        error: '確認コードの有効期限が切れています。再送信してください。' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Mark email as verified
    await env.DB.prepare(
      'UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?'
    ).bind(user.id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'メールアドレスが確認されました。ログインしてください。'
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'メール確認に失敗しました' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleResendVerification(request, env) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'メールアドレスが必要です' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Find user
    const user = await env.DB.prepare(
      'SELECT id, email, username, email_verified FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'ユーザーが見つかりません' 
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (user.email_verified) {
      return new Response(JSON.stringify({ 
        error: 'このメールアドレスは既に確認されています' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Update user with new verification code
    await env.DB.prepare(
      'UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?'
    ).bind(verificationCode, verificationExpires, user.id).run();
    
    // Send verification email
    const emailResult = await sendVerificationEmail(env, email, verificationCode);
    
    let message = '確認コードを再生成しました。';
    if (emailResult.success) {
      message += emailResult.message.includes('開発モード') ? 
        '新しい確認コード: ' + verificationCode : 
        'メールアドレスに再送信しました。';
    } else {
      message += 'メール送信に失敗しました。';
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: message,
      email: email,
      devMode: !emailResult.success || emailResult.message.includes('開発モード')
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    return new Response(JSON.stringify({ 
      error: '確認コードの再送信に失敗しました' 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function sendVerificationEmail(env, email, verificationCode) {
  try {
    // SendGrid API integration
    const sendGridApiKey = env.SENDGRID_API_KEY;
    const fromEmail = env.FROM_EMAIL || 'noreply@testapp.jp';
    
    if (!sendGridApiKey) {
      console.log('SendGrid API key not configured, skipping email send');
      return { success: true, message: '確認コードを生成しました（開発モード）' };
    }
    
    const emailData = {
      personalizations: [
        {
          to: [{ email: email }],
          subject: 'TestApp - メールアドレス確認'
        }
      ],
      from: { email: fromEmail },
      content: [
        {
          type: 'text/plain',
          value: `TestAppへようこそ！

あなたの確認コードは: ${verificationCode}

このコードを登録画面で入力してください。

コードの有効期限は24時間です。

このメールに心当たりがない場合は、無視してください。

---
TestAppチーム`
        }
      ]
    };
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (response.ok) {
      return { success: true, message: '確認メールを送信しました' };
    } else {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return { success: false, message: 'メール送信に失敗しました' };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: 'メール送信エラーが発生しました' };
  }
}

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
    
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 8 characters',
        passwordStrength: passwordStrength
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
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Insert user with verification code
    const result = await env.DB.prepare(
      'INSERT INTO users (email, username, password_hash, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, username, passwordHash, verificationCode, verificationExpires).run();
    
    if (!result.success) {
      throw new Error('Failed to create user');
    }
    
    // Send verification email
    const emailResult = await sendVerificationEmail(env, email, verificationCode);
    
    let message = '登録完了！';
    if (emailResult.success) {
      message += emailResult.message.includes('開発モード') ? 
        '確認コード: ' + verificationCode : 
        'メールアドレスに確認コードを送信しました。';
    } else {
      message += '確認コードを生成しましたが、メール送信に失敗しました。';
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: message,
      userId: result.meta.last_row_id,
      requiresVerification: true,
      email: email,
      devMode: !emailResult.success || emailResult.message.includes('開発モード')
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
      'SELECT id, email, username, login_count, email_verified FROM users WHERE email = ? AND password_hash = ?'
    ).bind(email, passwordHash).first();
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'メールアドレスまたはパスワードが違います' 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!user.email_verified) {
      return new Response(JSON.stringify({ 
        error: 'メールアドレスが確認されていません。確認コードを入力してください。',
        requiresVerification: true,
        email: user.email
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