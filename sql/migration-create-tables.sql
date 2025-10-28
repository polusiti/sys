-- Learning Notebook Database Schema Creation
-- Date: 2025-10-17

-- ============================================
-- CREATE QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    source TEXT DEFAULT 'learning-notebook',
    word TEXT,
    is_listening BOOLEAN DEFAULT 0,
    difficulty_level TEXT DEFAULT 'medium',
    mode TEXT,
    choices TEXT, -- JSON array
    media_urls TEXT, -- JSON array
    explanation TEXT,
    tags TEXT, -- JSON array
    active BOOLEAN DEFAULT 1,
    is_deleted BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- CREATE USER_PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    accuracy_percentage REAL DEFAULT 0,
    last_study_date TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, subject)
);

-- ============================================
-- CREATE STUDY_SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    session_date TEXT DEFAULT (datetime('now')),
    questions_attempted INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    session_duration INTEGER, -- seconds
    device_type TEXT, -- 'mobile', 'desktop', 'tablet'
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject, active);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source, subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_level, active);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_subject ON user_progress(subject);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);

-- ============================================
-- CREATE VIEWS FOR LEARNING-NOTEBOOK
-- ============================================
CREATE VIEW IF NOT EXISTS note_questions_view AS
SELECT
    id,
    subject,
    title,
    question_text,
    correct_answer,
    difficulty_level,
    choices,
    explanation,
    word,
    is_listening,
    tags,
    mode,
    media_urls
FROM questions
WHERE source = 'learning-notebook' AND active = 1 AND is_deleted = 0;

CREATE VIEW IF NOT EXISTS note_user_progress_view AS
SELECT
    up.user_id,
    u.username,
    up.subject,
    up.total_questions,
    up.correct_answers,
    up.accuracy_percentage,
    up.current_streak,
    up.best_streak,
    up.last_study_date,
    up.updated_at
FROM user_progress up
JOIN users u ON up.user_id = u.id;