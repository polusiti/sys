CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_study_records_user ON study_records(user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_session ON study_records(session_id);
CREATE INDEX IF NOT EXISTS idx_study_records_correct ON study_records(user_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user ON wrong_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_subject ON wrong_answers(subject, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_mastered ON wrong_answers(user_id, mastered);
CREATE INDEX IF NOT EXISTS idx_study_stats_user ON study_stats(user_id);
