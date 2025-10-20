-- ============================================
-- 秘密の質問システム実装
-- リカバリーシステムをシンプルで安全な手動対応に変更
-- ============================================

-- 1. users テーブルに秘密の質問フィールドを追加
ALTER TABLE users ADD COLUMN secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？';
ALTER TABLE users ADD COLUMN secret_answer_hash TEXT;

-- 2. inquiry_number を削除（不要になったため）
-- 注意: SQLiteでは ALTER TABLE DROP COLUMN が制限されているため、
-- 新しいテーブルを作成して移行する必要があります

-- 既存データを保持しながらテーブルを再作成
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？',
    secret_answer_hash TEXT,
    email_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0
);

-- データ移行
INSERT INTO users_new (id, username, email, password_hash, display_name, email_verified, created_at, last_login, login_count)
SELECT id, username, email, password_hash, display_name, email_verified, created_at, last_login, login_count
FROM users;

-- 古いテーブルを削除
DROP TABLE users;

-- 新しいテーブルをリネーム
ALTER TABLE users_new RENAME TO users;

-- 3. リカバリー要求記録テーブル（管理者が確認するため）
CREATE TABLE IF NOT EXISTS recovery_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    secret_answer_provided TEXT NOT NULL,
    contact_info TEXT,
    requested_at TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    admin_note TEXT,
    processed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_recovery_requests_status ON recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_recovery_requests_username ON recovery_requests(username);

-- ============================================
-- マイグレーション完了
-- ============================================

SELECT '✅ Secret question system migration completed!' as result;
