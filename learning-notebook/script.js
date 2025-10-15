// 学習ノート用のデータ変換ユーティリティ
class LearningNotebookAdapter {
    constructor() {
        this.apiClient = new WorkersAPIClient();
        this.cache = new Map();
    }

    // APIデータを学習ノート形式に変換
    adaptVocabularyData(apiQuestions) {
        return apiQuestions.map(q => ({
            question: q.question,
            answer: q.choices[q.correctAnswer] + (q.explanation ? ` (${q.explanation})` : ''),
            word: q.word,
            isListening: true
        }));
    }

    // リスニング用のフォールバックデータ
    getStaticListeningData() {
        return [
            {
                question: "次の単語を聞いて意味を選んでください",
                answer: "book (本)",
                word: "book",
                isListening: true
            },
            {
                question: "次の単語を聞いて意味を選んでください",
                answer: "apple (りんご)",
                word: "apple",
                isListening: true
            },
            {
                question: "次の単語を聞いて意味を選んでください",
                answer: "school (学校)",
                word: "school",
                isListening: true
            }
        ];
    }

    // 文法用のフォールバックデータ
    getStaticGrammarData() {
        return [
            {
                question: "I ___ a student.",
                answer: "am (be動詞の現在形)",
                isListening: false
            },
            {
                question: "She ___ to school every day.",
                answer: "goes (三人称単数現在形)",
                isListening: false
            },
            {
                question: "They ___ playing tennis now.",
                answer: "are (現在進行形)",
                isListening: false
            }
        ];
    }

    // 読解用のフォールバックデータ
    getStaticReadingData() {
        return [
            {
                question: "Tom is a student. He likes English. What does Tom like?",
                answer: "English (英語)",
                isListening: false
            },
            {
                question: "Mary has a cat. The cat is small. Is the cat big?",
                answer: "No, it isn't. (小さい)",
                isListening: false
            }
        ];
    }

    // 数学用のフォールバックデータ
    getStaticMathData() {
        return [
            {
                question: "2 + 3 = ?",
                answer: "5",
                isListening: false
            },
            {
                question: "10 - 4 = ?",
                answer: "6",
                isListening: false
            },
            {
                question: "3 × 4 = ?",
                answer: "12",
                isListening: false
            }
        ];
    }

    // 物理用のフォールバックデータ
    getStaticPhysicsData() {
        return [
            {
                question: "力 = 質量 × ?",
                answer: "加速度",
                isListening: false
            },
            {
                question: "光の三原色ではないものは？",
                answer: "黒 (光の三原色: 赤・緑・青)",
                isListening: false
            }
        ];
    }

    // 化学用のフォールバックデータ
    getStaticChemistryData() {
        return [
            {
                question: "H₂Oの化学名は？",
                answer: "水",
                isListening: false
            },
            {
                question: "CO₂の化学名は？",
                answer: "二酸化炭素",
                isListening: false
            }
        ];
    }

