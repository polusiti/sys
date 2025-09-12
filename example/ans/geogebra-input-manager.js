/**
 * GeoGebra入力方式 - 完全実装版
 * GeoGebra記法での数式入力をサポート
 */

class GeoGebraInputManager {
    constructor() {
        // GeoGebra記法マッピング
        this.geogebraSyntax = {
            // 基本演算
            '^': { latex: '^', precedence: 4 },
            '*': { latex: '\\cdot', precedence: 3 },
            '/': { latex: '\\div', precedence: 3 },
            '+': { latex: '+', precedence: 2 },
            '-': { latex: '-', precedence: 2 },
            
            // 関数 (GeoGebra標準)
            'sin': { latex: '\\sin', type: 'function', args: 1 },
            'cos': { latex: '\\cos', type: 'function', args: 1 },
            'tan': { latex: '\\tan', type: 'function', args: 1 },
            'asin': { latex: '\\arcsin', type: 'function', args: 1 },
            'acos': { latex: '\\arccos', type: 'function', args: 1 },
            'atan': { latex: '\\arctan', type: 'function', args: 1 },
            'ln': { latex: '\\ln', type: 'function', args: 1 },
            'log': { latex: '\\log', type: 'function', args: 1 },
            'sqrt': { latex: '\\sqrt', type: 'function', args: 1, format: 'sqrt' },
            'abs': { latex: '|#1|', type: 'function', args: 1, format: 'abs' },
            'exp': { latex: 'e^{#1}', type: 'function', args: 1 },
            
            // 定数
            'pi': { latex: '\\pi', type: 'constant' },
            'π': { latex: '\\pi', type: 'constant' },
            'e': { latex: 'e', type: 'constant' },
            
            // 比較演算子
            '=': { latex: '=', type: 'comparison' },
            '<': { latex: '<', type: 'comparison' },
            '>': { latex: '>', type: 'comparison' },
            '<=': { latex: '\\leq', type: 'comparison' },
            '>=': { latex: '\\geq', type: 'comparison' },
            '≤': { latex: '\\leq', type: 'comparison' },
            '≥': { latex: '\\geq', type: 'comparison' }
        };
        
        // GeoGebra入力補完リスト
        this.completions = [
            { input: 'sin', description: '正弦関数', example: 'sin(x)', latex: '\\sin(x)' },
            { input: 'cos', description: '余弦関数', example: 'cos(x)', latex: '\\cos(x)' },
            { input: 'tan', description: '正接関数', example: 'tan(x)', latex: '\\tan(x)' },
            { input: 'asin', description: '逆正弦', example: 'asin(0.5)', latex: '\\arcsin(0.5)' },
            { input: 'acos', description: '逆余弦', example: 'acos(0.5)', latex: '\\arccos(0.5)' },
            { input: 'atan', description: '逆正接', example: 'atan(1)', latex: '\\arctan(1)' },
            { input: 'ln', description: '自然対数', example: 'ln(x)', latex: '\\ln(x)' },
            { input: 'log', description: '常用対数', example: 'log(x)', latex: '\\log(x)' },
            { input: 'sqrt', description: '平方根', example: 'sqrt(x)', latex: '\\sqrt{x}' },
            { input: 'abs', description: '絶対値', example: 'abs(x)', latex: '|x|' },
            { input: 'exp', description: '指数関数', example: 'exp(x)', latex: 'e^{x}' },
            { input: 'pi', description: '円周率', example: 'pi', latex: '\\pi' },
            { input: 'e', description: 'ネイピア数', example: 'e', latex: 'e' },
            
            // 高度な関数
            { input: 'sec', description: '正割', example: 'sec(x)', latex: '\\sec(x)' },
            { input: 'csc', description: '余割', example: 'csc(x)', latex: '\\csc(x)' },
            { input: 'cot', description: '余接', example: 'cot(x)', latex: '\\cot(x)' },
            { input: 'sinh', description: '双曲正弦', example: 'sinh(x)', latex: '\\sinh(x)' },
            { input: 'cosh', description: '双曲余弦', example: 'cosh(x)', latex: '\\cosh(x)' },
            { input: 'tanh', description: '双曲正接', example: 'tanh(x)', latex: '\\tanh(x)' },
            { input: 'floor', description: '床関数', example: 'floor(x)', latex: '\\lfloor x \\rfloor' },
            { input: 'ceil', description: '天井関数', example: 'ceil(x)', latex: '\\lceil x \\rceil' },
            { input: 'round', description: '四捨五入', example: 'round(x)', latex: '\\text{round}(x)' },
            { input: 'sign', description: '符号関数', example: 'sign(x)', latex: '\\text{sgn}(x)' },
            { input: 'min', description: '最小値', example: 'min(a, b)', latex: '\\min(a, b)' },
            { input: 'max', description: '最大値', example: 'max(a, b)', latex: '\\max(a, b)' },
            
            // 変数とパラメータ
            { input: 'x', description: 'x変数', example: 'x', latex: 'x' },
            { input: 'y', description: 'y変数', example: 'y', latex: 'y' },
            { input: 't', description: 'パラメータt', example: 't', latex: 't' },
            { input: 'a', description: 'パラメータa', example: 'a', latex: 'a' },
            { input: 'b', description: 'パラメータb', example: 'b', latex: 'b' },
            { input: 'c', description: 'パラメータc', example: 'c', latex: 'c' }
        ];
    }
    
