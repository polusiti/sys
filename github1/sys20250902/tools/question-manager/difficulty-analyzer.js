// Question Difficulty Analysis System
class DifficultyAnalyzer {
    constructor() {
        this.difficultyFactors = {
            // 計算の複雑さ
            calculation: {
                simple: { weight: 1, patterns: [/\d\s*[+\-]\s*\d/, /\d\s*\*\s*\d/] },
                medium: { weight: 2, patterns: [/\d\s*[*\/]\s*\d/, /\([^)]+\)/] },
                complex: { weight: 3, patterns: [/\d\s*\^\s*\d/, /√|sqrt/, /\d+\.\d+/] }
            },
            
            // 概念の抽象度
            abstraction: {
                concrete: { weight: 1, patterns: [/リンゴ|机|車/, /\d+個|\d+人/] },
                semiAbstract: { weight: 2, patterns: [/変数|関数|確率/] },
                abstract: { weight: 3, patterns: [/証明|定理|一般解/] }
            },
            
            // 解答手順の数
            steps: {
                single: { weight: 1, maxSteps: 2 },
                multiple: { weight: 2, maxSteps: 4 },
                complex: { weight: 3, maxSteps: 10 }
            },
            
            // 必要な知識の深さ
            knowledgeDepth: {
                basic: { weight: 1, keywords: ['基本', '定義', '公式'] },
                applied: { weight: 2, keywords: ['応用', '組み合わせ', '変換'] },
                advanced: { weight: 3, keywords: ['証明', '一般化', '拡張'] }
            },
            
            // 問題文の長さ
            length: {
                short: { weight: 1, maxLength: 50 },
                medium: { weight: 2, maxLength: 100 },
                long: { weight: 3, maxLength: 200 }
            }
        };
        
        this.subjectSpecificFactors = {
            math: {
                algebra: {
                    difficultyIndicators: [
                        { pattern: /二次方程式|因数分解/, weight: 2 },
                        { pattern: /連立方程式/, weight: 2 },
                        { pattern: /不等式/, weight: 2 },
                        { pattern: /絶対値/, weight: 1.5 },
                        { pattern: /複素数/, weight: 3 }
                    ]
                },
                geometry: {
                    difficultyIndicators: [
                        { pattern: /証明/, weight: 3 },
                        { pattern: /空間図形/, weight: 2.5 },
                        { pattern: /相似|合同/, weight: 2 },
                        { pattern: /円周角|中心角/, weight: 1.5 },
                        { pattern: /体積|表面積/, weight: 1.5 }
                    ]
                },
                calculus: {
                    difficultyIndicators: [
                        { pattern: /微分|積分/, weight: 2 },
                        { pattern: /極限/, weight: 2 },
                        { pattern: /級数/, weight: 2.5 },
                        { pattern: /偏微分/, weight: 3 }
                    ]
                }
            },
            english: {
                grammar: {
                    difficultyIndicators: [
                        { pattern: /現在完了|過去完了/, weight: 2 },
                        { pattern: /関係代名詞/, weight: 2 },
                        { pattern: /仮定法/, weight: 3 },
                        { pattern: /分詞構文/, weight: 2.5 }
                    ]
                },
                vocabulary: {
                    difficultyIndicators: [
                        { pattern: /語彙|単語/, weight: 1 },
                        { pattern: /イディオム|慣用句/, weight: 2 },
                        { pattern: /派生語/, weight: 1.5 }
                    ]
                },
                reading: {
                    difficultyIndicators: [
                        { pattern: /長文|読解/, weight: 1.5 },
                        { pattern: /要約/, weight: 2 },
                        { pattern: /推論/, weight: 2 }
                    ]
                }
            },
            science: {
                physics: {
                    difficultyIndicators: [
                        { pattern: /運動方程式/, weight: 2 },
                        { pattern: /エネルギー保存則/, weight: 2 },
                        { pattern: /電磁気/, weight: 2.5 },
                        { pattern: /量子力学/, weight: 3 }
                    ]
                },
                chemistry: {
                    difficultyIndicators: [
                        { pattern: /化学反応式/, weight: 2 },
                        { pattern: /モル濃度/, weight: 1.5 },
                        { pattern: /有機化学/, weight: 2.5 },
                        { pattern: /電気分解/, weight: 2 }
                    ]
                }
            }
        };
        
