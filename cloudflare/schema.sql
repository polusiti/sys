-- TestApp Authentication Database Schema
-- Cloudflare D1 (SQLite)

-- ユーザーテーブル
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
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

-- インデックス作成
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_progress_user_subject ON user_progress(user_id, subject);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, completed_at);

-- 初期データ（テスト用）
INSERT INTO users (email, username, password_hash) VALUES 
('test@example.com', 'testuser', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');
-- パスワード: secret123