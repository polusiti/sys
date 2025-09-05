// 語彙問題専門エディター
class VocabQuestionEditor {
    constructor(container, question = null) {
        this.container = container;
        this.question = question;
        this.isNew = !question;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const question = this.question || {};
        const title = this.isNew ? '新しい語彙問題を作成' : '語彙問題を編集';
        
        this.container.innerHTML = `
            <div class="vocab-editor">
                <div class="editor-header">
                    <h3>${title}</h3>
                    <div class="editor-actions">
                        <button class="btn btn-sm btn-secondary" onclick="this.previewQuestion()">
                            👁️ プレビュー
                        </button>
                        <button class="btn btn-sm btn-success" onclick="this.testQuestion()">
                            🧪 テスト
                        </button>
                    </div>
                </div>

                <!-- 基本情報 -->
                <div class="editor-section">
                    <h4>基本情報</h4>
                    <div class="form-group">
                        <label class="form-label">問題タイプ *</label>
                        <select class="form-select" id="vocab-type" required>
                            <option value="vocab_meaning" ${question.type === 'vocab_meaning' ? 'selected' : ''}>
                                語彙・意味選択
                            </option>
                            <option value="vocab_fill" ${question.type === 'vocab_fill' ? 'selected' : ''}>
                                語彙・空所補充
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">難易度 *</label>
                        <div class="difficulty-selector">
                            ${[1, 2, 3, 4].map(level => `
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="${level}" 
                                           ${question.difficulty === level ? 'checked' : ''}>
                                    <span class="difficulty-label">${window.CONFIG.DIFFICULTY_LEVELS[level]}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">タグ</label>
                        <div class="tag-input-container">
                            <input type="text" class="tag-input" id="tag-input" 
                                   placeholder="タグを入力してEnter">
                            <div class="tag-list" id="tag-list">
                                ${(question.tags || []).map(tag => `
                                    <span class="tag-item">
                                        ${tag}
                                        <button type="button" class="tag-remove" onclick="this.removeTag('${tag}')">×</button>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 語彙・意味選択問題 -->
                <div class="editor-section vocab-meaning-section" ${question.type === 'vocab_fill' ? 'style="display: none;"' : ''}>
                    <h4>語彙・意味選択問題</h4>
                    <div class="form-group">
                        <label class="form-label">単語 *</label>
                        <div class="word-input-group">
                            <input type="text" class="form-input" id="vocab-word" 
                                   value="${question.word || ''}" placeholder="単語を入力"
                                   required>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="this.searchWordMeaning()">
                                🔍 検索
                            </button>
                        </div>
                        <div class="word-suggestions" id="word-suggestions"></div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">発音</label>
                        <input type="text" class="form-input" id="vocab-pronunciation" 
                               value="${question.pronunciation || ''}" placeholder="発音記号や読み方">
                    </div>

                    <div class="form-group">
                        <label class="form-label">品詞</label>
                        <select class="form-select" id="vocab-pos">
                            <option value="">選択してください</option>
                            <option value="noun" ${question.pos === 'noun' ? 'selected' : ''}>名詞</option>
                            <option value="verb" ${question.pos === 'verb' ? 'selected' : ''}>動詞</option>
                            <option value="adjective" ${question.pos === 'adjective' ? 'selected' : ''}>形容詞</option>
                            <option value="adverb" ${question.pos === 'adverb' ? 'selected' : ''}>副詞</option>
                            <option value="preposition" ${question.pos === 'preposition' ? 'selected' : ''}>前置詞</option>
                            <option value="conjunction" ${question.pos === 'conjunction' ? 'selected' : ''}>接続詞</option>
                            <option value="interjection" ${question.pos === 'interjection' ? 'selected' : ''}>間投詞</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">意味 *</label>
                        <div class="meaning-input-group">
                            <input type="text" class="form-input" id="vocab-meaning" 
                                   value="${question.meaning || ''}" placeholder="単語の意味を入力"
                                   required>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="this.addToMeanings()">
                                ➕ 追加
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">選択肢 *</label>
                        <div class="options-editor">
                            <div class="options-list" id="options-list">
                                ${(question.options || []).map((option, index) => `
                                    <div class="option-item">
                                        <input type="text" class="form-input option-input" 
                                               value="${option}" placeholder="選択肢 ${index + 1}">
                                        <div class="option-controls">
                                            <button type="button" class="btn btn-sm ${question.correct === index ? 'btn-success' : 'btn-secondary'}" 
                                                    onclick="this.setCorrectAnswer(${index})">
                                                ${question.correct === index ? '✓' : '○'}
                                            </button>
                                            <button type="button" class="btn btn-sm btn-error" onclick="this.removeOption(${index})">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="this.addOption()">
                                ➕ 選択肢を追加
                            </button>
                        </div>
                        <div class="form-help">正解を選択してください</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">例文</label>
                        <textarea class="form-textarea" id="vocab-example" 
                                  placeholder="例文を入力">${question.example || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">解説</label>
                        <textarea class="form-textarea" id="vocab-explanation" 
                                  placeholder="解説を入力">${question.explanation || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">関連語</label>
                        <div class="related-words">
                            <input type="text" class="form-input" id="related-word-input" 
                                   placeholder="関連語を入力">
                            <button type="button" class="btn btn-sm btn-secondary" onclick="this.addRelatedWord()">
                                ➕ 追加
                            </button>
                            <div class="related-words-list" id="related-words-list">
                                ${(question.relatedWords || []).map((word, index) => `
                                    <span class="related-word-item">
                                        ${word}
                                        <button type="button" class="btn btn-sm btn-error" onclick="this.removeRelatedWord(${index})">×</button>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 語彙・空所補充問題 -->
                <div class="editor-section vocab-fill-section" ${question.type === 'vocab_meaning' ? 'style="display: none;"' : ''}>
                    <h4>語彙・空所補充問題</h4>
                    <div class="form-group">
                        <label class="form-label">英文 *</label>
                        <textarea class="form-textarea" id="fill-sentence" 
                                  placeholder="英文を入力（空所は_____で表記）" required>${question.sentence || ''}</textarea>
                        <div class="form-help">空所は _____ で表記してください</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">空所の単語 *</label>
                        <input type="text" class="form-input" id="fill-blank-word" 
                               value="${question.blank_word || ''}" placeholder="空所に入る単語"
                               required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">選択肢 *</label>
                        <div class="options-editor">
                            <div class="options-list" id="fill-options-list">
                                ${(question.options || []).map((option, index) => `
                                    <div class="option-item">
                                        <input type="text" class="form-input option-input" 
                                               value="${option}" placeholder="選択肢 ${index + 1}">
                                        <div class="option-controls">
                                            <button type="button" class="btn btn-sm ${question.correct === index ? 'btn-success' : 'btn-secondary'}" 
                                                    onclick="this.setCorrectAnswer(${index})">
                                                ${question.correct === index ? '✓' : '○'}
                                            </button>
                                            <button type="button" class="btn btn-sm btn-error" onclick="this.removeOption(${index})">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="this.addOption()">
                                ➕ 選択肢を追加
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">ヒント</label>
                        <textarea class="form-textarea" id="fill-hint" 
                                  placeholder="ヒントを入力">${question.hint || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">解説</label>
                        <textarea class="form-textarea" id="fill-explanation" 
                                  placeholder="解説を入力">${question.explanation || ''}</textarea>
                    </div>
                </div>

                <!-- 保存ボタン -->
                <div class="editor-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.cancelEdit()">
                        キャンセル
                    </button>
                    <button type="button" class="btn btn-primary" onclick="this.saveQuestion()">
                        💾 保存
                    </button>
                    ${!this.isNew ? `
                        <button type="button" class="btn btn-warning" onclick="this.duplicateQuestion()">
                            📋 複製
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // 問題タイプ切り替えイベント
        setTimeout(() => {
            const typeSelect = document.getElementById('vocab-type');
            if (typeSelect) {
                typeSelect.addEventListener('change', (e) => {
                    this.toggleQuestionType(e.target.value);
                });
            }
        }, 100);
    }

    setupEventListeners() {
        // タグ入力
        const tagInput = document.getElementById('tag-input');
        if (tagInput) {
            tagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag(tagInput.value.trim());
                    tagInput.value = '';
                }
            });
        }

        // 難易度選択
        const difficultyInputs = document.querySelectorAll('input[name="difficulty"]');
        difficultyInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateDifficultyDisplay(e.target.value);
            });
        });
    }

    toggleQuestionType(type) {
        const meaningSection = document.querySelector('.vocab-meaning-section');
        const fillSection = document.querySelector('.vocab-fill-section');
        
        if (type === 'vocab_meaning') {
            meaningSection.style.display = 'block';
            fillSection.style.display = 'none';
        } else {
            meaningSection.style.display = 'none';
            fillSection.style.display = 'block';
        }
    }

    addTag(tag) {
        if (!tag) return;
        
        const tagList = document.getElementById('tag-list');
        const existingTags = Array.from(tagList.querySelectorAll('.tag-item')).map(item => 
            item.textContent.replace('×', '').trim()
        );
        
        if (existingTags.includes(tag)) {
            alert('このタグは既に追加されています');
            return;
        }
        
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            ${tag}
            <button type="button" class="tag-remove" onclick="this.removeTag('${tag}')">×</button>
        `;
        
        tagList.appendChild(tagElement);
    }

    removeTag(tag) {
        const tagItems = document.querySelectorAll('.tag-item');
        tagItems.forEach(item => {
            if (item.textContent.replace('×', '').trim() === tag) {
                item.remove();
            }
        });
    }

    addOption() {
        const optionsList = document.getElementById('options-list');
        const optionCount = optionsList.children.length;
        
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        optionElement.innerHTML = `
            <input type="text" class="form-input option-input" 
                   placeholder="選択肢 ${optionCount + 1}">
            <div class="option-controls">
                <button type="button" class="btn btn-sm btn-secondary" onclick="this.setCorrectAnswer(${optionCount})">
                    ○
                </button>
                <button type="button" class="btn btn-sm btn-error" onclick="this.removeOption(${optionCount})">
                    ×
                </button>
            </div>
        `;
        
        optionsList.appendChild(optionElement);
    }

    removeOption(index) {
        const optionsList = document.getElementById('options-list');
        if (optionsList.children[index]) {
            optionsList.children[index].remove();
        }
    }

    setCorrectAnswer(index) {
        const buttons = document.querySelectorAll('.option-controls button:first-child');
        buttons.forEach((btn, i) => {
            if (i === index) {
                btn.className = 'btn btn-sm btn-success';
                btn.textContent = '✓';
            } else {
                btn.className = 'btn btn-sm btn-secondary';
                btn.textContent = '○';
            }
        });
    }

    addRelatedWord() {
        const input = document.getElementById('related-word-input');
        const word = input.value.trim();
        if (!word) return;
        
        const list = document.getElementById('related-words-list');
        const wordElement = document.createElement('span');
        wordElement.className = 'related-word-item';
        wordElement.innerHTML = `
            ${word}
            <button type="button" class="btn btn-sm btn-error" onclick="this.removeRelatedWord(${list.children.length})">×</button>
        `;
        
        list.appendChild(wordElement);
        input.value = '';
    }

    removeRelatedWord(index) {
        const list = document.getElementById('related-words-list');
        if (list.children[index]) {
            list.children[index].remove();
        }
    }

    collectData() {
        const type = document.getElementById('vocab-type').value;
        const difficulty = parseInt(document.querySelector('input[name="difficulty"]:checked')?.value || '1');
        
        // タグを収集
        const tags = Array.from(document.querySelectorAll('.tag-item')).map(item => 
            item.textContent.replace('×', '').trim()
        );
        
        let data = {
            type: type,
            difficulty: difficulty,
            tags: tags
        };
        
        if (type === 'vocab_meaning') {
            data.word = document.getElementById('vocab-word').value;
            data.pronunciation = document.getElementById('vocab-pronunciation').value;
            data.pos = document.getElementById('vocab-pos').value;
            data.meaning = document.getElementById('vocab-meaning').value;
            data.example = document.getElementById('vocab-example').value;
            data.explanation = document.getElementById('vocab-explanation').value;
            
            // 選択肢を収集
            const options = Array.from(document.querySelectorAll('#options-list .option-input')).map(input => input.value);
            const correctButton = document.querySelector('#options-list .btn-success');
            const correct = Array.from(document.querySelectorAll('#options-list .option-controls button:first-child')).indexOf(correctButton);
            
            data.options = options;
            data.correct = correct;
            
            // 関連語を収集
            data.relatedWords = Array.from(document.querySelectorAll('.related-word-item')).map(item => 
                item.textContent.replace('×', '').trim()
            );
        } else {
            data.sentence = document.getElementById('fill-sentence').value;
            data.blank_word = document.getElementById('fill-blank-word').value;
            data.hint = document.getElementById('fill-hint').value;
            data.explanation = document.getElementById('fill-explanation').value;
            
            // 選択肢を収集
            const options = Array.from(document.querySelectorAll('#fill-options-list .option-input')).map(input => input.value);
            const correctButton = document.querySelector('#fill-options-list .btn-success');
            const correct = Array.from(document.querySelectorAll('#fill-options-list .option-controls button:first-child')).indexOf(correctButton);
            
            data.options = options;
            data.correct = correct;
        }
        
        return data;
    }

    validateData(data) {
        const errors = [];
        
        if (!data.type) errors.push('問題タイプを選択してください');
        if (!data.difficulty) errors.push('難易度を選択してください');
        
        if (data.type === 'vocab_meaning') {
            if (!data.word) errors.push('単語を入力してください');
            if (!data.meaning) errors.push('意味を入力してください');
            if (!data.options || data.options.length < 2) errors.push('選択肢は2つ以上入力してください');
            if (data.correct === undefined || data.correct === null) errors.push('正解を選択してください');
        } else {
            if (!data.sentence) errors.push('英文を入力してください');
            if (!data.blank_word) errors.push('空所の単語を入力してください');
            if (!data.options || data.options.length < 2) errors.push('選択肢は2つ以上入力してください');
            if (data.correct === undefined || data.correct === null) errors.push('正解を選択してください');
        }
        
        return errors;
    }

    saveQuestion() {
        const data = this.collectData();
        const errors = this.validateData(data);
        
        if (errors.length > 0) {
            alert('入力エラー:\n' + errors.join('\n'));
            return;
        }
        
        try {
            if (this.isNew) {
                const question = window.app.createQuestion(data.type, data);
                window.app.showNotification('語彙問題を作成しました', 'success');
            } else {
                const updatedQuestion = window.app.updateQuestion(this.question.type, this.question.id, data);
                window.app.showNotification('語彙問題を更新しました', 'success');
            }
            
            // 編集画面を閉じる
            this.closeEditor();
        } catch (error) {
            window.app.showNotification('保存に失敗しました', 'error');
            console.error('Save failed:', error);
        }
    }

    previewQuestion() {
        const data = this.collectData();
        const errors = this.validateData(data);
        
        if (errors.length > 0) {
            alert('入力エラー:\n' + errors.join('\n'));
            return;
        }
        
        // プレビューモーダルを表示
        this.showPreview(data);
    }

    testQuestion() {
        const data = this.collectData();
        const errors = this.validateData(data);
        
        if (errors.length > 0) {
            alert('入力エラー:\n' + errors.join('\n'));
            return;
        }
        
        // テストモーダルを表示
        this.showTest(data);
    }

    showPreview(data) {
        // プレビュー表示の実装
        const previewHtml = this.generatePreviewHtml(data);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>問題プレビュー</h3>
                    <button class="btn btn-sm btn-secondary" onclick="this.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${previewHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closeModal()">閉じる</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showTest(data) {
        // テスト表示の実装
        const testHtml = this.generateTestHtml(data);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>問題テスト</h3>
                    <button class="btn btn-sm btn-secondary" onclick="this.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${testHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closeModal()">閉じる</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    generatePreviewHtml(data) {
        // プレビューHTML生成の実装
        if (data.type === 'vocab_meaning') {
            return `
                <div class="preview-question">
                    <h4>語彙・意味選択問題</h4>
                    <p><strong>単語:</strong> ${data.word}</p>
                    ${data.pronunciation ? `<p><strong>発音:</strong> ${data.pronunciation}</p>` : ''}
                    ${data.pos ? `<p><strong>品詞:</strong> ${data.pos}</p>` : ''}
                    <p><strong>意味:</strong> ${data.meaning}</p>
                    ${data.example ? `<p><strong>例文:</strong> ${data.example}</p>` : ''}
                    <div class="options">
                        ${data.options.map((option, index) => `
                            <div class="option ${index === data.correct ? 'correct' : ''}">
                                ${index + 1}. ${option}
                            </div>
                        `).join('')}
                    </div>
                    ${data.explanation ? `<p><strong>解説:</strong> ${data.explanation}</p>` : ''}
                </div>
            `;
        } else {
            return `
                <div class="preview-question">
                    <h4>語彙・空所補充問題</h4>
                    <p><strong>英文:</strong> ${data.sentence.replace('_____', `<u>${data.blank_word}</u>`)}</p>
                    <div class="options">
                        ${data.options.map((option, index) => `
                            <div class="option ${index === data.correct ? 'correct' : ''}">
                                ${index + 1}. ${option}
                            </div>
                        `).join('')}
                    </div>
                    ${data.hint ? `<p><strong>ヒント:</strong> ${data.hint}</p>` : ''}
                    ${data.explanation ? `<p><strong>解説:</strong> ${data.explanation}</p>` : ''}
                </div>
            `;
        }
    }

    generateTestHtml(data) {
        // テストHTML生成の実装
        return `
            <div class="test-question">
                <h4>問題テスト</h4>
                ${this.generatePreviewHtml(data)}
                <div class="test-controls">
                    <button class="btn btn-primary" onclick="this.checkAnswer()">答え合わせ</button>
                </div>
                <div id="test-result" class="test-result" style="display: none;"></div>
            </div>
        `;
    }

    duplicateQuestion() {
        if (confirm('この問題を複製しますか？')) {
            const data = this.collectData();
            data.word = data.word + ' (コピー)';
            try {
                window.app.createQuestion(data.type, data);
                window.app.showNotification('問題を複製しました', 'success');
            } catch (error) {
                window.app.showNotification('複製に失敗しました', 'error');
            }
        }
    }

    cancelEdit() {
        this.closeEditor();
    }

    closeEditor() {
        this.container.innerHTML = '';
    }
}

// グローバルに公開
window.VocabQuestionEditor = VocabQuestionEditor;