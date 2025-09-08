// スマホ特化問題作成システム
class MobileQuestionCreator {
    constructor() {
        this.currentTemplate = 'math-choice';
        this.currentQuestion = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadRecentQuestions();
    }

    checkAuth() {
        const user = AuthenticationSystem.getCurrentUser();
        if (!user || !user.permissions.includes('write')) {
            window.location.href = 'login';
            return;
        }
    }

    setupEventListeners() {
        // フォーム変更の監視
        document.getElementById('questionText').addEventListener('input', () => {
            this.detectLatexAndShowHelpers();
        });
    }

    // テンプレート選択
    selectTemplate(templateType) {
        this.currentTemplate = templateType;
        
        // 全テンプレートカードのスタイルをリセット
        document.querySelectorAll('.template-card').forEach(card => {
            card.style.borderColor = 'transparent';
        });
        
        // 選択されたテンプレートをハイライト
        event.target.style.borderColor = '#4f46e5';
        
        // フォームを初期化
        this.resetForm();
        this.setupFormForTemplate(templateType);
        
        this.showToast(`${this.getTemplateName(templateType)}を選択しました`);
    }

    setupFormForTemplate(templateType) {
        const choiceInputs = document.getElementById('choiceInputs');
        const latexHelpers = document.getElementById('latexHelpers');
        
        switch(templateType) {
            case 'math-choice':
            case 'english-choice':
            case 'science-choice':
                choiceInputs.classList.add('active');
                latexHelpers.style.display = templateType === 'math-choice' ? 'flex' : 'none';
                break;
                
            case 'free-text':
                choiceInputs.classList.remove('active');
                latexHelpers.style.display = 'flex';
                break;
        }
    }

    getTemplateName(templateType) {
        const names = {
            'math-choice': '数学4択問題',
            'english-choice': '英語4択問題', 
            'science-choice': '理科4択問題',
            'free-text': '記述式問題'
        };
        return names[templateType] || '';
    }

    // LaTeX入力補助
    detectLatexAndShowHelpers() {
        const text = document.getElementById('questionText').value;
        const latexHelpers = document.getElementById('latexHelpers');
        
        // 数式っぽい内容を検出
        const mathPatterns = /[+\\-*/=^(){}\\[\\]]/g;
        if (mathPatterns.test(text) || text.includes('x') || text.includes('y')) {
            latexHelpers.style.display = 'flex';
        }
    }

    insertLatex(latex) {
        const textarea = document.getElementById('questionText');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        // LaTeX記法修正（正しい記法に）
        const correctedLatex = latex.replace(/\\\\\\\\/g, '\\');
        
        textarea.value = text.substring(0, start) + correctedLatex + text.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + correctedLatex.length;
        textarea.focus();
        
        // 軽いフィードバック
        this.vibrate();
    }

    // 正解選択肢トグル
    toggleCorrect(toggle) {
        toggle.classList.toggle('active');
        this.vibrate();
    }

    // 問題保存
    async saveQuestion() {
        try {
            const questionData = this.collectFormData();
            
            if (!this.validateQuestion(questionData)) {
                return;
            }

            // データベースに保存
            if (window.questionDB) {
                await window.questionDB.saveQuestion(questionData);
            } else {
                this.saveToLocalStorage(questionData);
            }
            
            // 履歴に追加
            this.addToHistory(questionData);
            
            this.showSuccess();
            this.resetForm();
            
        } catch (error) {
            console.error('保存エラー:', error);
            this.showToast('保存に失敗しました', 'error');
        }
    }

    collectFormData() {
        const questionText = document.getElementById('questionText').value.trim();
        const explanation = document.getElementById('explanation').value.trim();
        
        const questionData = {
            id: `MOB_${Date.now()}`,
            answerFormat: this.getAnswerFormat(),
            subject: this.getSubjectFromTemplate(),
            difficulty: 2, // デフォルト
            questionContent: {
                text: questionText,
                latex: this.containsLatex(questionText),
                images: []
            },
            answerData: this.collectAnswerData(),
            explanation: {
                text: explanation,
                latex: this.containsLatex(explanation)
            },
            metadata: {
                createdAt: new Date().toISOString(),
                createdBy: 'mobile',
                template: this.currentTemplate
            },
            active: true
        };

        return questionData;
    }

    getAnswerFormat() {
        switch(this.currentTemplate) {
            case 'math-choice':
            case 'english-choice': 
            case 'science-choice':
                return 'A1';
            case 'free-text':
                return 'F2';
            default:
                return 'A1';
        }
    }

