-- 問題評価・コメントシステム用のテーブル作成SQL
-- 実行コマンド: npx wrangler d1 execute learning-notebook-db --remote --file=./sql/create_question_ratings.sql

-- 評価・コメントテーブル
CREATE TABLE IF NOT EXISTS question_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT datetime('now'),
    updated_at TEXT DEFAULT datetime('now'),
    FOREIGN KEY (user_id) REFERENCES users_v2(username),
    UNIQUE(question_id, user_id)
);

-- 評価統計用ビュー（パフォーマンス向上のため）
CREATE VIEW IF NOT EXISTS question_rating_stats AS
SELECT
    question_id,
    COUNT(*) as rating_count,
    AVG(rating) as average_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating,
    GROUP_CONCAT(rating) as all_ratings
FROM question_ratings
GROUP BY question_id;

-- ユーザー評価履歴用ビュー
CREATE VIEW IF NOT EXISTS user_rating_history AS
SELECT
    r.*,
    u.display_name,
    u.avatar_type,
    u.avatar_value
FROM question_ratings r
JOIN users_v2 u ON r.user_id = u.username
ORDER BY r.created_at DESC;