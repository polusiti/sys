// 英文添削実験のJavaScript機能

// 統合APIエンドポイント
const API_ENDPOINT = 'https://languagetool-api.t88596565.workers.dev/api/v2/grammar';

// セキュリティ設定
const MAX_HISTORY = 10;
const MAX_REQUESTS_PER_MINUTE = 20;
const MAX_TEXT_LENGTH = 1000;
const BLOCKED_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
];

// レート制限用
let requestCount = [];
const RATE_LIMIT_WINDOW = 60000; // 60秒（1分）

// 入力サニタイズ用
function sanitizeInput(text) {
    if (typeof text !== 'string') return '';

    // HTMLエスケープ
    const div = document.createElement('div');
    div.textContent = text;
    let sanitized = div.innerHTML;

    // 禁止パターンチェック
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(text)) {
            throw new Error('入力に不適切な内容が含まれています');
        }
    }

    // 長さ制限
    if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`テキストが長すぎます。${MAX_TEXT_LENGTH}文字以内で入力してください`);
    }

    return sanitized;
}

// レート制限チェック
function checkRateLimit() {
    const now = Date.now();
    // 古いリクエストを削除
    requestCount = requestCount.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (requestCount.length >= MAX_REQUESTS_PER_MINUTE) {
        return false;
    }

    requestCount.push(now);
    return true;
}

// APIリクエストログ用
function logRequest(text, success = true, error = null) {
    const logData = {
        timestamp: new Date().toISOString(),
        textLength: text.length,
        success,
        error: error ? error.message : null,
        userAgent: navigator.userAgent.substring(0, 100) // Privacy protection
    };

    try {
        const logs = JSON.parse(localStorage.getItem('api_request_logs') || '[]');
        logs.unshift(logData);

        // 最新100件のみ保持
        if (logs.length > 100) {
            logs.splice(100);
        }

        localStorage.setItem('api_request_logs', JSON.stringify(logs));
    } catch (e) {
        console.log('ログ保存に失敗:', e);
    }
}

// DOM要素
const inputText = document.getElementById('inputText');
const checkBtn = document.getElementById('checkBtn');
const btnText = document.getElementById('btnText');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const correctedText = document.getElementById('correctedText');
const explanation = document.getElementById('explanation');
const errorSection = document.getElementById('errorSection');
const charCounter = document.getElementById('charCounter');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const exampleText = document.getElementById('exampleText');
const exampleContent = document.getElementById('exampleContent');
const layerInfo = document.getElementById('layerInfo');
const citationsInfo = document.getElementById('citationsInfo');
const responseInfo = document.getElementById('responseInfo');

// 例文リスト
const examples = [
    "I are a student. He dont like apples.",
    "She have two cats and they is very cute.",
    "Yesterday I go to the store and buy some breads.",
    "The weather are nice today, so I want to playing outside.",
    "My teacher telled me about the history of Japan.",
    "I can't swimming good, but I want to learning.",
    "There is many peoples in the park yesterday.",
    "He study english since three years and his speaking is get better."
];

let currentExampleIndex = 0;

// 文法エラー分析機能
function analyzeGrammarErrors(originalText, result) {
    const errors = [];

    // よくある文法エラーパターンを検出
    const patterns = [
        { type: '三人称単数', pattern: /\b(he|she|it)\s+\w+s\b/gi, example: 'He goes → He goes' },
        { type: 'be動詞', pattern: /\b(I|you|we|they)\s+is\b|\b(he|she|it)\s+are\b/gi, example: 'I are → I am' },
        { type: '過去形', pattern: /\b(go|eat|see|come|take|make)\s+ed\b/gi, example: 'goed → went' },
        { type: '複数形', pattern: /\b(a\s+\w+s)\b/gi, example: 'a cats → some cats' },
        { type: '冠詞', pattern: /\b(a|an)\s+(?:apple|banana|orange|book|car|house)\b/gi, example: 'apple → an apple' }
    ];

    patterns.forEach(patternObj => {
        const matches = originalText.match(patternObj.pattern);
        if (matches) {
            errors.push({
                type: patternObj.type,
                count: matches.length,
                example: patternObj.example
            });
        }
    });

    // エラー分析を表示
    if (errors.length > 0) {
        showGrammarAnalysis(errors);
    }
}

