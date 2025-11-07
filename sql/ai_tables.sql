-- 英作文添削テーブル
CREATE TABLE IF NOT EXISTS english_compositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    original_text TEXT NOT NULL,
    corrected_text TEXT,
    error_analysis TEXT,
    suggestions TEXT,
    sgif_category TEXT,
    confidence_score REAL,
    processing_time INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 音声ファイルテーブル
CREATE TABLE IF NOT EXISTS audio_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    question_id TEXT,
    text_content TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    file_size INTEGER,
    duration INTEGER,
    generation_model TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 学習進捗トラッキングテーブル
CREATE TABLE IF NOT EXISTS learning_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    question_id TEXT,
    attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    average_time INTEGER,
    last_attempt TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 問題生成履歴テーブル
CREATE TABLE IF NOT EXISTS generated_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    question_type TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    prompt_template TEXT,
    generated_content TEXT,
    quality_score REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_english_compositions_user_id ON english_compositions(user_id);
CREATE INDEX idx_english_compositions_created_at ON english_compositions(created_at);
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_subject ON audio_files(subject);
CREATE INDEX idx_learning_progress_user_subject ON learning_progress(user_id, subject);
CREATE INDEX idx_generated_questions_user_subject ON generated_questions(user_id, subject);