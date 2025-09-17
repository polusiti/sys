/**
 * Search Manager - Handles search functionality for the Data Manager System
 * Follows the existing architecture patterns from the repository
 */

class SearchManager {
    constructor(config = {}) {
        this.currentQuery = '';
        this.currentFilters = {};
        this.currentSort = 'created_desc';
        this.currentPage = 0;
        this.pageSize = 20;
        this.isLoading = false;
        this.hasMore = true;
        this.searchResults = [];
        this.searchHistory = this.loadSearchHistory();
        
        // Authentication integration
        this.authClient = config.authClient || window.authClient;
        
        // Initialize clients
        this.questaClient = new QuestaD1Client({
            // Pass authentication context if available
            sessionToken: this.authClient?.getSessionToken?.()
        });
        
        // Debounce search input
        this.searchDebounceTimer = null;
        this.searchDebounceDelay = 300;
        
        // DOM elements (will be set in init)
        this.elements = {};
    }
    
    init() {
        this.bindElements();
        this.bindEvents();
        this.loadSearchHistory();
        this.showInitialState();
    }
    
    bindElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            filterToggle: document.getElementById('filterToggle'),
            filtersContainer: document.getElementById('filtersContainer'),
            clearFilters: document.getElementById('clearFilters'),
            applyFilters: document.getElementById('applyFilters'),
            resultsCount: document.getElementById('resultsCount'),
            sortSelect: document.getElementById('sortSelect'),
            resultsGrid: document.getElementById('resultsGrid'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            noResults: document.getElementById('noResults'),
            loadMore: document.getElementById('loadMore'),
            searchHistory: document.getElementById('searchHistory'),
            historyItems: document.getElementById('historyItems'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            modalContent: document.getElementById('modalContent'),
            modalClose: document.getElementById('modalClose')
        };
    }
    
