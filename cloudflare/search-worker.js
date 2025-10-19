/**
 * Cloudflare Worker for Search API
 * Handles search requests and integrates with D1 database
 * Extends existing authentication and database patterns
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }
        
        try {
            // Route requests
            if (path === '/api/health') {
                return this.handleHealth(request, env, corsHeaders);
            } else if (path === '/api/search/questions') {
                return this.handleSearchQuestions(request, env, corsHeaders);
            } else if (path === '/api/search/suggestions') {
                return this.handleSearchSuggestions(request, env, corsHeaders);
            } else if (path === '/api/questions' && request.method === 'GET') {
                return this.handleGetQuestions(request, env, corsHeaders);
            } else if (path.startsWith('/api/questions/') && request.method === 'GET') {
                const questionId = path.split('/').pop();
                return this.handleGetQuestion(questionId, request, env, corsHeaders);
            }
            
            return new Response('Not Found', { status: 404, headers: corsHeaders });
            
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },
    
    // Health check endpoint
    async handleHealth(request, env, corsHeaders) {
        return new Response(JSON.stringify({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    },
    
    // Main search endpoint
    async handleSearchQuestions(request, env, corsHeaders) {
        const url = new URL(request.url);
        const params = url.searchParams;
        
        const query = params.get('q') || '';
        const sort = params.get('sort') || 'created_desc';
        const limit = Math.min(parseInt(params.get('limit')) || 20, 100);
        const offset = parseInt(params.get('offset')) || 0;
        
        // Parse filters
        const filters = {
            subjects: params.get('subjects')?.split(',').filter(Boolean) || [],
            difficulties: params.get('difficulties')?.split(',').map(Number).filter(Boolean) || [],
            types: params.get('types')?.split(',').filter(Boolean) || [],
            tags: params.get('tags')?.split(',').filter(Boolean) || [],
            field_code: params.get('field_code') || '',
            answer_format: params.get('answer_format') || ''
        };
        
        try {
            const questions = await this.searchQuestionsInDatabase(
                env.DB, query, filters, sort, limit, offset
            );
            
            return new Response(JSON.stringify({ 
                questions,
                query,
                filters,
                sort,
                limit,
                offset,
                count: questions.length
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            console.error('Search error:', error);
            return new Response(JSON.stringify({ 
                error: 'Search failed',
                message: error.message 
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },
    
    // Search suggestions endpoint
    async handleSearchSuggestions(request, env, corsHeaders) {
        const url = new URL(request.url);
        const params = url.searchParams;
        const query = params.get('q') || '';
        const limit = Math.min(parseInt(params.get('limit')) || 10, 20);
        
        try {
            const suggestions = await this.getSearchSuggestions(env.DB, query, limit);
            
            return new Response(JSON.stringify({ 
                suggestions,
                query
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            console.error('Suggestions error:', error);
            return new Response(JSON.stringify({ 
                error: 'Suggestions failed',
                message: error.message 
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },
    
    // Get questions by subject with filters
    async handleGetQuestions(request, env, corsHeaders) {
        const url = new URL(request.url);
        const params = url.searchParams;
        
        const subject = params.get('subject');
        const limit = Math.min(parseInt(params.get('limit')) || 50, 100);
        const offset = parseInt(params.get('offset')) || 0;
        
        const filters = {
            subjects: subject ? [subject] : [],
            difficulties: params.get('difficulties')?.split(',').map(Number).filter(Boolean) || [],
            types: params.get('types')?.split(',').filter(Boolean) || [],
            tags: params.get('tags')?.split(',').filter(Boolean) || []
        };
        
        try {
            const questions = await this.searchQuestionsInDatabase(
                env.DB, '', filters, 'created_desc', limit, offset
            );
            
            return new Response(JSON.stringify({ 
                questions,
                subject,
                filters,
                count: questions.length
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            console.error('Get questions error:', error);
            return new Response(JSON.stringify({ 
                error: 'Failed to get questions',
                message: error.message 
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },
    
    // Get single question by ID
    async handleGetQuestion(questionId, request, env, corsHeaders) {
        try {
            const stmt = env.DB.prepare(`
                SELECT * FROM questions 
                WHERE id = ? AND active = 1
            `);
            
            const question = await stmt.bind(questionId).first();
            
            if (!question) {
                return new Response(JSON.stringify({ 
                    error: 'Question not found' 
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Parse JSON fields
            const formattedQuestion = this.formatQuestion(question);
            
            return new Response(JSON.stringify({ 
                question: formattedQuestion
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            console.error('Get question error:', error);
            return new Response(JSON.stringify({ 
                error: 'Failed to get question',
                message: error.message 
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },
    
    // Core search implementation
    async searchQuestionsInDatabase(db, query, filters, sort, limit, offset) {
        let sql = `
            SELECT q.* 
            FROM questions q
            WHERE q.active = 1
        `;
        
        const params = [];
        
        // Apply subject filter
        if (filters.subjects && filters.subjects.length > 0) {
            sql += ` AND q.subject IN (${filters.subjects.map(() => '?').join(',')})`;
            params.push(...filters.subjects);
        }
        
        // Apply difficulty filter
        if (filters.difficulties && filters.difficulties.length > 0) {
            sql += ` AND q.difficulty IN (${filters.difficulties.map(() => '?').join(',')})`;
            params.push(...filters.difficulties);
        }
        
        // Apply type filter
        if (filters.types && filters.types.length > 0) {
            sql += ` AND q.type IN (${filters.types.map(() => '?').join(',')})`;
            params.push(...filters.types);
        }
        
        // Apply text search
        if (query && query.trim()) {
            sql += ` AND (
                q.question LIKE ? OR 
                q.title LIKE ? OR 
                q.tags LIKE ?
            )`;
            const searchTerm = `%${query}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Apply tag filter
        if (filters.tags && filters.tags.length > 0) {
            filters.tags.forEach(tag => {
                sql += ` AND q.tags LIKE ?`;
                params.push(`%${tag}%`);
            });
        }
        
        // Apply sorting
        switch (sort) {
            case 'created_desc':
                sql += ` ORDER BY q.created_at DESC`;
                break;
            case 'created_asc':
                sql += ` ORDER BY q.created_at ASC`;
                break;
            case 'difficulty_asc':
                sql += ` ORDER BY q.difficulty ASC, q.created_at DESC`;
                break;
            case 'difficulty_desc':
                sql += ` ORDER BY q.difficulty DESC, q.created_at DESC`;
                break;
            case 'relevance':
                // Simple relevance scoring - could be enhanced
                if (query) {
                    sql += ` ORDER BY (
                        CASE WHEN q.title LIKE ? THEN 10 ELSE 0 END +
                        CASE WHEN q.question LIKE ? THEN 5 ELSE 0 END +
                        CASE WHEN q.tags LIKE ? THEN 3 ELSE 0 END
                    ) DESC, q.created_at DESC`;
                    const searchTerm = `%${query}%`;
                    params.push(searchTerm, searchTerm, searchTerm);
                } else {
                    sql += ` ORDER BY q.created_at DESC`;
                }
                break;
            default:
                sql += ` ORDER BY q.created_at DESC`;
        }
        
        // Apply pagination
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            console.log('Executing search query:', sql);
            console.log('With parameters:', params);
            
            const stmt = db.prepare(sql);
            const result = await stmt.bind(...params).all();
            
            // Format questions (parse JSON fields)
            const questions = result.results?.map(q => this.formatQuestion(q)) || [];
            
            console.log(`Found ${questions.length} questions`);
            return questions;
            
        } catch (error) {
            console.error('Database search error:', error);
            throw error;
        }
    },
    
    // Get search suggestions from database
    async getSearchSuggestions(db, query, limit) {
        if (!query || query.length < 2) {
            return [];
        }
        
        const suggestions = new Set();
        
        try {
            // Get title suggestions
            const titleStmt = db.prepare(`
                SELECT DISTINCT title 
                FROM questions 
                WHERE title LIKE ? AND active = 1 
                LIMIT ?
            `);
            const titleResults = await titleStmt.bind(`%${query}%`, limit).all();
            
            titleResults.results?.forEach(row => {
                if (row.title) suggestions.add(row.title);
            });
            
            // Get tag suggestions
            const tagStmt = db.prepare(`
                SELECT DISTINCT tags 
                FROM questions 
                WHERE tags LIKE ? AND active = 1 
                LIMIT ?
            `);
            const tagResults = await tagStmt.bind(`%${query}%`, limit).all();
            
            tagResults.results?.forEach(row => {
                if (row.tags) {
                    try {
                        const tags = JSON.parse(row.tags);
                        if (Array.isArray(tags)) {
                            tags.forEach(tag => {
                                if (tag.toLowerCase().includes(query.toLowerCase())) {
                                    suggestions.add(tag);
                                }
                            });
                        }
                    } catch (e) {
                        // Ignore malformed JSON
                    }
                }
            });
            
            return Array.from(suggestions).slice(0, limit);
            
        } catch (error) {
            console.error('Suggestions query error:', error);
            return [];
        }
    },
    
    // Format question object (parse JSON fields)
    formatQuestion(question) {
        const formatted = { ...question };
        
        // Parse JSON fields safely
        try {
            if (formatted.choices && typeof formatted.choices === 'string') {
                formatted.choices = JSON.parse(formatted.choices);
            }
        } catch (e) {
            formatted.choices = [];
        }
        
        try {
            if (formatted.tags && typeof formatted.tags === 'string') {
                formatted.tags = JSON.parse(formatted.tags);
            }
        } catch (e) {
            formatted.tags = [];
        }
        
        try {
            if (formatted.expected && typeof formatted.expected === 'string') {
                formatted.expected = JSON.parse(formatted.expected);
            }
        } catch (e) {
            // Keep as string if not valid JSON
        }
        
        try {
            if (formatted.accepted && typeof formatted.accepted === 'string') {
                formatted.accepted = JSON.parse(formatted.accepted);
            }
        } catch (e) {
            formatted.accepted = [];
        }
        
        return formatted;
    }
};