// Workers APIクライアントを使用
const apiClient = new WorkersAPIClient();

// 学習データを保持
const subjects = {
    vocabulary: [],
    listening: [],
    grammar: [],
    reading: [],
    math: [],
    physics: [],
    chemistry: []
};

const subjectTitles = {
    vocabulary: "英語 - 語彙",
    listening: "英語 - リスニング",
    grammar: "英語 - 文法",
    reading: "英語 - 読解",
    math: "数学",
    physics: "物理",
    chemistry: "化学"
};

// データ読み込み関数
async function loadSubjectData(subject) {
    if (subjects[subject].length > 0) {
        return subjects[subject];
    }

    try {
        if (subject === 'vocabulary') {
            const apiQuestions = await apiClient.getVocabularyQuestions();
            if (apiQuestions && apiQuestions.length > 0) {
                subjects[subject] = apiQuestions.map(q => ({
                    question: q.question,
                    answer: q.choices[q.correctAnswer] + (q.explanation ? ` (${q.explanation})` : ''),
                    word: q.word,
                    isListening: true
                }));
            } else {
                // フォールバックデータ
                subjects[subject] = [
                    { question: 'bookの意味は？', answer: '本 (bookは「本」です)', word: 'book', isListening: true },
                    { question: 'appleの意味は？', answer: 'りんご (appleは「りんご」です)', word: 'apple', isListening: true }
                ];
            }
        } else {
            // その他科目のフォールバックデータ
            subjects[subject] = getFallbackData(subject);
        }
    } catch (error) {
        console.error(`Error loading ${subject} data:`, error);
        subjects[subject] = getFallbackData(subject);
    }

    return subjects[subject];
}

function getFallbackData(subject) {
    const fallbackData = {
        listening: [
            { question: "次の単語を聞いて意味を選んでください", answer: "book (本)", word: "book", isListening: true }
        ],
        grammar: [
            { question: "I ___ a student.", answer: "am (be動詞の現在形)", isListening: false }
        ],
        reading: [
            { question: "Tom is a student. What does Tom like?", answer: "English (英語)", isListening: false }
        ],
        math: [
            { question: "2 + 3 = ?", answer: "5", isListening: false }
        ],
        physics: [
            { question: "力 = 質量 × ?", answer: "加速度", isListening: false }
        ],
        chemistry: [
            { question: "H₂Oの化学名は？", answer: "水", isListening: false }
        ]
    };
    return fallbackData[subject] || [{ question: "データがありません", answer: "後でもう一度お試しください", isListening: false }];
}

let currentSubject = null;
let currentData = [];
let currentItem = null;
let count = 0;
let speechSynthesis = window.speechSynthesis;

async function selectSubject(subject) {
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
    document.getElementById("count").textContent = count;
    document.getElementById("speakBtn").classList.add("hidden");

    // データを読み込んで最初の問題を表示
    try {
        currentData = await loadSubjectData(subject);
        nextQuestion();
    } catch (error) {
        console.error('Error loading subject:', error);
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
        loadSubjectData(currentSubject);
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