// 学習エンジンモジュール
import { StorageManager } from './storage.js';

export class LearningEngine {
    constructor(uiManager) {
        this.ui = uiManager;
        this.currentCategory = null;
        this.currentLevel = 1;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalAnswered = 0;
        this.content = null;
        this.sessionStartTime = null;
        this.isReviewMode = false;
        this.reviewQuestions = [];
        this.storage = new StorageManager();
    }

    async loadContent() {
        try {
            const response = await fetch('./data/content.json');
            this.content = await response.json();
        } catch (error) {
            console.error('コンテンツの読み込みエラー:', error);
            this.ui.showToast('コンテンツの読み込みに失敗しました', 'error');
        }
    }

    getCategoryName(category) {
        const names = {
            'listening': 'Listening',
            'vocabulary': 'Vocabulary',
            'grammar': 'Grammar',
            'reading': 'Reading'
        };
        return names[category] || category;
    }

    openCategory(category) {
        this.currentCategory = category;
        this.ui.showSection(`${category}Section`);
        this.ui.showToast(`${this.getCategoryName(category)}の学習を開始します`, 'success');
    }

    openLevel(category, level) {
        console.log('LearningEngine openLevel called:', category, level); // デバッグ用
        this.currentCategory = category;
        this.currentLevel = level;
        this.resetSession();
        this.showLevelContent(category, level);
    }