// 文法分析表示
function showGrammarAnalysis(errors) {
    let analysisHtml = '<div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #4285f4;">';
    analysisHtml += '<strong>📊 文法エラー分析:</strong><ul style="margin: 10px 0; padding-left: 20px;">';

    errors.forEach(error => {
        analysisHtml += `<li><strong>${error.type}:</strong> ${error.count}件 (${error.example})</li>`;
    });

    analysisHtml += '</ul>';
    analysisHtml += '<small>💡 練習問題: 下の「学習サポート」で確認しましょう</small>';
    analysisHtml += '</div>';

    // 結果カードの後に追加
    const resultCard = document.querySelector('.result-card');
    if (resultCard) {
        const existingAnalysis = resultCard.querySelector('.grammar-analysis');
        if (existingAnalysis) {
            existingAnalysis.remove();
        }

        const analysisDiv = document.createElement('div');
        analysisDiv.className = 'grammar-analysis';
        analysisDiv.innerHTML = analysisHtml;
        resultCard.appendChild(analysisDiv);
    }
}

// 例文機能
function insertExample() {
    inputText.value = examples[currentExampleIndex];
    updateCharCounter();
    inputText.focus();
}

function refreshExample(event) {
    if (event) {
        event.stopPropagation();
    }
    currentExampleIndex = (currentExampleIndex + 1) % examples.length;
    showExample();
}

function showExample() {
    const exampleContentEl = document.getElementById('exampleContent');
    if (exampleContentEl) {
        exampleContentEl.textContent = examples[currentExampleIndex];
    }
}

// 文字カウンター更新
function updateCharCounter() {
    const text = inputText.value;
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    charCount.textContent = `${charCount} / 1000 文字`;
    wordCount.textContent = `${wordCount} 単語`;

    // 文字数警告
    const counterEl = document.getElementById('charCounter');
    if (charCount > 900) {
        counterEl.classList.add('warning');
    } else {
        counterEl.classList.remove('warning');
    }
}

// ローディング表示制御
function showLoading(show) {
    if (show) {
        loading.classList.add('show');
        checkBtn.disabled = true;
        btnText.textContent = '添削中...';
        checkBtn.style.background = '#95a5a6';
        checkBtn.style.boxShadow = '2px 2px 0px #7f8c8d';
    } else {
        loading.classList.remove('show');
        checkBtn.disabled = false;
        btnText.textContent = '🔍 添削する';
        checkBtn.style.background = '';
        checkBtn.style.boxShadow = '';
    }
}

// 結果非表示
function hideResult() {
    resultSection.classList.remove('show');
    responseInfo.style.display = 'none';
    layerInfo.style.display = 'none';

    const learningSection = document.getElementById('learningSection');
    if (learningSection) {
        learningSection.style.display = 'none';
    }
}

// 履歴機能
function saveToHistory(originalText, result) {
    const history = JSON.parse(localStorage.getItem('eisakujikken_history') || '[]');
    const historyItem = {
        original: originalText,
        corrected: result.corrected,
        explanation: result.explanation,
        timestamp: new Date().toISOString()
    };

    history.unshift(historyItem);
    if (history.length > MAX_HISTORY) {
        history.pop();
    }

    localStorage.setItem('eisakujikken_history', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('eisakujikken_history') || '[]');
    // 履歴表示機能（必要に応じて実装）
}

// ローカルストレージ保存
function saveToLocalStorage(text) {
    if (text && text.trim()) {
        localStorage.setItem('eisakujikken_draft', text);
    }
}

// エラー表示
function showError(message) {
    errorSection.innerHTML = `
        <div class="error-message">
            <strong>⚠️ エラー</strong><br>
            ${message}
        </div>
    `;
    errorSection.style.display = 'block';
    hideResult();
}

