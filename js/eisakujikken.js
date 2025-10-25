// 英文添削実験のJavaScript機能

// LanguageTool APIエンドポイント（本番環境では適切なエンドポイントに設定）
const API_ENDPOINT = 'https://languagetool-api.your-subdomain.workers.dev/';

// ローカルストレージに保存する履歴の最大件数
const MAX_HISTORY = 10;

// DOM要素
const inputText = document.getElementById('inputText');
const checkBtn = document.getElementById('checkBtn');
const btnText = document.getElementById('btnText');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const correctedText = document.getElementById('correctedText');
const explanation = document.getElementById('explanation');
const errorSection = document.getElementById('errorSection');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // ログイン状態チェック
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // 保存された履歴があれば読み込む
    loadHistory();

    // Enterキーで添削実行（Shift+Enterは改行）
    inputText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            checkGrammar();
        }
    });

    // 自動保存機能
    let autoSaveTimer;
    inputText.addEventListener('input', function() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveToLocalStorage(inputText.value);
        }, 1000);
    });

    // ページ読み込み時に保存されたテキストを復元
    const savedText = localStorage.getItem('eisakujikken_draft');
    if (savedText && savedText.trim()) {
        inputText.value = savedText;
    }
});

// 文法チェックメイン関数
async function checkGrammar() {
    const text = inputText.value.trim();

    if (!text) {
        showError('英文を入力してください。');
        return;
    }

    if (text.length > 1000) {
        showError('テキストが長すぎます。1000文字以内で入力してください。');
        return;
    }

    // ローディング表示
    showLoading(true);
    hideError();
    hideResult();

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // 結果表示
        showResult(result);

        // 履歴に保存
        saveToHistory(text, result);

        // 下書きを削除
        localStorage.removeItem('eisakujikken_draft');

    } catch (error) {
        console.error('文法チェックエラー:', error);
        showError('添削中にエラーが発生しました。時間をおいて再度お試しください。\n\nエラー詳細: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 結果表示
function showResult(result) {
    correctedText.textContent = result.corrected;
    explanation.textContent = result.explanation;

    // 変更があった場合のみハイライト
    if (result.corrected !== inputText.value.trim()) {
        correctedText.style.background = 'linear-gradient(90deg, transparent 0%, rgba(52, 152, 219, 0.1) 50%, transparent 100%)';
        correctedText.style.padding = '2px 4px';
        correctedText.style.borderRadius = '4px';
    }

    resultSection.classList.add('show');

    // スクロールして結果を表示
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ローディング表示制御
function showLoading(show) {
    if (show) {
        loading.classList.add('show');
        checkBtn.disabled = true;
        btnText.textContent = '添削中...';
        checkBtn.style.background = '#95a5a6';
        checkBtn.style.boxShadow = '3px 3px 0px #7f8c8d';
    } else {
        loading.classList.remove('show');
        checkBtn.disabled = false;
        btnText.textContent = '🔍 添削する';
        checkBtn.style.background = '';
        checkBtn.style.boxShadow = '';
    }
}

// エラー表示
function showError(message) {
    errorSection.innerHTML = `
        <div class="error-message">
            <strong>⚠️ エラー</strong><br>
            ${message.replace(/\n/g, '<br>')}
        </div>
    `;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    errorSection.style.display = 'none';
}

function hideResult() {
    resultSection.classList.remove('show');
}

// 入力クリア
function clearInput() {
    inputText.value = '';
    hideResult();
    hideError();
    localStorage.removeItem('eisakujikken_draft');
    inputText.focus();
}

// ローカルストレージに下書き保存
function saveToLocalStorage(text) {
    if (text.trim()) {
        localStorage.setItem('eisakujikken_draft', text);
    }
}

// 履歴に保存
function saveToHistory(originalText, result) {
    const history = JSON.parse(localStorage.getItem('eisakujikken_history') || '[]');

    const historyItem = {
        timestamp: new Date().toISOString(),
        original: originalText,
        corrected: result.corrected,
        explanation: result.explanation
    };

    // 重複を避けるために同じテキストは削除
    const filteredHistory = history.filter(item => item.original !== originalText);

    // 先頭に追加
    filteredHistory.unshift(historyItem);

    // 最大件数で制限
    const limitedHistory = filteredHistory.slice(0, MAX_HISTORY);

    localStorage.setItem('eisakujikken_history', JSON.stringify(limitedHistory));
}

// 履歴読み込み
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('eisakujikken_history') || '[]');
    console.log('履歴読み込み:', history.length, '件');
}

// デバッグ用関数
function debugLog(message, data = null) {
    if (localStorage.getItem('eisakujikken_debug') === 'true') {
        console.log('[Eisakujikken Debug]', message, data);
    }
}

// 開発モード検出
function isDevelopmentMode() {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('github.io');
}

// APIエンドポイント設定（開発モードではモックを使用）
if (isDevelopmentMode()) {
    // 開発モードではモックレスポンスを返す
    window.checkGrammar = async function() {
        const text = inputText.value.trim();

        if (!text) {
            showError('英文を入力してください。');
            return;
        }

        showLoading(true);
        hideError();
        hideResult();

        // モック遅延
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 簡単なモックルール
        let corrected = text;
        let explanation = 'No errors found';

        const mockRules = [
            { pattern: /\bi\s+/gi, replacement: 'I ', explanation: 'Pronoun "I" should be capitalized' },
            { pattern: /\bdont\b/gi, replacement: "don't", explanation: 'Use apostrophe in contractions' },
            { pattern: /\bwont\b/gi, replacement: "won't", explanation: 'Use apostrophe in contractions' },
            { pattern: /\bcant\b/gi, replacement: "can't", explanation: 'Use apostrophe in contractions' },
            { pattern: /\b(he|she|it)\s+(are)\b/gi, replacement: '$1 is', explanation: 'Subject-verb agreement: use "is" with he/she/it' },
            { pattern: /\b(they|we|you)\s+(is)\b/gi, replacement: '$1 are', explanation: 'Subject-verb agreement: use "are" with they/we/you' }
        ];

        for (const rule of mockRules) {
            if (rule.pattern.test(text)) {
                corrected = text.replace(rule.pattern, rule.replacement);
                explanation = rule.explanation;
                break;
            }
        }

        showResult({ corrected, explanation });
        saveToHistory(text, { corrected, explanation });
        localStorage.removeItem('eisakujikken_draft');
        showLoading(false);
    };

    console.log('🧪 開発モード: モックAPIを使用します');
}

// キーボードショートカット
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enterで添削実行
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        checkGrammar();
    }

    // Escapeでクリア
    if (e.key === 'Escape') {
        clearInput();
    }
});

// ページ離脱時の確認
window.addEventListener('beforeunload', function(e) {
    const text = inputText.value.trim();
    if (text && text !== localStorage.getItem('eisakujikken_draft')) {
        e.preventDefault();
        e.returnValue = '入力中のテキストがあります。本当に離脱しますか？';
    }
});

debugLog('Eisakujikken.js loaded');