    resetSession() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalAnswered = 0;
        this.ui.selectedOption = null;
        this.sessionStartTime = null;
        this.isReviewMode = false;
        this.reviewQuestions = [];
    }

    startSession() {
        this.sessionStartTime = Date.now();
    }

    endSession() {
        if (!this.sessionStartTime) return;

        const timeSpent = Math.round((Date.now() - this.sessionStartTime) / 1000);

        // 進捗を保存
        this.storage.saveProgress(
            this.currentCategory,
            this.currentLevel,
            this.score,
            this.totalAnswered,
            timeSpent
        );

        // 学習履歴を保存
        this.storage.saveLearningHistory({
            category: this.currentCategory,
            level: this.currentLevel,
            score: this.score,
            totalQuestions: this.totalAnswered,
            timeSpent: timeSpent,
            accuracy: this.totalAnswered > 0 ? Math.round((this.score / this.totalAnswered) * 100) : 0
        });

        // 苦手な問題を記録
        this.saveWeakPoints();

        return timeSpent;
    }

    saveWeakPoints() {
        if (!this.content || !this.content[this.currentCategory] || !this.content[this.currentCategory][this.currentLevel]) {
            return;
        }

        const content = this.content[this.currentCategory][this.currentLevel];

        // ここでは簡単化のため、不正解だった問題IDを記録
        // 実際にはもっと詳細な追跡が必要
        if (this.score < this.totalAnswered) {
            const questionId = content[this.currentQuestionIndex]?.id;
            if (questionId) {
                this.storage.saveWeakPoint(
                    this.currentCategory,
                    this.currentLevel,
                    questionId,
                    false
                );
            }
        }
    }

    showLevelContent(category, level) {
        console.log('showLevelContent called:', category, level); // デバッグ用
        this.ui.showSection(`${category}Section}`);

        if (category === 'vocabulary') {
            console.log('Loading vocabulary content'); // デバッグ用
            this.loadVocabularyContent(category, level);
        } else if (['listening', 'grammar', 'reading'].includes(category)) {
            console.log('Loading quiz content'); // デバッグ用
            this.loadQuizContent(category, level);
        }
    }

    loadVocabularyContent(category, level) {
        if (!this.content || !this.content[category] || !this.content[category][level]) {
            this.ui.showToast('コンテンツがありません', 'error');
            return;
        }

        const content = this.content[category][level];
        const grid = document.querySelector('#vocabularySection .vocabulary-grid');

        if (grid) {
            grid.innerHTML = '';
            content.forEach(item => {
                const card = this.ui.createVocabularyCard(item);
                grid.appendChild(card);
            });
        }

        this.ui.showVocabularyProgress(content.length);
    }

    loadQuizContent(category, level) {
        console.log('loadQuizContent called:', category, level); // デバッグ用
        console.log('Content available:', !!this.content); // デバッグ用

        if (!this.content || !this.content[category] || !this.content[category][level]) {
            console.log('Content missing for:', category, level); // デバッグ用
            this.ui.showToast('コンテンツがありません', 'error');
            return;
        }

        const content = this.content[category][level];
        console.log('Content length:', content ? content.length : 0); // デバッグ用

        if (content && content.length > 0) {
            // セッションを開始
            this.startSession();

            this.displayQuestion(category, content[this.currentQuestionIndex]);
            this.updateProgress();
        } else {
            console.log('No content to display'); // デバッグ用
        }
    }

    displayQuestion(category, questionData) {
        this.ui.displayQuestion(category, questionData);
    }

    updateProgress() {
        if (!this.content || !this.content[this.currentCategory] || !this.content[this.currentCategory][this.currentLevel]) {
            return;
        }

        const content = this.content[this.currentCategory][this.currentLevel];
        const accuracy = this.totalAnswered > 0 ? Math.round((this.score / this.totalAnswered) * 100) : 0;
        this.ui.updateProgress(this.currentQuestionIndex, content.length, accuracy);
    }

    checkAnswer() {
        if (!this.ui.selectedOption) {
            this.ui.showToast('回答を選択してください', 'error');
            return;
        }

        if (!this.currentCategory) {
            this.ui.showToast('カテゴリーを選択してください', 'error');
            return;
        }

        if (!this.content || !this.content[this.currentCategory] || !this.content[this.currentCategory][this.currentLevel]) {
            this.ui.showToast('問題がありません', 'error');
            return;
        }

        const content = this.content[this.currentCategory][this.currentLevel];
        if (content && content.length > 0 && this.currentQuestionIndex < content.length) {
            const currentQuestion = content[this.currentQuestionIndex];
            const isCorrect = this.ui.selectedOption === currentQuestion.correct;

            this.totalAnswered++;

            if (isCorrect) {
                this.score++;
                this.ui.showToast('正解です！', 'success');

                // 文法問題の場合は解説を表示
                if (this.currentCategory === 'grammar' && currentQuestion.explanation) {
                    setTimeout(() => {
                        this.ui.showToast(`解説: ${currentQuestion.explanation}`, 'success');
                    }, 1500);
                }

                setTimeout(() => {
                    this.nextQuestion();
                }, 3000);
            } else {
                const correctAnswerText = currentQuestion.options[currentQuestion.correct.charCodeAt(0) - 65];
                this.ui.showToast(`不正解です。正解は ${currentQuestion.correct}) ${correctAnswerText}`, 'error');

                // 文法問題の場合は解説を表示
                if (this.currentCategory === 'grammar' && currentQuestion.explanation) {
                    setTimeout(() => {
                        this.ui.showToast(`解説: ${currentQuestion.explanation}`, 'error');
                    }, 2000);
                }

                setTimeout(() => {
                    this.nextQuestion();
                }, 4000);
            }
        }
    }

    nextQuestion() {
        this.ui.selectedOption = null;
        const content = this.content[this.currentCategory][this.currentLevel];

        if (content) {
            this.currentQuestionIndex++;

            if (this.currentQuestionIndex < content.length) {
                // 次の問題を表示
                this.displayQuestion(this.currentCategory, content[this.currentQuestionIndex]);
                this.updateProgress();
            } else {
                // セッション完了
                this.showSessionComplete();
            }
        }
    }

    showSessionComplete() {
        // セッションを終了してデータを保存
        this.endSession();

        this.ui.showSessionComplete(this.score, this.totalAnswered);

        // スコアをリセット
        setTimeout(() => {
            this.resetSession();
        }, 3000);
    }

    playAudio() {
        if (!this.content || !this.content[this.currentCategory] || !this.content[this.currentCategory][this.currentLevel]) {
            this.ui.showToast('音声コンテンツがありません', 'error');
            return;
        }

        const content = this.content[this.currentCategory][this.currentLevel];
        if (content && this.currentQuestionIndex < content.length) {
            const currentQuestion = content[this.currentQuestionIndex];
            const textToSpeak = currentQuestion.audio || currentQuestion.sentence || '';

            if ('speechSynthesis' in window) {
                // 既存の音声を停止
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'en-US';
                utterance.rate = 0.9;
                utterance.pitch = 1;

                utterance.onstart = () => {
                    this.ui.showToast('音声を再生中...', 'success');
                };

                utterance.onend = () => {
                    this.ui.showToast('音声再生完了', 'success');
                };

                utterance.onerror = (event) => {
                    this.ui.showToast('音声再生エラー', 'error');
                    console.error('Speech synthesis error:', event);
                };

                window.speechSynthesis.speak(utterance);
            } else {
                // 音声APIがサポートされていない場合の代替
                this.ui.showToast('音声再生: ' + textToSpeak, 'success');
            }
        }
    }

    skipQuestion() {
        this.nextQuestion();
    }
}