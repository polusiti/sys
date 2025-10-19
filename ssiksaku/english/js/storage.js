// 学習データストレージモジュール
export class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            USER_PROGRESS: 'english_progress',
            LEARNING_HISTORY: 'english_history',
            WEAK_POINTS: 'english_weak_points',
            USER_SETTINGS: 'english_settings'
        };
    }

    // ユーザー進捗の保存（匿名ユーザー対応）
    saveProgress(category, level, score, totalQuestions, timeSpent) {
        const progress = this.getProgress();
        const key = `${category}_${level}`;

        if (!progress[key]) {
            progress[key] = {
                category,
                level,
                attempts: 0,
                totalScore: 0,
                totalQuestions: 0,
                totalTime: 0,
                bestScore: 0,
                lastStudied: null,
                mastered: false
            };
        }

        const sessionData = progress[key];
        sessionData.attempts++;
        sessionData.totalScore += score;
        sessionData.totalQuestions += totalQuestions;
        sessionData.totalTime += timeSpent;
        sessionData.lastStudied = new Date().toISOString();

        const accuracy = (score / totalQuestions) * 100;
        if (accuracy > (sessionData.bestScore || 0)) {
            sessionData.bestScore = accuracy;
        }

        // 80%以上の正解率を3回達成したらマスター
        if (accuracy >= 80) {
            sessionData.masteredCount = (sessionData.masteredCount || 0) + 1;
            if (sessionData.masteredCount >= 3) {
                sessionData.mastered = true;
            }
        }

        localStorage.setItem(this.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
        return sessionData;
    }

    // 進捗の取得
    getProgress() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('進捗データの読み込みエラー:', error);
            return {};
        }
    }

    // 学習履歴の保存（匿名ユーザー対応）
    saveLearningHistory(session) {
        const history = this.getLearningHistory();
        history.push({
            ...session,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });

        // 最新100件のみ保持
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        localStorage.setItem(this.STORAGE_KEYS.LEARNING_HISTORY, JSON.stringify(history));
    }

    // 学習履歴の取得
    getLearningHistory(limit = 50) {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.LEARNING_HISTORY);
            const history = data ? JSON.parse(data) : [];
            return history.slice(-limit).reverse();
        } catch (error) {
            console.error('学習履歴の読み込みエラー:', error);
            return [];
        }
    }

    // 苦手な問題の記録
    saveWeakPoint(category, level, questionId, isCorrect) {
        if (isCorrect) return;

        const weakPoints = this.getWeakPoints();
        const key = `${category}_${level}_${questionId}`;

        if (!weakPoints[key]) {
            weakPoints[key] = {
                category,
                level,
                questionId,
                incorrectCount: 0,
                lastIncorrect: null,
                mastered: false
            };
        }

        weakPoints[key].incorrectCount++;
        weakPoints[key].lastIncorrect = new Date().toISOString();

        localStorage.setItem(this.STORAGE_KEYS.WEAK_POINTS, JSON.stringify(weakPoints));
    }

    // 苦手な問題の取得
    getWeakPoints() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.WEAK_POINTS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('苦手問題データの読み込みエラー:', error);
            return {};
        }
    }

    // 苦手な問題をマスターとしてマーク
    markWeakPointAsMastered(category, level, questionId) {
        const weakPoints = this.getWeakPoints();
        const key = `${category}_${level}_${questionId}`;

        if (weakPoints[key]) {
            weakPoints[key].mastered = true;
            weakPoints[key].masteredDate = new Date().toISOString();
        }

        localStorage.setItem(this.STORAGE_KEYS.WEAK_POINTS, JSON.stringify(weakPoints));
    }

    // 統計データの取得
    getStatistics() {
        const progress = this.getProgress();
        const history = this.getLearningHistory();
        const weakPoints = this.getWeakPoints();

        const stats = {
            totalSessions: history.length,
            totalStudyTime: history.reduce((sum, session) => sum + (session.timeSpent || 0), 0),
            totalQuestionsAnswered: history.reduce((sum, session) => sum + (session.totalQuestions || 0), 0),
            totalCorrectAnswers: history.reduce((sum, session) => sum + (session.score || 0), 0),
            averageAccuracy: 0,
            masteredCategories: 0,
            weakPointsCount: Object.keys(weakPoints).filter(key => !weakPoints[key].mastered).length,
            studyStreak: this.calculateStudyStreak(history),
            favoriteCategory: this.getFavoriteCategory(history),
            recentActivity: history.slice(0, 7)
        };

        if (stats.totalQuestionsAnswered > 0) {
            stats.averageAccuracy = Math.round((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100);
        }

        // マスターしたカテゴリー数
        Object.values(progress).forEach(item => {
            if (item.mastered) stats.masteredCategories++;
        });

        return stats;
    }

    // 学習継続日数の計算
    calculateStudyStreak(history) {
        if (history.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let currentDate = new Date(today);

        for (let i = 0; i < 30; i++) { // 最大30日までチェック
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasStudied = history.some(session =>
                session.timestamp && session.timestamp.startsWith(dateStr)
            );

            if (hasStudied) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (i > 0) { // 最初の日だけ許容
                break;
            }
        }

        return streak;
    }

    // お気に入りカテゴリーの取得
    getFavoriteCategory(history) {
        const categoryCount = {};

        history.forEach(session => {
            if (session.category) {
                categoryCount[session.category] = (categoryCount[session.category] || 0) + 1;
            }
        });

        let favorite = null;
        let maxCount = 0;

        Object.entries(categoryCount).forEach(([category, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favorite = category;
            }
        });

        return favorite;
    }

    // 復習が必要な問題の取得
    getReviewQuestions() {
        const weakPoints = this.getWeakPoints();
        const reviewQuestions = [];

        Object.entries(weakPoints).forEach(([key, data]) => {
            if (!data.mastered && data.incorrectCount >= 2) {
                reviewQuestions.push({
                    category: data.category,
                    level: data.level,
                    questionId: data.questionId,
                    priority: data.incorrectCount,
                    lastIncorrect: data.lastIncorrect
                });
            }
        });

        // 優先度順にソート
        return reviewQuestions.sort((a, b) => b.priority - a.priority);
    }

    // 設定の保存
    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    }

    // 設定の取得
    getSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
            return data ? JSON.parse(data) : {
                soundEnabled: true,
                autoProgress: true,
                showExplanations: true,
                difficultyLevel: 'auto'
            };
        } catch (error) {
            console.error('設定データの読み込みエラー:', error);
            return {
                soundEnabled: true,
                autoProgress: true,
                showExplanations: true,
                difficultyLevel: 'auto'
            };
        }
    }

    // データのクリア
    clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // データのエクスポート
    exportData() {
        const data = {
            progress: this.getProgress(),
            history: this.getLearningHistory(),
            weakPoints: this.getWeakPoints(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    // データのインポート
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.progress) {
                localStorage.setItem(this.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(data.progress));
            }
            if (data.history) {
                localStorage.setItem(this.STORAGE_KEYS.LEARNING_HISTORY, JSON.stringify(data.history));
            }
            if (data.weakPoints) {
                localStorage.setItem(this.STORAGE_KEYS.WEAK_POINTS, JSON.stringify(data.weakPoints));
            }
            if (data.settings) {
                localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(data.settings));
            }

            return true;
        } catch (error) {
            console.error('データのインポートエラー:', error);
            return false;
        }
    }
}