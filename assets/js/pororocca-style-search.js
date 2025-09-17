/**
 * Pororocca Style Search Manager
 * pororoccaのUIとUXパターンを参考にした検索システム
 */

class PororoccaStyleSearchManager {
    constructor() {
        this.currentSubject = 'all';
        this.currentFilters = {};
        this.currentSort = 'newest';
        this.currentPage = 0;
        this.pageSize = 24; // 3x8グリッド想定
        this.viewMode = 'card';
        this.isLoading = false;
        this.hasMore = true;
        this.problems = [];
        
        // 認証とデータベースクライアント
        this.authClient = window.authClient || new AuthD1Client();
        this.questaClient = new QuestaD1Client();
        
        // DOM要素の初期化
        this.initializeElements();
        this.bindEvents();
        this.loadInitialData();
    }
    
    initializeElements() {
        this.elements = {
            subjectTabs: document.querySelectorAll('.nav-tabs .nav-link'),
            pageTitle: document.getElementById('pageTitle'),
            filterForm: document.getElementById('filterForm'),
            titleSearch: document.getElementById('titleSearch'),
            tagSearch: document.getElementById('tagSearch'),
            clearFilters: document.getElementById('clearFilters'),
            resultsCount: document.getElementById('resultsCount'),
            sortSelect: document.getElementById('sortSelect'),
            viewModeCards: document.querySelectorAll('input[name="viewMode"]'),
            problemsContainer: document.getElementById('problemsContainer'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            problemModal: new bootstrap.Modal(document.getElementById('problemModal')),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            viewProblemBtn: document.getElementById('viewProblemBtn')
        };
    }
    
    bindEvents() {
        // 科目タブクリック
        this.elements.subjectTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubjectChange(tab.dataset.subject);
            });
        });
        
        // フィルターフォーム送信
        this.elements.filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyFilters();
        });
        
        // フィルタークリア
        this.elements.clearFilters.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // ソート変更
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.resetAndLoad();
        });
        
        // 表示モード変更
        this.elements.viewModeCards.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.viewMode = e.target.value;
                this.renderProblems();
            });
        });
        
        // さらに読み込む
        this.elements.loadMoreBtn.addEventListener('click', () => {
            this.loadMore();
        });
        
        // リアルタイム検索（デバウンス）
        let debounceTimer;
        [this.elements.titleSearch, this.elements.tagSearch].forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        });
    }
    
    async loadInitialData() {
        this.showLoading();
        await this.searchProblems();
    }
    
    handleSubjectChange(subject) {
        // タブの見た目を更新
        this.elements.subjectTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-subject="${subject}"]`).classList.add('active');
        
        // タイトル更新
        const subjectNames = {
            all: '全問題検索',
            math: '数学問題検索',
            english: '英語問題検索',
            chemistry: '化学問題検索',
            physics: '物理問題検索'
        };
        this.elements.pageTitle.textContent = subjectNames[subject] || '問題検索';
        
        this.currentSubject = subject;
        this.resetAndLoad();
    }
    
    applyFilters() {
        const formData = new FormData(this.elements.filterForm);
        
        this.currentFilters = {
            title: formData.get('title') || '',
            tag: formData.get('tag') || '',
            difficulties: formData.getAll('difficulty').map(Number),
            types: formData.getAll('type')
        };
        
        this.resetAndLoad();
    }
    
    clearFilters() {
        this.elements.filterForm.reset();
        this.currentFilters = {};
        this.resetAndLoad();
    }
    
    async resetAndLoad() {
        this.currentPage = 0;
        this.problems = [];
        this.hasMore = true;
        this.showLoading();
        await this.searchProblems();
    }
    
    async searchProblems() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        
        try {
            // 検索パラメータを構築
            const query = [this.currentFilters.title, this.currentFilters.tag]
                .filter(Boolean).join(' ');
            
            const filters = {
                subjects: this.currentSubject === 'all' ? [] : [this.currentSubject],
                difficulties: this.currentFilters.difficulties || [],
                types: this.currentFilters.types || []
            };
            
            // ソートマッピング
            const sortMapping = {
                newest: 'created_desc',
                oldest: 'created_asc',
                difficulty_asc: 'difficulty_asc',
                difficulty_desc: 'difficulty_desc',
                relevance: 'relevance'
            };
            
            const results = await this.questaClient.searchQuestions(
                query,
                filters,
                sortMapping[this.currentSort] || 'created_desc',
                this.pageSize,
                this.currentPage * this.pageSize
            );
            
            if (this.currentPage === 0) {
                this.problems = results;
            } else {
                this.problems = [...this.problems, ...results];
            }
            
            this.hasMore = results.length === this.pageSize;
            this.renderProblems();
            this.updateResultsCount();
            
        } catch (error) {
            console.error('検索エラー:', error);
            this.showError('検索中にエラーが発生しました。');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async loadMore() {
        this.currentPage++;
        await this.searchProblems();
    }
    
    renderProblems() {
        const container = this.elements.problemsContainer;
        
        if (this.problems.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            this.elements.loadMoreBtn.style.display = 'none';
            return;
        }
        
        if (this.viewMode === 'card') {
            container.innerHTML = this.renderCardView();
        } else {
            container.innerHTML = this.renderListView();
        }
        
        // イベントリスナーを再バインド
        this.bindProblemEvents();
        
        // さらに読み込むボタンの表示制御
        this.elements.loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
        
        // MathJaxを再レンダリング
        if (window.MathJax) {
            MathJax.typesetPromise([container]).catch(err => {
                console.error('MathJax rendering error:', err);
            });
        }
    }
    
    renderCardView() {
        const cardsHTML = this.problems.map(problem => this.createProblemCard(problem)).join('');
        return `<div class="row">${cardsHTML}</div>`;
    }
    
    renderListView() {
        const listHTML = this.problems.map(problem => this.createProblemListItem(problem)).join('');
        return `<div class="list-group">${listHTML}</div>`;
    }
    
    createProblemCard(problem) {
        const difficulty = this.getDifficultyStars(problem.difficulty || 3);
        const subjectBadge = this.getSubjectBadge(problem.subject);
        const typeBadge = this.getTypeBadge(problem.type);
        const tags = this.formatTags(problem.tags);
        const timeAgo = this.getTimeAgo(problem.created_at);
        
        return `
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card shadow-sm problem-card" data-problem-id="${problem.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <h5 class="card-title mb-1">
                                    <a href="#" class="text-decoration-none">${this.escapeHtml(problem.title || '無題')}</a>
                                </h5>
                                <div class="problem-meta mb-2">
                                    <span class="text-nowrap me-2">
                                        <img src="assets/img/default-avatar.png" alt="" style="height:1em;" class="me-1">
                                        <strong>作成者</strong>
                                    </span>
                                    ${typeBadge}
                                    <small class="text-nowrap">
                                        難易度: <span class="difficulty-stars">${difficulty}</span>
                                    </small>
                                </div>
                            </div>
                            <div class="text-end text-nowrap">
                                <small class="text-muted" title="${problem.created_at}">
                                    ${timeAgo}
                                </small>
                                <div class="mt-1">
                                    <button class="btn btn-primary btn-sm like-button" type="button">
                                        <i class="fas fa-thumbs-up"></i> <span>0</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-text">
                            <div class="problem-preview mb-2">
                                ${this.truncateText(problem.question_text || problem.question || '', 100)}
                            </div>
                            ${subjectBadge}
                            ${tags}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createProblemListItem(problem) {
        const difficulty = this.getDifficultyStars(problem.difficulty || 3);
        const subjectBadge = this.getSubjectBadge(problem.subject);
        const typeBadge = this.getTypeBadge(problem.type);
        const tags = this.formatTags(problem.tags);
        const timeAgo = this.getTimeAgo(problem.created_at);
        
        return `
            <div class="list-group-item list-group-item-action" data-problem-id="${problem.id}">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${this.escapeHtml(problem.title || '無題')}</h6>
                        <p class="mb-1">${this.truncateText(problem.question_text || problem.question || '', 150)}</p>
                        <div class="mb-1">
                            ${subjectBadge}
                            ${typeBadge}
                            <small class="text-muted">難易度: <span class="difficulty-stars">${difficulty}</span></small>
                        </div>
                        ${tags}
                    </div>
                    <div class="text-end ms-3">
                        <small class="text-muted">${timeAgo}</small>
                        <div class="mt-1">
                            <button class="btn btn-primary btn-sm like-button" type="button">
                                <i class="fas fa-thumbs-up"></i> 0
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindProblemEvents() {
        // 問題カードクリック
        document.querySelectorAll('[data-problem-id]').forEach(element => {
            element.addEventListener('click', (e) => {
                if (!e.target.closest('.like-button')) {
                    const problemId = element.dataset.problemId;
                    this.showProblemDetail(problemId);
                }
            });
        });
        
        // いいねボタン
        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleLike(button);
            });
        });
    }
    
    async showProblemDetail(problemId) {
        try {
            const problem = this.problems.find(p => p.id === problemId);
            if (!problem) return;
            
            this.elements.modalTitle.textContent = problem.title || '問題詳細';
            this.elements.modalBody.innerHTML = this.createProblemDetailHTML(problem);
            this.elements.viewProblemBtn.href = `#problem/${problemId}`;
            
            this.elements.problemModal.show();
            
            // MathJaxを再レンダリング
            if (window.MathJax) {
                MathJax.typesetPromise([this.elements.modalBody]).catch(err => {
                    console.error('MathJax rendering error:', err);
                });
            }
        } catch (error) {
            console.error('問題詳細表示エラー:', error);
        }
    }
    
    createProblemDetailHTML(problem) {
        const difficulty = this.getDifficultyStars(problem.difficulty || 3);
        const subjectBadge = this.getSubjectBadge(problem.subject);
        const typeBadge = this.getTypeBadge(problem.type);
        const tags = this.formatTags(problem.tags);
        
        let choicesHTML = '';
        if (problem.type === 'mc' && problem.choices) {
            choicesHTML = `
                <div class="mt-3">
                    <h6>選択肢</h6>
                    <ol>
                        ${problem.choices.map((choice, index) => 
                            `<li>${this.escapeHtml(choice)}</li>`
                        ).join('')}
                    </ol>
                </div>
            `;
        }
        
        return `
            <div class="problem-detail">
                <div class="mb-3">
                    ${subjectBadge}
                    ${typeBadge}
                    <span class="badge bg-warning text-dark">
                        難易度: <span class="difficulty-stars">${difficulty}</span>
                    </span>
                </div>
                
                <div class="mb-3">
                    <h6>問題文</h6>
                    <div class="border rounded p-3 bg-light">
                        ${problem.question_text || problem.question || '問題文がありません'}
                    </div>
                </div>
                
                ${choicesHTML}
                
                ${problem.explanation ? `
                    <div class="mt-3">
                        <h6>解説</h6>
                        <div class="border rounded p-3 bg-light">
                            ${problem.explanation}
                        </div>
                    </div>
                ` : ''}
                
                ${tags}
                
                <div class="mt-3 text-muted">
                    <small>
                        <i class="fas fa-clock"></i> 
                        作成日: ${this.formatDate(problem.created_at)}
                    </small>
                </div>
            </div>
        `;
    }
    
    handleLike(button) {
        // いいね機能の実装
        const currentCount = parseInt(button.querySelector('span').textContent);
        button.querySelector('span').textContent = currentCount + 1;
        
        // アニメーション効果
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }
    
    // ユーティリティメソッド
    getDifficultyStars(difficulty) {
        const fullStars = Math.floor(difficulty);
        const halfStar = difficulty % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (halfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }
    
    getSubjectBadge(subject) {
        const subjects = {
            math: { name: '数学', class: 'bg-primary' },
            english: { name: '英語', class: 'bg-success' },
            chemistry: { name: '化学', class: 'bg-info' },
            physics: { name: '物理', class: 'bg-warning text-dark' },
            biology: { name: '生物', class: 'bg-secondary' }
        };
        
        const subjectInfo = subjects[subject] || { name: subject, class: 'bg-dark' };
        return `<span class="badge ${subjectInfo.class} me-1">${subjectInfo.name}</span>`;
    }
    
    getTypeBadge(type) {
        const types = {
            mc: { name: '選択式', class: 'bg-primary' },
            open: { name: '記述式', class: 'bg-success' },
            auto: { name: '自動ジャッジ', class: 'bg-info' }
        };
        
        const typeInfo = types[type] || { name: type, class: 'bg-secondary' };
        return `<span class="badge ${typeInfo.class} me-1">${typeInfo.name}</span>`;
    }
    
    formatTags(tags) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) return '';
        
        const tagElements = tags.map(tag => 
            `<span class="problem-tag">${this.escapeHtml(tag)}</span>`
        ).join('');
        
        return `<div class="problem-tags mt-2">${tagElements}</div>`;
    }
    
    getTimeAgo(dateString) {
        if (!dateString) return '不明';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '今日';
        if (diffDays === 1) return '1日前';
        if (diffDays < 7) return `${diffDays}日前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
        return `${Math.floor(diffDays / 365)}年前`;
    }
    
    formatDate(dateString) {
        if (!dateString) return '不明';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateResultsCount() {
        const total = this.problems.length;
        const moreIndicator = this.hasMore ? '+' : '';
        this.elements.resultsCount.innerHTML = `
            <i class="fas fa-list"></i> ${total}${moreIndicator}件の問題
        `;
    }
    
    showLoading() {
        this.elements.problemsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">読み込み中...</span>
                </div>
            </div>
        `;
    }
    
    hideLoading() {
        // renderProblems()で置き換えられるため、特に処理不要
    }
    
    showError(message) {
        this.elements.problemsContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
    }
    
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h4>問題が見つかりませんでした</h4>
                <p>検索条件を変更してお試しください</p>
            </div>
        `;
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 認証クライアントの初期化
    if (typeof AuthD1Client !== 'undefined') {
        window.authClient = new AuthD1Client();
    }
    
    // 検索マネージャーの初期化
    window.searchManager = new PororoccaStyleSearchManager();
});

// グローバル関数として公開
window.PororoccaStyleSearchManager = PororoccaStyleSearchManager;