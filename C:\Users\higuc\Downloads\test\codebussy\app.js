// TOEIC対策アプリのメインJavaScript

class TOEICApp {
    constructor() {
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.startTime = null;
        this.timer = null;
        this.timeLimit = 0; // 秒単位
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.showScreen('start-screen');
        this.updateScoreDisplay();
    }
    
    showScreen(screenId) {
        // 全てのスクリーンを非表示
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 指定されたスクリーンを表示
        document.getElementById(screenId).classList.add('active');
    }
    
    startQuiz(type) {
        // 問題数を設定
        let questionCount = 20;
        if (type === 'mixed') {
            questionCount = 40;
        }
        
        // 問題を取得
        this.currentQuestions = getQuestions(type, questionCount);
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.currentQuestions.length).fill(null);
        this.score = 0;
        
        // タイマーを設定（リーディング: 1分/問、リスニング: 30秒/問、ミックス: 45秒/問）
        let timePerQuestion;
        if (type === 'reading') {
            timePerQuestion = 60;
        } else if (type === 'listening') {
            timePerQuestion = 30;
        } else {
            timePerQuestion = 45;
        }
        
        this.timeLimit = this.currentQuestions.length * timePerQuestion;
        this.startTime = Date.now();
        
        this.showScreen('quiz-screen');
        this.displayQuestion();
        this.startTimer();
        this.updateScoreDisplay();
    }
    
    displayQuestion() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        
        // 問題タイプを表示
        document.getElementById('question-type').textContent = question.category;
        
        // 進捗バーを更新
        const progress = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100;
        document.getElementById('progress-fill').style.width = progress + '%';
        
        // 音声プレーヤーの表示/非表示
        const audioPlayer = document.getElementById('audio-player');
        if (question.type === 'listening') {
            audioPlayer.style.display = 'block';
            // 実際の音声ファイルがある場合はここで設定
            // document.getElementById('question-audio').src = question.audioFile;
        } else {
            audioPlayer.style.display = 'none';
        }
        
        // 問題文を表示
        document.getElementById('question-text').innerHTML = question.question.replace(/\n/g, '<br>');
        
        // 選択肢を表示
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.onclick = () => this.selectOption(index);
            
            const isSelected = this.userAnswers[this.currentQuestionIndex] === index;
            if (isSelected) {
                optionElement.classList.add('selected');
            }
            
            optionElement.innerHTML = `
                <span class="option-label">${String.fromCharCode(65 + index)})</span>
                <span>${option.substring(3)}</span>
            `;
            
            optionsContainer.appendChild(optionElement);
        });
        
        // ボタンの状態を更新
        this.updateNavigationButtons();
        this.updateScoreDisplay();
    }
    
    selectOption(optionIndex) {
        // 前の選択を解除
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 新しい選択を設定
        document.querySelectorAll('.option')[optionIndex].classList.add('selected');
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        
        // 次へボタンを有効化
        document.getElementById('next-btn').disabled = false;
        
        // 最後の問題の場合、終了ボタンを表示
        if (this.currentQuestionIndex === this.currentQuestions.length - 1) {
            document.getElementById('next-btn').style.display = 'none';
            document.getElementById('finish-btn').style.display = 'inline-block';
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        // 前へボタン
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        // 次へボタン
        const hasAnswer = this.userAnswers[this.currentQuestionIndex] !== null;
        nextBtn.disabled = !hasAnswer;
        
        // 最後の問題かどうかでボタンを切り替え
        if (this.currentQuestionIndex === this.currentQuestions.length - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = hasAnswer ? 'inline-block' : 'none';
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const remaining = Math.max(0, this.timeLimit - elapsed);
            
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (remaining === 0) {
                this.finishQuiz();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    finishQuiz() {
        this.stopTimer();
        this.calculateScore();
        this.showResults();
    }
    
    calculateScore() {
        let correctAnswers = 0;
        
        this.currentQuestions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correct) {
                correctAnswers++;
            }
        });
        
        this.score = Math.round((correctAnswers / this.currentQuestions.length) * 100);
    }
    
    showResults() {
        this.showScreen('results-screen');
        
        const correctCount = this.userAnswers.filter((answer, index) => 
            answer === this.currentQuestions[index].correct
        ).length;
        
        const accuracy = Math.round((correctCount / this.currentQuestions.length) * 100);
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('total-questions').textContent = this.currentQuestions.length;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }
    
    reviewAnswers() {
        this.showScreen('review-screen');
        
        const reviewContent = document.getElementById('review-content');
        reviewContent.innerHTML = '';
        
        this.currentQuestions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.correct;
            
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            reviewItem.innerHTML = `
                <div class="review-question">
                    <strong>問題 ${index + 1}: ${question.category}</strong><br>
                    ${question.question.replace(/\n/g, '<br>')}
                </div>
                <div class="review-options">
                    ${question.options.map((option, optIndex) => {
                        let className = 'review-option';
                        if (optIndex === question.correct) {
                            className += ' correct-answer';
                        }
                        if (optIndex === userAnswer && !isCorrect) {
                            className += ' incorrect-answer';
                        }
                        if (optIndex === userAnswer) {
                            className += ' user-answer';
                        }
                        
                        return `<div class="${className}">${option}</div>`;
                    }).join('')}
                </div>
                <div class="review-explanation">
                    <strong>解説:</strong> ${question.explanation}
                </div>
            `;
            
            reviewContent.appendChild(reviewItem);
        });
    }
    
    backToResults() {
        this.showScreen('results-screen');
    }
    
    restartApp() {
        this.stopTimer();
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.showScreen('start-screen');
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
        
        if (this.currentQuestions.length > 0) {
            document.getElementById('question-counter').textContent = 
                `${this.currentQuestionIndex + 1}/${this.currentQuestions.length}`;
        } else {
            document.getElementById('question-counter').textContent = '0/0';
        }
    }
}

// グローバル関数（HTMLから呼び出される）
let app;

function startQuiz(type) {
    app.startQuiz(type);
}

function previousQuestion() {
    app.previousQuestion();
}

function nextQuestion() {
    app.nextQuestion();
}

function finishQuiz() {
    app.finishQuiz();
}

function reviewAnswers() {
    app.reviewAnswers();
}

function backToResults() {
    app.backToResults();
}

function restartApp() {
    app.restartApp();
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', function() {
    app = new TOEICApp();
});

// キーボードショートカット
document.addEventListener('keydown', function(event) {
    if (!app || !app.currentQuestions.length) return;
    
    // 数字キー1-4で選択肢を選択
    if (event.key >= '1' && event.key <= '4') {
        const optionIndex = parseInt(event.key) - 1;
        const options = document.querySelectorAll('.option');
        if (options[optionIndex]) {
            app.selectOption(optionIndex);
        }
    }
    
    // 矢印キーで問題移動
    if (event.key === 'ArrowLeft') {
        app.previousQuestion();
    } else if (event.key === 'ArrowRight') {
        app.nextQuestion();
    }
    
    // Enterキーで次の問題または終了
    if (event.key === 'Enter') {
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        if (finishBtn.style.display !== 'none' && !finishBtn.disabled) {
            app.finishQuiz();
        } else if (!nextBtn.disabled) {
            app.nextQuestion();
        }
    }
});