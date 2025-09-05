// AI-powered Question Content Enhancement System
class QuestionContentEnhancer {
    constructor() {
        this.aiTemplates = {
            math: {
                algebra: {
                    patterns: [
                        {
                            template: "方程式 {variable} = {value} を解きなさい",
                            variables: { variable: ["x", "y", "z"], value: [5, 10, 15, 20] },
                            explanation: "両辺から{value}を引くと、{variable} = 0 となります。\nよって、解は {variable} = {value} です。",
                            difficulty: 2
                        },
                        {
                            template: "次の式を因数分解しなさい：{expression}",
                            variables: { 
                                expression: [
                                    "x² - 9",
                                    "x² + 6x + 9",
                                    "x² - 5x + 6",
                                    "2x² - 8x + 6"
                                ]
                            },
                            explanation: "{expression}の因数分解は{solution}です。\n各項の共通因数を見つけ、因数分解の公式を適用します。",
                            difficulty: 3
                        }
                    ],
                    concepts: [
                        {
                            name: "二次方程式",
                            description: "ax² + bx + c = 0 の形の方程式",
                            examples: [
                                { problem: "x² - 5x + 6 = 0", solution: "x = 2, 3" },
                                { problem: "x² + 2x - 8 = 0", solution: "x = -4, 2" }
                            ],
                            commonMistakes: [
                                "因数分解の符号を間違える",
                                "解の公式を間違えて適用する",
                                "重解の場合の処理を忘れる"
                            ]
                        },
                        {
                            name: "因数分解",
                            description: "式を因数の積の形に変形すること",
                            examples: [
                                { problem: "x² - 4", solution: "(x - 2)(x + 2)" },
                                { problem: "x² + 4x + 4", solution: "(x + 2)²" }
                            ],
                            commonMistakes: [
                                "因数分解の公式を間違える",
                                "共通因数を見落とす",
                                "符号のミス"
                            ]
                        }
                    ]
                },
                geometry: {
                    patterns: [
                        {
                            template: "半径{radius}cmの円の面積を求めなさい",
                            variables: { radius: [3, 5, 7, 10] },
                            explanation: "円の面積の公式は S = πr² です。\n半径が{radius}cmなので、S = π × {radius}² = π × {radius * radius} = {radius * radius}π cm² となります。",
                            difficulty: 2
                        },
                        {
                            template: "底辺{base}cm、高さ{height}cmの三角形の面積を求めなさい",
                            variables: { base: [6, 8, 10, 12], height: [4, 5, 6, 8] },
                            explanation: "三角形の面積の公式は S = (底辺 × 高さ) ÷ 2 です。\nS = ({base} × {height}) ÷ 2 = {base * height} ÷ 2 = {(base * height) / 2} cm² となります。",
                            difficulty: 1
                        }
                    ]
                }
            },
            english: {
                grammar: {
                    patterns: [
                        {
                            template: "次の文の( )に適切な単語を入れなさい\nI ( ) to school every day.",
                            choices: ["go", "goes", "going", "went"],
                            correct: 0,
                            explanation: "主語が「I」（一人称単数）で、習慣的な動作を表す現在形なので動詞は「go」になります。\n三人称単数のときのみ動詞に「-s」がつきます。",
                            difficulty: 2
                        },
                        {
                            template: "次の文を現在完了形にしなさい\nShe (write) a letter.",
                            choices: ["wrote", "writes", "has written", "is writing"],
                            correct: 2,
                            explanation: "現在完了形は「have/has + 過去分詞」の形をとります。\n主語が「She」（三人称単数）なので「has written」になります。",
                            difficulty: 3
                        }
                    ]
                },
                vocabulary: {
                    wordFamilies: [
                        {
                            base: "decide",
                            family: {
                                noun: "decision",
                                adjective: "decisive",
                                adverb: "decisively",
                                antonym: "hesitate"
                            },
                            example: "We need to make a (decision) about our future plans.",
                            explanation: "decide（動詞：決める）→ decision（名詞：決定）\n「決断を下す」は make a decision という表現を使います。"
                        },
                        {
                            base: "create",
                            family: {
                                noun: "creation",
                                adjective: "creative",
                                adverb: "creatively",
                                antonym: "destroy"
                            },
                            example: "Her (creative) ideas helped solve the problem.",
                            explanation: "create（動詞：創造する）→ creative（形容詞：創造的な）\n創造的なアイデアは creative ideas と言います。"
                        }
                    ]
                }
            },
            science: {
                physics: {
                    patterns: [
                        {
                            template: "質量{mass}kgの物体に{force}Nの力を加えたときの加速度を求めなさい",
                            variables: { mass: [2, 4, 5, 10], force: [10, 20, 30, 50] },
                            explanation: "ニュートンの第二法則より F = ma です。\n加速度 a = F ÷ m = {force} ÷ {mass} = {force / mass} m/s² となります。",
                            difficulty: 3,
                            formula: "F = ma",
                            unit: "m/s²"
                        },
                        {
                            template: "電圧{voltage}V、抵抗{resistance}Ωの回路を流れる電流を求めなさい",
                            variables: { voltage: [6, 12, 24], resistance: [2, 4, 6, 8] },
                            explanation: "オームの法則より V = IR です。\n電流 I = V ÷ R = {voltage} ÷ {resistance} = {voltage / resistance} A となります。",
                            difficulty: 3,
                            formula: "V = IR",
                            unit: "A（アンペア）"
                        }
                    ],
                    concepts: [
                        {
                            name: "運動の法則",
                            description: "ニュートンの三法則",
                            keyPoints: [
                                "第一法則：慣性の法則",
                                "第二法則：運動方程式 F = ma",
                                "第三法則：作用・反作用の法則"
                            ],
                            examples: [
                                {
                                    situation: "静止している物体",
                                    law: "第一法則",
                                    explanation: "外力が働かない限り、静止し続ける"
                                },
                                {
                                    situation: "ボールを押す",
                                    law: "第二法則",
                                    explanation: "力を加えると加速度が生じる"
                                }
                            ]
                        }
                    ]
                },
                chemistry: {
                    patterns: [
                        {
                            template: "原子番号{number}の元素の電子配置を答えなさい",
                            variables: { number: [6, 11, 17, 20] },
                            explanation: "原子番号{number}の元素は{getElementName(number)}です。\n電子配置は{getElectronConfig(number)}となります。",
                            difficulty: 4
                        }
                    ]
                }
            }
        };

        this.explanationTemplates = {
            math: {
                stepByStep: [
                    "与えられた条件を整理します",
                    "使用する公式を特定します",
                    "公式に値を代入します",
                    "計算を実行します",
                    "答えを単位をつけて表します"
                ],
                commonErrors: [
                    {
                        type: "符号のミス",
                        prevention: "計算の各段階で符号を確認しましょう"
                    },
                    {
                        type: "単位の変換ミス",
                        prevention: "単位を統一してから計算しましょう"
                    },
                    {
                        type: "公式の適用ミス",
                        prevention: "どの公式を使うべきか、問題文をよく読みましょう"
                    }
                ]
            },
            english: {
                grammarPoints: [
                    {
                        rule: "三人称単数現在",
                        pattern: "主語が he/she/it のとき、動詞に -s をつける",
                        example: "He plays tennis. / She studies English."
                    },
                    {
                        rule: "現在完了形",
                        pattern: "have/has + 過去分詞",
                        example: "I have finished my homework."
                    },
                    {
                        rule: "比較級・最上級",
                        pattern: "短い語: -er/-est、長い語: more/most",
                        example: "bigger → biggest, more beautiful → most beautiful"
                    }
                ]
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadQuestionTemplates();
    }

    // AIによる問題生成
    async generateQuestion(subject, topic, difficulty, options = {}) {
        const prompt = this.buildPrompt(subject, topic, difficulty, options);
        
        // ローカルのテンプレートから生成（実際のAI連携時はAPIを呼び出す）
        const generated = this.generateFromTemplate(subject, topic, difficulty);
        
        return {
            id: this.generateId(),
            ...generated,
            metadata: {
                generatedBy: 'AI',
                generatedAt: new Date().toISOString(),
                confidence: this.calculateConfidence(generated)
            }
        };
    }

    generateFromTemplate(subject, topic, difficulty) {
        const templates = this.aiTemplates[subject]?.[topic];
        if (!templates) {
            throw new Error(`No templates found for ${subject}.${topic}`);
        }

        const patterns = templates.patterns || [];
        const suitablePatterns = patterns.filter(p => 
            Math.abs(p.difficulty - difficulty) <= 1
        );

        if (suitablePatterns.length === 0) {
            throw new Error('No suitable patterns found');
        }

        const pattern = suitablePatterns[Math.floor(Math.random() * suitablePatterns.length)];
        return this.instantiatePattern(pattern);
    }

    instantiatePattern(pattern) {
        let question = pattern.template;
        let explanation = pattern.explanation;
        const variables = {};

        // 変数を置換
        Object.entries(pattern.variables || {}).forEach(([key, values]) => {
            const value = values[Math.floor(Math.random() * values.length)];
            variables[key] = value;
            question = question.replace(new RegExp(`{${key}}`, 'g'), value);
            explanation = explanation.replace(new RegExp(`{${key}}`, 'g'), value);
        });

        // 式を計算
        question = question.replace(/\{([^}]+)\}/g, (match, expr) => {
            try {
                return eval(expr);
            } catch {
                return match;
            }
        });

        return {
            questionContent: {
                text: question,
                latex: this.containsLatex(question)
            },
            answerData: {
                type: pattern.choices ? 'multiple-choice' : 'text',
                choices: pattern.choices,
                correctAnswers: pattern.correct !== undefined ? [pattern.correct] : this.calculateAnswer(question),
                explanation: explanation
            },
            difficulty: pattern.difficulty || 3,
            subject: this.inferSubject(question),
            topic: this.inferTopic(question),
            tags: this.generateTags(question),
            estimatedTime: this.estimateTime(question)
        };
    }

    // 自動解説生成
    generateExplanation(question, answer, options = {}) {
        const { detailLevel = 'standard', includeExamples = true, includeCommonMistakes = true } = options;
        
        let explanation = {
            basic: this.generateBasicExplanation(question, answer),
            detailed: this.generateDetailedExplanation(question, answer),
            examples: includeExamples ? this.generateExamples(question) : [],
            commonMistakes: includeCommonMistakes ? this.getCommonMistakes(question) : [],
            tips: this.generateStudyTips(question)
        };

        return explanation;
    }

    generateBasicExplanation(question, answer) {
        const subject = this.inferSubject(question);
        const templates = this.explanationTemplates[subject];
        
        if (!templates) {
            return "この問題の解説は準備中です。";
        }

        // 基本的な解説構造を生成
        let explanation = "この問題を解く手順を説明します。\n\n";
        
        if (templates.stepByStep) {
            explanation += "【解答手順】\n";
            templates.stepByStep.forEach((step, index) => {
                explanation += `${index + 1}. ${step}\n`;
            });
        }

        return explanation;
    }

    generateDetailedExplanation(question, answer) {
        // 詳細な解説を生成
        const subject = this.inferSubject(question);
        const concepts = this.aiTemplates[subject];
        
        let detailed = "\n【詳細な解説】\n";
        
        // 問題タイプに応じた詳細解説
        if (question.includes('方程式') || question.includes('=')) {
            detailed += this.generateMathExplanation(question);
        } else if (question.includes('英語') || /[a-zA-Z]/.test(question)) {
            detailed += this.generateEnglishExplanation(question);
        } else if (question.includes('電圧') || question.includes('抵抗')) {
            detailed += this.generateScienceExplanation(question);
        }
        
        return detailed;
    }

    generateMathExplanation(question) {
        let explanation = "";
        
        // 方程式の解説
        if (question.includes('方程式')) {
            explanation += "方程式を解く基本的な手順：\n";
            explanation += "1. 移項して、変数を片方の辺に集める\n";
            explanation += "2. 係数で割って、変数の係数を1にする\n";
            explanation += "3. 答えを検算する\n\n";
        }
        
        // 計算問題の解説
        if (question.includes('計算') || question.includes('求めなさい')) {
            explanation += "計算のポイント：\n";
            explanation += "- 計算の順序を守る（括弧→掛け割り→足し引き）\n";
            explanation += "- 符号の間違いに注意する\n";
            explanation += "- 分数や小数の処理を正確に行う\n\n";
        }
        
        return explanation;
    }

    generateEnglishExplanation(question) {
        let explanation = "";
        
        // 文法問題の解説
        if (question.includes('文法') || question.includes('grammer')) {
            explanation += "英語の文法ポイント：\n";
            explanation += "- 主語と動詞の一致（三人称単数現在など）\n";
            explanation += "- 時制の一致\n";
            explanation += "- 前置詞の使い方\n\n";
        }
        
        // 語彙問題の解説
        if (question.includes('単語') || question.includes('vocabulary')) {
            explanation += "語彙力を高めるには：\n";
            explanation += "- 単語を文脈で覚える\n";
            explanation += "- 接頭辞・接尾辞の意味を理解する\n";
            explanation += "- 同義語・反義語をセットで覚える\n\n";
        }
        
        return explanation;
    }

    generateScienceExplanation(question) {
        let explanation = "";
        
        // 物理の解説
        if (question.includes('力') || question.includes('加速度')) {
            explanation += "物理の法則：\n";
            explanation += "- ニュートンの運動法則を理解する\n";
            explanation += "- F = ma の関係を使いこなす\n";
            explanation += "- 単位を統一して計算する\n\n";
        }
        
        // 電気の解説
        if (question.includes('電圧') || question.includes('電流')) {
            explanation += "電気回路の基本：\n";
            explanation += "- オームの法則：V = IR\n";
            explanation += "- 直列回路と並列回路の違い\n";
            explanation += "- 電力の計算：P = VI\n\n";
        }
        
        return explanation;
    }

    generateExamples(question) {
        const subject = this.inferSubject(question);
        const examples = [];
        
        // 類似問題を生成
        if (subject === 'math') {
            examples.push({
                problem: "方程式 2x + 5 = 13 を解きなさい",
                solution: "2x = 13 - 5 = 8, x = 4",
                difficulty: 2
            });
        } else if (subject === 'english') {
            examples.push({
                problem: "She (go) to school yesterday.",
                solution: "went（過去形）",
                difficulty: 2
            });
        }
        
        return examples;
    }

    getCommonMistakes(question) {
        const subject = this.inferSubject(question);
        const templates = this.explanationTemplates[subject];
        
        if (!templates || !templates.commonErrors) {
            return [];
        }
        
        return templates.commonErrors.map(error => ({
            type: error.type,
            description: error.prevention,
            example: this.generateMistakeExample(error.type)
        }));
    }

    generateMistakeExample(mistakeType) {
        const examples = {
            '符号のミス': '例：x - 5 = 3 のとき、x = 3 - 5 = -2（誤）→ x = 3 + 5 = 8（正）',
            '単位の変換ミス': '例：1.5kmをmに変換するとき、150m（誤）→1500m（正）',
            '三人称単数': '例：He play tennis.（誤）→ He plays tennis.（正）'
        };
        
        return examples[mistakeType] || '';
    }

    generateStudyTips(question) {
        const tips = [
            "基本公式を暗記するだけでなく、意味を理解しましょう",
            "間違えた問題は、なぜ間違えたのかを分析しましょう",
            "類似問題を解いて、パターンを掴みましょう",
            "自分で問題を作ってみるのも効果的です",
            "定期的に復習して、記憶を定着させましょう"
        ];
        
        return tips.slice(0, 3);
    }

    // 豊富な問題テンプレートライブラリ
    loadQuestionTemplates() {
        this.templateLibrary = {
            mathematics: {
                algebra: {
                    'linear_equation': {
                        name: '一次方程式',
                        variations: [
                            { pattern: 'x + a = b', difficulty: 1 },
                            { pattern: 'ax = b', difficulty: 2 },
                            { pattern: 'ax + b = c', difficulty: 2 },
                            { pattern: 'ax + b = cx + d', difficulty: 3 }
                        ],
                        explanation: '一次方程式の解き方：\n1. 移項してxの項を左、定数項を右に集める\n2. 係数で割る',
                        commonMistakes: ['移項時の符号ミス', '計算ミス']
                    },
                    'quadratic_equation': {
                        name: '二次方程式',
                        variations: [
                            { pattern: 'x² = a', difficulty: 2 },
                            { pattern: '(x+a)(x+b) = 0', difficulty: 3 },
                            { pattern: 'ax² + bx + c = 0', difficulty: 4 }
                        ],
                        explanation: '二次方程式の解き方：\n- 因数分解できる場合は因数分解\n- できない場合は解の公式を使用',
                        formula: 'x = [-b ± √(b² - 4ac)] / 2a'
                    }
                },
                geometry: {
                    'area_calculation': {
                        name: '面積計算',
                        shapes: ['circle', 'triangle', 'rectangle', 'trapezoid'],
                        formulas: {
                            circle: 'S = πr²',
                            triangle: 'S = (底辺 × 高さ) / 2',
                            rectangle: 'S = 縦 × 横',
                            trapezoid: 'S = (上底 + 下底) × 高さ / 2'
                        }
                    }
                }
            },
            english: {
                grammar: {
                    'tenses': {
                        name: '時制',
                        types: ['present_simple', 'present_continuous', 'past_simple', 'future'],
                        rules: {
                            present_simple: '主語 + 動詞の原形（三人称単数現在は-sをつける）',
                            present_continuous: '主語 + be動詞 + 動詞のing形',
                            past_simple: '主語 + 動詞の過去形',
                            future: '主語 + will + 動詞の原形'
                        }
                    }
                }
            }
        };
    }

    // ヘルパーメソッド
    buildPrompt(subject, topic, difficulty, options) {
        return `${subject}の${topic}について、難易度${difficulty}の問題を作成してください。`;
    }

    calculateConfidence(question) {
        // 問題の質や一貫性に基づいて信頼度を計算
        let score = 0.5; // ベーススコア
        
        // 問題文の長さ
        if (question.questionContent.text.length > 20) score += 0.1;
        if (question.questionContent.text.length > 50) score += 0.1;
        
        // 解説の充実度
        if (question.answerData.explanation) score += 0.2;
        
        return Math.min(score, 1.0);
    }

    inferSubject(question) {
        const text = question.questionContent.text || question;
        
        if (text.match(/方程式|計算|面積|体積|円|三角形/)) return 'math';
        if (text.match(/[a-zA-Z]/) || text.includes('英語')) return 'english';
        if (text.match(/力|加速度|電圧|電流|元素/)) return 'science';
        
        return 'general';
    }

    inferTopic(question) {
        const text = question.questionContent.text || question;
        
        if (text.includes('方程式')) return 'algebra';
        if (text.includes('面積') || text.includes('円')) return 'geometry';
        if (text.includes('文法') || text.includes('時制')) return 'grammar';
        if (text.includes('力') || text.includes('運動')) return 'physics';
        
        return 'general';
    }

    containsLatex(text) {
        return /[\\$]/.test(text);
    }

    calculateAnswer(question) {
        // 簡易的な答え計算（実際にはより高度な処理が必要）
        return '解答は計算によって求めます';
    }

    generateTags(question) {
        const subject = this.inferSubject(question);
        const topic = this.inferTopic(question);
        const baseTags = [subject, topic];
        
        // 追加タグ
        if (question.questionContent.text.includes('応用')) baseTags.push('応用');
        if (question.questionContent.text.includes('基本')) baseTags.push('基本');
        if (question.difficulty >= 4) baseTags.push('難問');
        
        return baseTags;
    }

    estimateTime(question) {
        const text = question.questionContent.text || question;
        const baseTime = 60; // 基本時間60秒
        
        // 問題の複雑さに応じて時間を追加
        if (text.length > 100) baseTime += 30;
        if (text.includes('証明') || text.includes('説明')) baseTime += 60;
        if (text.includes('グラフ') || text.includes('図')) baseTime += 30;
        
        return baseTime;
    }

    generateId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getElementName(atomicNumber) {
        const elements = {
            1: '水素', 6: '炭素', 11: 'ナトリウム', 17: '塩素', 20: 'カルシウム'
        };
        return elements[atomicNumber] || '未知の元素';
    }

    getElectronConfig(atomicNumber) {
        // 簡略的な電子配置
        const shells = [2, 8, 8, 18, 18, 32, 32];
        let config = '';
        let remaining = atomicNumber;
        
        for (let i = 0; i < shells.length && remaining > 0; i++) {
            const electrons = Math.min(remaining, shells[i]);
            if (electrons > 0) {
                config += (i + 1) + 's' + (electrons === 1 ? '¹' : electrons > 9 ? electrons : '⁺'.repeat(electrons - 1) + '¹');
                remaining -= electrons;
            }
        }
        
        return config;
    }

    setupEventListeners() {
        // イベントリスナーのセットアップ
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEnhancementUI();
        });
    }

    setupEnhancementUI() {
        // 問題強化UIのセットアップ
        const enhanceButtons = document.querySelectorAll('.enhance-question-btn');
        enhanceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target.dataset.questionId;
                this.enhanceQuestion(questionId);
            });
        });
    }

    async enhanceQuestion(questionId) {
        try {
            // 問題を取得
            const db = window.Database;
            const question = await db.getQuestion(questionId);
            
            if (!question) {
                throw new Error('Question not found');
            }
            
            // 解説を生成
            const enhancedExplanation = this.generateExplanation(
                question.questionContent.text,
                question.answerData.correctAnswers,
                { detailLevel: 'detailed' }
            );
            
            // 問題を更新
            question.answerData.enhancedExplanation = enhancedExplanation;
            question.metadata.enhancedAt = new Date().toISOString();
            
            await db.saveQuestion(question);
            
            // UIを更新
            this.showEnhancedExplanation(questionId, enhancedExplanation);
            
        } catch (error) {
            console.error('Enhancement failed:', error);
            this.showError('問題の強化に失敗しました');
        }
    }

    showEnhancedExplanation(questionId, explanation) {
        const container = document.getElementById(`explanation-${questionId}`);
        if (!container) return;
        
        container.innerHTML = `
            <div class="enhanced-explanation">
                <h4>📚 詳細な解説</h4>
                <div class="explanation-content">
                    <div class="basic-explanation">
                        <h5>基本解説</h5>
                        <p>${explanation.basic.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="detailed-explanation">
                        <h5>詳細解説</h5>
                        <p>${explanation.detailed.replace(/\n/g, '<br>')}</p>
                    </div>
                    ${explanation.examples.length > 0 ? `
                    <div class="examples">
                        <h5>類似問題</h5>
                        ${explanation.examples.map(ex => `
                            <div class="example-item">
                                <p><strong>問題：</strong>${ex.problem}</p>
                                <p><strong>解答：</strong>${ex.solution}</p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    ${explanation.commonMistakes.length > 0 ? `
                    <div class="common-mistakes">
                        <h5>よくある間違い</h5>
                        ${explanation.commonMistakes.map(mistake => `
                            <div class="mistake-item">
                                <p><strong>${mistake.type}：</strong>${mistake.description}</p>
                                <p><small>${mistake.example}</small></p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    <div class="study-tips">
                        <h5>学習のポイント</h5>
                        <ul>
                            ${explanation.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    showError(message) {
        // エラー表示
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// グローバルに公開
window.QuestionContentEnhancer = QuestionContentEnhancer;