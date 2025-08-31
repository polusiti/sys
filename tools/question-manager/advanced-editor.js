class AdvancedQuestionEditor {
    constructor() {
        this.currentUser = null;
        this.checkAuthentication();
        
        this.currentQuestion = this.createEmptyQuestion();
        this.choiceCount = 0;
        this.stepCount = 0;
        this.isDirty = false;
        this.init();
    }

    checkAuthentication() {
        this.currentUser = AuthenticationSystem.getCurrentUser();
        
        if (!this.currentUser) {
            window.location.href = 'login';
            return;
        }
        
        if (!this.currentUser.permissions.includes('write')) {
            alert('⚠️ 編集権限が必要です');
            window.location.href = 'dashboard';
            return;
        }
        
        this.loadUserInfo();
    }

    loadUserInfo() {
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = this.currentUser.displayName;
        if (userRole) userRole.textContent = this.getRoleDisplayName(this.currentUser.role);
        if (userAvatar) userAvatar.textContent = this.currentUser.displayName.charAt(0);
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': '管理者',
            'teacher': '教師',
        };
        return roleNames[role] || role;
    }

    init() {
        this.updateAnswerFormat();
        this.updatePreview();
        this.setupAutoSave();
        
        // フォーム要素にイベントリスナーを設定
        this.setupFormListeners();
    }

    createEmptyQuestion() {
        return {
            id: '',
            answerFormat: 'A1',
            subject: 'math',
            topic: '',
            difficulty: 2,
            tags: [],
            questionContent: {
                stem: '',
                text: '',
                latex: false,
                images: []
            },
            answerData: {
                type: 'multiple-choice',
                choices: [],
                correctAnswers: [],
                closeAnswers: []
            },
            explanation: {
                text: '',
                latex: false,
                detailed: '',
                steps: [],
                hints: []
            },
            metadata: {
                estimatedTime: 180,
                createdAt: new Date().toISOString()
            },
            active: true
        };
    }

    setupFormListeners() {
        // 基本情報フィールド
        const basicFields = ['questionId', 'answerFormat', 'subject', 'difficulty', 'topic', 'tags', 'estimatedTime'];
        basicFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', () => this.markDirty());
                element.addEventListener('change', () => {
                    this.updateFromForm();
                    if (fieldId === 'answerFormat') {
                        this.updateAnswerFormat();
                    }
                });
            }
        });

        // 問題内容フィールド
        const questionFields = ['questionStem', 'questionText', 'questionLatex'];
        questionFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', () => {
                    this.markDirty();
                    this.updatePreview();
                });
            }
        });

        // 解説フィールド
        const explanationFields = ['explanationText', 'explanationLatex', 'detailedExplanation', 'hints'];
        explanationFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', () => {
                    this.markDirty();
                    this.updatePreview();
                });
            }
        });

        // ID自動生成のセットアップ
        this.setupIdGeneration();
        
        // ファイルアップロードのセットアップ
        this.setupFileUpload();
        
        // テンプレート機能のセットアップ
        this.setupTemplates();
        
        // LaTeXヘルパーのセットアップ
        this.setupLatexHelpers();
    }

    markDirty() {
        this.isDirty = true;
        document.getElementById('saveStatus').style.background = '#f59e0b';
        document.getElementById('saveText').textContent = '未保存';
        this.updateStatistics();
    }

    updateFromForm() {
        // 基本情報を更新
        this.currentQuestion.id = document.getElementById('questionId').value;
        this.currentQuestion.answerFormat = document.getElementById('answerFormat').value;
        this.currentQuestion.subject = document.getElementById('subject').value;
        this.currentQuestion.difficulty = parseInt(document.getElementById('difficulty').value);
        this.currentQuestion.topic = document.getElementById('topic').value;
        this.currentQuestion.tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t);
        this.currentQuestion.metadata.estimatedTime = parseInt(document.getElementById('estimatedTime').value) * 60;

        // 問題内容を更新
        this.currentQuestion.questionContent.stem = document.getElementById('questionStem').value;
        this.currentQuestion.questionContent.text = document.getElementById('questionText').value;
        this.currentQuestion.questionContent.latex = document.getElementById('questionLatex').checked;

        // 解説を更新
        this.currentQuestion.explanation.text = document.getElementById('explanationText').value;
        this.currentQuestion.explanation.latex = document.getElementById('explanationLatex').checked;
        this.currentQuestion.explanation.detailed = document.getElementById('detailedExplanation').value;
        
        const hints = document.getElementById('hints').value;
        this.currentQuestion.explanation.hints = hints ? hints.split('\\n').map(h => h.trim()).filter(h => h) : [];

        this.updatePreview();
    }

    updateAnswerFormat() {
        const format = document.getElementById('answerFormat').value;
        
        // すべての解答セクションを非表示
        document.getElementById('multipleChoiceAnswer').classList.add('hidden');
        document.getElementById('fractionAnswer').classList.add('hidden');
        document.getElementById('freeTextAnswer').classList.add('hidden');
        document.getElementById('essayAnswer').classList.add('hidden');

        // 選択された形式に応じて表示
        switch (format) {
            case 'A1':
                document.getElementById('multipleChoiceAnswer').classList.remove('hidden');
                this.initializeChoices(4);
                break;
            case 'A2':
                document.getElementById('multipleChoiceAnswer').classList.remove('hidden');
                this.initializeChoices(6);
                break;
            case 'A3':
                document.getElementById('multipleChoiceAnswer').classList.remove('hidden');
                this.initializeChoices(9);
                break;
            case 'F1':
                document.getElementById('fractionAnswer').classList.remove('hidden');
                break;
            case 'F2':
                document.getElementById('freeTextAnswer').classList.remove('hidden');
                break;
            case 'ESSAY':
                document.getElementById('essayAnswer').classList.remove('hidden');
                break;
        }

        this.updateFromForm();
    }

    initializeChoices(count) {
        const container = document.getElementById('choicesList');
        container.innerHTML = '';
        this.choiceCount = 0;

        for (let i = 0; i < count; i++) {
            this.addChoice();
        }
    }

    addChoice() {
        const choiceId = ++this.choiceCount;
        const container = document.getElementById('choicesList');
        
        const choiceElement = document.createElement('div');
        choiceElement.className = 'choice-item';
        choiceElement.id = `choice-${choiceId}`;
        
        choiceElement.innerHTML = `
            <div class="choice-header">
                <div class="choice-indicators">
                    <span class="choice-badge badge-correct hidden" id="correctBadge-${choiceId}">正解</span>
                    <span class="choice-badge badge-close hidden" id="closeBadge-${choiceId}">惜しい</span>
                </div>
                <div class="choice-actions">
                    <button class="btn btn-outline btn-small" onclick="toggleCorrect(${choiceId})" id="correctBtn-${choiceId}">
                        ✓ 正解
                    </button>
                    <button class="btn btn-outline btn-small" onclick="toggleClose(${choiceId})" id="closeBtn-${choiceId}">
                        ≈ 惜しい
                    </button>
                    <button class="btn btn-outline btn-small" onclick="removeChoice(${choiceId})">
                        ✕ 削除
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>選択肢 ${choiceId}</label>
                <textarea id="choiceText-${choiceId}" class="form-control" rows="2" placeholder="選択肢を入力"></textarea>
                <div class="checkbox-group">
                    <input type="checkbox" id="choiceLatex-${choiceId}">
                    <label for="choiceLatex-${choiceId}">LaTeX記法を含む</label>
                </div>
            </div>
            <div class="form-group">
                <label>フィードバック（この選択肢を選んだ時の説明）</label>
                <input type="text" id="choiceFeedback-${choiceId}" class="form-control" placeholder="なぜこの選択肢なのかの説明">
            </div>
        `;
        
        container.appendChild(choiceElement);
        
        // イベントリスナーを設定
        document.getElementById(`choiceText-${choiceId}`).addEventListener('input', () => this.markDirty());
        document.getElementById(`choiceFeedback-${choiceId}`).addEventListener('input', () => this.markDirty());
        document.getElementById(`choiceLatex-${choiceId}`).addEventListener('change', () => this.markDirty());
    }

    addStep() {
        const stepId = ++this.stepCount;
        const container = document.getElementById('stepsList');
        
        const stepElement = document.createElement('div');
        stepElement.className = 'step-item';
        stepElement.id = `step-${stepId}`;
        
        stepElement.innerHTML = `
            <div class="step-header">
                <div class="step-number">${stepId}</div>
                <button class="btn btn-outline btn-small" onclick="removeStep(${stepId})">✕ 削除</button>
            </div>
            <div class="form-group">
                <label>ステップ ${stepId} タイトル</label>
                <input type="text" id="stepTitle-${stepId}" class="form-control" placeholder="このステップの説明">
            </div>
            <div class="form-group">
                <label>内容</label>
                <textarea id="stepContent-${stepId}" class="form-control" rows="3" placeholder="詳細な説明"></textarea>
                <div class="checkbox-group">
                    <input type="checkbox" id="stepLatex-${stepId}">
                    <label for="stepLatex-${stepId}">LaTeX記法を含む</label>
                </div>
            </div>
        `;
        
        container.appendChild(stepElement);
        
        // イベントリスナーを設定
        document.getElementById(`stepTitle-${stepId}`).addEventListener('input', () => this.markDirty());
        document.getElementById(`stepContent-${stepId}`).addEventListener('input', () => this.markDirty());
        document.getElementById(`stepLatex-${stepId}`).addEventListener('change', () => this.markDirty());
    }

    updatePreview() {
        const previewContent = document.getElementById('previewContent');
        const questionText = document.getElementById('questionText').value;
        const questionStem = document.getElementById('questionStem').value;
        
        let preview = '';
        
        if (questionStem) {
            preview += `<div style="font-weight: 600; margin-bottom: 10px;">${questionStem}</div>`;
        }
        
        if (questionText) {
            preview += `<div style="margin-bottom: 15px;">${questionText}</div>`;
        }
        
        // LaTeXレンダリング
        if (document.getElementById('questionLatex')?.checked && window.MathJax) {
            previewContent.innerHTML = preview;
            MathJax.typesetPromise([previewContent]).then(() => {
                console.log('LaTeX rendered');
            }).catch(err => console.error('LaTeX rendering error:', err));
        } else {
            previewContent.innerHTML = preview || 'プレビューがここに表示されます';
        }
    }

    updateStatistics() {
        const questionText = document.getElementById('questionText').value || '';
        document.getElementById('charCount').textContent = questionText.length;
        document.getElementById('choiceCount').textContent = document.querySelectorAll('.choice-item').length;
        document.getElementById('stepCount').textContent = document.querySelectorAll('.step-item').length;
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.isDirty) {
                this.autoSave();
            }
        }, 30000); // 30秒ごと
    }

    autoSave() {
        const questionData = this.generateQuestionData();
        localStorage.setItem('draft_question', JSON.stringify(questionData));
        console.log('Draft saved automatically');
    }

    generateQuestionData() {
        this.updateFromForm();
        
        // 選択肢データを収集
        if (['A1', 'A2', 'A3'].includes(this.currentQuestion.answerFormat)) {
            const choices = [];
            const correctAnswers = [];
            const closeAnswers = [];
            
            document.querySelectorAll('.choice-item').forEach((item, index) => {
                const id = item.id.split('-')[1];
                const text = document.getElementById(`choiceText-${id}`).value;
                const feedback = document.getElementById(`choiceFeedback-${id}`).value;
                const latex = document.getElementById(`choiceLatex-${id}`).checked;
                
                if (text) {
                    choices.push({
                        text: text,
                        latex: latex,
                        feedback: feedback,
                        isCorrect: document.getElementById(`correctBadge-${id}`).classList.contains('badge-correct') && 
                                  !document.getElementById(`correctBadge-${id}`).classList.contains('hidden'),
                        isClose: document.getElementById(`closeBadge-${id}`).classList.contains('badge-close') && 
                                !document.getElementById(`closeBadge-${id}`).classList.contains('hidden')
                    });
                    
                    if (choices[choices.length - 1].isCorrect) {
                        correctAnswers.push(index);
                    }
                    if (choices[choices.length - 1].isClose) {
                        closeAnswers.push(index);
                    }
                }
            });
            
            this.currentQuestion.answerData = {
                type: 'multiple-choice',
                choices: choices,
                correctAnswers: correctAnswers,
                closeAnswers: closeAnswers
            };
        }
        
        // ステップデータを収集
        const steps = [];
        document.querySelectorAll('.step-item').forEach((item) => {
            const id = item.id.split('-')[1];
            const title = document.getElementById(`stepTitle-${id}`).value;
            const content = document.getElementById(`stepContent-${id}`).value;
            const latex = document.getElementById(`stepLatex-${id}`).checked;
            
            if (title || content) {
                steps.push({
                    step: parseInt(id),
                    title: title,
                    content: content,
                    latex: latex
                });
            }
        });
        
        this.currentQuestion.explanation.steps = steps;
        this.currentQuestion.metadata.updatedAt = new Date().toISOString();
        
        return this.currentQuestion;
    }
}

