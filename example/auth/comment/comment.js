/**
 * シンプル認証対応コメントシステム
 * 完全に再設計 - 確実に動作することを重視
 */

// グローバル変数
let currentUser = null;
let comments = [];
const PROBLEM_ID = 'math_001';

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM読み込み完了');
    
    // さらに確実にするため、少し待つ
    setTimeout(() => {
        initializeSystem();
    }, 200);
});

function initializeSystem() {
    console.log('🔧 システム初期化開始');
    
    try {
        // 必要な要素が存在するかチェック
        const requiredElements = [
            'loginBtn', 'logoutBtn', 'authModal', 'closeModal', 
            'userId', 'password', 'authenticateBtn', 'cancelBtn'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
                console.error(`❌ 要素が見つかりません: ${id}`);
            } else {
                console.log(`✅ 要素確認: ${id}`);
            }
        });
        
        if (missingElements.length > 0) {
            console.error('❌ 必要な要素が見つからないため、システムを停止します');
            return;
        }
        
        // イベントリスナーを設定
        setupEventListeners();
        
        // コメントシステムを初期化
        initializeComments();
        
        // UIを初期状態に設定
        updateUI();
        
        console.log('✅ システム初期化完了');
        
    } catch (error) {
        console.error('❌ システム初期化エラー:', error);
    }
}

function setupEventListeners() {
    console.log('🔧 イベントリスナー設定開始');
    
    // ログインボタン
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = function() {
            console.log('🔑 ログインボタンクリック');
            showAuthModal();
        };
        console.log('✅ ログインボタンイベント設定完了');
    }
    
    // ログアウトボタン
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            console.log('👋 ログアウトボタンクリック');
            logout();
        };
    }
    
    // モーダル関連
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.onclick = function() {
            console.log('❌ モーダル閉じるボタンクリック');
            hideAuthModal();
        };
    }
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            console.log('❌ キャンセルボタンクリック');
            hideAuthModal();
        };
    }
    
    // 認証ボタン
    const authenticateBtn = document.getElementById('authenticateBtn');
    if (authenticateBtn) {
        authenticateBtn.onclick = function() {
            console.log('🔐 認証ボタンクリック');
            authenticate();
        };
        console.log('✅ 認証ボタンイベント設定完了');
    }
    
    // モーダル外クリックで閉じる
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.onclick = function(e) {
            if (e.target === authModal) {
                hideAuthModal();
            }
        };
    }
    
    // Enterキーでログイン
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.onkeypress = function(e) {
            if (e.key === 'Enter') {
                authenticate();
            }
        };
    }
    
    // コメント関連
    const postComment = document.getElementById('postComment');
    if (postComment) {
        postComment.onclick = function() {
            submitComment();
        };
    }
    
    const cancelComment = document.getElementById('cancelComment');
    if (cancelComment) {
        cancelComment.onclick = function() {
            clearCommentForm();
        };
    }
    
    const refreshComments = document.getElementById('refreshComments');
    if (refreshComments) {
        refreshComments.onclick = function() {
            loadComments();
        };
    }
    
    const submitAnswer = document.getElementById('submitAnswer');
    if (submitAnswer) {
        submitAnswer.onclick = function() {
            checkAnswer();
        };
    }
    
    console.log('✅ イベントリスナー設定完了');
}

function showAuthModal() {
    console.log('📱 モーダル表示開始');
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ モーダル表示成功');
        
        // フォーカス設定
        const userIdField = document.getElementById('userId');
        if (userIdField) {
            setTimeout(() => {
                userIdField.focus();
            }, 100);
        }
    } else {
        console.error('❌ モーダル要素が見つかりません');
    }
}

function hideAuthModal() {
    console.log('❌ モーダル非表示開始');
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        clearAuthForm();
        console.log('✅ モーダル非表示成功');
    }
}

function clearAuthForm() {
    const userIdField = document.getElementById('userId');
    const passwordField = document.getElementById('password');
    
    if (userIdField) userIdField.value = '';
    if (passwordField) passwordField.value = '';
}

function authenticate() {
    console.log('🔐 認証処理開始');
    
    const userIdField = document.getElementById('userId');
    const passwordField = document.getElementById('password');
    
    if (!userIdField || !passwordField) {
        console.error('❌ フォーム要素が見つかりません');
        showNotification('システムエラーが発生しました', 'error');
        return;
    }
    
    const userId = userIdField.value.trim();
    const password = passwordField.value.trim();
    
    console.log(`🔍 入力確認 - ID: "${userId}", Password: "${password}"`);
    
    if (!userId || !password) {
        showNotification('ユーザーIDとパスワードを入力してください', 'error');
        return;
    }
    
    // テスト認証: ID=1, Password=123
    if (userId === '1' && password === '123') {
        currentUser = {
            id: '1',
            username: 'testuser',
            displayName: 'テストユーザー',
            loginTime: new Date().toISOString()
        };
        
        console.log('✅ ログイン成功:', currentUser);
        hideAuthModal();
        updateUI();
        showNotification(`${currentUser.displayName}さん、ログインしました！`, 'success');
        
    } else {
        console.log('❌ ログイン失敗: 無効な認証情報');
        showNotification('ユーザーIDまたはパスワードが間違っています', 'error');
    }
}

