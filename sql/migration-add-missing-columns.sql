-- ============================================
-- 欠けているカラムの追加とインデックス作成
-- ============================================

-- user_sessionsテーブルにlast_used_atカラムを追加
ALTER TABLE user_sessions ADD COLUMN last_used_at TEXT;

-- usersテーブルの制約とインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_inquiry_number ON users(inquiry_number);

-- user_sessionsテーブルの制約とインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires ON user_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_used ON user_sessions(last_used_at);

-- webauthn_challengesテーブルの制約とインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_operation_type ON webauthn_challenges(operation_type);

-- webauthn_credentialsテーブルのインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);

-- study_sessionsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started ON study_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_active ON study_sessions(user_id, ended_at);

-- study_recordsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_study_records_user_subject ON study_records(user_id, subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_study_records_session ON study_records(session_id);
CREATE INDEX IF NOT EXISTS idx_study_records_created ON study_records(created_at DESC);

-- study_statsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_study_stats_user_subject ON study_stats(user_id, subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_study_stats_last_studied ON study_stats(last_studied_at DESC);

-- wrong_answersテーブルの制約とインデックス
-- 既存の重複をクリーンアップ
DELETE FROM wrong_answers
WHERE id NOT IN (
    SELECT MAX(id)
    FROM wrong_answers
    GROUP BY user_id, subject, difficulty_level, question_text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wrong_answers_user_subject_question ON wrong_answers(user_id, subject, difficulty_level, question_text);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user_subject ON wrong_answers(user_id, subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_last_wrong ON wrong_answers(last_wrong_at DESC);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_mastered ON wrong_answers(mastered, user_id);

-- note_questionsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_note_questions_subject_level ON note_questions(subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_note_questions_active ON note_questions(is_deleted, subject);
CREATE INDEX IF NOT EXISTS idx_note_questions_created ON note_questions(created_at DESC);

-- 統計情報更新
ANALYZE;