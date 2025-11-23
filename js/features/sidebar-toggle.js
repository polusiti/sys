/**
 * サイドバートグル機能
 * デフォルトでサイドバーを非表示にし、タップで開閉する
 */

class SidebarToggle {
    constructor() {
        this.sidebar = null;
        this.mainContent = null;
        this.toggleButton = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        // DOM要素を取得
        this.sidebar = document.querySelector('.right-sidebar');
        this.mainContent = document.querySelector('.main-content');

        if (!this.sidebar) {
            console.log('❌ Sidebar not found');
            return;
        }

        // トグルボタンを作成
        this.createToggleButton();

        // デフォルトでサイドバーを閉じる
        this.closeSidebar();

        // イベントリスナーを設定
        this.setupEventListeners();

        console.log('✅ Sidebar toggle initialized');
    }

    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'sidebar-toggle';
        this.toggleButton.setAttribute('aria-label', 'サイドバーを開閉');
        this.toggleButton.innerHTML = `
            <span class="material-symbols-rounded icon">menu_open</span>
        `;

        document.body.appendChild(this.toggleButton);
    }

    setupEventListeners() {
        // トグルボタンのクリック（モバイルとデスクトップ両対応）
        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        // PWA対応: タッチイベントを追加
        let touchStartTime = 0;
        this.toggleButton.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        }, { passive: true });

        this.toggleButton.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            // 短いタップのみを処理（長押しやスワイプを除外）
            if (touchDuration < 500) {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            }
        }, { passive: false });

        // Escapeキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });

        // サイドバー外クリックで閉じる（モバイルのみ）
        if (window.innerWidth <= 768) {
            document.addEventListener('click', (e) => {
                if (this.isOpen &&
                    !this.sidebar.contains(e.target) &&
                    !this.toggleButton.contains(e.target)) {
                    this.closeSidebar();
                }
            });
        }

        // ウィンドウリサイズ時の処理
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                // デスクトップではオーバーレイを解除
                this.removeOverlay();
            } else {
                // モバイルではオーバーレイを追加
                if (this.isOpen) {
                    this.addOverlay();
                }
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebar.classList.remove('sidebar-closed');
        this.mainContent?.classList.remove('sidebar-closed');

        // アイコンを変更
        this.toggleButton.innerHTML = `
            <span class="material-symbols-rounded icon">close</span>
        `;

        this.isOpen = true;

        // モバイルではオーバーレイを追加
        if (window.innerWidth <= 768) {
            this.addOverlay();
        }

        // フォーカスをサイドバーに移動
        this.sidebar.focus();

        console.log('📂 Sidebar opened');
    }

    closeSidebar() {
        this.sidebar.classList.add('sidebar-closed');
        this.mainContent?.classList.add('sidebar-closed');

        // アイコンを変更
        this.toggleButton.innerHTML = `
            <span class="material-symbols-rounded icon">menu_open</span>
        `;

        this.isOpen = false;

        // オーバーレイを削除
        this.removeOverlay();

        console.log('📁 Sidebar closed');
    }

    addOverlay() {
        this.removeOverlay(); // 既存のオーバーレイを削除

        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(overlay);

        // フェードイン
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);

        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    }

    removeOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new SidebarToggle();
});

// エクスポート（他のスクリプトから使用する場合）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarToggle;
}