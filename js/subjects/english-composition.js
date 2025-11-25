/**
 * 英作文添削システム
 * SGIFフレームワークに基づいた英作文添削機能を提供
 */

class EnglishCompositionSystem {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'https://api.allfrom0.top';
        this.userId = options.userId || null;
        this.container = options.container || null;

        // 状態管理
        this.currentText = '';
        this.correctionResult = null;
        this.isProcessing = false;
        this.history = [];

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
        this.loadHistory();
    }

    /**
     * UIの生成
     */
    createUI() {
        this.container.innerHTML = `
            <div class="english-composition-system">
                <!-- ヘッダー -->
                <div class="composition-header">
                    <h2 class="composition-title">
                        <span class="material-symbols-outlined">edit_note</span>
                        英作文添削システム
                    </h2>
                </div>

                <!-- 入力エリア -->
                <div class="composition-input-section">
                    <div class="input-header">
                        <h3>英作文を入力してください</h3>
                        <div class="input-controls">
                            <span class="char-count" id="char-count">0/5000</span>
                            <button type="button" class="clear-btn" id="clear-btn">
                                <span class="material-symbols-outlined">clear</span>
                                クリア
                            </button>
                        </div>
                    </div>
                    <div class="textarea-container">
                        <textarea
                            id="composition-text"
                            placeholder="ここに英作文を入力してください...&#10;&#10;例：&#10;I went to school yesterday. I learned many interesting things about science. The teacher was very kind and helped us understand difficult concepts."
                            maxlength="5000"
                            rows="8"
                        ></textarea>
                    </div>
                    <div class="submit-section">
                        <button type="button" class="submit-composition-btn" id="submit-composition">
                            <span class="material-symbols-outlined">spellcheck</span>
                            添削を開始
                        </button>
                    </div>
                </div>

                <!-- 処理中表示 -->
                <div class="processing-section" id="processing-section" style="display: none;">
                    <div class="processing-content">
                        <div class="spinner"></div>
                        <p>AIによる添削中...</p>
                        <div class="processing-details">
                            <small>SGIFフレームワークで分析中</small>
                        </div>
                    </div>
                </div>

                <!-- 結果表示エリア -->
                <div class="result-section" id="result-section" style="display: none;">
                    <div class="result-header">
                        <div class="result-title-row">
                            <h3>添削結果</h3>
                            <div class="score-display" id="score-display">
                                <div class="grade-badge" id="grade-badge" data-grade="">
                                    <span class="grade-letter">--</span>
                                </div>
                                <div class="score-info">
                                    <span class="score-value" id="score-value">--</span>
                                    <span class="score-max">/100点</span>
                                </div>
                            </div>
                        </div>
                        <div class="global-evaluation" id="global-evaluation" style="display: none;">
                            <span class="material-symbols-outlined">edit_note</span>
                            <span class="evaluation-text" id="evaluation-text"></span>
                        </div>
                        <div class="result-meta">
                            <span class="confidence-badge" id="confidence-badge">
                                <span class="material-symbols-outlined">analytics</span>
                                信頼度: <span id="confidence-value">--</span>
                            </span>
                            <span class="processing-time">
                                <span class="material-symbols-outlined">timer</span>
                                処理時間: <span id="processing-time-value">--</span>ms
                            </span>
                        </div>
                    </div>

                    <!-- 比較表示 -->
                    <div class="comparison-section">
                        <div class="comparison-container">
                            <div class="original-text">
                                <h4>原文</h4>
                                <div class="text-content" id="original-text"></div>
                            </div>
                            <div class="arrow-separator">
                                <span class="material-symbols-outlined">arrow_forward</span>
                            </div>
                            <div class="corrected-text">
                                <h4>添削後</h4>
                                <div class="text-content" id="corrected-text"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 詳細分析 -->
                    <div class="analysis-section" id="analysis-section">
                        <h4>詳細な分析</h4>
                        <div class="error-list" id="error-list">
                            <!-- エラー項目がここに表示される -->
                        </div>
                    </div>

                    <!-- 改善提案 -->
                    <div class="suggestions-section" id="suggestions-section">
                        <h4>改善提案</h4>
                        <div class="suggestion-list" id="suggestion-list">
                            <!-- 提案がここに表示される -->
                        </div>
                    </div>

                    <!-- アクションボタン -->
                    <div class="result-actions">
                        <button type="button" class="copy-btn" id="copy-corrected">
                            <span class="material-symbols-outlined">content_copy</span>
                            添削文をコピー
                        </button>
                        <button type="button" class="new-composition-btn" id="new-composition">
                            <span class="material-symbols-outlined">add</span>
                            新しい英作文
                        </button>
                    </div>
                </div>

                <!-- 履歴セクション -->
                <div class="history-section">
                    <div class="history-header">
                        <h3>添削履歴</h3>
                        <button type="button" class="toggle-history-btn" id="toggle-history">
                            <span class="material-symbols-outlined">history</span>
                            履歴
                        </button>
                    </div>
                    <div class="history-content" id="history-content" style="display: none;">
                        <div class="history-list" id="history-list">
                            <!-- 履歴項目がここに表示される -->
                        </div>
                        <div class="history-actions">
                            <button type="button" class="load-more-btn" id="load-more-history">
                                もっと見る
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // UI要素の参照を保存
        this.elements = {
            textArea: this.container.querySelector('#composition-text'),
            charCount: this.container.querySelector('#char-count'),
            clearBtn: this.container.querySelector('#clear-btn'),
            submitBtn: this.container.querySelector('#submit-composition'),
            processingSection: this.container.querySelector('#processing-section'),
            resultSection: this.container.querySelector('#result-section'),
            scoreDisplay: this.container.querySelector('#score-display'),
            gradeBadge: this.container.querySelector('#grade-badge'),
            scoreValue: this.container.querySelector('#score-value'),
            globalEvaluation: this.container.querySelector('#global-evaluation'),
            evaluationText: this.container.querySelector('#evaluation-text'),
            confidenceValue: this.container.querySelector('#confidence-value'),
            processingTimeValue: this.container.querySelector('#processing-time-value'),
            originalText: this.container.querySelector('#original-text'),
            correctedText: this.container.querySelector('#corrected-text'),
            errorList: this.container.querySelector('#error-list'),
            suggestionList: this.container.querySelector('#suggestion-list'),
            copyBtn: this.container.querySelector('#copy-corrected'),
            newCompositionBtn: this.container.querySelector('#new-composition'),
            toggleHistoryBtn: this.container.querySelector('#toggle-history'),
            historyContent: this.container.querySelector('#history-content'),
            historyList: this.container.querySelector('#history-list'),
            loadMoreBtn: this.container.querySelector('#load-more-history')
        };
    }

    /**
     * イベントのバインド
     */
    bindEvents() {
        // テキスト入力
        this.elements.textArea.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });

        // クリアボタン
        this.elements.clearBtn.addEventListener('click', () => {
            this.clearText();
        });

        // 提出ボタン
        this.elements.submitBtn.addEventListener('click', () => {
            this.submitComposition();
        });

        // コピー機能
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => {
                this.copyCorrectedText();
            });
        }

        // 新しい英作文
        if (this.elements.newCompositionBtn) {
            this.elements.newCompositionBtn.addEventListener('click', () => {
                this.startNewComposition();
            });
        }

        // 履歴の開閉
        if (this.elements.toggleHistoryBtn) {
            this.elements.toggleHistoryBtn.addEventListener('click', () => {
                this.toggleHistory();
            });
        }

        // もっと見る
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => {
                this.loadMoreHistory();
            });
        }

        // Enterキーで提出（Shift+Enterは改行）
        this.elements.textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitComposition();
            }
        });
    }

    /**
     * 文字数カウント更新
     */
    updateCharCount(count) {
        this.elements.charCount.textContent = `${count}/5000`;
        if (count > 4500) {
            this.elements.charCount.classList.add('warning');
        } else {
            this.elements.charCount.classList.remove('warning');
        }
    }

    /**
     * テキストをクリア
     */
    clearText() {
        this.elements.textArea.value = '';
        this.updateCharCount(0);
        this.hideResult();
    }

    /**
     * 英作文を提出
     */
    async submitComposition() {
        const text = this.elements.textArea.value.trim();

        if (!text) {
            this.showMessage('英作文を入力してください', 'error');
            return;
        }

        if (!this.userId) {
            this.showMessage('ログインが必要です', 'error');
            return;
        }

        if (this.isProcessing) {
            return;
        }

        this.showProcessing();
        this.isProcessing = true;

        try {
            // セッショントークンを取得
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            // 認証ヘッダーがある場合は追加
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/english/compose`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    userId: this.userId,
                    text: text
                })
            });

            const data = await response.json();

            if (data.success) {
                this.correctionResult = data.data;
                this.showResult();
                this.addToHistory(data.data);
            } else {
                this.showMessage(data.error || '添削に失敗しました', 'error');
                this.hideProcessing();
            }

        } catch (error) {
            console.error('Composition submission error:', error);
            this.showMessage('添削に失敗しました', 'error');
            this.hideProcessing();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 処理中表示
     */
    showProcessing() {
        this.elements.processingSection.style.display = 'block';
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.innerHTML = '<div class="spinner small"></div> 処理中...';
    }

    /**
     * 処理中を非表示
     */
    hideProcessing() {
        this.elements.processingSection.style.display = 'none';
        this.elements.submitBtn.disabled = false;
        this.elements.submitBtn.innerHTML = '<span class="material-symbols-outlined">spellcheck</span> 添削を開始';
    }

    /**
     * 結果表示
     */
    showResult() {
        if (!this.correctionResult) return;

        this.hideProcessing();
        this.elements.resultSection.style.display = 'block';

        // データ形式の互換性を確保（snake_caseとcamelCaseの両方に対応）
        const result = {
            confidenceScore: this.correctionResult.confidenceScore || this.correctionResult.confidence_score || 0,
            processingTime: this.correctionResult.processingTime || this.correctionResult.processing_time || 0,
            sgifCategory: this.correctionResult.sgifCategory || this.correctionResult.sgif_category || '',
            originalText: this.correctionResult.originalText || this.correctionResult.original_text || this.correctionResult.input_text || '',
            correctedText: this.correctionResult.correctedText || this.correctionResult.corrected_text || '',
            errorAnalysis: this.correctionResult.errorAnalysis || this.correctionResult.error_analysis || this.correctionResult.errors || [],
            suggestions: this.correctionResult.suggestions || this.correctionResult.suggestions || this.correctionResult.examples_exp || [],
            global: this.correctionResult.global || null
        };

        // グレードとスコアの表示
        if (result.global) {
            const grade = result.global.grade || '--';
            const score = result.global.score !== undefined ? result.global.score : '--';
            const explanation = result.global.explanation || '';

            // グレードバッジを更新
            const gradeLetter = this.elements.gradeBadge.querySelector('.grade-letter');
            gradeLetter.textContent = grade;
            this.elements.gradeBadge.setAttribute('data-grade', grade);

            // スコアを更新
            this.elements.scoreValue.textContent = score;

            // 総合評価を表示
            if (explanation) {
                this.elements.evaluationText.textContent = explanation;
                this.elements.globalEvaluation.style.display = 'flex';
            } else {
                this.elements.globalEvaluation.style.display = 'none';
            }
        } else {
            // globalフィールドがない場合はデフォルト表示
            const gradeLetter = this.elements.gradeBadge.querySelector('.grade-letter');
            gradeLetter.textContent = '--';
            this.elements.gradeBadge.setAttribute('data-grade', '');
            this.elements.scoreValue.textContent = '--';
            this.elements.globalEvaluation.style.display = 'none';
        }

        // メタ情報
        this.elements.confidenceValue.textContent =
            Math.round(result.confidenceScore * 100) + '%';
        this.elements.processingTimeValue.textContent =
            result.processingTime || '--';

        // テキスト比較
        this.elements.originalText.textContent = result.originalText;
        this.elements.correctedText.textContent = result.correctedText;

        // 詳細分析
        this.showErrorAnalysis(result.errorAnalysis);

        // 改善提案
        this.showSuggestions(result.suggestions);

        // スクロール
        this.elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 結果を非表示
     */
    hideResult() {
        this.elements.resultSection.style.display = 'none';
        this.correctionResult = null;
    }

    /**
     * エラー分析を表示
     */
    showErrorAnalysis(errorAnalysis) {
        if (!errorAnalysis || errorAnalysis.length === 0) {
            this.elements.errorList.innerHTML = '<p class="no-errors">エラーはありませんでした。素晴らしい英作文です！</p>';
            return;
        }

        const errorsHtml = errorAnalysis.map((error, index) => {
            const category = error.category || '--';
            const span = error.span || error.original || '--';
            const correction = error.correction || error.corrected || '--';
            const explanation = error.explanation || '';
            const deduction = error.deduction !== undefined ? error.deduction : null;

            return `
            <div class="error-item">
                <div class="error-header">
                    <span class="error-category error-category-${category}">${category}</span>
                    ${deduction !== null ? `<span class="error-deduction">${deduction}点</span>` : ''}
                    <span class="error-number">#${index + 1}</span>
                </div>
                <div class="error-content">
                    <div class="error-original">
                        <span class="label">誤り:</span>
                        <span class="text">${this.escapeHtml(span)}</span>
                    </div>
                    <div class="error-corrected">
                        <span class="label">修正:</span>
                        <span class="text corrected">${this.escapeHtml(correction)}</span>
                    </div>
                    ${explanation ? `
                    <div class="error-explanation">
                        <span class="material-symbols-outlined">info</span>
                        <span>${this.escapeHtml(explanation)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');

        this.elements.errorList.innerHTML = errorsHtml;
    }

    /**
     * 改善提案を表示
     */
    showSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.elements.suggestionList.innerHTML = '<p class="no-suggestions">追加の提案はありません。</p>';
            return;
        }

        const suggestionsHtml = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-header">
                    <span class="suggestion-type">${suggestion.type}</span>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-text">
                        <span class="material-symbols-outlined">lightbulb</span>
                        <span>${this.escapeHtml(suggestion.suggestion)}</span>
                    </div>
                    <div class="suggestion-reason">
                        <span class="label">理由:</span>
                        <span>${this.escapeHtml(suggestion.reason)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.suggestionList.innerHTML = suggestionsHtml;
    }

    /**
     * 添削文をコピー
     */
    async copyCorrectedText() {
        if (!this.correctionResult?.correctedText) return;

        try {
            await navigator.clipboard.writeText(this.correctionResult.correctedText);
            this.showMessage('添削文をコピーしました', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            this.showMessage('コピーに失敗しました', 'error');
        }
    }

    /**
     * 新しい英作文を開始
     */
    startNewComposition() {
        this.clearText();
        this.hideResult();
        this.elements.textArea.focus();
    }

    /**
     * 履歴の開閉
     */
    toggleHistory() {
        const isVisible = this.elements.historyContent.style.display !== 'none';

        if (isVisible) {
            this.elements.historyContent.style.display = 'none';
            this.elements.toggleHistoryBtn.innerHTML = '<span class="material-symbols-outlined">history</span> 履歴';
        } else {
            this.elements.historyContent.style.display = 'block';
            this.elements.toggleHistoryBtn.innerHTML = '<span class="material-symbols-outlined">history</span> 履歴';
            if (this.history.length === 0) {
                this.loadHistory();
            }
        }
    }

    /**
     * 履歴を読み込み（API未実装のため一時無効化）
     */
    async loadHistory() {
        // 履歴APIは未実装のため、ローカルストレージから読み込み
        try {
            const stored = localStorage.getItem(`composition_history_${this.userId}`);
            if (stored) {
                this.history = JSON.parse(stored);
                this.displayHistory();
            } else {
                this.history = [];
                this.displayHistory();
            }
        } catch (error) {
            console.error('History load error:', error);
            this.history = [];
            this.displayHistory();
        }
    }

    /**
     * 履歴を表示
     */
    displayHistory() {
        if (this.history.length === 0) {
            this.elements.historyList.innerHTML = '<p class="no-history">履歴がありません</p>';
            return;
        }

        const historyHtml = this.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-header">
                    <span class="history-date">${new Date(item.created_at).toLocaleString('ja-JP')}</span>
                    <span class="history-category">${item.sgif_category}</span>
                </div>
                <div class="history-preview">
                    <div class="original-preview">${this.escapeHtml(item.original_text.substring(0, 100))}${item.original_text.length > 100 ? '...' : ''}</div>
                </div>
                <div class="history-actions">
                    <button type="button" class="view-details-btn" data-id="${item.id}">
                        <span class="material-symbols-outlined">visibility</span>
                        詳細
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.historyList.innerHTML = historyHtml;

        // 詳細ボタンにイベントリスナーを追加
        this.elements.historyList.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const compositionId = e.currentTarget.dataset.id;
                this.loadCompositionDetails(compositionId);
            });
        });
    }

    /**
     * 添削詳細を読み込み（ローカルストレージから）
     */
    async loadCompositionDetails(compositionId) {
        try {
            // ローカル履歴から検索
            const item = this.history.find(h => h.id === compositionId);
            if (item) {
                this.correctionResult = item;
                this.showResult();
                const originalText = item.original_text || item.input_text || '';
                this.elements.textArea.value = originalText;
                this.updateCharCount(originalText.length);

                // 履歴を閉じる
                this.elements.historyContent.style.display = 'none';
                this.elements.toggleHistoryBtn.innerHTML = '<span class="material-symbols-outlined">history</span> 履歴';
            }
        } catch (error) {
            console.error('Composition details load error:', error);
            this.showMessage('詳細の読み込みに失敗しました', 'error');
        }
    }

    /**
     * 履歴に追加（ローカルストレージに保存）
     */
    addToHistory(composition) {
        // データ形式の互換性を確保（snake_caseとcamelCaseの両方に対応）
        const normalizedComposition = {
            ...composition,
            // snake_caseフィールドが存在しない場合はcamelCaseからコピー
            original_text: composition.original_text || composition.input_text || '',
            corrected_text: composition.corrected_text || composition.correctedText || '',
            sgif_category: composition.sgif_category || composition.sgifCategory || '',
            confidence_score: composition.confidence_score || composition.confidenceScore || 0,
            processing_time: composition.processing_time || composition.processingTime || 0
        };

        this.history.unshift(normalizedComposition);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        // ローカルストレージに保存
        try {
            localStorage.setItem(`composition_history_${this.userId}`, JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }

        this.displayHistory();
    }

    /**
     * メッセージ表示
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        this.container.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
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
window.EnglishCompositionSystem = EnglishCompositionSystem;