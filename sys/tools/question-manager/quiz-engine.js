class QuizEngine {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedChoice = null;
        this.init();
    }

    async init() {
        await this.loadQuestions();
        if (this.questions.length > 0) {
            this.loadNextQuestion();
        } else {
            document.getElementById("questionText").textContent = "問題が見つかりません";
        }
    }

    async loadQuestions() {
        try {
            // R2から問題を取得
            this.questions = await window.r2Client.getQuestions();
        } catch (error) {
            console.error("問題読み込みエラー:", error);
            // フォールバック: localStorageから読み込み
            this.questions = JSON.parse(localStorage.getItem("questions") || "[]");
        }
    }

    loadNextQuestion() {
        if (this.questions.length === 0) return;
        
        // ランダムに問題を選択
        this.currentQuestionIndex = Math.floor(Math.random() * this.questions.length);
        const question = this.questions[this.currentQuestionIndex];
        
        // 問題文を表示
        document.getElementById("questionText").textContent = question.questionContent.text;
        
        // 選択肢を表示
        const choicesArea = document.getElementById("choicesArea");
        choicesArea.innerHTML = "";
        
        if (question.answerData.choices && question.answerData.choices.length > 0) {
            question.answerData.choices.forEach((choice, index) => {
                const button = document.createElement("button");
                button.className = "choice-btn";
                button.textContent = choice;
                button.onclick = () => this.selectChoice(index, button);
                choicesArea.appendChild(button);
            });
        }
        
        // 結果と解説をリセット
        document.getElementById("resultArea").style.display = "none";
        document.getElementById("explanationArea").style.display = "none";
        document.getElementById("submitBtn").style.display = "block";
        this.selectedChoice = null;
        
        // 解説があれば表示用にセット
        if (question.explanation && question.explanation.text) {
            document.getElementById("explanationText").textContent = question.explanation.text;
        }
    }

    selectChoice(index, button) {
        // 既に選択されているボタンがあればクラスを削除
        const buttons = document.querySelectorAll(".choice-btn");
        buttons.forEach(btn => btn.classList.remove("selected"));
        
        // 新しい選択肢を選択
        button.classList.add("selected");
        this.selectedChoice = index;
    }

    submitAnswer() {
        if (this.selectedChoice === null) {
            alert("選択肢を選択してください");
            return;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = question.answerData.correctAnswers.includes(this.selectedChoice);
        
        // 結果を表示
        const resultArea = document.getElementById("resultArea");
        resultArea.textContent = isCorrect ? "正解！" : "不正解";
        resultArea.className = "result " + (isCorrect ? "correct" : "incorrect");
        resultArea.style.display = "block";
        
        // 解説を表示
        document.getElementById("explanationArea").style.display = "block";
        
        // 解答ボタンを非表示
        document.getElementById("submitBtn").style.display = "none";
    }
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
    window.quiz = new QuizEngine();
});

// グローバル関数
function submitAnswer() {
    if (window.quiz) {
        window.quiz.submitAnswer();
    }
}

function loadNextQuestion() {
    if (window.quiz) {
        window.quiz.loadNextQuestion();
    }
}
