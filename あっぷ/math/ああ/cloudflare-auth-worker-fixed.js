// cloudflare-auth-worker.js - Fixed version with Questions API
var cloudflare_auth_worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("Origin");
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",") : [
      "https://data.allfrom0.top",
      "https://polusiti.github.io",
      "http://localhost:3000",
      "http://127.0.0.1:5500"
    ];
    const corsHeaders = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
    if (origin && allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    } else {
      corsHeaders["Access-Control-Allow-Origin"] = "*";
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      // Authentication endpoints
      if (path === "/api/auth/init") {
        return await this.initializeDatabase(env, corsHeaders);
      }
      if (path === "/api/auth/register") {
        return await this.registerUser(request, env, corsHeaders);
      }
      if (path === "/api/auth/passkey/register/begin") {
        return await this.beginPasskeyRegistration(request, env, corsHeaders);
      }
      if (path === "/api/auth/passkey/register/complete") {
        return await this.completePasskeyRegistration(request, env, corsHeaders);
      }
      if (path === "/api/auth/passkey/login/begin") {
        return await this.beginPasskeyLogin(request, env, corsHeaders);
      }
      if (path === "/api/auth/passkey/login/complete") {
        return await this.completePasskeyLogin(request, env, corsHeaders);
      }
      if (path === "/api/auth/me") {
        return await this.getCurrentUser(request, env, corsHeaders);
      }
      if (path === "/api/auth/logout") {
        return await this.logout(request, env, corsHeaders);
      }
      if (path.startsWith("/api/auth/user/inquiry/")) {
        const inquiryNumber = path.split("/").pop();
        return await this.getUserByInquiryNumber(inquiryNumber, env, corsHeaders);
      }
      if (path === "/api/auth/profile") {
        return await this.updateUserProfile(request, env, corsHeaders);
      }

      // Media endpoints
      if (path === "/api/media/upload") {
        return await this.uploadMedia(request, env, corsHeaders);
      }
      if (path === "/api/media/list") {
        return await this.listUserMedia(request, env, corsHeaders);
      }
      if (path.startsWith("/api/media/") && request.method === "GET") {
        const mediaId = path.split("/").pop();
        return await this.getMediaFile(mediaId, request, env, corsHeaders);
      }
      if (path.startsWith("/api/media/") && request.method === "DELETE") {
        const mediaId = path.split("/").pop();
        return await this.deleteMediaFile(mediaId, request, env, corsHeaders);
      }
      if (path.startsWith("/api/media/") && request.method === "PUT") {
        const mediaId = path.split("/").pop();
        return await this.updateMediaFile(mediaId, request, env, corsHeaders);
      }

      // Admin endpoints
      if (path === "/api/admin/stats") {
        return await this.getAdminStats(request, env, corsHeaders);
      }
      if (path === "/api/admin/users") {
        return await this.getAdminUsers(request, env, corsHeaders);
      }
      if (path === "/api/admin/promote") {
        return await this.promoteUserToAdmin(request, env, corsHeaders);
      }
      if (path === "/api/admin/setup/promote") {
        return await this.setupInitialAdmin(request, env, corsHeaders);
      }
      if (path === "/api/admin/setup/users") {
        return await this.getSetupUsers(request, env, corsHeaders);
      }

      // Templates endpoints
      if (path === "/api/templates/tikz" && request.method === "GET") {
        return await this.getTikzTemplates(request, env, corsHeaders);
      }
      if (path === "/api/templates/tikz" && request.method === "POST") {
        return await this.saveTikzTemplate(request, env, corsHeaders);
      }

      // Public media endpoints
      if (path.startsWith("/api/public/media/")) {
        const mediaId = path.split("/").pop();
        return await this.getPublicMediaFile(mediaId, env, corsHeaders);
      }

      // Questions API endpoints - MAIN FOCUS
      if (path === "/api/questions" && request.method === "GET") {
        return await this.getQuestions(request, env, corsHeaders);
      }
      if (path === "/api/questions" && request.method === "POST") {
        return await this.createQuestion(request, env, corsHeaders);
      }
      if (path.startsWith("/api/questions/") && request.method === "GET") {
        const questionId = path.split("/").pop();
        return await this.getQuestionById(questionId, request, env, corsHeaders);
      }
      if (path.startsWith("/api/questions/") && request.method === "PUT") {
        const questionId = path.split("/").pop();
        return await this.updateQuestion(questionId, request, env, corsHeaders);
      }
      if (path.startsWith("/api/questions/") && request.method === "DELETE") {
        const questionId = path.split("/").pop();
        return await this.deleteQuestion(questionId, request, env, corsHeaders);
      }

      // Health check endpoint
      if (path === "/api/health") {
        return await this.healthCheck(request, env, corsHeaders);
      }

      // Test endpoint
      if (path === "/api/test") {
        return this.jsonResponse({ message: "Test endpoint works", timestamp: new Date().toISOString() }, 200, corsHeaders);
      }

      // Legacy endpoints
      if (path === "/api/search/questions") {
        return await this.searchQuestions(request, env, corsHeaders);
      }
      if (path === "/api/admin/seed-sample-data") {
        return await this.seedSampleData(request, env, corsHeaders);
      }

      return this.jsonResponse({ error: "Not found" }, 404, corsHeaders);
    } catch (error) {
      console.error("Worker error:", error);
      return this.jsonResponse({ error: "Internal server error" }, 500, corsHeaders);
    }
  },

  // Questions API Methods
  async getQuestions(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const subject = url.searchParams.get('subject');
      const field = url.searchParams.get('field');
      const limit = parseInt(url.searchParams.get('limit')) || 100;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      let query = "SELECT * FROM questions";
      let params = [];
      let conditions = [];

      if (subject) {
        conditions.push("subject = ?");
        params.push(subject);
      }
      if (field) {
        conditions.push("field_code = ?");
        params.push(field);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();

      return this.jsonResponse({
        success: true,
        questions: result.results || [],
        total: result.results ? result.results.length : 0
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Get questions error:", error);
      return this.jsonResponse({ error: "Failed to fetch questions" }, 500, corsHeaders);
    }
  },

  async createQuestion(request, env, corsHeaders) {
    try {
      const data = await request.json();

      const questionData = {
        id: data.id || this.generateId(),
        subject: data.subject || 'math',
        title: data.title || 'Untitled Question',
        question_text: data.question_text || data.content || '',
        answer_format: data.mode || 'katex',
        difficulty_level: data.difficulty || 'medium',
        difficulty_amount: data.difficulty_amount || this.mapDifficultyToAmount(data.difficulty),
        field_code: data.field_code || data.field || 'general',
        choices: data.choices ? JSON.stringify(data.choices) : null,
        correct_answer: data.correctAnswer || null,
        explanation: data.explanation || '',
        estimated_time: data.estimated_time || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        media_urls: data.media_urls ? JSON.stringify(data.media_urls) : null,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!questionData.question_text.trim()) {
        return this.jsonResponse({ error: "Question content is required" }, 400, corsHeaders);
      }

      await env.DB.prepare(`
        INSERT INTO questions (
          id, subject, title, question_text, answer_format, difficulty_level,
          difficulty_amount, field_code, choices, correct_answer, explanation,
          estimated_time, tags, media_urls, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        questionData.id, questionData.subject, questionData.title,
        questionData.question_text, questionData.answer_format,
        questionData.difficulty_level, questionData.difficulty_amount,
        questionData.field_code, questionData.choices, questionData.correct_answer,
        questionData.explanation, questionData.estimated_time, questionData.tags,
        questionData.media_urls, questionData.created_at, questionData.updated_at
      ).run();

      await env.DB.prepare(`
        INSERT INTO question_stats (question_id, times_used, correct_attempts, total_attempts, avg_time_spent)
        VALUES (?, 0, 0, 0, 0)
      `).bind(questionData.id).run();

      return this.jsonResponse({
        success: true,
        question_id: questionData.id,
        message: "Question created successfully"
      }, 201, corsHeaders);
    } catch (error) {
      console.error("Create question error:", error);
      return this.jsonResponse({ error: "Failed to create question" }, 500, corsHeaders);
    }
  },

  async getQuestionById(questionId, request, env, corsHeaders) {
    try {
      const question = await env.DB.prepare(
        "SELECT * FROM questions WHERE id = ?"
      ).bind(questionId).first();

      if (!question) {
        return this.jsonResponse({ error: "Question not found" }, 404, corsHeaders);
      }

      if (question.choices) question.choices = JSON.parse(question.choices);
      if (question.tags) question.tags = JSON.parse(question.tags);
      if (question.media_urls) question.media_urls = JSON.parse(question.media_urls);

      return this.jsonResponse({
        success: true,
        question: question
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Get question by ID error:", error);
      return this.jsonResponse({ error: "Failed to fetch question" }, 500, corsHeaders);
    }
  },

  async updateQuestion(questionId, request, env, corsHeaders) {
    try {
      const data = await request.json();
      const updateFields = [];
      const updateValues = [];

      if (data.title !== undefined) {
        updateFields.push("title = ?");
        updateValues.push(data.title);
      }
      if (data.question_text !== undefined) {
        updateFields.push("question_text = ?");
        updateValues.push(data.question_text);
      }
      if (data.difficulty_level !== undefined) {
        updateFields.push("difficulty_level = ?");
        updateValues.push(data.difficulty_level);
      }
      if (data.field_code !== undefined) {
        updateFields.push("field_code = ?");
        updateValues.push(data.field_code);
      }

      if (updateFields.length === 0) {
        return this.jsonResponse({ error: "No fields to update" }, 400, corsHeaders);
      }

      updateFields.push("updated_at = ?");
      updateValues.push(new Date().toISOString());
      updateValues.push(questionId);

      const query = `UPDATE questions SET ${updateFields.join(", ")} WHERE id = ?`;
      await env.DB.prepare(query).bind(...updateValues).run();

      return this.jsonResponse({
        success: true,
        message: "Question updated successfully"
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Update question error:", error);
      return this.jsonResponse({ error: "Failed to update question" }, 500, corsHeaders);
    }
  },

  async deleteQuestion(questionId, request, env, corsHeaders) {
    try {
      await env.DB.prepare("DELETE FROM question_stats WHERE question_id = ?").bind(questionId).run();
      await env.DB.prepare("DELETE FROM questions WHERE id = ?").bind(questionId).run();

      return this.jsonResponse({
        success: true,
        message: "Question deleted successfully"
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Delete question error:", error);
      return this.jsonResponse({ error: "Failed to delete question" }, 500, corsHeaders);
    }
  },

  // Health check endpoint
  async healthCheck(request, env, corsHeaders) {
    try {
      await env.DB.prepare("SELECT 1").first();
      return this.jsonResponse({
        success: true,
        message: "System is healthy",
        timestamp: new Date().toISOString()
      }, 200, corsHeaders);
    } catch (error) {
      return this.jsonResponse({
        success: false,
        error: "Database connection failed"
      }, 500, corsHeaders);
    }
  },

  // Initialize authentication database tables
  async initializeDatabase(env, corsHeaders) {
    try {
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
      await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_media_files_user ON media_files(userId)
            `).run();
      await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_media_files_subject ON media_files(subject, category)
            `).run();
      await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(fileType)
            `).run();
      await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS questions (
                    id TEXT PRIMARY KEY,
                    subject TEXT NOT NULL,
                    title TEXT,
                    question_text TEXT NOT NULL,
                    answer_format TEXT,
                    difficulty_level TEXT,
                    difficulty_amount INTEGER,
                    field_code TEXT,
                    choices TEXT,
                    correct_answer INTEGER,
                    explanation TEXT,
                    estimated_time INTEGER,
                    tags TEXT,
                    media_urls TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `).run();
      await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS question_stats (
                    question_id TEXT PRIMARY KEY,
                    times_used INTEGER DEFAULT 0,
                    correct_attempts INTEGER DEFAULT 0,
                    total_attempts INTEGER DEFAULT 0,
                    avg_time_spent REAL DEFAULT 0,
                    last_used DATETIME,
                    FOREIGN KEY (question_id) REFERENCES questions(id)
                )
            `).run();
      await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject, created_at DESC)
            `).run();
      await env.DB.prepare(`
                CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_amount)
            `).run();
      await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS tikz_templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    code TEXT NOT NULL,
                    category TEXT,
                    userId TEXT,
                    createdAt TEXT NOT NULL,
                    FOREIGN KEY (userId) REFERENCES users (id)
                )
            `).run();
      return this.jsonResponse({
        success: true,
        message: "Database initialized successfully",
        tables: ["users", "passkeys", "sessions", "challenges", "media_files", "media_access_log", "questions", "question_stats", "tikz_templates"]
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Database initialization error:", error);
      return this.jsonResponse({
        error: "Database initialization failed",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // --- TikZ Template Methods ---
  async getTikzTemplates(request, env, corsHeaders) {
    try {
      const templates = await env.DB.prepare(
        "SELECT * FROM tikz_templates ORDER BY category, name"
      ).all();
      return this.jsonResponse({ success: true, templates: templates.results }, 200, corsHeaders);
    } catch (error) {
      console.error("Get TikZ templates error:", error);
      return this.jsonResponse({ error: "Failed to fetch TikZ templates" }, 500, corsHeaders);
    }
  },

  async saveTikzTemplate(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare("SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?").bind(sessionToken, new Date().toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const data = await request.json();
      const { name, description, code, category } = data;
      if (!name || !code) {
        return this.jsonResponse({ error: "Missing required fields: name, code" }, 400, corsHeaders);
      }
      const templateId = this.generateId();
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO tikz_templates (id, name, description, code, category, userId, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(templateId, name, description || "", code, category || "general", session.userId, now).run();
      return this.jsonResponse({ success: true, id: templateId }, 201, corsHeaders);
    } catch (error) {
      console.error("Save TikZ template error:", error);
      return this.jsonResponse({ error: "Failed to save TikZ template" }, 500, corsHeaders);
    }
  },

  // Helper Methods
  generateId() {
    return crypto.randomUUID();
  },

  generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  },

  getSessionTokenFromRequest(request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.replace("Bearer ", "");
    }
    return null;
  },

  getRpId(request) {
    const origin = request.headers.get("Origin");
    if (origin) {
      const originUrl = new URL(origin);
      return originUrl.hostname;
    }
    const allowedDomains = [
      "data.allfrom0.top",
      "polusiti.github.io",
      "localhost"
    ];
    return "data.allfrom0.top";
  },

  getOrigin(request) {
    const origin = request.headers.get("Origin");
    if (origin) {
      return origin;
    }
    return "https://data.allfrom0.top";
  },

  mapDifficultyToAmount(difficulty) {
    const mapping = {
      'easy': 1,
      'medium': 3,
      'hard': 5
    };
    return mapping[difficulty] || 3;
  },

  jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });
  }
};

// Add the missing methods from the original worker (placeholders for now)
const placeholderMethods = [
  'registerUser', 'beginPasskeyRegistration', 'completePasskeyRegistration',
  'beginPasskeyLogin', 'completePasskeyLogin', 'getCurrentUser', 'logout',
  'getUserByInquiryNumber', 'updateUserProfile', 'uploadMedia', 'listUserMedia',
  'getMediaFile', 'deleteMediaFile', 'updateMediaFile', 'getAdminStats',
  'getAdminUsers', 'promoteUserToAdmin', 'setupInitialAdmin', 'getSetupUsers',
  'getPublicMediaFile', 'searchQuestions', 'seedSampleData'
];

placeholderMethods.forEach(method => {
  cloudflare_auth_worker_default[method] = async function(request, env, corsHeaders) {
    console.log(`Placeholder method called: ${method}`);
    return this.jsonResponse({ error: `Method ${method} not implemented yet` }, 501, corsHeaders);
  };
});

export {
  cloudflare_auth_worker_default as default
};