    // 科目データを取得
    async getSubjectData(subject, level = null) {
        const cacheKey = `${subject}_${level || 'all'}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let data = [];

        try {
            switch (subject) {
                case 'vocabulary':
                    const apiQuestions = await this.apiClient.getVocabularyQuestions(level);
                    if (apiQuestions && apiQuestions.length > 0) {
                        data = this.adaptVocabularyData(apiQuestions);
                    } else {
                        // フォールバックデータ
                        data = this.adaptVocabularyData([
                            {
                                id: 'vocab_1',
                                question: 'bookの意味は？',
                                word: 'book',
                                choices: ['本', '机', '椅子', '鉛筆'],
                                correctAnswer: 0,
                                explanation: 'bookは「本」です'
                            },
                            {
                                id: 'vocab_2',
                                question: 'appleの意味は？',
                                word: 'apple',
                                choices: ['りんご', 'みかん', 'ばなな', 'いちご'],
                                correctAnswer: 0,
                                explanation: 'appleは「りんご」です'
                            }
                        ]);
                    }
                    break;

                case 'listening':
                    data = this.getStaticListeningData();
                    break;

                case 'grammar':
                    data = this.getStaticGrammarData();
                    break;

                case 'reading':
                    data = this.getStaticReadingData();
                    break;

                case 'math':
                    data = this.getStaticMathData();
                    break;

                case 'physics':
                    data = this.getStaticPhysicsData();
                    break;

                case 'chemistry':
                    data = this.getStaticChemistryData();
                    break;

                default:
                    console.warn('Unknown subject:', subject);
                    data = [];
            }

            this.cache.set(cacheKey, data);
            return data;

        } catch (error) {
            console.error(`Error fetching data for ${subject}:`, error);

            // エラー時は静的データを返す
            switch (subject) {
                case 'vocabulary':
                    data = this.adaptVocabularyData([
                        {
                            id: 'fallback_vocab',
                            question: 'helloの意味は？',
                            word: 'hello',
                            choices: ['こんにちは', 'さようなら', 'ありがとう', 'すみません'],
                            correctAnswer: 0,
                            explanation: 'helloは「こんにちは」です'
                        }
                    ]);
                    break;
                case 'listening':
                    data = this.getStaticListeningData();
                    break;
                case 'grammar':
                    data = this.getStaticGrammarData();
                    break;
                case 'reading':
                    data = this.getStaticReadingData();
                    break;
                case 'math':
                    data = this.getStaticMathData();
                    break;
                case 'physics':
                    data = this.getStaticPhysicsData();
                    break;
                case 'chemistry':
                    data = this.getStaticChemistryData();
                    break;
                default:
                    data = [{
                        question: "データの読み込みに失敗しました",
                        answer: "後でもう一度お試しください",
                        isListening: false
                    }];
            }

            return data;
        }
    }
}

// ナビゲーション管理
class NavigationManager {
    constructor() {
        this.currentSection = 'home';
        this.currentSubject = null;
        this.init();
    }

    init() {
        // ハッシュ変更を監視
        window.addEventListener('hashchange', () => this.handleHashChange());

        // 初期表示
        this.handleHashChange();

        // リンクイベントを設定
        this.setupLinkEvents();
    }

    setupLinkEvents() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            e.preventDefault();
            const hash = link.getAttribute('href').substring(1);
            this.navigateTo(hash, link.dataset.subject);
        });

        // 戻るボタン
        const backBtn = document.getElementById('backToMenu');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateBack();
            });
        }
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1) || 'home';
        this.showSection(hash);
    }

    navigateTo(section, subject = null) {
        this.currentSubject = subject;
        window.location.hash = section;
    }

    navigateBack() {
        if (this.currentSection === 'study') {
            if (['vocabulary', 'listening', 'grammar', 'reading'].includes(this.currentSubject)) {
                this.navigateTo('english');
            } else {
                this.navigateTo('home');
            }
        } else if (this.currentSection === 'english') {
            this.navigateTo('home');
        }
    }

    showSection(sectionId) {
        // 全セクションを非表示
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // 目的セクションを表示
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            this.currentSection = sectionId;

            // セクション特別処理
            if (sectionId === 'study' && this.currentSubject) {
                this.startStudy(this.currentSubject);
            }

            // ナビゲーション更新
            this.updateNavigation();
        }
    }

    updateNavigation() {
        // ナビゲーションのアクティブ状態を更新
        document.querySelectorAll('.notebook-nav a').forEach(link => {
            link.classList.remove('active');
        });

        if (this.currentSection === 'english') {
            document.querySelector('#english .notebook-nav a:last-child')?.classList.add('active');
        } else if (this.currentSection === 'study') {
            const currentSubjectEl = document.getElementById('currentSubject');
            if (currentSubjectEl && this.currentSubject) {
                currentSubjectEl.textContent = subjectTitles[this.currentSubject] || '学習中';
            }
        }
    }

    startStudy(subject) {
        if (!subject) return;

        // タイトルを設定
        const titleEl = document.getElementById('subjectTitle');
        if (titleEl) {
            titleEl.textContent = subjectTitles[subject] || '学習中';
        }

        // 学習セッションを開始
        if (window.studySession) {
            window.studySession.startSubject(subject);
        }
    }
}

// 学習セッション管理
class StudySession {
    constructor() {
        this.adapter = new LearningNotebookAdapter();
        this.currentSubject = null;
        this.currentData = [];
        this.currentItem = null;
        this.count = 0;
        this.speechSynthesis = window.speechSynthesis;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('showAnswerBtn')?.addEventListener('click', () => this.showAnswer());
        document.getElementById('nextQuestionBtn')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('speakBtn')?.addEventListener('click', () => this.speakAgain());
    }

    async startSubject(subject) {
        if (!subject) return;

        this.currentSubject = subject;
        this.count = 0;

        // 画面を初期化
        document.getElementById('question').textContent = "読み込み中...";
        document.getElementById('answer').textContent = "";
        document.getElementById('answer').classList.add('hidden');
        document.getElementById('count').textContent = "0";
        document.getElementById('speakBtn').classList.add('hidden');

        // データを読み込んで開始
        await this.loadSubjectData();
    }

    async loadSubjectData() {
        if (!this.adapter) {
            console.error('Adapter not initialized');
            return;
        }

        try {
            document.getElementById('question').textContent = "データを読み込み中...";
            this.currentData = await this.adapter.getSubjectData(this.currentSubject);

            if (this.currentData && this.currentData.length > 0) {
                this.nextQuestion();
            } else {
                document.getElementById('question').textContent = "データがありません";
                document.getElementById('answer').textContent = "後でもう一度お試しください";
                document.getElementById('answer').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading subject data:', error);
            document.getElementById('question').textContent = "読み込みエラー";
            document.getElementById('answer').textContent = "後でもう一度お試しください";
            document.getElementById('answer').classList.remove('hidden');
        }
    }

    nextQuestion() {
        if (!this.currentData || this.currentData.length === 0) {
            this.loadSubjectData();
            return;
        }

        this.speechSynthesis.cancel();

        const randomIndex = Math.floor(Math.random() * this.currentData.length);
        this.currentItem = this.currentData[randomIndex];

        document.getElementById('question').textContent = this.currentItem.question;
        document.getElementById('answer').textContent = this.currentItem.answer;
        document.getElementById('answer').classList.add('hidden');

        const speakBtn = document.getElementById('speakBtn');
        if (this.currentItem.isListening && this.currentItem.word) {
            speakBtn.classList.remove('hidden');
            this.speakWord(this.currentItem.word);
        } else {
            speakBtn.classList.add('hidden');
        }

        this.count++;
        const countElement = document.getElementById('count');
        countElement.textContent = this.count;
        countElement.classList.remove('bounce');
        setTimeout(() => countElement.classList.add('bounce'), 10);
    }

    speakWord(word) {
        if (!word) return;

        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        this.speechSynthesis.speak(utterance);
    }

    speakAgain() {
        if (this.currentItem && this.currentItem.word && this.currentItem.isListening) {
            this.speakWord(this.currentItem.word);
        }
    }

    showAnswer() {
        document.getElementById('answer').classList.remove('hidden');
    }
}

// グローバル変数
const subjectTitles = {
    vocabulary: "英語 - 語彙",
    listening: "英語 - リスニング",
    grammar: "英語 - 文法",
    reading: "英語 - 読解",
    math: "数学",
    physics: "物理",
    chemistry: "化学"
};

let navigationManager;
let studySession;

// アプリ起動時に初期化
document.addEventListener('DOMContentLoaded', function() {
    try {
        navigationManager = new NavigationManager();
        studySession = new StudySession();

        // グローバル参照
        window.navigationManager = navigationManager;
        window.studySession = studySession;

        console.log('✅ Learning notebook initialized');
    } catch (error) {
        console.error('❌ Failed to initialize learning notebook:', error);
    }
});