class WorkersAPIClient {
  constructor() {
    this.baseURL = 'https://api.allfrom0.top/api';
    // 管理者トークンは環境変数から取得するか、別途認証が必要
    // セキュリティのため、ハードコードされたトークンは削除
    this.adminToken = this.getAdminToken();
  }

  getAdminToken() {
    // Node.js環境とブラウザ環境の両方に対応
    if (typeof window !== 'undefined' && window.localStorage) {
      // ブラウザ環境
      const token = localStorage.getItem('questa_admin_token');
      if (!token) {
        console.warn('ブラウザ環境: 管理者トークンが設定されていません');
        return null;
      }
      return token;
    } else if (typeof process !== 'undefined' && process.env) {
      // Node.js環境
      const token = process.env.QUESTA_ADMIN_TOKEN;
      if (!token) {
        console.warn('Node.js環境: QUESTA_ADMIN_TOKEN環境変数が設定されていません');
        return null;
      }
      return token;
    } else {
      // その他の環境
      console.warn('対応していない環境: 管理者トークンを取得できません');
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // 管理者トークンがない場合はリクエストを実行しない
    if (!this.adminToken) {
      throw new Error('管理者トークンが設定されていません。管理者としてログインしてください。');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`,
        ...options.headers
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      console.log(`🌐 API Request: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ API Success:`, result);
      return result;
    } catch (error) {
      console.error('🚨 Workers API Request Failed:', error);
      throw error;
    }
  }

  // 語彙問題専用: R2から語彙問題データを取得
  async getVocabularyQuestions(level = null) {
    try {
      // まずR2から語彙問題を取得を試行
      const endpoint = level ? `/questions/english-vocab?level=${level}` : '/questions/english-vocab';
      const response = await this.request(endpoint);
      
      if (response.questions && response.questions.length > 0) {
        console.log(`📚 Loaded ${response.questions.length} vocabulary questions from R2`);
        return response.questions;
      }
      
      // フォールバック: 静的データ
      return this.getStaticVocabularyQuestions(level);
    } catch (error) {
      console.warn('R2 vocabulary fetch failed, using fallback:', error.message);
      return this.getStaticVocabularyQuestions(level);
    }
  }

  // 語彙問題フォールバック
  async getStaticVocabularyQuestions(level = null) {
    const staticQuestions = {
      lev1: [
        {
          id: 'vocab_lev1_1',
          question: 'bookの意味として最も適切なものを選びなさい',
          word: 'book',
          choices: ['本', '机', '椅子', '鉛筆'],
          correctAnswer: 0,
          explanation: 'bookは「本、書物」という意味です',
          level: 1,
          type: 'vocabulary'
        },
        {
          id: 'vocab_lev1_2', 
          question: 'appleの意味として最も適切なものを選びなさい',
          word: 'apple',
          choices: ['りんご', 'みかん', 'ばなな', 'いちご'],
          correctAnswer: 0,
          explanation: 'appleは「りんご」という意味です',
          level: 1,
          type: 'vocabulary'
        },
        {
          id: 'vocab_lev1_3',
          question: 'schoolの意味として最も適切なものを選びなさい',
          word: 'school',
          choices: ['家', '学校', '病院', '公園'],
          correctAnswer: 1,
          explanation: 'schoolは「学校」という意味です',
          level: 1,
          type: 'vocabulary'
        }
      ],
      lev2: [
        {
          id: 'vocab_lev2_1',
          question: 'importantの意味として最も適切なものを選びなさい',
          word: 'important',
          choices: ['簡単な', '重要な', '美しい', '面白い'],
          correctAnswer: 1,
          explanation: 'importantは「重要な、大切な」という意味です',
          level: 2,
          type: 'vocabulary'
        },
        {
          id: 'vocab_lev2_2',
          question: 'difficultの意味として最も適切なものを選びなさい',
          word: 'difficult',
          choices: ['簡単な', '楽しい', '難しい', '新しい'],
          correctAnswer: 2,
          explanation: 'difficultは「難しい、困難な」という意味です',
          level: 2,
          type: 'vocabulary'
        }
      ]
    };

    if (level) {
      return staticQuestions[level] || [];
    }
    
    // 全レベルの問題を返す
    return Object.values(staticQuestions).flat();
  }

  async getRandomVocabularyQuestion(level = null) {
    try {
      const questions = await this.getVocabularyQuestions(level);
      if (questions.length === 0) {
        throw new Error('No vocabulary questions available');
      }
      
      const randomIndex = Math.floor(Math.random() * questions.length);
      const question = questions[randomIndex];
      
      return {
        id: question.id,
        subject: 'vocabulary',
        data: question
      };
    } catch (error) {
      console.error('Error getting random vocabulary question:', error);
      throw error;
    }
  }

  // 語彙問題統計
  async getVocabularyStats() {
    try {
      const allQuestions = await this.getVocabularyQuestions();
      const levels = {
        lev1: allQuestions.filter(q => q.level === 1).length,
        lev2: allQuestions.filter(q => q.level === 2).length,
        lev3: allQuestions.filter(q => q.level === 3).length,
        lev4: allQuestions.filter(q => q.level === 4).length
      };
      
      return {
        total: allQuestions.length,
        levels,
        available: allQuestions.length > 0
      };
    } catch (error) {
      console.error('Error getting vocabulary stats:', error);
      return { total: 0, levels: {}, available: false, error: error.message };
    }
  }

  // 後方互換性のための既存メソッド
  async getSubjects() {
    try {
      const vocabStats = await this.getVocabularyStats();
      return {
        english: {
          questionCount: vocabStats.total,
          available: vocabStats.available,
          levels: vocabStats.levels
        }
      };
    } catch (error) {
      console.error('Error getting subjects:', error);
      return {
        english: { questionCount: 0, available: false, error: error.message }
      };
    }
  }

  async getRandomQuestion(subject, difficulty = null) {
    if (subject === 'english' || subject === 'vocabulary') {
      // 難易度をレベルに変換
      const levelMap = {
        'easy': 'lev1',
        'medium': 'lev2', 
        'hard': 'lev3',
        'very-hard': 'lev4'
      };
      const level = levelMap[difficulty] || difficulty;
      return this.getRandomVocabularyQuestion(level);
    }
    
    throw new Error(`Subject ${subject} not supported in vocabulary practice`);
  }

  async getQuestionData(subject, questionId) {
    // この実装は語彙問題には適用されないため、エラーを返す
    throw new Error('getQuestionData not implemented for vocabulary practice');
  }

  async getAudioUrl(subject, filename) {
    return `${this.baseURL}/files/${subject}/audio/${encodeURIComponent(filename)}?token=${this.adminToken}`;
  }
}

module.exports = WorkersAPIClient;