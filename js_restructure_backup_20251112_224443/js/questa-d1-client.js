/**
 * Questa D1 Client - D1データベース連携ライブラリ
 * 問題データをD1に保存、音声ファイルはR2に保存
 */

class QuestaD1Manager {
    constructor(options = {}) {
        this.d1BaseURL = options.d1BaseURL || '/api/d1';
        this.r2BaseURL = options.r2BaseURL || '/api/r2';
        this.adminToken = options.adminToken || localStorage.getItem('admin_token');
        this.fallbackMode = options.fallbackMode || true;
    }

    // 認証ヘッダー取得
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`
        };
    }

    // D1サーバーが利用可能かチェック
    async isD1Available() {
        try {
            const response = await fetch(`${this.d1BaseURL}/health`, {
                method: 'GET',
                timeout: 2000
            });
            return response.ok;
        } catch (error) {
            console.warn('D1サーバーが利用できません。ローカルモードで動作します。');
            return false;
        }
    }

    // 問題をD1に保存（音声ファイルはR2）
    async saveQuestion(questionData) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.saveQuestionToLocalStorage(questionData);
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/questions`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                throw new Error(`D1保存エラー: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ 問題をD1に保存完了:', result);
            return { success: true, mode: 'd1', data: result };

        } catch (error) {
            console.error('D1保存エラー:', error);
            if (this.fallbackMode) {
                return this.saveQuestionToLocalStorage(questionData);
            }
            throw error;
        }
    }

    // 複数問題をバッチ保存
    async saveQuestions(subject, questions) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.saveQuestionsToLocalStorage(subject, questions);
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/questions/batch`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ subject, questions })
            });

            if (!response.ok) {
                throw new Error(`D1バッチ保存エラー: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ ${questions.length}問題をD1に保存完了`);
            return { success: true, mode: 'd1', count: questions.length };

        } catch (error) {
            console.error('D1バッチ保存エラー:', error);
            if (this.fallbackMode) {
                return this.saveQuestionsToLocalStorage(subject, questions);
            }
            throw error;
        }
    }

    // 問題をD1から取得
    async getQuestions(subject, filters = {}) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.getQuestionsFromLocalStorage(subject);
        }

        try {
            const queryParams = new URLSearchParams({
                subject,
                ...filters
            });

            const response = await fetch(`${this.d1BaseURL}/questions?${queryParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`D1取得エラー: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, questions: result.questions, mode: 'd1' };

        } catch (error) {
            console.error('D1取得エラー:', error);
            if (this.fallbackMode) {
                return this.getQuestionsFromLocalStorage(subject);
            }
            throw error;
        }
    }

    // 音声ファイルをR2にアップロード
    async uploadAudio(file, questionId, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('questionId', questionId);
            formData.append('metadata', JSON.stringify(metadata));

            const response = await fetch(`${this.r2BaseURL}/upload/audio`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`R2音声アップロードエラー: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ 音声ファイルをR2にアップロード完了:', result);
            return result;

        } catch (error) {
            console.error('R2音声アップロードエラー:', error);
            throw error;
        }
    }

    // 問題を更新（D1）
    async updateQuestion(questionId, updateData) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.updateQuestionInLocalStorage(questionId, updateData);
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/questions/${questionId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`D1更新エラー: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ 問題をD1で更新完了:', result);
            return { success: true, mode: 'd1', data: result };

        } catch (error) {
            console.error('D1更新エラー:', error);
            if (this.fallbackMode) {
                return this.updateQuestionInLocalStorage(questionId, updateData);
            }
            throw error;
        }
    }

    // 問題を削除（D1）
    async deleteQuestion(questionId) {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.deleteQuestionFromLocalStorage(questionId);
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/questions/${questionId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`D1削除エラー: ${response.status}`);
            }

            console.log('✅ 問題をD1から削除完了');
            return { success: true, mode: 'd1' };

        } catch (error) {
            console.error('D1削除エラー:', error);
            if (this.fallbackMode) {
                return this.deleteQuestionFromLocalStorage(questionId);
            }
            throw error;
        }
    }

    // === フォールバック: ローカルストレージ操作 ===

    saveQuestionToLocalStorage(questionData) {
        const storageKey = `question_${questionData.id}`;
        const data = {
            ...questionData,
            savedAt: new Date().toISOString(),
            mode: 'localStorage_fallback'
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log('💾 問題をローカルストレージに保存:', data);
        return { success: true, mode: 'localStorage', key: storageKey };
    }

    saveQuestionsToLocalStorage(subject, questions) {
        const storageKey = `${subject}_questions_backup`;
        const data = {
            subject,
            questions,
            savedAt: new Date().toISOString(),
            mode: 'localStorage_fallback'
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`💾 ${questions.length}問題をローカルストレージに保存`);
        return { success: true, mode: 'localStorage', key: storageKey, count: questions.length };
    }

    getQuestionsFromLocalStorage(subject) {
        const storageKey = `${subject}_questions_backup`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const data = JSON.parse(stored);
            console.log('📁 ローカルストレージから問題を取得:', data);
            return { success: true, questions: data.questions, mode: 'localStorage' };
        }
        return { success: false, questions: [], mode: 'localStorage' };
    }

    updateQuestionInLocalStorage(questionId, updateData) {
        const storageKey = `question_${questionId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const data = JSON.parse(stored);
            const updated = { ...data, ...updateData, updatedAt: new Date().toISOString() };
            localStorage.setItem(storageKey, JSON.stringify(updated));
            console.log('💾 ローカルストレージで問題を更新:', updated);
            return { success: true, mode: 'localStorage', data: updated };
        }
        return { success: false, mode: 'localStorage', error: '問題が見つかりません' };
    }

    deleteQuestionFromLocalStorage(questionId) {
        const storageKey = `question_${questionId}`;
        localStorage.removeItem(storageKey);
        console.log('🗑️ ローカルストレージから問題を削除:', questionId);
        return { success: true, mode: 'localStorage' };
    }

    // === ユーティリティ ===

    // 統計情報を取得
    async getStats() {
        if (this.fallbackMode && !(await this.isD1Available())) {
            return this.getStatsFromLocalStorage();
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/stats`, {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();
            return { success: true, stats: result, mode: 'd1' };
        } catch (error) {
            if (this.fallbackMode) {
                return this.getStatsFromLocalStorage();
            }
            throw error;
        }
    }

    getStatsFromLocalStorage() {
        let totalQuestions = 0;
        const subjects = {};
        
        for (let key in localStorage) {
            if (key.includes('_questions_backup')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const subject = data.subject;
                    const count = data.questions?.length || 0;
                    subjects[subject] = count;
                    totalQuestions += count;
                } catch (e) {
                    // 無視
                }
            }
        }

        return {
            success: true,
            stats: { totalQuestions, subjects },
            mode: 'localStorage'
        };
    }

    // トークン設定
    setAdminToken(token) {
        this.adminToken = token;
        localStorage.setItem('admin_token', token);
    }

    // トークン削除
    clearAdminToken() {
        this.adminToken = null;
        localStorage.removeItem('admin_token');
    }
}

// グローバルインスタンス
window.questaD1Manager = new QuestaD1Manager();