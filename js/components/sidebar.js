/**
 * 統一サイドバーコンポーネント
 * 全ページで共通のサイドバーを生成
 */

class UnifiedSidebar {
    constructor() {
        this.container = null;
        this.isOpen = false;
        this.currentUser = null;
    }

    /**
     * 初期化
     */
    init() {
        // 現在のユーザー情報を取得
        this.getCurrentUser();

        // サイドバーコンテナを検索または作成
        this.container = document.querySelector('.right-sidebar');
        if (!this.container) {
            this.createSidebarContainer();
        }

        // サイドバーの内容を生成
        this.render();

        // トグルボタンを作成
        this.createToggleButton();

        // サイドバーの状態を復元
        this.restoreState();
    }

    /**
     * 現在のユーザー情報を取得
     */
    getCurrentUser() {
        if (typeof authManager !== 'undefined' && authManager) {
            this.currentUser = authManager.getCurrentUser();
        } else if (typeof window.getCurrentUser === 'function') {
            this.currentUser = window.getCurrentUser();
        } else {
            this.currentUser = null;
        }
    }

    /**
     * サイドバーコンテナを作成
     */
    createSidebarContainer() {
        const container = document.querySelector('.container');
        if (container) {
            this.container = document.createElement('div');
            this.container.className = 'right-sidebar';
            container.appendChild(this.container);
        }
    }

    /**
     * トグルボタンを作成
     */
    createToggleButton() {
        // 既存のトグルボタンがあれば削除
        const existingToggle = document.querySelector('.sidebar-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<span class="material-symbols-outlined icon">menu</span>';
        toggleBtn.onclick = () => this.toggle();
        document.body.appendChild(toggleBtn);
    }

    /**
     * サイドバーを描画
     */
    render() {
        if (!this.container) return;

        const username = this.currentUser?.username || this.currentUser?.id || 'ゲスト';
        const isLoggedIn = this.currentUser && !this.currentUser.isGuest;
        const currentTheme = localStorage.getItem('theme') || 'light';
        const currentPCMode = localStorage.getItem('pcMode') || 'off';

        this.container.innerHTML = `
            <!-- ユーザー情報カード -->
            <div class="sidebar-card">
                <span class="sidebar-doodle sidebar-doodle-1">
                    <span class="material-symbols-outlined icon">person</span>
                </span>
                <span class="sidebar-doodle sidebar-doodle-2">
                    <span class="material-symbols-outlined icon">star</span>
                </span>
                <h3 class="sidebar-title">ユーザー</h3>
                <div class="sidebar-content">
                    <div class="sidebar-user-info">
                        <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <span class="user-name">${username}</span>
                            <span class="user-status">${isLoggedIn ? '認証済み' : 'ゲスト'}</span>
                        </div>
                    </div>
                    ${isLoggedIn ? `
                        <a href="profile.html" class="sidebar-nav-btn">
                            <span class="material-symbols-outlined icon icon-small">account_circle</span>
                            プロフィール
                        </a>
                    ` : `
                        <a href="login.html" class="sidebar-nav-btn">
                            <span class="material-symbols-outlined icon icon-small">login</span>
                            ログイン
                        </a>
                    `}
                </div>
            </div>

            <!-- 学習進捗カード -->
            <div class="sidebar-card">
                <span class="sidebar-doodle sidebar-doodle-1">
                    <span class="material-symbols-outlined icon">trending_up</span>
                </span>
                <span class="sidebar-doodle sidebar-doodle-2">
                    <span class="material-symbols-outlined icon">emoji_events</span>
                </span>
                <h3 class="sidebar-title">学習進捗</h3>
                <div class="sidebar-content">
                    <div class="sidebar-streak">
                        <span class="sidebar-streak-number" id="sidebarStreak">0</span>問
                    </div>
                    <div class="sidebar-progress">
                        <div>正解率</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="accuracyBar" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- クイックアクションカード -->
            <div class="sidebar-card">
                <span class="sidebar-doodle sidebar-doodle-1">
                    <span class="material-symbols-rounded icon">rocket_launch</span>
                </span>
                <span class="sidebar-doodle sidebar-doodle-2">
                    <span class="material-symbols-rounded icon">bolt</span>
                </span>
                <h3 class="sidebar-title">クイックアクション</h3>
                <div class="sidebar-content">
                    <a href="subject-select.html" class="sidebar-nav-btn">
                        <span class="material-symbols-outlined icon icon-small">menu_book</span>
                        科目選択
                    </a>
                    <a href="english-menu.html" class="sidebar-nav-btn">
                        <span class="material-symbols-outlined icon icon-small">language</span>
                        英語
                    </a>
                    <a href="review.html" class="sidebar-nav-btn">
                        <span class="material-symbols-outlined icon icon-small">replay</span>
                        復習モード
                    </a>
                </div>
            </div>

            <!-- 設定カード -->
            <div class="sidebar-card">
                <span class="sidebar-doodle sidebar-doodle-1">
                    <span class="material-symbols-outlined icon">settings</span>
                </span>
                <span class="sidebar-doodle sidebar-doodle-2">
                    <span class="material-symbols-outlined icon">tune</span>
                </span>
                <h3 class="sidebar-title">設定</h3>
                <div class="sidebar-content">
                    <button class="sidebar-nav-btn" onclick="unifiedSidebar.toggleTheme()">
                        <span class="material-symbols-outlined icon icon-small">${currentTheme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                        <span>${currentTheme === 'dark' ? 'ライトモード' : 'ダークモード'}</span>
                    </button>
                    <button class="sidebar-nav-btn" onclick="unifiedSidebar.togglePCMode()">
                        <span class="material-symbols-outlined icon icon-small">${currentPCMode === 'on' ? 'smartphone' : 'desktop_windows'}</span>
                        <span>${currentPCMode === 'on' ? 'モバイル表示' : 'PC表示'}</span>
                    </button>
                    ${isLoggedIn ? `
                        <button class="sidebar-nav-btn" onclick="unifiedSidebar.logout()">
                            <span class="material-symbols-outlined icon icon-small">logout</span>
                            ログアウト
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * サイドバーの開閉
     */
    toggle() {
        if (!this.container) return;

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.container.classList.remove('sidebar-closed');
        } else {
            this.container.classList.add('sidebar-closed');
        }

        // 状態を保存
        localStorage.setItem('sidebarOpen', this.isOpen ? 'true' : 'false');

        // メインコンテンツの調整
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (this.isOpen) {
                mainContent.classList.remove('sidebar-closed');
            } else {
                mainContent.classList.add('sidebar-closed');
            }
        }
    }

