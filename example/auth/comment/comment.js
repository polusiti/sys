/**
 * パスキー認証対応問題コメントシステム
 * PasskeyAuthと統合した現代的な認証システム
 */

class CommentSystem {
    constructor() {
        // PasskeyAuthインスタンスを取得
        this.auth = window.passkeyAuth;
        if (!this.auth) {
            console.error('PasskeyAuth が見つかりません');
            return;
        }
        
        // 状態管理
        this.currentUser = null;
        this.currentProblemId = 'math_001';
        this.comments = [];
        
        // DOM要素
        this.elements = {
            currentUser: document.getElementById('currentUser'),
            registerBtn: document.getElementById('registerBtn'),
            loginBtn: document.getElementById('loginBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            authModal: document.getElementById('authModal'),
            closeModal: document.getElementById('closeModal'),
            
            // パスキー登録フォーム
            regUsername: document.getElementById('regUsername'),
            displayName: document.getElementById('displayName'),
            registerPasskeyBtn: document.getElementById('registerPasskeyBtn'),
            
            // パスキーログインフォーム  
            quickLoginBtn: document.getElementById('quickLoginBtn'),
            userSelect: document.getElementById('userSelect'),
            userLoginBtn: document.getElementById('userLoginBtn'),
            
            // WebAuthn ステータス
            webauthnStatus: document.getElementById('webauthnStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            capabilityCheck: document.getElementById('capabilityCheck'),
            webauthnCheck: document.getElementById('webauthnCheck'),
            
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
        this.initializePasskeyUI();
        this.loadComments();
        
        // デモ用のサンプルコメント
        this.initializeSampleComments();
        
        console.log('🔐 パスキー認証対応コメントシステム初期化完了');
    }
    
    initializeEventListeners() {
        // パスキー認証関連
        this.elements.registerBtn?.addEventListener('click', () => this.showAuthModal('register'));
        this.elements.loginBtn?.addEventListener('click', () => this.showAuthModal('login'));
        this.elements.logoutBtn?.addEventListener('click', () => this.logout());
        this.elements.closeModal?.addEventListener('click', () => this.hideAuthModal());
        
        // パスキー登録・ログイン
        this.elements.registerPasskeyBtn?.addEventListener('click', () => this.registerPasskey());
        this.elements.quickLoginBtn?.addEventListener('click', () => this.quickLogin());
        this.elements.userLoginBtn?.addEventListener('click', () => this.userSpecificLogin());
        
        // コメント関連
        this.elements.postComment?.addEventListener('click', () => this.postComment());
        this.elements.cancelComment?.addEventListener('click', () => this.cancelComment());
        this.elements.refreshComments?.addEventListener('click', () => this.loadComments());
        
        // 回答提出
        this.elements.submitAnswer?.addEventListener('click', () => this.submitAnswer());
        
        // モーダル外クリックで閉じる
        this.elements.authModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.authModal) {
                this.hideAuthModal();
            }
        });
        
        // モードセレクター
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthMode(e.target.dataset.mode));
        });
        
        // Enterキーでの操作
        this.elements.regUsername?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.elements.displayName?.focus();
        });
        
        this.elements.displayName?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.registerPasskey();
        });
    }
    
    // パスキー認証システム
    initializePasskeyUI() {
        // WebAuthn対応状況を更新
        this.updateWebAuthnStatus();
        
        // 登録済みユーザー一覧を更新
        this.updateRegisteredUsersList();
        
        // 既存ログインユーザーをチェック
        const currentUser = this.auth.getCurrentUser();
        if (currentUser) {
            this.currentUser = currentUser;
            this.updateUserInterface();
            console.log('🔐 既存ユーザーでログイン済み:', currentUser.username);
        }
    }
    
    updateWebAuthnStatus() {
        if (this.auth.isWebAuthnSupported) {
            this.elements.statusIndicator.textContent = '✅ WebAuthn対応ブラウザ';
            this.elements.statusIndicator.className = 'status-indicator supported';
            this.elements.webauthnCheck.textContent = '✅ WebAuthn API対応';
            this.elements.webauthnCheck.className = 'check-item supported';
        } else {
            this.elements.statusIndicator.textContent = '❌ WebAuthn非対応';
            this.elements.statusIndicator.className = 'status-indicator not-supported';
            this.elements.webauthnCheck.textContent = '❌ WebAuthn API非対応';
            this.elements.webauthnCheck.className = 'check-item not-supported';
        }
    }
    
    updateRegisteredUsersList() {
        const users = this.auth.getRegisteredUsers();
        const userSelect = this.elements.userSelect;
        const registeredUsers = document.getElementById('registeredUsers');
        const usersList = document.getElementById('usersList');
        
        // ユーザー選択セレクトボックス更新
        userSelect.innerHTML = '<option value="">特定のユーザーでログイン...</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.displayName} (@${user.username})`;
            userSelect.appendChild(option);
        });
        
        // 登録済みユーザー表示
        if (users.length > 0) {
            registeredUsers.style.display = 'block';
            usersList.innerHTML = '';
            
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-quick-login';
                userDiv.innerHTML = `
                    <div>
                        <div class="user-name">${user.displayName}</div>
                        <div class="last-used">最終利用: ${this.formatTime(user.lastUsed)}</div>
                    </div>
                    <button class="btn btn-small btn-primary" onclick="commentSystem.quickLoginUser('${user.username}')">
                        🚀 ログイン
                    </button>
                `;
                usersList.appendChild(userDiv);
            });
        } else {
            registeredUsers.style.display = 'none';
        }
    }

    showAuthModal(mode = 'register') {
        this.elements.authModal.style.display = 'block';
        this.switchAuthMode(mode);
    }
    
    hideAuthModal() {
        this.elements.authModal.style.display = 'none';
        this.clearAuthForm();
    }
    
    switchAuthMode(mode) {
        // モードボタン更新
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // フォーム表示切り替え
        const registerForm = document.getElementById('registerForm');
        const loginForm = document.getElementById('loginForm');
        
        if (mode === 'register') {
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            document.getElementById('modalTitle').textContent = '🔑 パスキー登録';
            this.elements.regUsername.focus();
        } else {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('modalTitle').textContent = '🚀 パスキーログイン';
        }
    }
    
    clearAuthForm() {
        this.elements.regUsername.value = '';
        this.elements.displayName.value = '';
    }
    
    async registerPasskey() {
        const username = this.elements.regUsername.value.trim();
        const displayName = this.elements.displayName.value.trim();
        
        if (!username || !displayName) {
            this.showNotification('ユーザー名と表示名を入力してください', 'error');
            return;
        }
        
        if (!this.validateUsername(username)) {
            this.showNotification('ユーザー名は英数字のみ使用できます', 'error');
            return;
        }
        
        try {
            this.showNotification('🔐 パスキー登録中...', 'info');
            const user = await this.auth.registerPasskey(username, displayName);
            
            this.currentUser = user;
            this.updateUserInterface();
            this.updateRegisteredUsersList();
            this.hideAuthModal();
            
            this.showNotification(`🎉 ${displayName}さん、パスキー登録完了！`, 'success');
            console.log('✅ パスキー登録成功:', user);
            
        } catch (error) {
            console.error('パスキー登録エラー:', error);
            this.showNotification(`登録に失敗しました: ${error.message}`, 'error');
        }
    }
    
    async quickLogin() {
        try {
            this.showNotification('🔐 パスキー認証中...', 'info');
            const user = await this.auth.authenticatePasskey();
            
            this.currentUser = user;
            this.updateUserInterface();
            this.hideAuthModal();
            
            this.showNotification(`🚀 ${user.displayName}さん、ログイン成功！`, 'success');
            console.log('✅ クイックログイン成功:', user);
            
        } catch (error) {
            console.error('クイックログインエラー:', error);
            this.showNotification(`ログインに失敗しました: ${error.message}`, 'error');
        }
    }
    
    async userSpecificLogin() {
        const username = this.elements.userSelect.value;
        if (!username) {
            this.showNotification('ユーザーを選択してください', 'error');
            return;
        }
        
        try {
            this.showNotification(`🔐 ${username}でログイン中...`, 'info');
            const user = await this.auth.authenticatePasskey(username);
            
            this.currentUser = user;
            this.updateUserInterface();
            this.hideAuthModal();
            
            this.showNotification(`🚀 ${user.displayName}さん、ログイン成功！`, 'success');
            console.log('✅ ユーザー指定ログイン成功:', user);
            
        } catch (error) {
            console.error('ユーザー指定ログインエラー:', error);
            this.showNotification(`ログインに失敗しました: ${error.message}`, 'error');
        }
    }
    
    async quickLoginUser(username) {
        try {
            this.showNotification(`🔐 ${username}でログイン中...`, 'info');
            const user = await this.auth.authenticatePasskey(username);
            
            this.currentUser = user;
            this.updateUserInterface();
            
            this.showNotification(`🚀 ${user.displayName}さん、ログイン成功！`, 'success');
            console.log('✅ クイックユーザーログイン成功:', user);
            
        } catch (error) {
            console.error('クイックユーザーログインエラー:', error);
            this.showNotification(`ログインに失敗しました: ${error.message}`, 'error');
        }
    }
    
    logout() {
        this.auth.logout();
        this.currentUser = null;
        this.updateUserInterface();
        this.showNotification('👋 ログアウトしました', 'info');
        console.log('👋 ログアウト完了');
    }
    
    validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        return usernameRegex.test(username) && username.length >= 3 && username.length <= 20;
    }
    
    updateUserInterface() {
        if (this.currentUser) {
            this.elements.currentUser.textContent = this.currentUser.displayName || this.currentUser.username;
            this.elements.registerBtn.style.display = 'none';
            this.elements.loginBtn.style.display = 'none';
            this.elements.logoutBtn.style.display = 'inline-block';
            this.elements.commentForm.style.display = 'block';
            this.elements.loginPrompt.style.display = 'none';
        } else {
            this.elements.currentUser.textContent = '未認証';
            this.elements.registerBtn.style.display = 'inline-block';
            this.elements.loginBtn.style.display = 'inline-block';
            this.elements.logoutBtn.style.display = 'none';
            this.elements.commentForm.style.display = 'none';
            this.elements.loginPrompt.style.display = 'block';
        }
    }
    
    // コメントシステム
    async postComment() {
        if (!this.currentUser) {
            this.showAuthModal('login');
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
            this.showAuthModal('login');
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
                text: 'この問題は因数分解で解けます！\\nx² + 5x + 6 = (x + 2)(x + 3) = 0\\nなので x = -2 または x = -3 が答えです。',
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
                timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15分前
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
                timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分前
                likes: 8,
                replies: []
            }
        ];
        
        // 既存のコメントがない場合のみサンプルを追加
        if (this.comments.length === 0) {
            this.comments = sampleComments;
            this.saveCommentsToStorage();
        }
    }
}

// グローバル変数として初期化
let commentSystem;

// DOMが読み込まれた後に初期化
document.addEventListener('DOMContentLoaded', () => {
    commentSystem = new CommentSystem();
    console.log('🚀 コメントシステムが初期化されました');
});