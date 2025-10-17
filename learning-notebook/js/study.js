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

// パッセージモード用変数（東大リスニング形式）
let isPassageMode = false;
let passageQuestions = [];
let currentQuestionIndex = 0;
let passageAnswers = [];
let audioPlayedCount = 0;

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
        // 東大リスニング形式（listen_todai）の場合はパッセージモード
        if (currentLevel === 'listen_todai') {
            await loadPassageMode(apiSubject);
            return;
        }

        // 通常モード: 問題データをAPIから取得
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
                choices: q.choices || null,
                explanation: q.explanation || null
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
        if (index < choices.length) {
            // 選択肢がある場合は表示
            btn.style.display = 'block';
            btn.innerHTML = choices[index];
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;

            // 数式をレンダリング
            setTimeout(() => renderMath(btn), 50);
        } else {
            // 選択肢がない場合は非表示
            btn.style.display = 'none';
        }
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
    // パッセージモードの場合は専用関数を呼び出し
    if (isPassageMode) {
        selectPassageChoice(index);
        return;
    }

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
    // パッセージモードの場合
    if (isPassageMode && passageQuestions.length > 0 && passageQuestions[0].mediaUrls && passageQuestions[0].mediaUrls.length > 0) {
        speechSynthesis.cancel();

        if (!audioPlayer) {
            audioPlayer = new Audio();
            audioPlayer.onerror = function() {
                console.error('音声ファイルの読み込みエラー');
                alert('音声ファイルの再生に失敗しました');
            };
        }

        audioPlayer.src = passageQuestions[0].mediaUrls[0];
        audioPlayer.play().catch(error => {
            console.error('音声再生エラー:', error);
            alert('音声の再生に失敗しました');
        });
        return;
    }

    // 通常モード
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

// ==================== パッセージモード（東大リスニング形式）====================

// パッセージモードでデータを読み込む
async function loadPassageMode(apiSubject) {
    try {
        // パッセージ一覧を取得
        const response = await fetch(`${API_BASE_URL}/api/note/passages?subject=${apiSubject}&limit=10`);
        const data = await response.json();

        if (!data.success || !data.passages || data.passages.length === 0) {
            document.getElementById("question").textContent = "パッセージが見つかりません";
            return;
        }

        // ランダムにパッセージを選択
        const randomPassage = data.passages[Math.floor(Math.random() * data.passages.length)];

        // 選択したパッセージの全設問を取得
        const questionsResponse = await fetch(`${API_BASE_URL}/api/note/passages?passageId=${randomPassage.passage_id}`);
        const questionsData = await questionsResponse.json();

        if (!questionsData.success || !questionsData.questions || questionsData.questions.length === 0) {
            document.getElementById("question").textContent = "設問データが見つかりません";
            return;
        }

        // パッセージモードを有効化
        isPassageMode = true;
        passageQuestions = questionsData.questions.map(q => ({
            id: q.id,
            question: q.question_text,
            answer: q.correct_answer,
            choices: q.choices || [],
            explanation: q.explanation || '',
            mediaUrls: q.media_urls || []
        }));
        currentQuestionIndex = 0;
        passageAnswers = [];
        audioPlayedCount = 0;

        // タイトル表示
        document.getElementById("subjectTitle").textContent = "英語 - リスニング（東大）";

        // 音声自動再生開始（2回、30秒間隔）
        await playAudioTwice();

    } catch (error) {
        console.error('Failed to load passage:', error);
        document.getElementById("question").textContent = "パッセージの読み込みに失敗しました";
    }
}

// 音声を2回再生（30秒間隔）
async function playAudioTwice() {
    if (!passageQuestions[0] || !passageQuestions[0].mediaUrls || passageQuestions[0].mediaUrls.length === 0) {
        // 音声がない場合はスキップして設問表示
        showPassageQuestion();
        return;
    }

    const mediaUrl = passageQuestions[0].mediaUrls[0];

    // UI更新: 音声再生中表示
    document.getElementById("question").textContent = "音声を再生しています...";
    document.getElementById("choices").classList.add("hidden");
    document.getElementById("result").classList.add("hidden");

    // Audio要素を作成
    if (!audioPlayer) {
        audioPlayer = new Audio();
        audioPlayer.onerror = function() {
            console.error('音声ファイルの読み込みエラー');
            showPassageQuestion();
        };
    }

    audioPlayer.src = mediaUrl;

    // 1回目再生
    audioPlayedCount = 1;
    document.getElementById("question").textContent = "音声を再生しています... (1回目)";

    await new Promise((resolve) => {
        audioPlayer.onended = () => {
            document.getElementById("question").textContent = "30秒後に2回目を再生します...";
            // 30秒待機
            setTimeout(() => {
                resolve();
            }, 30000);
        };
        audioPlayer.play().catch(error => {
            console.error('音声再生エラー:', error);
            resolve();
        });
    });

    // 2回目再生
    audioPlayedCount = 2;
    document.getElementById("question").textContent = "音声を再生しています... (2回目)";
    audioPlayer.currentTime = 0;

    await new Promise((resolve) => {
        audioPlayer.onended = () => {
            resolve();
        };
        audioPlayer.play().catch(error => {
            console.error('音声再生エラー:', error);
            resolve();
        });
    });

    // 音声再生完了後、設問を表示
    showPassageQuestion();
}

