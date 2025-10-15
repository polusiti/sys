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

let currentSubject = null;
let currentData = [];
let currentItem = null;
let count = 0;
let speechSynthesis = window.speechSynthesis;
let adapter = null;

// 初期化
async function initializeApp() {
    try {
        adapter = new LearningNotebookAdapter();
        console.log('✅ Learning notebook initialized');
    } catch (error) {
        console.error('❌ Failed to initialize learning notebook:', error);
    }
}

function selectSubject(subject) {
    if (!subject) {
        console.error('Subject not provided');
        return;
    }

    currentSubject = subject;
    count = 0;

    // すべての画面を非表示
    document.getElementById("subjectSelect").classList.add("hidden");
    document.getElementById("englishMenu").classList.add("hidden");

    // 学習画面を表示
    document.getElementById("studyArea").classList.remove("hidden");
    document.getElementById("subjectTitle").textContent = subjectTitles[subject];
    document.getElementById("question").textContent = "読み込み中...";
    document.getElementById("answer").textContent = "";
    document.getElementById("answer").classList.add("hidden");
    document.getElementById("count").textContent = "0";
    document.getElementById("speakBtn").classList.add("hidden");

    // データを読み込んで最初の問題を表示
    loadSubjectData();
}

async function loadSubjectData() {
    if (!adapter) {
        console.error('Adapter not initialized');
        return;
    }

    try {
        document.getElementById("question").textContent = "データを読み込み中...";
        currentData = await adapter.getSubjectData(currentSubject);

        if (currentData && currentData.length > 0) {
            nextQuestion();
        } else {
            document.getElementById("question").textContent = "データがありません";
            document.getElementById("answer").textContent = "後でもう一度お試しください";
            document.getElementById("answer").classList.remove("hidden");
        }
    } catch (error) {
        console.error('Error loading subject data:', error);
        document.getElementById("question").textContent = "読み込みエラー";
        document.getElementById("answer").textContent = "後でもう一度お試しください";
        document.getElementById("answer").classList.remove("hidden");
    }
}

function showEnglishMenu() {
    // すべての画面を非表示
    document.getElementById("subjectSelect").classList.add("hidden");
    document.getElementById("studyArea").classList.add("hidden");

    // 英語メニューを表示
    document.getElementById("englishMenu").classList.remove("hidden");
}

function backToSubjects() {
    // すべての画面を非表示
    document.getElementById("englishMenu").classList.add("hidden");
    document.getElementById("studyArea").classList.add("hidden");

    // 科目選択を表示
    document.getElementById("subjectSelect").classList.remove("hidden");
}

function backToMenu() {
    speechSynthesis.cancel();

    // 学習画面を非表示
    document.getElementById("studyArea").classList.add("hidden");

    // 英語のカテゴリーかチェック
    const isEnglishCategory = ['vocabulary', 'listening', 'grammar', 'reading'].includes(currentSubject);

    if (isEnglishCategory) {
        // 英語メニューに戻る
        document.getElementById("englishMenu").classList.remove("hidden");
        document.getElementById("subjectSelect").classList.add("hidden");
    } else {
        // 科目選択に戻る
        document.getElementById("subjectSelect").classList.remove("hidden");
        document.getElementById("englishMenu").classList.add("hidden");
    }

    currentSubject = null;
    count = 0;
}

function nextQuestion() {
    if (!currentData || currentData.length === 0) {
        loadSubjectData();
        return;
    }

    speechSynthesis.cancel();

    const randomIndex = Math.floor(Math.random() * currentData.length);
    currentItem = currentData[randomIndex];

    document.getElementById("question").textContent = currentItem.question;
    document.getElementById("answer").textContent = currentItem.answer;
    document.getElementById("answer").classList.add("hidden");

    const speakBtn = document.getElementById("speakBtn");
    if (currentItem.isListening && currentItem.word) {
        speakBtn.classList.remove("hidden");
        speakWord(currentItem.word);
    } else {
        speakBtn.classList.add("hidden");
    }

    count++;
    const countElement = document.getElementById("count");
    countElement.textContent = count;
    countElement.classList.remove("bounce");
    setTimeout(() => countElement.classList.add("bounce"), 10);
}

function speakWord(word) {
    if (!word) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    speechSynthesis.speak(utterance);
}

function speakAgain() {
    if (currentItem && currentItem.word && currentItem.isListening) {
        speakWord(currentItem.word);
    }
}

function showAnswer() {
    document.getElementById("answer").classList.remove("hidden");
}

// イベントリスナーを設定
function setupEventListeners() {
    // デリゲーション方式でイベントを処理
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const subject = target.dataset.subject;

        switch (action) {
            case 'show-english-menu':
                showEnglishMenu();
                break;
            case 'select-subject':
                selectSubject(subject);
                break;
            case 'back-to-subjects':
                backToSubjects();
                break;
            case 'back-to-menu':
                backToMenu();
                break;
            case 'speak-again':
                speakAgain();
                break;
            case 'show-answer':
                showAnswer();
                break;
            case 'next-question':
                nextQuestion();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    });
}

// アプリ起動時に初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});