-- Initial schema for TestApp with D1
-- Migration 001: Create core tables

-- Users table for authentication and profile management
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Subjects table for organizing questions by subject
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- 'math', 'english', 'chemistry', etc.
    name TEXT NOT NULL, -- '数学', '英語', '化学', etc.
    description TEXT,
    icon TEXT, -- emoji or icon identifier
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Question sets table to replace the file-based approach
CREATE TABLE question_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    title TEXT,
    version INTEGER DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Individual questions table
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_set_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_data TEXT, -- JSON data for complex question structures
    correct_answer TEXT,
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_set_id) REFERENCES question_sets(id)
);

-- Audio files table to track uploaded audio files
CREATE TABLE audio_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    original_name TEXT NOT NULL,
    r2_key TEXT NOT NULL, -- R2 storage key
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_question_sets_subject ON question_sets(subject_id);
CREATE INDEX idx_questions_set ON questions(question_set_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_audio_files_uploaded_by ON audio_files(uploaded_by);

-- Insert default subjects
INSERT INTO subjects (code, name, description, icon) VALUES
('english', '英語', '語彙・文法・読解・リスニング', '📝'),
('chemistry', '化学', '基礎化学・反応式・計算', '🧪'),
('math', '数学', '代数・図形・確率', '➗'),
('physics', '物理', '力学・波動・電磁気', '🔭'),
('japanese', '日本語', '現代文・古文・漢文', '🇯🇵'),
('information', '情報', 'SC対策 / 共通テスト', '💻'),
('law', '法学', '民法 / 行政法 ほか', '⚖️'),
('minigame', 'ミニゲーム', '将棋 / オセロ / チェス', '🎮');

-- Insert default admin user (password should be changed)
INSERT INTO users (username, email, password_hash, display_name, is_admin) VALUES
('admin', 'admin@testapp.local', '$2a$12$placeholder_hash', 'Administrator', TRUE);