// 設問を表示
function showPassageQuestion() {
    if (currentQuestionIndex >= passageQuestions.length) {
        // 全設問終了 → 結果表示
        showPassageResults();
        return;
    }

    const question = passageQuestions[currentQuestionIndex];

    // 問題テキスト表示
    const questionElement = document.getElementById("question");
    questionElement.innerHTML = `問題 ${currentQuestionIndex + 1}/${passageQuestions.length}<br>${question.question}`;
    setTimeout(() => renderMath(questionElement), 50);

    // 選択肢を表示
    const choiceData = {
        choices: question.choices,
        correctIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(question.answer)
    };
    choices = choiceData.choices;
    correctIndex = choiceData.correctIndex;

    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach((btn, index) => {
        if (index < choices.length) {
            btn.style.display = 'block';
            btn.innerHTML = choices[index];
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
            setTimeout(() => renderMath(btn), 50);
        } else {
            btn.style.display = 'none';
        }
    });

    // 音声再生ボタン表示
    const speakArea = document.getElementById("speakBtnArea");
    speakArea.classList.remove("hidden");
    document.getElementById("speakBtn").textContent = "音声をもう一度聞く";

    // ナビゲーションボタン表示
    updatePassageNavigation();

    // 選択肢を表示、結果を非表示
    document.getElementById("choices").classList.remove("hidden");
    document.getElementById("result").classList.add("hidden");
}

// パッセージモードのナビゲーション更新
function updatePassageNavigation() {
    // TODO: 前へ/次へボタンの表示制御（HTMLに追加後）
}

// パッセージモードの選択肢選択
function selectPassageChoice(index) {
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach(btn => btn.disabled = true);

    const isCorrect = index === correctIndex;

    // 答えを記録
    passageAnswers.push({
        questionIndex: currentQuestionIndex,
        selectedIndex: index,
        correctIndex: correctIndex,
        isCorrect: isCorrect
    });

    // 正誤表示
    if (isCorrect) {
        choiceButtons[index].classList.add('correct');
    } else {
        choiceButtons[index].classList.add('wrong');
        choiceButtons[correctIndex].classList.add('correct');
    }

    // 次の設問へ自動遷移（1秒後）
    setTimeout(() => {
        currentQuestionIndex++;
        showPassageQuestion();
    }, 1000);
}

// 全設問の結果を表示
function showPassageResults() {
    const correctAnswers = passageAnswers.filter(a => a.isCorrect).length;
    const totalQuestions = passageAnswers.length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

    let resultsHTML = `<h2>結果</h2>`;
    resultsHTML += `<p class="stat">正解数: <span>${correctAnswers}/${totalQuestions}</span></p>`;
    resultsHTML += `<p class="stat">正解率: <span>${accuracy}%</span></p>`;
    resultsHTML += `<hr>`;

    passageAnswers.forEach((answer, idx) => {
        const question = passageQuestions[answer.questionIndex];
        const resultClass = answer.isCorrect ? 'correct' : 'wrong';

        resultsHTML += `<div class="result-item ${resultClass}">`;
        resultsHTML += `<h3>問題 ${idx + 1}</h3>`;
        resultsHTML += `<p>${question.question}</p>`;
        resultsHTML += `<p>あなたの答え: ${question.choices[answer.selectedIndex]}</p>`;
        if (!answer.isCorrect) {
            resultsHTML += `<p>正解: ${question.choices[answer.correctIndex]}</p>`;
        }
        if (question.explanation) {
            resultsHTML += `<p class="explanation">解説: ${question.explanation}</p>`;
        }
        resultsHTML += `</div>`;
    });

    resultsHTML += `<button class="next-btn" onclick="location.reload()">もう一度</button>`;
    resultsHTML += `<button class="back-btn" onclick="location.href='category-detail.html?category=${currentSubject}'">戻る</button>`;

    document.getElementById("question").innerHTML = resultsHTML;
    document.getElementById("choices").classList.add("hidden");
    document.getElementById("result").classList.add("hidden");
    document.getElementById("speakBtnArea").classList.add("hidden");

    // 学習データを保存
    savePassageProgress(correctAnswers, totalQuestions);
}

// パッセージモードの進捗保存
async function savePassageProgress(correctAnswers, totalQuestions) {
    if (!currentUser) return;

    if (currentUser.isGuest) {
        // ゲストユーザーはローカルストレージ
        const studyDataKey = 'studyData_guest';
        let studyData = JSON.parse(localStorage.getItem(studyDataKey)) || {
            totalQuestions: 0,
            correctAnswers: 0,
            studyDays: 1,
            lastStudyDate: new Date().toISOString(),
            subjectProgress: {}
        };

        studyData.totalQuestions += totalQuestions;
        studyData.correctAnswers += correctAnswers;

        if (!studyData.subjectProgress[currentSubject]) {
            studyData.subjectProgress[currentSubject] = { total: 0, correct: 0 };
        }
        studyData.subjectProgress[currentSubject].total += totalQuestions;
        studyData.subjectProgress[currentSubject].correct += correctAnswers;

        localStorage.setItem(studyDataKey, JSON.stringify(studyData));
        return;
    }

    // 認証済みユーザーはAPI保存
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) return;

    try {
        await fetch(`${API_BASE_URL}/api/note/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                subject: subjectMapping[currentSubject],
                total_questions: totalQuestions,
                correct_answers: correctAnswers
            })
        });
    } catch (error) {
        console.error('Failed to save passage progress:', error);
    }
}