    getSubjectFromTemplate() {
        if (this.currentTemplate.includes('math')) return 'math';
        if (this.currentTemplate.includes('english')) return 'english';
        if (this.currentTemplate.includes('science')) return 'science';
        return 'general';
    }

    collectAnswerData() {
        if (this.currentTemplate.includes('choice')) {
            const choices = [];
            const correctAnswers = [];
            
            document.querySelectorAll('.choice-input').forEach((input, index) => {
                const text = input.value.trim();
                if (text) {
                    choices.push(text);
                    
                    const toggle = input.parentElement.querySelector('.correct-toggle');
                    if (toggle.classList.contains('active')) {
                        correctAnswers.push(index);
                    }
                }
            });
            
            return {
                type: 'multiple-choice',
                choices: choices,
                correctAnswers: correctAnswers,
                closeAnswers: []
            };
        } else {
            return {
                type: 'text',
                expectedAnswer: '',
                keywords: []
            };
        }
    }

    containsLatex(text) {
        return /\\\\[a-zA-Z]+|\\$|\\[{}()\\[\\]]/.test(text);
    }

    validateQuestion(data) {
        if (!data.questionContent.text) {
            this.showToast('問題文を入力してください', 'error');
            return false;
        }

        if (this.currentTemplate.includes('choice')) {
            if (data.answerData.choices.length < 2) {
                this.showToast('選択肢を2つ以上入力してください', 'error');
                return false;
            }
            
            if (data.answerData.correctAnswers.length === 0) {
                this.showToast('正解を1つ以上選択してください', 'error');
                return false;
            }
        }

        return true;
    }

    saveToLocalStorage(questionData) {
        const questions = JSON.parse(localStorage.getItem('mobile_questions') || '[]');
        questions.push(questionData);
        localStorage.setItem('mobile_questions', JSON.stringify(questions));
    }

    addToHistory(questionData) {
        const settings = this.getSettings();
        let history = JSON.parse(localStorage.getItem('mobile_question_history') || '[]');
        
        // 重複チェック（同じIDがあれば更新）
        const existingIndex = history.findIndex(q => q.id === questionData.id);
        if (existingIndex >= 0) {
            history[existingIndex] = questionData;
        } else {
            history.push(questionData);
        }
        
        // 履歴件数制限
        if (history.length > settings.historyLimit) {
            history = history.slice(-settings.historyLimit);
        }
        
        localStorage.setItem('mobile_question_history', JSON.stringify(history));
    }

