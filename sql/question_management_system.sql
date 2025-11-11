-- 拡張問題管理システム用テーブル定義
-- jsonplan.md統一フォーマット対応

-- 既存のquestionsテーブルを拡張
-- ALTER TABLEしてJSONplan.mdの統一フォーマットに対応

-- 新しい統一フォーマット対応のquestionsテーブル
-- 既存テーブルの互換性を維持しつつ、新しいフィールドを追加

-- questionsテーブル拡張
ALTER TABLE questions ADD COLUMN type TEXT DEFAULT 'multiple_choice'; -- multiple_choice, fill_in_blank, etc.
ALTER TABLE questions ADD COLUMN question_translation TEXT; -- 問題の日本語訳
ALTER TABLE questions ADD COLUMN explanation_simple TEXT; -- 平易な解説 (pl)
ALTER TABLE questions ADD COLUMN explanation_detailed TEXT; -- 詳細な解説 (sp)
ALTER TABLE questions ADD COLUMN grammar_point TEXT; -- 文法項目
ALTER TABLE questions ADD COLUMN media_audio TEXT; -- 音声URL
ALTER TABLE questions ADD COLUMN media_image TEXT; -- 画像URL
ALTER TABLE questions ADD COLUMN media_video TEXT; -- 動画URL
ALTER TABLE questions ADD COLUMN difficulty INTEGER DEFAULT 1; -- 1-5段階評価
ALTER TABLE questions ADD COLUMN created_by TEXT; -- 作成者
ALTER TABLE questions ADD COLUMN version INTEGER DEFAULT 1; -- バージョン管理
ALTER TABLE questions ADD COLUMN validation_status TEXT DEFAULT 'pending'; -- pending, approved, rejected

-- 新規：問題形式の選択肢を統一管理するテーブル
CREATE TABLE IF NOT EXISTS question_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    option_key TEXT NOT NULL, -- A, B, C, D or custom keys
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 新規：問題バリデーション履歴
CREATE TABLE IF NOT EXISTS question_validations (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    validator_id TEXT, -- admin user id
    validation_status TEXT, -- approved, rejected, needs_revision
    validation_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 新規：問題統計情報
CREATE TABLE IF NOT EXISTS question_statistics (
    question_id TEXT PRIMARY KEY,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    incorrect_attempts INTEGER DEFAULT 0,
    average_time_ms INTEGER DEFAULT 0,
    difficulty_rating REAL DEFAULT 0.0, -- ユーザー評価による難易度
    last_attempted TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 新規：問題カテゴリマスタ
CREATE TABLE IF NOT EXISTS question_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL, -- english, math, physics, etc.
    description TEXT,
    parent_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES question_categories(id)
);

-- 新規：問題カテゴリ関連付け
CREATE TABLE IF NOT EXISTS question_category_relations (
    question_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (question_id, category_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES question_categories(id) ON DELETE CASCADE
);

-- 新規：メディアファイル管理
CREATE TABLE IF NOT EXISTS question_media (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    media_type TEXT NOT NULL, -- audio, image, video
    media_url TEXT NOT NULL,
    media_size INTEGER,
    mime_type TEXT,
    file_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- デフォルトカテゴリの挿入
INSERT OR IGNORE INTO question_categories (id, name, subject, description) VALUES
('english_grammar', 'English Grammar', 'english', 'English grammar questions'),
('english_vocab', 'English Vocabulary', 'english', 'English vocabulary questions'),
('english_listening', 'English Listening', 'english', 'English listening comprehension'),
('english_reading', 'English Reading', 'english', 'English reading comprehension'),
('english_writing', 'English Writing', 'english', 'English writing and composition'),
('math_algebra', 'Mathematics Algebra', 'math', 'Algebra problems'),
('math_geometry', 'Mathematics Geometry', 'math', 'Geometry problems'),
('math_calculus', 'Mathematics Calculus', 'math', 'Calculus problems'),
('physics_mechanics', 'Physics Mechanics', 'physics', 'Classical mechanics'),
('physics_electromagnetism', 'Physics Electromagnetism', 'physics', 'Electromagnetism'),
('chemistry_organic', 'Chemistry Organic', 'chemistry', 'Organic chemistry'),
('chemistry_inorganic', 'Chemistry Inorganic', 'chemistry', 'Inorganic chemistry');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_questions_subject_type ON questions(subject, type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_validation ON questions(validation_status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
CREATE INDEX IF NOT EXISTS idx_question_stats_question_id ON question_statistics(question_id);
CREATE INDEX IF NOT EXISTS idx_question_media_question_id ON question_media(question_id);
CREATE INDEX IF NOT EXISTS idx_question_category_relations_question_id ON question_category_relations(question_id);
CREATE INDEX IF NOT EXISTS idx_question_category_relations_category_id ON question_category_relations(category_id);