    // GeoGebra記法をLaTeX記法に変換
    convertToLatex(geogebraInput) {
        try {
            let latex = geogebraInput;
            
            // 基本的な置換ルール（順序重要）
            const replacements = [
                // 関数の処理（括弧付き）- 最初に処理
                [/sqrt\(([^)]+)\)/g, '\\\\sqrt{$1}'],
                [/abs\(([^)]+)\)/g, '\\\\left|$1\\\\right|'],
                [/exp\(([^)]+)\)/g, 'e^{$1}'],
                [/ln\(([^)]+)\)/g, '\\\\ln\\\\left($1\\\\right)'],
                [/log\(([^)]+)\)/g, '\\\\log\\\\left($1\\\\right)'],
                [/sin\(([^)]+)\)/g, '\\\\sin\\\\left($1\\\\right)'],
                [/cos\(([^)]+)\)/g, '\\\\cos\\\\left($1\\\\right)'],
                [/tan\(([^)]+)\)/g, '\\\\tan\\\\left($1\\\\right)'],
                [/asin\(([^)]+)\)/g, '\\\\arcsin\\\\left($1\\\\right)'],
                [/acos\(([^)]+)\)/g, '\\\\arccos\\\\left($1\\\\right)'],
                [/atan\(([^)]+)\)/g, '\\\\arctan\\\\left($1\\\\right)'],
                [/sec\(([^)]+)\)/g, '\\\\sec\\\\left($1\\\\right)'],
                [/csc\(([^)]+)\)/g, '\\\\csc\\\\left($1\\\\right)'],
                [/cot\(([^)]+)\)/g, '\\\\cot\\\\left($1\\\\right)'],
                [/sinh\(([^)]+)\)/g, '\\\\sinh\\\\left($1\\\\right)'],
                [/cosh\(([^)]+)\)/g, '\\\\cosh\\\\left($1\\\\right)'],
                [/tanh\(([^)]+)\)/g, '\\\\tanh\\\\left($1\\\\right)'],
                [/floor\(([^)]+)\)/g, '\\\\lfloor $1 \\\\rfloor'],
                [/ceil\(([^)]+)\)/g, '\\\\lceil $1 \\\\rceil'],
                [/round\(([^)]+)\)/g, '\\\\text{round}\\\\left($1\\\\right)'],
                [/sign\(([^)]+)\)/g, '\\\\text{sgn}\\\\left($1\\\\right)'],
                [/min\(([^,]+),\s*([^)]+)\)/g, '\\\\min\\\\left($1, $2\\\\right)'],
                [/max\(([^,]+),\s*([^)]+)\)/g, '\\\\max\\\\left($1, $2\\\\right)'],
                
                // 不完全な関数（開き括弧のみ）の処理 - 関数名を保護
                [/\bsin\b(?!\()/g, '\\\\sin'],
                [/\bcos\b(?!\()/g, '\\\\cos'],
                [/\btan\b(?!\()/g, '\\\\tan'],
                [/\bln\b(?!\()/g, '\\\\ln'],
                [/\blog\b(?!\()/g, '\\\\log'],
                [/\bsqrt\b(?!\()/g, '\\\\sqrt'],
                [/\babs\b(?!\()/g, '\\\\text{abs}'],
                [/\bexp\b(?!\()/g, '\\\\exp'],
                
                // べき乗の処理
                [/([a-zA-Z0-9π]+|\([^)]+\))\^([a-zA-Z0-9π]+|\([^)]+\))/g, '$1^{$2}'],
                [/([a-zA-Z0-9π]+|\([^)]+\))\^(\{[^}]+\})/g, '$1^$2'],
                
                // 分数の処理（簡単な形式のみ）
                [/\(([^)]+)\)\/\(([^)]+)\)/g, '\\\\frac{$1}{$2}'],
                [/([a-zA-Z0-9π]+)\/([a-zA-Z0-9π]+)/g, '\\\\frac{$1}{$2}'],
                
                // 乗算記号の処理
                [/\*(?!\*)/g, '\\\\cdot '],
                // 暗黙の乗算は慎重に処理 - LaTeX関数を除外
                [/([0-9])([a-zA-Z])/g, '$1$2'], // 係数
                [/([a-zA-Z])([0-9])/g, '$1_{$2}'], // 添字（これは問題ない）
                
                // 定数の置換
                [/\bpi\b/g, '\\\\pi'],
                [/\bπ\b/g, '\\\\pi'],
                [/\be\b(?![a-zA-Z])/g, 'e'],
                
                // 比較演算子
                [/<=/g, '\\\\leq'],
                [/>=/g, '\\\\geq'],
                [/≤/g, '\\\\leq'],
                [/≥/g, '\\\\geq'],
                [/!=/g, '\\\\neq'],
                [/≠/g, '\\\\neq'],
                
                // その他の記号
                [/±/g, '\\\\pm'],
                [/∞/g, '\\\\infty'],
                [/°/g, '^{\\\\circ}']
            ];
            
            // 置換を適用
            replacements.forEach(([pattern, replacement]) => {
                latex = latex.replace(pattern, replacement);
            });
            
            return latex;
        } catch (error) {
            console.error('LaTeX変換エラー:', error);
            return geogebraInput;
        }
    }
    
    // GeoGebra式の構文検証
    validateSyntax(input) {
        const errors = [];
        
        try {
            // 括弧の対応チェック
            const openParens = (input.match(/\(/g) || []).length;
            const closeParens = (input.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
                errors.push(`括弧が一致しません: ( ${openParens}個, ) ${closeParens}個`);
            }
            
            // 無効な文字のチェック
            const invalidChars = input.match(/[^a-zA-Z0-9+\-*/^().,\s=<>≤≥≠πeπ°±∞]/g);
            if (invalidChars) {
                errors.push(`無効な文字: ${invalidChars.join(', ')}`);
            }
            
            // 連続する演算子のチェック
            const consecutiveOps = input.match(/[+\-*/^]{2,}/g);
            if (consecutiveOps) {
                errors.push(`連続する演算子: ${consecutiveOps.join(', ')}`);
            }
            
            // 関数名の後に括弧があるかチェック
            const functionsWithoutParens = input.match(/\b(sin|cos|tan|asin|acos|atan|ln|log|sqrt|abs|exp|floor|ceil|round|sign|min|max)\b(?!\s*\()/g);
            if (functionsWithoutParens) {
                errors.push(`関数に括弧が必要: ${functionsWithoutParens.join(', ')}`);
            }
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
        } catch (error) {
            return {
                valid: false,
                errors: ['構文解析エラー']
            };
        }
    }
    
    // 入力補完機能
    getAutoComplete(input, cursorPosition) {
        const beforeCursor = input.slice(0, cursorPosition);
        const wordMatch = beforeCursor.match(/[a-zA-Z]+$/);
        
        if (!wordMatch) {
            return [];
        }
        
        const partial = wordMatch[0].toLowerCase();
        const suggestions = this.completions.filter(item => 
            item.input.toLowerCase().startsWith(partial)
        );
        
        return suggestions.map(item => ({
            text: item.input,
            displayText: `${item.input} - ${item.description}`,
            example: item.example,
            latex: item.latex,
            cursorOffset: item.input.length - partial.length
        }));
    }
    
    // GeoGebra式の数値評価（簡易版）
    evaluateExpression(input, variables = {}) {
        try {
            // 安全でない評価は避ける - 基本的な計算のみ
            let expr = input
                .replace(/\bpi\b/g, Math.PI)
                .replace(/\bπ\b/g, Math.PI)
                .replace(/\be\b(?![a-zA-Z])/g, Math.E)
                .replace(/\bx\b/g, variables.x || 1)
                .replace(/\by\b/g, variables.y || 1)
                .replace(/\bt\b/g, variables.t || 1)
                .replace(/\ba\b/g, variables.a || 1)
                .replace(/\bb\b/g, variables.b || 1)
                .replace(/\bc\b/g, variables.c || 1);
                
            // 基本的な関数の置換
            expr = expr
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/asin\(/g, 'Math.asin(')
                .replace(/acos\(/g, 'Math.acos(')
                .replace(/atan\(/g, 'Math.atan(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/floor\(/g, 'Math.floor(')
                .replace(/ceil\(/g, 'Math.ceil(')
                .replace(/round\(/g, 'Math.round(')
                .replace(/min\(/g, 'Math.min(')
                .replace(/max\(/g, 'Math.max(')
                .replace(/\^/g, '**')
                .replace(/\*/g, '*');
            
            // 安全な評価
            const result = Function(`"use strict"; return (${expr})`)();
            
            if (typeof result === 'number' && !isNaN(result)) {
                return {
                    success: true,
                    value: result,
                    formatted: this.formatNumber(result)
                };
            } else {
                return {
                    success: false,
                    error: '数値結果が取得できませんでした'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 数値フォーマット
    formatNumber(num) {
        if (Math.abs(num) < 0.0001 || Math.abs(num) > 1000000) {
            return num.toExponential(4);
        } else {
            return Number(num.toFixed(6)).toString();
        }
    }
    
    // GeoGebra入力例を生成
    getExamples() {
        return {
            basic: [
                { input: 'x^2 + 2*x + 1', description: '二次式', latex: 'x^{2} + 2x + 1' },
                { input: 'sin(x) + cos(x)', description: '三角関数', latex: '\\sin(x) + \\cos(x)' },
                { input: 'sqrt(x^2 + y^2)', description: '距離公式', latex: '\\sqrt{x^{2} + y^{2}}' },
                { input: 'ln(x) + exp(x)', description: '対数と指数', latex: '\\ln(x) + e^{x}' }
            ],
            advanced: [
                { input: 'abs(sin(pi*x))', description: '絶対値と三角関数', latex: '|\\sin(\\pi x)|' },
                { input: '(a + b)/(c - d)', description: '分数式', latex: '\\frac{a + b}{c - d}' },
                { input: 'floor(x) + ceil(y)', description: '床関数と天井関数', latex: '\\lfloor x \\rfloor + \\lceil y \\rceil' },
                { input: 'min(x, y) * max(a, b)', description: '最小・最大値', latex: '\\min(x, y) \\cdot \\max(a, b)' }
            ],
            equations: [
                { input: 'x^2 - 4 = 0', description: '二次方程式', latex: 'x^{2} - 4 = 0' },
                { input: 'sin(x) = 0.5', description: '三角方程式', latex: '\\sin(x) = 0.5' },
                { input: 'y <= x^2 + 1', description: '不等式', latex: 'y \\leq x^{2} + 1' },
                { input: 'abs(x - 2) >= 3', description: '絶対値不等式', latex: '|x - 2| \\geq 3' }
            ]
        };
    }
    
    // リアルタイム入力支援
    processInput(input, cursorPosition) {
        const validation = this.validateSyntax(input);
        const latex = this.convertToLatex(input);
        const completions = this.getAutoComplete(input, cursorPosition);
        const evaluation = this.evaluateExpression(input);
        
        return {
            original: input,
            latex: latex,
            valid: validation.valid,
            errors: validation.errors,
            completions: completions,
            evaluation: evaluation,
            timestamp: Date.now()
        };
    }
}

// グローバル初期化
window.geogebraInputManager = new GeoGebraInputManager();