function logout() {
    currentUser = null;
    updateUI();
    showNotification('👋 ログアウトしました', 'info');
    console.log('👋 ログアウト完了');
}

function updateUI() {
    console.log('🔄 UI更新開始');
    
    const currentUserSpan = document.getElementById('currentUser');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const commentForm = document.getElementById('commentForm');
    const loginPrompt = document.getElementById('loginPrompt');
    
    if (currentUser) {
        if (currentUserSpan) currentUserSpan.textContent = currentUser.displayName;
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (commentForm) commentForm.style.display = 'block';
        if (loginPrompt) loginPrompt.style.display = 'none';
        console.log('🔄 ログイン済みUI更新完了');
    } else {
        if (currentUserSpan) currentUserSpan.textContent = '未認証';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (commentForm) commentForm.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
        console.log('🔄 未認証UI更新完了');
    }
}

function showNotification(message, type = 'info') {
    console.log(`📢 通知: ${message} (${type})`);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // アニメーション
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動削除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function initializeComments() {
    console.log('📝 コメントシステム初期化');
    loadComments();
}

function loadComments() {
    console.log('📖 コメント読み込み開始');
    
    try {
        const stored = localStorage.getItem('comments_' + PROBLEM_ID);
        if (stored) {
            comments = JSON.parse(stored);
            console.log(`📖 既存コメント ${comments.length} 件を読み込み`);
        } else {
            // サンプルコメント作成
            createSampleComments();
        }
    } catch (error) {
        console.error('コメント読み込みエラー:', error);
        createSampleComments();
    }
    
    renderComments();
}

function createSampleComments() {
    console.log('📝 サンプルコメント作成');
    
    comments = [
        {
            id: 'sample_1',
            problemId: PROBLEM_ID,
            userId: 'sample_user_1',
            username: '数学太郎',
            type: 'explanation',
            text: 'この問題は因数分解で解けます！\nx² + 5x + 6 = (x + 2)(x + 3) = 0\nなので x = -2 または x = -3 が答えです。',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分前
            likes: 5,
            replies: []
        },
        {
            id: 'sample_2',
            problemId: PROBLEM_ID,
            userId: 'sample_user_2',
            username: '学習花子',
            type: 'question',
            text: '因数分解のやり方がよく分かりません。もう少し詳しく教えてもらえますか？',
            timestamp: new Date(Date.now() - 1000 * 60 * 28),
            likes: 2,
            replies: []
        },
        {
            id: 'sample_3',
            problemId: PROBLEM_ID,
            userId: 'sample_user_3',
            username: '解法マスター',
            type: 'hint',
            text: '💡 ヒント：x² + 5x + 6 で、2つの数の積が6、和が5になる数を見つけてみてください。2と3がポイントです！',
            timestamp: new Date(Date.now() - 1000 * 60 * 26),
            likes: 8,
            replies: []
        },
        {
            id: 'sample_4',
            problemId: PROBLEM_ID,
            userId: 'sample_user_4',
            username: '中学生みき',
            type: 'question',
            text: '答えがマイナスになるのはなぜですか？普通の数じゃだめなんですか？',
            timestamp: new Date(Date.now() - 1000 * 60 * 24),
            likes: 1,
            replies: []
        },
        {
            id: 'sample_5',
            problemId: PROBLEM_ID,
            userId: 'sample_user_5',
            username: '先生A',
            type: 'explanation',
            text: '素晴らしい質問ですね！方程式 x² + 5x + 6 = 0 は「xの値を求めよ」という問題です。この場合、x = -2 と x = -3 を代入すると式が0になることを確認できます。実際に代入してみましょう：\n(-2)² + 5×(-2) + 6 = 4 - 10 + 6 = 0 ✓',
            timestamp: new Date(Date.now() - 1000 * 60 * 22),
            likes: 12,
            replies: []
        },
        {
            id: 'sample_6',
            problemId: PROBLEM_ID,
            userId: 'sample_user_6',
            username: '高校生けん',
            type: 'discussion',
            text: '解の公式を使って解くこともできますよね。x = (-5 ± √(25-24)) / 2 = (-5 ± 1) / 2 で、x = -2, -3 になります。',
            timestamp: new Date(Date.now() - 1000 * 60 * 20),
            likes: 6,
            replies: []
        },
        {
            id: 'sample_7',
            problemId: PROBLEM_ID,
            userId: 'sample_user_7',
            username: 'プログラマーさとし',
            type: 'feedback',
            text: 'この問題、プログラムで解を確認してみました！\nfor (let x = -10; x <= 10; x++) {\n  if (x*x + 5*x + 6 === 0) console.log(x);\n}\n結果: -3, -2 が出力されました。数学とプログラミングって繋がってますね！',
            timestamp: new Date(Date.now() - 1000 * 60 * 18),
            likes: 9,
            replies: []
        },
        {
            id: 'sample_8',
            problemId: PROBLEM_ID,
            userId: 'sample_user_8',
            username: 'ママ友ゆき',
            type: 'discussion',
            text: '息子に教えるのに苦労してます💦 因数分解って社会人になっても使うんですか？',
            timestamp: new Date(Date.now() - 1000 * 60 * 16),
            likes: 3,
            replies: []
        },
        {
            id: 'sample_9',
            problemId: PROBLEM_ID,
            userId: 'sample_user_9',
            username: '数学博士',
            type: 'explanation',
            text: 'はい、因数分解は様々な分野で活用されています！\n・コンピューターサイエンス（暗号化）\n・工学（信号処理、制御理論）\n・経済学（最適化問題）\n・物理学（波動方程式）\n基礎的な数学こそ、応用範囲が広いのです。',
            timestamp: new Date(Date.now() - 1000 * 60 * 14),
            likes: 15,
            replies: []
        },
        {
            id: 'sample_10',
            problemId: PROBLEM_ID,
            userId: 'sample_user_10',
            username: '受験生りく',
            type: 'hint',
            text: '覚え方のコツ：「かけて6、足して5」と覚えると良いですよ！\n1×6=6, 1+6=7 ❌\n2×3=6, 2+3=5 ✅\nこれで (x+2)(x+3) だとわかります！',
            timestamp: new Date(Date.now() - 1000 * 60 * 12),
            likes: 4,
            replies: []
        },
        {
            id: 'sample_11',
            problemId: PROBLEM_ID,
            userId: 'sample_user_11',
            username: '塾講師まり',
            type: 'explanation',
            text: '生徒によく教える方法です📚\n①まず x² + 5x + 6 を見る\n②かけて6、足して5になる2つの数は？\n③2と3！\n④だから (x+2)(x+3) = 0\n⑤x+2=0 または x+3=0\n⑥x=-2, x=-3 が答え✨',
            timestamp: new Date(Date.now() - 1000 * 60 * 10),
            likes: 7,
            replies: []
        },
        {
            id: 'sample_12',
            problemId: PROBLEM_ID,
            userId: 'sample_user_12',
            username: '工学部2年',
            type: 'discussion',
            text: '大学の工学部でもよく出てきます。制御工学で伝達関数の極を求めるときとか。数学の基礎って本当に大事だなと実感してます。',
            timestamp: new Date(Date.now() - 1000 * 60 * 8),
            likes: 5,
            replies: []
        },
        {
            id: 'sample_13',
            problemId: PROBLEM_ID,
            userId: 'sample_user_13',
            username: '元気な小6',
            type: 'question',
            text: 'まだ中学生じゃないけど、これ解けるかな？がんばって挑戦してみたい！どこから勉強すればいいですか？',
            timestamp: new Date(Date.now() - 1000 * 60 * 6),
            likes: 8,
            replies: []
        },
        {
            id: 'sample_14',
            problemId: PROBLEM_ID,
            userId: 'sample_user_14',
            username: '数学嫌いだった社会人',
            type: 'feedback',
            text: '学生時代は数学が大嫌いでしたが、最近AI・機械学習を勉強していて数学の重要性を実感。こういう基礎からやり直してます。分かりやすい解説ありがとうございます！',
            timestamp: new Date(Date.now() - 1000 * 60 * 4),
            likes: 11,
            replies: []
        },
        {
            id: 'sample_15',
            problemId: PROBLEM_ID,
            userId: 'sample_user_15',
            username: '双子のママ',
            type: 'discussion',
            text: '双子の娘たちが中3で、2人とも数学で苦戦中😅 この解法、分かりやすいので今度教えてみます！ありがとうございます🙏',
            timestamp: new Date(Date.now() - 1000 * 60 * 2),
            likes: 6,
            replies: []
        }
    ];
    
    saveComments();
    console.log(`📝 サンプルコメント ${comments.length} 件を作成`);
}

function saveComments() {
    try {
        localStorage.setItem('comments_' + PROBLEM_ID, JSON.stringify(comments));
    } catch (error) {
        console.error('コメント保存エラー:', error);
    }
}

function renderComments() {
    const container = document.getElementById('commentsList');
    const countElement = document.getElementById('commentCount');
    const noComments = document.getElementById('noComments');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = `${comments.length}件のコメント`;
    }
    
    if (comments.length === 0) {
        if (noComments) noComments.style.display = 'block';
        return;
    } else {
        if (noComments) noComments.style.display = 'none';
    }
    
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        container.appendChild(commentElement);
    });
    
    console.log(`📋 ${comments.length} 件のコメントを表示`);
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
        <div class="comment-header-info">
            <span class="comment-author">👤 ${escapeHtml(comment.username)}</span>
            <div>
                <span class="comment-type ${comment.type}">${getCommentTypeLabel(comment.type)}</span>
                <span class="comment-time">${formatTime(comment.timestamp)}</span>
            </div>
        </div>
        <div class="comment-text">${escapeHtml(comment.text).replace(/\n/g, '<br>')}</div>
        <div class="comment-actions">
            <button class="btn btn-small" onclick="likeComment('${comment.id}')">
                👍 ${comment.likes}
            </button>
            <button class="btn btn-small" onclick="replyToComment('${comment.id}')">
                💬 返信
            </button>
            ${comment.userId === (currentUser?.id) ? 
                `<button class="btn btn-small btn-secondary" onclick="deleteComment('${comment.id}')">
                    🗑️ 削除
                </button>` : ''}
        </div>
    `;
    return div;
}

function getCommentTypeLabel(type) {
    const labels = {
        question: '❓ 質問',
        explanation: '💡 解説',
        hint: '🔍 ヒント',
        discussion: '💭 議論',
        feedback: '📝 フィードバック'
    };
    return labels[type] || type;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function submitComment() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const typeSelect = document.getElementById('commentType');
    const textArea = document.getElementById('commentText');
    
    if (!typeSelect || !textArea) {
        showNotification('コメントフォームが見つかりません', 'error');
        return;
    }
    
    const type = typeSelect.value;
    const text = textArea.value.trim();
    
    if (!text) {
        showNotification('コメント内容を入力してください', 'error');
        return;
    }
    
    const comment = {
        id: Date.now().toString(),
        problemId: PROBLEM_ID,
        userId: currentUser.id,
        username: currentUser.displayName,
        type: type,
        text: text,
        timestamp: new Date(),
        likes: 0,
        replies: []
    };
    
    comments.unshift(comment);
    saveComments();
    clearCommentForm();
    renderComments();
    showNotification('💬 コメントを投稿しました！', 'success');
}

function clearCommentForm() {
    const typeSelect = document.getElementById('commentType');
    const textArea = document.getElementById('commentText');
    
    if (typeSelect) typeSelect.value = 'question';
    if (textArea) textArea.value = '';
}

function likeComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.likes += 1;
        saveComments();
        renderComments();
        showNotification('いいね！を追加しました', 'success');
    }
}

function replyToComment(commentId) {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const reply = prompt('返信内容を入力してください:');
    if (reply && reply.trim()) {
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
            comment.replies.push({
                id: Date.now().toString(),
                userId: currentUser.id,
                username: currentUser.displayName,
                text: reply.trim(),
                timestamp: new Date()
            });
            saveComments();
            renderComments();
            showNotification('💬 返信を投稿しました', 'success');
        }
    }
}

function deleteComment(commentId) {
    if (confirm('このコメントを削除しますか？')) {
        comments = comments.filter(c => c.id !== commentId);
        saveComments();
        renderComments();
        showNotification('コメントを削除しました', 'info');
    }
}

function checkAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (!selectedAnswer) {
        showNotification('回答を選択してください', 'error');
        return;
    }
    
    const answer = selectedAnswer.value;
    const correct = answer === 'A'; // 正解はA) x = -2, -3
    
    if (correct) {
        showNotification('🎉 正解です！', 'success');
    } else {
        showNotification('❌ 不正解です。もう一度考えてみてください', 'error');
    }
    
    // 自動的にコメントを促す
    setTimeout(() => {
        if (currentUser) {
            if (confirm('解法についてコメントを残して他の学習者と議論してみませんか？')) {
                const commentForm = document.getElementById('commentForm');
                if (commentForm) {
                    commentForm.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }, 2000);
}

// デバッグ用関数
function resetData() {
    localStorage.removeItem('comments_' + PROBLEM_ID);
    comments = [];
    createSampleComments();
    renderComments();
    console.log('🔄 データをリセットしました');
}