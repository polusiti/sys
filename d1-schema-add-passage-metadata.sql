-- パッセージ全体のメタデータ（スクリプト・解説）を保存するカラムを追加
-- question_order=1 の問題にのみ保存される

ALTER TABLE note_questions ADD COLUMN passage_script TEXT;
ALTER TABLE note_questions ADD COLUMN passage_explanation TEXT;
