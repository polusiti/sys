-- Learning Notebook Migration: Add source field to existing schema
-- Date: 2025-10-16

-- ============================================
-- EXTEND EXISTING QUESTIONS TABLE
-- ============================================
-- Add source field to distinguish learning-notebook questions
ALTER TABLE questions ADD COLUMN source TEXT DEFAULT 'learning-notebook';
-- Possible values: 'learning-notebook', 'data-repo'

-- Add word field for vocabulary questions
ALTER TABLE questions ADD COLUMN word TEXT;

-- Add is_listening flag for listening questions
ALTER TABLE questions ADD COLUMN is_listening BOOLEAN DEFAULT 0;

-- ============================================
-- CREATE INDEX FOR LEARNING-NOTEBOOK QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_source_subject ON questions(source, subject, active);
CREATE INDEX IF NOT EXISTS idx_questions_source_difficulty ON questions(source, difficulty_level, active);

-- ============================================
-- EXTEND USER_PROGRESS TABLE
-- ============================================
-- The existing user_progress table structure already exists from Worker init

-- ============================================
-- CREATE VIEW FOR LEARNING-NOTEBOOK QUESTIONS
-- ============================================
CREATE VIEW IF NOT EXISTS note_questions_view AS
SELECT
    id,
    subject,
    title,
    difficulty_level,
    question_text,
    choices,
    correct_answer,
    explanation,
    word,
    is_listening,
    tags,
    mode,
    media_urls
FROM questions
WHERE source = 'learning-notebook' AND active = 1;

-- ============================================
-- CREATE VIEW FOR USER PROGRESS
-- ============================================
CREATE VIEW IF NOT EXISTS note_user_progress_view AS
SELECT
    user_id,
    subject,
    total_questions,
    correct_answers,
    ROUND((correct_answers * 100.0 / NULLIF(total_questions, 0)), 2) as accuracy,
    current_streak,
    best_streak,
    updated_at
FROM user_progress;
