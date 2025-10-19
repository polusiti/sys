// メインアプリケーション
import { UIManager } from './ui.js';
import { LearningEngine } from './learning-engine.js';
import { StatisticsManager } from './statistics.js';

class EnglishApp {
    constructor() {
        this.ui = new UIManager();
        this.learningEngine = new LearningEngine(this.ui);
        this.statistics = new StatisticsManager(this.ui);
        this.init();
    }

    async init() {
        // 学習コンテンツの読み込み
        await this.learningEngine.loadContent();

        // グローバル関数の設定
        this.setupGlobalFunctions();
    }

    setupGlobalFunctions() {
        // グローバルスコープに関数を設定（HTMLのonclick属性用）
        window.englishApp = this;

        // 各種関数をグローバルスコープに設定
        window.openCategory = (category) => this.openCategory(category);
        window.openLevel = (category, level) => this.openLevel(category, level);
        window.selectOption = (button, option) => this.ui.selectOption(button, option);
        window.checkAnswer = () => this.learningEngine.checkAnswer();
        window.skipQuestion = () => this.learningEngine.skipQuestion();
        window.playAudio = () => this.learningEngine.playAudio();
        window.showStatistics = () => this.statistics.showStatisticsModal();
        window.exportData = () => this.statistics.exportData();
    }

    openCategory(category) {
        this.learningEngine.openCategory(category);
    }

    openLevel(category, level) {
        console.log('Opening level:', category, level); // デバッグ用
        this.learningEngine.openLevel(category, level);
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new EnglishApp();
});