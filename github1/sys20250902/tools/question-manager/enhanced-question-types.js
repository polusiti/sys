// Enhanced Question Types Extension
// This extends the existing database with new question formats and features

class EnhancedQuestionTypes {
    constructor() {
        this.newQuestionTypes = {
            'B1': { // Image-based multiple choice
                name: '画像選択問題',
                description: '画像を選択肢として使用する問題',
                template: {
                    answerFormat: 'B1',
                    questionContent: {
                        stem: '指示文',
                        text: '問題文',
                        images: ['main_image_url'],
                        latex: false
                    },
                    answerData: {
                        type: 'image-choice',
                        choices: [
                            { image: 'choice1_url', text: '選択肢1' },
                            { image: 'choice2_url', text: '選択肢2' },
                            { image: 'choice3_url', text: '選択肢3' },
                            { image: 'choice4_url', text: '選択肢4' }
                        ],
                        correctAnswers: [0]
                    }
                }
            },
            'C1': { // Fill in the blank
                name: '穴埋め問題',
                description: '文中の空欄を埋める問題',
                template: {
                    answerFormat: 'C1',
                    questionContent: {
                        stem: '指示文',
                        text: '空欄を含む問題文 ___ ここに空欄 ___',
                        blanks: [
                            { position: 0, type: 'text', length: 20 },
                            { position: 1, type: 'number', decimal: true }
                        ],
                        latex: false
                    },
                    answerData: {
                        type: 'fill-blank',
                        correctAnswers: ['答え1', '3.14'],
                        partialCredit: true,
                        caseSensitive: false
                    }
                }
            },
            'D1': { // Matching pairs
                name: '組み合わせ問題',
                description: '左右の項目を正しく組み合わせる問題',
                template: {
                    answerFormat: 'D1',
                    questionContent: {
                        stem: '左右の項目を正しく組み合わせなさい',
                        leftItems: ['項目A', '項目B', '項目C'],
                        rightItems: ['項目1', '項目2', '項目3'],
                        latex: false
                    },
                    answerData: {
                        type: 'matching',
                        correctPairs: [
                            { left: 0, right: 2 },
                            { left: 1, right: 0 },
                            { left: 2, right: 1 }
                        ],
                        allowMultiple: false
                    }
                }
            },
            'E1': { // Sequencing/Ordering
                name: '並べ替え問題',
                description: '項目を正しい順序に並べ替える問題',
                template: {
                    answerFormat: 'E1',
                    questionContent: {
                        stem: '以下を正しい順序に並べ替えなさい',
                        items: [
                            'ステップ1',
                            'ステップ2',
                            'ステップ3',
                            'ステップ4'
                        ],
                        latex: false
                    },
                    answerData: {
                        type: 'sequencing',
                        correctOrder: [0, 1, 2, 3],
                        partialCredit: true
                    }
                }
            },
            'F3': { // Audio-based question
                name: '音声問題',
                description: '音声を聞いて答える問題',
                template: {
                    answerFormat: 'F3',
                    questionContent: {
                        stem: '音声を聞いて答えなさい',
                        audioUrl: 'audio_file_url',
                        transcript: '音声の転記（オプション）',
                        latex: false
                    },
                    answerData: {
                        type: 'text',
                        correctAnswers: ['正解'],
                        alternatives: ['類義語1', '類義語2'],
                        caseSensitive: false
                    }
                }
            },
            'G1': { // Multi-select
                name: '複数選択問題',
                description: '複数の正解を選ぶ問題',
                template: {
                    answerFormat: 'G1',
                    questionContent: {
                        stem: '正しいものをすべて選びなさい',
                        text: '問題文',
                        latex: false
                    },
                    answerData: {
                        type: 'multi-select',
                        choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
                        correctAnswers: [0, 2],
                        minSelect: 1,
                        maxSelect: 3
                    }
                }
            }
        };
    }

    // 新しい問題タイプのテンプレートを取得
    getTemplate(type) {
        return this.newQuestionTypes[type]?.template || null;
    }

    // すべての問題タイプを取得
    getAllQuestionTypes() {
        return {
            ...this.newQuestionTypes,
            // 既存のタイプも含める
            'A1': { name: '4択問題', description: '4つの選択肢から1つ選ぶ' },
            'A2': { name: '6択問題', description: '6つの選択肢から1つ選ぶ' },
            'A3': { name: '9択問題', description: '9つの選択肢から1つ選ぶ' },
            'F1': { name: '分数問題', description: '分数の計算問題' },
            'F2': { name: '記述式', description: '自由記述の問題' }
        };
    }

