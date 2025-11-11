-- Add explanation and options fields to questions table
-- Date: 2025-11-12

-- Add explanation column if not exists
ALTER TABLE questions ADD COLUMN explanation TEXT;

-- Add options column for multiple choice questions (JSON array)
ALTER TABLE questions ADD COLUMN options TEXT;

-- Add translation column for bilingual support (JSON object)
ALTER TABLE questions ADD COLUMN translation TEXT;

-- Update existing records to have empty JSON arrays/objects where needed
UPDATE questions SET options = '[]' WHERE options IS NULL AND choices IS NOT NULL;
UPDATE questions SET translation = '{}' WHERE translation IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_explanation ON questions(explanation);

SELECT 'Migration completed: explanation, options, translation columns added' as status;
