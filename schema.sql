-- Knowledge base for English grammar correction
CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  replacement TEXT NOT NULL,
  explanation TEXT NOT NULL,
  category TEXT,
  severity INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for pattern matching
CREATE INDEX idx_pattern ON knowledge_base(pattern);

-- Sample data
INSERT OR IGNORE INTO knowledge_base (pattern, replacement, explanation, category) VALUES
('dont', "don't", 'Use apostrophe in contractions', 'contractions'),
('wont', "won't", 'Use apostrophe in contractions', 'contractions'),
('cant', "can't", 'Use apostrophe in contractions', 'contractions'),
('couldnt', "couldn't", 'Use apostrophe in contractions', 'contractions'),
('wouldnt', "wouldn't", 'Use apostrophe in contractions', 'contractions'),
('isnt', "isn't", 'Use apostrophe in contractions', 'contractions'),
('arent', "aren't", 'Use apostrophe in contractions', 'contractions'),
('wasnt', "wasn't", 'Use apostrophe in contractions', 'contractions'),
('werent', "weren't", 'Use apostrophe in contractions', 'contractions'),
('hasnt', "hasn't", 'Use apostrophe in contractions', 'contractions'),
('havent', "haven't", 'Use apostrophe in contractions', 'contractions'),
('doesnt', "doesn't", 'Use apostrophe in contractions', 'contractions'),
('dont', "don't", 'Use apostrophe in contractions', 'contractions'),
('didnt', "didn't", 'Use apostrophe in contractions', 'contractions'),
('your welcome', "you're welcome", 'Use "you''re" (you are) instead of "your"', 'grammar'),
('its a', "it's a", 'Use "it''s" (it is) instead of "its"', 'grammar'),
('theyre', "they're", 'Use "they''re" (they are) instead of "their"', 'grammar'),
('their is', "there is", 'Use "there" instead of "their" for existence', 'grammar'),
('whats', "what's", 'Use apostrophe in contractions', 'contractions'),
('thats', "that's", 'Use apostrophe in contractions', 'contractions'),
('whos', "who's", 'Use "who''s" (who is) instead of "whose"', 'grammar');