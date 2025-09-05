// Enhanced Mobile Question Creator with Subject-Based Classification
class EnhancedMobileCreator extends MobileQuestionCreator {
    constructor() {
        super();
        this.subjectCategories = {
            'math': {
                name: '数学',
                icon: '🔢',
                color: '#3b82f6',
                templates: {
                    'math-a1': {
                        name: 'A1 難易度',
                        icon: '🟢',
                        desc: '基礎レベル・計算量少',
                        answerFormat: 'A1',
                        difficultyLevel: 'A',
                        calculationAmount: 1,
                        estimatedTime: 60,
                        topics: ['計算', '基本方程式', '簡単な図形'],
                        commonLatex: ['\\\\frac{}{}', 'x^2']
                    },
                    'math-a2': {
                        name: 'A2 難易度',
                        icon: '🟢',
                        desc: '基礎レベル・計算量中',
                        answerFormat: 'A1',
                        difficultyLevel: 'A',
                        calculationAmount: 2,
                        estimatedTime: 90,
                        topics: ['連立方程式', '因数分解', '基本図形'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', '\\\\sqrt{}']
                    },
                    'math-a3': {
                        name: 'A3 難易度',
                        icon: '🟢',
                        desc: '基礎レベル・計算量大',
                        answerFormat: 'A1',
                        difficultyLevel: 'A',
                        calculationAmount: 3,
                        estimatedTime: 120,
                        topics: ['二次方程式', '三角比', '確率'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', '\\\\sqrt{}', '\\\\pi']
                    },
                    'math-a4': {
                        name: 'A4 難易度',
                        icon: '🟢',
                        desc: '基礎レベル・計算量最大',
                        answerFormat: 'A1',
                        difficultyLevel: 'A',
                        calculationAmount: 4,
                        estimatedTime: 150,
                        topics: ['複数分野融合', '文章題', '応用問題'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', '\\\\sqrt{}', '\\\\pi', '\\\\sum']
                    },
                    'math-b1': {
                        name: 'B1 難易度',
                        icon: '🟡',
                        desc: '標準レベル・計算量少',
                        answerFormat: 'A1',
                        difficultyLevel: 'B',
                        calculationAmount: 1,
                        estimatedTime: 90,
                        topics: ['二次関数', '図形と計量', '場合の数'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', '\\\\sqrt{}', '\\\\sin', '\\\\cos']
                    },
                    'math-b2': {
                        name: 'B2 難易度',
                        icon: '🟡',
                        desc: '標準レベル・計算量中',
                        answerFormat: 'A1',
                        difficultyLevel: 'B',
                        calculationAmount: 2,
                        estimatedTime: 120,
                        topics: ['微分積分', 'ベクトル', '数列'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', '\\\\sqrt{}', '\\\\lim', '\\\\int']
                    },
                    'math-b3': {
                        name: 'B3 難易度',
                        icon: '🟡',
                        desc: '標準レベル・計算量大',
                        answerFormat: 'A1',
                        difficultyLevel: 'B',
                        calculationAmount: 3,
                        estimatedTime: 150,
                        topics: ['複素数', '行列', '空間ベクトル'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', 'i', '\\\\begin{matrix}']
                    },
                    'math-b4': {
                        name: 'B4 難易度',
                        icon: '🟡',
                        desc: '標準レベル・計算量最大',
                        answerFormat: 'A1',
                        difficultyLevel: 'B',
                        calculationAmount: 4,
                        estimatedTime: 180,
                        topics: ['微分方程式', '極限', '級数'],
                        commonLatex: ['\\\\frac{}{}', 'x^2', '\\\\lim', '\\\\int', '\\\\sum', '\\\\infty']
                    },
                    'math-c1': {
                        name: 'C1 難易度',
                        icon: '🟠',
                        desc: '発展レベル・計算量少',
                        answerFormat: 'F1',
                        difficultyLevel: 'C',
                        calculationAmount: 1,
                        estimatedTime: 120,
                        topics: ['証明問題', '論理', '集合'],
                        expression: true,
                        variables: ['a', 'b', 'c', 'x', 'y', 'n']
                    },
                    'math-c2': {
                        name: 'C2 難易度',
                        icon: '🟠',
                        desc: '発展レベル・計算量中',
                        answerFormat: 'F1',
                        difficultyLevel: 'C',
                        calculationAmount: 2,
                        estimatedTime: 150,
                        topics: ['高度な証明', '写像', '論理と集合'],
                        expression: true,
                        variables: ['a', 'b', 'c', 'x', 'y', 'n', 'm', 'k']
                    },
                    'math-c3': {
                        name: 'C3 難易度',
                        icon: '🟠',
                        desc: '発展レベル・計算量大',
                        answerFormat: 'F1',
                        difficultyLevel: 'C',
                        calculationAmount: 3,
                        estimatedTime: 180,
                        topics: ['複雑な証明', '場合分け', '帰納法'],
                        expression: true,
                        variables: ['a', 'b', 'c', 'x', 'y', 'n', 'm', 'k', 'p', 'q']
                    },
                    'math-c4': {
                        name: 'C4 難易度',
                        icon: '🟠',
                        desc: '発展レベル・計算量最大',
                        answerFormat: 'F1',
                        difficultyLevel: 'C',
                        calculationAmount: 4,
                        estimatedTime: 210,
                        topics: ['高度な論証', '複雑な帰納法', '抽象的な概念'],
                        expression: true,
                        variables: ['a', 'b', 'c', 'x', 'y', 'n', 'm', 'k', 'p', 'q', 'r', 's']
                    },
                    'math-d1': {
                        name: 'D1 難易度',
                        icon: '🔴',
                        desc: '最難関レベル・計算量少',
                        answerFormat: 'F2',
                        difficultyLevel: 'D',
                        calculationAmount: 1,
                        estimatedTime: 180,
                        topics: ['大学受験最難関', 'オリンピック予備', '高度な概念'],
                        steps: true,
                        requiresProof: true
                    },
                    'math-d2': {
                        name: 'D2 難易度',
                        icon: '🔴',
                        desc: '最難関レベル・計算量中',
                        answerFormat: 'F2',
                        difficultyLevel: 'D',
                        calculationAmount: 2,
                        estimatedTime: 240,
                        topics: ['オリンピックレベル', '大学数学入門', '高度な応用'],
                        steps: true,
                        requiresProof: true
                    },
                    'math-d3': {
                        name: 'D3 難易度',
                        icon: '🔴',
                        desc: '最難関レベル・計算量大',
                        answerFormat: 'F2',
                        difficultyLevel: 'D',
                        calculationAmount: 3,
                        estimatedTime: 300,
                        topics: ['国際数学オリンピック', '大学数学', '研究レベル'],
                        steps: true,
                        requiresProof: true
                    },
                    'math-d4': {
                        name: 'D4 難易度',
                        icon: '🔴',
                        desc: '最難関レベル・計算量最大',
                        answerFormat: 'F2',
                        difficultyLevel: 'D',
                        calculationAmount: 4,
                        estimatedTime: 360,
                        topics: ['国際数学オリンピック最終', '研究レベル', '創造的問題'],
                        steps: true,
                        requiresProof: true
                    }
                }
            },
            'english': {
                name: '英語',
                icon: '🇺🇸',
                color: '#10b981',
                templates: {
                    'english-choice': {
                        name: '4択問題',
                        icon: '📝',
                        desc: '語彙・文法・読解',
                        answerFormat: 'A1',
                        commonPhrases: ['Choose the correct', 'Select the best', 'What does']
                    },
                    'english-choice-5': {
                        name: '5択問題',
                        icon: '🔢',
                        desc: '語彙・文法（難易度高め）',
                        answerFormat: 'A4',
                        commonPhrases: ['Choose the best', 'Select the most appropriate']
                    },
                    'listening': {
                        name: 'リスニング',
                        icon: '🎧',
                        desc: '音声を聞いて解答',
                        answerFormat: 'F3',
                        audioRequired: true,
                        transcript: true
                    },
                    'reading': {
                        name: '長文読解',
                        icon: '📖',
                        desc: '文章読解問題',
                        answerFormat: 'A2',
                        passage: true
                    },
                    'writing': {
                        name: '英作文',
                        icon: '✍️',
                        desc: '英語で記述',
                        answerFormat: 'F2',
                        wordLimits: [50, 100, 200]
                    }
                }
            },
            'science': {
                name: '理科',
                icon: '🧪',
                color: '#8b5cf6',
                templates: {
                    'physics-choice': {
                        name: '物理（四択）',
                        icon: '⚡',
                        desc: '力学・電磁気・熱',
                        answerFormat: 'A1',
                        units: ['m/s', 'kg', 'N', 'Pa', 'J']
                    },
                    'physics-calc': {
                        name: '物理（計算）',
                        icon: '🧮',
                        desc: '数値計算問題',
                        answerFormat: 'F1',
                        formula: true
                    },
                    'chemistry-choice': {
                        name: '化学（四択）',
                        icon: '🧬',
                        desc: '化学反応・物質',
                        answerFormat: 'A1',
                        elements: true
                    },
                    'chemistry-calc': {
                        name: '化学（計算）',
                        icon: '⚗️',
                        desc: '化学計算問題',
                        answerFormat: 'F1',
                        moles: true
                    }
                }
            },
            'japanese': {
                name: '国語',
                icon: '📚',
                color: '#ef4444',
                templates: {
                    'japanese-choice': {
                        name: '4択問題',
                        icon: '📝',
                        desc: '漢字・文法・古典',
                        answerFormat: 'A1',
                        questionTypes: ['漢字読み', '文法', '古典', '現代文']
                    },
                    'reading': {
                        name: '現代文読解',
                        icon: '📄',
                        desc: '文章読解問題',
                        answerFormat: 'A2',
                        passage: true
                    },
                    'classical': {
                        name: '古文・漢文',
                        icon: '🏛️',
                        desc: '古典文学',
                        answerFormat: 'A1',
                        historical: true
                    },
                    'composition': {
                        name: '作文',
                        icon: '✒️',
                        desc: '文章作成',
                        answerFormat: 'F2',
                        formats: ['意見文', '説明文', '感想文']
                    }
                }
            },
            'social': {
                name: '社会',
                icon: '🌍',
                color: '#f59e0b',
                templates: {
                    'history-choice': {
                        name: '歴史問題',
                        icon: '📜',
                        desc: '日本史・世界史',
                        answerFormat: 'A1',
                        timeline: true
                    },
                    'geography-choice': {
                        name: '地理問題',
                        icon: '🗺️',
                        desc: '地形・産業・文化',
                        answerFormat: 'A1',
                        maps: true
                    },
                    'politics-choice': {
                        name: '公民問題',
                        icon: '⚖️',
                        desc: '政治・経済・社会',
                        answerFormat: 'A1',
                        currentEvents: true
                    },
                    'map-reading': {
                        name: '地図読取',
                        icon: '🧭',
                        desc: '資料読み取り',
                        answerFormat: 'B1',
                        requiresMap: true
                    }
                }
            },
            'general': {
                name: '一般',
                icon: '📋',
                color: '#6b7280',
                templates: {
                    'free-text': {
                        name: '記述式',
                        icon: '✏️',
                        desc: '自由記述解答',
                        answerFormat: 'F2',
                        wordLimits: [50, 100, 200, 500]
                    },
                    'image-choice': {
                        name: '画像選択',
                        icon: '🖼️',
                        desc: '画像から選択',
                        answerFormat: 'B1',
                        requiresCamera: true
                    },
                    'fill-blank': {
                        name: '穴埋め',
                        icon: '🔳',
                        desc: '空欄を補充',
                        answerFormat: 'C1',
                        blankTypes: ['text', 'number', 'date']
                    },
                    'matching': {
                        name: '組み合わせ',
                        icon: '🔗',
                        desc: '項目を結合',
                        answerFormat: 'D1',
                        minItems: 3,
                        maxItems: 8
                    },
                    'sequencing': {
                        name: '並べ替え',
                        icon: '📋',
                        desc: '順序を並べる',
                        answerFormat: 'E1',
                        sortable: true
                    },
                    'multi-select': {
                        name: '複数選択',
                        icon: '✅',
                        desc: '複数解答可能',
                        answerFormat: 'G1',
                        minSelect: 2,
                        maxSelect: 4
                    }
                }
            }
        };
        
        this.currentSubject = null;
        this.currentTemplate = null;
        this.currentQuestion = null;
        this.isEditing = false;
        this.recentQuestions = [];
        this.drafts = [];
        
        this.initEnhancedFeatures();
    }

    initEnhancedFeatures() {
        this.loadDrafts();
        this.setupAutoSave();
        this.setupVoiceInput();
        this.setupImageCapture();
        this.setupSmartSuggestions();
    }

    // 科目別テンプレートグリッドを表示
    renderEnhancedTemplates() {
        const grid = document.querySelector('.template-grid');
        if (!grid) return;

        // まず科目一覧を表示
        grid.innerHTML = Object.entries(this.subjectCategories).map(([subjectKey, subject]) => `
            <div class="subject-card" onclick="enhancedCreator.showSubjectTemplates('${subjectKey}')" data-subject="${subjectKey}">
                <div class="subject-icon" style="background-color: ${subject.color}">${subject.icon}</div>
                <div class="subject-name">${subject.name}</div>
                <div class="template-count">${Object.keys(subject.templates).length} テンプレート</div>
            </div>
        `).join('');
    }

    // 科目のテンプレート一覧を表示
    showSubjectTemplates(subjectKey) {
        const subject = this.subjectCategories[subjectKey];
        const grid = document.querySelector('.template-grid');
        const container = document.querySelector('.container');
        
        // 戻るボタンを追加
        const backButton = document.createElement('button');
        backButton.className = 'btn-secondary';
        backButton.innerHTML = '← 戻る';
        backButton.onclick = () => this.renderEnhancedTemplates();
        backButton.style.marginBottom = '20px';
        
        // 科目タイトル
        const subjectTitle = document.createElement('div');
        subjectTitle.className = 'subject-title';
        subjectTitle.innerHTML = `
            <div class="subject-header">
                <div class="subject-icon" style="background-color: ${subject.color}">${subject.icon}</div>
                <div class="subject-name">${subject.name}</div>
            </div>
        `;
        
        // テンプレート一覧を表示
        grid.innerHTML = Object.entries(subject.templates).map(([templateKey, template]) => `
            <div class="template-card subject-template" onclick="enhancedCreator.selectSubjectTemplate('${subjectKey}', '${templateKey}')" data-template="${templateKey}">
                <span class="template-icon">${template.icon}</span>
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.desc}</div>
                ${template.requiresCamera ? '<span class="template-badge camera">📷</span>' : ''}
                ${template.audioRequired ? '<span class="template-badge audio">🎵</span>' : ''}
            </div>
        `).join('');
        
        // 戻るボタンとタイトルを挿入
        container.insertBefore(backButton, container.firstChild);
        container.insertBefore(subjectTitle, backButton.nextSibling);
    }
    
    // 科目テンプレートを選択
    selectSubjectTemplate(subjectKey, templateKey) {
        const subject = this.subjectCategories[subjectKey];
        const template = subject.templates[templateKey];
        
        this.currentSubject = subjectKey;
        this.currentTemplate = templateKey;
        
        // UI更新
        this.updateTemplateSelection(`${subjectKey}-${templateKey}`);
        this.resetForm();
        this.setupEnhancedForm(subjectKey, templateKey);
        
        // 科目を自動設定
        this.setSubject(subjectKey);
        
        // テンプレート固有の初期化
        this.initializeTemplateFeatures(templateKey);
        
        this.showToast(`${subject.name} - ${template.name}テンプレートを選択しました`);
        
        // アナリティクス記録
        this.logTemplateUsage(`${subjectKey}-${templateKey}`);
    }

    // 拡張フォームセットアップ
    setupEnhancedForm(subjectKey, templateKey) {
        const subject = this.subjectCategories[subjectKey];
        const template = subject.templates[templateKey];
        const formContainer = document.getElementById('dynamicFormArea');
        
        if (!formContainer) return;
        
        let formHTML = `
            <div class="enhanced-form">
                <div class="form-section">
                    <label class="form-label">問題文</label>
                    <textarea id="questionText" class="form-input form-textarea" 
                        placeholder="問題文を入力してください..."></textarea>
                </div>
        `;
        
        // テンプレートに応じたフォーム要素を追加
        switch(templateKey) {
            case 'image-choice':
                formHTML += this.buildImageChoiceForm();
                break;
            case 'fill-blank':
                formHTML += this.buildFillBlankForm();
                break;
            case 'matching':
                formHTML += this.buildMatchingForm();
                break;
            case 'sequencing':
                formHTML += this.buildSequencingForm();
                break;
            case 'multi-select':
                formHTML += this.buildMultiSelectForm();
                break;
            case 'calculation':
                formHTML += this.buildCalculationForm();
                break;
            case 'listening':
                formHTML += this.buildListeningForm();
                break;
            case 'proof':
                formHTML += this.buildProofForm();
                break;
            case 'graph':
                formHTML += this.buildGraphForm();
                break;
            case 'reading':
                formHTML += this.buildReadingForm();
                break;
            case 'writing':
                formHTML += this.buildWritingForm();
                break;
            case 'experiment':
                formHTML += this.buildExperimentForm();
                break;
            case 'composition':
                formHTML += this.buildCompositionForm();
                break;
            case 'map-reading':
                formHTML += this.buildMapReadingForm();
                break;
            default:
                // 標準的な選択肢フォーム
                formHTML += this.buildStandardChoiceForm(subjectKey, templateKey);
        }
        
        // 難易度セレクター（科目によって異なる）
        formHTML += `
                <div class="form-section">
                    <label class="form-label">難易度</label>
                    <div id="difficultySelector">
                        ${this.buildDifficultySelector(subjectKey, templateKey)}
                    </div>
                </div>`;
                
                <div class="form-section">
                    <label class="form-label">タグ</label>
                    <input type="text" id="tags" class="form-input" placeholder="タグをカンマ区切りで入力">
                    <div class="tag-suggestions" id="tagSuggestions"></div>
                </div>
                
                <div class="form-section">
                    <label class="form-label">解説（任意）</label>
                    <textarea id="explanation" class="form-input form-textarea" 
                        placeholder="解説を入力してください..."></textarea>
                </div>
            </div>
        `;
        
        formContainer.innerHTML = formHTML;
        
        // イベントリスナーを設定
        this.setupFormEventListeners(subjectKey, templateKey);
    }

    // 画像選択フォーム
    buildImageChoiceForm() {
        return `
            <div class="form-section">
                <label class="form-label">メイン画像</label>
                <div class="image-upload-area" onclick="enhancedCreator.captureMainImage()">
                    <div class="upload-placeholder">
                        <span class="upload-icon">📷</span>
                        <p>タップして画像を撮影または選択</p>
                    </div>
                    <img id="mainImagePreview" class="image-preview" style="display: none;">
                </div>
            </div>
            
            <div class="form-section">
                <label class="form-label">選択肢画像</label>
                <div class="choice-images-grid">
                    ${[0,1,2,3].map(i => `
                        <div class="choice-image-item">
                            <div class="image-upload-area small" onclick="enhancedCreator.captureChoiceImage(${i})">
                                <span class="choice-number">${i+1}</span>
                                <img id="choiceImage${i}" class="choice-image-preview" style="display: none;">
                            </div>
                            <input type="text" class="form-input choice-text" 
                                id="choiceText${i}" placeholder="選択肢${i+1}の説明">
                            <label class="correct-checkbox">
                                <input type="checkbox" id="correct${i}">
                                正解
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 穴埋めフォーム
    buildFillBlankForm() {
        return `
            <div class="form-section">
                <label class="form-label">問題文（___ を空欄として使用）</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="例：東京は日本の___です。"></textarea>
                <button type="button" class="btn-secondary small" onclick="enhancedCreator.addBlank()">
                    + 空欄を挿入
                </button>
            </div>
            
            <div class="form-section" id="blanksSection">
                <label class="form-label">空欄の設定</label>
                <div id="blanksList"></div>
            </div>
        `;
    }

    // 組み合わせフォーム
    buildMatchingForm() {
        return `
            <div class="form-section">
                <label class="form-label">左側の項目</label>
                <div id="leftItems" class="items-list">
                    ${[0,1,2].map(i => `
                        <div class="item-input">
                            <input type="text" class="form-input" placeholder="項目${i+1}">
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary small" onclick="enhancedCreator.addLeftItem()">
                    + 項目を追加
                </button>
            </div>
            
            <div class="form-section">
                <label class="form-label">右側の項目</label>
                <div id="rightItems" class="items-list">
                    ${[0,1,2].map(i => `
                        <div class="item-input">
                            <input type="text" class="form-input" placeholder="項目${i+1}">
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary small" onclick="enhancedCreator.addRightItem()">
                    + 項目を追加
                </button>
            </div>
            
            <div class="form-section">
                <label class="form-label">正解の組み合わせ</label>
                <div id="matchingPairs" class="pairs-list">
                    <!-- 動的に生成 -->
                </div>
            </div>
        `;
    }

    // 並べ替えフォーム
    buildSequencingForm() {
        return `
            <div class="form-section">
                <label class="form-label">項目（ドラッグで順序を変更）</label>
                <div id="sortableItems" class="sortable-list">
                    ${['ステップ1', 'ステップ2', 'ステップ3'].map((item, i) => `
                        <div class="sortable-item" draggable="true">
                            <span class="drag-handle">≡</span>
                            <input type="text" class="form-input" value="${item}">
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-secondary small" onclick="enhancedCreator.addSortableItem()">
                    + 項目を追加
                </button>
            </div>
        `;
    }

    // 複数選択フォーム
    buildMultiSelectForm() {
        return `
            <div class="form-section">
                <label class="form-label">選択肢（複数選択可）</label>
                <div class="choice-inputs active">
                    ${[0,1,2,3].map(i => `
                        <div class="choice-item">
                            <span class="choice-number">${i+1}</span>
                            <input type="text" class="form-input" placeholder="選択肢${i+1}">
                            <label class="correct-checkbox">
                                <input type="checkbox" id="correct${i}">
                                正解
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 計算問題フォーム
    buildCalculationForm() {
        return `
            <div class="form-section">
                <label class="form-label">問題文</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="例：次の計算をしなさい"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">式（オプション）</label>
                <div class="expression-builder">
                    <div class="expression-display" id="expressionDisplay"></div>
                    <div class="expression-buttons">
                        ${['+', '-', '×', '÷', '(', ')', 'x', 'y', 'a', 'b'].map(symbol => `
                            <button type="button" class="expr-btn" onclick="enhancedCreator.addToExpression('${symbol}')">
                                ${symbol}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <label class="form-label">答え</label>
                <input type="text" id="answer" class="form-input" placeholder="答えを入力">
            </div>
        `;
    }
    
    // 証明問題フォーム
    buildProofForm() {
        return `
            <div class="form-section">
                <label class="form-label">証明する命題</label>
                <textarea id="proposition" class="form-input form-textarea" 
                    placeholder="証明する内容を記述"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">ヒント（任意）</label>
                <textarea id="hint" class="form-input form-textarea" 
                    placeholder="証明のヒントを提供"></textarea>
            </div>
        `;
    }
    
    // グラフ問題フォーム
    buildGraphForm() {
        return `
            <div class="form-section">
                <label class="form-label">関数</label>
                <input type="text" id="function" class="form-input" 
                    placeholder="例：y = x^2 + 2x + 1">
            </div>
            
            <div class="form-section">
                <label class="form-label">グラフに関する質問</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="例：このグラフの頂点の座標を求めなさい"></textarea>
            </div>
        `;
    }
    
    // 読解問題フォーム
    buildReadingForm() {
        return `
            <div class="form-section">
                <label class="form-label">本文</label>
                <textarea id="passage" class="form-input form-textarea" 
                    placeholder="読解させる文章を入力" style="min-height: 200px;"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">設問</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="本文に関する質問"></textarea>
            </div>
        `;
    }
    
    // 作文フォーム
    buildWritingForm() {
        return `
            <div class="form-section">
                <label class="form-label">テーマ</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="作文のテーマを提示"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">条件</label>
                <div class="writing-conditions">
                    <label>字数：<input type="number" id="wordCount" class="form-input" style="width: 100px;" value="200"></label>
                    <label>形式：
                        <select id="format" class="form-input">
                            <option value="opinion">意見文</option>
                            <option value="description">説明文</option>
                            <option value="narrative">叙事文</option>
                        </select>
                    </label>
                </div>
            </div>
        `;
    }
    
    // 実験問題フォーム
    buildExperimentForm() {
        return `
            <div class="form-section">
                <label class="form-label">実験の目的</label>
                <textarea id="purpose" class="form-input form-textarea" 
                    placeholder="実験の目的を記述"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">使用する材料</label>
                <textarea id="materials" class="form-input form-textarea" 
                    placeholder="実験で使用する材料を列挙"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">手順に関する質問</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="実験手順に関する質問"></textarea>
            </div>
        `;
    }
    
    // 作文フォーム（国語）
    buildCompositionForm() {
        return `
            <div class="form-section">
                <label class="form-label">課題</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="作文の課題を提示"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">条件</label>
                <div class="composition-conditions">
                    <label>原稿用紙：<input type="number" id="sheets" class="form-input" style="width: 80px;" value="3">枚</label>
                    <label>形式：
                        <select id="compFormat" class="form-input">
                            <option value="opinion">意見文</option>
                            <option value="description">説明文</option>
                            <option value="letter">手紙文</option>
                            <option value="report">報告文</option>
                        </select>
                    </label>
                </div>
            </div>
        `;
    }
    
    // 地図読取フォーム
    buildMapReadingForm() {
        return `
            <div class="form-section">
                <label class="form-label">地図・資料</label>
                <div class="map-upload-area" onclick="enhancedCreator.uploadMap()">
                    <div class="upload-placeholder">
                        <span class="upload-icon">🗺️</span>
                        <p>地図または資料をアップロード</p>
                    </div>
                    <img id="mapPreview" class="map-preview" style="display: none;">
                </div>
            </div>
            
            <div class="form-section">
                <label class="form-label">設問</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="地図に関する質問"></textarea>
            </div>
        `;
    }

    // リスニングフォーム
    buildListeningForm() {
        return `
            <div class="form-section">
                <label class="form-label">音声</label>
                <div class="audio-upload-area" onclick="enhancedCreator.recordAudio()">
                    <div class="upload-placeholder">
                        <span class="upload-icon">🎤</span>
                        <p>タップして録音または音声ファイルを選択</p>
                    </div>
                    <audio id="audioPlayer" controls style="display: none;"></audio>
                </div>
            </div>
            
            <div class="form-section">
                <label class="form-label">問題文</label>
                <textarea id="questionText" class="form-input form-textarea" 
                    placeholder="例：音声を聞いて質問に答えなさい"></textarea>
            </div>
            
            <div class="form-section">
                <label class="form-label">選択肢</label>
                <div class="choice-inputs active">
                    ${[0,1,2,3].map(i => `
                        <div class="choice-item">
                            <span class="choice-number">${i+1}</span>
                            <input type="text" class="form-input" placeholder="選択肢${i+1}">
                            <label class="correct-checkbox">
                                <input type="checkbox" id="correct${i}">
                                正解
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 難易度セレクターを構築
    buildDifficultySelector(subjectKey, templateKey) {
        if (subjectKey === 'math') {
            // 数学の場合はテンプレート名に難易度が含まれているので表示のみ
            const template = this.subjectCategories.math.templates[templateKey];
            if (template) {
                return `
                    <div class="math-difficulty-display">
                        <span class="difficulty-code">${template.name}</span>
                        <span class="difficulty-desc">${template.desc}</span>
                    </div>
                `;
            }
        }
        
        // その他の科目は1-5の選択
        return `
            <div class="difficulty-selector">
                ${[1,2,3,4,5].map(level => `
                    <button type="button" class="difficulty-btn" data-level="${level}" onclick="enhancedCreator.setDifficulty(${level})">
                        ${level}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // 標準的な選択肢フォーム
    buildStandardChoiceForm(subjectKey, templateKey) {
        const choiceCount = templateKey === 'english-choice-5' ? 5 : 4;
        return `
            <div class="form-section">
                <label class="form-label">選択肢</label>
                <div class="choice-inputs active">
                    ${Array.from({length: choiceCount}, (_, i) => `
                        <div class="choice-item">
                            <span class="choice-number">${i+1}</span>
                            <input type="text" class="form-input" placeholder="選択肢${i+1}">
                            <label class="correct-checkbox">
                                <input type="checkbox" id="correct${i}">
                                正解
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // スマート提案機能
    setupSmartSuggestions() {
        const questionText = document.getElementById('questionText');
        if (!questionText) return;

        questionText.addEventListener('input', (e) => {
            const text = e.target.value.toLowerCase();
            
            // 数式検出
            if (/[0-9+\-*/=]/.test(text)) {
                this.showLatexHelpers();
            }
            
            // タグ提案
            this.suggestTags(text);
            
            // 難易度推定
            this.estimateDifficulty(text);
            
            // 自動保存
            this.saveToDraft();
        });
    }

    // タグ提案
    suggestTags(text) {
        const suggestions = {
            '計算': ['算数', '四則演算', '計算問題'],
            '方程式': ['代数', '一次方程式', '二次方程式'],
            '図形': ['幾何', '面積', '体積'],
            'グラフ': ['関数', '座標', '比例'],
            '確率': ['確率', '統計', '場合の数'],
            '英文法': ['grammar', 'tense', 'article'],
            '単語': ['vocabulary', 'word', 'meaning'],
            '読解': ['reading', 'comprehension'],
            '物理': ['力学', '電気', '波動'],
            '化学': ['反応', '物質', '元素']
        };
        
        const matchedTags = [];
        Object.entries(suggestions).forEach(([keyword, tags]) => {
            if (text.includes(keyword)) {
                matchedTags.push(...tags);
            }
        });
        
        if (matchedTags.length > 0) {
            this.displayTagSuggestions([...new Set(matchedTags)]);
        }
    }

    // タグ提案を表示
    displayTagSuggestions(tags) {
        const container = document.getElementById('tagSuggestions');
        if (!container) return;
        
        container.innerHTML = tags.map(tag => `
            <span class="tag-suggestion" onclick="enhancedCreator.addTag('${tag}')">
                ${tag}
            </span>
        `).join('');
        container.style.display = 'flex';
    }

    // タグを追加
    addTag(tag) {
        const tagsInput = document.getElementById('tags');
        const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        
        if (!currentTags.includes(tag)) {
            currentTags.push(tag);
            tagsInput.value = currentTags.join(', ');
        }
        
        document.getElementById('tagSuggestions').style.display = 'none';
    }

    // 難易度推定
    estimateDifficulty(text) {
        // 簡易的な難易度推定アルゴリズム
        let score = 3; // デフォルト
        
        // 文字数
        if (text.length > 100) score += 0.5;
        if (text.length > 200) score += 0.5;
        
        // 複雑さの指標
        const complexity = text.match(/[(){}[\]^√∑∫∞∂π≠≤≥≈]/g) || [];
        score += complexity.length * 0.3;
        
        // 専門用語
        const terms = ['微分', '積分', '行列', 'ベクトル', '確率分布', '量子'];
        terms.forEach(term => {
            if (text.includes(term)) score += 0.5;
        });
        
        // 制限内に収める
        score = Math.max(1, Math.min(5, Math.round(score)));
        
        // 難易度ボタンをハイライト
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.level) === score) {
                btn.classList.add('selected');
            }
        });
    }

    // 自動保存機能
    setupAutoSave() {
        setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.saveToDraft();
            }
        }, 30000); // 30秒ごと
    }

    // 下書き保存
    saveToDraft() {
        const draft = {
            id: Date.now(),
            subject: this.currentSubject,
            template: this.currentTemplate,
            data: this.getFormData(),
            timestamp: new Date().toISOString()
        };
        
        // 既存の下書きを更新または新規作成
        const existingIndex = this.drafts.findIndex(d => 
            d.subject === this.currentSubject && d.template === this.currentTemplate
        );
        if (existingIndex >= 0) {
            this.drafts[existingIndex] = draft;
        } else {
            this.drafts.push(draft);
        }
        
        // localStorageに保存
        localStorage.setItem('qm_drafts', JSON.stringify(this.drafts));
        
        // UIに通知
        this.showAutoSaveIndicator();
    }

    // 下書きを読み込む
    loadDrafts() {
        const saved = localStorage.getItem('qm_drafts');
        if (saved) {
            this.drafts = JSON.parse(saved);
        }
    }

    // 下書きを復元
    restoreDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (draft) {
            this.selectSubjectTemplate(draft.subject, draft.template);
            this.setFormData(draft.data);
            this.showToast('下書きを復元しました');
        }
    }

    // 音声入力機能
    setupVoiceInput() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'ja-JP';
            recognition.continuous = false;
            
            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'voice-input-btn';
            voiceBtn.innerHTML = '🎤';
            voiceBtn.onclick = () => {
                recognition.start();
                voiceBtn.classList.add('recording');
            };
            
            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                const questionText = document.getElementById('questionText');
                if (questionText) {
                    questionText.value += text;
                    voiceBtn.classList.remove('recording');
                }
            };
            
            // 問題文エリアの横にボタンを追加
            const questionArea = document.querySelector('#questionText').parentElement;
            if (questionArea) {
                questionArea.style.position = 'relative';
                questionArea.appendChild(voiceBtn);
            }
        }
    }

    // 画像キャプチャ機能
    setupImageCapture() {
        // カメラアクセスのチェック
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.hasCamera = true;
        }
    }

    // メイン画像のキャプチャ
    async captureMainImage() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            // カメラプレビューを表示
            this.showCameraPreview(stream, (imageData) => {
                this.mainImageData = imageData;
                this.displayImagePreview('mainImagePreview', imageData);
            });
        } catch (error) {
            // ファイル選択にフォールバック
            this.selectImageFile().then(imageData => {
                this.mainImageData = imageData;
                this.displayImagePreview('mainImagePreview', imageData);
            });
        }
    }

    // テンプレート使用ログ
    logTemplateUsage(templateType) {
        const usage = JSON.parse(localStorage.getItem('qm_template_usage') || '{}');
        usage[templateType] = (usage[templateType] || 0) + 1;
        localStorage.setItem('qm_template_usage', JSON.stringify(usage));
    }

    // お気に入りテンプレート
    getFavoriteTemplates() {
        const usage = JSON.parse(localStorage.getItem('qm_template_usage') || '{}');
        return Object.entries(usage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([template]) => template);
    }

    // 保存処理の拡張
    async saveQuestion() {
        const questionData = this.buildQuestionData();
        
        // 検証
        const validation = this.validateQuestion(questionData);
        if (!validation.valid) {
            this.showToast(validation.message, 'error');
            return;
        }
        
        // 保存
        try {
            const db = window.Database;
            await db.saveQuestion(questionData);
            
            // 成功処理
            this.showToast('問題を保存しました！', 'success');
            this.clearForm();
            this.removeFromDrafts();
            
            // 最近の問題に追加
            this.addToRecentQuestions(questionData);
            
            // 振動フィードバック（モバイルの場合）
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
            
        } catch (error) {
            console.error('Save failed:', error);
            this.showToast('保存に失敗しました', 'error');
        }
    }

    // 質問データの構築
    buildQuestionData() {
        const baseData = {
            id: this.currentQuestion?.id || this.generateId(),
            answerFormat: this.getAnswerFormat(),
            subject: this.currentSubject || 'other',
            topic: document.getElementById('topic')?.value || 'general',
            difficulty: this.getDifficulty(),
            tags: this.getTags(),
            questionContent: {
                text: document.getElementById('questionText').value,
                latex: this.containsLatex(document.getElementById('questionText').value)
            },
            answerData: this.getAnswerData(),
            explanation: {
                text: document.getElementById('explanation')?.value || ''
            },
            metadata: {
                estimatedTime: this.estimateTime(),
                createdAt: new Date().toISOString(),
                createdBy: 'sys'
            },
            active: true
        };
        
        // テンプレート固有のデータを追加
        return this.addTemplateSpecificData(baseData);
    }

    // ヘルパーメソッド
    generateId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getAnswerFormat() {
        if (!this.currentSubject || !this.currentTemplate) return 'A1';
        
        const subject = this.subjectCategories[this.currentSubject];
        const template = subject.templates[this.currentTemplate];
        
        return template.answerFormat || 'A1';
    }

    containsLatex(text) {
        return /[\\$]/.test(text);
    }

    estimateTime() {
        // 数学の場合はテンプレートの推定時間を使用
        if (this.currentSubject === 'math' && this.currentTemplate) {
            const template = this.subjectCategories.math.templates[this.currentTemplate];
            if (template.estimatedTime) {
                return template.estimatedTime;
            }
        }
        
        // その他の科目は問題の長さと複雑さから推定時間を計算
        const text = document.getElementById('questionText').value;
        const baseTime = 60; // 基本時間60秒
        
        // 文字数による追加時間
        const timePerChar = text.length > 100 ? 0.5 : 0.3;
        
        // 選択肢の数
        const choiceCount = document.querySelectorAll('.choice-item').length;
        
        return Math.round(baseTime + (text.length * timePerChar) + (choiceCount * 10));
    }

    // UIヘルパー
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = '自動保存しました';
        document.body.appendChild(indicator);
        
        setTimeout(() => indicator.remove(), 2000);
    }
    
    // 不足しているヘルパーメソッド
    updateTemplateSelection(templateId) {
        // テンプレート選択状態を更新
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-template="${templateId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
    
    resetForm() {
        // フォームをリセット
        const formContainer = document.getElementById('dynamicFormArea');
        if (formContainer) {
            formContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">📝 問題文</label>
                    <textarea class="form-input form-textarea" id="questionText" 
                        placeholder="問題文を入力してください..."></textarea>
                </div>
            `;
        }
    }
    
    setSubject(subject) {
        // 科目を設定（隠しフィールドなどがあれば）
        const subjectField = document.getElementById('subject');
        if (subjectField) {
            subjectField.value = subject;
        }
    }
    
    initializeTemplateFeatures(templateKey) {
        // テンプレート固有の機能を初期化
        switch(templateKey) {
            case 'calculation':
                this.setupExpressionBuilder();
                break;
            case 'math-choice':
            case 'physics-choice':
                this.showLatexHelpers();
                break;
        }
    }
    
    setDifficulty(level) {
        // 難易度を設定
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.level) === level) {
                btn.classList.add('selected');
            }
        });
    }
    
    getDifficulty() {
        // 数学の場合はA1-D4コード、その他は1-5
        if (this.currentSubject === 'math' && this.currentTemplate) {
            const template = this.subjectCategories.math.templates[this.currentTemplate];
            if (template.difficultyLevel && template.calculationAmount) {
                return `${template.difficultyLevel}${template.calculationAmount}`;
            }
        }
        
        // その他の科目は1-5
        const selected = document.querySelector('.difficulty-btn.selected');
        return selected ? parseInt(selected.dataset.level) : 3;
    }
    
    getTags() {
        // タグを取得
        const tagsInput = document.getElementById('tags');
        return tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];
    }
    
    getAnswerData() {
        // 回答データを取得
        const answerData = {
            choices: [],
            correctAnswers: []
        };
        
        // 選択肢を収集
        document.querySelectorAll('.choice-item').forEach((item, index) => {
            const input = item.querySelector('input[type="text"]');
            const checkbox = item.querySelector('input[type="checkbox"]');
            
            if (input) {
                answerData.choices.push(input.value);
                if (checkbox && checkbox.checked) {
                    answerData.correctAnswers.push(index);
                }
            }
        });
        
        return answerData;
    }
    
    validateQuestion(questionData) {
        // 質問データを検証
        if (!questionData.questionContent.text.trim()) {
            return { valid: false, message: '問題文を入力してください' };
        }
        
        return { valid: true };
    }
    
    clearForm() {
        // フォームをクリア
        this.resetForm();
        document.getElementById('explanation').value = '';
        document.getElementById('tags').value = '';
    }
    
    removeFromDrafts() {
        // 下書きから削除
        if (this.currentSubject && this.currentTemplate) {
            this.drafts = this.drafts.filter(d => 
                !(d.subject === this.currentSubject && d.template === this.currentTemplate)
            );
            localStorage.setItem('qm_drafts', JSON.stringify(this.drafts));
        }
    }
    
    addToRecentQuestions(question) {
        // 最近の問題に追加
        this.recentQuestions.unshift(question);
        if (this.recentQuestions.length > 10) {
            this.recentQuestions = this.recentQuestions.slice(0, 10);
        }
        localStorage.setItem('qm_recent_questions', JSON.stringify(this.recentQuestions));
    }
    
    addTemplateSpecificData(baseData) {
        // テンプレート固有のデータを追加
        return baseData;
    }
    
    hasUnsavedChanges() {
        // 保存されていない変更があるかチェック
        const questionText = document.getElementById('questionText');
        return questionText && questionText.value.trim().length > 0;
    }
    
    getFormData() {
        // フォームデータを取得
        return {
            questionText: document.getElementById('questionText')?.value || '',
            explanation: document.getElementById('explanation')?.value || '',
            tags: document.getElementById('tags')?.value || '',
            // その他のフォームデータ...
        };
    }
    
    setFormData(data) {
        // フォームデータを設定
        if (data.questionText) {
            document.getElementById('questionText').value = data.questionText;
        }
        if (data.explanation) {
            document.getElementById('explanation').value = data.explanation;
        }
        if (data.tags) {
            document.getElementById('tags').value = data.tags;
        }
    }
    
    setupFormEventListeners(subjectKey, templateKey) {
        // フォームのイベントリスナーを設定
        // 必要に応じてオーバーライド
    }
    
    showLatexHelpers() {
        // LaTeXヘルパーを表示
        const helpers = document.getElementById('latexHelpers');
        if (helpers) {
            helpers.style.display = 'flex';
        }
    }
    
    setupExpressionBuilder() {
        // 式ビルダーをセットアップ
        // 必要に応じて実装
    }
    
    addBlank() {
        // 空欄を挿入
        const questionText = document.getElementById('questionText');
        if (questionText) {
            const pos = questionText.selectionStart;
            const text = questionText.value;
            questionText.value = text.slice(0, pos) + '___' + text.slice(pos);
            questionText.focus();
            questionText.setSelectionRange(pos + 3, pos + 3);
        }
    }
    
    addLeftItem() {
        // 左側項目を追加
        const container = document.getElementById('leftItems');
        if (container) {
            const count = container.children.length;
            const div = document.createElement('div');
            div.className = 'item-input';
            div.innerHTML = `<input type="text" class="form-input" placeholder="項目${count + 1}">`;
            container.appendChild(div);
        }
    }
    
    addRightItem() {
        // 右側項目を追加
        const container = document.getElementById('rightItems');
        if (container) {
            const count = container.children.length;
            const div = document.createElement('div');
            div.className = 'item-input';
            div.innerHTML = `<input type="text" class="form-input" placeholder="項目${count + 1}">`;
            container.appendChild(div);
        }
    }
    
    addSortableItem() {
        // 並べ替え項目を追加
        const container = document.getElementById('sortableItems');
        if (container) {
            const count = container.children.length;
            const div = document.createElement('div');
            div.className = 'sortable-item';
            div.draggable = true;
            div.innerHTML = `
                <span class="drag-handle">≡</span>
                <input type="text" class="form-input" value="ステップ${count + 1}">
            `;
            container.appendChild(div);
        }
    }
    
    addToExpression(symbol) {
        // 式に記号を追加
        const display = document.getElementById('expressionDisplay');
        if (display) {
            display.textContent += symbol;
        }
    }
    
    recordAudio() {
        // 音声録音機能
        // 実装が必要
        alert('音声録音機能は開発中です');
    }
    
    uploadMap() {
        // 地図アップロード機能
        // 実装が必要
        alert('地図アップロード機能は開発中です');
    }
    
    captureChoiceImage(index) {
        // 選択肢画像をキャプチャ
        // 実装が必要
        alert('画像キャプチャ機能は開発中です');
    }
    
    selectImageFile() {
        // 画像ファイルを選択
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }
    
    displayImagePreview(elementId, imageData) {
        // 画像プレビューを表示
        const img = document.getElementById(elementId);
        if (img) {
            img.src = imageData;
            img.style.display = 'block';
            img.parentElement.querySelector('.upload-placeholder').style.display = 'none';
        }
    }
    
    showCameraPreview(stream, callback) {
        // カメラプレビューを表示
        // 実装が必要
        alert('カメラプレビュー機能は開発中です');
    }
}

// グローバルに公開
window.EnhancedMobileCreator = EnhancedMobileCreator;