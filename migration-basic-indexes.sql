-- ============================================
-- 基本的なインデックスのみ作成（安全版）
-- ============================================

-- user_sessionsテーブルにlast_used_atカラムを追加
ALTER TABLE user_sessions ADD COLUMN last_used_at TEXT;

-- usersテーブルの制約とインデックス（重複解消済み）
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

-- webauthn_credentialsテーブルのインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);

-- study_sessionsテーブルのインデックス（既存カラム）
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_completed ON study_sessions(user_id, completed_at DESC);

-- wrong_answersテーブルのインデックス（既存カラム）
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user_subject ON wrong_answers(user_id, subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_last_wrong ON wrong_answers(last_wrong_at DESC);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_mastered ON wrong_answers(mastered, user_id);

-- 統計情報更新
ANALYZE;