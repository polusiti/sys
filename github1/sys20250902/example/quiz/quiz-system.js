class QuizSystem {
    constructor() {
        this.selectedFormat = 'A1';
        this.questions = [];
        this.currentQuestion = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadQuestions();
        this.updateUI();
    }

    setupEventListeners() {
        // 解答形式選択ボタン
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectFormat(e.target.dataset.format);
            });
        });

        // 問題読み込み
        document.getElementById('loadQuestion').addEventListener('click', () => {
            this.loadSelectedQuestion();
        });

        // 解答開始
        document.getElementById('startAnswer').addEventListener('click', () => {
            this.startAnswer();
        });

        // リセット
        document.getElementById('resetTest').addEventListener('click', () => {
            this.resetTest();
        });

        // カスタム問題テスト
        document.getElementById('testCustom').addEventListener('click', () => {
            this.testCustomQuestion();
        });

        // カスタム問題のEnterキー
        document.getElementById('customQuestion').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.testCustomQuestion();
            }
        });
    }

    selectFormat(format) {
        this.selectedFormat = format;
        
        // ボタンの状態を更新
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === format);
        });
        
        this.updateUI();
    }

    async loadQuestions() {
        try {
            // 複数の問題ファイルを読み込み
            const questionFiles = [
                '/data/questions/quiz-choice-questions.json',
                '/data/questions/quiz-f1-questions.json',
                '/data/questions/quiz-f2-questions.json'
            ];

            this.questions = [];
            
            for (const file of questionFiles) {
                try {
                    const response = await fetch(file);
                    const questions = await response.json();
                    this.questions.push(...questions);
                } catch (error) {
                    console.warn(`問題ファイルの読み込みに失敗: ${file}`, error);
                }
            }
            
            // セレクトボックスに問題を追加
            const select = document.getElementById('questionSelect');
            select.innerHTML = '<option value="">問題を選択してください</option>';
            
            this.questions.forEach((q, index) => {
                const option = document.createElement('option');
                option.value = index;
                const formatLabel = q.answerFormat || 'N/A';
                option.textContent = `[${formatLabel}] ${q.id}: ${q.question}`;
                select.appendChild(option);
            });

            console.log(`${this.questions.length}問の問題を読み込みました`);
        } catch (error) {
            console.error('問題の読み込みに失敗:', error);
        }
    }

    loadSelectedQuestion() {
        const select = document.getElementById('questionSelect');
        const index = parseInt(select.value);
        
        if (isNaN(index) || !this.questions[index]) {
            alert('問題を選択してください');
            return;
        }

        this.currentQuestion = this.questions[index];
        this.displayQuestion();
        this.updateUI();
    }

    displayQuestion() {
        if (!this.currentQuestion) return;

        const display = document.getElementById('questionDisplay');
        display.innerHTML = `
            <strong>問題ID:</strong> ${this.currentQuestion.id}<br>
            <strong>解答形式:</strong> ${this.currentQuestion.answerFormat}<br>
            <strong>科目:</strong> ${this.currentQuestion.subject}<br>
            <strong>分野:</strong> ${this.currentQuestion.topic}<br>
            <strong>難易度:</strong> ${this.currentQuestion.difficulty}<br>
            <strong>問題:</strong> ${this.currentQuestion.stem || ''}<br>
            <strong>内容:</strong> ${this.currentQuestion.question}
        `;
    }

    async startAnswer() {
        if (!this.currentQuestion && !document.getElementById('customQuestion').value.trim()) {
            alert('問題を選択するか、カスタム問題を入力してください');
            return;
        }

        const question = this.currentQuestion ? 
            `${this.currentQuestion.stem} ${this.currentQuestion.question}` :
            document.getElementById('customQuestion').value.trim();

        try {
            const result = await this.openAnswerUI(question);
            this.displayResult(result);
        } catch (error) {
            console.error('解答UIエラー:', error);
            alert('解答UIでエラーが発生しました: ' + error.message);
        }
    }

    async testCustomQuestion() {
        const question = document.getElementById('customQuestion').value.trim();
        if (!question) {
            alert('問題文を入力してください');
            return;
        }

        try {
            const result = await this.openAnswerUI(question);
            this.displayResult(result);
        } catch (error) {
            console.error('解答UIエラー:', error);
            alert('解答UIでエラーが発生しました: ' + error.message);
        }
    }

    async openAnswerUI(question) {
        const command = {
            cmd: 'answer.open',
            mode: this.selectedFormat,
            question: question,
            ui: {
                theme: 'auto',
                allowCancel: true
            }
        };

        // 形式に応じた設定
        if (['A1', 'A2', 'A3'].includes(this.selectedFormat)) {
            // 選択肢の設定
            if (this.currentQuestion && this.currentQuestion.choices) {
                command.choices = this.currentQuestion.choices;
            } else {
                // デフォルトの選択肢
                const choiceCount = this.selectedFormat === 'A1' ? 4 : 
                                 this.selectedFormat === 'A2' ? 6 : 9;
                command.choices = Array.from({length: choiceCount}, (_, i) => 
                    `選択肢 ${String.fromCharCode(65 + i)}`);
            }
        } else if (this.selectedFormat === 'F1') {
            // 問題から設定を読み取り、なければデフォルト
            if (this.currentQuestion) {
                command.defaults = this.currentQuestion.defaults || { a: 1, b: 2, c: 1 };
                command.limits = this.currentQuestion.limits || {
                    a: { min: -999, max: 999 },
                    b: { min: 0, max: 999 },
                    c: { min: -999, max: 999 }
                };
            } else {
                command.defaults = { a: 1, b: 2, c: 1 };
                command.limits = {
                    a: { min: -999, max: 999 },
                    b: { min: 0, max: 999 },
                    c: { min: -999, max: 999 }
                };
            }
            command.ui.f1Layout = 'anaume'; // 'anaume', 'sheet', 'compact'
        } else if (this.selectedFormat === 'F2') {
            // 問題から設定を読み取り、なければデフォルト
            if (this.currentQuestion) {
                command.defaults = this.currentQuestion.defaults || { text: '' };
            } else {
                command.defaults = { text: '' };
            }
        }

        return await AnswerUI.open(command);
    }

    displayResult(result) {
        const display = document.getElementById('resultDisplay');
        const content = document.getElementById('resultContent');
        
        content.textContent = JSON.stringify(result, null, 2);
        display.style.display = 'block';
    }

    resetTest() {
        this.currentQuestion = null;
        document.getElementById('questionSelect').value = '';
        document.getElementById('questionDisplay').innerHTML = 'ここに問題文が表示されます';
        document.getElementById('resultDisplay').style.display = 'none';
        document.getElementById('customQuestion').value = '';
        this.updateUI();
    }

    updateUI() {
        const hasQuestion = this.currentQuestion !== null || 
                           document.getElementById('customQuestion').value.trim() !== '';
        document.getElementById('startAnswer').disabled = !hasQuestion;
    }
}

// システムの初期化
document.addEventListener('DOMContentLoaded', () => {
    new QuizSystem();
});