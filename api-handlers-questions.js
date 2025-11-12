/**
 * Question Management API Handlers
 * Supports both short (q, a, e) and long (question_text, correct_answer, explanation) field names
 */

// Field name mapping
const FIELD_MAP = {
    // Short to Long
    'q': 'question_text',
    'a': 'correct_answer',
    'e': 'explanation',
    'd': 'difficulty_level',
    'src': 'source',
    'tag': 'tags',
    
    // Long to Short (for output)
    'question_text': 'q',
    'correct_answer': 'a',
    'explanation': 'e',
    'difficulty_level': 'd',
    'source': 'src',
    'tags': 'tag'
};

/**
 * Normalize question data (convert short names to long names for DB)
 */
function normalizeQuestionData(data) {
    const normalized = {};
    
    for (const [key, value] of Object.entries(data)) {
        const dbKey = FIELD_MAP[key] || key;
        normalized[dbKey] = value;
    }
    
    // Ensure required fields
    if (!normalized.id) normalized.id = q__;
    if (!normalized.subject) normalized.subject = 'general';
    if (!normalized.source) normalized.source = 'learning-notebook';
    if (!normalized.active) normalized.active = 1;
    if (!normalized.is_deleted) normalized.is_deleted = 0;
    
    // Handle JSON fields
    if (normalized.tags && typeof normalized.tags !== 'string') {
        normalized.tags = JSON.stringify(normalized.tags);
    }
    if (normalized.choices && typeof normalized.choices !== 'string') {
        normalized.choices = JSON.stringify(normalized.choices);
    }
    if (normalized.options && typeof normalized.options !== 'string') {
        normalized.options = JSON.stringify(normalized.options);
    }
    if (normalized.media_urls && typeof normalized.media_urls !== 'string') {
        normalized.media_urls = JSON.stringify(normalized.media_urls);
    }
    
    return normalized;
}

/**
 * Create question
 */
async function createQuestion(env, data) {
    const normalized = normalizeQuestionData(data);
    
    const query = 
        INSERT INTO questions (
            id, subject, title, question_text, correct_answer, 
            explanation, difficulty_level, choices, options, tags, 
            media_urls, source, is_listening, mode, word, active, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ;
    
    await env.LEARNING_DB.prepare(query).bind(
        normalized.id,
        normalized.subject,
        normalized.title || '',
        normalized.question_text || '',
        normalized.correct_answer || '',
        normalized.explanation || null,
        normalized.difficulty_level || 'medium',
        normalized.choices || null,
        normalized.options || null,
        normalized.tags || null,
        normalized.media_urls || null,
        normalized.source,
        normalized.is_listening || 0,
        normalized.mode || null,
        normalized.word || null,
        normalized.active,
        normalized.is_deleted
    ).run();
    
    return normalized;
}

/**
 * Get questions
 */
async function getQuestions(env, params) {
    const { subject, limit = 100, offset = 0, difficulty, tags } = params;
    
    let query = 'SELECT * FROM questions WHERE active = 1 AND is_deleted = 0';
    const bindings = [];
    
    if (subject) {
        query += ' AND subject = ?';
        bindings.push(subject);
    }
    
    if (difficulty) {
        query += ' AND difficulty_level = ?';
        bindings.push(difficulty);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    bindings.push(parseInt(limit), parseInt(offset));
    
    const stmt = env.LEARNING_DB.prepare(query).bind(...bindings);
    const result = await stmt.all();
    
    return result.results || [];
}

/**
 * Update question
 */
async function updateQuestion(env, id, data) {
    const normalized = normalizeQuestionData(data);
    
    const query = 
        UPDATE questions SET
            title = ?,
            question_text = ?,
            correct_answer = ?,
            explanation = ?,
            difficulty_level = ?,
            choices = ?,
            options = ?,
            tags = ?,
            media_urls = ?,
            is_listening = ?,
            mode = ?,
            word = ?,
            updated_at = datetime('now')
        WHERE id = ? AND active = 1 AND is_deleted = 0
    ;
    
    await env.LEARNING_DB.prepare(query).bind(
        normalized.title || '',
        normalized.question_text || '',
        normalized.correct_answer || '',
        normalized.explanation || null,
        normalized.difficulty_level || 'medium',
        normalized.choices || null,
        normalized.options || null,
        normalized.tags || null,
        normalized.media_urls || null,
        normalized.is_listening || 0,
        normalized.mode || null,
        normalized.word || null,
        id
    ).run();
    
    return normalized;
}

/**
 * Delete question (soft delete)
 */
async function deleteQuestion(env, id) {
    const query = 'UPDATE questions SET is_deleted = 1, updated_at = datetime(\'now\') WHERE id = ?';
    await env.LEARNING_DB.prepare(query).bind(id).run();
    return { success: true, id };
}

/**
 * Bulk import questions
 */
async function bulkImportQuestions(env, questions) {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    for (const question of questions) {
        try {
            await createQuestion(env, question);
            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                question: question.id || 'unknown',
                error: error.message
            });
        }
    }
    
    return results;
}

// Export functions
export {
    createQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion,
    bulkImportQuestions,
    normalizeQuestionData
};