    /**
     * サイドバーの状態を復元
     */
    restoreState() {
        const savedState = localStorage.getItem('sidebarOpen');

        // デフォルトはPC幅では開く、モバイルでは閉じる
        if (savedState === null) {
            this.isOpen = window.innerWidth > 768;
        } else {
            this.isOpen = savedState === 'true';
        }

        if (!this.isOpen) {
            this.container?.classList.add('sidebar-closed');
            document.querySelector('.main-content')?.classList.add('sidebar-closed');
        }
    }

    /**
     * テーマ切り替え
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // アニメーション効果
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

        // サイドバーを再描画してアイコンを更新
        this.render();
    }

    /**
     * PCモード切り替え
     */
    togglePCMode() {
        const isEnabled = document.documentElement.classList.contains('pc-mode');

        if (isEnabled) {
            document.documentElement.classList.remove('pc-mode');
            localStorage.setItem('pcMode', 'off');
        } else {
            document.documentElement.classList.add('pc-mode');
            localStorage.setItem('pcMode', 'on');
        }

        // サイドバーを再描画してアイコンを更新
        this.render();
    }

    /**
     * ログアウト
     */
    logout() {
        if (typeof authManager !== 'undefined' && authManager.logout) {
            authManager.logout();
        } else {
            // フォールバック: 直接ストレージをクリア
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }

    /**
     * 学習進捗を更新
     */
    updateProgress(count, accuracy) {
        const streakEl = document.getElementById('sidebarStreak');
        const accuracyBar = document.getElementById('accuracyBar');

        if (streakEl) {
            streakEl.textContent = count;
        }

        if (accuracyBar) {
            accuracyBar.style.width = `${accuracy}%`;
        }
    }
}

// グローバルインスタンス
const unifiedSidebar = new UnifiedSidebar();

// DOMContentLoadedで初期化
document.addEventListener('DOMContentLoaded', () => {
    // 認証準備完了を待つ
    if (window.authReady) {
        window.authReady.then(() => {
            unifiedSidebar.init();
        });
    } else {
        // 少し待ってから初期化（authManagerの読み込みを待つ）
        setTimeout(() => {
            unifiedSidebar.init();
        }, 100);
    }
});

// テーマとPCモードの初期設定
(function() {
    // テーマ
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // PCモード
    const savedPCMode = localStorage.getItem('pcMode') || 'off';
    if (savedPCMode === 'on') {
        document.documentElement.classList.add('pc-mode');
    }
})();
