/**
 * Enhanced QuestaD1Client with Search Functionality
 * Extends the existing D1 client architecture to support search operations
 */

class QuestaD1Client {
    constructor(config = {}) {
        // Use existing configuration pattern
        this.baseUrl = config.baseUrl || 'https://data-manager-auth.t88596565.workers.dev/api';
        this.d1BaseURL = config.d1BaseURL || '/api/d1';
        this.r2BaseURL = config.r2BaseURL || '/api/r2';
        this.adminToken = config.adminToken || localStorage.getItem('admin_token');
        this.fallbackMode = config.fallbackMode !== false; // Default to true
        this.sessionToken = localStorage.getItem('sessionToken');
    }

    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.sessionToken) {
            headers['Authorization'] = `Bearer ${this.sessionToken}`;
        } else if (this.adminToken) {
            headers['Authorization'] = `Bearer ${this.adminToken}`;
        }
        
        return headers;
    }

    // Check if D1 server is available
    async isD1Available() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        } catch (error) {
            console.warn('D1サーバーが利用できません。ローカルモードで動作します。');
            return false;
        }
    }

    // ========================================
    // SEARCH FUNCTIONALITY
    // ========================================

    /**
     * Search questions with advanced filtering
     * @param {string} query - Search query text
     * @param {Object} filters - Filter options
     * @param {string} sort - Sort option
     * @param {number} limit - Results limit
     * @param {number} offset - Results offset
     * @returns {Promise<Array>} Search results
     */
    async searchQuestions(query = '', filters = {}, sort = 'created_desc', limit = 20, offset = 0) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.searchQuestionsFromLocalStorage(query, filters, sort, limit, offset);
        }

        try {
            const searchParams = new URLSearchParams({
                q: query,
                sort,
                limit: limit.toString(),
                offset: offset.toString(),
                ...this.buildFilterParams(filters)
            });

            const response = await fetch(`${this.baseUrl}/search/questions?${searchParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Search error: ${response.status}`);
            }

            const result = await response.json();
            return result.questions || [];

        } catch (error) {
            console.error('D1 search error:', error);
            if (this.fallbackMode) {
                return this.searchQuestionsFromLocalStorage(query, filters, sort, limit, offset);
            }
            throw error;
        }
    }

    /**
     * Get questions by subject with filtering (existing method enhanced)
     */
    async getQuestionsBySubject(subject, filters = {}, limit = 50, offset = 0) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.getQuestionsFromLocalStorage(subject, filters);
        }

        try {
            const searchParams = new URLSearchParams({
                subject,
                limit: limit.toString(),
                offset: offset.toString(),
                ...this.buildFilterParams(filters)
            });

            const response = await fetch(`${this.baseUrl}/questions?${searchParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Questions fetch error: ${response.status}`);
            }

            const result = await response.json();
            return result.questions || [];

        } catch (error) {
            console.error('D1 questions fetch error:', error);
            if (this.fallbackMode) {
                return this.getQuestionsFromLocalStorage(subject, filters);
            }
            throw error;
        }
    }

    /**
     * Get question statistics for search suggestions
     */
    async getSearchSuggestions(query, limit = 10) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.getSearchSuggestionsFromLocalStorage(query, limit);
        }

        try {
            const searchParams = new URLSearchParams({
                q: query,
                limit: limit.toString()
            });

            const response = await fetch(`${this.baseUrl}/search/suggestions?${searchParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Suggestions fetch error: ${response.status}`);
            }

            const result = await response.json();
            return result.suggestions || [];

        } catch (error) {
            console.error('D1 suggestions error:', error);
            if (this.fallbackMode) {
                return this.getSearchSuggestionsFromLocalStorage(query, limit);
            }
            return [];
        }
    }

    /**
     * Get question by ID
     */
    async getQuestionById(questionId) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.getQuestionFromLocalStorageById(questionId);
        }

        try {
            const response = await fetch(`${this.baseUrl}/questions/${questionId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Question fetch error: ${response.status}`);
            }

            const result = await response.json();
            return result.question;

        } catch (error) {
            console.error('D1 question fetch error:', error);
            if (this.fallbackMode) {
                return this.getQuestionFromLocalStorageById(questionId);
            }
            throw error;
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Build filter parameters for API requests
     */
    buildFilterParams(filters) {
        const params = {};
        
        if (filters.subjects && filters.subjects.length > 0) {
            params.subjects = filters.subjects.join(',');
        }
        
        if (filters.difficulties && filters.difficulties.length > 0) {
            params.difficulties = filters.difficulties.join(',');
        }
        
        if (filters.types && filters.types.length > 0) {
            params.types = filters.types.join(',');
        }
        
        if (filters.tags && filters.tags.length > 0) {
            params.tags = filters.tags.join(',');
        }
        
        if (filters.field_code) {
            params.field_code = filters.field_code;
        }
        
        if (filters.answer_format) {
            params.answer_format = filters.answer_format;
        }
        
        return params;
    }

    // ========================================
    // LOCAL STORAGE FALLBACK METHODS
    // ========================================

    /**
     * Search questions from localStorage as fallback
     */
    async searchQuestionsFromLocalStorage(query, filters, sort, limit, offset) {
        console.log('🔍 Searching from localStorage fallback');
        
        const allQuestions = await this.getAllQuestionsFromLocalStorage();
        let filteredQuestions = allQuestions;

        // Apply text search
        if (query && query.trim()) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            filteredQuestions = filteredQuestions.filter(question => {
                const searchText = `${question.title || ''} ${question.question || ''} ${(question.tags || []).join(' ')}`.toLowerCase();
                return searchTerms.some(term => searchText.includes(term));
            });
        }

        // Apply filters
        if (filters.subjects && filters.subjects.length > 0) {
            filteredQuestions = filteredQuestions.filter(q => filters.subjects.includes(q.subject));
        }

        if (filters.difficulties && filters.difficulties.length > 0) {
            filteredQuestions = filteredQuestions.filter(q => filters.difficulties.includes(q.difficulty));
        }

        if (filters.types && filters.types.length > 0) {
            filteredQuestions = filteredQuestions.filter(q => filters.types.includes(q.type));
        }

        // Apply sorting
        filteredQuestions.sort((a, b) => {
            switch (sort) {
                case 'created_desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'created_asc':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'difficulty_asc':
                    return (a.difficulty || 0) - (b.difficulty || 0);
                case 'difficulty_desc':
                    return (b.difficulty || 0) - (a.difficulty || 0);
                case 'relevance':
                    if (!query) return 0;
                    const scoreA = this.calculateRelevanceScore(a, query);
                    const scoreB = this.calculateRelevanceScore(b, query);
                    return scoreB - scoreA;
                default:
                    return 0;
            }
        });

        // Apply pagination
        return filteredQuestions.slice(offset, offset + limit);
    }

    /**
     * Get all questions from localStorage
     */
    async getAllQuestionsFromLocalStorage() {
        const questions = [];
        const subjects = ['math', 'english', 'chemistry', 'physics', 'japanese'];
        
        for (const subject of subjects) {
            const subjectQuestions = await this.getQuestionsFromLocalStorage(subject);
            if (subjectQuestions.success && subjectQuestions.questions) {
                questions.push(...subjectQuestions.questions.map(q => ({ ...q, subject })));
            }
        }
        
        // Also check for individual question items
        for (let key in localStorage) {
            if (key.startsWith('question_')) {
                try {
                    const questionData = JSON.parse(localStorage.getItem(key));
                    if (questionData && questionData.id) {
                        questions.push(questionData);
                    }
                } catch (e) {
                    // Ignore malformed data
                }
            }
        }
        
        return questions;
    }

    /**
     * Get questions from localStorage by subject
     */
    async getQuestionsFromLocalStorage(subject, filters = {}) {
        const storageKeys = [
            `${subject}_questions_backup`,
            `${subject}Questions`, // Legacy format
            `${subject}_questions`
        ];
        
        for (const storageKey of storageKeys) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    let questions = [];
                    
                    if (Array.isArray(data)) {
                        questions = data;
                    } else if (data.questions && Array.isArray(data.questions)) {
                        questions = data.questions;
                    }
                    
                    // Apply filters
                    if (filters.difficulties && filters.difficulties.length > 0) {
                        questions = questions.filter(q => filters.difficulties.includes(q.difficulty));
                    }
                    
                    if (filters.types && filters.types.length > 0) {
                        questions = questions.filter(q => filters.types.includes(q.type));
                    }
                    
                    console.log(`📁 Retrieved ${questions.length} questions from localStorage:`, storageKey);
                    return { success: true, questions, mode: 'localStorage' };
                } catch (e) {
                    console.warn(`Failed to parse localStorage data for key: ${storageKey}`, e);
                }
            }
        }
        
        return { success: false, questions: [], mode: 'localStorage' };
    }

    /**
     * Get question by ID from localStorage
     */
    async getQuestionFromLocalStorageById(questionId) {
        const storageKey = `question_${questionId}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.warn('Failed to parse question from localStorage:', questionId);
            }
        }
        
        // Search in subject collections
        const allQuestions = await this.getAllQuestionsFromLocalStorage();
        return allQuestions.find(q => q.id === questionId) || null;
    }

    /**
     * Get search suggestions from localStorage
     */
    async getSearchSuggestionsFromLocalStorage(query, limit) {
        const allQuestions = await this.getAllQuestionsFromLocalStorage();
        const suggestions = new Set();
        
        const queryLower = query.toLowerCase();
        
        allQuestions.forEach(question => {
            // Add title suggestions
            if (question.title && question.title.toLowerCase().includes(queryLower)) {
                suggestions.add(question.title);
            }
            
            // Add tag suggestions
            if (question.tags) {
                question.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(queryLower)) {
                        suggestions.add(tag);
                    }
                });
            }
        });
        
        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * Calculate relevance score for search sorting
     */
    calculateRelevanceScore(question, query) {
        const searchTerms = query.toLowerCase().split(' ');
        const title = (question.title || '').toLowerCase();
        const content = (question.question || '').toLowerCase();
        const tags = (question.tags || []).join(' ').toLowerCase();
        
        let score = 0;
        
        searchTerms.forEach(term => {
            // Title matches get higher score
            if (title.includes(term)) {
                score += 10;
            }
            
            // Content matches
            if (content.includes(term)) {
                score += 5;
            }
            
            // Tag matches
            if (tags.includes(term)) {
                score += 3;
            }
        });
        
        return score;
    }

    // ========================================
    // EXISTING METHODS (preserved)
    // ========================================

    async saveQuestion(questionData) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.saveQuestionToLocalStorage(questionData);
        }

        try {
            const response = await fetch(`${this.baseUrl}/questions`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                throw new Error(`D1 save error: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Question saved to D1:', result);
            return { success: true, mode: 'd1', data: result };

        } catch (error) {
            console.error('D1 save error:', error);
            if (this.fallbackMode) {
                return this.saveQuestionToLocalStorage(questionData);
            }
            throw error;
        }
    }

    saveQuestionToLocalStorage(questionData) {
        const storageKey = `question_${questionData.id}`;
        const data = {
            ...questionData,
            savedAt: new Date().toISOString(),
            mode: 'localStorage_fallback'
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log('💾 Question saved to localStorage:', data);
        return { success: true, mode: 'localStorage', key: storageKey };
    }

    // Set admin token
    setAdminToken(token) {
        this.adminToken = token;
        localStorage.setItem('admin_token', token);
    }

    // Set session token
    setSessionToken(token) {
        this.sessionToken = token;
        localStorage.setItem('sessionToken', token);
    }

    // Clear tokens
    clearTokens() {
        this.adminToken = null;
        this.sessionToken = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('sessionToken');
    }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestaD1Client;
} else if (typeof window !== 'undefined') {
    window.QuestaD1Client = QuestaD1Client;
}