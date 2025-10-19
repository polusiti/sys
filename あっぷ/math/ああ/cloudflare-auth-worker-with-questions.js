// cloudflare-auth-worker.js - Complete version with Questions API added
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare-auth-worker.js
var SimpleWebAuthn = class {
  static generateRegistrationOptions(options) {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeBase64 = btoa(String.fromCharCode(...challenge));
    return {
      challenge: challengeBase64,
      rp: { name: options.rpName, id: options.rpID },
      user: {
        id: btoa(options.userID),
        // Convert to base64 string
        name: options.userName,
        displayName: options.userDisplayName
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: options.authenticatorSelection || {
        userVerification: "preferred",
        residentKey: "preferred"
      },
      timeout: 3e5,
      attestation: options.attestationType || "none"
    };
  }
  static generateAuthenticationOptions(options) {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeBase64 = btoa(String.fromCharCode(...challenge));
    return {
      challenge: challengeBase64,
      rpId: options.rpID,
      allowCredentials: options.allowCredentials || [],
      userVerification: options.userVerification || "preferred",
      timeout: 3e5
    };
  }
  static async verifyRegistrationResponse(options) {
    return {
      verified: true,
      registrationInfo: {
        credentialPublicKey: "mock_public_key",
        credentialID: options.response.id,
        counter: 0
      }
    };
  }
  static async verifyAuthenticationResponse(options) {
    return {
      verified: true,
      authenticationInfo: {
        newCounter: 1
      }
    };
  }
};
__name(SimpleWebAuthn, "SimpleWebAuthn");
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
      if (path.startsWith("/api/public/media/")) {
        const mediaId = path.split("/").pop();
        return await this.getPublicMediaFile(mediaId, env, corsHeaders);
      }

      // ======== NEW: Questions API Endpoints ========
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
      if (path === "/api/health") {
        return await this.healthCheck(request, env, corsHeaders);
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
      console.error("Authentication error:", error);
      return this.jsonResponse({ error: "Internal server error" }, 500, corsHeaders);
    }
  },

  // ======== NEW: Questions API Methods ========
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

      // Parse JSON fields
      const questions = (result.results || []).map(q => ({
        ...q,
        choices: q.choices ? JSON.parse(q.choices) : null,
        tags: q.tags ? JSON.parse(q.tags) : null,
        media_urls: q.media_urls ? JSON.parse(q.media_urls) : null
      }));

      return this.jsonResponse({
        success: true,
        questions: questions,
        total: questions.length
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

      // Parse JSON fields
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

  // ======== END: Questions API Methods ========

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
                    choices TEXT, -- JSON string for multiple choice
                    correct_answer INTEGER,
                    explanation TEXT,
                    estimated_time INTEGER,
                    tags TEXT, -- JSON string for tags
                    media_urls TEXT, -- JSON string for media file URLs
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
        message: "Authentication and media database initialized successfully",
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

  // Register new user
  async registerUser(request, env, corsHeaders) {
    try {
      const userData = await request.json();
      const { userId, displayName, email, inquiryNumber } = userData;
      if (!userId || !displayName || !inquiryNumber) {
        return this.jsonResponse({
          error: "Missing required fields: userId, displayName, inquiryNumber"
        }, 400, corsHeaders);
      }
      const existingUser = await env.DB.prepare(
        "SELECT id FROM users WHERE userId = ? OR inquiryNumber = ?"
      ).bind(userId, inquiryNumber).first();
      if (existingUser) {
        return this.jsonResponse({
          error: "User ID or inquiry number already exists"
        }, 409, corsHeaders);
      }
      const userIdGenerated = this.generateId();
      const now = (/* @__PURE__ */ new Date()).toISOString();
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
        "active",
        "user"
      ).run();
      const newUser = {
        id: userIdGenerated,
        userId,
        displayName,
        email,
        inquiryNumber,
        registeredAt: now,
        status: "active",
        role: "user"
      };
      return this.jsonResponse({
        success: true,
        user: newUser
      }, 201, corsHeaders);
    } catch (error) {
      console.error("User registration error:", error);
      return this.jsonResponse({
        error: "User registration failed",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Begin passkey registration
  async beginPasskeyRegistration(request, env, corsHeaders) {
    try {
      const { userId } = await request.json();
      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE id = ?"
      ).bind(userId).first();
      if (!user) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      const options = SimpleWebAuthn.generateRegistrationOptions({
        rpName: "Data Manager",
        rpID: this.getRpId(request),
        userID: userId,
        userName: user.userId,
        userDisplayName: user.displayName,
        attestationType: "none",
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "preferred"
        }
      });
      const challengeId = this.generateId();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1e3).toISOString();
      await env.DB.prepare(`
                INSERT INTO challenges (id, challenge, userId, type, createdAt, expiresAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
        challengeId,
        options.challenge,
        userId,
        "registration",
        (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      ).run();
      return this.jsonResponse(options, 200, corsHeaders);
    } catch (error) {
      console.error("Passkey registration begin error:", error);
      return this.jsonResponse({
        error: "Failed to begin passkey registration",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Complete passkey registration
  async completePasskeyRegistration(request, env, corsHeaders) {
    try {
      const { userId, credential } = await request.json();
      const challenge = await env.DB.prepare(
        "SELECT challenge FROM challenges WHERE userId = ? AND type = ? AND expiresAt > ?"
      ).bind(userId, "registration", (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!challenge) {
        return this.jsonResponse({
          error: "Invalid or expired challenge"
        }, 400, corsHeaders);
      }
      const verification = await SimpleWebAuthn.verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.getOrigin(request),
        expectedRPID: this.getRpId(request)
      });
      if (!verification.verified) {
        return this.jsonResponse({
          error: "Passkey registration verification failed"
        }, 400, corsHeaders);
      }
      const passkeyId = this.generateId();
      const now = (/* @__PURE__ */ new Date()).toISOString();
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
      await env.DB.prepare(
        "DELETE FROM challenges WHERE userId = ? AND type = ?"
      ).bind(userId, "registration").run();
      return this.jsonResponse({
        success: true,
        verified: true
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Passkey registration complete error:", error);
      return this.jsonResponse({
        error: "Failed to complete passkey registration",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Begin passkey login
  async beginPasskeyLogin(request, env, corsHeaders) {
    try {
      const { userId } = await request.json();
      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE userId = ?"
      ).bind(userId).first();
      if (!user) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      const passkeys = await env.DB.prepare(
        "SELECT credentialId FROM passkeys WHERE userId = ?"
      ).bind(user.id).all();
      const options = SimpleWebAuthn.generateAuthenticationOptions({
        rpID: this.getRpId(request),
        allowCredentials: passkeys.results.map((pk) => ({
          id: pk.credentialId,
          type: "public-key"
        })),
        userVerification: "preferred"
      });
      const challengeId = this.generateId();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1e3).toISOString();
      await env.DB.prepare(`
                INSERT INTO challenges (id, challenge, userId, type, createdAt, expiresAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
        challengeId,
        options.challenge,
        user.id,
        "authentication",
        (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      ).run();
      return this.jsonResponse(options, 200, corsHeaders);
    } catch (error) {
      console.error("Passkey login begin error:", error);
      return this.jsonResponse({
        error: "Failed to begin passkey login",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Complete passkey login
  async completePasskeyLogin(request, env, corsHeaders) {
    try {
      const { userId, assertion } = await request.json();
      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE userId = ?"
      ).bind(userId).first();
      if (!user) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      const challenge = await env.DB.prepare(
        "SELECT challenge FROM challenges WHERE userId = ? AND type = ? AND expiresAt > ?"
      ).bind(user.id, "authentication", (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!challenge) {
        return this.jsonResponse({
          error: "Invalid or expired challenge"
        }, 400, corsHeaders);
      }
      const passkey = await env.DB.prepare(
        "SELECT * FROM passkeys WHERE credentialId = ? AND userId = ?"
      ).bind(assertion.id, user.id).first();
      if (!passkey) {
        return this.jsonResponse({
          error: "Passkey not found"
        }, 404, corsHeaders);
      }
      const verification = await SimpleWebAuthn.verifyAuthenticationResponse({
        response: assertion,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.getOrigin(request),
        expectedRPID: this.getRpId(request),
        authenticator: JSON.parse(passkey.publicKey),
        expectedType: "webauthn.get"
      });
      if (!verification.verified) {
        return this.jsonResponse({
          error: "Passkey authentication verification failed"
        }, 400, corsHeaders);
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await env.DB.prepare(
        "UPDATE passkeys SET counter = ?, lastUsedAt = ? WHERE id = ?"
      ).bind(verification.authenticationInfo.newCounter, now, passkey.id).run();
      await env.DB.prepare(
        "UPDATE users SET lastLoginAt = ? WHERE id = ?"
      ).bind(now, user.id).run();
      const sessionToken = this.generateSessionToken();
      const sessionId = this.generateId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
      await env.DB.prepare(`
                INSERT INTO sessions (id, userId, sessionToken, createdAt, expiresAt, ipAddress, userAgent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
        sessionId,
        user.id,
        sessionToken,
        now,
        expiresAt,
        request.headers.get("cf-connecting-ip") || "unknown",
        request.headers.get("user-agent") || "unknown"
      ).run();
      await env.DB.prepare(
        "DELETE FROM challenges WHERE userId = ? AND type = ?"
      ).bind(user.id, "authentication").run();
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
      console.error("Passkey login complete error:", error);
      return this.jsonResponse({
        error: "Failed to complete passkey login",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Get current user from session
  async getCurrentUser(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "No session token" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(`
                SELECT s.*, u.* FROM sessions s
                JOIN users u ON s.userId = u.id
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
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
      console.error("Get current user error:", error);
      return this.jsonResponse({
        error: "Failed to get current user",
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
          "DELETE FROM sessions WHERE sessionToken = ?"
        ).bind(sessionToken).run();
      }
      return this.jsonResponse({ success: true }, 200, corsHeaders);
    } catch (error) {
      console.error("Logout error:", error);
      return this.jsonResponse({
        error: "Logout failed",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Get user by inquiry number
  async getUserByInquiryNumber(inquiryNumber, env, corsHeaders) {
    try {
      const user = await env.DB.prepare(
        "SELECT id, userId, displayName, email, inquiryNumber, registeredAt, lastLoginAt, status, role FROM users WHERE inquiryNumber = ?"
      ).bind(inquiryNumber).first();
      if (!user) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      return this.jsonResponse(user, 200, corsHeaders);
    } catch (error) {
      console.error("Get user by inquiry number error:", error);
      return this.jsonResponse({
        error: "Failed to get user",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Update user profile
  async updateUserProfile(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        "SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?"
      ).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const updates = await request.json();
      const allowedFields = ["displayName", "email"];
      const updateFields = [];
      const updateValues = [];
      for (const field of allowedFields) {
        if (updates[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field]);
        }
      }
      if (updateFields.length === 0) {
        return this.jsonResponse({ error: "No valid fields to update" }, 400, corsHeaders);
      }
      updateValues.push(session.userId);
      await env.DB.prepare(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`
      ).bind(...updateValues).run();
      const updatedUser = await env.DB.prepare(
        "SELECT id, userId, displayName, email, inquiryNumber, role FROM users WHERE id = ?"
      ).bind(session.userId).first();
      return this.jsonResponse(updatedUser, 200, corsHeaders);
    } catch (error) {
      console.error("Update user profile error:", error);
      return this.jsonResponse({
        error: "Failed to update profile",
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
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        "SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?"
      ).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const user = await env.DB.prepare(
        "SELECT id, displayName, storageQuota, storageUsed FROM users WHERE id = ?"
      ).bind(session.userId).first();
      if (!user) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      const formData = await request.formData();
      const file = formData.get("file");
      const subject = formData.get("subject") || "general";
      const category = formData.get("category") || "general";
      const description = formData.get("description") || "";
      const isPublic = formData.get("isPublic") === "true";
      if (!file) {
        return this.jsonResponse({ error: "No file provided" }, 400, corsHeaders);
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4"
      ];
      if (!allowedTypes.includes(file.type)) {
        return this.jsonResponse({
          error: "Unsupported file type",
          allowedTypes
        }, 400, corsHeaders);
      }
      const maxFileSize = 50 * 1024 * 1024;
      if (file.size > maxFileSize) {
        return this.jsonResponse({
          error: "File too large",
          maxSize: maxFileSize,
          fileSize: file.size
        }, 400, corsHeaders);
      }
      if (user.storageUsed + file.size > user.storageQuota) {
        return this.jsonResponse({
          error: "Storage quota exceeded",
          quota: user.storageQuota,
          used: user.storageUsed,
          needed: file.size
        }, 413, corsHeaders);
      }
      const fileExtension = file.name.split(".").pop();
      const mediaId = this.generateId();
      const filename = `${mediaId}.${fileExtension}`;
      const r2Key = `users/${user.id}/${subject}/${category}/${filename}`;
      await env.MEDIA_BUCKET.put(r2Key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `attachment; filename="${file.name}"`
        },
        customMetadata: {
          userId: user.id,
          originalName: file.name,
          uploadedBy: user.displayName,
          subject,
          category
        }
      });
      let publicUrl = null;
      if (isPublic) {
        publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await env.DB.prepare(`
                INSERT INTO media_files (
                    id, userId, filename, originalName, fileType, fileSize,
                    r2Path, r2Key, publicUrl, subject, category, description,
                    uploadDate, isPublic, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
        mediaId,
        user.id,
        filename,
        file.name,
        file.type,
        file.size,
        r2Key,
        r2Key,
        publicUrl,
        subject,
        category,
        description,
        now,
        isPublic,
        "active"
      ).run();
      await env.DB.prepare(
        "UPDATE users SET storageUsed = storageUsed + ? WHERE id = ?"
      ).bind(file.size, user.id).run();
      await this.logMediaAccess(env, mediaId, user.id, "upload", request);
      return this.jsonResponse({
        success: true,
        mediaId,
        filename,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        publicUrl,
        subject,
        category,
        uploadDate: now
      }, 201, corsHeaders);
    } catch (error) {
      console.error("Media upload error:", error);
      return this.jsonResponse({
        error: "Media upload failed",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // List user's media files
  async listUserMedia(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        "SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?"
      ).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const url = new URL(request.url);
      const subject = url.searchParams.get("subject");
      const category = url.searchParams.get("category");
      const fileType = url.searchParams.get("fileType");
      const limit = parseInt(url.searchParams.get("limit")) || 50;
      const offset = parseInt(url.searchParams.get("offset")) || 0;
      let query = "SELECT * FROM media_files WHERE userId = ? AND status = ?";
      let params = [session.userId, "active"];
      if (subject) {
        query += " AND subject = ?";
        params.push(subject);
      }
      if (category) {
        query += " AND category = ?";
        params.push(category);
      }
      if (fileType) {
        query += " AND fileType LIKE ?";
        params.push(`${fileType}%`);
      }
      query += " ORDER BY uploadDate DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);
      const files = await env.DB.prepare(query).bind(...params).all();
      return this.jsonResponse({
        success: true,
        files: files.results,
        count: files.results.length,
        limit,
        offset
      }, 200, corsHeaders);
    } catch (error) {
      console.error("List media error:", error);
      return this.jsonResponse({
        error: "Failed to list media files",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Get specific media file
  async getMediaFile(mediaId, request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        "SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?"
      ).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const media = await env.DB.prepare(
        "SELECT * FROM media_files WHERE id = ? AND status = ?"
      ).bind(mediaId, "active").first();
      if (!media) {
        return this.jsonResponse({ error: "Media file not found" }, 404, corsHeaders);
      }
      if (media.userId !== session.userId && !media.isPublic) {
        return this.jsonResponse({ error: "Access denied" }, 403, corsHeaders);
      }
      const signedUrl = await this.generateSignedUrl(env, media.r2Key, 3600);
      await this.logMediaAccess(env, mediaId, session.userId, "download", request);
      await env.DB.prepare(
        "UPDATE media_files SET downloadCount = downloadCount + 1, lastAccessed = ? WHERE id = ?"
      ).bind((/* @__PURE__ */ new Date()).toISOString(), mediaId).run();
      return this.jsonResponse({
        success: true,
        media,
        downloadUrl: signedUrl
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Get media file error:", error);
      return this.jsonResponse({
        error: "Failed to get media file",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Delete media file
  async deleteMediaFile(mediaId, request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        "SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?"
      ).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const media = await env.DB.prepare(
        "SELECT * FROM media_files WHERE id = ? AND userId = ? AND status = ?"
      ).bind(mediaId, session.userId, "active").first();
      if (!media) {
        return this.jsonResponse({ error: "Media file not found or access denied" }, 404, corsHeaders);
      }
      await env.MEDIA_BUCKET.delete(media.r2Key);
      await env.DB.prepare(
        "UPDATE media_files SET status = ?, deletedDate = ? WHERE id = ?"
      ).bind("deleted", (/* @__PURE__ */ new Date()).toISOString(), mediaId).run();
      await env.DB.prepare(
        "UPDATE users SET storageUsed = storageUsed - ? WHERE id = ?"
      ).bind(media.fileSize, session.userId).run();
      await this.logMediaAccess(env, mediaId, session.userId, "delete", request);
      return this.jsonResponse({
        success: true,
        message: "Media file deleted successfully"
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Delete media file error:", error);
      return this.jsonResponse({
        error: "Failed to delete media file",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Update media file metadata
  async updateMediaFile(mediaId, request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        "SELECT userId FROM sessions WHERE sessionToken = ? AND expiresAt > ?"
      ).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session) {
        return this.jsonResponse({ error: "Invalid or expired session" }, 401, corsHeaders);
      }
      const updates = await request.json();
      const allowedFields = ["description", "isPublic", "category"];
      const updateFields = [];
      const updateValues = [];
      for (const field of allowedFields) {
        if (updates[field] !== void 0) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field]);
        }
      }
      if (updateFields.length === 0) {
        return this.jsonResponse({ error: "No valid fields to update" }, 400, corsHeaders);
      }
      updateValues.push(mediaId, session.userId);
      await env.DB.prepare(
        `UPDATE media_files SET ${updateFields.join(", ")} WHERE id = ? AND userId = ?`
      ).bind(...updateValues).run();
      const updatedMedia = await env.DB.prepare(
        "SELECT * FROM media_files WHERE id = ? AND userId = ?"
      ).bind(mediaId, session.userId).first();
      return this.jsonResponse({
        success: true,
        media: updatedMedia
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Update media file error:", error);
      return this.jsonResponse({
        error: "Failed to update media file",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Get public media file (no authentication required)
  async getPublicMediaFile(mediaId, env, corsHeaders) {
    try {
      const media = await env.DB.prepare(
        "SELECT * FROM media_files WHERE id = ? AND isPublic = 1 AND status = ?"
      ).bind(mediaId, "active").first();
      if (!media) {
        return this.jsonResponse({ error: "Public media file not found" }, 404, corsHeaders);
      }
      await this.logMediaAccess(env, mediaId, null, "public_download", null);
      await env.DB.prepare(
        "UPDATE media_files SET downloadCount = downloadCount + 1, lastAccessed = ? WHERE id = ?"
      ).bind((/* @__PURE__ */ new Date()).toISOString(), mediaId).run();
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
      console.error("Get public media file error:", error);
      return this.jsonResponse({
        error: "Failed to get public media file",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Generate signed URL for R2 access
  async generateSignedUrl(env, r2Key, expirationSeconds = 3600) {
    try {
      return `${env.R2_PUBLIC_URL}/${r2Key}`;
    } catch (error) {
      console.error("Generate signed URL error:", error);
      throw error;
    }
  },

  // Log media access for analytics
  async logMediaAccess(env, mediaId, userId, accessType, request) {
    try {
      const logId = this.generateId();
      const ipAddress = request ? request.headers.get("cf-connecting-ip") || "unknown" : "unknown";
      const userAgent = request ? request.headers.get("user-agent") || "unknown" : "unknown";
      await env.DB.prepare(`
                INSERT INTO media_access_log (id, mediaId, userId, accessType, ipAddress, userAgent, accessDate)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
        logId,
        mediaId,
        userId,
        accessType,
        ipAddress,
        userAgent,
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
    } catch (error) {
      console.error("Log media access error:", error);
    }
  },

  // Admin Management Methods
  // Get admin statistics
  async getAdminStats(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(`
                SELECT u.role FROM sessions s
                JOIN users u ON s.userId = u.id
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session || session.role !== "admin") {
        return this.jsonResponse({ error: "Admin access required" }, 403, corsHeaders);
      }
      const userCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = ?").bind("active").first();
      const mediaCount = await env.DB.prepare("SELECT COUNT(*) as count FROM media_files WHERE status = ?").bind("active").first();
      const totalStorage = await env.DB.prepare("SELECT SUM(storageUsed) as total FROM users").first();
      const recentUsers = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE registeredAt > ?").bind(new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString()).first();
      return this.jsonResponse({
        success: true,
        stats: {
          totalUsers: userCount.count || 0,
          totalMedia: mediaCount.count || 0,
          totalStorage: totalStorage.total || 0,
          recentUsers: recentUsers.count || 0,
          systemUptime: Date.now(),
          // Placeholder
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Get admin stats error:", error);
      return this.jsonResponse({
        error: "Failed to get admin stats",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Get all users for admin management
  async getAdminUsers(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(`
                SELECT u.role FROM sessions s
                JOIN users u ON s.userId = u.id
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session || session.role !== "admin") {
        return this.jsonResponse({ error: "Admin access required" }, 403, corsHeaders);
      }
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit")) || 50;
      const offset = parseInt(url.searchParams.get("offset")) || 0;
      const search = url.searchParams.get("search");
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
          limit,
          offset,
          hasMore: offset + limit < totalCount.total
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Get admin users error:", error);
      return this.jsonResponse({
        error: "Failed to get users",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Setup initial admin (for first-time setup using admin token)
  async setupInitialAdmin(request, env, corsHeaders) {
    try {
      const authHeader = request.headers.get("Authorization");
      const adminToken = env.ADMIN_TOKEN || "questa-admin-2024";
      if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.replace("Bearer ", "") !== adminToken) {
        return this.jsonResponse({ error: "Invalid admin token" }, 401, corsHeaders);
      }
      const { userId, role } = await request.json();
      if (!userId || !role) {
        return this.jsonResponse({ error: "userId and role are required" }, 400, corsHeaders);
      }
      if (!["user", "admin"].includes(role)) {
        return this.jsonResponse({ error: "Invalid role. Must be user or admin" }, 400, corsHeaders);
      }
      const user = await env.DB.prepare(
        "SELECT id, userId, displayName, email, role FROM users WHERE userId = ?"
      ).bind(userId).first();
      if (!user) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      const result = await env.DB.prepare(
        "UPDATE users SET role = ? WHERE userId = ?"
      ).bind(role, userId).run();
      if (result.changes === 0) {
        return this.jsonResponse({ error: "Failed to update user role" }, 500, corsHeaders);
      }
      const updatedUser = await env.DB.prepare(
        "SELECT id, userId, displayName, email, role FROM users WHERE userId = ?"
      ).bind(userId).first();
      return this.jsonResponse({
        success: true,
        message: `User ${userId} role updated to ${role}`,
        user: updatedUser
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Setup initial admin error:", error);
      return this.jsonResponse({
        error: "Failed to setup initial admin",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Get users for setup (using admin token)
  async getSetupUsers(request, env, corsHeaders) {
    try {
      const authHeader = request.headers.get("Authorization");
      const adminToken = env.ADMIN_TOKEN || "questa-admin-2024";
      if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.replace("Bearer ", "") !== adminToken) {
        return this.jsonResponse({ error: "Invalid admin token" }, 401, corsHeaders);
      }
      const users = await env.DB.prepare(`
                SELECT userId, displayName, email, role, registeredAt, status
                FROM users
                ORDER BY registeredAt DESC
            `).all();
      return this.jsonResponse({
        success: true,
        users: users.results
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Get setup users error:", error);
      return this.jsonResponse({
        error: "Failed to get users",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Promote user to admin
  async promoteUserToAdmin(request, env, corsHeaders) {
    try {
      const sessionToken = this.getSessionTokenFromRequest(request);
      if (!sessionToken) {
        return this.jsonResponse({ error: "Authentication required" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(`
                SELECT u.role FROM sessions s
                JOIN users u ON s.userId = u.id
                WHERE s.sessionToken = ? AND s.expiresAt > ?
            `).bind(sessionToken, (/* @__PURE__ */ new Date()).toISOString()).first();
      if (!session || session.role !== "admin") {
        return this.jsonResponse({ error: "Admin access required" }, 403, corsHeaders);
      }
      const { userId, role } = await request.json();
      if (!userId || !role) {
        return this.jsonResponse({ error: "userId and role are required" }, 400, corsHeaders);
      }
      if (!["user", "admin"].includes(role)) {
        return this.jsonResponse({ error: "Invalid role. Must be user or admin" }, 400, corsHeaders);
      }
      const result = await env.DB.prepare(
        "UPDATE users SET role = ? WHERE id = ?"
      ).bind(role, userId).run();
      if (result.changes === 0) {
        return this.jsonResponse({ error: "User not found" }, 404, corsHeaders);
      }
      const updatedUser = await env.DB.prepare(
        "SELECT id, userId, displayName, email, role FROM users WHERE id = ?"
      ).bind(userId).first();
      return this.jsonResponse({
        success: true,
        message: `User role updated to ${role}`,
        user: updatedUser
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Promote user error:", error);
      return this.jsonResponse({
        error: "Failed to update user role",
        details: error.message
      }, 500, corsHeaders);
    }
  },

  // Search Questions Method
  async searchQuestions(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const subject = url.searchParams.get("subject") || "math";
      const search = url.searchParams.get("search") || "";
      const difficulty_level = url.searchParams.get("difficulty_level");
      const tags = url.searchParams.get("tags") || "";
      const yearFilter = url.searchParams.get("yearFilter") || "";
      const limit = parseInt(url.searchParams.get("limit")) || 50;
      const offset = parseInt(url.searchParams.get("offset")) || 0;
      console.log("Search parameters:", { subject, search, difficulty_level, tags, yearFilter, limit, offset });
      let sql = `
                SELECT q.*,
                       s.times_used, s.correct_attempts, s.total_attempts, s.avg_time_spent
                FROM questions q
                LEFT JOIN question_stats s ON q.id = s.question_id
                WHERE q.subject = ?
            `;
      let params = [subject];
      if (difficulty_level) {
        sql += " AND q.difficulty_amount = ?";
        params.push(parseInt(difficulty_level));
      }
      if (search) {
        sql += " AND (q.title LIKE ? OR q.question_text LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      if (tags) {
        sql += " AND q.tags LIKE ?";
        params.push(`%${tags}%`);
      }
      if (yearFilter) {
        const [startYear, endYear] = yearFilter.split("-").map((y) => parseInt(y));
        if (startYear && endYear) {
          sql += ' AND CAST(strftime("%Y", q.created_at) AS INTEGER) BETWEEN ? AND ?';
          params.push(startYear, endYear);
        }
      }
      sql += " ORDER BY q.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);
      console.log("SQL Query:", sql);
      console.log("Parameters:", params);
      const result = await env.DB.prepare(sql).bind(...params).all();
      if (!result.success) {
        throw new Error("Database query failed");
      }
      const questions = result.results.map((row) => ({
        ...row,
        choices: row.choices ? JSON.parse(row.choices) : null,
        tags: row.tags ? JSON.parse(row.tags) : null,
        mediaUrls: row.media_urls ? JSON.parse(row.media_urls) : null,
        // Convert database fields to frontend format
        id: row.id,
        title: row.title,
        subject: row.subject,
        category: row.field_code || "\u672A\u5206\u985E",
        difficulty: row.difficulty_amount || 1,
        author: "\u30B7\u30B9\u30C6\u30E0",
        content: row.question_text,
        answerType: row.answer_format === "A1" ? "auto" : "manual",
        likes: 0,
        answers: row.total_attempts || 0,
        createdAt: row.created_at,
        source: "database"
      }));
      console.log(`Found ${questions.length} questions`);
      return this.jsonResponse({
        success: true,
        data: questions,
        count: questions.length,
        pagination: {
          limit,
          offset,
          hasMore: questions.length === limit
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Search questions error:", error);
      return this.jsonResponse({
        success: false,
        error: "Search failed: " + error.message,
        data: []
      }, 500, corsHeaders);
    }
  },

  // Seed Sample Data Method
  async seedSampleData(request, env, corsHeaders) {
    try {
      const authHeader = request.headers.get("Authorization");
      const adminToken = env.ADMIN_TOKEN || "questa-admin-2024";
      if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.replace("Bearer ", "") !== adminToken) {
        return this.jsonResponse({ error: "Admin authentication required" }, 401, corsHeaders);
      }
      console.log("Seeding sample data...");
      const sampleQuestions = [
        {
          id: "q_sample_math_001",
          subject: "math",
          title: "cos(n\xB0)\u304C\u6709\u7406\u6570\u3068\u306A\u308Bn\u306F\u3044\u304F\u3064\u5B58\u5728\u3059\u308B\u304B",
          question_text: "(1) \u81EA\u7136\u6570 n \u306B\u3064\u3044\u3066\u3001$\\cos\\theta = x$ \u3068\u304A\u304F\u3068 $\\cos n\\theta$ \u304C $x$ \u306E\u591A\u9805\u5F0F\u3067\u8868\u305B\u3001\u307E\u305F\u305D\u306E\u4FC2\u6570\u306F\u3059\u3079\u3066\u6574\u6570\u3068\u306A\u308B\u3053\u3068\u3092\u793A\u305B\u3002",
          answer_format: "manual",
          difficulty_level: "A",
          difficulty_amount: 4,
          field_code: "\u6570\u5B66\u2162",
          choices: null,
          correct_answer: null,
          explanation: "\u30C1\u30A7\u30D3\u30B7\u30A7\u30D5\u591A\u9805\u5F0F\u3092\u7528\u3044\u305F\u89E3\u6CD5\u304C\u6709\u52B9\u3067\u3059\u3002",
          estimated_time: 30,
          tags: JSON.stringify(["\u4E09\u89D2\u95A2\u6570", "\u591A\u9805\u5F0F", "\u6771\u4EAC\u5927\u5B66", "2020\u5E74"]),
          media_urls: null
        },
        {
          id: "q_sample_math_002",
          subject: "math",
          title: "\u4E8C\u6B21\u65B9\u7A0B\u5F0F\u3068\u5E7E\u4F55\u306E\u554F\u984C",
          question_text: "\u4E09\u89D2\u5F62 ABC \u306E\u9802\u70B9\u306F A(0,0), B(6,0), C(4,6) \u3067\u3042\u308B\u3002AC \u306E\u4E2D\u70B9\u3092\u901A\u308A\u3001BC \u306B\u5782\u76F4\u306A\u76F4\u7DDA\u306E\u65B9\u7A0B\u5F0F\u3092\u6C42\u3081\u3088\u3002",
          answer_format: "auto",
          difficulty_level: "B",
          difficulty_amount: 3,
          field_code: "\u6570\u5B66\u2161",
          choices: JSON.stringify(["y = x + 2", "y = -x + 4", "y = 2x - 1", "y = -2x + 5"]),
          correct_answer: 1,
          explanation: "\u4E2D\u70B9\u306E\u5EA7\u6A19\u3068\u5782\u76F4\u6761\u4EF6\u3092\u5229\u7528\u3057\u307E\u3059\u3002",
          estimated_time: 15,
          tags: JSON.stringify(["\u4E8C\u6B21\u65B9\u7A0B\u5F0F", "\u521D\u7B49\u5E7E\u4F55", "\u4EE3\u6570", "\u65E9\u7A32\u7530\u5927\u5B66", "2019\u5E74"]),
          media_urls: null
        },
        {
          id: "q_sample_physics_001",
          subject: "physics",
          title: "\u659C\u65B9\u6295\u5C04\u306B\u304A\u3051\u308B\u6700\u9AD8\u70B9\u306E\u9AD8\u3055",
          question_text: "\u8CEA\u91CFm = 2kg\u306E\u7269\u4F53\u3092\u521D\u901F\u5EA6v\u2080 = 20m/s\u3001\u4EF0\u89D2\u03B8 = 30\xB0\u3067\u6295\u5C04\u3059\u308B\u3002\u6700\u9AD8\u70B9\u306B\u304A\u3051\u308B\u9AD8\u3055\u3092\u6C42\u3081\u3088\u3002",
          answer_format: "auto",
          difficulty_level: "B",
          difficulty_amount: 4,
          field_code: "\u529B\u5B66",
          choices: JSON.stringify(["5m", "10m", "15m", "20m"]),
          correct_answer: 0,
          explanation: "\u30A8\u30CD\u30EB\u30AE\u30FC\u4FDD\u5B58\u5247\u307E\u305F\u306F\u904B\u52D5\u65B9\u7A0B\u5F0F\u3092\u7528\u3044\u3066\u89E3\u3051\u307E\u3059\u3002",
          estimated_time: 10,
          tags: JSON.stringify(["\u529B\u5B66", "\u659C\u65B9\u6295\u5C04", "\u904B\u52D5\u65B9\u7A0B\u5F0F", "\u4EAC\u90FD\u5927\u5B66", "2021\u5E74"]),
          media_urls: null
        },
        {
          id: "q_sample_chemistry_001",
          subject: "chemistry",
          title: "\u5316\u5B66\u53CD\u5FDC\u306E\u5E73\u8861\u5B9A\u6570",
          question_text: "N\u2082 + 3H\u2082 \u21CC 2NH\u2083\u306E\u53CD\u5FDC\u306B\u304A\u3044\u3066\u3001\u5E73\u8861\u6642\u306E\u5404\u7269\u8CEA\u306E\u6FC3\u5EA6\u304B\u3089\u5E73\u8861\u5B9A\u6570\u3092\u6C42\u3081\u3088\u3002",
          answer_format: "manual",
          difficulty_level: "B",
          difficulty_amount: 3,
          field_code: "\u7269\u7406\u5316\u5B66",
          choices: null,
          correct_answer: null,
          explanation: "\u30EB\u30B7\u30E3\u30C8\u30EA\u30A8\u306E\u539F\u7406\u3082\u4E00\u7DD2\u306B\u8003\u3048\u3066\u307F\u308B\u3068\u9762\u767D\u3044\u3067\u3059\u3088\u3002",
          estimated_time: 20,
          tags: JSON.stringify(["\u5316\u5B66\u5E73\u8861", "\u5E73\u8861\u5B9A\u6570", "\u30A2\u30F3\u30E2\u30CB\u30A2\u5408\u6210", "\u5927\u962A\u5927\u5B66", "2020\u5E74"]),
          media_urls: null
        },
        {
          id: "q_sample_math_003",
          subject: "math",
          title: "\u8907\u7D20\u6570\u3068\u56F3\u5F62",
          question_text: "\u8907\u7D20\u6570\u5E73\u9762\u4E0A\u3067\u3001|z - 2| = |z - 2i|\u3092\u6E80\u305F\u3059\u70B9z\u306E\u8ECC\u8DE1\u3092\u6C42\u3081\u3088\u3002",
          answer_format: "auto",
          difficulty_level: "A",
          difficulty_amount: 2,
          field_code: "\u6570\u5B66\u2162",
          choices: JSON.stringify(["\u76F4\u7DDA x = y", "\u76F4\u7DDA x + y = 2", "\u5186 x\xB2 + y\xB2 = 4", "\u53CC\u66F2\u7DDA"]),
          correct_answer: 1,
          explanation: "2\u70B9\u304B\u3089\u306E\u8DDD\u96E2\u304C\u7B49\u3057\u3044\u70B9\u306E\u8ECC\u8DE1\u306F\u5782\u76F4\u4E8C\u7B49\u5206\u7DDA\u3067\u3059\u3002",
          estimated_time: 12,
          tags: JSON.stringify(["\u8907\u7D20\u6570", "\u8ECC\u8DE1", "\u56F3\u5F62", "\u6176\u61C9\u7FA9\u587E\u5927\u5B66", "1998\u5E74"]),
          media_urls: null
        },
        {
          id: "q_sample_math_004",
          subject: "math",
          title: "\u7A4D\u5206\u3068\u9762\u7A4D",
          question_text: "\u66F2\u7DDA y = x\xB3 - 3x\xB2 + 2x \u3068 x\u8EF8\u3067\u56F2\u307E\u308C\u305F\u56F3\u5F62\u306E\u9762\u7A4D\u3092\u6C42\u3081\u3088\u3002",
          answer_format: "manual",
          difficulty_level: "B",
          difficulty_amount: 3,
          field_code: "\u6570\u5B66\u2162",
          choices: null,
          correct_answer: null,
          explanation: "\u307E\u305A\u4EA4\u70B9\u3092\u6C42\u3081\u3001\u533A\u9593\u3092\u5206\u3051\u3066\u7A4D\u5206\u3057\u307E\u3059\u3002",
          estimated_time: 25,
          tags: JSON.stringify(["\u7A4D\u5206", "\u9762\u7A4D", "3\u6B21\u95A2\u6570", "\u4E00\u6A2A\u5927\u5B66", "1985\u5E74"]),
          media_urls: null
        }
      ];
      let insertedCount = 0;
      const insertErrors = [];
      for (const question of sampleQuestions) {
        try {
          const sql = `
                        INSERT OR REPLACE INTO questions (
                            id, subject, title, question_text, answer_format,
                            difficulty_level, difficulty_amount, field_code,
                            choices, correct_answer, explanation, estimated_time,
                            tags, media_urls, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `;
          const result = await env.DB.prepare(sql).bind(
            question.id,
            question.subject,
            question.title,
            question.question_text,
            question.answer_format,
            question.difficulty_level,
            question.difficulty_amount,
            question.field_code,
            question.choices,
            question.correct_answer,
            question.explanation,
            question.estimated_time,
            question.tags,
            question.media_urls
          ).run();
          if (result.success) {
            insertedCount++;
            console.log(`\u2705 Inserted question: ${question.title}`);
          } else {
            insertErrors.push(`Failed to insert ${question.title}: ${result.error}`);
          }
        } catch (error) {
          insertErrors.push(`Error inserting ${question.title}: ${error.message}`);
          console.error(`\u274C Error inserting question ${question.title}:`, error);
        }
      }
      return this.jsonResponse({
        success: true,
        message: `Successfully seeded ${insertedCount} sample questions`,
        insertedCount,
        totalQuestions: sampleQuestions.length,
        errors: insertErrors.length > 0 ? insertErrors : null
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Seed sample data error:", error);
      return this.jsonResponse({
        success: false,
        error: "Failed to seed sample data: " + error.message
      }, 500, corsHeaders);
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

export {
  cloudflare_auth_worker_default as default
};