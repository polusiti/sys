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
let passageTitle = ''; // パッセージタイトル
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

        // 音声が再生中の場合は停止
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            return;
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

        // 音声が再生中の場合は停止
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            return;
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
        passageTitle = randomPassage.title || 'リスニング問題'; // パッセージタイトルを保存
        passageQuestions = questionsData.questions.map(q => ({
            id: q.id,
            question: q.question_text,
            answer: q.correct_answer,
            choices: q.choices || [],
            explanation: q.explanation || '',
            mediaUrls: q.media_urls || [],
            passageScript: q.passage_script || null,
            passageExplanation: q.passage_explanation || null
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

// 音声を準備（自動再生しない）
async function playAudioTwice() {
    if (!passageQuestions[0] || !passageQuestions[0].mediaUrls || passageQuestions[0].mediaUrls.length === 0) {
        // 音声がない場合はスキップして設問表示
        showPassageQuestion();
        return;
    }

    const mediaUrl = passageQuestions[0].mediaUrls[0];

    // Audio要素を作成（再生はしない）
    if (!audioPlayer) {
        audioPlayer = new Audio();
        audioPlayer.onerror = function() {
            console.error('音声ファイルの読み込みエラー');
        };
    }

    audioPlayer.src = mediaUrl;

    // 問題を表示（音声は再生ボタンを押したときのみ）
    showPassageQuestion();
}

// パッセージ問題を1問ずつ表示（ナビゲーション付き）
function showPassageQuestion() {
    const currentQuestion = passageQuestions[currentQuestionIndex];
    const questionElement = document.getElementById("question");

    // タイトルから「である。」を削除（重複を防ぐ）
    const cleanTitle = passageTitle.replace(/である。?$/, '');

    let displayHTML = `<div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.5); border-radius: 8px; text-align: center;">`;
    displayHTML += `<strong style="font-size: 18px; line-height: 1.6;">これから放送するのは、${cleanTitle}である。</strong>`;
    displayHTML += `</div>`;

    // 音声再生ボタン（上部に配置）
    displayHTML += `<div style="margin-bottom: 20px; text-align: center;">`;
    displayHTML += `<button class="next-btn" style="max-width: 300px; min-height: 50px; font-size: 17px;" onclick="speakAgain()">▶ 音声を再生</button>`;
    displayHTML += `</div>`;

    // 問題番号表示
    displayHTML += `<div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px;">`;
    displayHTML += `<div style="font-weight: 600; margin-bottom: 15px; font-size: 17px; color: #333;">問題 ${currentQuestionIndex + 1} / ${passageQuestions.length}</div>`;
    displayHTML += `<div style="margin-bottom: 15px; font-size: 16px; line-height: 1.8;">${currentQuestion.question}</div>`;
    displayHTML += `</div>`;

    questionElement.innerHTML = displayHTML;
    setTimeout(() => renderMath(questionElement), 50);

    // 選択肢を表示
    const choicesElement = document.getElementById("choices");
    choicesElement.classList.remove("hidden");
    const choiceLabels = ['a', 'b', 'c', 'd', 'e'];
    let choicesHTML = '';

    currentQuestion.choices.forEach((choice, cIndex) => {
        const isSelected = passageAnswers[currentQuestionIndex] === cIndex;
        const selectedStyle = isSelected ? 'background: #e3f2fd; border: 2px solid #2196f3;' : 'background: var(--card-bg); border: 2px solid var(--card-border);';
        const cleanChoice = choice.replace(/^[a-e]\)\s*/, '');
        choicesHTML += `<button class="choice-btn" style="padding: 14px 16px; text-align: left; border-radius: 8px; font-size: 16px; line-height: 1.6; ${selectedStyle}" onclick="selectPassageChoice(${cIndex})">
            ${choiceLabels[cIndex]}) ${cleanChoice}
        </button>`;
    });

    choicesElement.innerHTML = choicesHTML;

    // ナビゲーションボタンを表示
    updatePassageNavigation();

    // 元の音声再生ボタンエリアは非表示に
    const speakArea = document.getElementById("speakBtnArea");
    speakArea.classList.add("hidden");
}

// ナビゲーション更新
function updatePassageNavigation() {
    const resultElement = document.getElementById("result");
    resultElement.classList.remove("hidden");

    let navHTML = '<div style="display: flex; gap: 15px; margin-top: 20px; justify-content: center;">';

    // 前へボタン
    if (currentQuestionIndex > 0) {
        navHTML += '<button class="next-btn" style="flex: 1; max-width: 200px; min-height: 50px; font-size: 17px;" onclick="previousPassageQuestion()">← 前へ</button>';
    } else {
        navHTML += '<button class="next-btn" style="flex: 1; max-width: 200px; min-height: 50px; font-size: 17px; opacity: 0.5;" disabled>← 前へ</button>';
    }

    // 次へボタンまたは採点ボタン
    if (currentQuestionIndex < passageQuestions.length - 1) {
        navHTML += '<button class="next-btn" style="flex: 1; max-width: 200px; min-height: 50px; font-size: 17px;" onclick="nextPassageQuestion()">次へ →</button>';
    } else {
        navHTML += '<button class="next-btn" style="flex: 1; max-width: 200px; min-height: 50px; font-size: 17px;" onclick="showPassageResults()">✓ 採点する</button>';
    }

    navHTML += '</div>';
    resultElement.innerHTML = navHTML;
}

// 前の問題へ
function previousPassageQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showPassageQuestion();
    }
}

