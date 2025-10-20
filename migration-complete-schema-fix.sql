-- Learning Notebook Complete Database Schema Fix
-- This script fixes all database schema issues and creates required tables

-- ============================================
-- STEP 1: Fix existing users table structure
-- ============================================

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN inquiry_number TEXT;
ALTER TABLE users ADD COLUMN passkey_credential_id TEXT;
ALTER TABLE users ADD COLUMN passkey_public_key TEXT;
ALTER TABLE users ADD COLUMN passkey_sign_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_code TEXT;
ALTER TABLE users ADD COLUMN verification_expires TEXT;
ALTER TABLE users ADD COLUMN avatar_type TEXT DEFAULT 'color';
ALTER TABLE users ADD COLUMN avatar_value TEXT DEFAULT '#3498db';
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN goal TEXT;
ALTER TABLE users ADD COLUMN study_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_study_time INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login TEXT;
ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;

-- Update existing users with default values
UPDATE users SET
    display_name = COALESCE(display_name, username),
    inquiry_number = COALESCE(inquiry_number, '000000'),
    avatar_value = COALESCE(avatar_value, '#3498db'),
    email_verified = COALESCE(email_verified, 0),
    study_streak = COALESCE(study_streak, 0),
    total_study_time = COALESCE(total_study_time, 0),
    login_count = COALESCE(login_count, 0)
WHERE display_name IS NULL OR inquiry_number IS NULL OR login_count IS NULL;

-- ============================================
-- STEP 2: Create WebAuthn tables
-- ============================================

-- WebAuthn challenges table
CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('registration', 'authentication')),
    used BOOLEAN DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WebAuthn credentials table
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_type TEXT DEFAULT 'unknown',
    authenticator_attachment TEXT DEFAULT 'unknown',
    last_used TEXT,
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- STEP 3: Create progress tracking tables
-- ============================================

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, subject)
);

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User sessions table (for JWT tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    data TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- STEP 4: Create indexes for performance
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_inquiry_number ON users(inquiry_number);
CREATE INDEX IF NOT EXISTS idx_users_passkey ON users(passkey_credential_id);

-- WebAuthn indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON webauthn_challenges(user_id, operation_type, used);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_id ON webauthn_credentials(credential_id);

-- Progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_subject ON user_progress(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON study_sessions(completed_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- STEP 5: Verify note_questions table exists
-- ============================================

-- Create note_questions table if it doesn't exist (for safety)
CREATE TABLE IF NOT EXISTS note_questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    title TEXT,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    source TEXT DEFAULT 'learning-notebook',
    word TEXT,
    is_listening INTEGER DEFAULT 0,
    difficulty_level TEXT DEFAULT 'medium',
    mode TEXT,
    choices TEXT, -- JSON
    media_urls TEXT, -- JSON
    explanation TEXT,
    tags TEXT, -- JSON
    active INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Note questions indexes
CREATE INDEX IF NOT EXISTS idx_note_questions_subject ON note_questions(subject, is_deleted);
CREATE INDEX IF NOT EXISTS idx_note_questions_difficulty ON note_questions(difficulty_level, is_deleted);
CREATE INDEX IF NOT EXISTS idx_note_questions_source ON note_questions(source, is_deleted);

-- ============================================
-- STEP 6: Create view for user information
-- ============================================

CREATE VIEW IF NOT EXISTS users_view AS
SELECT
    u.id,
    u.username,
    u.email,
    u.display_name,
    u.inquiry_number,
    u.avatar_type,
    u.avatar_value,
    u.bio,
    u.goal,
    u.study_streak,
    u.total_study_time,
    u.email_verified,
    u.last_login,
    u.login_count,
    u.created_at,
    -- WebAuthn status
    CASE
        WHEN wc.credential_id IS NOT NULL THEN 1
        ELSE 0
    END as has_passkey,
    -- Progress summary
    (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id) as subjects_studied,
    (SELECT SUM(up.total_questions) FROM user_progress up WHERE up.user_id = u.id) as total_questions_answered
FROM users u
LEFT JOIN webauthn_credentials wc ON u.id = wc.user_id
WHERE u.id IS NOT NULL;

-- ============================================
-- STEP 7: Clean up old data if needed
-- ============================================

-- Clean up expired sessions
DELETE FROM user_sessions WHERE expires_at < datetime('now');

-- Clean up expired challenges
DELETE FROM webauthn_challenges WHERE expires_at < datetime('now') OR used = 1;

-- ============================================
-- STEP 8: Verification queries
-- ============================================

-- Check that all required tables exist
.tables

-- Check users table structure
.schema users

-- Check note_questions count
SELECT COUNT(*) as total_questions FROM note_questions WHERE is_deleted = 0;

-- Check users count
SELECT COUNT(*) as total_users FROM users;

-- Sample data verification
SELECT 'Database schema migration completed successfully!' as status;