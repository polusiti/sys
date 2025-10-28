-- Sync all questions from questions table to note_questions table
-- This will ensure API can access all 80 questions

-- Clear existing note_questions data
DELETE FROM note_questions;

-- Insert all learning-notebook questions into note_questions
INSERT INTO note_questions (
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
)
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_note_questions_subject ON note_questions(subject, is_deleted);
CREATE INDEX IF NOT EXISTS idx_note_questions_difficulty ON note_questions(difficulty_level, is_deleted);