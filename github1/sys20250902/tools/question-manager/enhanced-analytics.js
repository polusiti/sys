// Enhanced Statistics and Analytics System
class EnhancedAnalytics {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAnalyticsData();
    }

    setupEventListeners() {
        // ダッシュボードの読み込み時に分析データを更新
        document.addEventListener('DOMContentLoaded', () => {
            if (location.pathname.includes('dashboard')) {
                this.renderAnalyticsDashboard();
            }
        });
    }

    async loadAnalyticsData() {
        try {
            // データベースから統計データを取得
            const db = window.Database;
            if (db) {
                const questions = await db.getAllQuestions();
                const history = await db.getUserHistory();
                const stats = await db.getStatistics();
                
                this.analyticsData = {
                    questions: questions || [],
                    history: history || [],
                    stats: stats || {}
                };
                
                // 分析データを計算
                this.calculateAnalytics();
            }
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        }
    }

    calculateAnalytics() {
        if (!this.analyticsData) return;

        const { questions, history, stats } = this.analyticsData;
        
        // 基本統計
        this.basicStats = {
            totalQuestions: questions.length,
            activeQuestions: questions.filter(q => q.active !== false).length,
            totalSubjects: new Set(questions.map(q => q.subject)).size,
            totalTopics: new Set(questions.map(q => q.topic)).size,
            totalViews: stats.totalViews || 0,
            totalAnswers: history.length
        };

        // 科目別統計
        this.subjectStats = {};
        questions.forEach(question => {
            if (!this.subjectStats[question.subject]) {
                this.subjectStats[question.subject] = {
                    count: 0,
                    topics: new Set(),
                    difficulties: [],
                    formats: new Set()
                };
            }
            this.subjectStats[question.subject].count++;
            this.subjectStats[question.subject].topics.add(question.topic);
            this.subjectStats[question.subject].difficulties.push(question.difficulty || 3);
            this.subjectStats[question.subject].formats.add(question.answerFormat);
        });

        // 平均値を計算
        Object.keys(this.subjectStats).forEach(subject => {
            const stats = this.subjectStats[subject];
            stats.avgDifficulty = stats.difficulties.reduce((a, b) => a + b, 0) / stats.difficulties.length;
            stats.topics = Array.from(stats.topics);
            stats.formats = Array.from(stats.formats);
        });

        // 難易度分布
        this.difficultyDistribution = [0, 0, 0, 0, 0];
        questions.forEach(question => {
            const difficulty = question.difficulty || 3;
            if (difficulty >= 1 && difficulty <= 5) {
                this.difficultyDistribution[difficulty - 1]++;
            }
        });

        // 問題形式分布
        this.formatDistribution = {};
        questions.forEach(question => {
            const format = question.answerFormat;
            this.formatDistribution[format] = (this.formatDistribution[format] || 0) + 1;
        });

        // 作成トレンド（月別）
        this.creationTrend = this.calculateMonthlyTrend(questions);

        // 使用率分析
        this.usageAnalytics = this.calculateUsageAnalytics(history);

        // タグ分析
        this.tagAnalytics = this.calculateTagAnalytics(questions);
    }

    calculateMonthlyTrend(questions) {
        const monthlyData = {};
        const now = new Date();
        
        // 過去12ヶ月分のデータを初期化
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = {
                month: key,
                count: 0,
                monthName: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
            };
        }

        // 月別に集計
        questions.forEach(question => {
            const created = new Date(question.createdAt || question.updatedAt);
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                monthlyData[key].count++;
            }
        });

        return Object.values(monthlyData);
    }

    calculateUsageAnalytics(history) {
        const analytics = {
            dailyUsage: {},
            hourlyUsage: new Array(24).fill(0),
            subjectUsage: {},
            averageScore: 0,
            completionRate: 0
        };

        let totalScore = 0;
        let completedCount = 0;

        history.forEach(entry => {
            // 日別使用率
            const date = new Date(entry.timestamp).toLocaleDateString();
            analytics.dailyUsage[date] = (analytics.dailyUsage[date] || 0) + 1;

            // 時間別使用率
            const hour = new Date(entry.timestamp).getHours();
            analytics.hourlyUsage[hour]++;

            // 科目別使用率
            if (entry.subject) {
                analytics.subjectUsage[entry.subject] = (analytics.subjectUsage[entry.subject] || 0) + 1;
            }

            // スコア集計
            if (entry.score !== undefined) {
                totalScore += entry.score;
                completedCount++;
            }
        });

        analytics.averageScore = completedCount > 0 ? totalScore / completedCount : 0;
        analytics.completionRate = history.length > 0 ? (completedCount / history.length) * 100 : 0;

        return analytics;
    }

    calculateTagAnalytics(questions) {
        const tagCounts = {};
        const tagPairs = {};

        questions.forEach(question => {
            if (question.tags && Array.isArray(question.tags)) {
                // タグの出現回数
                question.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });

                // タグの組み合わせ
                for (let i = 0; i < question.tags.length; i++) {
                    for (let j = i + 1; j < question.tags.length; j++) {
                        const pair = [question.tags[i], question.tags[j]].sort().join(' + ');
                        tagPairs[pair] = (tagPairs[pair] || 0) + 1;
                    }
                }
            }
        });

        return {
            topTags: Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20),
            commonPairs: Object.entries(tagPairs)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        };
    }

    renderAnalyticsDashboard() {
        if (!this.analyticsData) return;

        const container = document.getElementById('analyticsDashboard');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-grid">
                <!-- 基本統計カード -->
                <div class="stats-overview">
                    <h3>基本統計</h3>
                    <div class="stats-cards">
                        <div class="stat-card">
                            <div class="stat-value">${this.basicStats.totalQuestions}</div>
                            <div class="stat-label">総問題数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.basicStats.activeQuestions}</div>
                            <div class="stat-label">有効問題数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.basicStats.totalSubjects}</div>
                            <div class="stat-label">科目数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.basicStats.totalViews}</div>
                            <div class="stat-label">総閲覧数</div>
                        </div>
                    </div>
                </div>

                <!-- 科目別統計 -->
                <div class="subject-analytics">
                    <h3>科目別分析</h3>
                    <div class="subject-chart-container">
                        <canvas id="subjectChart"></canvas>
                    </div>
                    <div class="subject-details">
                        ${Object.entries(this.subjectStats).map(([subject, stats]) => `
                            <div class="subject-item">
                                <div class="subject-name">${subject}</div>
                                <div class="subject-stats">
                                    <span>${stats.count} 問題</span>
                                    <span>平均難易度: ${stats.avgDifficulty.toFixed(1)}</span>
                                    <span>${stats.topics.length} トピック</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 難易度分布 -->
                <div class="difficulty-analytics">
                    <h3>難易度分布</h3>
                    <div class="difficulty-chart">
                        ${this.difficultyDistribution.map((count, i) => `
                            <div class="difficulty-bar">
                                <div class="bar" style="height: ${(count / Math.max(...this.difficultyDistribution)) * 100}%"></div>
                                <div class="label">レベル${i + 1}</div>
                                <div class="count">${count}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 作成トレンド -->
                <div class="trend-analytics">
                    <h3>月別作成トレンド</h3>
                    <div class="trend-chart-container">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>

                <!-- 使用率分析 -->
                <div class="usage-analytics">
                    <h3>使用率分析</h3>
                    <div class="usage-tabs">
                        <button class="tab-btn active" onclick="showUsageTab('daily')">日別</button>
                        <button class="tab-btn" onclick="showUsageTab('hourly')">時間別</button>
                        <button class="tab-btn" onclick="showUsageTab('subject')">科目別</button>
                    </div>
                    <div id="usageChartContainer" class="usage-chart-container">
                        <canvas id="usageChart"></canvas>
                    </div>
                </div>

                <!-- タグ分析 -->
                <div class="tag-analytics">
                    <h3>人気タグ</h3>
                    <div class="tag-cloud">
                        ${this.tagAnalytics.topTags.map(([tag, count]) => `
                            <span class="tag" style="font-size: ${12 + (count / Math.max(...this.tagAnalytics.topTags.map(t => t[1]))) * 20}px">
                                ${tag} (${count})
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- エクスポート機能 -->
                <div class="export-section">
                    <h3>データエクスポート</h3>
                    <div class="export-buttons">
                        <button onclick="exportAnalytics('json')" class="btn-secondary">JSON形式</button>
                        <button onclick="exportAnalytics('csv')" class="btn-secondary">CSV形式</button>
                        <button onclick="exportAnalytics('pdf')" class="btn-secondary">PDFレポート</button>
                    </div>
                </div>
            </div>
        `;

        // チャートの描画
        setTimeout(() => {
            this.renderCharts();
        }, 100);
    }

    renderCharts() {
        // 科目別円グラフ
        this.renderSubjectChart();
        
        // トレンドチャート
        this.renderTrendChart();
        
        // 使用率チャート
        this.renderUsageChart();
    }

    renderSubjectChart() {
        const canvas = document.getElementById('subjectChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = Object.entries(this.subjectStats).map(([subject, stats]) => ({
            label: subject,
            value: stats.count,
            color: this.getSubjectColor(subject)
        }));

        // 簡易的な円グラフ描画（Chart.jsなどを使用するとより綺麗に描画できます）
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        let currentAngle = -Math.PI / 2;
        const total = data.reduce((sum, item) => sum + item.value, 0);

        data.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            // 扇形を描画
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = item.color;
            ctx.fill();
            
            // ラベルを描画
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.creationTrend;
        
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        // 最大値を取得
        const maxValue = Math.max(...data.map(d => d.count));
        
        // グリッド線を描画
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }
        
        // 折れ線グラフを描画
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((item, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - (item.count / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // データ点を描画
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.stroke();
    }

    renderUsageChart() {
        // 時間別使用率をデフォルトで表示
        this.renderHourlyUsageChart();
    }

    renderHourlyUsageChart() {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.usageAnalytics.hourlyUsage;
        
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        const maxValue = Math.max(...data);
        const barWidth = chartWidth / data.length;
        
        // 棒グラフを描画
        data.forEach((value, hour) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + barWidth * hour;
            const y = padding + chartHeight - barHeight;
            
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(x, y, barWidth - 2, barHeight);
            
            // 時間ラベル
            if (hour % 3 === 0) {
                ctx.fillStyle = '#666';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${hour}:00`, x + barWidth / 2, canvas.height - 10);
            }
        });
    }

    getSubjectColor(subject) {
        const colors = {
            'math': '#4f46e5',
            'english': '#7c3aed',
            'physics': '#ec4899',
            'chemistry': '#f59e0b',
            'biology': '#10b981',
            'japanese': '#ef4444',
            'history': '#8b5cf6',
            'geography': '#06b6d4'
        };
        return colors[subject] || '#6b7280';
    }
}

// エクスポート機能
function exportAnalytics(format) {
    const analytics = window.analytics;
    if (!analytics) return;

    switch(format) {
        case 'json':
            exportAsJSON(analytics);
            break;
        case 'csv':
            exportAsCSV(analytics);
            break;
        case 'pdf':
            exportAsPDF(analytics);
            break;
    }
}

function exportAsJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function exportAsCSV(data) {
    let csv = 'Type,Value\n';
    
    // 基本統計
    Object.entries(data.basicStats).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function exportAsPDF(data) {
    // PDF生成には外部ライブラリ（jsPDFなど）が必要
    alert('PDFエクスポート機能は準備中です');
}

// グローバルに公開
window.EnhancedAnalytics = EnhancedAnalytics;