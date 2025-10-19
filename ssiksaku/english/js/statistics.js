// 統計表示モジュール
import { StorageManager } from './storage.js';

export class StatisticsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.storage = new StorageManager();
    }

    showStatisticsModal() {
        const stats = this.storage.getStatistics();
        const modal = this.createStatisticsModal(stats);
        document.body.appendChild(modal);
        modal.showModal();
    }

    createStatisticsModal(stats) {
        const modal = document.createElement('dialog');
        modal.className = 'statistics-modal';

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">学習統計</h2>
                <button onclick="this.closest('dialog').close()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 8px;">×</button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalSessions}</div>
                    <div class="stat-label">総学習セッション</div>
                </div>

                <div class="stat-card">
                    <div class="stat-value">${this.formatTime(stats.totalStudyTime)}</div>
                    <div class="stat-label">総学習時間</div>
                </div>

                <div class="stat-card">
                    <div class="stat-value">${stats.averageAccuracy}%</div>
                    <div class="stat-label">平均正解率</div>
                </div>

                <div class="stat-card">
                    <div class="stat-value">${stats.studyStreak}</div>
                    <div class="stat-label">連続学習日数</div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 12px; font-size: 1.125rem;">学習進捗</h3>
                ${this.createProgressChart()}
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 12px; font-size: 1.125rem;">最近の学習活動</h3>
                ${this.createRecentActivity(stats.recentActivity)}
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 12px; font-size: 1.125rem;">苦手な問題</h3>
                ${this.createWeakPointsSection()}
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="this.exportData()" class="btn btn-secondary">データをエクスポート</button>
                <button onclick="this.startReviewSession()" class="btn">復習セッションを開始</button>
            </div>
        `;

        // イベントハンドラを設定
        modal.querySelector('button[onclick*="exportData"]').onclick = () => this.exportData();
        modal.querySelector('button[onclick*="startReviewSession"]').onclick = () => {
            modal.close();
            this.startReviewSession();
        };

        return modal;
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    createProgressChart() {
        const progress = this.storage.getProgress();
        const categories = ['listening', 'vocabulary', 'grammar', 'reading'];

        let chartHTML = '<div style="display: grid; gap: 12px;">';

        categories.forEach(category => {
            const categoryProgress = Object.values(progress).filter(p => p.category === category);
            const masteredCount = categoryProgress.filter(p => p.mastered).length;
            const totalCount = categoryProgress.length;
            const percentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

            const categoryName = this.getCategoryDisplayName(category);

            chartHTML += `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 0.875rem;">${categoryName}</span>
                        <span style="font-size: 0.875rem; color: var(--accent-color);">${masteredCount}/${totalCount}</span>
                    </div>
                    <div style="background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--primary-color); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });

        chartHTML += '</div>';
        return chartHTML;
    }

    getCategoryDisplayName(category) {
        const names = {
            'listening': 'Listening',
            'vocabulary': 'Vocabulary',
            'grammar': 'Grammar',
            'reading': 'Reading'
        };
        return names[category] || category;
    }

    createRecentActivity(recentActivity) {
        if (!recentActivity || recentActivity.length === 0) {
            return '<p style="color: var(--accent-color); text-align: center;">最近の学習活動がありません</p>';
        }

        let activityHTML = '<div style="display: grid; gap: 8px;">';

        recentActivity.slice(0, 5).forEach(session => {
            const date = new Date(session.timestamp);
            const timeAgo = this.getTimeAgo(date);
            const accuracy = session.totalQuestions > 0 ? Math.round((session.score / session.totalQuestions) * 100) : 0;

            activityHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px;">
                    <div>
                        <div style="font-weight: 500; font-size: 0.875rem;">${this.getCategoryDisplayName(session.category)} Level ${session.level}</div>
                        <div style="color: var(--accent-color); font-size: 0.75rem;">${timeAgo}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: ${accuracy >= 80 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444'}">${accuracy}%</div>
                        <div style="color: var(--accent-color); font-size: 0.75rem;">${session.score}/${session.totalQuestions}</div>
                    </div>
                </div>
            `;
        });

        activityHTML += '</div>';
        return activityHTML;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}分前`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}時間前`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}日前`;
        }
    }

    createWeakPointsSection() {
        const weakPoints = this.storage.getReviewQuestions();

        if (weakPoints.length === 0) {
            return '<p style="color: var(--accent-color); text-align: center;">苦手な問題はありません</p>';
        }

        let weakPointsHTML = '<div style="display: grid; gap: 8px;">';

        weakPoints.slice(0, 5).forEach(point => {
            weakPointsHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px;">
                    <div>
                        <div style="font-weight: 500; font-size: 0.875rem;">${this.getCategoryDisplayName(point.category)} Level ${point.level}</div>
                        <div style="color: var(--accent-color); font-size: 0.75rem;">${point.priority}回間違い</div>
                    </div>
                    <div style="color: #ef4444; font-size: 0.75rem;">復習が必要</div>
                </div>
            `;
        });

        weakPointsHTML += '</div>';

        if (weakPoints.length > 5) {
            weakPointsHTML += `<p style="color: var(--accent-color); text-align: center; font-size: 0.875rem;">他${weakPoints.length - 5}問の復習が必要です</p>`;
        }

        return weakPointsHTML;
    }

    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `english-learning-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.ui.showToast('学習データをエクスポートしました', 'success');
    }

    startReviewSession() {
        const reviewQuestions = this.storage.getReviewQuestions();

        if (reviewQuestions.length === 0) {
            this.ui.showToast('復習が必要な問題がありません', 'success');
            return;
        }

        // 復習セッションを開始
        this.ui.showToast('復習セッションを開始します', 'success');

        // 最初の復習問題をセット
        const firstQuestion = reviewQuestions[0];
        window.englishApp.learningEngine.currentCategory = firstQuestion.category;
        window.englishApp.learningEngine.currentLevel = firstQuestion.level;
        window.englishApp.learningEngine.openLevel(firstQuestion.category, firstQuestion.level);

        // TODO: 復習モードのフラグを立てて、特別な扱いをする
        window.englishApp.learningEngine.isReviewMode = true;
        window.englishApp.learningEngine.reviewQuestions = reviewQuestions;
    }

    showQuickStats() {
        const stats = this.storage.getStatistics();

        const quickStatsHTML = `
            <div style="display: flex; gap: 16px; padding: 12px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; margin: 16px 0;">
                <div style="text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: bold;">${stats.averageAccuracy}%</div>
                    <div style="font-size: 0.75rem; color: var(--accent-color);">正解率</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: bold;">${stats.studyStreak}</div>
                    <div style="font-size: 0.75rem; color: var(--accent-color);">連続日数</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: bold;">${this.formatTime(stats.totalStudyTime)}</div>
                    <div style="font-size: 0.75rem; color: var(--accent-color);">学習時間</div>
                </div>
            </div>
        `;

        return quickStatsHTML;
    }
}