        this.init();
    }

    init() {
        this.setupAnalysisUI();
    }

    // 問題の難易度を分析
    analyzeQuestion(question) {
        const text = question.questionContent.text || '';
        const subject = question.subject || 'general';
        const topic = question.topic || 'general';
        
        // 基本スコアの計算
        let baseScore = this.calculateBaseDifficulty(text);
        
        // 科目固有の要因を追加
        let subjectScore = this.calculateSubjectDifficulty(text, subject, topic);
        
        // 回答形式による補正
        let formatScore = this.calculateFormatDifficulty(question);
        
        // 総合スコアの計算
        let totalScore = (baseScore + subjectScore + formatScore) / 3;
        
        // 1-5のスケールに変換
        let difficultyLevel = this.normalizeScore(totalScore);
        
        // 分析結果の詳細
        const analysis = {
            difficulty: difficultyLevel,
            score: totalScore,
            factors: {
                base: baseScore,
                subject: subjectScore,
                format: formatScore
            },
            breakdown: this.generateBreakdown(text, subject),
            suggestions: this.generateSuggestions(difficultyLevel, analysis),
            estimatedTime: this.estimateSolvingTime(difficultyLevel, text)
        };
        
        return analysis;
    }

    calculateBaseDifficulty(text) {
        let score = 1; // 基本スコア
        
        // 計算の複雑さ
        Object.entries(this.difficultyFactors.calculation).forEach(([level, config]) => {
            if (config.patterns.some(pattern => pattern.test(text))) {
                score += config.weight;
            }
        });
        
        // 概念の抽象度
        Object.entries(this.difficultyFactors.abstraction).forEach(([level, config]) => {
            if (config.patterns.some(pattern => pattern.test(text))) {
                score += config.weight;
            }
        });
        
        // 文章の長さ
        const textLength = text.length;
        if (textLength > 100) score += this.difficultyFactors.length.medium.weight;
        if (textLength > 200) score += this.difficultyFactors.length.long.weight;
        
        // 特殊記号の数
        const specialChars = (text.match(/[=+\-*/^√∫∑∞θαβγδ]/g) || []).length;
        score += Math.min(specialChars * 0.2, 2);
        
        return Math.min(score, 5);
    }

    calculateSubjectDifficulty(text, subject, topic) {
        let score = 1;
        
        const subjectFactors = this.subjectSpecificFactors[subject]?.[topic];
        if (!subjectFactors) return score;
        
        subjectFactors.difficultyIndicators.forEach(indicator => {
            if (indicator.pattern.test(text)) {
                score += indicator.weight;
            }
        });
        
        return Math.min(score, 5);
    }

    calculateFormatDifficulty(question) {
        let score = 1;
        const format = question.answerFormat;
        
        switch(format) {
            case 'A1': // 4択
                score = 1;
                break;
            case 'A2': // 6択
                score = 1.2;
                break;
            case 'A3': // 9択
                score = 1.5;
                break;
            case 'F1': // 分数
                score = 1.5;
                break;
            case 'F2': // 記述式
                score = 2;
                break;
            case 'B1': // 画像選択
                score = 1.3;
                break;
            case 'C1': // 穴埋め
                score = 1.5;
                break;
            case 'D1': // 組み合わせ
                score = 2;
                break;
            case 'E1': // 並べ替え
                score = 1.8;
                break;
            case 'G1': // 複数選択
                score = 1.7;
                break;
        }
        
        // 選択肢の数による補正
        if (question.answerData.choices) {
            const choiceCount = question.answerData.choices.length;
            if (choiceCount > 4) score += 0.2;
            if (choiceCount > 6) score += 0.3;
        }
        
        return Math.min(score, 5);
    }

    normalizeScore(score) {
        // 0-5のスケールに正規化
        return Math.max(1, Math.min(5, Math.round(score)));
    }

    generateBreakdown(text, subject) {
        const breakdown = {
            textComplexity: this.analyzeTextComplexity(text),
            cognitiveDemand: this.analyzeCognitiveDemand(text),
            subjectKnowledge: this.analyzeSubjectKnowledge(text, subject),
            timeRequired: this.estimateTimeNeeded(text)
        };
        
        return breakdown;
    }

    analyzeTextComplexity(text) {
        let complexity = {
            readability: 'medium',
            technicalTerms: 0,
            sentenceCount: text.split(/[。！？.!?]/).filter(s => s.trim()).length,
            avgWordsPerSentence: 0
        };
        
        // 技術用語のカウント
        const technicalTerms = [
            '方程式', '関数', '微分', '積分', '確率', 'ベクトル',
            '原子', '分子', '元素', '化合物', '反応',
            '文法', '時制', '不定詞', '分詞', '関係代名詞'
        ];
        
        complexity.technicalTerms = technicalTerms.reduce((count, term) => {
            return count + (text.includes(term) ? 1 : 0);
        }, 0);
        
        // 平均語数
        const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
        if (sentences.length > 0) {
            const totalWords = sentences.reduce((sum, sentence) => {
                return sum + sentence.split(/\s+/).length;
            }, 0);
            complexity.avgWordsPerSentence = totalWords / sentences.length;
        }
        
        return complexity;
    }

    analyzeCognitiveDemand(text) {
        const bloomLevels = {
            remember: { patterns: [/覚える|記憶する|思い出す/], weight: 1 },
            understand: { patterns: [/説明する|要約する|例を挙げる/], weight: 2 },
            apply: { patterns: [/適用する|使う|解く/], weight: 2.5 },
            analyze: { patterns: [/分析する|比較する|分類する/], weight: 3 },
            evaluate: { patterns: [/評価する|判断する|正当化する/], weight: 3.5 },
            create: { patterns: [/作成する|設計する|開発する/], weight: 4 }
        };
        
        let maxLevel = 'remember';
        let maxWeight = 0;
        
        Object.entries(bloomLevels).forEach(([level, config]) => {
            if (config.patterns.some(pattern => pattern.test(text)) && config.weight > maxWeight) {
                maxLevel = level;
                maxWeight = config.weight;
            }
        });
        
        return {
            bloomLevel: maxLevel,
            cognitiveWeight: maxWeight
        };
    }

    analyzeSubjectKnowledge(text, subject) {
        const knowledgeMap = {
            math: {
                basic: [/足し算|引き算|掛け算|割り算/],
                intermediate: [/方程式|関数|グラフ/],
                advanced: [/微分|積分|行列|ベクトル/]
            },
            english: {
                basic: [/単語|簡単な文/],
                intermediate: [/時制|文法|長文/],
                advanced: [/複雑な構文|文学的表現/]
            },
            science: {
                basic: [/基本的な法則|簡単な実験/],
                intermediate: [/応用|計算問題/],
                advanced: [/複雑な現象|理論的な考察/]
            }
        };
        
        const subjectKnowledge = knowledgeMap[subject];
        if (!subjectKnowledge) return { level: 'unknown', score: 0 };
        
        let maxScore = 0;
        let detectedLevel = 'basic';
        
        Object.entries(subjectKnowledge).forEach(([level, patterns]) => {
            const score = patterns.reduce((sum, pattern) => {
                return sum + (pattern.test(text) ? 1 : 0);
            }, 0);
            
            if (score > maxScore) {
                maxScore = score;
                detectedLevel = level;
            }
        });
        
        return {
            level: detectedLevel,
            score: maxScore
        };
    }

    estimateTimeNeeded(text) {
        let baseTime = 30; // 基本時間30秒
        
        // 文字数による時間追加
        baseTime += text.length * 0.5;
        
        // 計算問題による時間追加
        if (text.match(/[+\-*/=]/)) baseTime += 30;
        
        // 図表やグラフによる時間追加
        if (text.includes('図') || text.includes('グラフ')) baseTime += 20;
        
        // 証明問題による時間追加
        if (text.includes('証明')) baseTime += 60;
        
        return Math.round(baseTime);
    }

    generateSuggestions(difficulty, analysis) {
        const suggestions = [];
        
        // 難易度に基づく提案
        if (difficulty >= 4) {
            suggestions.push({
                type: 'hint',
                text: '問題が難しいようです。ヒントやステップバイステップの説明を追加しましょう'
            });
            suggestions.push({
                type: 'prerequisite',
                text: '必要な前提知識を確認し、関連する基本問題を用意すると良いでしょう'
            });
        }
        
        if (analysis.factors.base > 3.5) {
            suggestions.push({
                type: 'simplify',
                text: '問題文をより具体的にするか、使用する数値を簡単にしてみましょう'
            });
        }
        
        if (analysis.breakdown.textComplexity.technicalTerms > 3) {
            suggestions.push({
                type: 'glossary',
                text: '専門用語が多いようです。用語解説を追加すると理解しやすくなります'
            });
        }
        
        if (analysis.breakdown.cognitiveDemand.cognitiveWeight > 3) {
            suggestions.push({
                type: 'scaffold',
                text: '認知的負荷を軽減するため、問題を小さなステップに分割しましょう'
            });
        }
        
        return suggestions;
    }

    estimateSolvingTime(difficulty, text) {
        const baseTimes = {
            1: 30,   // 簡単：30秒
            2: 60,   // やや簡単：1分
            3: 120,  // 普通：2分
            4: 180,  // 難しい：3分
            5: 300   // 非常に難しい：5分
        };
        
        let time = baseTimes[difficulty] || 120;
        
        // 文字数による補正
        time += Math.floor(text.length / 10);
        
        // 問題タイプによる補正
        if (text.includes('証明')) time *= 1.5;
        if (text.includes('グラフ') || text.includes('図')) time *= 1.2;
        
        return time;
    }

    setupAnalysisUI() {
        // 難易度分析UIのセットアップ
        document.addEventListener('DOMContentLoaded', () => {
            this.addAnalyzeButtons();
        });
    }

    addAnalyzeButtons() {
        const editorForms = document.querySelectorAll('.question-editor-form');
        
        editorForms.forEach(form => {
            const analyzeBtn = document.createElement('button');
            analyzeBtn.type = 'button';
            analyzeBtn.className = 'btn-secondary';
            analyzeBtn.textContent = '🔍 難易度を分析';
            analyzeBtn.onclick = () => this.analyzeCurrentQuestion(form);
            
            form.appendChild(analyzeBtn);
        });
    }

    analyzeCurrentQuestion(form) {
        // フォームから問題データを取得
        const questionData = this.extractQuestionFromForm(form);
        
        // 分析を実行
        const analysis = this.analyzeQuestion(questionData);
        
        // 結果を表示
        this.showAnalysisResult(analysis, form);
    }

    extractQuestionFromForm(form) {
        return {
            questionContent: {
                text: form.querySelector('#questionText')?.value || ''
            },
            subject: form.querySelector('#subject')?.value || 'general',
            topic: form.querySelector('#topic')?.value || 'general',
            answerFormat: form.querySelector('#answerFormat')?.value || 'A1',
            answerData: {
                choices: this.extractChoices(form),
                correctAnswers: []
            }
        };
    }

    extractChoices(form) {
        const choices = [];
        form.querySelectorAll('.choice-input').forEach(input => {
            if (input.value) {
                choices.push(input.value);
            }
        });
        return choices;
    }

    showAnalysisResult(analysis, form) {
        // 既存の結果を削除
        const existingResult = form.querySelector('.difficulty-analysis');
        if (existingResult) {
            existingResult.remove();
        }
        
        // 結果コンテナを作成
        const resultContainer = document.createElement('div');
        resultContainer.className = 'difficulty-analysis';
        resultContainer.innerHTML = `
            <div class="analysis-header">
                <h4>🔍 難易度分析結果</h4>
                <div class="difficulty-score">
                    <span class="score-number">${analysis.difficulty}</span>
                    <span class="score-label">/ 5</span>
                </div>
            </div>
            
            <div class="analysis-details">
                <div class="analysis-section">
                    <h5>分析の内訳</h5>
                    <div class="factor-bars">
                        ${this.createFactorBar('基本難易度', analysis.factors.base)}
                        ${this.createFactorBar('科目固有', analysis.factors.subject)}
                        ${this.createFactorBar('形式難易度', analysis.factors.format)}
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h5>詳細分析</h5>
                    <div class="detail-item">
                        <span>文章の複雑さ：</span>
                        <span>${analysis.breakdown.textComplexity.readability}</span>
                    </div>
                    <div class="detail-item">
                        <span>認知的要求：</span>
                        <span>${analysis.breakdown.cognitiveDemand.bloomLevel} レベル</span>
                    </div>
                    <div class="detail-item">
                        <span>必要な知識：</span>
                        <span>${analysis.breakdown.subjectKnowledge.level}</span>
                    </div>
                    <div class="detail-item">
                        <span>推定解答時間：</span>
                        <span>${Math.floor(analysis.estimatedTime / 60)}分${analysis.estimatedTime % 60}秒</span>
                    </div>
                </div>
                
                ${analysis.suggestions.length > 0 ? `
                <div class="analysis-section">
                    <h5>改善提案</h5>
                    <ul class="suggestions-list">
                        ${analysis.suggestions.map(suggestion => `
                            <li class="suggestion-item ${suggestion.type}">
                                ${suggestion.text}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div class="analysis-actions">
                <button class="btn-primary" onclick="this.closest('.difficulty-analysis').remove()">閉じる</button>
                <button class="btn-secondary" onclick="difficultyAnalyzer.applyAnalysis(${JSON.stringify(analysis).replace(/"/g, '&quot;')})">分析を適用</button>
            </div>
        `;
        
        // スタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            .difficulty-analysis {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                margin-top: 20px;
                padding: 20px;
            }
            
            .analysis-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .difficulty-score {
                display: flex;
                align-items: baseline;
                gap: 4px;
            }
            
            .score-number {
                font-size: 32px;
                font-weight: 700;
                color: #4f46e5;
            }
            
            .score-label {
                font-size: 18px;
                color: #64748b;
            }
            
            .factor-bars {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin: 16px 0;
            }
            
            .factor-bar {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .factor-label {
                min-width: 100px;
                font-size: 14px;
                color: #475569;
            }
            
            .bar-container {
                flex: 1;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #4f46e5, #7c3aed);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .bar-value {
                min-width: 40px;
                text-align: right;
                font-size: 14px;
                font-weight: 600;
                color: #4f46e5;
            }
            
            .detail-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
            }
            
            .suggestions-list {
                list-style: none;
                padding: 0;
            }
            
            .suggestion-item {
                padding: 8px 12px;
                margin-bottom: 8px;
                background: white;
                border-radius: 6px;
                border-left: 3px solid #4f46e5;
                font-size: 14px;
            }
            
            .suggestion-item.hint {
                border-left-color: #10b981;
            }
            
            .suggestion-item.prerequisite {
                border-left-color: #f59e0b;
            }
            
            .analysis-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 20px;
            }
        `;
        
        if (!document.querySelector('#difficulty-analysis-styles')) {
            style.id = 'difficulty-analysis-styles';
            document.head.appendChild(style);
        }
        
        // フォームに追加
        form.appendChild(resultContainer);
        
        // アニメーションでバーを表示
        setTimeout(() => {
            resultContainer.querySelectorAll('.bar-fill').forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        }, 100);
    }

    createFactorBar(label, value) {
        const percentage = (value / 5) * 100;
        return `
            <div class="factor-bar">
                <span class="factor-label">${label}</span>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="bar-value">${value.toFixed(1)}</span>
            </div>
        `;
    }

    applyAnalysis(analysisStr) {
        try {
            const analysis = JSON.parse(analysisStr.replace(/&quot;/g, '"'));
            
            // 難易度をフォームに適用
            const difficultyInput = document.querySelector('input[name="difficulty"], select[name="difficulty"]');
            if (difficultyInput) {
                difficultyInput.value = analysis.difficulty;
            }
            
            // 推定時間をメタデータに追加
            const timeInput = document.querySelector('input[name="estimatedTime"]');
            if (timeInput) {
                timeInput.value = analysis.estimatedTime;
            }
            
            // 成功メッセージ
            this.showNotification('分析結果を適用しました', 'success');
            
        } catch (error) {
            console.error('Failed to apply analysis:', error);
            this.showNotification('分析結果の適用に失敗しました', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // バッチ分析機能
    async analyzeQuestionBatch(questions) {
        const results = [];
        
        for (const question of questions) {
            const analysis = this.analyzeQuestion(question);
            results.push({
                id: question.id,
                analysis: analysis
            });
        }
        
        // 集計統計
        const stats = this.calculateBatchStatistics(results);
        
        return {
            results: results,
            statistics: stats
        };
    }

    calculateBatchStatistics(results) {
        const difficulties = results.map(r => r.analysis.difficulty);
        const avgDifficulty = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
        
        const distribution = [0, 0, 0, 0, 0];
        difficulties.forEach(d => {
            distribution[d - 1]++;
        });
        
        return {
            totalQuestions: results.length,
            averageDifficulty: avgDifficulty.toFixed(2),
            distribution: distribution,
            averageTime: Math.round(results.reduce((sum, r) => sum + r.analysis.estimatedTime, 0) / results.length)
        };
    }
}

// グローバルに公開
window.DifficultyAnalyzer = DifficultyAnalyzer;