/**
 * Question Management System - jsonplan.md統一フォーマット対応
 * 全ての問題形式を管理する統一システム
 */

class QuestionManager {
    constructor() {
        this.API_BASE = '/api/questions';
        this.categories = [];
        this.questions = [];
        this.filters = {
            subject: '',
            type: '',
            difficulty: '',
            tags: [],
            search: ''
        };
        this.sortField = 'created_at';
        this.sortOrder = 'desc';
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.isAdmin = false;
    }

    // jsonplan.md統一フォーマットに基づく問題タイプ定義
    QUESTION_TYPES = {
        'multiple_choice': {
            name: '選択問題',
            icon: '🔘',
            fields: ['question', 'options', 'answer', 'explanation']
        },
        'fill_in_blank': {
            name: '穴埋め問題',
            icon: '📝',
            fields: ['question', 'answer', 'explanation']
        },
        'ordering': {
            name: '並べ替え問題',
            icon: '🔀',
            fields: ['question', 'options', 'answer', 'explanation']
        },
        'short_answer': {
            name: '記述問題',
            icon: '✍️',
            fields: ['question', 'answer', 'explanation']
        },
        'translation': {
            name: '翻訳問題',
            icon: '🌐',
            fields: ['question', 'answer', 'explanation']
        },
        'transcription': {
            name: '書き取り問題',
            icon: '🎧',
            fields: ['question', 'media.audio', 'answer', 'explanation']
        },
        'error_correction': {
            name: '誤り訂正問題',
            icon: '✅',
            fields: ['question', 'answer', 'explanation']
        }
    };

    SUBJECTS = {
        'english_grammar': '英文法',
        'english_vocab': '英単語',
        'english_listening': 'リスニング',
        'english_reading': 'リーディング',
        'english_writing': '英作文',
        'math': '数学',
        'physics': '物理',
        'chemistry': '化学'
    };

    DIFFICULTY_LEVELS = {
        1: { name: '簡単', color: '#4CAF50', description: '教科書レベル' },
        2: { name: '標準', color: '#2196F3', description: '標準レベル' },
        3: { name: 'やや難', color: '#FF9800', description: '計算がしんどい' },
        4: { name: '難問', color: '#F44336', description: '東大難問レベル' },
        5: { name: '超難関', color: '#9C27B0', description: 'IMO第六問レベル' }
    };

    /**
     * jsonplan.md統一フォーマットで問題を作成
     */
    createQuestion(formData) {
        return {
            id: this.generateQuestionId(formData.subject, formData.type),
            subject: formData.subject,
            type: formData.type,
            question: {
                text: formData.question_text,
                translation: formData.question_translation || ''
            },
            options: this.parseOptions(formData.options, formData.type),
            answer: this.formatAnswer(formData.answer, formData.type),
            explanation: {
                pl: formData.explanation_simple || '',
                sp: formData.explanation_detailed || ''
            },
            difficulty: parseInt(formData.difficulty) || 1,
            tags: this.parseTags(formData.tags),
            source: formData.source || '自作',
            created_at: new Date().toISOString().split('T')[0],
            media: {
                audio: formData.media_audio || '',
                image: formData.media_image || '',
                video: formData.media_video || ''
            },
            grammar_point: formData.grammar_point || '',
            validation_status: 'pending'
        };
    }

