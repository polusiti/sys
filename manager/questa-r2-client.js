/**
 * R2 Quest Manager - フロントエンド連携ライブラリ
 * questa バケットとの統合API
 */

class QuestaR2Manager {
    constructor(options = {}) {
        this.baseURL = options.baseURL || 'http://localhost:3001/api';
        this.adminToken = options.adminToken || localStorage.getItem('admin_token');
        this.publicURL = options.publicURL || '';
    }

    // 認証ヘッダー取得
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`
        };
    }

    // 問題データをR2に保存
    async saveQuestions(subject, questions) {
        try {
            const response = await fetch(`${this.baseURL}/questions/${subject}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ questions })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ ${subject} 問題を R2 に保存しました:`, result.url);
            return result;
        } catch (error) {
            console.error('問題保存エラー:', error);
            throw error;
        }
    }

    // 問題データをR2から取得
    async loadQuestions(subject) {
        try {
            const response = await fetch(`${this.baseURL}/questions/${subject}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`${subject} の問題データが見つかりません`);
                    return { questions: [], metadata: null };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`📚 ${subject} 問題を R2 から読み込みました`);
            return result;
        } catch (error) {
            console.error('問題取得エラー:', error);
            // フォールバック: 空の配列を返す
            return { questions: [], metadata: null };
        }
    }

    // 音声ファイルをR2にアップロード
    async uploadAudio(file, progressCallback = null) {
        try {
            const formData = new FormData();
            formData.append('audio', file);

            const xhr = new XMLHttpRequest();
            
            return new Promise((resolve, reject) => {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && progressCallback) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        progressCallback(percentComplete);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const result = JSON.parse(xhr.responseText);
                        console.log('🎵 音声ファイルをアップロードしました:', result.url);
                        resolve(result);
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error'));

                xhr.open('POST', `${this.baseURL}/upload/audio`);
                xhr.setRequestHeader('Authorization', `Bearer ${this.adminToken}`);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('音声アップロードエラー:', error);
            throw error;
        }
    }

    // ファイル一覧取得
    async getFiles(type = 'assets') {
        try {
            const response = await fetch(`${this.baseURL}/files/${type}`, {
                headers: { 'Authorization': `Bearer ${this.adminToken}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.files;
        } catch (error) {
            console.error('ファイル一覧取得エラー:', error);
            return [];
        }
    }

    // localStorage からR2への移行ヘルパー
    async migrateFromLocalStorage(subject) {
        const moduleConfigs = {
            english: {
                vocab: 'vocabQuestions',
                grammar: 'grammarQuestions', 
                reading: 'readingQuestions',
                listening: 'listeningQuestions',
                summary: 'summaryQuestions'
            }
        };

        const config = moduleConfigs[subject];
        if (!config) {
            console.warn(`移行設定が見つかりません: ${subject}`);
            return;
        }

        let allQuestions = [];

        for (const [category, storageKey] of Object.entries(config)) {
            const questions = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (questions.length > 0) {
                // カテゴリ情報を追加
                const categorizedQuestions = questions.map(q => ({
                    ...q,
                    category,
                    migratedFrom: 'localStorage'
                }));
                allQuestions = allQuestions.concat(categorizedQuestions);
            }
        }

        if (allQuestions.length > 0) {
            console.log(`🔄 ${subject}: ${allQuestions.length}問を移行中...`);
            await this.saveQuestions(subject, allQuestions);
            
            // 移行完了後はlocalStorageをクリア（オプション）
            const shouldClear = confirm(`${subject}の問題をR2に移行しました。\nローカルストレージをクリアしますか？`);
            if (shouldClear) {
                Object.values(config).forEach(key => localStorage.removeItem(key));
            }
        }
    }

    // 管理者認証設定
    setAdminToken(token) {
        this.adminToken = token;
        localStorage.setItem('admin_token', token);
    }

    // 接続テスト
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            const result = await response.json();
            console.log('🟢 R2サーバー接続OK:', result);
            return true;
        } catch (error) {
            console.error('🔴 R2サーバー接続失敗:', error);
            return false;
        }
    }
}

// グローバルインスタンス
window.questaManager = new QuestaR2Manager();

// 使用例を追加
window.questaManager.examples = {
    // 問題保存例
    saveExample: `
// 問題を保存
await questaManager.saveQuestions('english', [
    {
        id: 'test1',
        question: 'テスト問題',
        answer: '回答',
        category: 'vocab'
    }
]);`,

    // 問題読み込み例  
    loadExample: `
// 問題を読み込み
const data = await questaManager.loadQuestions('english');
console.log(data.questions); // 問題配列
console.log(data.metadata);  // メタデータ`,

    // 音声アップロード例
    uploadExample: `
// 音声ファイルアップロード
const fileInput = document.getElementById('audioFile');
const result = await questaManager.uploadAudio(fileInput.files[0], 
    (progress) => console.log('進捗:', progress + '%')
);
console.log('音声URL:', result.url);`
};

console.log('🚀 Questa R2 Manager 初期化完了');
console.log('使用例: console.log(questaManager.examples);');