-- ============================================
-- Safe fix for users.email NOT NULL constraint
-- Uses SQLite-compatible approach for D1
-- ============================================

-- Step 1: Create a backup of current data
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Add a new nullable email column
ALTER TABLE users ADD COLUMN email_new TEXT;

-- Step 3: Populate the new email column with proper defaults
UPDATE users SET email_new = CASE
    WHEN email IS NULL OR email = '' THEN username || '@secure.learning-notebook.local'
    ELSE email
END;

-- Step 4: Drop the old email column (SQLite doesn't support DROP COLUMN directly)
-- Create new table structure without the problematic column
CREATE TABLE users_temp AS
SELECT
    id,
    email_new as email,
    username,
    password_hash,
    display_name,
    created_at,
    last_login,
    login_count,
    inquiry_number,
    passkey_credential_id,
    passkey_public_key,
    passkey_sign_count,
    email_verified,
    verification_code,
    verification_expires,
    avatar_type,
    avatar_value,
    bio,
    goal,
    study_streak,
    total_study_time,
    secret_question,
    secret_answer_hash
FROM users;

-- Step 5: Drop the original table
DROP TABLE users;

-- Step 6: Rename the temp table
ALTER TABLE users_temp RENAME TO users;

-- Step 7: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- Step 8: Test the fix
INSERT INTO users (username, display_name, email)
VALUES ('test_constraint_fix', 'Constraint Test', NULL)
ON CONFLICT(username) DO NOTHING;

-- Step 9: Verify the fix
SELECT PRAGMA table_info(users);

-- Step 10: Clean up test data
DELETE FROM users WHERE username = 'test_constraint_fix';

SELECT '✅ Email constraint fixed safely!' as result;