// 静的データ（元のローカル実装と同様）
const subjects = {
    vocabulary: [
        { question: 'bookの意味は？', answer: '本 (bookは「本」です)', word: 'book', isListening: true },
        { question: 'appleの意味は？', answer: 'りんご (appleは「りんご」です)', word: 'apple', isListening: true },
        { question: 'schoolの意味は？', answer: '学校 (schoolは「学校」です)', word: 'school', isListening: true },
        { question: 'helloの意味は？', answer: 'こんにちは (helloは「こんにちは」です)', word: 'hello', isListening: true },
        { question: 'thank youの意味は？', answer: 'ありがとう (thank youは「ありがとう」です)', word: 'thank you', isListening: true }
    ],
    listening: [
        { question: "次の単語を聞いて意味を選んでください", answer: "book (本)", word: "book", isListening: true },
        { question: "次の単語を聞いて意味を選んでください", answer: "apple (りんご)", word: "apple", isListening: true },
        { question: "次の単語を聞いて意味を選んでください", answer: "school (学校)", word: "school", isListening: true }
    ],
    grammar: [
        { question: "I ___ a student.", answer: "am (be動詞の現在形)", isListening: false },
        { question: "She ___ to school every day.", answer: "goes (三人称単数現在形)", isListening: false },
        { question: "They ___ playing tennis now.", answer: "are (現在進行形)", isListening: false },
        { question: "I ___ English yesterday.", answer: "studied (過去形)", isListening: false },
        { question: "We will ___ tomorrow.", answer: "go (未来形)", isListening: false }
    ],
    reading: [
        { question: "Tom is a student. He likes English. What does Tom like?", answer: "English (英語)", isListening: false },
        { question: "Mary has a cat. The cat is small. Is the cat big?", answer: "No, it isn't. (小さい)", isListening: false },
        { question: "Today is Monday. Tomorrow is Tuesday. What day is today?", answer: "Monday (月曜日)", isListening: false }
    ],
    math: [
        { question: "2 + 3 = ?", answer: "5", isListening: false },
        { question: "10 - 4 = ?", answer: "6", isListening: false },
        { question: "3 × 4 = ?", answer: "12", isListening: false },
        { question: "15 ÷ 3 = ?", answer: "5", isListening: false },
        { question: "7 + 8 = ?", answer: "15", isListening: false }
    ],
    physics: [
        { question: "力 = 質量 × ?", answer: "加速度", isListening: false },
        { question: "光の三原色ではないものは？", answer: "黒 (光の三原色: 赤・緑・青)", isListening: false },
        { question: "1気圧は何ヘクトパスカル？", answer: "1013 hPa", isListening: false },
        { question: "音速は約時速何km？", answer: "約1236 km", isListening: false }
    ],
    chemistry: [
        { question: "H₂Oの化学名は？", answer: "水", isListening: false },
        { question: "CO₂の化学名は？", answer: "二酸化炭素", isListening: false },
        { question: "NaClの化学名は？", answer: "塩化ナトリウム（食塩）", isListening: false },
        { question: "CH₄の化学名は？", answer: "メタン", isListening: false }
    ]
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

let currentSubject = null;
let currentData = [];
let currentItem = null;
let count = 0;
let speechSynthesis = window.speechSynthesis;

function selectSubject(subject) {
    if (!subjects[subject]) {
        console.error('Subject not found:', subject);
        return;
    }

    currentSubject = subject;
    currentData = subjects[subject];
    count = 0;

    // すべての画面を非表示
    document.getElementById("subjectSelect").classList.add("hidden");
    document.getElementById("englishMenu").classList.add("hidden");

    // 学習画面を表示
    document.getElementById("studyArea").classList.remove("hidden");
    document.getElementById("subjectTitle").textContent = subjectTitles[subject];
    document.getElementById("question").textContent = "次の問題を押してスタート";
    document.getElementById("answer").textContent = "";
    document.getElementById("answer").classList.add("hidden");
    document.getElementById("count").textContent = count;
    document.getElementById("speakBtn").classList.add("hidden");
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
    if (!currentData || currentData.length === 0) return;

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

// URLパラメータから科目を取得
function getSubjectFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('subject');
}

// 現在のページに応じて初期化
document.addEventListener('DOMContentLoaded', function() {
    const subject = getSubjectFromUrl();

    if (subject) {
        // 学習ページの場合
        selectSubject(subject);
    }

    // 戻るボタンの設定
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        const isEnglishCategory = ['vocabulary', 'listening', 'grammar', 'reading'].includes(subject);

        backBtn.addEventListener('click', function() {
            if (isEnglishCategory) {
                window.location.href = 'english-menu.html';
            } else {
                window.location.href = '../index.html';
            }
        });
    }

    // ボタンイベントリスナー
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const speakBtn = document.getElementById('speakBtn');

    if (showAnswerBtn) {
        showAnswerBtn.addEventListener('click', showAnswer);
    }

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', nextQuestion);
    }

    if (speakBtn) {
        speakBtn.addEventListener('click', speakAgain);
    }
});

console.log('Learning notebook loaded - multi-file version');