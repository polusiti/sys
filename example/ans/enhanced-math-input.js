class EnhancedMathInputSystem {
    constructor() {
        this.currentMode = 'choice';
        this.currentTemplate = null;
        this.selectedChoice = null;
        
        // DOM要素の初期化
        this.initializeDOMElements();
        
        // 数学定義データ
        this.mathDefinitions = this.initializeMathDefinitions();
        
        // 入力補完用データ
        this.suggestions = this.initializeSuggestions();
        
        // イベントリスナー設定
        this.initializeEventListeners();
        
        // 初期状態設定
        this.initializeInterface();
    }
    
    initializeDOMElements() {
        // モードタブ
        this.modeTabs = document.querySelectorAll('.input-mode-tab');
        this.inputPanels = document.querySelectorAll('.input-panel');
        
        // A1: 選択式
        this.choiceGrid = document.getElementById('choiceGrid');
        this.selectedChoiceInfo = document.getElementById('selectedChoiceInfo');
        this.selectedChoicePreview = document.getElementById('selectedChoicePreview');
        this.choiceInputFields = document.getElementById('choiceInputFields');
        
        // F1: テンプレート
        this.templateTabs = document.querySelectorAll('.template-tab');
        this.templateGrid = document.getElementById('templateGrid');
        this.templateInputFields = document.getElementById('templateInputFields');
        
        // F2: 自由入力
        this.freeInput = document.getElementById('freeInput');
        this.suggestionsPanel = document.getElementById('suggestionsPanel');
        
        // 結果表示
        this.resultPreview = document.getElementById('resultPreview');
        this.latexOutput = document.getElementById('latexOutput');
        this.geogebraOutput = document.getElementById('geogebraOutput');
        this.numericOutput = document.getElementById('numericOutput');
        this.syntaxCheck = document.getElementById('syntaxCheck');
        
        // ボタン
        this.evaluateBtn = document.getElementById('evaluateBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.copyLatexBtn = document.getElementById('copyLatexBtn');
    }
    
    initializeMathDefinitions() {
        return {
            // A1: 選択式問題タイプ
            choiceTypes: [
                {
                    id: 'quadratic',
                    name: '二次方程式',
                    description: 'ax² + bx + c = 0の形の方程式',
                    latex: 'ax^2 + bx + c = 0',
                    template: 'a*x^2 + b*x + c',
                    fields: [
                        { name: 'a', label: '係数a', placeholder: '1', type: 'number' },
                        { name: 'b', label: '係数b', placeholder: '2', type: 'number' },
                        { name: 'c', label: '係数c', placeholder: '1', type: 'number' }
                    ]
                },
                {
                    id: 'linear_system',
                    name: '連立方程式',
                    description: '二元一次連立方程式',
                    latex: '\\begin{cases} ax + by = e \\\\ cx + dy = f \\end{cases}',
                    template: 'system{a*x + b*y = e, c*x + d*y = f}',
                    fields: [
                        { name: 'a', label: '係数a', placeholder: '1', type: 'number' },
                        { name: 'b', label: '係数b', placeholder: '1', type: 'number' },
                        { name: 'c', label: '係数c', placeholder: '1', type: 'number' },
                        { name: 'd', label: '係数d', placeholder: '-1', type: 'number' },
                        { name: 'e', label: '定数e', placeholder: '3', type: 'number' },
                        { name: 'f', label: '定数f', placeholder: '1', type: 'number' }
                    ]
                },
                {
                    id: 'trigonometric',
                    name: '三角関数',
                    description: 'sin, cos, tanを含む式',
                    latex: 'A\\sin(Bx + C) + D',
                    template: 'A*sin(B*x + C) + D',
                    fields: [
                        { name: 'A', label: '振幅A', placeholder: '1', type: 'number' },
                        { name: 'B', label: '周期B', placeholder: '1', type: 'number' },
                        { name: 'C', label: '位相C', placeholder: '0', type: 'number' },
                        { name: 'D', label: '垂直移動D', placeholder: '0', type: 'number' }
                    ]
                },
                {
                    id: 'exponential',
                    name: '指数・対数関数',
                    description: '指数関数、対数関数',
                    latex: 'A \\cdot b^{x} + C',
                    template: 'A * b^x + C',
                    fields: [
                        { name: 'A', label: '係数A', placeholder: '1', type: 'number' },
                        { name: 'b', label: '底b', placeholder: '2', type: 'number' },
                        { name: 'C', label: '定数C', placeholder: '0', type: 'number' }
                    ]
                },
                {
                    id: 'derivative',
                    name: '微分',
                    description: 'f(x)の導関数',
                    latex: '\\frac{d}{dx}[f(x)]',
                    template: 'derivative(f(x), x)',
                    fields: [
                        { name: 'function', label: '関数f(x)', placeholder: 'x^2 + 2*x + 1', type: 'text' }
                    ]
                },
                {
                    id: 'integral',
                    name: '積分',
                    description: 'f(x)の不定積分',
                    latex: '\\int f(x) dx',
                    template: 'integrate(f(x), x)',
                    fields: [
                        { name: 'function', label: '被積分関数f(x)', placeholder: 'x^2 + 2*x + 1', type: 'text' },
                        { name: 'lower', label: '下限（定積分の場合）', placeholder: '', type: 'text' },
                        { name: 'upper', label: '上限（定積分の場合）', placeholder: '', type: 'text' }
                    ]
                }
            ],
            
            // F1: テンプレート
            templates: {
                basic: [
                    { name: '一次関数', syntax: 'a*x + b', latex: 'ax + b' },
                    { name: '二次関数', syntax: 'a*x^2 + b*x + c', latex: 'ax^2 + bx + c' },
                    { name: '三次関数', syntax: 'a*x^3 + b*x^2 + c*x + d', latex: 'ax^3 + bx^2 + cx + d' },
                    { name: '分数', syntax: 'frac{a}{b}', latex: '\\frac{a}{b}' },
                    { name: '平方根', syntax: 'sqrt{a}', latex: '\\sqrt{a}' },
                    { name: '累乗', syntax: 'a^b', latex: 'a^b' }
                ],
                algebra: [
                    { name: '因数分解', syntax: '(a + b)(c + d)', latex: '(a + b)(c + d)' },
                    { name: '展開', syntax: '(a + b)^2', latex: '(a + b)^2' },
                    { name: '連立方程式', syntax: 'system{a*x + b*y = c, d*x + e*y = f}', latex: '\\begin{cases} ax + by = c \\\\ dx + ey = f \\end{cases}' },
                    { name: '不等式', syntax: 'a*x + b > c', latex: 'ax + b > c' },
                    { name: '絶対値', syntax: 'abs(a)', latex: '|a|' }
                ],
                calculus: [
                    { name: '微分', syntax: 'derivative(f(x), x)', latex: '\\frac{d}{dx}[f(x)]' },
                    { name: '偏微分', syntax: 'partial(f(x,y), x)', latex: '\\frac{\\partial f}{\\partial x}' },
                    { name: '不定積分', syntax: 'integrate(f(x), x)', latex: '\\int f(x) dx' },
                    { name: '定積分', syntax: 'integrate(f(x), x, a, b)', latex: '\\int_a^b f(x) dx' },
                    { name: '極限', syntax: 'limit(f(x), x, a)', latex: '\\lim_{x \\to a} f(x)' },
                    { name: 'Σ記号', syntax: 'sum(f(k), k, 1, n)', latex: '\\sum_{k=1}^n f(k)' }
                ],
                linear: [
                    { name: '行列', syntax: 'matrix[[a, b], [c, d]]', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
                    { name: '行列式', syntax: 'det(matrix[[a, b], [c, d]])', latex: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
                    { name: 'ベクトル', syntax: 'vector[a, b, c]', latex: '\\vec{v} = \\begin{pmatrix} a \\\\ b \\\\ c \\end{pmatrix}' },
                    { name: '内積', syntax: 'dot(vector[a1, b1], vector[a2, b2])', latex: '\\vec{a} \\cdot \\vec{b}' },
                    { name: '外積', syntax: 'cross(vector[a1, b1, c1], vector[a2, b2, c2])', latex: '\\vec{a} \\times \\vec{b}' }
                ],
                geometry: [
                    { name: '距離', syntax: 'distance(point(x1, y1), point(x2, y2))', latex: '\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}' },
                    { name: '円の方程式', syntax: '(x - a)^2 + (y - b)^2 = r^2', latex: '(x - a)^2 + (y - b)^2 = r^2' },
                    { name: '直線の方程式', syntax: 'y = a*x + b', latex: 'y = ax + b' },
                    { name: '三角形の面積', syntax: 'area_triangle(a, b, c)', latex: 'S = \\sqrt{s(s-a)(s-b)(s-c)}' }
                ]
            }
        };
    }
    
    initializeSuggestions() {
        return [
            // 基本関数
            { input: 'sin', latex: '\\sin', syntax: 'sin(x)' },
            { input: 'cos', latex: '\\cos', syntax: 'cos(x)' },
            { input: 'tan', latex: '\\tan', syntax: 'tan(x)' },
            { input: 'log', latex: '\\log', syntax: 'log(x)' },
            { input: 'ln', latex: '\\ln', syntax: 'ln(x)' },
            { input: 'sqrt', latex: '\\sqrt{}', syntax: 'sqrt{x}' },
            { input: 'frac', latex: '\\frac{}{}', syntax: 'frac{a}{b}' },
            { input: 'int', latex: '\\int', syntax: 'integrate(f(x), x)' },
            { input: 'sum', latex: '\\sum', syntax: 'sum(f(k), k, 1, n)' },
            { input: 'lim', latex: '\\lim', syntax: 'limit(f(x), x, a)' },
            { input: 'pi', latex: '\\pi', syntax: 'pi' },
            { input: 'alpha', latex: '\\alpha', syntax: 'alpha' },
            { input: 'beta', latex: '\\beta', syntax: 'beta' },
            { input: 'gamma', latex: '\\gamma', syntax: 'gamma' },
            { input: 'theta', latex: '\\theta', syntax: 'theta' }
        ];
    }
    
    initializeEventListeners() {
        // モード切り替え
        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });
        
        // A1: 選択式
        this.choiceGrid.addEventListener('click', (e) => {
            const choiceItem = e.target.closest('.choice-item');
            if (choiceItem) {
                this.selectChoice(choiceItem.dataset.choiceId);
            }
        });
        
        // F1: テンプレート
        this.templateTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTemplateCategory(e.target.dataset.category);
            });
        });
        
        this.templateGrid.addEventListener('click', (e) => {
            const templateItem = e.target.closest('.template-item');
            if (templateItem) {
                this.selectTemplate(templateItem.dataset.template);
            }
        });
        
        // F2: 自由入力
        this.freeInput.addEventListener('input', (e) => {
            this.handleFreeInput(e);
        });
        
        this.freeInput.addEventListener('keydown', (e) => {
            this.handleFreeInputKeydown(e);
        });
        
        // ツールバーボタン
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertAtCursor(e.target.dataset.input);
            });
        });
        
        // コントロールボタン
        this.evaluateBtn.addEventListener('click', () => {
            this.evaluateExpression();
        });
        
        this.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });
        
        this.copyLatexBtn.addEventListener('click', () => {
            this.copyLatexToClipboard();
        });
        
        // 入力フィールドの変更監視
        document.addEventListener('input', (e) => {
            if (e.target.matches('.input-field input')) {
                this.updateFromFields();
            }
        });
    }
    
    initializeInterface() {
        this.generateChoiceTypes();
        this.generateTemplates('basic');
        this.updateDisplay();
    }
    
    // === モード切り替え ===
    switchMode(mode) {
        this.currentMode = mode;
        
        // タブの切り替え
        this.modeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // パネルの切り替え
        this.inputPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === mode);
        });
        
        this.updateDisplay();
    }
    
    // === A1: 選択式入力 ===
    generateChoiceTypes() {
        this.choiceGrid.innerHTML = '';
        
        this.mathDefinitions.choiceTypes.forEach(choice => {
            const choiceElement = document.createElement('div');
            choiceElement.className = 'choice-item';
            choiceElement.dataset.choiceId = choice.id;
            
            choiceElement.innerHTML = `
                <div class="choice-preview" id="preview-${choice.id}"></div>
                <div class="choice-label">
                    <strong>${choice.name}</strong><br>
                    ${choice.description}
                </div>
            `;
            
            this.choiceGrid.appendChild(choiceElement);
            
            // MathJaxで数式をレンダリング
            setTimeout(() => {
                const previewElement = document.getElementById(`preview-${choice.id}`);
                previewElement.innerHTML = `$$${choice.latex}$$`;
                if (window.MathJax) {
                    window.MathJax.typesetPromise([previewElement]).catch(err => console.log(err));
                }
            }, 100);
        });
    }
    
    selectChoice(choiceId) {
        // 選択状態の更新
        document.querySelectorAll('.choice-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.choiceId === choiceId);
        });
        
        this.selectedChoice = this.mathDefinitions.choiceTypes.find(c => c.id === choiceId);
        
        if (this.selectedChoice) {
            this.generateChoiceFields();
            this.selectedChoiceInfo.style.display = 'block';
            this.updateDisplay();
        }
    }
    
    generateChoiceFields() {
        if (!this.selectedChoice) return;
        
        // プレビュー更新
        this.selectedChoicePreview.innerHTML = `$$${this.selectedChoice.latex}$$`;
        if (window.MathJax) {
            window.MathJax.typesetPromise([this.selectedChoicePreview]).catch(err => console.log(err));
        }
        
        // 入力フィールド生成
        this.choiceInputFields.innerHTML = '';
        
        this.selectedChoice.fields.forEach(field => {
            const fieldElement = document.createElement('div');
            fieldElement.className = 'input-field';
            
            fieldElement.innerHTML = `
                <label for="field-${field.name}">${field.label}</label>
                <input 
                    type="${field.type}" 
                    id="field-${field.name}" 
                    name="${field.name}" 
                    placeholder="${field.placeholder}"
                    class="choice-field"
                >
            `;
            
            this.choiceInputFields.appendChild(fieldElement);
        });
    }
    
    // === F1: テンプレート入力 ===
    switchTemplateCategory(category) {
        // タブの切り替え
        this.templateTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        this.generateTemplates(category);
    }
    
    generateTemplates(category) {
        if (!this.mathDefinitions.templates[category]) return;
        
        this.templateGrid.innerHTML = '';
        
        this.mathDefinitions.templates[category].forEach((template, index) => {
            const templateElement = document.createElement('div');
            templateElement.className = 'template-item';
            templateElement.dataset.template = `${category}-${index}`;
            templateElement.dataset.syntax = template.syntax;
            templateElement.dataset.latex = template.latex;
            
            templateElement.innerHTML = `
                <div class="template-preview" id="template-preview-${category}-${index}"></div>
                <div class="template-name">${template.name}</div>
            `;
            
            this.templateGrid.appendChild(templateElement);
            
            // MathJaxでプレビューをレンダリング
            setTimeout(() => {
                const previewElement = document.getElementById(`template-preview-${category}-${index}`);
                previewElement.innerHTML = `$${template.latex}$`;
                if (window.MathJax) {
                    window.MathJax.typesetPromise([previewElement]).catch(err => console.log(err));
                }
            }, 100);
        });
    }
    
    selectTemplate(templateId) {
        const templateElement = document.querySelector(`[data-template="${templateId}"]`);
        if (!templateElement) return;
        
        const syntax = templateElement.dataset.syntax;
        const latex = templateElement.dataset.latex;
        
        this.currentTemplate = { syntax, latex };
        
        // テンプレートの変数を抽出して入力フィールドを生成
        this.generateTemplateFields(syntax);
        this.updateDisplay();
    }
    
    generateTemplateFields(syntax) {
        // テンプレートから変数を抽出 (a, b, c, f(x) など)
        const variables = this.extractVariables(syntax);
        
        this.templateInputFields.innerHTML = '';
        
        variables.forEach(variable => {
            const fieldElement = document.createElement('div');
            fieldElement.className = 'input-field';
            
            fieldElement.innerHTML = `
                <label for="template-${variable}">${variable}</label>
                <input 
                    type="text" 
                    id="template-${variable}" 
                    name="${variable}" 
                    placeholder="値を入力"
                    class="template-field"
                >
            `;
            
            this.templateInputFields.appendChild(fieldElement);
        });
    }
    
    extractVariables(syntax) {
        // 簡単な変数抽出（実際はより複雑な解析が必要）
        const matches = syntax.match(/[a-zA-Z](?!\()/g) || [];
        return [...new Set(matches)].filter(v => !['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'exp'].includes(v));
    }
    
    // === F2: 自由入力 ===
    handleFreeInput(e) {
        const input = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        // 入力補完の表示
        this.showSuggestions(input, cursorPosition);
        
        // リアルタイム更新
        this.updateDisplay();
    }
    
    handleFreeInputKeydown(e) {
        // Tab キーで補完
        if (e.key === 'Tab' && this.suggestionsPanel.style.display === 'block') {
            e.preventDefault();
            const firstSuggestion = this.suggestionsPanel.querySelector('.suggestion-item');
            if (firstSuggestion) {
                this.applySuggestion(firstSuggestion.dataset.syntax);
            }
        }
        
        // Ctrl+Enter で評価
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            this.evaluateExpression();
        }
    }
    
    showSuggestions(input, cursorPosition) {
        // 現在の単語を抽出
        const beforeCursor = input.substring(0, cursorPosition);
        const wordMatch = beforeCursor.match(/[a-zA-Z]+$/);
        
        if (!wordMatch) {
            this.suggestionsPanel.style.display = 'none';
            return;
        }
        
        const currentWord = wordMatch[0];
        const matchingSuggestions = this.suggestions.filter(s => 
            s.input.toLowerCase().startsWith(currentWord.toLowerCase())
        );
        
        if (matchingSuggestions.length === 0) {
            this.suggestionsPanel.style.display = 'none';
            return;
        }
        
        // 提案リストを生成
        this.suggestionsPanel.innerHTML = '';
        matchingSuggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.dataset.syntax = suggestion.syntax;
            
            suggestionElement.innerHTML = `
                <span class="suggestion-preview">${suggestion.latex}</span>
                <span class="suggestion-syntax">${suggestion.syntax}</span>
            `;
            
            suggestionElement.addEventListener('click', () => {
                this.applySuggestion(suggestion.syntax);
            });
            
            this.suggestionsPanel.appendChild(suggestionElement);
        });
        
        this.suggestionsPanel.style.display = 'block';
    }
    
    applySuggestion(syntax) {
        const cursorPosition = this.freeInput.selectionStart;
        const input = this.freeInput.value;
        const beforeCursor = input.substring(0, cursorPosition);
        const afterCursor = input.substring(cursorPosition);
        
        // 現在の単語を置き換え
        const wordMatch = beforeCursor.match(/[a-zA-Z]+$/);
        if (wordMatch) {
            const startPos = cursorPosition - wordMatch[0].length;
            const newInput = input.substring(0, startPos) + syntax + afterCursor;
            this.freeInput.value = newInput;
            this.freeInput.focus();
            this.freeInput.setSelectionRange(startPos + syntax.length, startPos + syntax.length);
        }
        
        this.suggestionsPanel.style.display = 'none';
        this.updateDisplay();
    }
    
    insertAtCursor(text) {
        const input = this.freeInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const before = input.value.substring(0, start);
        const after = input.value.substring(end);
        
        input.value = before + text + after;
        input.focus();
        input.setSelectionRange(start + text.length, start + text.length);
        
        this.updateDisplay();
    }
    
    // === 共通機能 ===
    getCurrentExpression() {
        switch (this.currentMode) {
            case 'choice':
                return this.getChoiceExpression();
            case 'template':
                return this.getTemplateExpression();
            case 'free':
                return this.freeInput.value;
            default:
                return '';
        }
    }
    
    getChoiceExpression() {
        if (!this.selectedChoice) return '';
        
        let expression = this.selectedChoice.template;
        
        // フィールド値で置き換え
        document.querySelectorAll('.choice-field').forEach(field => {
            const name = field.name;
            const value = field.value || field.placeholder || '1';
            expression = expression.replace(new RegExp(name, 'g'), value);
        });
        
        return expression;
    }
    
    getTemplateExpression() {
        if (!this.currentTemplate) return '';
        
        let expression = this.currentTemplate.syntax;
        
        // フィールド値で置き換え
        document.querySelectorAll('.template-field').forEach(field => {
            const name = field.name;
            const value = field.value || '1';
            expression = expression.replace(new RegExp(name, 'g'), value);
        });
        
        return expression;
    }
    
    updateFromFields() {
        this.updateDisplay();
    }
    
    updateDisplay() {
        const expression = this.getCurrentExpression();
        
        if (!expression) {
            this.resultPreview.innerHTML = '数式を入力してください';
            this.geogebraOutput.textContent = '-';
            this.latexOutput.textContent = '-';
            return;
        }
        
        // GeoGebra形式で表示
        this.geogebraOutput.textContent = expression;
        
        // LaTeX変換
        const latex = this.convertToLatex(expression);
        this.latexOutput.textContent = latex;
        
        // プレビュー表示
        this.resultPreview.innerHTML = `$$${latex}$$`;
        if (window.MathJax) {
            window.MathJax.typesetPromise([this.resultPreview]).catch(err => console.log(err));
        }
    }
    
    convertToLatex(geogebraExpression) {
        let latex = geogebraExpression;
        
        // 基本的な変換ルール
        const conversions = [
            [/\\*\\*/g, ' \\cdot '],
            [/\\^\\{([^}]+)\\}/g, '^{$1}'],
            [/\\^([a-zA-Z0-9])/g, '^{$1}'],
            [/sqrt\\{([^}]+)\\}/g, '\\\\sqrt{$1}'],
            [/frac\\{([^}]+)\\}\\{([^}]+)\\}/g, '\\\\frac{$1}{$2}'],
            [/sin\\(/g, '\\\\sin('],
            [/cos\\(/g, '\\\\cos('],
            [/tan\\(/g, '\\\\tan('],
            [/log\\(/g, '\\\\log('],
            [/ln\\(/g, '\\\\ln('],
            [/abs\\(([^)]+)\\)/g, '|$1|'],
            [/pi/g, '\\\\pi'],
            [/alpha/g, '\\\\alpha'],
            [/beta/g, '\\\\beta'],
            [/gamma/g, '\\\\gamma'],
            [/theta/g, '\\\\theta']
        ];
        
        conversions.forEach(([pattern, replacement]) => {
            latex = latex.replace(pattern, replacement);
        });
        
        return latex;
    }
    
    evaluateExpression() {
        const expression = this.getCurrentExpression();
        
        if (!expression) {
            this.syntaxCheck.textContent = '数式が入力されていません';
            this.numericOutput.textContent = '-';
            return;
        }
        
        // 構文チェック
        const syntaxResult = this.validateSyntax(expression);
        this.syntaxCheck.textContent = syntaxResult.valid ? '有効' : `エラー: ${syntaxResult.error}`;
        
        // 数値評価（簡単な例）
        try {
            const numericResult = this.evaluateNumerically(expression);
            this.numericOutput.textContent = numericResult || '評価不可';
        } catch (error) {
            this.numericOutput.textContent = `エラー: ${error.message}`;
        }
    }
    
    validateSyntax(expression) {
        // 基本的な構文チェック
        const openParens = (expression.match(/\\(/g) || []).length;
        const closeParens = (expression.match(/\\)/g) || []).length;
        
        if (openParens !== closeParens) {
            return { valid: false, error: '括弧が一致しません' };
        }
        
        // その他の基本的なチェック...
        
        return { valid: true };
    }
    
    evaluateNumerically(expression) {
        // 安全な数値評価（実際にはより高度な数学エンジンが必要）
        try {
            // 変数を数値で置き換え
            let numericExpr = expression
                .replace(/x/g, '2')
                .replace(/y/g, '3')
                .replace(/pi/g, Math.PI)
                .replace(/e/g, Math.E)
                .replace(/\\*/g, '*')
                .replace(/\\^/g, '**');
            
            // 基本的な関数の置き換え
            numericExpr = numericExpr
                .replace(/sin\\(/g, 'Math.sin(')
                .replace(/cos\\(/g, 'Math.cos(')
                .replace(/tan\\(/g, 'Math.tan(')
                .replace(/log\\(/g, 'Math.log10(')
                .replace(/ln\\(/g, 'Math.log(')
                .replace(/sqrt\\{([^}]+)\\}/g, 'Math.sqrt($1)');
            
            // 安全な評価（実際の実装では専用の数学ライブラリを使用）
            const result = Function(`"use strict"; return (${numericExpr})`)();
            return typeof result === 'number' ? result.toFixed(6) : result.toString();
        } catch (error) {
            throw new Error('数値評価に失敗しました');
        }
    }
    
    clearAll() {
        this.selectedChoice = null;
        this.currentTemplate = null;
        this.freeInput.value = '';
        this.choiceInputFields.innerHTML = '';
        this.templateInputFields.innerHTML = '';
        this.selectedChoiceInfo.style.display = 'none';
        this.suggestionsPanel.style.display = 'none';
        
        // 選択状態をリセット
        document.querySelectorAll('.choice-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 表示更新
        this.resultPreview.innerHTML = '数式を入力してください';
        this.latexOutput.textContent = '-';
        this.geogebraOutput.textContent = '-';
        this.numericOutput.textContent = '-';
        this.syntaxCheck.textContent = '有効';
    }
    
    copyLatexToClipboard() {
        const latex = this.latexOutput.textContent;
        if (latex && latex !== '-') {
            navigator.clipboard.writeText(latex).then(() => {
                // 一時的な成功表示
                const originalText = this.copyLatexBtn.textContent;
                this.copyLatexBtn.textContent = 'コピー完了!';
                setTimeout(() => {
                    this.copyLatexBtn.textContent = originalText;
                }, 2000);
            });
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    const mathInputSystem = new EnhancedMathInputSystem();
    
    // グローバルアクセス用
    window.mathInputSystem = mathInputSystem;
});