/**
 * Questa Hybrid Manager - D1/R2 ハイブリッド連携ライブラリ
 * 問題データ: D1データベース, 音声ファイル: R2ストレージ
 */

class QuestaHybridManager {
    constructor(options = {}) {
        this.d1BaseURL = options.d1BaseURL || 'http://localhost:3001/api/d1';
        this.r2BaseURL = options.r2BaseURL || 'http://localhost:3001/api';
        this.adminToken = options.adminToken || localStorage.getItem('admin_token');
        this.publicURL = options.publicURL || '';
        this.fallbackMode = options.fallbackMode || true; // デフォルトでフォールバックモード有効
    }

    // 認証ヘッダー取得
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`
        };
    }

    // D1/R2サーバーが利用可能かチェック
    async isServerAvailable() {
        try {
            const d1Check = fetch(`${this.d1BaseURL}/health`, {
                method: 'GET',
                timeout: 2000
            });
            const r2Check = fetch(`${this.r2BaseURL.replace('/api', '')}/health`, {
                method: 'GET',
                timeout: 2000
            });
            
            const [d1Response, r2Response] = await Promise.all([d1Check, r2Check]);
            const d1Available = d1Response.ok;
            const r2Available = r2Response.ok;
            
            console.log(`サーバー状態 - D1: ${d1Available ? '✅' : '❌'}, R2: ${r2Available ? '✅' : '❌'}`);
            return { d1: d1Available, r2: r2Available };
        } catch (error) {
            console.warn('サーバーチェックエラー。ローカルストレージモードで動作します。');
            return { d1: false, r2: false };
        }
    }

    // 問題データをD1に保存（フォールバック付き）
    async saveQuestions(subject, questions) {
        const serverStatus = await this.isServerAvailable();
        
        if (this.fallbackMode && !serverStatus.d1) {
            // フォールバック: ローカルストレージに保存
            const storageKey = `${subject}Questions_backup`;
            const data = {
                questions,
                savedAt: new Date().toISOString(),
                mode: 'localStorage_fallback'
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log(`💾 ${subject} 問題をローカルストレージに保存しました (D1サーバー不可)`, data);
            return { success: true, mode: 'localStorage', key: storageKey };
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/questions/batch`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ subject, questions })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ ${subject} 問題を D1 に保存しました:`, result);
            return result;
        } catch (error) {
            console.error('問題保存エラー:', error);
            
            if (this.fallbackMode) {
                // フォールバック: ローカルストレージに保存
                const storageKey = `${subject}Questions_backup`;
                const data = {
                    questions,
                    savedAt: new Date().toISOString(),
                    mode: 'localStorage_fallback',
                    error: error.message
                };
                localStorage.setItem(storageKey, JSON.stringify(data));
                console.log(`💾 フォールバック: ${subject} 問題をローカルストレージに保存しました`);
                return { success: true, mode: 'localStorage_fallback', key: storageKey };
            }
            
            throw error;
        }
    }

    // 問題データをD1から取得（フォールバック付き）
    async loadQuestions(subject) {
        const serverStatus = await this.isServerAvailable();
        
        if (this.fallbackMode && !serverStatus.d1) {
            // フォールバック: ローカルストレージから取得
            const storageKey = `${subject}Questions_backup`;
            const data = localStorage.getItem(storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`💾 ${subject} 問題をローカルストレージから読み込みました`);
                return { questions: parsed.questions || [], metadata: parsed };
            }
            return { questions: [], metadata: null };
        }

        try {
            const response = await fetch(`${this.d1BaseURL}/questions?subject=${subject}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`${subject} の問題データが見つかりません`);
                    return { questions: [], metadata: null };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`📚 ${subject} 問題を D1 から読み込みました`);
            return result;
        } catch (error) {
            console.error('問題取得エラー:', error);
            
            if (this.fallbackMode) {
                // フォールバック: ローカルストレージから取得
                const storageKey = `${subject}Questions_backup`;
                const data = localStorage.getItem(storageKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    console.log(`💾 フォールバック: ${subject} 問題をローカルストレージから読み込みました`);
                    return { questions: parsed.questions || [], metadata: parsed };
                }
            }
            
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
            console.warn('🟡 R2サーバー接続失敗（フォールバックモード有効）:', error.message);
            return false;
        }
    }

    // フォールバックモードの状態を表示
    getStatus() {
        const status = {
            fallbackMode: this.fallbackMode,
            baseURL: this.baseURL,
            hasAdminToken: !!this.adminToken,
            backupKeys: Object.keys(localStorage).filter(key => key.includes('Questions_backup'))
        };
        console.log('📊 Questa R2 Manager Status:', status);
        return status;
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

// グローバルインスタンス（下位互換性のため）
window.questaManager = new QuestaHybridManager();
window.questaR2Manager = window.questaManager; // 旧名前でもアクセス可能
window.questaHybridManager = window.questaManager; // 新しい名前でもアクセス可能

console.log('🚀 Questa Hybrid Manager 初期化完了（D1/R2ハイブリッドモード、フォールバック有効）');
console.log('使用例: console.log(questaManager.examples);');
console.log('ステータス確認: questaManager.getStatus();');