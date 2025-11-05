-- Simple workaround migration without complex statements
CREATE TABLE users_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT NULL,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0,
    inquiry_number TEXT DEFAULT NULL,
    passkey_credential_id TEXT,
    passkey_public_key TEXT,
    passkey_sign_count INTEGER DEFAULT 0,
    email_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    verification_expires TEXT,
    avatar_type TEXT DEFAULT 'color',
    avatar_value TEXT DEFAULT '#3498db',
    bio TEXT,
    goal TEXT,
    study_streak INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？',
    secret_answer_hash TEXT
);

-- Migrate existing data
INSERT INTO users_v2 (id, username, email, password_hash, display_name, created_at, last_login, login_count, inquiry_number, passkey_credential_id, passkey_public_key, passkey_sign_count, email_verified, verification_code, verification_expires, avatar_type, avatar_value, bio, goal, study_streak, total_study_time, secret_question, secret_answer_hash)
SELECT id, username, email, password_hash, display_name, created_at, last_login, login_count, inquiry_number, passkey_credential_id, passkey_public_key, passkey_sign_count, email_verified, verification_code, verification_expires, avatar_type, avatar_value, bio, goal, study_streak, total_study_time, secret_question, secret_answer_hash
FROM users;

-- Test the migration
SELECT COUNT(*) as migrated_rows FROM users_v2;

SELECT 'Migration completed' as status;