    // 問題タイプに応じたUIを生成
    generateQuestionUI(type, container, question = null) {
        const template = this.getTemplate(type);
        if (!template) return;

        container.innerHTML = '';

        switch(type) {
            case 'B1': // Image choice
                this.generateImageChoiceUI(container, question || template);
                break;
            case 'C1': // Fill blank
                this.generateFillBlankUI(container, question || template);
                break;
            case 'D1': // Matching
                this.generateMatchingUI(container, question || template);
                break;
            case 'E1': // Sequencing
                this.generateSequencingUI(container, question || template);
                break;
            case 'F3': // Audio
                this.generateAudioUI(container, question || template);
                break;
            case 'G1': // Multi-select
                this.generateMultiSelectUI(container, question || template);
                break;
            default:
                container.innerHTML = '<p>未対応の問題タイプです</p>';
        }
    }

    // 画像選択問題のUI
    generateImageChoiceUI(container, question) {
        const html = `
            <div class="image-choice-container">
                <div class="question-text">
                    <label>問題文</label>
                    <textarea class="form-input" id="questionText">${question.questionContent.text || ''}</textarea>
                </div>
                <div class="main-image">
                    <label>メイン画像</label>
                    <input type="file" id="mainImage" accept="image/*" class="form-input">
                    <div id="mainImagePreview" class="image-preview"></div>
                </div>
                <div class="choices-images">
                    <h4>選択肢画像</h4>
                    <div class="choice-image-grid">
                        ${[0,1,2,3].map(i => `
                            <div class="choice-image-item">
                                <label>選択肢${i+1}</label>
                                <input type="file" id="choiceImage${i}" accept="image/*" class="form-input">
                                <input type="text" id="choiceText${i}" class="form-input" placeholder="選択肢の説明" value="${question.answerData.choices[i]?.text || ''}">
                                <div id="choiceImagePreview${i}" class="image-preview"></div>
                                <label class="correct-checkbox">
                                    <input type="checkbox" id="correct${i}" ${question.answerData.correctAnswers?.includes(i) ? 'checked' : ''}>
                                    正解
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // 穴埋め問題のUI
    generateFillBlankUI(container, question) {
        const html = `
            <div class="fill-blank-container">
                <div class="question-text">
                    <label>問題文（___ を空欄として使用）</label>
                    <textarea id="questionText" class="form-input">${question.questionContent.text || ''}</textarea>
                </div>
                <div class="blanks-config">
                    <h4>空欄の設定</h4>
                    <div id="blanksList">
                        ${(question.questionContent.blanks || []).map((blank, i) => `
                            <div class="blank-item">
                                <span>空欄${i+1}</span>
                                <select id="blankType${i}" class="form-input">
                                    <option value="text" ${blank.type === 'text' ? 'selected' : ''}>テキスト</option>
                                    <option value="number" ${blank.type === 'number' ? 'selected' : ''}>数値</option>
                                    <option value="date" ${blank.type === 'date' ? 'selected' : ''}>日付</option>
                                </select>
                                ${blank.type === 'number' ? `
                                    <label>
                                        <input type="checkbox" id="blankDecimal${i}" ${blank.decimal ? 'checked' : ''}>
                                        小数許容
                                    </label>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="answers-config">
                    <h4>正解</h4>
                    <div id="answersList">
                        ${(question.answerData.correctAnswers || []).map((answer, i) => `
                            <input type="text" id="correctAnswer${i}" class="form-input" placeholder="正解${i+1}" value="${answer}">
                        `).join('')}
                    </div>
                    <label>
                        <input type="checkbox" id="partialCredit" ${question.answerData.partialCredit ? 'checked' : ''}>
                        部分点を許容
                    </label>
                    <label>
                        <input type="checkbox" id="caseSensitive" ${question.answerData.caseSensitive ? 'checked' : ''}>
                        大文字小文字を区別
                    </label>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // 組み合わせ問題のUI
    generateMatchingUI(container, question) {
        const html = `
            <div class="matching-container">
                <div class="items-config">
                    <h4>項目の設定</h4>
                    <div class="items-grid">
                        <div>
                            <h5>左側の項目</h5>
                            ${(question.questionContent.leftItems || []).map((item, i) => `
                                <input type="text" id="leftItem${i}" class="form-input" value="${item}" placeholder="項目${i+1}">
                            `).join('')}
                            <button onclick="addLeftItem()" class="btn-secondary">+ 項目を追加</button>
                        </div>
                        <div>
                            <h5>右側の項目</h5>
                            ${(question.questionContent.rightItems || []).map((item, i) => `
                                <input type="text" id="rightItem${i}" class="form-input" value="${item}" placeholder="項目${i+1}">
                            `).join('')}
                            <button onclick="addRightItem()" class="btn-secondary">+ 項目を追加</button>
                        </div>
                    </div>
                </div>
                <div class="pairs-config">
                    <h4>正解の組み合わせ</h4>
                    <div id="pairsList">
                        ${(question.answerData.correctPairs || []).map((pair, i) => `
                            <div class="pair-item">
                                <select id="pairLeft${i}" class="form-input">
                                    ${(question.questionContent.leftItems || []).map((item, j) => `
                                        <option value="${j}" ${pair.left === j ? 'selected' : ''}>${item}</option>
                                    `).join('')}
                                </select>
                                <span>→</span>
                                <select id="pairRight${i}" class="form-input">
                                    ${(question.questionContent.rightItems || []).map((item, j) => `
                                        <option value="${j}" ${pair.right === j ? 'selected' : ''}>${item}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // 並べ替え問題のUI
    generateSequencingUI(container, question) {
        const html = `
            <div class="sequencing-container">
                <div class="items-config">
                    <h4>項目の設定</h4>
                    <div id="sortableItems" class="sortable-list">
                        ${(question.questionContent.items || []).map((item, i) => `
                            <div class="sortable-item" data-index="${i}">
                                <span class="drag-handle">≡</span>
                                <input type="text" value="${item}" class="form-input" onchange="updateItemText(${i}, this.value)">
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="addSortableItem()" class="btn-secondary">+ 項目を追加</button>
                </div>
                <div class="correct-order">
                    <h4>正解の順序</h4>
                    <p>現在の並び順が正解となります</p>
                    <label>
                        <input type="checkbox" id="partialCredit" ${question.answerData.partialCredit ? 'checked' : ''}>
                        部分点を許容（順序が近い場合）
                    </label>
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        // ドラッグアンドドロップを有効化
        this.enableSortable(container);
    }

    // 音声問題のUI
    generateAudioUI(container, question) {
        const html = `
            <div class="audio-container">
                <div class="audio-upload">
                    <label>音声ファイル</label>
                    <input type="file" id="audioFile" accept="audio/*" class="form-input">
                    <audio id="audioPlayer" controls style="display: none; width: 100%; margin-top: 10px;"></audio>
                </div>
                <div class="transcript">
                    <label>音声の転記（オプション）</label>
                    <textarea id="transcript" class="form-input">${question.questionContent.transcript || ''}</textarea>
                </div>
                <div class="answers">
                    <label>正解</label>
                    <input type="text" id="correctAnswer" class="form-input" value="${question.answerData.correctAnswers?.[0] || ''}" placeholder="正解">
                    <div class="alternatives">
                        <label>代替答案（類義語など）</label>
                        <div id="alternativesList">
                            ${(question.answerData.alternatives || []).map((alt, i) => `
                                <input type="text" id="alternative${i}" class="form-input" value="${alt}" placeholder="代替案${i+1}">
                            `).join('')}
                        </div>
                        <button onclick="addAlternative()" class="btn-secondary">+ 代替案を追加</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // 複数選択問題のUI
    generateMultiSelectUI(container, question) {
        const html = `
            <div class="multi-select-container">
                <div class="question-text">
                    <label>問題文</label>
                    <textarea id="questionText" class="form-input">${question.questionContent.text || ''}</textarea>
                </div>
                <div class="choices">
                    <h4>選択肢</h4>
                    <div id="choicesList">
                        ${(question.answerData.choices || []).map((choice, i) => `
                            <div class="choice-item">
                                <input type="text" id="choice${i}" class="form-input" value="${choice}" placeholder="選択肢${i+1}">
                                <label class="correct-checkbox">
                                    <input type="checkbox" id="correct${i}" ${question.answerData.correctAnswers?.includes(i) ? 'checked' : ''}>
                                    正解
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="addChoice()" class="btn-secondary">+ 選択肢を追加</button>
                </div>
                <div class="select-config">
                    <label>最小選択数: <input type="number" id="minSelect" value="${question.answerData.minSelect || 1}" min="1" class="form-input" style="width: 80px;"></label>
                    <label>最大選択数: <input type="number" id="maxSelect" value="${question.answerData.maxSelect || 3}" min="1" class="form-input" style="width: 80px;"></label>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    // ソート可能リストを有効化
    enableSortable(container) {
        const sortableList = container.querySelector('#sortableItems');
        if (!sortableList) return;

        let draggedItem = null;

        sortableList.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.target.style.opacity = '0.5';
        });

        sortableList.addEventListener('dragend', (e) => {
            e.target.style.opacity = '';
        });

        sortableList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(sortableList, e.clientY);
            if (afterElement == null) {
                sortableList.appendChild(draggedItem);
            } else {
                sortableList.insertBefore(draggedItem, afterElement);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

// グローバルに公開
window.EnhancedQuestionTypes = EnhancedQuestionTypes;