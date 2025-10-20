-- Learning Notebook Progress Tracking Enhancement
-- Add comprehensive progress tracking functionality

-- ============================================
-- CREATE PROGRESS TRIGGERS AND FUNCTIONS
-- ============================================

-- Update user progress when session is completed
CREATE TRIGGER IF NOT EXISTS update_user_progress_on_session
AFTER INSERT ON study_sessions
BEGIN
    INSERT OR REPLACE INTO user_progress (
        user_id,
        subject,
        total_questions,
        correct_answers,
        accuracy_percentage,
        current_streak,
        last_study_date,
        updated_at
    )
    SELECT
        NEW.user_id,
        NEW.subject,
        COALESCE(SUM(total_questions), 0),
        COALESCE(SUM(score), 0),
        CASE
            WHEN SUM(total_questions) > 0
            THEN ROUND((SUM(score) * 100.0) / SUM(total_questions), 2)
            ELSE 0
        END,
        COALESCE(MAX(current_streak), 0),
        MAX(completed_at),
        datetime('now')
    FROM (
        SELECT
            user_id,
            subject,
            total_questions,
            score,
            -- Calculate streak logic (simplified)
            CASE
                WHEN accuracy >= 80.0 THEN 1
                ELSE 0
            END as current_streak,
            completed_at
        FROM study_sessions
        WHERE user_id = NEW.user_id AND subject = NEW.subject
        ORDER BY completed_at DESC
        LIMIT 10
    ) recent_sessions;
END;

-- ============================================
-- INSERT SAMPLE PROGRESS DATA FOR TESTING
-- ============================================

-- Add sample progress for existing users
INSERT OR IGNORE INTO user_progress (
    user_id,
    subject,
    total_questions,
    correct_answers,
    accuracy_percentage,
    current_streak,
    best_streak,
    last_study_date,
    updated_at
) VALUES
(1, 'english-vocabulary', 25, 20, 80.0, 5, 5, datetime('now', '-1 day'), datetime('now')),
(1, 'math', 15, 12, 80.0, 3, 3, datetime('now', '-2 days'), datetime('now')),
(2, 'english-grammar', 10, 7, 70.0, 2, 2, datetime('now', '-3 days'), datetime('now'));

-- Add sample study sessions
INSERT OR IGNORE INTO study_sessions (
    user_id,
    subject,
    score,
    total_questions,
    accuracy,
    duration_minutes,
    completed_at
) VALUES
(1, 'english-vocabulary', 5, 5, 100.0, 10, datetime('now', '-1 day')),
(1, 'english-vocabulary', 4, 5, 80.0, 12, datetime('now', '-1 day')),
(1, 'math', 3, 4, 75.0, 8, datetime('now', '-2 days')),
(2, 'english-grammar', 3, 5, 60.0, 15, datetime('now', '-3 days'));

-- ============================================
-- CREATE PROGRESS VIEWS
-- ============================================

-- User progress summary view
CREATE VIEW IF NOT EXISTS user_progress_summary AS
SELECT
    u.id as user_id,
    u.username,
    u.display_name,
    COUNT(up.subject) as subjects_studied,
    SUM(up.total_questions) as total_questions_attempted,
    SUM(up.correct_answers) as total_correct_answers,
    CASE
        WHEN SUM(up.total_questions) > 0
        THEN ROUND((SUM(up.correct_answers) * 100.0) / SUM(up.total_questions), 2)
        ELSE 0
    END as overall_accuracy,
    MAX(up.current_streak) as best_subject_streak,
    MAX(up.last_study_date) as last_study_date
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
GROUP BY u.id, u.username, u.display_name;

-- Subject-specific progress view
CREATE VIEW IF NOT EXISTS subject_progress_detail AS
SELECT
    u.id as user_id,
    u.username,
    up.subject,
    up.total_questions,
    up.correct_answers,
    up.accuracy_percentage,
    up.current_streak,
    up.best_streak,
    up.last_study_date,
    q_count.available_questions,
    ROUND((up.total_questions * 100.0) / q_count.available_questions, 2) as completion_percentage
FROM users u
JOIN user_progress up ON u.id = up.user_id
LEFT JOIN (
    SELECT subject, COUNT(*) as available_questions
    FROM questions
    WHERE source = 'learning-notebook' AND active = 1
    GROUP BY subject
) q_count ON up.subject = q_count.subject;

-- ============================================
-- CREATE HELPER FUNCTIONS (via views)
-- ============================================

-- User statistics view
CREATE VIEW IF NOT EXISTS user_statistics AS
SELECT
    u.id as user_id,
    u.username,
    u.display_name,
    u.study_streak,
    u.total_study_time,
    COUNT(DISTINCT ss.subject) as sessions_count,
    COUNT(ss.id) as total_sessions,
    AVG(ss.accuracy) as avg_session_accuracy,
    MAX(ss.accuracy) as best_session_accuracy,
    SUM(ss.duration_minutes) as total_study_minutes,
    ROUND(SUM(ss.duration_minutes) / 60.0, 1) as total_study_hours
FROM users u
LEFT JOIN study_sessions ss ON u.id = ss.user_id
GROUP BY u.id, u.username, u.display_name, u.study_streak, u.total_study_time;