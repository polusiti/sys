-- Grammar examples for RAG functionality
CREATE TABLE IF NOT EXISTS grammar_examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_sentence TEXT NOT NULL,
  corrected_sentence TEXT NOT NULL,
  explanation TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert common grammar examples
INSERT OR IGNORE INTO grammar_examples (original_sentence, corrected_sentence, explanation, category) VALUES
('She go to school every day.', 'She goes to school every day.', 'Third person singular present tense requires -es ending for verbs like go, do, have.', 'grammar'),
('I are a student.', 'I am a student.', 'First person singular uses "am", not "are".', 'grammar'),
('He dont like apples.', 'He doesn''t like apples.', 'Third person singular requires "doesn''t" (does not) for negative sentences.', 'grammar'),
('They is playing outside.', 'They are playing outside.', 'Third person plural uses "are", not "is".', 'grammar'),
('I have seen that movie yesterday.', 'I saw that movie yesterday.', 'For completed actions at a specific past time, use simple past, not present perfect.', 'grammar'),
('The cat sleep on the sofa.', 'The cat sleeps on the sofa.', 'Third person singular present tense requires -s ending.', 'grammar'),
('We was happy to see you.', 'We were happy to see you.', 'First person plural past tense uses "were", not "was".', 'grammar'),
('She can plays the piano well.', 'She can play the piano well.', 'Modal verbs like "can" are followed by base form of the verb, not -s form.', 'grammar'),
('There is many books on the table.', 'There are many books on the table.', 'With plural subjects, use "there are" instead of "there is".', 'grammar'),
('I am study English now.', 'I am studying English now.', 'Present continuous tense uses "am + verb-ing" for ongoing actions.', 'grammar');