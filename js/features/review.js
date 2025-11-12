// API Base URL
const API_BASE_URL = 'https://api.allfrom0.top';

// 現在のユーザー情報取得（統一認証マネージャー経由）
let currentUser = null;
function checkAuth() {
    if (typeof authManager !== 'undefined' && authManager) {
        currentUser = authManager.getCurrentUser();
    } else {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }

    if (!currentUser) {
        window.location.href = '/pages/login.html';
    }
}
checkAuth();

// ゲストユーザーの場合は科目選択に戻す
if (currentUser.isGuest) {
    alert('復習モードは認証ユーザーのみ利用できます');
    window.location.href = '/pages/subject-select.html';
}

// URLパラメータから科目とレベルを取得
const urlParams = new URLSearchParams(window.location.search);
const currentSubject = urlParams.get('subject');
const currentLevel = urlParams.get('level');

// 復習データ
let wrongAnswers = [];
let currentIndex = 0;
let correctCount = 0;
let masteredCount = 0;
let currentQuestion = null;

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

// 間違えた問題を読み込む
async function loadWrongAnswers() {
    try {
        // クエリパラメータを構築
        let query = `userId=${currentUser.userId}&mastered=false`;

        if (currentSubject) {
            query += `&subject=${subjectMapping[currentSubject]}`;
        }

        if (currentLevel) {
            query += `&level=${currentLevel}`;
        }

        const sessionToken = localStorage.getItem('sessionToken');
        const response = await fetch(`${API_BASE_URL}/api/study/wrong-answers?${query}`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        const data = await response.json();

        if (data.success && data.wrongAnswers && data.wrongAnswers.length > 0) {
            wrongAnswers = data.wrongAnswers;

            // タイトル表示
            let titleText = '復習モード';
            if (currentSubject && subjectTitles[currentSubject]) {
                titleText += ' - ' + subjectTitles[currentSubject];
            }
            document.getElementById('subjectTitle').textContent = titleText;

            // 統計を更新
            document.getElementById('totalWrong').textContent = wrongAnswers.length;

            // 最初の問題を表示
            currentIndex = 0;
            nextQuestion();
        } else {
            document.getElementById('question').textContent = '間違えた問題がありません！';
            document.getElementById('choices').classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to load wrong answers:', error);
        document.getElementById('question').textContent = '問題の読み込みに失敗しました';
    }
}

// 次の問題を表示
function nextQuestion() {
    if (currentIndex >= wrongAnswers.length) {
        // 全問題完了
        showCompletionMessage();
        return;
    }

    // 結果を非表示、選択肢を表示
    document.getElementById('result').classList.add('hidden');
    document.getElementById('choices').classList.remove('hidden');

    currentQuestion = wrongAnswers[currentIndex];

    // 問題を表示
    const questionElement = document.getElementById('question');
    questionElement.innerHTML = `
        <div style="margin-bottom: 10px; padding: 10px; background: var(--warning-bg); border-left: 4px solid var(--error-border); border-radius: 4px;">
            <strong>この問題を${currentQuestion.wrong_count}回間違えました</strong>
        </div>
        ${currentQuestion.question_text}
    `;

    // 数式をレンダリング
    setTimeout(() => renderMath(questionElement), 50);

    // 選択肢を生成（正解＋間違った答え＋ダミー）
    const correctAnswer = currentQuestion.correct_answer;
    const userWrongAnswer = currentQuestion.user_answer;

    // 簡易的に4択を生成
    const choices = [correctAnswer];

    // ユーザーが選んだ間違った答えを追加
    if (userWrongAnswer && userWrongAnswer !== correctAnswer) {
        choices.push(userWrongAnswer);
    }

    // 足りない分はダミーを追加
    while (choices.length < 4) {
        choices.push(`選択肢 ${choices.length + 1}`);
    }

    // シャッ��ル
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    // 正解のインデックスを保存
    currentQuestion.correctIndex = choices.indexOf(correctAnswer);

    // 選択肢ボタンを更新
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach((btn, index) => {
        if (index < choices.length) {
            btn.style.display = 'block';
            btn.innerHTML = choices[index];
            btn.classList.remove('correct', 'wrong', 'selected');
            btn.disabled = false;

            // 数式をレンダリング
            setTimeout(() => renderMath(btn), 50);
        } else {
            btn.style.display = 'none';
        }
    });
}

// 選択肢を選択
async function selectChoice(index) {
    const choiceButtons = document.querySelectorAll('.choice-btn');

    // 選択されたボタンにselectedクラスを追加
    choiceButtons[index].classList.add('selected');

    // すべてのボタンを無効化
    choiceButtons.forEach(btn => btn.disabled = true);

    // 正解・不正解を表示
    const isCorrect = index === currentQuestion.correctIndex;
    const choices = Array.from(choiceButtons).slice(0, 4).map(btn => btn.innerHTML);

    if (isCorrect) {
        choiceButtons[index].classList.remove('selected');
        choiceButtons[index].classList.add('correct');
        correctCount++;
        masteredCount++;

        document.getElementById('resultText').textContent = "正解！習得しました！";
        document.getElementById('resultText').style.color = "#27ae60";
        document.getElementById('correctAnswer').innerHTML = "";

        // 習得済みとしてマーク
        await markAsMastered(currentQuestion.id);

        // 統計を更新
        document.getElementById('correct').textContent = correctCount;
        document.getElementById('mastered').textContent = masteredCount;
    } else {
        choiceButtons[index].classList.remove('selected');
        choiceButtons[index].classList.add('wrong');
        choiceButtons[currentQuestion.correctIndex].classList.add('correct');

        document.getElementById('resultText').textContent = "不正解";
        document.getElementById('resultText').style.color = "#e74c3c";
        document.getElementById('correctAnswer').innerHTML = `正解: ${choices[currentQuestion.correctIndex]}`;
    }

    // 解説を表示
    const explanationElement = document.getElementById('explanation');
    if (currentQuestion.explanation) {
        explanationElement.innerHTML = `<div style="margin-top: 15px; padding: 15px; background: var(--detail-bg); border-left: 4px solid var(--button-secondary-border); border-radius: 4px;"><strong>解説:</strong> ${currentQuestion.explanation}</div>`;
        setTimeout(() => renderMath(explanationElement), 50);
    } else {
        explanationElement.innerHTML = '';
    }

    // 次の問題へインデックスを進める
    currentIndex++;

    // 結果を表示
    document.getElementById('choices').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');
}

// 問題を習得済みにマーク
async function markAsMastered(wrongAnswerId) {
    try {
        const sessionToken = localStorage.getItem('sessionToken');
        await fetch(`${API_BASE_URL}/api/study/wrong-answers/master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                wrongAnswerId: wrongAnswerId
            })
        });
    } catch (error) {
        console.error('Failed to mark as mastered:', error);
    }
}

// 完了メッセージ
function showCompletionMessage() {
    document.getElementById('question').innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 28px; margin-bottom: 15px; color: var(--text-primary);">復習完了！</h2>
            <p style="font-size: 18px; color: var(--text-secondary);">
                ${correctCount}問中${masteredCount}問を習得しました
            </p>
            <button class="next-btn" style="margin-top: 30px; max-width: 300px;" onclick="location.href='/pages/subject-select.html'">
                科目選択に戻る
            </button>
        </div>
    `;
    document.getElementById('choices').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
}

// 数式レンダリング
function renderMath(element) {
    if (typeof katex === 'undefined') return;

    const text = element.innerHTML;

    // $$...$$ 形式の数式を検出してレンダリング
    let rendered = text.replace(/\$\$([^\$]+)\$\$/g, (match, formula) => {
        try {
            let decoded = formula.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            decoded = decoded.replace(/\\\\/g, '\\');

            if (!decoded.includes('\\displaystyle') && !decoded.includes('\\textstyle')) {
                decoded = '\\displaystyle ' + decoded;
            }

            return katex.renderToString(decoded, {
                throwOnError: false,
                displayMode: true,
                strict: false,
                trust: true
            });
        } catch (e) {
            console.error('KaTeX error:', e);
            return match;
        }
    });

    // $...$ 形式の数式を検出してレンダリング
    rendered = rendered.replace(/\$([^\$]+)\$/g, (match, formula) => {
        try {
            let decoded = formula.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            decoded = decoded.replace(/\\\\/g, '\\');

            if (!decoded.includes('\\displaystyle') && !decoded.includes('\\textstyle')) {
                decoded = '\\displaystyle ' + decoded;
            }

            return katex.renderToString(decoded, {
                throwOnError: false,
                displayMode: false,
                strict: false,
                trust: true
            });
        } catch (e) {
            console.error('KaTeX error:', e);
            return match;
        }
    });

    element.innerHTML = rendered;
}

// 戻るボタンの設定
document.getElementById('backBtn').onclick = function() {
    if (currentSubject) {
        location.href = `category-detail.html?category=${currentSubject}`;
    } else {
        location.href = 'subject-select.html';
    }
};

// 初期化
loadWrongAnswers();
