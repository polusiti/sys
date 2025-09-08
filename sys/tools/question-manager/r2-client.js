// R2クライアント（ブラウザ側からR2に直接保存するための簡易実装）
class R2Client {
    constructor() {
        // 実際のCloudflare Workers経由での保存処理
        // この実装はブラウザ側でWorkersのAPIを呼び出すことを想定
    }

    async saveQuestion(question) {
        try {
            const response = await fetch("/api/save-question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    key: `questions/${question.id}.json`,
                    data: question
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("R2保存エラー:", error);
            throw error;
        }
    }

    async getQuestions() {
        try {
            const response = await fetch("/api/questions");
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const questions = await response.json();
            return questions;
        } catch (error) {
            console.error("問題取得エラー:", error);
            throw error;
        }
    }
}

// グローバルインスタンス
window.r2Client = new R2Client();
