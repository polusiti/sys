class GeoGebraInputParser {
    constructor() {
        // GeoGebra関数の完全マッピング
        this.geogebraFunctions = {
            // 基本関数
            'sin': { latex: '\\sin', args: 1, description: '正弦関数' },
            'cos': { latex: '\\cos', args: 1, description: '余弦関数' },
            'tan': { latex: '\\tan', args: 1, description: '正接関数' },
            'sec': { latex: '\\sec', args: 1, description: '正割関数' },
            'csc': { latex: '\\csc', args: 1, description: '余割関数' },
            'cot': { latex: '\\cot', args: 1, description: '余接関数' },
            'asin': { latex: '\\arcsin', args: 1, description: '逆正弦関数' },
            'acos': { latex: '\\arccos', args: 1, description: '逆余弦関数' },
            'atan': { latex: '\\arctan', args: 1, description: '逆正接関数' },
            'sinh': { latex: '\\sinh', args: 1, description: '双曲正弦関数' },
            'cosh': { latex: '\\cosh', args: 1, description: '双曲余弦関数' },
            'tanh': { latex: '\\tanh', args: 1, description: '双曲正接関数' },
            
            // 対数・指数
            'ln': { latex: '\\ln', args: 1, description: '自然対数' },
            'log': { latex: '\\log', args: 1, description: '常用対数' },
            'log10': { latex: '\\log_{10}', args: 1, description: '底10の対数' },
            'log2': { latex: '\\log_2', args: 1, description: '底2の対数' },
            'exp': { latex: 'e^', args: 1, description: '指数関数' },
            'sqrt': { latex: '\\sqrt', args: 1, description: '平方根' },
            'cbrt': { latex: '\\sqrt[3]', args: 1, description: '立方根' },
            'nroot': { latex: '\\sqrt[#1]', args: 2, description: 'n乗根' },
            'abs': { latex: '|#1|', args: 1, description: '絶対値' },
            
            // 微積分
            'Derivative': { latex: '\\frac{d}{dx}', args: 2, description: '微分' },
            'Integral': { latex: '\\int', args: 2, description: '不定積分' },
            'IntegralBetween': { latex: '\\int_{#2}^{#3}', args: 4, description: '定積分' },
            'Sum': { latex: '\\sum_{#2}^{#3}', args: 4, description: '和' },
            'Product': { latex: '\\prod_{#2}^{#3}', args: 4, description: '積' },
            'Limit': { latex: '\\lim_{#2 \\to #3}', args: 3, description: '極限' },
            
            // 統計
            'Mean': { latex: '\\bar{x}', args: 1, description: '平均' },
            'Median': { latex: '\\text{median}', args: 1, description: '中央値' },
            'Mode': { latex: '\\text{mode}', args: 1, description: '最頻値' },
            'StdDev': { latex: '\\sigma', args: 1, description: '標準偏差' },
            'Variance': { latex: '\\sigma^2', args: 1, description: '分散' },
            'Random': { latex: '\\text{random}', args: 2, description: '乱数' },
            
            // 幾何
            'Distance': { latex: 'd', args: 2, description: '距離' },
            'Midpoint': { latex: 'M', args: 2, description: '中点' },
            'Area': { latex: 'S', args: 1, description: '面積' },
            'Perimeter': { latex: 'P', args: 1, description: '周囲' },
            'Circumference': { latex: 'C', args: 1, description: '円周' },
            
            // 線形代数
            'det': { latex: '\\det', args: 1, description: '行列式' },
            'Transpose': { latex: '^T', args: 1, description: '転置' },
            'Inverse': { latex: '^{-1}', args: 1, description: '逆行列' },
            'Trace': { latex: '\\text{tr}', args: 1, description: '跡' },
            'CrossProduct': { latex: '\\times', args: 2, description: '外積' },
            'DotProduct': { latex: '\\cdot', args: 2, description: '内積' },
            
            // 組み合わせ
            'nCr': { latex: 'C', args: 2, description: '組み合わせ' },
            'nPr': { latex: 'P', args: 2, description: '順列' },
            'Binomial': { latex: '\\binom{#1}{#2}', args: 2, description: '二項係数' },
            'Factorial': { latex: '!', args: 1, description: '階乗' },
            
            // 特殊関数
            'gamma': { latex: '\\Gamma', args: 1, description: 'ガンマ関数' },
            'floor': { latex: '\\lfloor #1 \\rfloor', args: 1, description: '床関数' },
            'ceil': { latex: '\\lceil #1 \\rceil', args: 1, description: '天井関数' },
            'round': { latex: '\\text{round}', args: 1, description: '四捨五入' },
            'sign': { latex: '\\text{sgn}', args: 1, description: '符号関数' },
            'If': { latex: '\\begin{cases} #2 & \\text{if } #1 \\\\ #3 & \\text{otherwise} \\end{cases}', args: 3, description: '条件分岐' }
        };
        
        // GeoGebra定数
        this.geogebraConstants = {
            'pi': { latex: '\\pi', value: Math.PI, description: '円周率' },
            'π': { latex: '\\pi', value: Math.PI, description: '円周率' },
            'e': { latex: 'e', value: Math.E, description: 'ネイピア数' },
            'i': { latex: 'i', value: 'i', description: '虚数単位' },
            'infinity': { latex: '\\infty', value: Infinity, description: '無限大' },
            '∞': { latex: '\\infty', value: Infinity, description: '無限大' },
            'undefined': { latex: '\\text{undefined}', value: undefined, description: '未定義' }
        };
        
        // GeoGebra演算子
        this.geogebraOperators = {
            '+': { latex: '+', precedence: 1 },
            '-': { latex: '-', precedence: 1 },
            '*': { latex: '\\cdot', precedence: 2 },
            '/': { latex: '\\div', precedence: 2 },
            '^': { latex: '^', precedence: 3 },
            '!': { latex: '!', precedence: 4 },
            '=': { latex: '=', precedence: 0 },
            '≠': { latex: '\\neq', precedence: 0 },
            '<': { latex: '<', precedence: 0 },
            '>': { latex: '>', precedence: 0 },
            '≤': { latex: '\\leq', precedence: 0 },
            '≥': { latex: '\\geq', precedence: 0 },
            '&&': { latex: '\\land', precedence: 0 },
            '||': { latex: '\\lor', precedence: 0 }
        };
        
        // 括弧の種類
        this.bracketTypes = {
            '()': { open: '(', close: ')', latex: ['(', ')'] },
            '[]': { open: '[', close: ']', latex: ['[', ']'] },
            '{}': { open: '{', close: '}', latex: ['\\{', '\\}'] },
            '||': { open: '|', close: '|', latex: ['|', '|'] }
        };
    }
    
    // GeoGebra式をパース
    parseExpression(input) {
        try {
            const tokens = this.tokenize(input);
            const ast = this.parseTokens(tokens);
            return {
                success: true,
                ast: ast,
                latex: this.astToLatex(ast),
                geogebra: input,
                variables: this.extractVariables(ast),
                functions: this.extractFunctions(ast)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                latex: null,
                geogebra: input
            };
        }
    }
    
    // 入力をトークンに分割
    tokenize(input) {
        const tokens = [];
        let current = 0;
        
        while (current < input.length) {
            const char = input[current];
            
            // 空白をスキップ
            if (/\s/.test(char)) {
                current++;
                continue;
            }
            
            // 数値
            if (/\d/.test(char)) {
                let value = '';
                while (current < input.length && (/[\d.]/.test(input[current]))) {
                    value += input[current];
                    current++;
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(value) });
                continue;
            }
            
            // 関数名・変数名
            if (/[a-zA-Z]/.test(char)) {
                let value = '';
                while (current < input.length && /[a-zA-Z0-9_]/.test(input[current])) {
                    value += input[current];
                    current++;
                }
                
                // 関数かどうか判定
                if (this.geogebraFunctions[value]) {
                    tokens.push({ type: 'FUNCTION', value: value });
                } else if (this.geogebraConstants[value]) {
                    tokens.push({ type: 'CONSTANT', value: value });
                } else {
                    tokens.push({ type: 'VARIABLE', value: value });
                }
                continue;
            }
            
            // 演算子・記号
            const twoChar = input.slice(current, current + 2);
            if (this.geogebraOperators[twoChar]) {
                tokens.push({ type: 'OPERATOR', value: twoChar });
                current += 2;
                continue;
            }
            
            if (this.geogebraOperators[char]) {
                tokens.push({ type: 'OPERATOR', value: char });
                current++;
                continue;
            }
            
            // 括弧
            if ('()[]{}|'.includes(char)) {
                tokens.push({ type: 'BRACKET', value: char });
                current++;
                continue;
            }
            
            // 特殊記号
            if ('π∞≠≤≥'.includes(char)) {
                tokens.push({ type: 'SYMBOL', value: char });
                current++;
                continue;
            }
            
            // カンマ
            if (char === ',') {
                tokens.push({ type: 'COMMA', value: char });
                current++;
                continue;
            }
            
            // 未知の文字
            throw new Error(`予期しない文字: ${char} at position ${current}`);
        }
        
        return tokens;
    }
    
    // トークンをASTに変換
    parseTokens(tokens) {
        let current = 0;
        
        function parseExpression() {
            return parseComparison();
        }
        
        function parseComparison() {
            let node = parseAddition();
            
            while (current < tokens.length && tokens[current].type === 'OPERATOR' && 
                   ['=', '≠', '<', '>', '≤', '≥'].includes(tokens[current].value)) {
                const operator = tokens[current++].value;
                const right = parseAddition();
                node = {
                    type: 'BinaryExpression',
                    operator: operator,
                    left: node,
                    right: right
                };
            }
            
            return node;
        }
        
        function parseAddition() {
            let node = parseMultiplication();
            
            while (current < tokens.length && tokens[current].type === 'OPERATOR' && 
                   ['+', '-'].includes(tokens[current].value)) {
                const operator = tokens[current++].value;
                const right = parseMultiplication();
                node = {
                    type: 'BinaryExpression',
                    operator: operator,
                    left: node,
                    right: right
                };
            }
            
            return node;
        }
        
        function parseMultiplication() {
            let node = parsePower();
            
            while (current < tokens.length && 
                   ((tokens[current].type === 'OPERATOR' && ['*', '/'].includes(tokens[current].value)) ||
                    (tokens[current].type === 'VARIABLE' || tokens[current].type === 'NUMBER' || 
                     tokens[current].type === 'FUNCTION' || 
                     (tokens[current].type === 'BRACKET' && tokens[current].value === '(')))) {
                
                let operator = '*'; // 暗黙の乗算
                if (tokens[current].type === 'OPERATOR' && ['*', '/'].includes(tokens[current].value)) {
                    operator = tokens[current++].value;
                }
                
                const right = parsePower();
                node = {
                    type: 'BinaryExpression',
                    operator: operator,
                    left: node,
                    right: right
                };
            }
            
            return node;
        }
        
        function parsePower() {
            let node = parseUnary();
            
            while (current < tokens.length && tokens[current].type === 'OPERATOR' && 
                   tokens[current].value === '^') {
                current++; // skip '^'
                const right = parseUnary();
                node = {
                    type: 'BinaryExpression',
                    operator: '^',
                    left: node,
                    right: right
                };
            }
            
            return node;
        }
        
        function parseUnary() {
            if (current < tokens.length && tokens[current].type === 'OPERATOR' && 
                ['+', '-'].includes(tokens[current].value)) {
                const operator = tokens[current++].value;
                const argument = parseUnary();
                return {
                    type: 'UnaryExpression',
                    operator: operator,
                    argument: argument
                };
            }
            
            return parsePrimary();
        }
        
        function parsePrimary() {
            const token = tokens[current];
            
            if (!token) {
                throw new Error('予期しない式の終了');
            }
            
            // 数値
            if (token.type === 'NUMBER') {
                current++;
                return {
                    type: 'Literal',
                    value: token.value
                };
            }
            
            // 定数
            if (token.type === 'CONSTANT') {
                current++;
                return {
                    type: 'Constant',
                    name: token.value
                };
            }
            
            // 変数
            if (token.type === 'VARIABLE') {
                current++;
                return {
                    type: 'Variable',
                    name: token.value
                };
            }
            
            // 関数
            if (token.type === 'FUNCTION') {
                const functionName = token.value;
                current++; // skip function name
                
                if (current >= tokens.length || tokens[current].value !== '(') {
                    throw new Error(`関数 ${functionName} には括弧が必要です`);
                }
                
                current++; // skip '('
                const args = [];
                
                if (tokens[current].value !== ')') {
                    args.push(parseExpression());
                    
                    while (current < tokens.length && tokens[current].type === 'COMMA') {
                        current++; // skip comma
                        args.push(parseExpression());
                    }
                }
                
                if (current >= tokens.length || tokens[current].value !== ')') {
                    throw new Error('関数の括弧が閉じられていません');
                }
                current++; // skip ')'
                
                return {
                    type: 'FunctionCall',
                    name: functionName,
                    arguments: args
                };
            }
            
            // 括弧
            if (token.type === 'BRACKET' && token.value === '(') {
                current++; // skip '('
                const node = parseExpression();
                if (current >= tokens.length || tokens[current].value !== ')') {
                    throw new Error('括弧が閉じられていません');
                }
                current++; // skip ')'
                return node;
            }
            
            throw new Error(`予期しないトークン: ${token.value}`);
        }
        
        const result = parseExpression();
        
        if (current < tokens.length) {
            throw new Error(`未処理のトークンがあります: ${tokens[current].value}`);
        }
        
        return result;
    }
    
    // ASTをLaTeXに変換
    astToLatex(node) {
        if (!node) return '';
        
        switch (node.type) {
            case 'Literal':
                return node.value.toString();
                
            case 'Variable':
                return node.name;
                
            case 'Constant':
                return this.geogebraConstants[node.name]?.latex || node.name;
                
            case 'BinaryExpression':
                const left = this.astToLatex(node.left);
                const right = this.astToLatex(node.right);
                const op = this.geogebraOperators[node.operator]?.latex || node.operator;
                
                if (node.operator === '^') {
                    return `${left}^{${right}}`;
                } else if (node.operator === '/') {
                    return `\\frac{${left}}{${right}}`;
                } else if (node.operator === '*') {
                    return `${left} \\cdot ${right}`;
                } else {
                    return `${left} ${op} ${right}`;
                }
                
            case 'UnaryExpression':
                const arg = this.astToLatex(node.argument);
                return `${node.operator}${arg}`;
                
            case 'FunctionCall':
                const func = this.geogebraFunctions[node.name];
                const args = node.arguments.map(arg => this.astToLatex(arg));
                
                if (func) {
                    let latex = func.latex;
                    // 引数の置換
                    args.forEach((arg, index) => {
                        latex = latex.replace(`#${index + 1}`, arg);
                        latex = latex.replace('#1', `{${args[0] || ''}}`);
                    });
                    
                    // 特殊な関数の処理
                    if (node.name === 'sqrt' && args.length === 1) {
                        return `\\sqrt{${args[0]}}`;
                    } else if (node.name === 'abs' && args.length === 1) {
                        return `\\left|${args[0]}\\right|`;
                    } else if (node.name.startsWith('a') && ['sin', 'cos', 'tan'].some(f => node.name.includes(f))) {
                        return `\\arc${node.name.slice(1)}\\left(${args[0]}\\right)`;
                    } else if (['sin', 'cos', 'tan', 'ln', 'log'].includes(node.name)) {
                        return `\\${node.name}\\left(${args[0]}\\right)`;
                    } else {
                        return `${latex}\\left(${args.join(', ')}\\right)`;
                    }
                } else {
                    return `\\text{${node.name}}\\left(${args.join(', ')}\\right)`;
                }
                
            default:
                return JSON.stringify(node);
        }
    }
    
    // 変数を抽出
    extractVariables(node) {
        const variables = new Set();
        
        function traverse(node) {
            if (node.type === 'Variable') {
                variables.add(node.name);
            } else if (node.left) {
                traverse(node.left);
            }
            if (node.right) {
                traverse(node.right);
            }
            if (node.argument) {
                traverse(node.argument);
            }
            if (node.arguments) {
                node.arguments.forEach(traverse);
            }
        }
        
        traverse(node);
        return Array.from(variables);
    }
    
    // 関数を抽出
    extractFunctions(node) {
        const functions = new Set();
        
        function traverse(node) {
            if (node.type === 'FunctionCall') {
                functions.add(node.name);
            } else if (node.left) {
                traverse(node.left);
            }
            if (node.right) {
                traverse(node.right);
            }
            if (node.argument) {
                traverse(node.argument);
            }
            if (node.arguments) {
                node.arguments.forEach(traverse);
            }
        }
        
        traverse(node);
        return Array.from(functions);
    }
    
    // 入力補完候補を生成
    getSuggestions(input, cursorPosition = input.length) {
        const suggestions = [];
        const beforeCursor = input.slice(0, cursorPosition);
        const lastWord = beforeCursor.match(/[a-zA-Z]+$/)?.[0] || '';
        
        if (lastWord.length >= 1) {
            // 関数の候補
            Object.entries(this.geogebraFunctions).forEach(([name, info]) => {
                if (name.toLowerCase().startsWith(lastWord.toLowerCase())) {
                    suggestions.push({
                        type: 'function',
                        name: name,
                        display: `${name}(...)`,
                        description: info.description,
                        latex: info.latex,
                        args: info.args
                    });
                }
            });
            
            // 定数の候補
            Object.entries(this.geogebraConstants).forEach(([name, info]) => {
                if (name.toLowerCase().startsWith(lastWord.toLowerCase())) {
                    suggestions.push({
                        type: 'constant',
                        name: name,
                        display: name,
                        description: info.description,
                        latex: info.latex
                    });
                }
            });
        }
        
        return suggestions.slice(0, 10); // 上位10件
    }
    
    // 数値評価（安全）
    evaluateNumerically(node, variables = {}) {
        if (!node) return undefined;
        
        try {
            switch (node.type) {
                case 'Literal':
                    return node.value;
                    
                case 'Variable':
                    return variables[node.name] || 1; // デフォルト値
                    
                case 'Constant':
                    return this.geogebraConstants[node.name]?.value || 0;
                    
                case 'BinaryExpression':
                    const left = this.evaluateNumerically(node.left, variables);
                    const right = this.evaluateNumerically(node.right, variables);
                    
                    switch (node.operator) {
                        case '+': return left + right;
                        case '-': return left - right;
                        case '*': return left * right;
                        case '/': return right !== 0 ? left / right : Infinity;
                        case '^': return Math.pow(left, right);
                        default: return 0;
                    }
                    
                case 'UnaryExpression':
                    const arg = this.evaluateNumerically(node.argument, variables);
                    return node.operator === '-' ? -arg : arg;
                    
                case 'FunctionCall':
                    const args = node.arguments.map(arg => this.evaluateNumerically(arg, variables));
                    return this.evaluateFunction(node.name, args);
                    
                default:
                    return 0;
            }
        } catch (error) {
            return undefined;
        }
    }
    
    // 関数の数値評価
    evaluateFunction(name, args) {
        switch (name) {
            case 'sin': return Math.sin(args[0]);
            case 'cos': return Math.cos(args[0]);
            case 'tan': return Math.tan(args[0]);
            case 'asin': return Math.asin(args[0]);
            case 'acos': return Math.acos(args[0]);
            case 'atan': return Math.atan(args[0]);
            case 'ln': return Math.log(args[0]);
            case 'log': return Math.log10(args[0]);
            case 'exp': return Math.exp(args[0]);
            case 'sqrt': return Math.sqrt(args[0]);
            case 'abs': return Math.abs(args[0]);
            case 'floor': return Math.floor(args[0]);
            case 'ceil': return Math.ceil(args[0]);
            case 'round': return Math.round(args[0]);
            default: return 0;
        }
    }
}

// グローバル初期化
window.geogebraParser = new GeoGebraInputParser();