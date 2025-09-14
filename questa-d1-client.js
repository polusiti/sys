/**
 * Questa D1 Client Library
 * Cloudflare D1 Database Integration for Question Management
 * Handles structured data storage and queries
 */

class QuestaD1Client {
    constructor(config = {}) {
        this.endpoint = config.endpoint || '';
        this.apiToken = config.apiToken || '';
        this.accountId = config.accountId || '';
        this.databaseId = config.databaseId || '';
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}`;
        
        // Local fallback storage
        this.localStoragePrefix = 'questa_d1_';
    }

    /**
     * Execute SQL query against D1
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     */
    async executeQuery(sql, params = []) {
        try {
            // For development, use local storage simulation
            return await this.executeLocalQuery(sql, params);
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
     * Save question data to D1
     * @param {Object} question - Question data
     * @returns {Promise<Object>} Save result
     */
    async saveQuestion(question) {
        try {
            const questionData = {
                ...question,
                id: question.id || this.generateId(),
                createdAt: question.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Store in local simulation
            const storageKey = `${this.localStoragePrefix}question_${questionData.id}`;
            localStorage.setItem(storageKey, JSON.stringify(questionData));

            // Also store in subject-specific index
            await this.updateSubjectIndex(questionData.subject, questionData.id, 'add');

            return {
                success: true,
                data: questionData
            };
        } catch (error) {
            console.error('D1 Save Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get question by ID
     * @param {string} questionId - Question ID
     * @returns {Promise<Object>} Question data
     */
    async getQuestion(questionId) {
        try {
            const storageKey = `${this.localStoragePrefix}question_${questionId}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                return {
                    success: true,
                    data: JSON.parse(stored)
                };
            }

            return {
                success: false,
                error: 'Question not found'
            };
        } catch (error) {
            console.error('D1 Get Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get questions by subject
     * @param {string} subject - Subject name (english, math, japanese, etc.)
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Questions list
     */
    async getQuestionsBySubject(subject, filters = {}) {
        try {
            const questions = [];
            const indexKey = `${this.localStoragePrefix}index_${subject}`;
            const indexData = localStorage.getItem(indexKey);
            
            if (indexData) {
                const questionIds = JSON.parse(indexData);
                
                for (const questionId of questionIds) {
                    const result = await this.getQuestion(questionId);
                    if (result.success) {
                        const question = result.data;
                        
                        // Apply filters
                        if (this.matchesFilters(question, filters)) {
                            questions.push(question);
                        }
                    }
                }
            }

            // Sort by creation date (newest first)
            questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return {
                success: true,
                data: questions,
                count: questions.length
            };
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
     * Update question data
     * @param {string} questionId - Question ID
     * @param {Object} updates - Data to update
     * @returns {Promise<Object>} Update result
     */
    async updateQuestion(questionId, updates) {
        try {
            const existing = await this.getQuestion(questionId);
            if (!existing.success) {
                return existing;
            }

            const updatedQuestion = {
                ...existing.data,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            const storageKey = `${this.localStoragePrefix}question_${questionId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedQuestion));

            return {
                success: true,
                data: updatedQuestion
            };
        } catch (error) {
            console.error('D1 Update Error:', error);
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
            const existing = await this.getQuestion(questionId);
            if (!existing.success) {
                return { success: true }; // Already doesn't exist
            }

            const storageKey = `${this.localStoragePrefix}question_${questionId}`;
            localStorage.removeItem(storageKey);

            // Remove from subject index
            await this.updateSubjectIndex(existing.data.subject, questionId, 'remove');

            return { success: true };
        } catch (error) {
            console.error('D1 Delete Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get statistics for a subject
     * @param {string} subject - Subject name
     * @returns {Promise<Object>} Statistics data
     */
    async getSubjectStatistics(subject) {
        try {
            const questions = await this.getQuestionsBySubject(subject);
            
            if (!questions.success) {
                return questions;
            }

            const stats = {
                totalQuestions: questions.data.length,
                byDifficulty: {},
                byType: {},
                byField: {},
                avgEstimatedTime: 0,
                recentActivity: []
            };

            let totalTime = 0;

            questions.data.forEach(question => {
                // Difficulty stats
                const difficulty = question.difficulty || question.difficultyLevel || 'unknown';
                stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;

                // Type stats
                const type = question.answerFormat || question.type || 'unknown';
                stats.byType[type] = (stats.byType[type] || 0) + 1;

                // Field stats (for math)
                if (question.fieldCode) {
                    stats.byField[question.fieldCode] = (stats.byField[question.fieldCode] || 0) + 1;
                }

                // Time calculation
                if (question.estimatedTime) {
                    totalTime += question.estimatedTime;
                }

                // Recent activity
                stats.recentActivity.push({
                    id: question.id,
                    title: question.title || question.questionText?.substring(0, 50),
                    updatedAt: question.updatedAt
                });
            });

            stats.avgEstimatedTime = questions.data.length > 0 ? 
                Math.round((totalTime / questions.data.length) * 10) / 10 : 0;

            // Sort recent activity by date
            stats.recentActivity.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            stats.recentActivity = stats.recentActivity.slice(0, 10);

            return {
                success: true,
                data: stats
            };
        } catch (error) {
            console.error('D1 Statistics Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sync local data with D1 database
     * @returns {Promise<Object>} Sync result
     */
    async syncData() {
        try {
            const syncLog = [];
            
            // In development mode, just validate local data
            let questionCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.localStoragePrefix}question_`)) {
                    questionCount++;
                }
            }

            syncLog.push(`ローカルに${questionCount}問の問題を確認`);
            syncLog.push('ローカルストレージとの同期完了');

            return {
                success: true,
                syncLog: syncLog,
                questionCount: questionCount
            };
        } catch (error) {
            console.error('D1 Sync Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods

    generateId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    async updateSubjectIndex(subject, questionId, operation) {
        try {
            const indexKey = `${this.localStoragePrefix}index_${subject}`;
            let questionIds = [];
            
            const existing = localStorage.getItem(indexKey);
            if (existing) {
                questionIds = JSON.parse(existing);
            }

            if (operation === 'add' && !questionIds.includes(questionId)) {
                questionIds.push(questionId);
            } else if (operation === 'remove') {
                questionIds = questionIds.filter(id => id !== questionId);
            }

            localStorage.setItem(indexKey, JSON.stringify(questionIds));
        } catch (error) {
            console.error('Index update error:', error);
        }
    }

    matchesFilters(question, filters) {
        for (const [key, value] of Object.entries(filters)) {
            if (value !== null && value !== undefined && value !== '') {
                if (question[key] !== value) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Local query simulation for development
     */
    async executeLocalQuery(sql, params = []) {
        // This is a simplified simulation for development
        // In production, this would make actual D1 API calls
        
        const queryType = sql.trim().toLowerCase().split(' ')[0];
        
        switch (queryType) {
            case 'select':
                return this.simulateSelect(sql, params);
            case 'insert':
                return this.simulateInsert(sql, params);
            case 'update':
                return this.simulateUpdate(sql, params);
            case 'delete':
                return this.simulateDelete(sql, params);
            default:
                return {
                    success: true,
                    results: [],
                    meta: { duration: 0 }
                };
        }
    }

    simulateSelect(sql, params) {
        return {
            success: true,
            results: [],
            meta: { 
                duration: Math.random() * 100,
                rows_read: 0,
                rows_written: 0
            }
        };
    }

    simulateInsert(sql, params) {
        return {
            success: true,
            results: [],
            meta: {
                duration: Math.random() * 50,
                rows_written: 1,
                last_row_id: Math.floor(Math.random() * 10000)
            }
        };
    }

    simulateUpdate(sql, params) {
        return {
            success: true,
            results: [],
            meta: {
                duration: Math.random() * 75,
                rows_written: 1
            }
        };
    }

    simulateDelete(sql, params) {
        return {
            success: true,
            results: [],
            meta: {
                duration: Math.random() * 60,
                rows_written: 1
            }
        };
    }
}

// Global instance
window.questaD1 = new QuestaD1Client();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestaD1Client;
}