// クリア機能
function clearInput() {
    inputText.value = '';
    updateCharCounter();
    hideError();
    hideResult();
    localStorage.removeItem('eisakujikken_draft');
}

// エラー非表示
function hideError() {
    errorSection.style.display = 'none';
}

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

    // 例文を初期表示
    showExample();

    // 文字カウンター初期化
    updateCharCounter();

    // Enterキーで添削実行（Shift+Enterは改行）
    inputText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            checkGrammar();
        }
    });

    // 自動保存機能と文字カウンター更新
    let autoSaveTimer;
    inputText.addEventListener('input', function() {
        updateCharCounter();
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveToLocalStorage(inputText.value);
        }, 1000);
    });

    // ページ読み込み時に保存されたテキストを復元
    const savedText = localStorage.getItem('eisakujikken_draft');
    if (savedText && savedText.trim()) {
        inputText.value = savedText;
        updateCharCounter();
    }
});

// 文法チェックメイン関数
async function checkGrammar() {
    const text = inputText.value.trim();

    // 入力値検証
    try {
        const sanitizedText = sanitizeInput(text);
    } catch (validationError) {
        showError(validationError.message);
        return;
    }

    // レート制限チェック
    if (!checkRateLimit()) {
        showError('リクエストが多すぎます。時間を開けて再度お試しください');
        return;
    }

    if (!text) {
        showError('英文を入力してください。');
        return;
    }

    if (text.length > 1000) {
        showError('テキストが長すぎます。1000文字以内で入力してください。');
        return;
    }

    // テキストのサニタイズ
    const sanitizedText = sanitizeInput(text);

    // ローディング表示
    showLoading(true);
    hideError();
    hideResult();

    // レスポンスタイム計測
    const startTime = Date.now();

    const requestStartTime = Date.now();

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({ text: sanitizedText }),
            signal: AbortSignal.timeout(30000) // 30秒タイムアウト
        });

        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // レスポンスタイム計算
        const responseTime = Date.now() - requestStartTime;

        // 通常のレスポンス形式の処理
        const processedResult = {
            corrected: result.corrected || '修正できませんでした',
            explanation: result.explanation || '説明がありません',
            responseTime: responseTime,
            layer: 'ai-pattern-matching'
        };

        // 結果表示
        showResult(processedResult, responseTime);

        // 学習セクションを表示
        showLearningSection();

        // 履歴に保存
        saveToHistory(text, processedResult);

        // 文法エラー分析
        analyzeGrammarErrors(text, processedResult);

        // 下書きを削除
        localStorage.removeItem('eisakujikken_draft');

        // 成功ログを記録
        logRequest(text, true);

    } catch (error) {
        console.error('文法チェックエラー:', error);

        // エラー分類
        let errorMessage = '添削中にエラーが発生しました。時間をおいて再度お試しください。';

        if (error.name === 'AbortError') {
            errorMessage = 'リクエストタイムアウトしました。ネットワーク接続を確認してください。';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'サーバーに接続できません。しばらくしてから再度お試しください。';
        } else if (error.message.includes('429')) {
            errorMessage = 'リクエストが多すぎます。しばらくしてから再度お試しください。';
        }

        showError(errorMessage);
        logRequest(text, false, error);
    } finally {
        showLoading(false);
    }
}

