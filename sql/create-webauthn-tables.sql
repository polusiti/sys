-- WebAuthn tables for users_v2
-- Create challenges table for users_v2
CREATE TABLE IF NOT EXISTS webauthn_challenges_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('registration', 'authentication')),
    used BOOLEAN DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_v2(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_v2_user ON webauthn_challenges_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_v2_expires ON webauthn_challenges_v2(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_v2_challenge ON webauthn_challenges_v2(challenge);

-- Create sessions table for WebAuthn login sessions
CREATE TABLE IF NOT EXISTS webauthn_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_v2(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webauthn_sessions_user ON webauthn_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_sessions_expires ON webauthn_sessions(expires_at);

SELECT '✅ WebAuthn tables for users_v2 created successfully' as result;