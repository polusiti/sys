// Simple test server for authentication API
const http = require('http');

// Import the auth logic (simplified)
const USERS = new Map();
const SESSIONS = new Map();

async function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateSessionToken() {
  const crypto = require('crypto');
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

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  try {
    if (path === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0-test',
        users: USERS.size,
        sessions: SESSIONS.size
      }));
      return;
    }
    
    if (path === '/api/auth/register' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const { email, username, password } = JSON.parse(body);
          
          // Validation
          if (!email || !username || !password) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing required fields' }));
            return;
          }
          
          if (!validateEmail(email) || !validateUsername(username) || !validatePassword(password)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid input format' }));
            return;
          }
          
          // Check if user exists
          for (const [key, user] of USERS) {
            if (user.email === email || user.username === username) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'User already exists' }));
              return;
            }
          }
          
          // Create user
          const passwordHash = await hashPassword(password);
          const userId = Date.now().toString();
          USERS.set(userId, {
            id: userId,
            email,
            username,
            passwordHash,
            createdAt: new Date().toISOString()
          });
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'User registered successfully',
            userId: userId
          }));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Registration failed' }));
        }
      });
      return;
    }
    
    if (path === '/api/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const { email, password } = JSON.parse(body);
          
          if (!email || !password) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Email and password required' }));
            return;
          }
          
          const passwordHash = await hashPassword(password);
          
          // Find user
          let foundUser = null;
          for (const [key, user] of USERS) {
            if (user.email === email && user.passwordHash === passwordHash) {
              foundUser = user;
              break;
            }
          }
          
          if (!foundUser) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Invalid email or password' }));
            return;
          }
          
          // Create session
          const sessionToken = generateSessionToken();
          SESSIONS.set(sessionToken, {
            userId: foundUser.id,
            email: foundUser.email,
            username: foundUser.username,
            loginTime: Date.now()
          });
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            token: sessionToken,
            user: {
              id: foundUser.id,
              email: foundUser.email,
              username: foundUser.username
            }
          }));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Login failed' }));
        }
      });
      return;
    }
    
    // Default 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
    
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🔐 Test Auth Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👤 Users: ${USERS.size}, Sessions: ${SESSIONS.size}`);
});