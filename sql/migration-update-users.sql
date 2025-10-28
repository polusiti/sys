-- Learning Notebook User Table Schema Update
-- Add Passkey authentication support

-- ============================================
-- ADD PASSKEY AUTHENTICATION COLUMNS
-- ============================================
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN inquiry_number TEXT; -- 6桁の認証番号
ALTER TABLE users ADD COLUMN passkey_credential_id TEXT;
ALTER TABLE users ADD COLUMN passkey_public_key TEXT;
ALTER TABLE users ADD COLUMN passkey_sign_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_code TEXT;
ALTER TABLE users ADD COLUMN verification_expires TEXT;

-- ============================================
-- ADD PROFILE COLUMNS
-- ============================================
ALTER TABLE users ADD COLUMN avatar_type TEXT DEFAULT 'color';
ALTER TABLE users ADD COLUMN avatar_value TEXT DEFAULT '#3498db';
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN goal TEXT;
ALTER TABLE users ADD COLUMN study_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_study_time INTEGER DEFAULT 0; -- 分単位

-- ============================================
-- UPDATE EXISTING USERS WITH DEFAULT VALUES
-- ============================================
UPDATE users SET display_name = username WHERE display_name IS NULL;
UPDATE users SET inquiry_number = '000000' WHERE inquiry_number IS NULL;
UPDATE users SET avatar_value = '#3498db' WHERE avatar_value IS NULL;

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_passkey ON users(passkey_credential_id);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_code, verification_expires);

-- ============================================
-- CREATE UPDATED USER VIEW
-- ============================================
CREATE VIEW IF NOT EXISTS users_view AS
SELECT
    id,
    email,
    username,
    display_name,
    avatar_type,
    avatar_value,
    bio,
    goal,
    study_streak,
    total_study_time,
    email_verified,
    created_at,
    last_login,
    login_count,
    -- Passkey info (exclude sensitive data)
    CASE
        WHEN passkey_credential_id IS NOT NULL THEN 1
        ELSE 0
    END as has_passkey
FROM users;