// 次の問題へ
function nextPassageQuestion() {
    if (currentQuestionIndex < passageQuestions.length - 1) {
        currentQuestionIndex++;
        showPassageQuestion();
    }
}

// パッセージモードの選択肢選択
function selectPassageChoice(cIndex) {
    // 答えを記録
    passageAnswers[currentQuestionIndex] = cIndex;

    // 選択状態を視覚的に表示
    const choiceButtons = document.querySelectorAll('.choice-btn');
    const choiceLabels = ['a', 'b', 'c', 'd', 'e'];
    choiceButtons.forEach((btn, btnIndex) => {
        const cleanChoice = passageQuestions[currentQuestionIndex].choices[btnIndex].replace(/^[a-e]\)\s*/, '');
        if (btnIndex === cIndex) {
            btn.style.cssText = 'padding: 14px 16px; text-align: left; border-radius: 8px; font-size: 16px; line-height: 1.6; background: #e3f2fd; border: 2px solid #2196f3;';
        } else {
            btn.style.cssText = 'padding: 14px 16px; text-align: left; border-radius: 8px; font-size: 16px; line-height: 1.6; background: var(--card-bg); border: 2px solid var(--card-border);';
        }
    });
}

// 全設問の結果を表示
async function showPassageResults() {
    // 音声を停止
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    // 採点
    let correctAnswers = 0;
    const results = [];

    passageQuestions.forEach((question, qIndex) => {
        const userAnswer = passageAnswers[qIndex];
        const correctIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(question.answer);
        const isCorrect = userAnswer === correctIndex;

        if (isCorrect) correctAnswers++;

        results.push({
            questionIndex: qIndex,
            question: question,
            userAnswer: userAnswer,
            correctIndex: correctIndex,
            isCorrect: isCorrect
        });
    });

    const totalQuestions = passageQuestions.length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

    // 各問題の統計データを取得
    const questionStats = await fetchQuestionStats(passageQuestions);

    let resultsHTML = `<h2>結果</h2>`;
    resultsHTML += `<p class="stat">正解数: <span>${correctAnswers}/${totalQuestions}</span></p>`;
    resultsHTML += `<p class="stat">正解率: <span>${accuracy}%</span></p>`;
    resultsHTML += `<hr>`;

    // スクリプト表示（最初の問題にパッセージ全体の情報が含まれている）
    if (passageQuestions.length > 0 && passageQuestions[0].passageScript) {
        resultsHTML += `<div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4f46e5;">`;
        resultsHTML += `<h3 style="margin-bottom: 15px; color: #4f46e5; font-size: 17px;">■ スクリプト（音声全文）</h3>`;
        resultsHTML += `<div style="white-space: pre-wrap; line-height: 1.8; font-size: 16px;">${passageQuestions[0].passageScript}</div>`;
        resultsHTML += `</div>`;
    }

    // パッセージ全体の解説
    if (passageQuestions.length > 0 && passageQuestions[0].passageExplanation) {
        resultsHTML += `<div style="margin: 20px 0; padding: 20px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">`;
        resultsHTML += `<h3 style="margin-bottom: 15px; color: #ff9800; font-size: 17px;">◆ 全体解説</h3>`;
        resultsHTML += `<div style="line-height: 1.8; font-size: 16px;">${passageQuestions[0].passageExplanation}</div>`;
        resultsHTML += `</div>`;
    }

    // 各問題の結果
    results.forEach((result, idx) => {
        const resultClass = result.isCorrect ? 'correct' : 'wrong';
        const answerLetters = ['a', 'b', 'c', 'd', 'e'];
        const borderColor = result.isCorrect ? '#4caf50' : '#f44336';
        const bgColor = result.isCorrect ? '#e8f5e9' : '#ffebee';

        resultsHTML += `<div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border-radius: 8px; border-left: 4px solid ${borderColor};">`;
        resultsHTML += `<h3 style="margin-bottom: 15px; font-size: 17px; font-weight: 600;">問題 ${idx + 1}</h3>`;

        // 正答率と選択肢分布表示
        const stats = questionStats[result.question.id];
        if (stats && stats.total_attempts > 0) {
            const correctRate = Math.round((stats.correct_count / stats.total_attempts) * 100);
            resultsHTML += `<div style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 6px; font-size: 14px;">`;
            resultsHTML += `<div style="margin-bottom: 10px;"><span style="color: #666;">みんなの正答率: <strong style="color: #333;">${correctRate}%</strong> (${stats.total_attempts}人が挑戦)</span></div>`;

            // 選択肢ごとの分布を表示
            if (stats.choice_distribution && Object.keys(stats.choice_distribution).length > 0) {
                resultsHTML += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">`;
                resultsHTML += `<div style="font-size: 13px; color: #666; margin-bottom: 6px;">選択肢別の回答分布:</div>`;

                const choiceLabels = ['a', 'b', 'c', 'd', 'e'];
                result.question.choices.forEach((choice, cIdx) => {
                    const count = stats.choice_distribution[cIdx] || 0;
                    const percentage = stats.total_attempts > 0 ? Math.round((count / stats.total_attempts) * 100) : 0;
                    const isCorrectChoice = cIdx === result.correctIndex;
                    const barColor = isCorrectChoice ? '#4caf50' : '#2196f3';
                    const labelStyle = isCorrectChoice ? 'font-weight: 600; color: #4caf50;' : '';

                    resultsHTML += `<div style="margin-bottom: 4px;">`;
                    resultsHTML += `<div style="display: flex; align-items: center; font-size: 13px;">`;
                    resultsHTML += `<span style="width: 30px; ${labelStyle}">${choiceLabels[cIdx]})</span>`;
                    resultsHTML += `<div style="flex: 1; height: 18px; background: #e0e0e0; border-radius: 3px; margin: 0 8px; overflow: hidden;">`;
                    resultsHTML += `<div style="height: 100%; width: ${percentage}%; background: ${barColor}; transition: width 0.3s;"></div>`;
                    resultsHTML += `</div>`;
                    resultsHTML += `<span style="width: 50px; text-align: right; ${labelStyle}">${percentage}%</span>`;
                    resultsHTML += `</div>`;
                    resultsHTML += `</div>`;
                });
                resultsHTML += `</div>`;
            }
            resultsHTML += `</div>`;
        }

        resultsHTML += `<div style="margin-bottom: 15px; font-size: 16px; line-height: 1.8;">${result.question.question}</div>`;

        if (result.userAnswer !== undefined) {
            resultsHTML += `<div style="margin-bottom: 10px; font-size: 16px;"><strong>あなたの答え:</strong> ${answerLetters[result.userAnswer]}</div>`;
        } else {
            resultsHTML += `<div style="margin-bottom: 10px; font-size: 16px; color: #999;"><strong>未回答</strong></div>`;
        }

        if (!result.isCorrect) {
            resultsHTML += `<div style="margin-bottom: 10px; font-size: 16px;"><strong>正解:</strong> ${answerLetters[result.correctIndex]}</div>`;
        }

        if (result.question.explanation) {
            resultsHTML += `<div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px; font-size: 16px; line-height: 1.8;"><strong>解説:</strong> ${result.question.explanation}</div>`;
        }
        resultsHTML += `</div>`;
    });

    // 音声再生ボタンを追加
    resultsHTML += `<div style="margin: 20px 0; text-align: center;">`;
    resultsHTML += `<button class="next-btn" onclick="speakAgain()" style="max-width: 300px; min-height: 50px; font-size: 17px;">▶ 音声をもう一度聞く</button>`;
    resultsHTML += `</div>`;

    resultsHTML += `<div style="display: flex; gap: 15px; margin-top: 20px;">`;
    resultsHTML += `<button class="back-btn" style="flex: 1; min-height: 50px; font-size: 17px;" onclick="location.href='category-detail.html?category=${currentSubject}'">← 戻る</button>`;
    resultsHTML += `<button class="next-btn" style="flex: 1; min-height: 50px; font-size: 17px;" onclick="loadNextPassage()">次のパッセージ →</button>`;
    resultsHTML += `</div>`;

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

    // 各問題の解答結果を記録（選択肢も含む）
    const questionResults = passageQuestions.map((question, idx) => ({
        question_id: question.id,
        selected_choice: passageAnswers[idx] !== undefined ? passageAnswers[idx] : null,
        is_correct: passageAnswers[idx] !== undefined &&
                    passageAnswers[idx] === ['A', 'B', 'C', 'D', 'E'].indexOf(question.answer)
    }));

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
        // 全体の進捗を保存
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

        // 各問題の解答結果を送信（統計用、選択肢含む）
        await fetch(`${API_BASE_URL}/api/note/question-attempts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                attempts: questionResults
            })
        });
    } catch (error) {
        console.error('Failed to save passage progress:', error);
    }
}

// 各問題の統計データを取得
async function fetchQuestionStats(questions) {
    const stats = {};

    try {
        const questionIds = questions.map(q => q.id).filter(id => id);

        if (questionIds.length === 0) {
            return stats;
        }

        const response = await fetch(`${API_BASE_URL}/api/note/question-stats?ids=${questionIds.join(',')}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch question stats');
            return stats;
        }

        const data = await response.json();

        if (data.success && data.stats) {
            // 統計データをIDでマッピング
            data.stats.forEach(stat => {
                stats[stat.question_id] = {
                    total_attempts: stat.total_attempts || 0,
                    correct_count: stat.correct_count || 0,
                    choice_distribution: stat.choice_distribution || {}
                };
            });
        }
    } catch (error) {
        console.error('Error fetching question stats:', error);
    }

    return stats;
}

// 次のパッセージを読み込む
async function loadNextPassage() {
    // 音声を停止
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    // パッセージモードの変数をリセット
    passageQuestions = [];
    passageTitle = '';
    currentQuestionIndex = 0;
    passageAnswers = [];
    audioPlayedCount = 0;

    // ローディング表示
    document.getElementById("question").textContent = "次のパッセージを読み込んでいます...";
    document.getElementById("choices").classList.add("hidden");
    document.getElementById("result").classList.add("hidden");
    document.getElementById("speakBtnArea").classList.add("hidden");

    // 新しいパッセージを読み込む
    const apiSubject = subjectMapping[currentSubject];
    await loadPassageMode(apiSubject);
}
