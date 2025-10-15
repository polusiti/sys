// 科目データ
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

// URLパラメータから科目とレベルを取得
const urlParams = new URLSearchParams(window.location.search);
const currentSubject = urlParams.get('subject');
const currentLevel = urlParams.get('level');
let currentData = [];
let currentItem = null;
let choices = [];
let correctIndex = 0;
let count = 0;
let correctCount = 0;
let speechSynthesis = window.speechSynthesis;
let hasPlayedAudio = false;

// 前回の学習情報を保存
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (currentUser && currentSubject && currentLevel) {
    const lastStudyKey = currentUser.isGuest ? 'lastStudy_guest' : `lastStudy_${currentUser.username}`;
    localStorage.setItem(lastStudyKey, JSON.stringify({
        subject: currentSubject,
        level: currentLevel,
        timestamp: new Date().toISOString()
    }));
}

// 初期化
if (currentSubject && subjects[currentSubject]) {
    currentData = subjects[currentSubject];
    
    // レベル名を表示に追加
    const levelNames = {
        'vocab_1': '1級',
        'vocab_pre1': '準1級',
        'vocab_2': '2級',
        'vocab_other': '基礎',
        'listen_kyotsu': '共通テスト',
        'listen_todai': '東大',
        'listen_other': '基礎',
        'grammar_4choice': '四択問題',
        'grammar_correct': '誤文訂正',
        'grammar_fill': '空所補充',
        'grammar_arrange': '整序問題',
        'read_1b': '1B',
        'read_5': '5',
        'math_1a': '1A',
        'math_2b': '2B',
        'math_3c': '3C',
        'physics_mechanics': '力学',
        'physics_electric': '電磁気',
        'physics_wave': '波動',
        'physics_thermo': '熱',
        'physics_atomic': '原子',
        'chem_theory': '理論',
        'chem_inorganic': '無機',
        'chem_organic': '有機'
    };
    
    let titleText = subjectTitles[currentSubject];
    if (currentLevel && levelNames[currentLevel]) {
        titleText += ` - ${levelNames[currentLevel]}`;
    }
    document.getElementById("subjectTitle").textContent = titleText;
    
    nextQuestion();
} else {
    document.getElementById("question").textContent = "科目が見つかりません";
}

// 戻るボタンの設定
const isEnglishCategory = ['vocabulary', 'listening', 'grammar', 'reading'].includes(currentSubject);
document.getElementById("backBtn").onclick = function() {
    speechSynthesis.cancel();
    // レベル選択画面に戻る
    location.href = `category-detail.html?category=${currentSubject}`;
};

function generateChoices(correctAnswer) {
    const allAnswers = currentData.map(item => item.answer);
    const wrongAnswers = allAnswers.filter(ans => ans !== correctAnswer);
    
    // ランダムに3つの間違った選択肢を選ぶ
    const shuffled = wrongAnswers.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // 正解を含めて4つの選択肢を作る
    const allChoices = [...selected, correctAnswer];
    
    // シャッフル
    for (let i = allChoices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
    }
    
    return {
        choices: allChoices,
        correctIndex: allChoices.indexOf(correctAnswer)
    };
}

function renderMath(element) {
    if (typeof katex === 'undefined') return;
    
    const text = element.innerHTML;
    
    // $$...$$ 形式の数式を検出してレンダリング（ディスプレイモード）
    let rendered = text.replace(/\$\$([^\$]+)\$\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula, {
                throwOnError: false,
                displayMode: true
            });
        } catch (e) {
            console.error('KaTeX error:', e);
            return match;
        }
    });
    
    // $...$ 形式の数式を検出してレンダリング（インラインモード、displayStyleを使用）
    rendered = rendered.replace(/\$([^\$]+)\$/g, (match, formula) => {
        try {
            return katex.renderToString(formula, {
                throwOnError: false,
                displayMode: false,
                displayStyle: true
            });
        } catch (e) {
            console.error('KaTeX error:', e);
            return match;
        }
    });
    
    element.innerHTML = rendered;
}

