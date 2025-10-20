-- ============================================
-- 秘密の質問システム実装（既存データ保持版）
-- ============================================

-- 1. users テーブルに秘密の質問フィールドを追加
ALTER TABLE users ADD COLUMN secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？';
ALTER TABLE users ADD COLUMN secret_answer_hash TEXT;

-- 注意: inquiry_number カラムは残します（既存データとの互換性のため）
-- 新規登録時は使用しませんが、既存ユーザーのデータは保持されます

-- 2. リカバリー要求記録テーブル（管理者が確認するため）
CREATE TABLE IF NOT EXISTS recovery_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    secret_answer_provided TEXT NOT NULL,
    contact_info TEXT,
    additional_info TEXT,
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
