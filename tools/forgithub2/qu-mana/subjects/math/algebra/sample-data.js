// 代数問題サンプルデータ
const algebraQuestions = [
    {
        id: 1,
        type: 'linear-equation',
        difficulty: 'easy',
        text: '次の一次方程式を解きなさい。$2x + 5 = 13$',
        answer: 'x = 4',
        explanation: '2x + 5 = 13 より 2x = 8、したがって x = 4',
        steps: ['2x + 5 = 13', '2x = 13 - 5', '2x = 8', 'x = 4'],
        points: 2,
        createdAt: '2024-01-15T10:00:00.000Z'
    },
    {
        id: 2,
        type: 'quadratic-equation',
        difficulty: 'medium',
        text: '次の二次方程式を解きなさい。$x^2 - 5x + 6 = 0$',
        answer: 'x = 2, 3',
        explanation: '(x - 2)(x - 3) = 0 より x = 2, 3',
        steps: ['x² - 5x + 6 = 0', '(x - 2)(x - 3) = 0', 'x - 2 = 0 または x - 3 = 0', 'x = 2, 3'],
        points: 3,
        createdAt: '2024-01-15T11:00:00.000Z'
    },
    {
        id: 3,
        type: 'system-equation',
        difficulty: 'medium',
        text: '次の連立方程式を解きなさい。\n$\\begin{cases} 2x + y = 7 \\\\ x - y = 1 \\end{cases}$',
        answer: 'x = 3, y = 1',
        explanation: '2つの式を足し合わせると 3x = 8 より x = 3、代入すると y = 1',
        steps: ['2x + y = 7', 'x - y = 1', '式を足し合わせ: 3x = 8', 'x = 8/3', '代入: (8/3) - y = 1', 'y = 8/3 - 1 = 5/3'],
        points: 4,
        createdAt: '2024-01-15T12:00:00.000Z'
    },
    {
        id: 4,
        type: 'inequality',
        difficulty: 'easy',
        text: '次の不等式を解きなさい。$3x - 2 > 7$',
        answer: 'x > 3',
        explanation: '3x - 2 > 7 より 3x > 9、したがって x > 3',
        steps: ['3x - 2 > 7', '3x > 7 + 2', '3x > 9', 'x > 3'],
        points: 2,
        createdAt: '2024-01-15T13:00:00.000Z'
    },
    {
        id: 5,
        type: 'function',
        difficulty: 'medium',
        text: '関数 $f(x) = 2x^2 - 3x + 1$ について、$f(2)$ の値を求めなさい。',
        answer: 'f(2) = 3',
        explanation: 'f(2) = 2(2)² - 3(2) + 1 = 2(4) - 6 + 1 = 8 - 6 + 1 = 3',
        steps: ['f(x) = 2x² - 3x + 1', 'f(2) = 2(2)² - 3(2) + 1', 'f(2) = 2(4) - 6 + 1', 'f(2) = 8 - 6 + 1', 'f(2) = 3'],
        points: 3,
        createdAt: '2024-01-15T14:00:00.000Z'
    },
    {
        id: 6,
        type: 'polynomial',
        difficulty: 'hard',
        text: '次の多項式を因数分解しなさい。$x^3 - 6x^2 + 11x - 6$',
        answer: '(x - 1)(x - 2)(x - 3)',
        explanation: '因数定理を使って因数分解します。x=1,2,3が解となるので、(x-1)(x-2)(x-3)',
        steps: ['x³ - 6x² + 11x - 6', 'x=1を代入: 1 - 6 + 11 - 6 = 0 より (x-1)が因数', '割り算: x³ - 6x² + 11x - 6 = (x-1)(x²-5x+6)', 'x²-5x+6 = (x-2)(x-3)', 'よって (x-1)(x-2)(x-3)'],
        points: 5,
        createdAt: '2024-01-15T15:00:00.000Z'
    },
    {
        id: 7,
        type: 'linear-equation',
        difficulty: 'easy',
        text: '次の方程式を解きなさい。$\\frac{x}{3} + 2 = 5$',
        answer: 'x = 9',
        explanation: 'x/3 + 2 = 5 より x/3 = 3、したがって x = 9',
        steps: ['x/3 + 2 = 5', 'x/3 = 5 - 2', 'x/3 = 3', 'x = 9'],
        points: 2,
        createdAt: '2024-01-15T16:00:00.000Z'
    },
    {
        id: 8,
        type: 'quadratic-equation',
        difficulty: 'hard',
        text: '次の二次方程式を解きなさい。$x^2 + 4x + 5 = 0$',
        answer: 'x = -2 ± i',
        explanation: '判別式D = 16 - 20 = -4 < 0 より虚数解',
        steps: ['x² + 4x + 5 = 0', '判別式D = b² - 4ac = 16 - 20 = -4', '解の公式: x = (-4 ± √(-4))/2', 'x = (-4 ± 2i)/2', 'x = -2 ± i'],
        points: 4,
        createdAt: '2024-01-15T17:00:00.000Z'
    }
];

// 問題タイプ定義
const algebraQuestionTypes = {
    'linear-equation': {
        name: '一次方程式',
        description: 'ax + b = c の形式の方程式',
        difficulty: 'easy-medium',
        examples: ['2x + 3 = 7', 'x/2 - 1 = 3']
    },
    'quadratic-equation': {
        name: '二次方程式',
        description: 'ax² + bx + c = 0 の形式の方程式',
        difficulty: 'medium-hard',
        examples: ['x² - 5x + 6 = 0', '2x² + 3x - 2 = 0']
    },
    'system-equation': {
        name: '連立方程式',
        description: '複数の方程式を同時に満たす解を求める',
        difficulty: 'medium',
        examples: ['2x + y = 7, x - y = 1', '3x - 2y = 1, x + y = 5']
    },
    'inequality': {
        name: '不等式',
        description: '大小関係を表す式',
        difficulty: 'easy-medium',
        examples: ['2x + 3 > 7', 'x - 1 ≤ 4']
    },
    'function': {
        name: '関数',
        description: '関数の値や性質に関する問題',
        difficulty: 'medium',
        examples: ['f(x) = 2x + 1 のとき f(3) を求めよ', 'f(x) = x² の増減を調べよ']
    },
    'polynomial': {
        name: '多項式',
        description: '多項式の計算や因数分解',
        difficulty: 'hard',
        examples: ['x³ - 6x² + 11x - 6 を因数分解せよ', '(x+2)(x-3) を展開せよ']
    }
};

// 難易度定義
const difficultyLevels = {
    'easy': {
        name: '簡単',
        description: '基本的な計算問題',
        color: '#22c55e',
        timeLimit: 2,
        points: 2
    },
    'medium': {
        name: '普通',
        description: '標準的なレベルの問題',
        color: '#f59e0b',
        timeLimit: 3,
        points: 3
    },
    'hard': {
        name: '難しい',
        description: '応用的な問題や複雑な計算',
        color: '#ef4444',
        timeLimit: 5,
        points: 5
    }
};

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        algebraQuestions,
        algebraQuestionTypes,
        difficultyLevels
    };
} else {
    window.algebraData = {
        algebraQuestions,
        algebraQuestionTypes,
        difficultyLevels
    };
}