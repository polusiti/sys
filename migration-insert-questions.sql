-- Learning Notebook Question Data Migration
-- This script inserts all existing question data from JavaScript files into D1
-- Total: 80 questions across 6 subjects

-- ==================================================
-- ENGLISH VOCABULARY (15 questions)
-- ==================================================
INSERT INTO questions (id, subject, title, question_text, correct_answer, source, word, difficulty_level, mode, active, created_at, updated_at) VALUES
('en-vocab-001', 'english-vocabulary', 'apple', 'apple', 'りんご', 'learning-notebook', 'apple', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-002', 'english-vocabulary', 'book', 'book', '本', 'learning-notebook', 'book', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-003', 'english-vocabulary', 'cat', 'cat', '猫', 'learning-notebook', 'cat', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-004', 'english-vocabulary', 'dog', 'dog', '犬', 'learning-notebook', 'dog', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-005', 'english-vocabulary', 'house', 'house', '家', 'learning-notebook', 'house', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-006', 'english-vocabulary', 'water', 'water', '水', 'learning-notebook', 'water', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-007', 'english-vocabulary', 'school', 'school', '学校', 'learning-notebook', 'school', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-008', 'english-vocabulary', 'friend', 'friend', '友達', 'learning-notebook', 'friend', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-009', 'english-vocabulary', 'beautiful', 'beautiful', '美しい', 'learning-notebook', 'beautiful', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-010', 'english-vocabulary', 'important', 'important', '重要な', 'learning-notebook', 'important', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-011', 'english-vocabulary', 'understand', 'understand', '理解する', 'learning-notebook', 'understand', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-012', 'english-vocabulary', 'knowledge', 'knowledge', '知識', 'learning-notebook', 'knowledge', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-013', 'english-vocabulary', 'experience', 'experience', '経験', 'learning-notebook', 'experience', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-014', 'english-vocabulary', 'opportunity', 'opportunity', '機会', 'learning-notebook', 'opportunity', 'hard', NULL, 1, datetime('now'), datetime('now')),
('en-vocab-015', 'english-vocabulary', 'accomplish', 'accomplish', '達成する', 'learning-notebook', 'accomplish', 'hard', NULL, 1, datetime('now'), datetime('now'));

-- ==================================================
-- ENGLISH GRAMMAR (10 questions)
-- ==================================================
INSERT INTO questions (id, subject, title, question_text, correct_answer, source, difficulty_level, mode, active, created_at, updated_at) VALUES
('en-grammar-001', 'english-grammar', 'Be動詞 am/is/are', 'I ___ a student. (am/is/are)', 'am', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-002', 'english-grammar', '三人称単数現在', 'She ___ to school. (go/goes)', 'goes', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-003', 'english-grammar', '複数形のbe動詞', 'They ___ playing soccer. (is/are)', 'are', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-004', 'english-grammar', '三人称の否定文', 'He ___ not like coffee. (do/does)', 'does', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-005', 'english-grammar', '過去形', '過去形: I ___ happy yesterday. (am/was)', 'was', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-006', 'english-grammar', '不規則複数形', '複数形: child → ___', 'children', 'learning-notebook', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-007', 'english-grammar', '不規則比較級', '比較級: good → ___', 'better', 'learning-notebook', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-008', 'english-grammar', '不規則最上級', '最上級: bad → ___', 'worst', 'learning-notebook', 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-009', 'english-grammar', '疑問文 Do/Does', '___ you speak English? (Do/Does)', 'Do', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-grammar-010', 'english-grammar', '冠詞 a/an', 'I have ___ apple. (a/an)', 'an', 'learning-notebook', 'easy', NULL, 1, datetime('now'), datetime('now'));

-- ==================================================
-- ENGLISH LISTENING (10 questions)
-- ==================================================
INSERT INTO questions (id, subject, title, question_text, correct_answer, source, word, is_listening, difficulty_level, mode, active, created_at, updated_at) VALUES
('en-listen-001', 'english-listening', 'apple リスニング', '🔊 音声を聞いて答えてください', 'apple (りんご)', 'learning-notebook', 'apple', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-002', 'english-listening', 'book リスニング', '🔊 音声を聞いて答えてください', 'book (本)', 'learning-notebook', 'book', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-003', 'english-listening', 'cat リスニング', '🔊 音声を聞いて答えてください', 'cat (猫)', 'learning-notebook', 'cat', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-004', 'english-listening', 'dog リスニング', '🔊 音声を聞いて答えてください', 'dog (犬)', 'learning-notebook', 'dog', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-005', 'english-listening', 'house リスニング', '🔊 音声を聞いて答えてください', 'house (家)', 'learning-notebook', 'house', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-006', 'english-listening', 'water リスニング', '🔊 音声を聞いて答えてください', 'water (水)', 'learning-notebook', 'water', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-007', 'english-listening', 'school リスニング', '🔊 音声を聞いて答えてください', 'school (学校)', 'learning-notebook', 'school', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-008', 'english-listening', 'friend リスニング', '🔊 音声を聞いて答えてください', 'friend (友達)', 'learning-notebook', 'friend', 1, 'easy', NULL, 1, datetime('now'), datetime('now')),
('en-listen-009', 'english-listening', 'beautiful リスニング', '🔊 音声を聞いて答えてください', 'beautiful (美しい)', 'learning-notebook', 'beautiful', 1, 'medium', NULL, 1, datetime('now'), datetime('now')),
('en-listen-010', 'english-listening', 'important リスニング', '🔊 音声を聞いて答えてください', 'important (重要な)', 'learning-notebook', 'important', 1, 'medium', NULL, 1, datetime('now'), datetime('now'));

-- ==================================================
-- MATH (15 questions)
-- ==================================================
INSERT INTO questions (id, subject, title, question_text, correct_answer, source, difficulty_level, mode, active, created_at, updated_at) VALUES
('math-001', 'math', '基本の足し算', '$3 + 5 = ?$', '$8$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-002', 'math', '基本の掛け算', '$12 \\times 7 = ?$', '$84$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-003', 'math', '平方根', '$\\sqrt{16} = ?$', '$4$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-004', 'math', '累乗計算', '$2^3 = ?$', '$8$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-005', 'math', '基本の引き算', '$15 - 9 = ?$', '$6$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-006', 'math', '基本の割り算', '$48 \\div 6 = ?$', '$8$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-007', 'math', '累乗計算2', '$5^2 = ?$', '$25$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-008', 'math', '割り算2', '$100 \\div 4 = ?$', '$25$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-009', 'math', '九九の応用', '$9 \\times 9 = ?$', '$81$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-010', 'math', '平方根2', '$\\sqrt{25} = ?$', '$5$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('math-011', 'math', '分数の足し算', '$\\frac{3}{4} + \\frac{1}{2} = ?$', '$\\frac{5}{4}$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('math-012', 'math', '微分積分', '$\\int x^2 dx = ?$', '$\\frac{x^3}{3} + C$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('math-013', 'math', '極限', '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = ?$', '$1$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('math-014', 'math', 'オイラーの公式', '$e^{i\\pi} + 1 = ?$', '$0$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('math-015', 'math', '級数', '$\\sum_{n=1}^{10} n = ?$', '$55$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now'));

-- ==================================================
-- PHYSICS (15 questions)
-- ==================================================
INSERT INTO questions (id, subject, title, question_text, correct_answer, source, difficulty_level, mode, active, created_at, updated_at) VALUES
('physics-001', 'physics', '速度の単位', '速度の単位は？', '$\\text{m/s}$ (メートル毎秒)', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('physics-002', 'physics', '重力加速度', '重力加速度は？', '$9.8 \\, \\text{m/s}^2$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('physics-003', 'physics', '運動エネルギー', '運動エネルギーの式は？', '$\\frac{1}{2}mv^2$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('physics-004', 'physics', '力の単位', '力の単位は？', '$\\text{N}$ (ニュートン)', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('physics-005', 'physics', '光速', '光の速さは？', '$3 \\times 10^8 \\, \\text{m/s}$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('physics-006', 'physics', '位置エネルギー', '位置エネルギーの式は？', '$mgh$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('physics-007', 'physics', '仕事の単位', '仕事の単位は？', '$\\text{J}$ (ジュール)', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('physics-008', 'physics', '電流の単位', '電流の単位は？', '$\\text{A}$ (アンペア)', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('physics-009', 'physics', 'オームの法則', 'オームの法則は？', '$V = IR$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('physics-010', 'physics', '電力の公式', '電力の式は？', '$P = VI$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('physics-011', 'physics', '運動方程式', '運動方程式は？', '$F = ma$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('physics-012', 'physics', '万有引力の法則', '万有引力の式は？', '$F = G\\frac{m_1 m_2}{r^2}$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('physics-013', 'physics', '波の速度', '波の速さの式は？', '$v = f\\lambda$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('physics-014', 'physics', '理想気体の状態方程式', '理想気体の状態方程式は？', '$PV = nRT$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('physics-015', 'physics', 'クーロンの法則', 'クーロンの法則は？', '$F = k\\frac{q_1 q_2}{r^2}$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now'));

-- ==================================================
-- CHEMISTRY (15 questions)
-- ==================================================
INSERT INTO questions (id, subject, title, question_text, correct_answer, source, difficulty_level, mode, active, created_at, updated_at) VALUES
('chemistry-001', 'chemistry', '水の化学式', '水の化学式は？', '$\\text{H}_2\\text{O}$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-002', 'chemistry', '酸素の化学式', '酸素の化学式は？', '$\\text{O}_2$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-003', 'chemistry', '二酸化炭素の化学式', '二酸化炭素の化学式は？', '$\\text{CO}_2$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-004', 'chemistry', '食塩の化学式', '食塩の化学式は？', '$\\text{NaCl}$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-005', 'chemistry', 'アンモニアの化学式', 'アンモニアの化学式は？', '$\\text{NH}_3$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-006', 'chemistry', 'メタンの化学式', 'メタンの化学式は？', '$\\text{CH}_4$', 'learning-notebook', 'easy', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-007', 'chemistry', '硫酸の化学式', '硫酸の化学式は？', '$\\text{H}_2\\text{SO}_4$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-008', 'chemistry', '過酸化水素の化学式', '過酸化水素の化学式は？', '$\\text{H}_2\\text{O}_2$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-009', 'chemistry', '炭酸の化学式', '炭酸の化学式は？', '$\\text{H}_2\\text{CO}_3$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-010', 'chemistry', 'エタノールの化学式', 'エタノールの化学式は？', '$\\text{C}_2\\text{H}_5\\text{OH}$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-011', 'chemistry', '燃焼反応', '燃焼反応: $\\text{CH}_4 + 2\\text{O}_2 \\rightarrow ?$', '$\\text{CO}_2 + 2\\text{H}_2\\text{O}$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-012', 'chemistry', '中和反応', '中和反応: $\\text{HCl} + \\text{NaOH} \\rightarrow ?$', '$\\text{NaCl} + \\text{H}_2\\text{O}$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-013', 'chemistry', '光合成反応', '光合成: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\rightarrow ?$', '$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-014', 'chemistry', '理想気体の状態方程式', '理想気体の状態方程式は？', '$PV = nRT$', 'learning-notebook', 'hard', 'katex', 1, datetime('now'), datetime('now')),
('chemistry-015', 'chemistry', 'モル濃度', 'モル濃度の式は？', '$C = \\frac{n}{V}$', 'learning-notebook', 'medium', 'katex', 1, datetime('now'), datetime('now'));

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Total questions inserted: 80
-- - english-vocabulary: 15
-- - english-grammar: 10
-- - english-listening: 10
-- - math: 15
-- - physics: 15
-- - chemistry: 15
