// API Base URL
const API_BASE_URL = 'https://questa-r2-api.t88596565.workers.dev';

// 科目マッピング
const subjectMapping = {
    vocabulary: 'english-vocabulary',
    listening: 'english-listening',
    grammar: 'english-grammar',
    reading: 'english-reading',
    math: 'math',
    physics: 'physics',
    chemistry: 'chemistry'
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
let sessionId = null; // 学習セッションID
let audioPlayer = null; // R2音声再生用のAudioオブジェクト

// 現在のユーザー情報取得
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// 前回の学習情報を保存
if (currentUser && currentSubject && currentLevel) {
    const lastStudyKey = currentUser.isGuest ? 'lastStudy_guest' : `lastStudy_${currentUser.userId}`;
    localStorage.setItem(lastStudyKey, JSON.stringify({
        subject: currentSubject,
        level: currentLevel,
        timestamp: new Date().toISOString()
    }));
}

// APIから問題データを取得
async function loadQuestions() {
    if (!currentSubject) {
        document.getElementById("question").textContent = "科目が指定されていません";
        return;
    }

    const apiSubject = subjectMapping[currentSubject];
    if (!apiSubject) {
        document.getElementById("question").textContent = "科目が見つかりません";
        return;
    }

    try {
        // 問題データをAPIから取得
        const response = await fetch(`${API_BASE_URL}/api/note/questions?subject=${apiSubject}&limit=100`);
        const data = await response.json();

        if (data.success && data.questions.length > 0) {
            // APIのデータ形式を既存の形式に変換
            currentData = data.questions.map(q => ({
                question: q.question_text,
                answer: q.correct_answer,
                word: q.word,
                isListening: q.is_listening === 1,
                mediaUrls: q.media_urls || null,
                choices: q.choices || null
            }));

            // タイトル表示
            let titleText = subjectTitles[currentSubject];
            document.getElementById("subjectTitle").textContent = titleText;

            // 学習セッション開始（ゲストユーザー以外）
            if (!currentUser.isGuest) {
                await startStudySession();
            }

            nextQuestion();
        } else {
            document.getElementById("question").textContent = "問題データが見つかりません";
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
        document.getElementById("question").textContent = "問題の読み込みに失敗しました";
    }
}

// 学習セッション開始
async function startStudySession() {
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/note/session/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                subject: subjectMapping[currentSubject]
            })
        });

        const data = await response.json();
        if (data.success) {
            sessionId = data.sessionId;
        }
    } catch (error) {
        console.error('Failed to start session:', error);
    }
}

// 初期化
loadQuestions();

// 戻るボタンの設定
const isEnglishCategory = ['vocabulary', 'listening', 'grammar', 'reading'].includes(currentSubject);
document.getElementById("backBtn").onclick = function() {
    speechSynthesis.cancel();
    if (audioPlayer) {
        audioPlayer.pause();
    }
    // レベル選択画面に戻る
    location.href = `category-detail.html?category=${currentSubject}`;
};

function generateChoices(currentItem) {
    // 問題に選択肢が含まれている場合はそれを使用
    if (currentItem.choices && Array.isArray(currentItem.choices) && currentItem.choices.length > 0) {
        // 正解のインデックスを見つける（A, B, C, D, E形式）
        const correctLetter = currentItem.answer;
        const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
        const correctIndex = letterToIndex[correctLetter] !== undefined ? letterToIndex[correctLetter] : 0;

        return {
            choices: currentItem.choices,
            correctIndex: correctIndex
        };
    }

    // 選択肢が含まれていない場合は既存のロジックを使用
    const correctAnswer = currentItem.answer;
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

    // 前の音声を停止
    speechSynthesis.cancel();
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

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

    // 選択肢を生成（問題にchoicesがあればそれを使用、なければ自動生成）
    const choiceData = generateChoices(currentItem);
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
    
    // リスニング問題の場合（R2音声またはTTSが利用可能）
    const speakArea = document.getElementById("speakBtnArea");
    const speakBtn = document.getElementById("speakBtn");
    if (currentItem.isListening && (currentItem.mediaUrls || currentItem.word)) {
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
async function saveStudyProgress(isCorrect) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    // ゲストユーザーの場合はローカルストレージに保存
    if (currentUser.isGuest) {
        const studyDataKey = 'studyData_guest';
        let studyData = JSON.parse(localStorage.getItem(studyDataKey)) || {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: 1,
            lastStudyDate: new Date().toISOString(),
            subjectProgress: {}
        };

        studyData.totalQuestions++;
        if (isCorrect) studyData.correctAnswers++;

        if (!studyData.subjectProgress[currentSubject]) {
            studyData.subjectProgress[currentSubject] = { total: 0, correct: 0 };
        }
        studyData.subjectProgress[currentSubject].total++;
        if (isCorrect) {
            studyData.subjectProgress[currentSubject].correct++;
        }

        const lastDate = new Date(studyData.lastStudyDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 1) {
            studyData.studyDays++;
            studyData.lastStudyDate = today.toISOString();
        }

        localStorage.setItem(studyDataKey, JSON.stringify(studyData));
        return;
    }

    // 認証済みユーザーの場合はAPIに保存
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/note/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                subject: subjectMapping[currentSubject],
                total_questions: 1,
                correct_answers: isCorrect ? 1 : 0
            })
        });

        const data = await response.json();
        if (!data.success) {
            console.error('Failed to save progress:', data.error);
        }
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

// ページ離脱時に学習セッション終了
window.addEventListener('beforeunload', async () => {
    if (sessionId && !currentUser.isGuest) {
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) return;

        const durationMinutes = Math.floor((Date.now() - performance.timing.loadEventEnd) / 60000);

        // sendBeacon を使用して非同期で送信
        const data = JSON.stringify({
            sessionId,
            score: correctCount,
            total_questions: count,
            duration_minutes: durationMinutes
        });

        navigator.sendBeacon(`${API_BASE_URL}/api/note/session/end`, data);
    }
});

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
    if (!currentItem || !currentItem.isListening) return;

    // R2音声ファイルが存在する場合
    if (currentItem.mediaUrls && currentItem.mediaUrls.length > 0) {
        // 既存のTTSをキャンセル
        speechSynthesis.cancel();

        // Audio要素を作成または再利用
        if (!audioPlayer) {
            audioPlayer = new Audio();
            audioPlayer.onerror = function() {
                console.error('音声ファイルの読み込みエラー');
                alert('音声ファイルの再生に失敗しました');
            };
        }

        // R2音声を再生
        audioPlayer.src = currentItem.mediaUrls[0];
        audioPlayer.play().catch(error => {
            console.error('音声再生エラー:', error);
            alert('音声の再生に失敗しました');
        });

        // ボタンのテキストを変更
        if (!hasPlayedAudio) {
            hasPlayedAudio = true;
            const speakBtn = document.getElementById("speakBtn");
            speakBtn.textContent = "もう一度聞く";
        }
    }
    // R2音声がない場合はTTSを使用
    else if (currentItem.word) {
        speakWord(currentItem.word);

        // ボタンのテキストを変更
        if (!hasPlayedAudio) {
            hasPlayedAudio = true;
            const speakBtn = document.getElementById("speakBtn");
            speakBtn.textContent = "もう一度聞く";
        }
    }
}
