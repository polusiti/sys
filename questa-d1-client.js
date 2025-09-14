/**
 * Questa D1 Client Library - Real Implementation
 * Cloudflare D1 Database Integration for Question Management
 */

class QuestaD1Client {
    constructor(config = {}) {
        this.accountId = config.accountId || 'ba21c5b4812c8151fe16474a782a12d8';
        this.databaseId = config.databaseId || '591e73d7-50a4-48a7-8732-5d752669b7ab';
        this.apiToken = config.apiToken || '979qaSPTwReNQMzibGKohQiHPELJBbQVLNJerYBy';
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}`;
        
        // Initialize database schema on first use
        this.initialized = false;
    }

    /**
     * Execute SQL query against D1
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     */
    async executeQuery(sql, params = []) {
        try {
            const response = await fetch(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: sql,
                    params: params
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.errors?.[0]?.message || 'D1 query failed');
            }

            return {
                success: true,
                results: result.result?.[0]?.results || [],
                meta: result.result?.[0]?.meta || {}
            };
        } catch (error) {
            console.error('D1 Query Error:', error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Initialize database tables
     */
    async initializeDatabase() {
        if (this.initialized) return { success: true };

        try {
            // Create questions table
            const createQuestionsTable = `
                CREATE TABLE IF NOT EXISTS questions (
                    id TEXT PRIMARY KEY,
                    subject TEXT NOT NULL,
                    title TEXT,
                    question_text TEXT NOT NULL,
                    answer_format TEXT,
                    difficulty_level TEXT,
                    difficulty_amount INTEGER,
                    field_code TEXT,
                    choices TEXT, -- JSON string for multiple choice
                    correct_answer INTEGER,
                    explanation TEXT,
                    estimated_time INTEGER,
                    tags TEXT, -- JSON string for tags
                    media_urls TEXT, -- JSON string for media file URLs
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const result1 = await this.executeQuery(createQuestionsTable);
            if (!result1.success) {
                throw new Error('Failed to create questions table: ' + result1.error);
            }

            // Create statistics table
            const createStatsTable = `
                CREATE TABLE IF NOT EXISTS question_stats (
                    question_id TEXT PRIMARY KEY,
                    times_used INTEGER DEFAULT 0,
                    correct_attempts INTEGER DEFAULT 0,
                    total_attempts INTEGER DEFAULT 0,
                    avg_time_spent REAL DEFAULT 0,
                    last_used DATETIME,
                    FOREIGN KEY (question_id) REFERENCES questions(id)
                )
            `;

            const result2 = await this.executeQuery(createStatsTable);
            if (!result2.success) {
                throw new Error('Failed to create stats table: ' + result2.error);
            }

            // Create index for faster queries
            const createIndex = `
                CREATE INDEX IF NOT EXISTS idx_questions_subject 
                ON questions(subject, created_at DESC)
            `;

            const result3 = await this.executeQuery(createIndex);
            if (!result3.success) {
                console.warn('Failed to create index:', result3.error);
            }

            this.initialized = true;
            return { success: true, message: 'Database initialized successfully' };
        } catch (error) {
            console.error('Database initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save question data to D1
     * @param {Object} question - Question data
     * @returns {Promise<Object>} Save result
     */
    async saveQuestion(question) {
        try {
            await this.initializeDatabase();

            const questionData = {
                id: question.id || this.generateId(),
                subject: question.subject || 'english',
                title: question.title || '',
                question_text: question.questionText || question.question_text || '',
                answer_format: question.answerFormat || question.answer_format || 'A1',
                difficulty_level: question.difficultyLevel || question.difficulty_level || 'B',
                difficulty_amount: question.difficultyAmount || question.difficulty_amount || 2,
                field_code: question.fieldCode || question.field_code || '',
                choices: question.choices ? JSON.stringify(question.choices) : null,
                correct_answer: question.correctAnswer || question.correct_answer || null,
                explanation: question.explanation || '',
                estimated_time: question.estimatedTime || question.estimated_time || 5,
                tags: question.tags ? JSON.stringify(question.tags) : null,
                media_urls: question.mediaUrls ? JSON.stringify(question.mediaUrls) : null
            };

            const sql = `
                INSERT OR REPLACE INTO questions (
                    id, subject, title, question_text, answer_format, 
                    difficulty_level, difficulty_amount, field_code, 
                    choices, correct_answer, explanation, estimated_time, 
                    tags, media_urls, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

            const params = [
                questionData.id,
                questionData.subject,
                questionData.title,
                questionData.question_text,
                questionData.answer_format,
                questionData.difficulty_level,
                questionData.difficulty_amount,
                questionData.field_code,
                questionData.choices,
                questionData.correct_answer,
                questionData.explanation,
                questionData.estimated_time,
                questionData.tags,
                questionData.media_urls
            ];

            const result = await this.executeQuery(sql, params);
            
            if (result.success) {
                return {
                    success: true,
                    data: { ...questionData, created_at: new Date().toISOString() }
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('D1 Save Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get questions by subject
     * @param {string} subject - Subject name
     * @param {Object} filters - Optional filters
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Object>} Questions list
     */
    async getQuestionsBySubject(subject, filters = {}, limit = 50, offset = 0) {
        try {
            await this.initializeDatabase();

            let sql = `
                SELECT q.*, 
                       s.times_used, s.correct_attempts, s.total_attempts, s.avg_time_spent
                FROM questions q
                LEFT JOIN question_stats s ON q.id = s.question_id
                WHERE q.subject = ?
            `;
            
            let params = [subject];

            // Apply filters
            if (filters.difficulty_level) {
                sql += ' AND q.difficulty_level = ?';
                params.push(filters.difficulty_level);
            }

            if (filters.answer_format) {
                sql += ' AND q.answer_format = ?';
                params.push(filters.answer_format);
            }

            if (filters.field_code) {
                sql += ' AND q.field_code = ?';
                params.push(filters.field_code);
            }

            if (filters.search) {
                sql += ' AND (q.title LIKE ? OR q.question_text LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }

            sql += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const result = await this.executeQuery(sql, params);

            if (result.success) {
                const questions = result.results.map(row => ({
                    ...row,
                    choices: row.choices ? JSON.parse(row.choices) : null,
                    tags: row.tags ? JSON.parse(row.tags) : null,
                    mediaUrls: row.media_urls ? JSON.parse(row.media_urls) : null
                }));

                return {
                    success: true,
                    data: questions,
                    count: questions.length
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('D1 Get By Subject Error:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Get question statistics for a subject
     * @param {string} subject - Subject name
     * @returns {Promise<Object>} Statistics data
     */
    async getSubjectStatistics(subject) {
        try {
            await this.initializeDatabase();

            const sql = `
                SELECT 
                    COUNT(*) as total_questions,
                    AVG(estimated_time) as avg_estimated_time,
                    difficulty_level,
                    answer_format,
                    field_code,
                    COUNT(*) as count
                FROM questions 
                WHERE subject = ?
                GROUP BY difficulty_level, answer_format, field_code
            `;

            const result = await this.executeQuery(sql, [subject]);

            if (result.success) {
                const stats = {
                    totalQuestions: 0,
                    byDifficulty: {},
                    byType: {},
                    byField: {},
                    avgEstimatedTime: 0
                };

                result.results.forEach(row => {
                    stats.totalQuestions += row.count;
                    
                    if (row.difficulty_level) {
                        stats.byDifficulty[row.difficulty_level] = 
                            (stats.byDifficulty[row.difficulty_level] || 0) + row.count;
                    }
                    
                    if (row.answer_format) {
                        stats.byType[row.answer_format] = 
                            (stats.byType[row.answer_format] || 0) + row.count;
                    }
                    
                    if (row.field_code) {
                        stats.byField[row.field_code] = 
                            (stats.byField[row.field_code] || 0) + row.count;
                    }
                });

                // Get average estimated time
                const avgSql = `SELECT AVG(estimated_time) as avg_time FROM questions WHERE subject = ?`;
                const avgResult = await this.executeQuery(avgSql, [subject]);
                
                if (avgResult.success && avgResult.results.length > 0) {
                    stats.avgEstimatedTime = Math.round((avgResult.results[0].avg_time || 0) * 10) / 10;
                }

                return {
                    success: true,
                    data: stats
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('D1 Statistics Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete question
     * @param {string} questionId - Question ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteQuestion(questionId) {
        try {
            const sql = 'DELETE FROM questions WHERE id = ?';
            const result = await this.executeQuery(sql, [questionId]);

            // Also delete stats
            const statsSql = 'DELETE FROM question_stats WHERE question_id = ?';
            await this.executeQuery(statsSql, [questionId]);

            return result;
        } catch (error) {
            console.error('D1 Delete Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sync local data to D1
     * @param {string} subject - Subject to sync
     * @returns {Promise<Object>} Sync result
     */
    async syncLocalToD1(subject) {
        try {
            const localKeys = {
                english: ['vocabQuestions', 'grammarQuestions', 'readingQuestions', 'listeningQuestions', 'summaryQuestions'],
                math: ['mathQuestions'],
                japanese: ['japaneseQuestions']
            };

            let syncCount = 0;
            const syncLog = [];

            const keys = localKeys[subject] || [];
            
            for (const key of keys) {
                const localData = localStorage.getItem(key);
                if (localData) {
                    const questions = JSON.parse(localData);
                    
                    for (const question of questions) {
                        const result = await this.saveQuestion({
                            ...question,
                            subject: subject
                        });
                        
                        if (result.success) {
                            syncCount++;
                            syncLog.push(`✅ ${question.title || question.questionText?.substring(0, 30)} を同期`);
                        } else {
                            syncLog.push(`❌ 同期失敗: ${result.error}`);
                        }
                    }
                }
            }

            return {
                success: true,
                syncCount: syncCount,
                syncLog: syncLog
            };
        } catch (error) {
            console.error('Sync Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods
    generateId() {
        return 'q_d1_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
}

// Global instance with real configuration
window.questaD1 = new QuestaD1Client();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestaD1Client;
}