    bindEvents() {
        // Search input events
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
        
        this.elements.searchInput.addEventListener('focus', () => {
            this.showSearchHistory();
        });
        
        this.elements.clearSearch.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // Filter events
        this.elements.filterToggle.addEventListener('click', () => {
            this.toggleFilters();
        });
        
        this.elements.clearFilters.addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        this.elements.applyFilters.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Filter chip events
        const filterChips = document.querySelectorAll('.chip input');
        filterChips.forEach(chip => {
            chip.addEventListener('change', () => {
                this.updateFilterState();
            });
        });
        
        // Sort change
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.resetAndSearch();
        });
        
        // Load more
        this.elements.loadMore.addEventListener('click', () => {
            this.loadMoreResults();
        });
        
        // Modal events
        this.elements.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.closeModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            } else if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        });
    }
    
    handleSearchInput(query) {
        const trimmedQuery = query.trim();
        
        // Show/hide clear button
        this.elements.clearSearch.style.display = trimmedQuery ? 'block' : 'none';
        
        // Hide search history when typing
        if (trimmedQuery) {
            this.hideSearchHistory();
        }
        
        // Debounce search
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.currentQuery = trimmedQuery;
            this.resetAndSearch();
        }, this.searchDebounceDelay);
    }
    
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';
        this.currentQuery = '';
        this.showInitialState();
        this.elements.searchInput.focus();
    }
    
    toggleFilters() {
        const isVisible = this.elements.filtersContainer.style.display !== 'none';
        this.elements.filtersContainer.style.display = isVisible ? 'none' : 'block';
        this.elements.filterToggle.classList.toggle('active', !isVisible);
    }
    
    updateFilterState() {
        const filters = {};
        
        // Collect selected filters
        const subjects = Array.from(document.querySelectorAll('input[name="subject"]:checked'))
            .map(el => el.value);
        const difficulties = Array.from(document.querySelectorAll('input[name="difficulty"]:checked'))
            .map(el => parseInt(el.value));
        const types = Array.from(document.querySelectorAll('input[name="type"]:checked'))
            .map(el => el.value);
        
        if (subjects.length > 0) filters.subjects = subjects;
        if (difficulties.length > 0) filters.difficulties = difficulties;
        if (types.length > 0) filters.types = types;
        
        this.currentFilters = filters;
    }
    
    applyFilters() {
        this.updateFilterState();
        this.toggleFilters();
        this.resetAndSearch();
    }
    
    clearAllFilters() {
        // Uncheck all filter inputs
        document.querySelectorAll('.chip input').forEach(input => {
            input.checked = false;
        });
        this.currentFilters = {};
        this.resetAndSearch();
    }
    
    async resetAndSearch() {
        this.currentPage = 0;
        this.searchResults = [];
        this.hasMore = true;
        
        if (this.currentQuery || Object.keys(this.currentFilters).length > 0) {
            await this.performSearch();
        } else {
            this.showInitialState();
        }
    }
    
    async performSearch() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Save search to history if it's a new query
            if (this.currentQuery && this.currentPage === 0) {
                this.addToSearchHistory(this.currentQuery);
            }
            
            const results = await this.searchQuestions(
                this.currentQuery,
                this.currentFilters,
                this.currentSort,
                this.pageSize,
                this.currentPage * this.pageSize
            );
            
            if (this.currentPage === 0) {
                this.searchResults = results;
            } else {
                this.searchResults = [...this.searchResults, ...results];
            }
            
            this.hasMore = results.length === this.pageSize;
            this.renderResults();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('検索中にエラーが発生しました。もう一度お試しください。');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async searchQuestions(query, filters, sort, limit, offset) {
        // Simulate API call - in real implementation, this would call the backend
        // For now, we'll use mock data that matches the expected structure
        
        const mockQuestions = await this.getMockQuestions();
        let filteredQuestions = mockQuestions;
        
        // Apply text search
        if (query) {
            const searchTerms = query.toLowerCase().split(' ');
            filteredQuestions = filteredQuestions.filter(question => {
                const searchText = `${question.title} ${question.question} ${question.tags?.join(' ')}`.toLowerCase();
                return searchTerms.some(term => searchText.includes(term));
            });
        }
        
        // Apply filters
        if (filters.subjects) {
            filteredQuestions = filteredQuestions.filter(q => filters.subjects.includes(q.subject));
        }
        
        if (filters.difficulties) {
            filteredQuestions = filteredQuestions.filter(q => filters.difficulties.includes(q.difficulty));
        }
        
        if (filters.types) {
            filteredQuestions = filteredQuestions.filter(q => filters.types.includes(q.type));
        }
        
        // Apply sorting
        filteredQuestions.sort((a, b) => {
            switch (sort) {
                case 'created_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'created_asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'difficulty_asc':
                    return a.difficulty - b.difficulty;
                case 'difficulty_desc':
                    return b.difficulty - a.difficulty;
                case 'relevance':
                    // Simple relevance based on query match count
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
    
    calculateRelevanceScore(question, query) {
        const searchTerms = query.toLowerCase().split(' ');
        const text = `${question.title} ${question.question}`.toLowerCase();
        let score = 0;
        
        searchTerms.forEach(term => {
            const matches = (text.match(new RegExp(term, 'g')) || []).length;
            score += matches;
            
            // Boost score for title matches
            if (question.title.toLowerCase().includes(term)) {
                score += 5;
            }
        });
        
        return score;
    }
    
    async getMockQuestions() {
        // Mock data matching the database schema
        return [
            {
                id: 'q_math_1',
                subject: 'math',
                topic: 'algebra',
                difficulty: 3,
                title: '二次方程式の解法',
                question: '次の二次方程式を解きなさい。$x^2 - 5x + 6 = 0$',
                type: 'mc',
                choices: ['x = 2, 3', 'x = 1, 6', 'x = -2, -3', 'x = 0, 5'],
                answer: 0,
                explanation: 'たすき掛けを使って $(x-2)(x-3)=0$ より $x=2, 3$',
                tags: ['二次方程式', '因数分解', '代数'],
                created_at: '2024-01-15T10:30:00Z'
            },
            {
                id: 'q_english_1',
                subject: 'english',
                topic: 'grammar',
                difficulty: 2,
                title: '現在完了形の用法',
                question: 'Choose the correct answer: I _____ to Tokyo three times.',
                type: 'mc',
                choices: ['go', 'went', 'have gone', 'am going'],
                answer: 2,
                explanation: '経験を表す現在完了形を使います。',
                tags: ['現在完了', '文法', '動詞'],
                created_at: '2024-01-14T14:20:00Z'
            },
            {
                id: 'q_chemistry_1',
                subject: 'chemistry',
                topic: 'organic',
                difficulty: 4,
                title: 'アルカンの燃焼反応',
                question: 'メタン（CH₄）が完全燃焼するときの化学反応式を書きなさい。',
                type: 'open',
                expected: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
                explanation: '炭化水素の完全燃焼では二酸化炭素と水が生成されます。',
                tags: ['有機化学', '燃焼反応', '化学反応式'],
                created_at: '2024-01-13T16:45:00Z'
            },
            {
                id: 'q_physics_1',
                subject: 'physics',
                topic: 'mechanics',
                difficulty: 3,
                title: '等加速度運動',
                question: '初速度5m/s、加速度2m/s²で運動する物体の3秒後の速度を求めなさい。',
                type: 'open',
                expected: '11 m/s',
                explanation: 'v = v₀ + at = 5 + 2×3 = 11 m/s',
                tags: ['力学', '等加速度運動', '運動方程式'],
                created_at: '2024-01-12T11:15:00Z'
            }
        ];
    }
    
    renderResults() {
        this.updateResultsCount();
        
        if (this.searchResults.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.elements.resultsGrid.innerHTML = '';
        this.searchResults.forEach(question => {
            const card = this.createQuestionCard(question);
            this.elements.resultsGrid.appendChild(card);
        });
        
        this.elements.loadMore.style.display = this.hasMore ? 'block' : 'none';
        this.hideNoResults();
    }
    
    createQuestionCard(question) {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.onclick = () => this.showQuestionDetail(question);
        
        const subjectNames = {
            math: '数学',
            english: '英語',
            chemistry: '化学',
            physics: '物理'
        };
        
        const difficultyNames = {
            1: '易しい',
            2: 'やや易',
            3: '普通',
            4: 'やや難',
            5: '難しい'
        };
        
        const typeNames = {
            mc: '選択式',
            open: '記述式',
            rootfrac: '分数・ルート'
        };
        
        card.innerHTML = `
            <div class="question-header">
                <div class="question-meta">
                    <span class="subject-badge">${subjectNames[question.subject] || question.subject}</span>
                    <span class="difficulty-badge">${difficultyNames[question.difficulty] || question.difficulty}</span>
                    <span class="type-badge">${typeNames[question.type] || question.type}</span>
                </div>
            </div>
            <h3 class="question-title">${this.escapeHtml(question.title)}</h3>
            <div class="question-preview">${this.formatQuestionPreview(question.question)}</div>
            ${question.tags ? `
                <div class="question-tags">
                    ${question.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        `;
        
        return card;
    }
    
    formatQuestionPreview(text) {
        // Truncate and escape HTML, but preserve basic formatting
        const maxLength = 150;
        const escaped = this.escapeHtml(text);
        return escaped.length > maxLength ? escaped.substring(0, maxLength) + '...' : escaped;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showQuestionDetail(question) {
        this.elements.modalTitle.textContent = question.title;
        
        const subjectNames = {
            math: '数学',
            english: '英語',
            chemistry: '化学',
            physics: '物理'
        };
        
        const typeNames = {
            mc: '選択式',
            open: '記述式',
            rootfrac: '分数・ルート'
        };
        
        let choicesHtml = '';
        if (question.type === 'mc' && question.choices) {
            choicesHtml = `
                <div class="choices">
                    <h4>選択肢</h4>
                    <ol>
                        ${question.choices.map((choice, index) => 
                            `<li class="${index === question.answer ? 'correct-answer' : ''}">${this.escapeHtml(choice)}</li>`
                        ).join('')}
                    </ol>
                </div>
            `;
        }
        
        this.elements.modalContent.innerHTML = `
            <div class="question-detail">
                <div class="question-info">
                    <span class="subject-badge">${subjectNames[question.subject] || question.subject}</span>
                    <span class="difficulty-badge">難易度: ${question.difficulty}/5</span>
                    <span class="type-badge">${typeNames[question.type] || question.type}</span>
                </div>
                
                <div class="question-content">
                    <h4>問題</h4>
                    <div class="question-text">${question.question}</div>
                </div>
                
                ${choicesHtml}
                
                ${question.expected ? `
                    <div class="expected-answer">
                        <h4>解答</h4>
                        <div class="answer-text">${this.escapeHtml(question.expected)}</div>
                    </div>
                ` : ''}
                
                ${question.explanation ? `
                    <div class="explanation">
                        <h4>解説</h4>
                        <div class="explanation-text">${question.explanation}</div>
                    </div>
                ` : ''}
                
                ${question.tags ? `
                    <div class="question-tags">
                        <h4>タグ</h4>
                        <div class="tags-list">
                            ${question.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.elements.modalOverlay.style.display = 'flex';
        
        // Re-render MathJax if present
        if (window.MathJax) {
            MathJax.typesetPromise([this.elements.modalContent]).catch(err => {
                console.error('MathJax rendering error:', err);
            });
        }
    }
    
    closeModal() {
        this.elements.modalOverlay.style.display = 'none';
    }
    
    updateResultsCount() {
        const count = this.searchResults.length;
        const hasMore = this.hasMore ? '+' : '';
        this.elements.resultsCount.textContent = `${count}${hasMore}件の結果`;
    }
    
    showLoading() {
        this.elements.loadingIndicator.style.display = 'flex';
        this.hideNoResults();
    }
    
    hideLoading() {
        this.elements.loadingIndicator.style.display = 'none';
    }
    
    showNoResults() {
        this.elements.noResults.style.display = 'block';
        this.elements.resultsGrid.style.display = 'none';
        this.elements.loadMore.style.display = 'none';
    }
    
    hideNoResults() {
        this.elements.noResults.style.display = 'none';
        this.elements.resultsGrid.style.display = 'grid';
    }
    
    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(message);
    }
    
    showInitialState() {
        this.elements.resultsCount.textContent = '検索結果を表示';
        this.elements.resultsGrid.innerHTML = '';
        this.hideNoResults();
        this.hideLoading();
        this.elements.loadMore.style.display = 'none';
        this.showSearchHistory();
    }
    
    async loadMoreResults() {
        if (this.isLoading || !this.hasMore) return;
        
        this.currentPage++;
        await this.performSearch();
    }
    
    // Search History Management
    loadSearchHistory() {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    }
    
    saveSearchHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }
    
    addToSearchHistory(query) {
        // Remove existing entry if it exists
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // Add to beginning
        this.searchHistory.unshift({
            query,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 searches
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        this.saveSearchHistory();
        this.renderSearchHistory();
    }
    
    showSearchHistory() {
        if (this.searchHistory.length === 0 || this.currentQuery) {
            this.elements.searchHistory.style.display = 'none';
            return;
        }
        
        this.renderSearchHistory();
        this.elements.searchHistory.style.display = 'block';
    }
    
    hideSearchHistory() {
        this.elements.searchHistory.style.display = 'none';
    }
    
    renderSearchHistory() {
        if (this.searchHistory.length === 0) return;
        
        this.elements.historyItems.innerHTML = this.searchHistory.map(item => {
            const time = new Date(item.timestamp).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="history-item" onclick="searchManager.useHistoryQuery('${this.escapeHtml(item.query)}')">
                    <span class="history-text">${this.escapeHtml(item.query)}</span>
                    <span class="history-time">${time}</span>
                </div>
            `;
        }).join('');
    }
    
    useHistoryQuery(query) {
        this.elements.searchInput.value = query;
        this.currentQuery = query;
        this.hideSearchHistory();
        this.resetAndSearch();
    }
}

// Global function to replace the placeholder showSearch function
function showSearch() {
    // Redirect to search page or initialize search
    if (window.location.pathname.includes('search.html')) {
        // Already on search page, just focus the input
        if (window.searchManager) {
            window.searchManager.elements.searchInput.focus();
        }
    } else {
        // Redirect to search page
        window.location.href = 'search.html';
    }
}