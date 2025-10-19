// UI管理モジュール
export class UIManager {
    constructor() {
        this.selectedOption = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // カテゴリーカードとレベルボタンのイベントを設定
        this.setupCategoryEvents();
    }

    setupCategoryEvents() {
        // data属性を使ってイベントを設定
        const categoryCards = document.querySelectorAll('.category-card');

        categoryCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (!category) return;

            // カテゴリーカード自体のクリック
            card.addEventListener('click', (e) => {
                // レベルボタンがクリックされた場合は何もしない
                if (!e.target.closest('.level-btn')) {
                    e.stopPropagation();
                    window.englishApp.openCategory(category);
                }
            });

            // レベルボタンのクリック
            const levelBtns = card.querySelectorAll('.level-btn');
            levelBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const level = parseInt(btn.getAttribute('data-level'));
                    if (level) {
                        window.englishApp.openLevel(category, level);
                    }
                });
            });
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    selectOption(button, option) {
        document.querySelectorAll('.option-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        this.selectedOption = option;
    }

    hideAllSections() {
        ['listeningSection', 'vocabularySection', 'grammarSection', 'readingSection'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });
    }

    showSection(sectionId) {
        this.hideAllSections();
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }

    updateProgress(current, total, accuracy) {
        const progress = ((current + 1) / total) * 100;

        // 既存のプログレスバーを更新または作成
        let progressContainer = document.querySelector('.progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';

            const activeSection = document.querySelector('.practice-section:not([style*="display: none"])');
            if (activeSection) {
                const quizContainer = activeSection.querySelector('.quiz-container');
                if (quizContainer) {
                    quizContainer.insertBefore(progressContainer, quizContainer.firstChild);
                }
            }
        }

        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">
                問題 ${current + 1} / ${total} | 正解率: ${accuracy}%
            </div>
        `;
    }

    showVocabularyProgress(totalWords) {
        let progressContainer = document.querySelector('#vocabularySection .progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            const section = document.getElementById('vocabularySection');
            if (section) {
                const grid = section.querySelector('.vocabulary-grid');
                if (grid) {
                    section.insertBefore(progressContainer, grid);
                }
            }
        }

        progressContainer.innerHTML = `
            <div class="progress-text">
                今回の学習単語数: ${totalWords} | クリックして例文を確認
            </div>
        `;
    }

    createVocabularyCard(item) {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.innerHTML = `
            <div class="word-english">${item.word}</div>
            <div class="word-pronunciation">${item.pronunciation}</div>
            <div class="word-japanese">${item.meaning}</div>
            <div class="word-example" style="display: none;">
                <div style="font-style: italic; color: var(--accent-color); font-size: 0.8rem; margin-top: 8px;">
                    例: ${item.example}
                </div>
            </div>
        `;

        // クリックで例文を表示/非表示
        card.addEventListener('click', function() {
            const exampleDiv = this.querySelector('.word-example');
            if (exampleDiv) {
                exampleDiv.style.display = exampleDiv.style.display === 'none' ? 'block' : 'none';
            }
        });

        return card;
    }

    displayQuestion(category, questionData) {
        let section;
        if (category === 'listening') {
            section = document.getElementById('listeningSection');
            if (section) {
                section.querySelector('.question-text').textContent = questionData.question;
                section.querySelector('.question-formula').innerHTML = `🔊 "${questionData.audio}"`;
            }
        } else if (category === 'grammar') {
            section = document.getElementById('grammarSection');
            if (section) {
                section.querySelector('.question-text').textContent = questionData.question;
                section.querySelector('.question-formula').textContent = `"${questionData.sentence}"`;
            }
        } else if (category === 'reading') {
            section = document.getElementById('readingSection');
            if (section) {
                section.querySelector('.question-formula').textContent = `"${questionData.passage}"`;
                const questionTexts = section.querySelectorAll('.question-text');
                if (questionTexts[1]) questionTexts[1].textContent = questionData.question;
            }
        }

        // 選択肢を更新
        if (section) {
            const optionsContainer = section.querySelector('.options-container');
            if (optionsContainer) {
                optionsContainer.innerHTML = '';
                questionData.options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.className = 'option-button';
                    button.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
                    button.onclick = () => this.selectOption(button, String.fromCharCode(65 + index));
                    optionsContainer.appendChild(button);
                });
            }
        }
    }

    showSessionComplete(score, totalAnswered) {
        const accuracy = Math.round((score / totalAnswered) * 100);
        let message = `セッション完了！\n正解率: ${accuracy}% (${score}/${totalAnswered})`;

        if (accuracy >= 80) {
            message += '\n素晴らしい結果です！';
        } else if (accuracy >= 60) {
            message += '\n良い調子です！続けましょう！';
        } else {
            message += '\nもう一度復習しましょう！';
        }

        this.showToast(message, 'success');
    }
}