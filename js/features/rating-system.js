/**
 * 評価・コメントシステム
 * 問題に対する星評価とコメント機能を提供
 */

class RatingSystem {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'https://api.allfrom0.top';
        this.questionId = options.questionId || null;
        this.userId = options.userId || null;
        this.currentUser = options.currentUser || null;
        this.container = options.container || null;

        // 状態管理
        this.userRating = null;
        this.stats = null;
        this.ratings = [];
        this.isLoading = false;

        // UI要素
        this.elements = {};

        if (this.container) {
            this.init();
        }
    }

    /**
     * 初期化
     */
    init() {
        this.createUI();
        this.bindEvents();
        this.loadData();
    }

    /**
     * UIの生成
     */
    createUI() {
        this.container.innerHTML = `
            <div class="rating-system">
                <!-- 評価入力エリア -->
                <div class="rating-input-section">
                    <h3 class="rating-title">この問題を評価</h3>
                    <div class="rating-input-area">
                        <div class="star-rating" id="star-rating">
                            <span class="star" data-rating="1">★</span>
                            <span class="star" data-rating="2">★</span>
                            <span class="star" data-rating="3">★</span>
                            <span class="star" data-rating="4">★</span>
                            <span class="star" data-rating="5">★</span>
                        </div>
                        <div class="rating-text" id="rating-text">評価を選択してください</div>
                    </div>
                    <div class="comment-input-area">
                        <textarea
                            id="comment-input"
                            placeholder="コメントを入力してください（任意）"
                            rows="3"
                            maxlength="500"
                        ></textarea>
                        <div class="comment-actions">
                            <span class="comment-count" id="comment-count">0/500</span>
                            <button type="button" class="submit-rating-btn" id="submit-rating">
                                <span class="material-icons">send</span>
                                投稿
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 評価統計エリア -->
                <div class="rating-stats-section">
                    <h3 class="stats-title">評価統計</h3>
                    <div class="stats-content" id="stats-content">
                        <div class="stats-overview">
                            <div class="average-rating">
                                <span class="average-value" id="average-value">-</span>
                                <span class="rating-max">/5</span>
                            </div>
                            <div class="rating-count">
                                <span id="total-count">0</span>件の評価
                            </div>
                        </div>
                        <div class="rating-distribution" id="rating-distribution">
                            <!-- 評価分布がここに表示される -->
                        </div>
                    </div>
                </div>

                <!-- 評価一覧エリア -->
                <div class="ratings-list-section">
                    <h3 class="ratings-title">評価・コメント一覧</h3>
                    <div class="ratings-filter">
                        <select id="sort-select" class="sort-select">
                            <option value="newest">最新順</option>
                            <option value="highest">評価が高い順</option>
                            <option value="lowest">評価が低い順</option>
                        </select>
                    </div>
                    <div class="ratings-list" id="ratings-list">
                        <div class="loading-spinner" id="loading-spinner">
                            <div class="spinner"></div>
                            <p>読み込み中...</p>
                        </div>
                    </div>
                    <div class="load-more-container">
                        <button type="button" class="load-more-btn" id="load-more" style="display: none;">
                            もっと見る
                        </button>
                    </div>
                </div>
            </div>
        `;

        // UI要素の参照を保存
        this.elements = {
            starRating: this.container.querySelector('#star-rating'),
            stars: this.container.querySelectorAll('.star'),
            ratingText: this.container.querySelector('#rating-text'),
            commentInput: this.container.querySelector('#comment-input'),
            commentCount: this.container.querySelector('#comment-count'),
            submitBtn: this.container.querySelector('#submit-rating'),
            averageValue: this.container.querySelector('#average-value'),
            totalCount: this.container.querySelector('#total-count'),
            ratingDistribution: this.container.querySelector('#rating-distribution'),
            sortSelect: this.container.querySelector('#sort-select'),
            ratingsList: this.container.querySelector('#ratings-list'),
            loadingSpinner: this.container.querySelector('#loading-spinner'),
            loadMoreBtn: this.container.querySelector('#load-more')
        };
    }

    /**
     * イベントのバインド
     */
    bindEvents() {
        // 星評価クリック
        this.elements.stars.forEach(star => {
            star.addEventListener('click', (e) => this.handleStarClick(e));
            star.addEventListener('mouseenter', (e) => this.handleStarHover(e));
        });

        this.elements.starRating.addEventListener('mouseleave', () => {
            this.updateStarDisplay(this.userRating?.rating || 0);
        });

        // コメント入力
        this.elements.commentInput.addEventListener('input', (e) => {
            this.elements.commentCount.textContent = `${e.target.value.length}/500`;
        });

        // 投稿ボタン
        this.elements.submitBtn.addEventListener('click', () => this.submitRating());

        // ソート選択
        this.elements.sortSelect.addEventListener('change', () => {
            this.loadRatings(1, true);
        });

        // もっと見るボタン
        this.elements.loadMoreBtn.addEventListener('click', () => {
            const currentPage = Math.ceil(this.ratings.length / 20) + 1;
            this.loadRatings(currentPage, false);
        });
    }

    /**
     * 星クリック処理
     */
    handleStarClick(e) {
        const rating = parseInt(e.target.dataset.rating);
        this.updateStarDisplay(rating);
        this.updateRatingText(rating);
    }

    /**
     * 星ホバー処理
     */
    handleStarHover(e) {
        const rating = parseInt(e.target.dataset.rating);
        this.updateStarDisplay(rating);
    }

    /**
     * 星表示の更新
     */
    updateStarDisplay(rating) {
        this.elements.stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * 評価テキストの更新
     */
    updateRatingText(rating) {
        const texts = [
            '',
            'とても役に立たなかった',
            'あまり役に立たなかった',
            '普通',
            '役に立った',
            'とても役に立った'
        ];
        this.elements.ratingText.textContent = texts[rating] || '評価を選択してください';
    }

    /**
     * データの読み込み
     */
    async loadData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadRatings(1, true)
            ]);
            // 珎在のユーザーの評価をロード
            await this.loadUserRating();
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            this.showError('データの読み込みに失敗しました');
        }
    }

    /**
     * 珎在のユーザーの評価をロード
     */
    async loadUserRating() {
        if (!this.userId) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ratings/user/current?questionId=${this.questionId}&userId=${this.userId}`);
            const data = await response.json();

            if (data.success && data.data.rating) {
                this.userRating = data.data.rating;
                this.updateStarDisplay(this.userRating.rating);
                this.updateRatingText(this.userRating.rating);
                this.elements.commentInput.value = this.userRating.comment || '';
                this.elements.commentCount.textContent = `${(this.userRating.comment || '').length}/500`;
            }
        } catch (error) {
            console.error('ユーザー評価読み込みエラー:', error);
            // エラーがあっても処理を続行
        }
    }

    /**
     * 評価統計の読み込み
     */
    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ratings/${this.questionId}/stats`);
            const data = await response.json();

            if (data.success) {
                this.stats = data.data;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('統計読み込みエラー:', error);
        }
    }

    /**
     * 評価一覧の読み込み
     */
    async loadRatings(page = 1, reset = false) {
        if (this.isLoading) return;

        this.isLoading = true;

        if (reset) {
            this.ratings = [];
            this.elements.ratingsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>読み込み中...</p></div>';
        }

        try {
            const sort = this.elements.sortSelect.value;
            const response = await fetch(
                `${this.apiBaseUrl}/api/ratings/${this.questionId}?page=${page}&limit=20&sort=${sort}`
            );
            const data = await response.json();

            if (data.success) {
                if (reset) {
                    this.ratings = data.data.ratings;
                } else {
                    this.ratings = [...this.ratings, ...data.data.ratings];
                }

                this.updateRatingsList();
                this.updateLoadMoreButton(data.data.pagination.hasMore);
            }
        } catch (error) {
            console.error('評価一覧読み込みエラー:', error);
            this.showError('評価の読み込みに失敗しました');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 評価統計表示の更新
     */
    updateStatsDisplay() {
        if (!this.stats) return;

        this.elements.averageValue.textContent = this.stats.stats.averageRating.toFixed(1);
        this.elements.totalCount.textContent = this.stats.stats.totalCount;

        // 評価分布の生成
        const distributionHtml = [5, 4, 3, 2, 1].map(rating => {
            const count = this.stats.distribution.find(d => d.rating === rating)?.count || 0;
            const percentage = this.stats.stats.totalCount > 0 ? (count / this.stats.stats.totalCount * 100) : 0;

            return `
                <div class="distribution-row">
                    <span class="rating-label">${rating}★</span>
                    <div class="rating-bar">
                        <div class="rating-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="rating-count">${count}</span>
                </div>
            `;
        }).join('');

        this.elements.ratingDistribution.innerHTML = distributionHtml;
    }

    /**
     * 評価一覧表示の更新
     */
    updateRatingsList() {
        if (this.ratings.length === 0) {
            this.elements.ratingsList.innerHTML = '<div class="no-ratings">まだ評価がありません</div>';
            return;
        }

        const ratingsHtml = this.ratings.map(rating => this.createRatingItem(rating)).join('');
        this.elements.ratingsList.innerHTML = ratingsHtml;

        // 削除ボタンにイベントリスナーを追加
        this.elements.ratingsList.querySelectorAll('.delete-rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteRating(e));
        });
    }

    /**
     * 評価削除の処理
     */
    async handleDeleteRating(e) {
        const btn = e.currentTarget;
        const ratingId = btn.dataset.id;

        if (!confirm('本当にこの評価を削除しますか？')) {
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner small"></div> 削除中...';

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ratings/${this.questionId}/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(data.message, 'success');
                await this.loadData(); // データを再読み込み
            } else {
                this.showMessage(data.error || '削除に失敗しました', 'error');
            }
        } catch (error) {
            console.error('評価削除エラー:', error);
            this.showMessage('削除に失敗しました', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons">delete</span> 削除';
        }
    }

    /**
     * 評価項目の生成
     */
    createRatingItem(rating) {
        const date = new Date(rating.created_at).toLocaleDateString('ja-JP');
        const avatar = this.createAvatar(rating);

        return `
            <div class="rating-item">
                <div class="rating-header">
                    <div class="user-info">
                        ${avatar}
                        <div class="user-details">
                            <div class="display-name">${rating.display_name || rating.user_id}</div>
                            <div class="rating-date">${date}</div>
                        </div>
                    </div>
                    <div class="rating-stars">
                        ${this.createStarDisplay(rating.rating)}
                    </div>
                </div>
                ${rating.comment ? `
                    <div class="rating-comment">
                        <p>${this.escapeHtml(rating.comment)}</p>
                    </div>
                ` : ''}
                ${rating.user_id === this.userId ? `
                    <div class="rating-actions">
                        <button type="button" class="delete-rating-btn" data-id="${rating.id}">
                            <span class="material-icons">delete</span>
                            削除
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * アバターの生成
     */
    createAvatar(rating) {
        if (rating.avatar_type === 'color') {
            return `<div class="avatar" style="background-color: ${rating.avatar_value}"></div>`;
        } else {
            return `<img src="${rating.avatar_value}" alt="Avatar" class="avatar">`;
        }
    }

    /**
     * 星表示の生成
     */
    createStarDisplay(rating) {
        return Array.from({ length: 5 }, (_, i) =>
            `<span class="star ${i < rating ? 'active' : ''}">★</span>`
        ).join('');
    }

    /**
     * もっと見るボタンの更新
     */
    updateLoadMoreButton(hasMore) {
        this.elements.loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    }

    /**
     * 評価の投稿
     */
    async submitRating() {
        const rating = this.getSelectedRating();
        const comment = this.elements.commentInput.value.trim();

        if (rating === 0) {
            this.showMessage('評価を選択してください', 'error');
            return;
        }

        if (!this.userId) {
            this.showMessage('ログインが必要です', 'error');
            return;
        }

        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.innerHTML = '<div class="spinner small"></div> 投稿中...';

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/ratings/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionId: this.questionId,
                    userId: this.userId,
                    rating,
                    comment: comment || null
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(data.message, 'success');
                this.resetForm();
                await this.loadData();
            } else {
                this.showMessage(data.error || '投稿に失敗しました', 'error');
            }
        } catch (error) {
            console.error('評価投稿エラー:', error);
            this.showMessage('投稿に失敗しました', 'error');
        } finally {
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.innerHTML = '<span class="material-icons">send</span> 投稿';
        }
    }

    /**
     * 選択中の評価を取得
     */
    getSelectedRating() {
        const activeStar = this.elements.starRating.querySelector('.star.active');
        return activeStar ? parseInt(activeStar.dataset.rating) : 0;
    }

    /**
     * フォームのリセット
     */
    resetForm() {
        this.updateStarDisplay(0);
        this.elements.ratingText.textContent = '評価を選択してください';
        this.elements.commentInput.value = '';
        this.elements.commentCount.textContent = '0/500';
    }

    /**
     * メッセージ表示
     */
    showMessage(message, type = 'info') {
        // メッセージ表示の実装
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        this.container.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    /**
     * エラー表示
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * HTMLエスケープ
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// グローバルに公開
window.RatingSystem = RatingSystem;