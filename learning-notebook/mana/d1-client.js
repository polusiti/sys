// D1 Client for Learning Notebook Question Management
// API Base URL
const API_BASE_URL = 'https://data-manager-auth.t88596565.workers.dev';

/**
 * D1データベースから問題を取得
 * @param {string} subject - 科目名 (english-vocabulary, math, physics, chemistry)
 * @param {object} options - オプション (limit, offset, level)
 * @returns {Promise<Array>} 問題配列
 */
async function getQuestions(subject, options = {}) {
    try {
        const params = new URLSearchParams({
            subject: subject,
            limit: options.limit || 100,
            offset: options.offset || 0
        });

        if (options.level) {
            params.append('level', options.level);
        }

        const response = await fetch(`${API_BASE_URL}/api/note/questions?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.questions || [];
    } catch (error) {
        console.error('問題取得エラー:', error);
        throw error;
    }
}

/**
 * D1データベースに問題を作成
 * @param {object} question - 問題データ
 * @returns {Promise<object>} 作成結果
 */
async function createQuestion(question) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/note/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: question.id || generateId(),
                subject: question.subject,
                title: question.title,
                question_text: question.question_text,
                correct_answer: question.correct_answer,
                source: 'learning-notebook',
                word: question.word || null,
                is_listening: question.is_listening || false,
                difficulty_level: question.difficulty_level || 'medium',
                mode: question.mode || null,
                choices: question.choices || null,
                media_urls: question.media_urls || null,
                explanation: question.explanation || null,
                tags: question.tags || null,
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('問題作成エラー:', error);
        throw error;
    }
}

/**
 * D1データベースの問題を更新
 * @param {string} questionId - 問題ID
 * @param {object} updates - 更新データ
 * @returns {Promise<object>} 更新結果
 */
async function updateQuestion(questionId, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/note/questions/${questionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...updates,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('問題更新エラー:', error);
        throw error;
    }
}

/**
 * D1データベースから問題を削除（ソフトデリート）
 * @param {string} questionId - 問題ID
 * @returns {Promise<object>} 削除結果
 */
async function deleteQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/note/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('問題削除エラー:', error);
        throw error;
    }
}

/**
 * 問題数を取得
 * @param {string} subject - 科目名
 * @returns {Promise<number>} 問題数
 */
async function getQuestionCount(subject) {
    try {
        const questions = await getQuestions(subject, { limit: 1000 });
        return questions.length;
    } catch (error) {
        console.error('問題数取得エラー:', error);
        return 0;
    }
}

/**
 * ユニークIDを生成
 * @returns {string} ユニークID
 */
function generateId() {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * JSON形式で問題をエクスポート
 * @param {string} subject - 科目名
 * @returns {Promise<void>}
 */
async function exportQuestions(subject) {
    try {
        const questions = await getQuestions(subject, { limit: 1000 });
        const dataStr = JSON.stringify(questions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${subject}_questions_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`${questions.length}問をエクスポートしました`);
    } catch (error) {
        console.error('エクスポートエラー:', error);
        alert('エクスポートに失敗しました: ' + error.message);
    }
}

/**
 * JSON形式で問題をインポート
 * @param {File} file - JSONファイル
 * @returns {Promise<Array>} インポートした問題配列
 */
async function importQuestions(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const questions = JSON.parse(e.target.result);

                if (!Array.isArray(questions)) {
                    throw new Error('無効なJSONフォーマットです');
                }

                const results = [];
                let successCount = 0;
                let errorCount = 0;

                for (const question of questions) {
                    try {
                        const result = await createQuestion(question);
                        results.push(result);
                        successCount++;
                    } catch (error) {
                        console.error(`問題 ${question.id} のインポートエラー:`, error);
                        errorCount++;
                    }
                }

                console.log(`インポート完了: 成功${successCount}問, 失敗${errorCount}問`);
                alert(`インポート完了\n成功: ${successCount}問\n失敗: ${errorCount}問`);

                resolve(results);
            } catch (error) {
                console.error('インポートエラー:', error);
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('ファイル読み込みエラー'));
        };

        reader.readAsText(file);
    });
}

// グローバルスコープに公開
window.D1Client = {
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionCount,
    exportQuestions,
    importQuestions,
    generateId
};
