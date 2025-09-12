-- TestApp Authentication Database Schema
-- Cloudflare D1 (SQLite)

-- ユーザーテーブル
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT 0,
    verification_code TEXT,
    verification_expires TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0
);

-- ユーザー進捗テーブル
CREATE TABLE user_progress (
    user_id INTEGER,
    subject TEXT,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, subject),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 学習セッション履歴
CREATE TABLE study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT,
    score INTEGER,
    total_questions INTEGER,
    accuracy REAL,
    duration_minutes INTEGER,
    completed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- WebAuthn認証子テーブル
CREATE TABLE webauthn_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_type TEXT, -- 'platform' or 'cross-platform'
    authenticator_attachment TEXT, -- 'platform', 'cross-platform'
    user_verification TEXT DEFAULT 'preferred', -- 'required', 'preferred', 'discouraged'
    created_at TEXT DEFAULT (datetime('now')),
    last_used TEXT,
    use_count INTEGER DEFAULT 0,
    nickname TEXT, -- User-friendly name for the credential
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WebAuthn認証セッションテーブル（チャレンジ管理）
CREATE TABLE webauthn_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    operation_type TEXT NOT NULL, -- 'registration' or 'authentication'
    expires_at TEXT NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 問題テーブル
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    question TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mc', 'open', 'rootfrac')),
    choices TEXT, -- JSON array for multiple choice
    answer INTEGER, -- For multiple choice
    expected TEXT, -- JSON for open/rootfrac answers
    accepted TEXT, -- JSON array for accepted answers
    explanation TEXT,
    active BOOLEAN DEFAULT 1,
    audio_url TEXT, -- R2 audio file URL
    image_url TEXT, -- R2 image file URL
    tags TEXT, -- JSON array of tags
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 問題セット（バージョン管理）
CREATE TABLE question_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    topic TEXT,
    name TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 問題セットと問題の関連テーブル
CREATE TABLE question_set_items (
    set_id INTEGER,
    question_id TEXT,
    order_index INTEGER DEFAULT 0,
    PRIMARY KEY (set_id, question_id),
    FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_progress_user_subject ON user_progress(user_id, subject);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, completed_at);

-- 問題関連インデックス
CREATE INDEX idx_questions_subject_topic ON questions(subject, topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(active);
CREATE INDEX idx_question_sets_subject ON question_sets(subject, is_active);
CREATE INDEX idx_question_set_items_set ON question_set_items(set_id, order_index);

-- WebAuthn関連インデックス
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id, operation_type);

-- 初期データ（テスト用）
INSERT INTO users (email, username, password_hash) VALUES 
('test@example.com', 'testuser', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');
-- パスワード: secret123