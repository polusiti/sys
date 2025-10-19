// Statistics management
class StatsManager {
    constructor() {
        this.loadStats();
    }

    loadStats() {
        const saved = localStorage.getItem('learningStats');
        this.stats = saved ? JSON.parse(saved) : {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: [],
            lastStudyDate: null,
            streak: 0,
            categoryStats: {
                english: { total: 0, correct: 0 },
                math: { total: 0, correct: 0 },
                chemistry: { total: 0, correct: 0 },
                physics: { total: 0, correct: 0 }
            }
        };
    }

    saveStats() {
        localStorage.setItem('learningStats', JSON.stringify(this.stats));
    }

    updateStats(category, isCorrect) {
        // 総問題数を更新
        this.stats.totalQuestions++;
        
        // 正答数を更新
        if (isCorrect) {
            this.stats.correctAnswers++;
        }

        // カテゴリー別統計を更新
        if (this.stats.categoryStats[category]) {
            this.stats.categoryStats[category].total++;
            if (isCorrect) {
                this.stats.categoryStats[category].correct++;
            }
        }

        // 学習日を記録
        this.updateStudyDays();
        
        // 連続学習日数を更新
        this.updateStreak();

        this.saveStats();
    }

    updateStudyDays() {
        const today = new Date().toDateString();
        
        if (!this.stats.studyDays.includes(today)) {
            this.stats.studyDays.push(today);
        }
        
        this.stats.lastStudyDate = today;
    }

    updateStreak() {
        const today = new Date();
        const lastDate = this.stats.lastStudyDate ? new Date(this.stats.lastStudyDate) : null;
        
        if (!lastDate) {
            this.stats.streak = 1;
            return;
        }

        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // 同じ日
            return;
        } else if (diffDays === 1) {
            // 連続
            this.stats.streak++;
        } else {
            // 途切れた
            this.stats.streak = 1;
        }
    }

    getAccuracy() {
        if (this.stats.totalQuestions === 0) return 0;
        return Math.round((this.stats.correctAnswers / this.stats.totalQuestions) * 100);
    }

    getCategoryAccuracy(category) {
        const cat = this.stats.categoryStats[category];
        if (!cat || cat.total === 0) return 0;
        return Math.round((cat.correct / cat.total) * 100);
    }

    getWeeklyProgress() {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return this.stats.studyDays.filter(dateStr => {
            const date = new Date(dateStr);
            return date >= weekAgo && date <= today;
        }).length;
    }

    getStats() {
        return {
            studyDays: this.stats.studyDays.length,
            totalQuestions: this.stats.totalQuestions,
            accuracy: this.getAccuracy(),
            streak: this.stats.streak,
            weeklyProgress: this.getWeeklyProgress()
        };
    }

    resetStats() {
        this.stats = {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: [],
            lastStudyDate: null,
            streak: 0,
            categoryStats: {
                english: { total: 0, correct: 0 },
                math: { total: 0, correct: 0 },
                chemistry: { total: 0, correct: 0 },
                physics: { total: 0, correct: 0 }
            }
        };
        this.saveStats();
    }
}

export { StatsManager };