// グローバル関数
let editor;

function switchTab(tabName) {
    // タブボタンを更新
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // タブコンテンツを更新
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
}

function updateAnswerFormat() {
    if (editor) {
        editor.updateAnswerFormat();
    }
}

function addChoice() {
    if (editor) {
        editor.addChoice();
    }
}

function addStep() {
    if (editor) {
        editor.addStep();
    }
}

function toggleCorrect(choiceId) {
    const badge = document.getElementById(`correctBadge-${choiceId}`);
    const btn = document.getElementById(`correctBtn-${choiceId}`);
    
    badge.classList.toggle('hidden');
    btn.style.background = badge.classList.contains('hidden') ? '' : '#22c55e';
    btn.style.color = badge.classList.contains('hidden') ? '' : 'white';
    
    if (editor) {
        editor.markDirty();
    }
}

function toggleClose(choiceId) {
    const badge = document.getElementById(`closeBadge-${choiceId}`);
    const btn = document.getElementById(`closeBtn-${choiceId}`);
    
    badge.classList.toggle('hidden');
    btn.style.background = badge.classList.contains('hidden') ? '' : '#f59e0b';
    btn.style.color = badge.classList.contains('hidden') ? '' : 'white';
    
    if (editor) {
        editor.markDirty();
    }
}

