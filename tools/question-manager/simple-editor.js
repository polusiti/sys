class SimpleQuestionEditor {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAnswerFormat();
    }

    setupEventListeners() {
        // 解答形式変更
        document.getElementById("answerFormat").addEventListener("change", () => {
            this.updateAnswerFormat();
        });
    }

    updateAnswerFormat() {
        const format = document.getElementById("answerFormat").value;
        const choicesSection = document.getElementById("choicesSection");
        const freeTextSection = document.getElementById("freeTextSection");

        if (format.startsWith("A")) {
            choicesSection.style.display = "block";
            freeTextSection.style.display = "none";
        } else {
            choicesSection.style.display = "none";
            freeTextSection.style.display = "block";
        }
    }

    async saveQuestion() {
        try {
            // 入力値の取得と検証
            const questionText = document.getElementById("questionText").value.trim();
            const answerFormat = document.getElementById("answerFormat").value;
            const explanation = document.getElementById("explanation").value.trim();

            if (!questionText) {
                alert("問題文を入力してください");
                return;
            }

            // 問題オブジェクトの作成
            const question = {
                id: `Q_${Date.now()}`,
                answerFormat: answerFormat,
                subject: "math",
                topic: "",
                difficulty: 2,
                tags: [],
                questionContent: {
                    stem: "",
                    text: questionText,
                    latex: false,
                    images: []
                },
                answerData: {
                    type: answerFormat.startsWith("A") ? "multiple-choice" : "text",
                    choices: [],
                    correctAnswers: [],
                    closeAnswers: []
                },
                explanation: {
                    text: explanation,
                    latex: false,
                    detailed: "",
                    steps: [],
                    hints: []
                },
                metadata: {
                    estimatedTime: 180,
                    createdAt: new Date().toISOString()
                },
                active: true
            };

            // 解答形式ごとの処理
            if (answerFormat.startsWith("A")) {
                // 4択問題
                const choices = Array.from(document.querySelectorAll(".choice-input"))
                    .map(input => input.value.trim())
                    .filter(value => value);

                if (choices.length < 2) {
                    alert("少なくとも2つの選択肢を入力してください");
                    return;
                }

                question.answerData.choices = choices;

                const correctIndex = parseInt(document.getElementById("correctAnswer").value);
                if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
                    alert("正しい選択肢を選択してください");
                    return;
                }

                question.answerData.correctAnswers = [correctIndex];
            } else {
                // 自由記述問題
                const correctText = document.getElementById("correctText").value.trim();
                if (!correctText) {
                    alert("正解を入力してください");
                    return;
                }

                question.answerData.correctAnswers = [correctText];
            }

            // Cloudflare R2に保存
            await this.saveToR2(question);
            
            // 成功メッセージ
            alert("問題を保存しました！");
            this.clearForm();
        } catch (error) {
            console.error("保存エラー:", error);
            alert("保存中にエラーが発生しました");
        }
    }

    async saveToR2(question) {
        // Cloudflare R2バケットに保存する処理
        // ここではlocalStorageに保存する簡易バージョンとして実装
        // 実際のCloudflare環境では、Workers経由でR2に保存する処理を実装する必要があります
        
        const questions = JSON.parse(localStorage.getItem("questions") || "[]");
        questions.push(question);
        localStorage.setItem("questions", JSON.stringify(questions));
        
        // 実際のR2保存処理（疑似コード）:
        /*
        const response = await fetch("/api/save-question", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bucket: "questa",
                key: `questions/${question.id}.json`,
                data: question
            })
        });
        
        if (!response.ok) {
            throw new Error("R2保存に失敗しました");
        }
        */
    }

    clearForm() {
        document.getElementById("questionText").value = "";
        document.getElementById("answerFormat").value = "A1";
        document.getElementById("explanation").value = "";
        document.getElementById("correctText").value = "";
        document.getElementById("correctAnswer").value = "";
        
        // 選択肢をリセット
        const choiceInputs = document.querySelectorAll(".choice-input");
        choiceInputs.forEach((input, index) => {
            input.value = "";
        });
        
        this.updateAnswerFormat();
    }
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
    window.editor = new SimpleQuestionEditor();
});

// グローバル関数
function saveQuestion() {
    if (window.editor) {
        window.editor.saveQuestion();
    }
}

function clearForm() {
    if (window.editor) {
        window.editor.clearForm();
    }
}
