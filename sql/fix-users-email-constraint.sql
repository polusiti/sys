-- ============================================
-- Fix users.email NOT NULL constraint issue
-- ============================================

-- Step 1: Check current schema
.schema users

-- Step 2: Create new users table with proper email handling
CREATE TABLE users_fixed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT NULL, -- Allow NULL for email
    password_hash TEXT,
    display_name TEXT NOT NULL,
    secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？',
    secret_answer_hash TEXT,
    email_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0,
    passkey_credential_id TEXT, -- For passkey authentication
    passkey_public_key TEXT,   -- For passkey authentication
    inquiry_number TEXT DEFAULT NULL -- For recovery system
);

-- Step 3: Migrate existing data
INSERT INTO users_fixed (
    id, username, email, password_hash, display_name,
    secret_question, secret_answer_hash, email_verified,
    created_at, last_login, login_count
)
SELECT
    id, username,
    CASE
        WHEN email IS NULL OR email = '' THEN username || '@secure.learning-notebook.local'
        ELSE email
    END as email,
    password_hash, display_name,
    secret_question, secret_answer_hash, email_verified,
    created_at, last_login, login_count
FROM users;

-- Step 4: Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_fixed RENAME TO users;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_passkey_credential_id ON users(passkey_credential_id);

-- Step 6: Verify the schema
.schema users

-- Step 7: Test insertion with NULL email
INSERT INTO users (username, display_name, email)
VALUES ('test_user', 'Test User', NULL)
ON CONFLICT(username) DO NOTHING;

SELECT '✅ Email constraint fix completed!' as result;

-- Clean up test data
DELETE FROM users WHERE username = 'test_user';