    // プレビュー表示
    previewQuestion() {
        const questionData = this.collectFormData();
        const modal = document.getElementById('previewModal');
        const body = document.getElementById('previewBody');
        
        let html = `
            <div class="preview-question">
                <h4>問題: ${questionData.id}</h4>
                <p>${questionData.questionContent.text}</p>
        `;
        
        if (questionData.answerData.choices) {
            html += '<div class="preview-choices">';
            questionData.answerData.choices.forEach((choice, index) => {
                const isCorrect = questionData.answerData.correctAnswers.includes(index);
                html += `
                    <div class="preview-choice ${isCorrect ? 'correct' : ''}">
                        ${index + 1}. ${choice} ${isCorrect ? '✓' : ''}
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (questionData.explanation.text) {
            html += `
                <div class="preview-explanation">
                    <h5>解説</h5>
                    <p>${questionData.explanation.text}</p>
                </div>
            `;
        }
        
        html += '</div>';
        body.innerHTML = html;
        modal.style.display = 'block';
        
        // MathJax再描画
        if (window.MathJax) {
            MathJax.typesetPromise([body]).catch(err => console.log(err));
        }
    }

    closePreview() {
        document.getElementById('previewModal').style.display = 'none';
    }

    // フォームリセット
    resetForm() {
        document.getElementById('questionText').value = '';
        document.getElementById('explanation').value = '';
        
        document.querySelectorAll('.choice-input').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('.correct-toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
    }

    // 成功アニメーション
    showSuccess() {
        const successMsg = document.getElementById('successMsg');
        successMsg.style.display = 'block';
        
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 2000);
        
        this.vibrate();
    }

    // トースト通知
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#22c55e'};
            color: white;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            font-weight: 600;
            z-index: 9999;
            transform: translateY(100px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateY(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // バイブレーション（対応デバイスのみ）
    vibrate() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // 履歴表示
    showHistory() {
        const history = this.getQuestionHistory();
        
        if (history.length === 0) {
            this.showToast('作成履歴がありません', 'info');
            return;
        }

        const historyModal = document.createElement('div');
        historyModal.className = 'history-modal';
        historyModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            padding: 20px;
            overflow-y: auto;
        `;
        
        historyModal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 25px; margin-top: 40px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #4f46e5; margin: 0;">📋 作成履歴</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">&times;</button>
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${history.map((item, index) => `
                        <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
                            <div style="font-weight: 600; color: #374151;">${item.questionContent?.text?.substring(0, 50) || '無題'}${(item.questionContent?.text?.length || 0) > 50 ? '...' : ''}</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                                ${new Date(item.metadata?.createdAt || 0).toLocaleString('ja-JP')} | ${this.getSubjectName(item.subject)}
                            </div>
                            <div style="margin-top: 8px;">
                                <button onclick="this.loadQuestionFromHistory('${item.id}')" style="padding: 4px 8px; background: #4f46e5; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">復元</button>
                                <button onclick="this.deleteFromHistory('${item.id}')" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 8px;">削除</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.clearHistory()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">全履歴削除</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(historyModal);
    }

    getQuestionHistory() {
        const history = JSON.parse(localStorage.getItem('mobile_question_history') || '[]');
        return history.sort((a, b) => new Date(b.metadata?.createdAt || 0) - new Date(a.metadata?.createdAt || 0)).slice(0, 20);
    }

    loadQuestionFromHistory(questionId) {
        const history = this.getQuestionHistory();
        const question = history.find(q => q.id === questionId);
        
        if (question) {
            // フォームに問題データを復元
            document.getElementById('questionText').value = question.questionContent?.text || '';
            document.getElementById('explanation').value = question.explanation?.text || '';
            
            // テンプレートを設定
            this.currentTemplate = question.metadata?.template || 'math-choice';
            this.setupFormForTemplate(this.currentTemplate);
            
            // 選択肢を復元（選択肢問題の場合）
            if (question.answerData?.choices) {
                const choiceInputs = document.querySelectorAll('.choice-input');
                question.answerData.choices.forEach((choice, index) => {
                    if (choiceInputs[index]) {
                        choiceInputs[index].value = choice;
                    }
                });
                
                // 正解を復元
                question.answerData.correctAnswers?.forEach(correctIndex => {
                    const toggle = document.querySelectorAll('.correct-toggle')[correctIndex];
                    if (toggle) {
                        toggle.classList.add('active');
                    }
                });
            }
            
            this.showToast('履歴から問題を復元しました', 'success');
            // モーダルを閉じる
            document.querySelector('.history-modal')?.remove();
        }
    }

    deleteFromHistory(questionId) {
        if (confirm('この履歴を削除しますか？')) {
            let history = this.getQuestionHistory();
            history = history.filter(q => q.id !== questionId);
            localStorage.setItem('mobile_question_history', JSON.stringify(history));
            
            // モーダルを再描画
            document.querySelector('.history-modal')?.remove();
            this.showHistory();
            
            this.showToast('履歴を削除しました', 'success');
        }
    }

    clearHistory() {
        if (confirm('すべての履歴を削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem('mobile_question_history');
            document.querySelector('.history-modal')?.remove();
            this.showToast('履歴をすべて削除しました', 'success');
        }
    }

    // 設定表示  
    showSettings() {
        const settings = this.getSettings();
        
        const settingsModal = document.createElement('div');
        settingsModal.className = 'settings-modal';
        settingsModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            padding: 20px;
            overflow-y: auto;
        `;
        
        settingsModal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 25px; margin-top: 40px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #4f46e5; margin: 0;">⚙️ 設定</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px;">デフォルト科目</label>
                    <select id="defaultSubject" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="math" ${settings.defaultSubject === 'math' ? 'selected' : ''}>数学</option>
                        <option value="english" ${settings.defaultSubject === 'english' ? 'selected' : ''}>英語</option>
                        <option value="science" ${settings.defaultSubject === 'science' ? 'selected' : ''}>理科</option>
                        <option value="general" ${settings.defaultSubject === 'general' ? 'selected' : ''}>その他</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px;">デフォルト難易度</label>
                    <select id="defaultDifficulty" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="1" ${settings.defaultDifficulty === 1 ? 'selected' : ''}>★☆☆☆☆ (とても簡単)</option>
                        <option value="2" ${settings.defaultDifficulty === 2 ? 'selected' : ''}>★★☆☆☆ (簡単)</option>
                        <option value="3" ${settings.defaultDifficulty === 3 ? 'selected' : ''}>★★★☆☆ (普通)</option>
                        <option value="4" ${settings.defaultDifficulty === 4 ? 'selected' : ''}>★★★★☆ (難しい)</option>
                        <option value="5" ${settings.defaultDifficulty === 5 ? 'selected' : ''}>★★★★★ (とても難しい)</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="autoSave" ${settings.autoSave ? 'checked' : ''} style="width: 16px; height: 16px;">
                        <span>自動保存を有効にする</span>
                    </label>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">作成中の問題を自動的に下書き保存します</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="vibration" ${settings.vibration ? 'checked' : ''} style="width: 16px; height: 16px;">
                        <span>バイブレーション</span>
                    </label>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">ボタンタップ時にバイブレーションします</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="latexHelper" ${settings.latexHelper ? 'checked' : ''} style="width: 16px; height: 16px;">
                        <span>LaTeX補助ボタンを常に表示</span>
                    </label>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">数学記号入力ボタンを常に表示します</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px;">履歴保存件数</label>
                    <select id="historyLimit" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="10" ${settings.historyLimit === 10 ? 'selected' : ''}>10件</option>
                        <option value="20" ${settings.historyLimit === 20 ? 'selected' : ''}>20件</option>
                        <option value="50" ${settings.historyLimit === 50 ? 'selected' : ''}>50件</option>
                        <option value="100" ${settings.historyLimit === 100 ? 'selected' : ''}>100件</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">ストレージ使用状況</div>
                    <div style="font-size: 12px; color: #6b7280;">
                        問題データ: ${this.getStorageSize('mobile_questions')}KB<br>
                        履歴データ: ${this.getStorageSize('mobile_question_history')}KB<br>
                        設定データ: ${this.getStorageSize('mobile_settings')}KB
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="this.saveSettings()" style="flex: 1; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">保存</button>
                    <button onclick="this.resetSettings()" style="padding: 12px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">リセット</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsModal);
    }

    getSettings() {
        const defaultSettings = {
            defaultSubject: 'math',
            defaultDifficulty: 2,
            autoSave: true,
            vibration: true,
            latexHelper: false,
            historyLimit: 20
        };
        
        const saved = localStorage.getItem('mobile_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        const settings = {
            defaultSubject: document.getElementById('defaultSubject').value,
            defaultDifficulty: parseInt(document.getElementById('defaultDifficulty').value),
            autoSave: document.getElementById('autoSave').checked,
            vibration: document.getElementById('vibration').checked,
            latexHelper: document.getElementById('latexHelper').checked,
            historyLimit: parseInt(document.getElementById('historyLimit').value)
        };
        
        localStorage.setItem('mobile_settings', JSON.stringify(settings));
        
        // LaTeX補助ボタンの表示/非表示を更新
        const latexHelpers = document.getElementById('latexHelpers');
        if (latexHelpers) {
            latexHelpers.style.display = settings.latexHelper ? 'flex' : 'none';
        }
        
        this.showToast('設定を保存しました', 'success');
        document.querySelector('.settings-modal')?.remove();
    }

    resetSettings() {
        if (confirm('設定をデフォルトに戻しますか？')) {
            localStorage.removeItem('mobile_settings');
            this.showToast('設定をリセットしました', 'success');
            document.querySelector('.settings-modal')?.remove();
        }
    }

    getStorageSize(key) {
        const data = localStorage.getItem(key);
        return data ? Math.round(new Blob([data]).size / 1024 * 100) / 100 : 0;
    }

    // 最近の問題読み込み
    loadRecentQuestions() {
        // 後で実装
    }
}

// グローバル関数
let mobileCreator;

function selectTemplate(templateType) {
    if (mobileCreator) {
        mobileCreator.selectTemplate(templateType);
    }
}

function insertLatex(latex) {
    if (mobileCreator) {
        mobileCreator.insertLatex(latex);
    }
}

function toggleCorrect(toggle) {
    if (mobileCreator) {
        mobileCreator.toggleCorrect(toggle);
    }
}

function saveQuestion() {
    if (mobileCreator) {
        mobileCreator.saveQuestion();
    }
}

function previewQuestion() {
    if (mobileCreator) {
        mobileCreator.previewQuestion();
    }
}

function closePreview() {
    if (mobileCreator) {
        mobileCreator.closePreview();
    }
}

function showHistory() {
    if (mobileCreator) {
        mobileCreator.showHistory();
    }
}

function showSettings() {
    if (mobileCreator) {
        mobileCreator.showSettings();
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    mobileCreator = new MobileQuestionCreator();
});

// PWAインストールプロンプト
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setTimeout(() => {
        if (confirm('この問題作成アプリをホーム画面に追加しますか？')) {
            e.prompt();
        }
    }, 3000);
});