-- Fix note_questions view for API compatibility
-- The API expects a note_questions view that references our questions table

-- ============================================
-- CREATE/DROP note_questions VIEW
-- ============================================
DROP VIEW IF EXISTS note_questions;

CREATE VIEW note_questions AS
SELECT
    id,
    subject,
    title,
    question_text,
    correct_answer,
    source,
    word,
    is_listening,
    difficulty_level,
    mode,
    choices,
    media_urls,
    explanation,
    tags,
    active,
    is_deleted,
    created_at,
    updated_at
FROM questions
WHERE source = 'learning-notebook' AND active = 1 AND is_deleted = 0;