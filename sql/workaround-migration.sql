-- ============================================
-- WORKAROUND: 新しいテーブルを作成してアプリケーションを切り替え
-- 外部キー制約を回避する実用的な方法
-- ============================================

-- Step 1: 新しいユーザーテーブルを作成（emailをNULL許可）
CREATE TABLE users_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT NULL, -- NULLを許可
    password_hash TEXT,
    display_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0,
    inquiry_number TEXT DEFAULT NULL,
    passkey_credential_id TEXT,
    passkey_public_key TEXT,
    passkey_sign_count INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT 0,
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

-- Step 2: 必要なインデックスを作成
CREATE INDEX IF NOT EXISTS idx_users_v2_username ON users_v2(username);
CREATE INDEX IF NOT EXISTS idx_users_v2_email ON users_v2(email);
CREATE INDEX IF NOT EXISTS idx_users_v2_display_name ON users_v2(display_name);

-- Step 3: 既存ユーザーデータをマイグレーション
INSERT INTO users_v2 (
    id, username, email, password_hash, display_name,
    created_at, last_login, login_count, inquiry_number,
    passkey_credential_id, passkey_public_key, passkey_sign_count,
    email_verified, verification_code, verification_expires,
    avatar_type, avatar_value, bio, goal, study_streak, total_study_time,
    secret_question, secret_answer_hash
)
SELECT
    id, username, email, password_hash, display_name,
    created_at, last_login, login_count, inquiry_number,
    passkey_credential_id, passkey_public_key, passkey_sign_count,
    email_verified, verification_code, verification_expires,
    avatar_type, avatar_value, bio, goal, study_streak, total_study_time,
    secret_question, secret_answer_hash
FROM users;

-- Step 4: マイグレーション結果を確認
SELECT 'users_original' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'users_v2' as table_name, COUNT(*) as count FROM users_v2;

-- Step 5: テストデータを挿入して動作確認
INSERT INTO users_v2 (username, display_name, email)
VALUES ('workaround-test', 'Workaround Test', NULL)
ON CONFLICT(username) DO NOTHING;

-- Step 6: テストデータを削除
DELETE FROM users_v2 WHERE username = 'workaround-test';

-- Step 7: 新しいテーブルの構造を確認
SELECT PRAGMA table_info(users_v2) WHERE name='email';

SELECT '✅ Workaround migration completed - users_v2 table created' as result;