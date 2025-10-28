-- ============================================
-- 学習履歴・復習機能のためのデータベース設計
-- ============================================

-- 1. 学習セッションテーブル
-- ユーザーがいつ、どの科目・レベルで勉強したかを記録
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,          -- 'english-listening', 'math', etc.
    difficulty_level TEXT NOT NULL,  -- 'listen_todai', 'math_1a', etc.
    started_at TEXT NOT NULL,        -- セッション開始時刻
    ended_at TEXT,                   -- セッション終了時刻
    total_questions INTEGER DEFAULT 0,
    correct_questions INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,  -- 学習時間（秒）
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. 問題回答記録テーブル
-- 各問題の回答を詳細に記録
CREATE TABLE IF NOT EXISTS study_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,              -- どのセッションでの回答か
    subject TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    question_id TEXT,                -- 問題のID（あれば）
    question_text TEXT,              -- 問題文
    user_answer TEXT,                -- ユーザーの回答
    correct_answer TEXT,             -- 正解
    is_correct INTEGER NOT NULL,     -- 0: 不正解, 1: 正解
    time_spent_seconds INTEGER,     -- 問題にかけた時間
    answered_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE SET NULL
);

-- 3. 間違えた問題テーブル（復習用）
-- 間違えた問題だけを抽出して管理
CREATE TABLE IF NOT EXISTS wrong_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    question_id TEXT,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,                 -- 解説
    wrong_count INTEGER DEFAULT 1,    -- 何回間違えたか
    last_wrong_at TEXT DEFAULT (datetime('now')),
    reviewed_at TEXT,                 -- 最後に復習した日時
    mastered INTEGER DEFAULT 0,       -- 0: 未習得, 1: 習得済み
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 学習統計テーブル（集計用）
-- 科目・レベルごとの累積統計
CREATE TABLE IF NOT EXISTS study_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_questions INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    last_studied_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, subject, difficulty_level),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_study_records_user ON study_records(user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_session ON study_records(session_id);
CREATE INDEX IF NOT EXISTS idx_study_records_correct ON study_records(user_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user ON wrong_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_subject ON wrong_answers(subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_mastered ON wrong_answers(user_id, mastered);
CREATE INDEX IF NOT EXISTS idx_study_stats_user ON study_stats(user_id);

-- ============================================
-- マイグレーション完了
-- ============================================

SELECT '✅ Study history and review system schema created!' as result;