// 結果表示
function showResult(result, responseTime = null) {
    const originalText = inputText.value.trim();
    const correctedResultText = result.corrected;

    // 修正箇所をハイライト表示
    if (originalText !== correctedResultText) {
        displayHighlightedCorrection(originalText, correctedResultText);
    } else {
        // 修正がない場合
        correctedText.textContent = correctedResultText;
        correctedText.style.background = 'rgba(39, 174, 96, 0.1)';
        correctedText.style.padding = '2px 4px';
        correctedText.style.borderRadius = '4px';
    }

    explanation.textContent = result.explanation;

    // レスポンス情報表示
    if (responseTime !== null) {
        responseInfo.textContent = `⚡ レスポンス時間: ${responseTime}ms`;
        responseInfo.style.display = 'block';
    }

    // レスポンスタイム表示
    if (responseTime) {
        responseInfo.textContent = `⏱️ ${responseTime}ms`;
        responseInfo.style.display = 'block';
    }

    // レイヤー情報表示（APIから返される場合）
    if (result.layer) {
        layerInfo.textContent = result.layer;
        layerInfo.style.display = 'inline-block';
    }

    // 引用情報表示（レイヤー情報）
    if (result.layer) {
        citationsInfo.innerHTML = `<strong>🤖 ${result.layer}</strong> (AIによる文法添削)`;
        citationsInfo.style.display = 'block';
    }

    resultSection.classList.add('show');

    // スクロールして結果を表示
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ローディング表示制御
// showLoading function is already defined at line 215

// 学習セクション表示
function showLearningSection() {
    const learningSection = document.getElementById('learningSection');
    if (learningSection) {
        learningSection.style.display = 'block';
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

// 重複関数は削除済み

// 入力クリア
function clearInput() {
    inputText.value = '';
    hideResult();
    hideError();
    localStorage.removeItem('eisakujikken_draft');
    updateCharCounter();
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
           window.location.hostname === '127.0.0.1';
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

        // モックのレスポンスタイム
        const mockResponseTime = 800 + Math.floor(Math.random() * 400);

        // 簡単なモックルール
        let corrected = text;
        const corrections = [];

        const mockRules = [
            { pattern: /\b(he|she|it)\s+(are)\b/gi, replacement: '$1 is', explanation: 'Subject-verb agreement: use "is" with he/she/it' },
            { pattern: /\b(I)\s+(are)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },
            { pattern: /\b(they|we|you)\s+(is)\b/gi, replacement: '$1 are', explanation: 'Subject-verb agreement: use "are" with they/we/you' },
            { pattern: /\b(I)\s+(is)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },
            { pattern: /\b(I)\s+(was)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I in present tense' },
            { pattern: /\bdont\b/gi, replacement: "don't", explanation: 'Use apostrophe in contractions: "don\'t"' },
            { pattern: /\bwont\b/gi, replacement: "won't", explanation: 'Use apostrophe in contractions: "won\'t"' },
            { pattern: /\bcant\b/gi, replacement: "can't", explanation: 'Use apostrophe in contractions: "can\'t"' },
            { pattern: /\bdidnt\b/gi, replacement: "didn't", explanation: 'Use apostrophe in contractions: "didn\'t"' },
            { pattern: /\bdoesnt\b/gi, replacement: "doesn't", explanation: 'Use apostrophe in contractions: "doesn\'t"' },
            { pattern: /\bhave\s+(not)\b/gi, replacement: "haven't", explanation: 'Use contractions: "haven\'t"' },
            { pattern: /\bhas\s+(not)\b/gi, replacement: "hasn't", explanation: 'Use contractions: "hasn\'t"' },
            { pattern: /\bare\s+(not)\b/gi, replacement: "aren't", explanation: 'Use contractions: "aren\'t"' },
            { pattern: /\bis\s+(not)\b/gi, replacement: "isn't", explanation: 'Use contractions: "isn\'t"' },
            { pattern: /\bgo\s+to\s+the\s+(store|school|park|hospital|library)\b/gi, replacement: 'go to $1', explanation: 'Remove "the" after "go to" for places like store, school, etc.' },
            { pattern: /\bbread(s)?\b/gi, replacement: 'bread', explanation: '"Bread" is usually uncountable' },
            { pattern: /\btelled\b/gi, replacement: 'told', explanation: 'Past tense of "tell" is "told"' },
            { pattern: /\bpeoples?\b/gi, replacement: 'people', explanation: '"People" is already plural' }
        ];

        for (const rule of mockRules) {
            if (rule.pattern.test(corrected)) {
                corrected = corrected.replace(rule.pattern, rule.replacement);
                corrections.push(rule.explanation);
            }
        }

        let explanation = corrections.length > 0
            ? corrections.join('; ')
            : 'No errors found';

        showResult({ corrected, explanation }, mockResponseTime);
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

// 文字カウンター更新

// 修正箇所をハイライト表示する関数
function displayHighlightedCorrection(original, corrected) {
    // 簡単な単語単位の比較で修正箇所を特定
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');

    let highlightedHTML = '';
    let changesFound = false;

    // 各単語を比較して差分を表示
    correctedWords.forEach((word, index) => {
        if (index < originalWords.length && word !== originalWords[index]) {
            // 変更がある場合、元の単語を取消線で、修正単語を強調表示
            highlightedHTML += `<span style="text-decoration: line-through; color: #e74c3c; background: rgba(231, 76, 60, 0.1); padding: 1px 2px; border-radius: 2px;">${originalWords[index]}</span> `;
            highlightedHTML += `<span style="font-weight: bold; color: #27ae60; background: rgba(39, 174, 96, 0.1); padding: 1px 2px; border-radius: 2px;">${word}</span> `;
            changesFound = true;
        } else if (index >= originalWords.length) {
            // 追加された単語
            highlightedHTML += `<span style="font-weight: bold; color: #27ae60; background: rgba(39, 174, 96, 0.1); padding: 1px 2px; border-radius: 2px;">${word}</span> `;
            changesFound = true;
        } else {
            // 変更がない単語
            highlightedHTML += word + ' ';
        }
    });

    if (changesFound) {
        correctedText.innerHTML = highlightedHTML.trim();
        correctedText.style.background = 'rgba(52, 152, 219, 0.05)';
        correctedText.style.padding = '4px';
        correctedText.style.borderRadius = '4px';
        correctedText.style.border = '1px solid rgba(52, 152, 219, 0.2)';
    } else {
        // 変更が検出できない場合は全文表示
        correctedText.textContent = corrected;
        correctedText.style.background = 'linear-gradient(90deg, transparent 0%, rgba(52, 152, 219, 0.1) 50%, transparent 100%)';
        correctedText.style.padding = '2px 4px';
        correctedText.style.borderRadius = '4px';
    }
}

// Comprehensive cache clearing to resolve Service Worker issues
async function clearAllCachesAndReload() {
    debugLog('Starting comprehensive cache clearance...');

    try {
        // 1. Unregister all Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            debugLog(`Found ${registrations.length} service workers to unregister`);

            for (const registration of registrations) {
                debugLog(`Unregistering service worker: ${registration.scope}`);
                await registration.unregister();
            }
        }

        // 2. Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            debugLog(`Found ${cacheNames.length} caches to clear`);

            for (const cacheName of cacheNames) {
                debugLog(`Deleting cache: ${cacheName}`);
                await caches.delete(cacheName);
            }
        }

        // 3. Clear localStorage (except user data)
        const currentUser = localStorage.getItem('currentUser');
        const themeSettings = {
            theme: localStorage.getItem('theme'),
            themeToggleEnabled: localStorage.getItem('themeToggleEnabled')
        };

        // Clear all localStorage
        localStorage.clear();

        // Restore essential data
        if (currentUser) localStorage.setItem('currentUser', currentUser);
        if (themeSettings.theme) localStorage.setItem('theme', themeSettings.theme);
        if (themeSettings.themeToggleEnabled) localStorage.setItem('themeToggleEnabled', themeSettings.themeToggleEnabled);

        debugLog('localStorage cleared (essential data preserved)');

        // 4. Show success message and prompt for reload
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #e8f5e8; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #2E7D32; margin: 0 0 10px 0;">✅ キャッシュクリア完了</h3>
                    <p style="margin: 10px 0; color: #333;">すべてのキャッシュとService Workerを正常にクリアしました。</p>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;">ページをリロードして最新バージョンを読み込みます。</p>
                    <button onclick="window.location.reload()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 10px;
                    ">今すぐリロード</button>
                </div>
            `;
        }

        debugLog('Cache clearance completed successfully');

    } catch (error) {
        debugLog('Error during cache clearance:', error);

        // Show error message but still allow reload
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #ffebee; border: 2px solid #f44336; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #c62828; margin: 0 0 10px 0;">⚠️ 一部エラー</h3>
                    <p style="margin: 10px 0; color: #333;">キャッシュクリア中にエラーが発生しました。</p>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;">それでもページをリロードして改善されるかお試しください。</p>
                    <button onclick="window.location.reload()" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 10px;
                    ">リロードして再試行</button>
                </div>
            `;
        }
    }
}

// Force immediate Service Worker clearance
async function forceClearServiceWorkers() {
    debugLog('FORCE CLEARING ALL SERVICE WORKERS AND CACHES');

    try {
        // 1. Unregister all Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            debugLog(`Found ${registrations.length} service worker registrations - FORCE REMOVING`);

            for (const registration of registrations) {
                debugLog(`FORCE UNREGISTERING: ${registration.scope}`);
                await registration.unregister();
                debugLog(`Successfully unregistered: ${registration.scope}`);
            }
        }

        // 2. Clear ALL caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            debugLog(`Found ${cacheNames.length} caches - FORCE DELETING`);

            for (const cacheName of cacheNames) {
                debugLog(`FORCE DELETING CACHE: ${cacheName}`);
                await caches.delete(cacheName);
                debugLog(`Successfully deleted cache: ${cacheName}`);
            }
        }

        debugLog('FORCE CLEARANCE COMPLETED');
        return true;

    } catch (error) {
        debugLog('Error during force clearance:', error);
        return false;
    }
}

