-- 東大リスニング形式対応: パッセージID と 設問順序 を追加
-- 1つの音声ファイル (passage_id) に対して複数の設問 (question_order) を紐付け

ALTER TABLE note_questions ADD COLUMN passage_id TEXT;
ALTER TABLE note_questions ADD COLUMN question_order INTEGER;

-- インデックス追加（パッセージ単位での取得を高速化）
CREATE INDEX IF NOT EXISTS idx_note_questions_passage_id ON note_questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_note_questions_passage_order ON note_questions(passage_id, question_order);
