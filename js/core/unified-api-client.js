/**
 * 統一APIクライアント - 全APIエンドポイントを統一管理
 * 問題管理、認証、データ操作を一元的に処理
 */

class UnifiedAPIClient {
    constructor(options = {}) {
        // APIエンドポイントを統一
        this.apiBaseUrl = options.apiBaseUrl || 'https://api.allfrom0.top';
        this.adminToken = options.adminToken || localStorage.getItem('questa_admin_token') || 'questa-admin-2024';
        this.fallbackMode = options.fallbackMode !== false;

        // 各エンドポイント
        this.endpoints = {
            questions: '/api/questions',
            auth: '/api/auth',
            admin: '/api/admin',
            d1: '/api/d1',
            r2: '/api/r2',
            ratings: '/api/ratings',
            ai: '/api/ai',
            audio: '/api/audio'
        };
    }

    // 認証ヘッダー取得
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`,
            'Accept': 'application/json'
        };
    }

    // APIリクエスト共通処理
    async makeRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.apiBaseUrl}${endpoint}`;
        const config = {
            timeout: 30000,
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error('API Request failed:', error);
            if (this.fallbackMode) {
                return this.handleFallback(error, endpoint, options);
            }
            throw error;
        }
    }

    // フォールバック処理
    async handleFallback(error, endpoint, options) {
        console.warn(`API request failed, attempting fallback for ${endpoint}:`, error);

        // 必要に応じてローカルストレージやキャッシュからデータを返す
        if (endpoint.includes('/questions') && options.method === 'GET') {
            return this.getLocalQuestions();
        }

        throw error;
    }

    // ローカルデータ取得（フォールバック用）
    getLocalQuestions() {
        try {
            const cached = localStorage.getItem('cached_questions');
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.error('Failed to get local questions:', error);
            return [];
        }
    }

    // ==============================
    // 問題管理API
    // ==============================

    // 問題一覧取得
    async getQuestions(params = {}) {
        const query = new URLSearchParams(params);
        return this.makeRequest(`${this.endpoints.questions}?${query}`);
    }

    // 問題作成
    async createQuestion(questionData) {
        return this.makeRequest(this.endpoints.questions, {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    // 問題更新
    async updateQuestion(questionId, questionData) {
        return this.makeRequest(`${this.endpoints.questions}/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify(questionData)
        });
    }

    // 問題削除
    async deleteQuestion(questionId) {
        return this.makeRequest(`${this.endpoints.questions}/${questionId}`, {
            method: 'DELETE'
        });
    }

    // 問題一括インポート
    async importQuestions(importData) {
        return this.makeRequest(`${this.endpoints.questions}/import`, {
            method: 'POST',
            body: JSON.stringify(importData)
        });
    }

    // 問題エクスポート
    async exportQuestions(format = 'json') {
        return this.makeRequest(`${this.endpoints.questions}/export?format=${format}`);
    }

    // ==============================
    // 認証API
    // ==============================

    // パスキーログイン開始
    async beginPasskeyLogin(username) {
        return this.makeRequest(`${this.endpoints.auth}/passkey/login/begin`, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    // パスキーログイン完了
    async completePasskeyLogin(credentialData) {
        return this.makeRequest(`${this.endpoints.auth}/passkey/login/complete`, {
            method: 'POST',
            body: JSON.stringify(credentialData)
        });
    }

    // パスキー登録開始
    async beginPasskeyRegistration(userData) {
        return this.makeRequest(`${this.endpoints.auth}/passkey/register/begin`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // パスキー登録完了
    async completePasskeyRegistration(credentialData) {
        return this.makeRequest(`${this.endpoints.auth}/passkey/register/complete`, {
            method: 'POST',
            body: JSON.stringify(credentialData)
        });
    }

    // ユーザー登録
    async registerUser(userData) {
        return this.makeRequest(`${this.endpoints.auth}/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // ==============================
    // 管理者API
    // ==============================

    // 管理者ダッシュボード取得
    async getAdminDashboard() {
        return this.makeRequest(`${this.endpoints.admin}/mana`);
    }

    // ==============================
    // 評価システムAPI
    // ==============================

    // 評価投稿
    async postRating(ratingData) {
        return this.makeRequest(this.endpoints.ratings, {
            method: 'POST',
            body: JSON.stringify(ratingData)
        });
    }

    // 評価取得
    async getRatings(params = {}) {
        const query = new URLSearchParams(params);
        return this.makeRequest(`${this.endpoints.ratings}?${query}`);
    }

    // ==============================
    // ユーティリティ
    // ==============================

    // APIヘルスチェック
    async healthCheck() {
        return this.makeRequest('/api/health');
    }

    // クラスターントークン設定
    setAdminToken(token) {
        this.adminToken = token;
        localStorage.setItem('questa_admin_token', token);
    }

    // APIエンドポイント更新
    setApiBaseUrl(url) {
        this.apiBaseUrl = url;
    }

    // エラーハンドリング
    handleAPIError(error) {
        if (error.message.includes('401')) {
            console.error('Authentication error - token may be expired');
            // 認証ページへのリダイレクトなどをここに実装
        } else if (error.message.includes('403')) {
            console.error('Authorization error - insufficient permissions');
        } else if (error.message.includes('404')) {
            console.error('API endpoint not found');
        } else if (error.message.includes('500')) {
            console.error('Server error - please try again later');
        }

        return {
            success: false,
            error: error.message,
            type: 'API_ERROR'
        };
    }
}

// グローバルインスタンス作成
const apiClient = new UnifiedAPIClient();

// エクスポート（モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnifiedAPIClient, apiClient };
}

// ブラウザ環境でのグローバル展開
if (typeof window !== 'undefined') {
    window.apiClient = apiClient;
    window.UnifiedAPIClient = UnifiedAPIClient;
}