function removeChoice(choiceId) {
    if (confirm('この選択肢を削除しますか？')) {
        document.getElementById(`choice-${choiceId}`).remove();
        if (editor) {
            editor.markDirty();
        }
    }
}

function removeStep(stepId) {
    if (confirm('このステップを削除しますか？')) {
        document.getElementById(`step-${stepId}`).remove();
        if (editor) {
            editor.markDirty();
        }
    }
}

function insertLatex(latex) {
    const activeTextarea = document.activeElement;
    if (activeTextarea && activeTextarea.tagName === 'TEXTAREA') {
        const start = activeTextarea.selectionStart;
        const end = activeTextarea.selectionEnd;
        const text = activeTextarea.value;
        
        activeTextarea.value = text.substring(0, start) + latex + text.substring(end);
        activeTextarea.focus();
        activeTextarea.setSelectionRange(start + latex.length, start + latex.length);
        
        if (editor) {
            editor.markDirty();
            editor.updatePreview();
        }
    }
}

function generateId() {
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    
    const id = `${subject}-${topic || 'general'}-${timestamp}`;
    document.getElementById('questionId').value = id;
    
    if (editor) {
        editor.markDirty();
    }
}

function validateQuestion() {
    if (editor) {
        const questionData = editor.generateQuestionData();
        
        const issues = [];
        
        if (!questionData.id) issues.push('問題IDが未入力');
        if (!questionData.questionContent.text) issues.push('問題文が未入力');
        if (!questionData.explanation.text) issues.push('解説が未入力');
        
        if (issues.length === 0) {
            alert('✅ 問題に問題ありません！');
        } else {
            alert('⚠️ 以下の項目を確認してください：\\n' + issues.join('\\n'));
        }
    }
}

