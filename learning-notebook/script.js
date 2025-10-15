// 科目データを外部ファイルから読み込む
const subjects = {
    vocabulary: englishVocabularyData,
    listening: englishListeningData,
    grammar: englishGrammarData,
    reading: englishReadingData,
    math: mathData,
    physics: physicsData,
    chemistry: chemistryData
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
    if (!currentData) return;
    
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