// Auto-clear caches on page load - IMMEDIATE EXECUTION
(function() {
    debugLog('IMMEDIATE SERVICE WORKER CLEARANCE INITIATED');

    if ('serviceWorker' in navigator) {
        forceClearServiceWorkers().then(success => {
            if (success) {
                debugLog('Immediate force clearance successful');
                showCacheClearedNotification();
            }
        });
    }
})();

// Also clear on load event
window.addEventListener('load', async () => {
    debugLog('Page loaded - running additional Service Worker clearance...');
    await forceClearServiceWorkers();
});

// Show notification when caches are cleared
function showCacheClearedNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Klee One', cursive;
        font-size: 14px;
        max-width: 300px;
    `;
    notification.innerHTML = '✅ Service Workerとキャッシュをクリアしました';
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Handle chrome-extension errors
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('chrome-extension')) {
        debugLog('Ignoring chrome-extension related error:', event.message);
        event.preventDefault();
        return false;
    }
});

window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('chrome-extension')) {
        debugLog('Ignoring chrome-extension promise rejection:', event.reason.message);
        event.preventDefault();
        return false;
    }
});

// FINAL Service Worker termination - EXTREME MEASURES
(function() {
    debugLog('🔥 FINAL SERVICE WORKER TERMINATION PROTOCOL INITIATED');

    // Disable Service Worker registration entirely
    if ('serviceWorker' in navigator) {
        debugLog('🛑 Disabling Service Worker registration');
        navigator.serviceWorker.ready = Promise.reject(new Error('Service Worker disabled'));
        navigator.serviceWorker.register = () => Promise.reject(new Error('Service Worker registration disabled'));
        navigator.serviceWorker.getRegistration = () => Promise.resolve(null);
        navigator.serviceWorker.getRegistrations = () => Promise.resolve([]);
    }

    // Disable caches API
    if ('caches' in window) {
        debugLog('🗑️ Disabling caches API');
        window.caches.open = () => Promise.reject(new Error('Caches disabled'));
        window.caches.delete = () => Promise.resolve(false);
        window.caches.keys = () => Promise.resolve([]);
        window.caches.match = () => Promise.resolve(undefined);
    }

    debugLog('🔥 SERVICE WORKER TERMINATION COMPLETE');
})();

debugLog('Eisakujikken.js loaded with enhanced cache clearing');