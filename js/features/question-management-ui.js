/**
 * Question Management System UI Controller
 * 問題管理システムのUI制御
 */

class QuestionManagementUI {
    constructor() {
        this.questionManager = new QuestionManager();
        this.currentQuestion = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateStatsDisplay();
    }

    setupEventListeners() {
        // 新規問題作成ボタン
        document.getElementById('new-question-btn').addEventListener('click', () => {
            this.openQuestionModal();
        });

        // フィルター
        document.getElementById('apply-filters-btn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // 並び替え
        document.getElementById('sort-field').addEventListener('change', () => {
            this.updateSorting();
        });

        document.getElementById('sort-order').addEventListener('change', () => {
            this.updateSorting();
        });

        // ページネーション
        document.getElementById('prev-page-btn').addEventListener('click', () => {
            this.changePage(-1);
        });

        document.getElementById('next-page-btn').addEventListener('click', () => {
            this.changePage(1);
        });

        // モーダル
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeQuestionModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeQuestionModal();
        });

        // 問題タイプ変更時のUI更新
        document.getElementById('type').addEventListener('change', (e) => {
            this.updateQuestionTypeUI(e.target.value);
        });

        // プレビュー
        document.getElementById('preview-btn').addEventListener('click', () => {
            this.previewQuestion();
        });

        document.getElementById('close-preview-btn').addEventListener('click', () => {
            this.closePreviewModal();
        });

