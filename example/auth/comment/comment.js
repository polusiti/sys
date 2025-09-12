/**
 * シンプル認証対応コメントシステム
 * ID/パスワード認証でのテスト実装
 */

class CommentSystem {
    constructor() {
        // 状態管理
        this.currentUser = null;
        this.currentProblemId = 'math_001';
        this.comments = [];
        
        // DOM要素
        this.elements = {
            currentUser: document.getElementById('currentUser'),
            loginBtn: document.getElementById('loginBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            authModal: document.getElementById('authModal'),
            closeModal: document.getElementById('closeModal'),
            
            // 認証フォーム
            userId: document.getElementById('userId'),
            password: document.getElementById('password'),
            authenticateBtn: document.getElementById('authenticateBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            
            // コメントシステム
            commentForm: document.getElementById('commentForm'),
            loginPrompt: document.getElementById('loginPrompt'),
            commentType: document.getElementById('commentType'),
            commentText: document.getElementById('commentText'),
            postComment: document.getElementById('postComment'),
            cancelComment: document.getElementById('cancelComment'),
            
            commentsList: document.getElementById('commentsList'),
            commentCount: document.getElementById('commentCount'),
            refreshComments: document.getElementById('refreshComments'),
            commentsLoading: document.getElementById('commentsLoading'),
            noComments: document.getElementById('noComments'),
            
            submitAnswer: document.getElementById('submitAnswer')
        };
        
        this.initializeEventListeners();
        this.loadComments();
        this.initializeSampleComments();
        
        console.log('💬 シンプル認証コメントシステム初期化完了');
    }
    
    initializeEventListeners() {
        console.log('🔧 イベントリスナー初期化中...');
        
        // DOM要素の存在確認
        console.log('DOM要素チェック:', {
            loginBtn: !!this.elements.loginBtn,
            logoutBtn: !!this.elements.logoutBtn,
            closeModal: !!this.elements.closeModal,
            cancelBtn: !!this.elements.cancelBtn,
            authenticateBtn: !!this.elements.authenticateBtn
        });
        
        // 認証関連
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                console.log('🔑 ログインボタンクリック');
                this.showAuthModal();
            });
        } else {
            console.error('❌ loginBtnが見つかりません');
        }
        
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                console.log('👋 ログアウトボタンクリック');
                this.logout();
            });
        }
        
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => {
                console.log('❌ モーダル閉じるボタンクリック');
                this.hideAuthModal();
            });
        }
        
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', () => {
                console.log('❌ キャンセルボタンクリック');
                this.hideAuthModal();
            });
        }
        
        // 認証実行
        if (this.elements.authenticateBtn) {
            this.elements.authenticateBtn.addEventListener('click', () => {
                console.log('🔐 認証ボタンクリック');
                this.authenticate();
            });
        } else {
            console.error('❌ authenticateBtnが見つかりません');
        }
        
        // コメント関連
        if (this.elements.postComment) {
            this.elements.postComment.addEventListener('click', () => this.postComment());
        }
        if (this.elements.cancelComment) {
            this.elements.cancelComment.addEventListener('click', () => this.cancelComment());
        }
        if (this.elements.refreshComments) {
            this.elements.refreshComments.addEventListener('click', () => this.loadComments());
        }
        
        // 回答提出
        if (this.elements.submitAnswer) {
            this.elements.submitAnswer.addEventListener('click', () => this.submitAnswer());
        }
        
        // モーダル外クリックで閉じる
        if (this.elements.authModal) {
            this.elements.authModal.addEventListener('click', (e) => {
                if (e.target === this.elements.authModal) {
                    this.hideAuthModal();
                }
            });
        }
        
        // Enterキーでの操作
        if (this.elements.userId) {
            this.elements.userId.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.elements.password?.focus();
            });
        }
        
        if (this.elements.password) {
            this.elements.password.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.authenticate();
            });
        }
        
        console.log('✅ イベントリスナー初期化完了');
    }
    
    // シンプル認証システム
    showAuthModal() {
        this.elements.authModal.style.display = 'block';
        this.elements.userId.focus();
    }
    
    hideAuthModal() {
        this.elements.authModal.style.display = 'none';
        this.clearAuthForm();
    }
    
    clearAuthForm() {
        this.elements.userId.value = '';
        this.elements.password.value = '';
    }
    
    async authenticate() {
        const userId = this.elements.userId.value.trim();
        const password = this.elements.password.value.trim();
        
        if (!userId || !password) {
            this.showNotification('ユーザーIDとパスワードを入力してください', 'error');
            return;
        }
        
        // テスト用認証: ID=1, Password=123
        if (userId === '1' && password === '123') {
            this.currentUser = {
                id: '1',
                username: 'testuser',
                displayName: 'テストユーザー',
                loginTime: new Date().toISOString()
            };
            
            this.updateUserInterface();
            this.hideAuthModal();
            this.showNotification(`${this.currentUser.displayName}さん、ログインしました！`, 'success');
            console.log('✅ ログイン成功:', this.currentUser);
            
        } else {
            this.showNotification('ユーザーIDまたはパスワードが間違っています', 'error');
            console.log('❌ ログイン失敗: 無効な認証情報');
        }
    }
    
    logout() {
        this.currentUser = null;
        this.updateUserInterface();
        this.showNotification('👋 ログアウトしました', 'info');
        console.log('👋 ログアウト完了');
    }
    
    updateUserInterface() {
        if (this.currentUser) {
            this.elements.currentUser.textContent = this.currentUser.displayName || this.currentUser.username;
            this.elements.loginBtn.style.display = 'none';
            this.elements.logoutBtn.style.display = 'inline-block';
            this.elements.commentForm.style.display = 'block';
            this.elements.loginPrompt.style.display = 'none';
        } else {
            this.elements.currentUser.textContent = '未認証';
            this.elements.loginBtn.style.display = 'inline-block';
            this.elements.logoutBtn.style.display = 'none';
            this.elements.commentForm.style.display = 'none';
            this.elements.loginPrompt.style.display = 'block';
        }
    }
    
    // コメントシステム
    async postComment() {
        if (!this.currentUser) {
            this.showAuthModal();
            return;
        }
        
        const type = this.elements.commentType.value;
        const text = this.elements.commentText.value.trim();
        
        if (!text) {
            this.showNotification('コメント内容を入力してください', 'error');
            return;
        }
        
        const comment = {
            id: Date.now().toString(),
            problemId: this.currentProblemId,
            userId: this.currentUser.id,
            username: this.currentUser.displayName || this.currentUser.username,
            type: type,
            text: text,
            timestamp: new Date(),
            likes: 0,
            replies: []
        };
        
        // コメントを保存（実際の実装ではサーバーに送信）
        this.comments.unshift(comment);
        this.saveCommentsToStorage();
        
        // UIを更新
        this.cancelComment();
        this.renderComments();
        this.showNotification('💬 コメントを投稿しました！', 'success');
    }
    
    cancelComment() {
        this.elements.commentText.value = '';
        this.elements.commentType.value = 'question';
    }
    
    async loadComments() {
        this.showCommentsLoading(true);
        
        // ローカルストレージからコメントを読み込み
        try {
            const savedComments = localStorage.getItem('comments_' + this.currentProblemId);
            if (savedComments) {
                this.comments = JSON.parse(savedComments);
            }
        } catch (error) {
            console.error('コメント読み込みエラー:', error);
        }
        
        // 読み込み遅延をシミュレート
        setTimeout(() => {
            this.showCommentsLoading(false);
            this.renderComments();
        }, 500);
    }
    
    saveCommentsToStorage() {
        try {
            localStorage.setItem('comments_' + this.currentProblemId, JSON.stringify(this.comments));
        } catch (error) {
            console.error('コメント保存エラー:', error);
        }
    }
    
    renderComments() {
        const container = this.elements.commentsList;
        container.innerHTML = '';
        
        // コメント数を更新
        this.elements.commentCount.textContent = `${this.comments.length}件のコメント`;
        
        if (this.comments.length === 0) {
            this.elements.noComments.style.display = 'block';
            return;
        } else {
            this.elements.noComments.style.display = 'none';
        }
        
        this.comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            container.appendChild(commentElement);
        });
    }
    
    createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML = `
            <div class="comment-header-info">
                <span class="comment-author">👤 ${comment.username}</span>
                <div>
                    <span class="comment-type ${comment.type}">${this.getCommentTypeLabel(comment.type)}</span>
                    <span class="comment-time">${this.formatTime(comment.timestamp)}</span>
                </div>
            </div>
            <div class="comment-text">${this.escapeHtml(comment.text)}</div>
            <div class="comment-actions">
                <button class="btn btn-small" onclick="commentSystem.likeComment('${comment.id}')">
                    👍 ${comment.likes}
                </button>
                <button class="btn btn-small" onclick="commentSystem.replyToComment('${comment.id}')">
                    💬 返信
                </button>
                ${comment.userId === (this.currentUser?.id) ? 
                    `<button class="btn btn-small btn-secondary" onclick="commentSystem.deleteComment('${comment.id}')">
                        🗑️ 削除
                    </button>` : ''}
            </div>
        `;
        return div;
    }
    
    getCommentTypeLabel(type) {
        const labels = {
            question: '❓ 質問',
            explanation: '💡 解説',
            hint: '🔍 ヒント',
            discussion: '💭 議論',
            feedback: '📝 フィードバック'
        };
        return labels[type] || type;
    }
    
    formatTime(timestamp) {
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
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\\n/g, '<br>');
    }
    
    showCommentsLoading(show) {
        this.elements.commentsLoading.style.display = show ? 'block' : 'none';
    }
    
    // コメントアクション
    async likeComment(commentId) {
        const comment = this.comments.find(c => c.id === commentId);
        if (comment) {
            comment.likes += 1;
            this.saveCommentsToStorage();
            this.renderComments();
            this.showNotification('いいね！を追加しました', 'success');
        }
    }
    
    async replyToComment(commentId) {
        if (!this.currentUser) {
            this.showAuthModal();
            return;
        }
        
        const reply = prompt('返信内容を入力してください:');
        if (reply && reply.trim()) {
            const comment = this.comments.find(c => c.id === commentId);
            if (comment) {
                comment.replies.push({
                    id: Date.now().toString(),
                    userId: this.currentUser.id,
                    username: this.currentUser.displayName || this.currentUser.username,
                    text: reply.trim(),
                    timestamp: new Date()
                });
                this.saveCommentsToStorage();
                this.renderComments();
                this.showNotification('💬 返信を投稿しました', 'success');
            }
        }
    }
    
    async deleteComment(commentId) {
        if (confirm('このコメントを削除しますか？')) {
            this.comments = this.comments.filter(c => c.id !== commentId);
            this.saveCommentsToStorage();
            this.renderComments();
            this.showNotification('コメントを削除しました', 'info');
        }
    }
    
    // 回答システム
    submitAnswer() {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked');
        if (!selectedAnswer) {
            alert('回答を選択してください');
            return;
        }
        
        const answer = selectedAnswer.value;
        const correct = answer === 'A'; // 正解はA) x = -2, -3
        
        if (correct) {
            this.showNotification('🎉 正解です！', 'success');
        } else {
            this.showNotification('❌ 不正解です。もう一度考えてみてください', 'error');
        }
        
        // 自動的にコメントを促す
        setTimeout(() => {
            if (this.currentUser) {
                alert('解法についてコメントを残して他の学習者と議論してみませんか？');
            }
        }, 2000);
    }
    
    // 通知システム
    showNotification(message, type = 'info') {
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // サンプルデータの初期化
    initializeSampleComments() {
        const sampleComments = [
            {
                id: 'sample_1',
                problemId: this.currentProblemId,
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
                problemId: this.currentProblemId,
                userId: 'sample_user_2',
                username: '学習花子',
                type: 'question',
                text: '因数分解のやり方がよく分かりません。もう少し詳しく教えてもらえますか？',
                timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25分前
                likes: 2,
                replies: []
            },
            {
                id: 'sample_3',
                problemId: this.currentProblemId,
                userId: 'sample_user_3',
                username: '解法マスター',
                type: 'hint',
                text: '💡 ヒント：x² + 5x + 6 で、2つの数の積が6、和が5になる数を見つけてみてください。2と3がポイントです！',
                timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20分前
                likes: 8,
                replies: []
            },
            {
                id: 'sample_4',
                problemId: this.currentProblemId,
                userId: 'sample_user_4',
                username: '中学生みき',
                type: 'question',
                text: '答えがマイナスになるのはなぜですか？普通の数じゃだめなんですか？',
                timestamp: new Date(Date.now() - 1000 * 60 * 18), // 18分前
                likes: 1,
                replies: []
            },
            {
                id: 'sample_5',
                problemId: this.currentProblemId,
                userId: 'sample_user_5',
                username: '先生A',
                type: 'explanation',
                text: '素晴らしい質問ですね！方程式 x² + 5x + 6 = 0 は「xの値を求めよ」という問題です。この場合、x = -2 と x = -3 を代入すると式が0になることを確認できます。実際に代入してみましょう：\n(-2)² + 5×(-2) + 6 = 4 - 10 + 6 = 0 ✓',
                timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15分前
                likes: 12,
                replies: []
            },
            {
                id: 'sample_6',
                problemId: this.currentProblemId,
                userId: 'sample_user_6',
                username: '高校生けん',
                type: 'discussion',
                text: '解の公式を使って解くこともできますよね。x = (-5 ± √(25-24)) / 2 = (-5 ± 1) / 2 で、x = -2, -3 になります。',
                timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12分前
                likes: 6,
                replies: []
            },
            {
                id: 'sample_7',
                problemId: this.currentProblemId,
                userId: 'sample_user_7',
                username: 'プログラマーさとし',
                type: 'feedback',
                text: 'この問題、プログラムで解を確認してみました！\nfor (let x = -10; x <= 10; x++) {\n  if (x*x + 5*x + 6 === 0) console.log(x);\n}\n結果: -3, -2 が出力されました。数学とプログラミングって繋がってますね！',
                timestamp: new Date(Date.now() - 1000 * 60 * 8), // 8分前
                likes: 9,
                replies: []
            },
            {
                id: 'sample_8',
                problemId: this.currentProblemId,
                userId: 'sample_user_8',
                username: 'ママ友ゆき',
                type: 'discussion',
                text: '息子に教えるのに苦労してます💦 因数分解って社会人になっても使うんですか？',
                timestamp: new Date(Date.now() - 1000 * 60 * 6), // 6分前
                likes: 3,
                replies: []
            },
            {
                id: 'sample_9',
                problemId: this.currentProblemId,
                userId: 'sample_user_9',
                username: '数学博士',
                type: 'explanation',
                text: 'はい、因数分解は様々な分野で活用されています！\n・コンピューターサイエンス（暗号化）\n・工学（信号処理、制御理論）\n・経済学（最適化問題）\n・物理学（波動方程式）\n基礎的な数学こそ、応用範囲が広いのです。',
                timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4分前
                likes: 15,
                replies: []
            },
            {
                id: 'sample_10',
                problemId: this.currentProblemId,
                userId: 'sample_user_10',
                username: '受験生りく',
                type: 'hint',
                text: '覚え方のコツ：「かけて6、足して5」と覚えると良いですよ！\n1×6=6, 1+6=7 ❌\n2×3=6, 2+3=5 ✅\nこれで (x+2)(x+3) だとわかります！',
                timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2分前
                likes: 4,
                replies: []
            }
        ];
        
        // 既存のコメントがない場合のみサンプルを追加
        if (this.comments.length === 0) {
            this.comments = sampleComments;
            this.saveCommentsToStorage();
            console.log('📝 サンプルコメント', sampleComments.length, '件を追加しました');
        } else {
            console.log('📝 既存コメント', this.comments.length, '件を読み込みました');
        }
    }
    
    // デバッグ用：データをリセット
    resetData() {
        localStorage.removeItem('comments_' + this.currentProblemId);
        this.comments = [];
        this.initializeSampleComments();
        this.renderComments();
        console.log('🔄 データをリセットしました');
    }
}

// グローバル変数として初期化
let commentSystem;

// DOMが読み込まれた後に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM読み込み完了');
    
    // 少し待ってから初期化（他のリソースの読み込み待ち）
    setTimeout(() => {
        try {
            commentSystem = new CommentSystem();
            console.log('🚀 コメントシステムが初期化されました');
            
            // 初期化後にUIを更新
            commentSystem.updateUserInterface();
        } catch (error) {
            console.error('❌ コメントシステム初期化エラー:', error);
        }
    }, 100);
});