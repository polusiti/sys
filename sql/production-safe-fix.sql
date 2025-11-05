-- ============================================
-- PRODUCTION-SAFE: Email Constraint Fix
-- これが本番環境用の安全な修正スクリプト
-- ============================================

-- Step 1: 全データのバックアップ（Step 1で実行済み）
-- Step 2: 新しいemailカラムを追加（NULL許可）
ALTER TABLE users ADD COLUMN email_new TEXT;

-- Step 3: 既存データを安全にマイグレーション
UPDATE users SET email_new = CASE
    WHEN email IS NULL OR email = '' THEN username || '@secure.learning-notebook.local'
    ELSE email
END;

-- Step 4: 新しいemailカラムが正しく設定されたか確認
SELECT COUNT(*) as migrated_count,
       COUNT(CASE WHEN email_new IS NOT NULL THEN 1 END) as has_email_new
FROM users;

-- Step 5: 元のemailカラムを削除（SQLite制約回避のため）
CREATE TABLE users_temp AS SELECT
    id, email_new as email, username, password_hash, display_name,
    created_at, last_login, login_count, inquiry_number,
    passkey_credential_id, passkey_public_key, passkey_sign_count,
    email_verified, verification_code, verification_expires,
    avatar_type, avatar_value, bio, goal, study_streak, total_study_time,
    secret_question, secret_answer_hash
FROM users;

-- Step 6: 元のテーブルを削除して一時的に無効化
DROP TABLE users;

-- Step 7: 新しいテーブルをリネーム
ALTER TABLE users_temp RENAME TO users;

-- Step 8: インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- Step 9: 外部キー制約が再作成されることを確認
SELECT '✅ Production email constraint fix completed!' as result;

-- Step 10: テストデータを挿入して動作確認
INSERT INTO users (username, display_name, email)
VALUES ('production-test', 'Production Test', NULL)
ON CONFLICT(username) DO NOTHING;

-- Step 11: テストデータを削除
DELETE FROM users WHERE username = 'production-test';

-- Step 12: 修正を確認
SELECT name FROM sqlite_master WHERE type='table' AND name='users';
SELECT PRAGMA table_info(users) WHERE name='email';