        // フォーム送信
        document.getElementById('question-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveQuestion();
        });

        // 選択肢追加
        document.getElementById('add-option-btn').addEventListener('click', () => {
            this.addOptionField();
        });

        // エクスポート
        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.questionManager.exportToCSV();
        });

        document.getElementById('export-json-btn').addEventListener('click', () => {
            this.exportToJSON();
        });

        // インポート
        document.getElementById('import-btn').addEventListener('click', () => {
            this.openImportModal();
        });

        document.getElementById('close-import-btn').addEventListener('click', () => {
            this.closeImportModal();
        });

        document.getElementById('select-file-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // ドラッグ＆ドロップ
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }

    async loadInitialData() {
        try {
            await this.loadQuestions();
        } catch (error) {
            this.showError('問題の読み込みに失敗しました: ' + error.message);
        }
    }

    async loadQuestions() {
        try {
            this.showLoading();
            const filters = this.getCurrentFilters();
            const data = await this.questionManager.loadQuestions(filters);

            this.renderQuestions(data.questions);
            this.updatePagination(data.pagination);
            this.updateStats(data.statistics);
        } catch (error) {
            this.showError('問題一覧の読み込みに失敗しました: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    getCurrentFilters() {
        return {
            subject: document.getElementById('subject-filter').value,
            type: document.getElementById('type-filter').value,
            difficulty: document.getElementById('difficulty-filter').value,
            search: document.getElementById('search-filter').value,
            sort: document.getElementById('sort-field').value,
            order: document.getElementById('sort-order').value
        };
    }

    async applyFilters() {
        this.questionManager.currentPage = 1;
        await this.loadQuestions();
    }

    clearFilters() {
        document.getElementById('subject-filter').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('difficulty-filter').value = '';
        document.getElementById('search-filter').value = '';
        this.applyFilters();
    }

    updateSorting() {
        this.questionManager.sortField = document.getElementById('sort-field').value;
        this.questionManager.sortOrder = document.getElementById('sort-order').value;
        this.loadQuestions();
    }

    changePage(direction) {
        this.questionManager.currentPage += direction;
        this.loadQuestions();
    }

    renderQuestions(questions) {
        const container = document.getElementById('questions-list');
        const emptyState = document.getElementById('empty-state');

        if (questions.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = questions.map(question => this.renderQuestionCard(question)).join('');

        // イベントリスナーを再設定
        this.attachQuestionCardListeners();
    }

    renderQuestionCard(question) {
        const typeInfo = this.questionManager.QUESTION_TYPES[question.type] || { name: question.type, icon: '❓' };
        const difficultyInfo = this.questionManager.DIFFICULTY_LEVELS[question.difficulty] || { name: question.difficulty, color: '#gray' };

        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-meta">
                        <div class="question-id">${question.id}</div>
                        <div class="question-type">${typeInfo.icon} ${typeInfo.name}</div>
                        <div class="question-subject">${this.questionManager.SUBJECTS[question.subject] || question.subject}</div>
                    </div>
                    <div class="question-actions">
                        <button class="btn-edit" data-action="edit" data-id="${question.id}">編集</button>
                        <button class="btn-delete" data-action="delete" data-id="${question.id}">削除</button>
                    </div>
                </div>

                <div class="question-content">
                    <div class="question-text">${this.truncateText(question.question.text, 100)}</div>
                    ${question.question.translation ? `<div class="question-translation">${question.question.translation}</div>` : ''}

                    ${question.options.length > 0 ? `
                        <div class="question-options">
                            ${question.options.map((opt, index) =>
                                `<div class="option-item">${String.fromCharCode(65 + index)}. ${opt}</div>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="question-footer">
                    <div class="difficulty-badge difficulty-${question.difficulty}">
                        ${difficultyInfo.name}
                    </div>
                    <div class="validation-status status-${question.validation_status}">
                        ${this.getStatusText(question.validation_status)}
                    </div>
                    <div class="question-tags">
                        ${question.tags.slice(0, 3).map(tag =>
                            `<span class="tag">${tag}</span>`
                        ).join('')}
                        ${question.tags.length > 3 ? `<span class="tag">+${question.tags.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachQuestionCardListeners() {
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                const questionId = e.target.dataset.id;

                if (action === 'edit') {
                    await this.editQuestion(questionId);
                } else if (action === 'delete') {
                    await this.deleteQuestion(questionId);
                }
            });
        });
    }

    async editQuestion(questionId) {
        try {
            // APIから問題詳細を取得
            const response = await fetch(`/api/questions/${questionId}`);
            const data = await response.json();

            if (data.success) {
                this.currentQuestion = data.question;
                this.isEditMode = true;
                this.openQuestionModal(this.currentQuestion);
            } else {
                this.showError('問題の読み込みに失敗しました');
            }
        } catch (error) {
            this.showError('問題の読み込みに失敗しました: ' + error.message);
        }
    }

    async deleteQuestion(questionId) {
        if (!confirm('この問題を削除してもよろしいですか？')) {
            return;
        }

        try {
            await this.questionManager.deleteQuestion(questionId);
            await this.loadQuestions();
            this.showSuccess('問題を削除しました');
        } catch (error) {
            this.showError('問題の削除に失敗しました: ' + error.message);
        }
    }

    openQuestionModal(question = null) {
        this.currentQuestion = question;
        this.isEditMode = !!question;

        const modal = document.getElementById('question-modal');
        const form = document.getElementById('question-form');
        const modalTitle = document.getElementById('modal-title');

        modalTitle.textContent = this.isEditMode ? '問題編集' : '新規問題作成';

        if (this.isEditMode && question) {
            this.populateForm(question);
        } else {
            form.reset();
            this.updateQuestionTypeUI(document.getElementById('type').value);
        }

        modal.classList.add('active');
    }

    closeQuestionModal() {
        document.getElementById('question-modal').classList.remove('active');
        this.currentQuestion = null;
        this.isEditMode = false;
    }

    populateForm(question) {
        document.getElementById('subject').value = question.subject;
        document.getElementById('type').value = question.type;
        document.getElementById('difficulty').value = question.difficulty;
        document.getElementById('question_text').value = question.question.text;
        document.getElementById('question_translation').value = question.question.translation;
        document.getElementById('answer').value = question.answer;
        document.getElementById('explanation_simple').value = question.explanation.pl;
        document.getElementById('explanation_detailed').value = question.explanation.sp;
        document.getElementById('tags').value = question.tags.join(', ');
        document.getElementById('source').value = question.source;
        document.getElementById('grammar_point').value = question.grammar_point;
        document.getElementById('media_audio').value = question.media.audio;
        document.getElementById('media_image').value = question.media.image;
        document.getElementById('media_video').value = question.media.video;

        this.updateQuestionTypeUI(question.type);
        this.populateOptions(question.options);
    }

    populateOptions(options) {
        const container = document.getElementById('options-container');
        container.innerHTML = '';

        options.forEach((option, index) => {
            this.addOptionField(option);
        });
    }

    updateQuestionTypeUI(type) {
        const optionsSection = document.getElementById('options-section');
        const showOptions = ['multiple_choice', 'ordering'].includes(type);
        optionsSection.style.display = showOptions ? 'block' : 'none';

        if (showOptions && !this.isEditMode) {
            const container = document.getElementById('options-container');
            container.innerHTML = `
                <div class="option-item">
                    <input type="text" placeholder="選択肢 A" class="option-input">
                    <button type="button" class="btn-remove-option">×</button>
                </div>
                <div class="option-item">
                    <input type="text" placeholder="選択肢 B" class="option-input">
                    <button type="button" class="btn-remove-option">×</button>
                </div>
            `;
        }

        // 解答ラベルの更新
        const answerLabel = document.querySelector('label[for="answer"]');
        if (type === 'multiple_choice') {
            answerLabel.textContent = '正解選択肢 (A, B, C, D...)';
        } else if (type === 'fill_in_blank') {
            answerLabel.textContent = '解答 *';
        } else {
            answerLabel.textContent = '解答 *';
        }
    }

    addOptionField(value = '') {
        const container = document.getElementById('options-container');
        const optionIndex = container.children.length;
        const optionLetter = String.fromCharCode(65 + optionIndex);

        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.innerHTML = `
            <input type="text" placeholder="選択肢 ${optionLetter}" class="option-input" value="${value}">
            <button type="button" class="btn-remove-option">×</button>
        `;

        container.appendChild(optionItem);

        // 削除ボタンのイベントリスナー
        optionItem.querySelector('.btn-remove-option').addEventListener('click', () => {
            optionItem.remove();
        });
    }

    async saveQuestion() {
        try {
            const formData = this.getFormData();
            const question = this.questionManager.createQuestion(formData);

            const validation = this.questionManager.validateQuestion(question);
            if (!validation.isValid) {
                this.showError('入力エラー:\n' + validation.errors.join('\n'));
                return;
            }

            const savedQuestion = await this.questionManager.saveQuestion(question);

            this.closeQuestionModal();
            await this.loadQuestions();
            this.showSuccess(this.isEditMode ? '問題を更新しました' : '問題を作成しました');

        } catch (error) {
            this.showError('保存に失敗しました: ' + error.message);
        }
    }

    getFormData() {
        const options = this.getOptions();
        return {
            subject: document.getElementById('subject').value,
            type: document.getElementById('type').value,
            difficulty: document.getElementById('difficulty').value,
            question_text: document.getElementById('question_text').value,
            question_translation: document.getElementById('question_translation').value,
            options: options,
            answer: document.getElementById('answer').value,
            explanation_simple: document.getElementById('explanation_simple').value,
            explanation_detailed: document.getElementById('explanation_detailed').value,
            tags: document.getElementById('tags').value,
            source: document.getElementById('source').value,
            grammar_point: document.getElementById('grammar_point').value,
            media_audio: document.getElementById('media_audio').value,
            media_image: document.getElementById('media_image').value,
            media_video: document.getElementById('media_video').value
        };
    }

    getOptions() {
        const optionInputs = document.querySelectorAll('.option-input');
        return Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '');
    }

    previewQuestion() {
        const formData = this.getFormData();
        const question = this.questionManager.createQuestion(formData);

        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = this.renderPreview(question);

        document.getElementById('preview-modal').classList.add('active');
    }

    closePreviewModal() {
        document.getElementById('preview-modal').classList.remove('active');
    }

    renderPreview(question) {
        const typeInfo = this.questionManager.QUESTION_TYPES[question.type] || { name: question.type, icon: '❓' };

        return `
            <div class="preview-question">
                <div class="preview-header">
                    <h4>${typeInfo.icon} ${typeInfo.name}</h4>
                    <span class="preview-id">${question.id}</span>
                </div>
                <div class="preview-content">
                    <div class="preview-question-text">${question.question.text}</div>
                    ${question.question.translation ? `<div class="preview-translation">${question.question.translation}</div>` : ''}

                    ${question.options.length > 0 ? `
                        <div class="preview-options">
                            ${question.options.map((opt, index) =>
                                `<div class="preview-option">${String.fromCharCode(65 + index)}. ${opt}</div>`
                            ).join('')}
                        </div>
                    ` : ''}

                    <div class="preview-answer">
                        <strong>解答:</strong> ${question.answer}
                    </div>
                </div>
            </div>

            ${question.explanation.pl || question.explanation.sp ? `
                <div class="preview-explanation">
                    <h4>解説</h4>
                    ${question.explanation.pl ? `<div class="explanation-simple">${question.explanation.pl}</div>` : ''}
                    ${question.explanation.sp ? `<div class="explanation-detailed">${question.explanation.sp}</div>` : ''}
                </div>
            ` : ''}

            <div class="preview-meta">
                <p><strong>科目:</strong> ${this.questionManager.SUBJECTS[question.subject] || question.subject}</p>
                <p><strong>難易度:</strong> ${this.questionManager.DIFFICULTY_LEVELS[question.difficulty]?.name || question.difficulty}</p>
                <p><strong>タグ:</strong> ${question.tags.join(', ') || 'なし'}</p>
                <p><strong>出典:</strong> ${question.source || 'なし'}</p>
            </div>
        `;
    }

    updatePagination(pagination) {
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');

        pageInfo.textContent = `${pagination.page} / ${pagination.totalPages}`;
        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.totalPages;
    }

    updateStats(statistics) {
        document.getElementById('total-questions').textContent = statistics.total_questions || 0;
        document.getElementById('pending-questions').textContent = statistics.pending_questions || 0;
        document.getElementById('avg-difficulty').textContent = (statistics.avg_difficulty || 0).toFixed(1);
        document.getElementById('accuracy-rate').textContent = '0%'; // 後で実装
    }

    updateStatsDisplay() {
        // 追加の統計表示ロジック
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '承認待ち',
            'approved': '承認済み',
            'rejected': '却下',
            'needs_revision': '要修正'
        };
        return statusMap[status] || status;
    }

    showLoading() {
        // ローディング表示の実装
    }

    hideLoading() {
        // ローディング非表示の実装
    }

    showError(message) {
        alert('エラー: ' + message);
    }

    showSuccess(message) {
        alert('成功: ' + message);
    }

    openImportModal() {
        document.getElementById('import-modal').classList.add('active');
    }

    closeImportModal() {
        document.getElementById('import-modal').classList.remove('active');
        document.getElementById('file-input').value = '';
    }

    async handleFileSelect(file) {
        if (!file) return;

        const validTypes = ['text/csv', 'application/json'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|json)$/i)) {
            this.showError('CSVまたはJSONファイルを選択してください');
            return;
        }

        try {
            const result = await this.questionManager.importFromCSV(file);
            this.closeImportModal();
            await this.loadQuestions();
            this.showSuccess(`${result.imported}件の問題をインポートしました`);
        } catch (error) {
            this.showError('インポートに失敗しました: ' + error.message);
        }
    }

    async exportToJSON() {
        try {
            const filters = this.getCurrentFilters();
            const params = new URLSearchParams({
                format: 'json',
                ...filters
            });

            const response = await fetch(`/api/questions/export?${params}`);
            if (!response.ok) throw new Error('エクスポートに失敗しました');

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `questions_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            this.showError('JSONエクスポートに失敗しました: ' + error.message);
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new QuestionManagementUI();
});