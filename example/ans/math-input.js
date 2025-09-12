// Enhanced GeoGebra-style Math Input System with integrated GeoGebra input manager
// 複数の入力方式をサポートする数学入力システム

// GeoGebra Integration
let geogebraManager = null;
let geogebraParser = null;

class MathInputSystem {
    constructor() {
        this.mathInput = document.getElementById('mathInput');
        this.mathPreview = document.getElementById('mathPreview');
        this.inputExpression = document.getElementById('inputExpression');
        this.latexResult = document.getElementById('latexResult');
        this.numericResult = document.getElementById('numericResult');
        this.parseResult = document.getElementById('parseResult');
        
        this.variables = { x: 1, y: 1, z: 1, a: 1, b: 1, c: 1, d: 1 };
        this.constants = { pi: Math.PI, e: Math.E };
        
        this.isMobile = this.isMobileDevice();
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.initializeEventListeners();
        this.initializeMobileKeyboard();
        this.setPlaceholder();
        this.updatePreview();
        
        // GeoGebra統合の初期化
        this.initializeGeoGebraIntegration();
    }
    
    initializeEventListeners() {
        // ツールバーのボタン
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertAtCursor(e.target.dataset.input);
            });
        });
        
        // 数式入力エリア
        this.mathInput.addEventListener('input', () => {
            this.updatePreview();
        });
        
        this.mathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.evaluateExpression();
            }
        });
        
        // コントロールボタン
        document.getElementById('evaluateBtn').addEventListener('click', () => {
            this.evaluateExpression();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearInput();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportLatex();
        });
        
        // 例題
        document.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const example = item.dataset.example;
                this.mathInput.textContent = example;
                this.updatePreview();
                this.mathInput.focus();
            });
        });
    }
    
    // GeoGebra統合システムの初期化
    initializeGeoGebraIntegration() {
        // GeoGebra Input Managerの初期化を待つ
        const initGeoGebra = () => {
            if (window.geogebraInputManager && window.geogebraParser) {
                geogebraManager = window.geogebraInputManager;
                geogebraParser = window.geogebraParser;
                console.log('✅ GeoGebra統合システム初期化完了');
                this.setupGeoGebraInputHandlers();
            } else {
                setTimeout(initGeoGebra, 100); // 100ms後に再試行
            }
        };
        initGeoGebra();
    }
    
    // GeoGebra入力ハンドラーの設定
    setupGeoGebraInputHandlers() {
        const freeInput = document.getElementById('freeInput');
        if (!freeInput) return;
        
        // リアルタイム入力処理
        freeInput.addEventListener('input', (e) => {
            this.handleGeoGebraInput(e.target.value, e.target.selectionStart);
        });
        
        // キーボード操作
        freeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.showGeoGebraAutoComplete(e.target.value, e.target.selectionStart);
            } else if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.evaluateGeoGebraExpression();
            }
        });
    }
    
    // GeoGebra入力の処理
    handleGeoGebraInput(input, cursorPosition) {
        if (!geogebraManager) return;
        
        const result = geogebraManager.processInput(input, cursorPosition);
        
        // 結果の更新
        const geoOutput = document.getElementById('geogebraOutput');
        const latexOutput = document.getElementById('latexOutput');
        const syntaxCheck = document.getElementById('syntaxCheck');
        const numericOutput = document.getElementById('numericOutput');
        
        if (geoOutput) geoOutput.textContent = result.original || input;
        if (latexOutput) latexOutput.textContent = result.latex || '-';
        if (syntaxCheck) {
            syntaxCheck.textContent = result.valid ? '有効' : `エラー: ${result.errors.join(', ')}`;
            syntaxCheck.className = result.valid ? 'result-value success' : 'result-value error';
        }
        
        // 数値評価
        if (numericOutput) {
            if (result.evaluation.success) {
                numericOutput.textContent = result.evaluation.formatted;
            } else {
                numericOutput.textContent = result.evaluation.error || '評価不可';
            }
        }
        
        // プレビュー更新
        this.updateGeoGebraPreview(result.latex);
        
        // 自動補完パネルの更新
        this.updateSuggestionsPanel(result.completions);
    }
    
    // 候補パネルの更新
    updateSuggestionsPanel(completions) {
        const panel = document.getElementById('suggestionsPanel');
        if (!panel || !completions || completions.length === 0) {
            if (panel) panel.style.display = 'none';
            return;
        }
        
        panel.innerHTML = '';
        panel.style.display = 'block';
        
        completions.slice(0, 5).forEach(completion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <span class="suggestion-function">${completion.text}</span>
                <span class="suggestion-description">${completion.displayText}</span>
            `;
            item.addEventListener('click', () => {
                this.insertAutoCompletion(completion);
            });
            panel.appendChild(item);
        });
    }
    
    // 自動補完の挿入
    insertAutoCompletion(completion) {
        const freeInput = document.getElementById('freeInput');
        if (!freeInput) return;
        
        const cursorPos = freeInput.selectionStart;
        const currentValue = freeInput.value;
        
        // 部分的に入力された文字を置換
        const beforeCursor = currentValue.slice(0, cursorPos);
        const wordMatch = beforeCursor.match(/[a-zA-Z]+$/);
        
        if (wordMatch) {
            const startPos = cursorPos - wordMatch[0].length;
            const newValue = currentValue.slice(0, startPos) + completion.text + currentValue.slice(cursorPos);
            freeInput.value = newValue;
            freeInput.setSelectionRange(startPos + completion.text.length, startPos + completion.text.length);
        } else {
            freeInput.value = currentValue.slice(0, cursorPos) + completion.text + currentValue.slice(cursorPos);
            freeInput.setSelectionRange(cursorPos + completion.text.length, cursorPos + completion.text.length);
        }
        
        // パネルを閉じる
        document.getElementById('suggestionsPanel').style.display = 'none';
        
        // 入力を更新
        this.handleGeoGebraInput(freeInput.value, freeInput.selectionStart);
    }
    
    // GeoGebraプレビューの更新
    updateGeoGebraPreview(latex) {
        const previewElement = document.getElementById('resultPreview');
        if (!previewElement) return;
        
        if (!latex || latex === '-') {
            previewElement.innerHTML = '数式を入力してください';
            return;
        }
        
        try {
            previewElement.innerHTML = `$$${latex}$$`;
            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise([previewElement]).catch(console.error);
            }
        } catch (error) {
            previewElement.innerHTML = '構文エラー';
            console.error('MathJax rendering error:', error);
        }
    }
    
    // GeoGebra式の評価
    evaluateGeoGebraExpression() {
        const freeInput = document.getElementById('freeInput');
        if (!freeInput || !geogebraManager) return;
        
        const input = freeInput.value;
        const result = geogebraManager.processInput(input, input.length);
        
        // 評価結果の表示
        const numericOutput = document.getElementById('numericOutput');
        const syntaxCheck = document.getElementById('syntaxCheck');
        
        if (numericOutput) {
            if (result.evaluation.success) {
                numericOutput.textContent = result.evaluation.formatted;
                numericOutput.className = 'result-value success';
            } else {
                numericOutput.textContent = result.evaluation.error || '評価できませんでした';
                numericOutput.className = 'result-value error';
            }
        }
        
        // パーサーによる詳細解析
        if (geogebraParser && syntaxCheck) {
            try {
                const parseResult = geogebraParser.parseExpression(input);
                if (parseResult.success) {
                    console.log('パース成功:', parseResult);
                    syntaxCheck.textContent = '構文解析完了';
                    syntaxCheck.className = 'result-value success';
                } else {
                    console.error('パースエラー:', parseResult.error);
                    syntaxCheck.textContent = `構文エラー: ${parseResult.error}`;
                    syntaxCheck.className = 'result-value error';
                }
            } catch (error) {
                console.error('パーサーエラー:', error);
            }
        }
    }
    
    initializeMobileKeyboard() {
        const keyboard = document.getElementById('mobileKeyboard');
        if (!keyboard) return;
        
        // キーボードタブの切り替え
        document.querySelectorAll('.keyboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchKeyboardTab(tab.dataset.keyboard);
            });
        });
        
        // キーボードボタン
        document.querySelectorAll('.key-btn').forEach(btn => {
            // タッチイベント
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleKeyPress(btn, e);
            });
            
            // マウスイベント（テスト用）
            btn.addEventListener('mousedown', (e) => {
                this.handleKeyPress(btn, e);
            });
            
            // スワイプジェスチャー
            btn.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e);
            });
            
            btn.addEventListener('touchmove', (e) => {
                this.handleTouchMove(e);
            });
        });
        
        // 長押しサポート
        this.setupLongPressSupport();
    }
    
    switchKeyboardTab(tabName) {
        // 全てのタブとパネルを非アクティブ化
        document.querySelectorAll('.keyboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.keyboard-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // 選択されたタブをアクティブ化
        const activeTab = document.querySelector(`[data-keyboard="${tabName}"]`);
        const activePanel = document.querySelector(`[data-panel="${tabName}"]`);
        
        if (activeTab && activePanel) {
            activeTab.classList.add('active');
            activePanel.classList.add('active');
            this.vibrate(50); // 軽い振動フィードバック
        }
    }
    
    handleKeyPress(btn, event) {
        const input = btn.dataset.input;
        const action = btn.dataset.action;
        
        this.vibrate(25); // キープレス振動
        
        if (action) {
            this.handleKeyAction(action);
        } else if (input) {
            this.insertAtCursor(input);
        }
        
        // ビジュアルフィードバック
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);
    }
    
    handleKeyAction(action) {
        switch (action) {
            case 'delete':
                this.deleteLastCharacter();
                break;
            case 'clear':
                this.clearInput();
                break;
            case 'space':
                this.insertAtCursor(' ');
                break;
        }
    }
    
    deleteLastCharacter() {
        const text = this.mathInput.textContent;
        if (text.length > 0) {
            this.mathInput.textContent = text.slice(0, -1);
            this.updatePreview();
        }
    }
    
    setupLongPressSupport() {
        const longPressDelay = 800;
        const longPressActions = {
            '0': ['∞', 'θ', 'π'],
            '1': ['!', '†', '‡'],
            '2': ['²', '√', '½'],
            '3': ['³', '∛', '¾'],
            '4': ['⁴', '∜', '¼'],
            '5': ['⁵', '‰', '⅕'],
            '6': ['⁶', '∂', '⅙'],
            '7': ['⁷', '∑', '⅐'],
            '8': ['⁸', '∆', '⅛'],
            '9': ['⁹', '∇', '⅑'],
            'x': ['χ', 'ξ', '×'],
            'y': ['ψ', 'υ', '¥'],
            'z': ['ζ', 'ℤ', '∫'],
            'a': ['α', '∀', 'Å'],
            'b': ['β', '∃', '♭'],
            'c': ['χ', '∩', '©'],
            'd': ['δ', 'Δ', '°'],
            'e': ['ε', '∃', '€'],
            'f': ['φ', 'Φ', 'ƒ'],
            'g': ['γ', 'Γ', '≥'],
            'h': ['η', 'ℏ', 'ʰ'],
            'i': ['ι', '∫', 'ⁱ'],
            'l': ['λ', 'Λ', '£'],
            'm': ['μ', 'µ', '♩'],
            'n': ['ν', '∅', 'ⁿ'],
            'p': ['π', 'Π', '±'],
            'q': ['θ', 'Θ', '?'],
            'r': ['ρ', 'ℝ', '®'],
            's': ['σ', 'Σ', '§'],
            't': ['τ', '∴', '†'],
            'u': ['υ', '∪', 'µ'],
            'w': ['ω', 'Ω', '√'],
            '-': ['—', '–', '÷'],
            '=': ['≡', '≈', '≠'],
            '<': ['≤', '≪', '⟨'],
            '>': ['≥', '≫', '⟩'],
            '/': ['\\', '∕', '∖'],
        };
        
        document.querySelectorAll('.key-btn').forEach(btn => {
            let pressTimer;
            
            const startPress = () => {
                pressTimer = setTimeout(() => {
                    this.showLongPressMenu(btn, longPressActions);
                }, longPressDelay);
            };
            
            const cancelPress = () => {
                clearTimeout(pressTimer);
            };
            
            btn.addEventListener('touchstart', startPress);
            btn.addEventListener('touchend', cancelPress);
            btn.addEventListener('touchcancel', cancelPress);
            btn.addEventListener('mousedown', startPress);
            btn.addEventListener('mouseup', cancelPress);
            btn.addEventListener('mouseleave', cancelPress);
        });
    }
    
    showLongPressMenu(btn, actions) {
        const input = btn.dataset.input;
        const alternatives = actions[input] || [];
        
        if (alternatives.length === 0) return;
        
        // メニューを作成
        const menu = document.createElement('div');
        menu.className = 'long-press-menu';
        menu.style.cssText = `
            position: fixed;
            background: #4a5568;
            border-radius: 12px;
            padding: 8px;
            display: flex;
            gap: 5px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        alternatives.forEach(alt => {
            const altBtn = document.createElement('button');
            altBtn.className = 'long-press-option';
            altBtn.textContent = alt;
            altBtn.style.cssText = `
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 12px;
                font-size: 16px;
                cursor: pointer;
                min-width: 45px;
                height: 45px;
            `;
            
            altBtn.addEventListener('click', () => {
                this.insertAtCursor(alt);
                document.body.removeChild(menu);
            });
            
            menu.appendChild(altBtn);
        });
        
        // 位置を計算
        const rect = btn.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.top - 60}px`;
        
        document.body.appendChild(menu);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        }, 3000);
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // スワイプでキーボード切り替え
        if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
            if (deltaX > 0) {
                this.switchToNextKeyboard();
            } else {
                this.switchToPreviousKeyboard();
            }
            this.touchStartX = 0;
            this.touchStartY = 0;
        }
    }
    
    switchToNextKeyboard() {
        const tabs = ['numbers', 'functions', 'symbols', 'advanced'];
        const activeTab = document.querySelector('.keyboard-tab.active');
        const currentTab = activeTab ? activeTab.dataset.keyboard : 'numbers';
        const currentIndex = tabs.indexOf(currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.switchKeyboardTab(tabs[nextIndex]);
    }
    
    switchToPreviousKeyboard() {
        const tabs = ['numbers', 'functions', 'symbols', 'advanced'];
        const activeTab = document.querySelector('.keyboard-tab.active');
        const currentTab = activeTab ? activeTab.dataset.keyboard : 'numbers';
        const currentIndex = tabs.indexOf(currentTab);
        const previousIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        this.switchKeyboardTab(tabs[previousIndex]);
    }
    
    vibrate(duration) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               'ontouchstart' in window ||
               navigator.maxTouchPoints > 0;
    }
    
    setPlaceholder() {
        this.mathInput.setAttribute('data-placeholder', '例: x^2 + 2*x + 1');
    }
    
    insertAtCursor(text) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        if (selection.rangeCount > 0) {
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            this.mathInput.textContent += text;
        }
        
        this.updatePreview();
        this.mathInput.focus();
    }
    
    updatePreview() {
        const expression = this.mathInput.textContent.trim();
        
        if (!expression) {
            this.mathPreview.innerHTML = '$$\\text{数式を入力してください}$$';
            this.renderMath();
            return;
        }
        
        try {
            // GeoGebraマネージャーを優先的に使用
            if (geogebraManager && expression) {
                const result = geogebraManager.convertToLatex(expression);
                if (result && result !== expression) {
                    this.mathPreview.innerHTML = `$$${result}$$`;
                    this.renderMath();
                    this.inputExpression.textContent = expression;
                    this.latexResult.textContent = result;
                    this.parseResult.textContent = 'GeoGebra記法で変換されました';
                    this.parseResult.className = 'result-value success';
                    return;
                }
            }
            
            // フォールバック処理
            const latex = this.geogebraToLatex(expression);
            this.mathPreview.innerHTML = `$$${latex}$$`;
            this.renderMath();
            
            this.inputExpression.textContent = expression;
            this.latexResult.textContent = latex;
            this.parseResult.textContent = '有効な数式です';
            this.parseResult.className = 'result-value success';
            
        } catch (error) {
            this.mathPreview.innerHTML = '$$\\text{構文エラー}$$';
            this.renderMath();
            this.parseResult.textContent = `構文エラー: ${error.message}`;
            this.parseResult.className = 'result-value error';
        }
    }
    
    renderMath() {
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([this.mathPreview]).catch((e) => {
                console.error('MathJax rendering error:', e);
            });
        }
    }
    
    geogebraToLatex(expression) {
        let latex = expression;
        
        // スペースを削除
        latex = latex.replace(/\s+/g, '');
        
        // テンプレート処理 - 最初に処理
        latex = this.processTemplates(latex);
        
        // 基本的な演算子
        latex = latex.replace(/\*/g, ' \\cdot ');
        
        // 平方根の処理 - sqrt{} 形式のみをサポート
        // sqrt{...} 形式
        latex = latex.replace(/sqrt\{([^}]+)\}/g, '\\sqrt{$1}');
        
        // 互換性のため sqrt(...) 形式もサポート（非推奨）
        latex = latex.replace(/sqrt\(([^)]+)\)/g, (match, content) => {
            console.warn('sqrt(...) は非推奨です。sqrt{...} を使用してください');
            return '\\sqrt{' + this.balanceBrackets(content) + '}';
        });
        
        // 関数の処理
        const functions = ['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'abs'];
        functions.forEach(func => {
            if (func === 'abs') {
                // abs は絶対値記号に
                latex = latex.replace(new RegExp(func + '\\(([^)]+)\\)', 'g'), (match, content) => {
                    return '|' + this.balanceBrackets(content) + '|';
                });
            } else {
                latex = latex.replace(new RegExp(func + '\\(([^)]+)\\)', 'g'), (match, content) => {
                    return '\\' + func + '(' + this.balanceBrackets(content) + ')';
                });
            }
        });
        
        // 特殊文字
        latex = latex.replace(/π/g, '\\pi');
        latex = latex.replace(/theta/g, '\\theta');
        latex = latex.replace(/alpha/g, '\\alpha');
        latex = latex.replace(/beta/g, '\\beta');
        latex = latex.replace(/gamma/g, '\\gamma');
        latex = latex.replace(/delta/g, '\\delta');
        latex = latex.replace(/partial/g, '\\partial');
        latex = latex.replace(/nabla/g, '\\nabla');
        latex = latex.replace(/sum/g, '\\sum');
        latex = latex.replace(/int/g, '\\int');
        latex = latex.replace(/lim/g, '\\lim');
        latex = latex.replace(/infty/g, '\\infty');
        latex = latex.replace(/e(?![a-zA-Z])/g, 'e');
        
        // 分数処理
        latex = latex.replace(/frac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
        
        // 二乗・三乗記号の処理
        latex = latex.replace(/([a-zA-Z0-9])²/g, '$1^2');
        latex = latex.replace(/([a-zA-Z0-9])³/g, '$1^3');
        
        // 指数処理 - より正確な正規表現
        // 基本的な指数: x^2, x^n
        latex = latex.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^{$2}');
        latex = latex.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, '$1^{$2}');
        
        // カッコ付きの指数
        latex = latex.replace(/\(([^)]+)\)\^([a-zA-Z0-9]+)/g, '($1)^{$2}');
        latex = latex.replace(/\(([^)]+)\)\^\{([^}]+)\}/g, '($1)^{$2}');
        
        // 複雑な指数表現の処理
        latex = latex.replace(/\{([^}]+)\}\^\{([^}]+)\}/g, '$1^{$2}');
        
        // 不等号
        latex = latex.replace(/<=/g, '\\leq');
        latex = latex.replace(/>=/g, '\\geq');
        latex = latex.replace(/<>/g, '\\neq');
        latex = latex.replace(/≠/g, '\\neq');
        latex = latex.replace(/≤/g, '\\leq');
        latex = latex.replace(/≥/g, '\\geq');
        
        // その他の記号
        latex = latex.replace(/∞/g, '\\infty');
        latex = latex.replace(/∂/g, '\\partial');
        latex = latex.replace(/∇/g, '\\nabla');
        
        // カッコのバランスを取る
        latex = this.balanceAllBrackets(latex);
        
        return latex;
    }
    
    processTemplates(expression) {
        // 特殊な数式テンプレートの処理
        let processed = expression;
        
        // 二次方程式の解の公式
        processed = processed.replace(/frac\{-b\s*[+-]\s*sqrt\(b\^2\s*-\s*4\s*\*\s*a\s*\*\s*c\)\}\{2\s*\*\s*a\}/g, 
            '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
        
        // 距離公式の特別処理 - sqrt{} 形式に対応
        processed = processed.replace(/sqrt\{\s*([a-zA-Z])\^2\s*\+\s*([a-zA-Z])\^2\s*\}/g, 
            '\\sqrt{$1^2 + $2^2}');
        
        // 三角関数の基本公式
        processed = processed.replace(/sin\^2\(\s*([a-zA-Z])\s*\)\s*\+\s*cos\^2\(\s*([a-zA-Z])\s*\)/g, 
            '\\sin^2($1) + \\cos^2($2)');
        
        return processed;
    }
    
    balanceBrackets(content) {
        let open = content.match(/\(/g) || [];
        let close = content.match(/\)/g) || [];
        let balanced = content;
        
        for (let i = 0; i < open.length - close.length; i++) {
            balanced += ')';
        }
        
        return balanced;
    }
    
    balanceAllBrackets(latex) {
        const brackets = {
            '(': ')',
            '[': ']',
            '{': '}'
        };
        
        const stack = [];
        const result = [];
        
        for (let char of latex) {
            if (brackets[char]) {
                stack.push(char);
                result.push(char);
            } else if (Object.values(brackets).includes(char)) {
                if (stack.length > 0) {
                    stack.pop();
                }
                result.push(char);
            } else {
                result.push(char);
            }
        }
        
        // 残った開きカッコを閉じる
        while (stack.length > 0) {
            const open = stack.pop();
            result.push(brackets[open]);
        }
        
        return result.join('');
    }
    
    parseExpression(expression) {
        // 変数と定数の置換
        let parsed = expression;
        
        Object.keys(this.constants).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            parsed = parsed.replace(regex, this.constants[key]);
        });
        
        Object.keys(this.variables).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            parsed = parsed.replace(regex, this.variables[key]);
        });
        
        // 関数の変換
        parsed = parsed.replace(/sqrt\(/g, 'Math.sqrt(');
        parsed = parsed.replace(/log\(/g, 'Math.log(');
        parsed = parsed.replace(/sin\(/g, 'Math.sin(');
        parsed = parsed.replace(/cos\(/g, 'Math.cos(');
        parsed = parsed.replace(/tan\(/g, 'Math.tan(');
        parsed = parsed.replace(/abs\(/g, 'Math.abs(');
        parsed = parsed.replace(/pi/g, 'Math.PI');
        parsed = parsed.replace(/e/g, 'Math.E');
        
        return parsed;
    }
    
    evaluateExpression() {
        const expression = this.mathInput.textContent.trim();
        
        if (!expression) {
            this.numericResult.textContent = '-';
            return;
        }
        
        try {
            // GeoGebraマネージャーによる評価を優先
            if (geogebraManager) {
                const geoResult = geogebraManager.evaluateExpression(expression);
                if (geoResult.success) {
                    this.numericResult.textContent = geoResult.formatted;
                    this.numericResult.className = 'result-value success';
                    return;
                }
            }
            
            // フォールバック評価
            const parsed = this.parseExpression(expression);
            
            // 簡単な構文チェック
            if (!this.isValidExpression(parsed)) {
                throw new Error('無効な数式です');
            }
            
            // 安全な評価
            const result = this.safeEval(parsed);
            
            this.numericResult.textContent = this.formatResult(result);
            this.numericResult.className = 'result-value success';
            
        } catch (error) {
            this.numericResult.textContent = `評価エラー: ${error.message}`;
            this.numericResult.className = 'result-value error';
        }
    }
    
    isValidExpression(expression) {
        // 許可された文字のみを含むかチェック
        const allowedChars = /^[0-9+\-*/().\s\w]+$/;
        if (!allowedChars.test(expression)) {
            return false;
        }
        
        // 危険な関数やキーワードをチェック
        const dangerousPatterns = [
            /for\(/i, /while\(/i, /function/i, /eval/i, /import/i,
            /fetch/i, /xmlhttp/i, /document\./i, /window\./i, /global\./i
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(expression));
    }
    
    safeEval(expression) {
        // 関数の定義
        const context = {
            Math: Math,
            x: this.variables.x,
            y: this.variables.y,
            z: this.variables.z,
            a: this.variables.a,
            b: this.variables.b,
            c: this.variables.c,
            d: this.variables.d
        };
        
        // Functionコンストラクタを使用して安全に評価
        try {
            const func = new Function(...Object.keys(context), `return ${expression}`);
            return func(...Object.values(context));
        } catch (error) {
            throw new Error(`数式評価エラー: ${error.message}`);
        }
    }
    
    formatResult(result) {
        if (typeof result === 'number') {
            if (isNaN(result)) return 'NaN';
            if (!isFinite(result)) return result > 0 ? '∞' : '-∞';
            
            // 小数点以下が多い場合は丸める
            if (Math.abs(result) < 0.001 && result !== 0) {
                return result.toExponential(3);
            }
            
            return Math.round(result * 1000000) / 1000000;
        }
        
        return String(result);
    }
    
    clearInput() {
        this.mathInput.textContent = '';
        this.inputExpression.textContent = '-';
        this.latexResult.textContent = '-';
        this.numericResult.textContent = '-';
        this.parseResult.textContent = '有効な数式です';
        this.parseResult.className = 'result-value';
        this.updatePreview();
        this.mathInput.focus();
    }
    
    exportLatex() {
        const latex = this.latexResult.textContent;
        if (latex && latex !== '-') {
            navigator.clipboard.writeText(latex).then(() => {
                alert('LaTeXコードをクリップボードにコピーしました！');
            }).catch(() => {
                alert('コピーに失敗しました。');
            });
        } else {
            alert('LaTeXコードがありません。');
        }
    }
    
    // 高度な数式処理機能
    simplifyExpression(expression) {
        // 簡単な簡略化の実装
        let simplified = expression;
        
        // 0 の処理
        simplified = simplified.replace(/\+0/g, '').replace(/0\+/g, '').replace(/\*0/g, '*0').replace(/0\*/g, '0*');
        
        // 1 の処理
        simplified = simplified.replace(/\*1/g, '').replace(/1\*/g, '');
        
        // 重複符号の処理
        simplified = simplified.replace(/\+-/g, '-').replace(/-\+/g, '-').replace(/\+\+/g, '+').replace(/--/g, '+');
        
        return simplified.trim() || '0';
    }
    
    differentiateExpression(expression, variable = 'x') {
        // 数値微分の簡単な実装
        const h = 0.0001;
        const originalVars = { ...this.variables };
        
        try {
            this.variables[variable] = originalVars[variable] - h;
            const f1 = this.safeEval(this.parseExpression(expression));
            
            this.variables[variable] = originalVars[variable] + h;
            const f2 = this.safeEval(this.parseExpression(expression));
            
            return (f2 - f1) / (2 * h);
        } catch (error) {
            throw new Error(`微分エラー: ${error.message}`);
        } finally {
            this.variables = originalVars;
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.mathInputSystem = new MathInputSystem();
    
    // MathJaxのロード完了を待つ
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (window.mathInputSystem) {
                window.mathInputSystem.renderMath();
            }
        }, 1000);
    });
});

// グローバルエラーハンドリング
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.mathInputSystem) {
        window.mathInputSystem.parseResult.textContent = 'システムエラーが発生しました';
        window.mathInputSystem.parseResult.className = 'result-value error';
    }
});

// ユーティリティ関数
function createFraction(numerator, denominator) {
    return `frac{${numerator}}{${denominator}}`;
}

function createPower(base, exponent) {
    return `{${base}}^{${exponent}}`;
}

function createSquareRoot(expression) {
    return `sqrt{${expression}}`;
}

function createFunction(name, argument) {
    return `${name}(${argument})`;
}