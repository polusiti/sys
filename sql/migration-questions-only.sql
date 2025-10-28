-- Learning Notebook Questions Table Creation
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
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject, active);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source, subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_level, active);

-- ============================================
-- CREATE VIEW FOR LEARNING-NOTEBOOK QUESTIONS
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