    /**
     * 問題IDを生成（例: grammar_0001, vocab_0123）
     */
    generateQuestionId(subject, type) {
        const prefix = subject.replace('english_', '').replace('_', '');
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 4);
        return `${prefix}_${timestamp}${random}`;
    }

    /**
     * 選択肢をパース
     */
    parseOptions(optionsString, type) {
        if (!optionsString || type === 'short_answer' || type === 'translation') {
            return [];
        }

        try {
            // 既に配列の場合はそのまま返す
            if (Array.isArray(optionsString)) {
                return optionsString;
            }
            // JSON文字列の場合はパース
            if (optionsString.startsWith('[')) {
                return JSON.parse(optionsString);
            }
            // 改行区切りの場合は配列に変換
            return optionsString.split('\n').filter(opt => opt.trim());
        } catch (e) {
            return [];
        }
    }

    /**
     * 解答をフォーマット
     */
    formatAnswer(answer, type) {
        if (type === 'multiple_choice') {
            return answer.toUpperCase(); // A, B, C, D形式
        } else if (type === 'fill_in_blank' || type === 'short_answer') {
            return answer.trim();
        } else {
            return answer;
        }
    }

    /**
     * タグをパース
     */
    parseTags(tagsString) {
        if (!tagsString) return [];
        if (Array.isArray(tagsString)) return tagsString;
        return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    /**
     * 問題を検証
     */
    validateQuestion(question) {
        const errors = [];

        // 必須フィールドチェック
        if (!question.subject) errors.push('科目は必須です');
        if (!question.type) errors.push('問題タイプは必須です');
        if (!question.question?.text) errors.push('問題文は必須です');
        if (!question.answer) errors.push('解答は必須です');

        // 科目と問題タイプの整合性チェック
        if (question.subject && question.type) {
            const validCombinations = this.getValidSubjectTypeCombinations();
            const combination = `${question.subject}_${question.type}`;
            if (!validCombinations.includes(combination)) {
                errors.push(`${combination}の組み合わせは無効です`);
            }
        }

        // 選択肢のチェック
        if (question.type === 'multiple_choice' && question.options.length < 2) {
            errors.push('選択問題には2つ以上の選択肢が必要です');
        }

        // 難易度のチェック
        if (question.difficulty < 1 || question.difficulty > 5) {
            errors.push('難易度は1-5の範囲で指定してください');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 有効な科目-問題タイプの組み合わせ
     */
    getValidSubjectTypeCombinations() {
        const combinations = [];

        // 英語系
        ['english_grammar', 'english_vocab', 'english_listening', 'english_reading'].forEach(subject => {
            combinations.push(`${subject}_multiple_choice`);
            combinations.push(`${subject}_fill_in_blank`);
            if (subject !== 'english_vocab') {
                combinations.push(`${subject}_short_answer`);
            }
            if (subject === 'english_grammar') {
                combinations.push(`${subject}_error_correction`);
            }
            if (subject === 'english_listening') {
                combinations.push(`${subject}_transcription`);
            }
        });

        // 英作文
        combinations.push('english_writing_short_answer');
        combinations.push('english_writing_translation');

        return combinations;
    }

    /**
     * 問題一覧を取得
     */
    async loadQuestions(filters = {}) {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                sort: this.sortField,
                order: this.sortOrder,
                ...filters
            });

            const response = await fetch(`${this.API_BASE}?${params}`);
            const data = await response.json();

            if (data.success) {
                this.questions = data.questions.map(q => this.normalizeQuestionData(q));
                return {
                    questions: this.questions,
                    total: data.total,
                    page: data.page
                };
            } else {
                throw new Error(data.message || '問題の読み込みに失敗しました');
            }
        } catch (error) {
            console.error('Failed to load questions:', error);
            throw error;
        }
    }

    /**
     * 問題データを統一フォーマットに正規化
     */
    normalizeQuestionData(question) {
        return {
            ...question,
            // 新しい統一フォーマットに変換
            question: {
                text: question.question_text || question.question?.text || '',
                translation: question.question_translation || question.question?.translation || ''
            },
            explanation: {
                pl: question.explanation_simple || question.explanation?.pl || '',
                sp: question.explanation_detailed || question.explanation?.sp || question.explanation || ''
            },
            media: {
                audio: question.media_audio || question.media?.audio || '',
                image: question.media_image || question.media?.image || '',
                video: question.media_video || question.media?.video || ''
            },
            // 後方互換性のために元のフィールドも維持
            question_text: question.question_text || question.question?.text || '',
            explanation_simple: question.explanation_simple || question.explanation?.pl || '',
            explanation_detailed: question.explanation_detailed || question.explanation?.sp || question.explanation || ''
        };
    }

    /**
     * 問題を保存
     */
    async saveQuestion(question) {
        try {
            const method = question.id && question.id.includes('_') ? 'PUT' : 'POST';
            const url = question.id ? `${this.API_BASE}/${question.id}` : this.API_BASE;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(question)
            });

            const data = await response.json();
            if (data.success) {
                return data.question;
            } else {
                throw new Error(data.message || '問題の保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save question:', error);
            throw error;
        }
    }

    /**
     * 問題を削除
     */
    async deleteQuestion(questionId) {
        try {
            const response = await fetch(`${this.API_BASE}/${questionId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || '問題の削除に失敗しました');
            }
            return data;
        } catch (error) {
            console.error('Failed to delete question:', error);
            throw error;
        }
    }

    /**
     * 問題統計を取得
     */
    async getQuestionStatistics(questionId) {
        try {
            const response = await fetch(`${this.API_BASE}/${questionId}/stats`);
            const data = await response.json();
            return data.success ? data.statistics : null;
        } catch (error) {
            console.error('Failed to get question statistics:', error);
            return null;
        }
    }

    /**
     * CSVエクスポート
     */
    async exportToCSV(filters = {}) {
        try {
            const params = new URLSearchParams({
                format: 'csv',
                ...filters
            });

            const response = await fetch(`${this.API_BASE}/export?${params}`);
            if (!response.ok) {
                throw new Error('エクスポートに失敗しました');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `questions_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export questions:', error);
            throw error;
        }
    }

    /**
     * CSVインポート
     */
    async importFromCSV(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.API_BASE}/import`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message || 'インポートに失敗しました');
            }
        } catch (error) {
            console.error('Failed to import questions:', error);
            throw error;
        }
    }
}

// グローバルにエクスポート
window.QuestionManager = QuestionManager;