function saveQuestion() {
    if (editor) {
        const questionData = editor.generateQuestionData();
        
        // JSONファイルとしてダウンロード
        const blob = new Blob([JSON.stringify(questionData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${questionData.id || 'question'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        // 保存状態を更新
        editor.isDirty = false;
        document.getElementById('saveStatus').style.background = '#22c55e';
        document.getElementById('saveText').textContent = '保存済み';
        
        console.log('Question saved:', questionData);
    }
}

function exportJson() {
    saveQuestion();
}

function previewQuestion() {
    if (editor && editor.generateQuestionData) {
        const questionData = editor.generateQuestionData();
        
        // 新しいウィンドウで問題をプレビュー
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>問題プレビュー</title>
                <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
                <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .question { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .choices { margin: 15px 0; }
                    .choice { margin: 5px 0; padding: 5px; }
                    .explanation { background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h2>問題プレビュー</h2>
                <div class="question">
                    <h3>${questionData.id}</h3>
                    <p>${questionData.questionContent.text}</p>
                </div>
                <div class="explanation">
                    <h4>解説</h4>
                    <p>${questionData.explanation.text}</p>
                </div>
            </body>
            </html>
        `);
    }
}
            
            setTimeout(() => toast.style.transform = 'translateX(0)', 100);
            setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>問題プレビュー</title>
                <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
                <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                <style>
                    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .question { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .choices { margin: 15px 0; }
                    .choice { padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 6px; }
                    .explanation { background: #eff6ff; padding: 15px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <h1>問題プレビュー</h1>
                <div class="question">
                    <p><strong>${questionData.questionContent.stem}</strong></p>
                    <p>${questionData.questionContent.text}</p>
                </div>
                <div class="explanation">
                    <h3>解説</h3>
                    <p>${questionData.explanation.text}</p>
                </div>
            </body>
            </html>
        `);
    }
}

function handleImageUpload(input, previewId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            preview.innerHTML = `<img src="${e.target.result}" class="image-preview" alt="アップロード画像">`;
        };
        reader.readAsDataURL(file);
        
        if (editor) {
            editor.markDirty();
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    editor = new AdvancedQuestionEditor();
    
    // ドラフトを復元
    const draft = localStorage.getItem('draft_question');
    if (draft) {
        try {
            const questionData = JSON.parse(draft);
            console.log('Draft restored:', questionData);
        } catch (e) {
            console.error('Failed to restore draft:', e);
        }
    }
});

// グローバル関数
function goToManager() {
    window.location.href = 'index';
}

function logout() {
    if (confirm('編集中の内容は保存されません。ログアウトしますか？')) {
        AuthenticationSystem.logout();
    }
}

function generateId() {
    if (editor && editor.generateId) {
        editor.generateId();
    }
}

function duplicateQuestion() {
    if (editor && editor.duplicateQuestion) {
        editor.duplicateQuestion();
    }
}

function clearQuestion() {
    if (editor && editor.clearQuestion) {
        editor.clearQuestion();
    }
}

function applyTemplate(templateKey) {
    if (editor && editor.applyTemplate) {
        editor.applyTemplate(templateKey);
    }
}

function insertLatex(shortcut) {
    if (editor && editor.insertLatex) {
        editor.insertLatex(shortcut);
    }
}