function nextQuestion() {
    if (!currentData || currentData.length === 0) return;
    
    speechSynthesis.cancel();
    
    // 結果を非表示、選択肢を表示
    document.getElementById("result").classList.add("hidden");
    document.getElementById("choices").classList.remove("hidden");
    
    // ランダムに問題を選択
    const randomIndex = Math.floor(Math.random() * currentData.length);
    currentItem = currentData[randomIndex];
    
    // 問題を表示
    const questionElement = document.getElementById("question");
    questionElement.innerHTML = currentItem.question;
    
    // 数式をレンダリング
    setTimeout(() => renderMath(questionElement), 50);
    
    // 選択肢を生成
    const choiceData = generateChoices(currentItem.answer);
    choices = choiceData.choices;
    correctIndex = choiceData.correctIndex;
    
    // 選択肢ボタンを更新
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach((btn, index) => {
        btn.innerHTML = choices[index];
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
        
        // 数式をレンダリング
        setTimeout(() => renderMath(btn), 50);
    });
    
    // リスニング問題の場合
    const speakArea = document.getElementById("speakBtnArea");
    const speakBtn = document.getElementById("speakBtn");
    if (currentItem.isListening && currentItem.word) {
        speakArea.classList.remove("hidden");
        hasPlayedAudio = false;
        speakBtn.textContent = "音声を再生";
        // 自動再生はしない（ユーザーがボタンを押したときのみ再生）
    } else {
        speakArea.classList.add("hidden");
    }
}

function selectChoice(index) {
    count++;
    
    const choiceButtons = document.querySelectorAll('.choice-btn');
    
    // すべてのボタンを無効化
    choiceButtons.forEach(btn => btn.disabled = true);
    
    // 正解・不正解を表示
    const isCorrect = index === correctIndex;
    if (isCorrect) {
        choiceButtons[index].classList.add('correct');
        correctCount++;
        document.getElementById("resultText").textContent = "正解！";
        document.getElementById("resultText").style.color = "#27ae60";
        document.getElementById("correctAnswer").innerHTML = "";
    } else {
        choiceButtons[index].classList.add('wrong');
        choiceButtons[correctIndex].classList.add('correct');
        document.getElementById("resultText").textContent = "不正解";
        document.getElementById("resultText").style.color = "#e74c3c";
        const correctAnswerElement = document.getElementById("correctAnswer");
        correctAnswerElement.innerHTML = `正解: ${choices[correctIndex]}`;
        setTimeout(() => renderMath(correctAnswerElement), 50);
    }
    
    // 統計を更新
    document.getElementById("count").textContent = count;
    document.getElementById("correct").textContent = correctCount;
    const accuracy = Math.round((correctCount / count) * 100);
    document.getElementById("accuracy").textContent = accuracy + "%";
    
    // 学習データを保存
    saveStudyProgress(isCorrect);
    
    // 結果を表示、選択肢を非表示
    document.getElementById("choices").classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");
}

// 学習進捗を保存
function saveStudyProgress(isCorrect) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const studyDataKey = currentUser.isGuest ? 'studyData_guest' : `studyData_${currentUser.username}`;
    let studyData = JSON.parse(localStorage.getItem(studyDataKey)) || {
        totalQuestions: 0,
        correctAnswers: 0,
        studyDays: 1,
        lastStudyDate: new Date().toISOString(),
        subjectProgress: {}
    };
    
    // 全体の統計を更新
    studyData.totalQuestions++;
    if (isCorrect) {
        studyData.correctAnswers++;
    }
    
    // 科目別の統計を更新
    if (!studyData.subjectProgress[currentSubject]) {
        studyData.subjectProgress[currentSubject] = { total: 0, correct: 0 };
    }
    studyData.subjectProgress[currentSubject].total++;
    if (isCorrect) {
        studyData.subjectProgress[currentSubject].correct++;
    }
    
    // 学習日数を更新
    const lastDate = new Date(studyData.lastStudyDate);
    const today = new Date();
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 1) {
        studyData.studyDays++;
        studyData.lastStudyDate = today.toISOString();
    }
    
    localStorage.setItem(studyDataKey, JSON.stringify(studyData));
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
        
        // ボタンのテキストを変更
        if (!hasPlayedAudio) {
            hasPlayedAudio = true;
            const speakBtn = document.getElementById("speakBtn");
            speakBtn.textContent = "もう一度聞く";
        }
    }
}
