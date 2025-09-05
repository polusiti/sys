// PWA管理クラス
class PWAManager {
    constructor() {
        this.isStandalone = false;
        this.deferredPrompt = null;
        this.registration = null;
        this.init();
    }

    async init() {
        this.checkDisplayMode();
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupNotifications();
        this.setupPeriodicSync();
        this.handleOfflineStorage();
    }

    // 表示モードの確認
    checkDisplayMode() {
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
        
        if (this.isStandalone) {
            document.body.classList.add('pwa-standalone');
            console.log('PWAスタンドアロンモードで実行中');
        }
    }

    // Service Workerの登録
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/tools/question-manager/sw.js', {
                    scope: '/tools/question-manager/'
                });

                console.log('Service Worker registered:', this.registration);

                // Service Workerの更新チェック
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateAvailable();
                            }
                        });
                    }
                });

                // メッセージの受信
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // インストールプロンプトの設定
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWAがインストールされました');
            this.hideInstallButton();
            this.showSuccessMessage('アプリがインストールされました！');
        });
    }

    // インストールボタンの表示
    showInstallButton() {
        // 既存のインストールボタンがあるかチェック
        if (document.getElementById('pwaInstallButton')) return;

        const button = document.createElement('button');
        button.id = 'pwaInstallButton';
        button.className = 'btn btn-primary';
        button.innerHTML = '📱 アプリをインストール';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        button.onclick = this.installPWA.bind(this);

        document.body.appendChild(button);

        // 5秒後に自動的に隠す
        setTimeout(() => {
            if (button.parentNode) {
                button.style.opacity = '0.7';
            }
        }, 5000);
    }

    // インストールボタンの非表示
    hideInstallButton() {
        const button = document.getElementById('pwaInstallButton');
        if (button) {
            button.remove();
        }
    }

    // PWAのインストール
    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('ユーザーがインストールを承諾');
                this.trackEvent('pwa_install_accepted');
            } else {
                console.log('ユーザーがインストールをキャンセル');
                this.trackEvent('pwa_install_rejected');
            }

            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }

    // 通知の設定
    async setupNotifications() {
        if ('Notification' in window) {
            const permission = await this.requestNotificationPermission();
            if (permission === 'granted') {
                console.log('通知許可を取得');
            }
        }
    }

    // 通知許可の要求
    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            return await Notification.requestPermission();
        }
        return Notification.permission;
    }

    // ローカル通知の送信
    showLocalNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            const defaultOptions = {
                icon: '/tools/question-manager/icons/icon-192.png',
                badge: '/tools/question-manager/icons/badge-72.png',
                tag: 'question-manager',
                requireInteraction: false,
                ...options
            };

            new Notification(title, defaultOptions);
        }
    }

    // 定期同期の設定
    async setupPeriodicSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                await this.registration.sync.register('question-sync');
                console.log('バックグラウンド同期を登録');
            } catch (error) {
                console.error('バックグラウンド同期の登録に失敗:', error);
            }
        }
    }

    // オフライン用ストレージの処理
    handleOfflineStorage() {
        // オンライン/オフライン状態の監視
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

        // 初期状態の設定
        if (navigator.onLine) {
            this.handleOnline();
        } else {
            this.handleOffline();
        }
    }

    // オンライン時の処理
    handleOnline() {
        console.log('オンラインになりました');
        document.body.classList.remove('offline');
        document.body.classList.add('online');

        // 待機中のデータを同期
        this.syncPendingData();

        // 通知を表示
        this.showLocalNotification('接続が復帰しました', {
            body: 'オフライン中の変更を同期しています...',
            icon: '/tools/question-manager/icons/online.png'
        });
    }

    // オフライン時の処理
    handleOffline() {
        console.log('オフラインになりました');
        document.body.classList.remove('online');
        document.body.classList.add('offline');

        // オフライン通知
        this.showLocalNotification('オフラインモード', {
            body: '一部機能が制限されますが、閲覧と編集は継続できます',
            icon: '/tools/question-manager/icons/offline.png'
        });
    }

    // 待機中データの同期
    async syncPendingData() {
        const pendingData = this.getPendingOfflineData();
        
        for (const data of pendingData) {
            try {
                await this.uploadData(data);
                this.removePendingData(data.id);
            } catch (error) {
                console.error('データ同期エラー:', error);
            }
        }
    }

    // オフラインデータの取得
    getPendingOfflineData() {
        const data = localStorage.getItem('pending_sync_data');
        return data ? JSON.parse(data) : [];
    }

    // 待機データの削除
    removePendingData(id) {
        const pending = this.getPendingOfflineData();
        const filtered = pending.filter(item => item.id !== id);
        localStorage.setItem('pending_sync_data', JSON.stringify(filtered));
    }

    // データのアップロード
    async uploadData(data) {
        const response = await fetch('/tools/question-manager/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    }

    // Service Workerからのメッセージ処理
    handleServiceWorkerMessage(event) {
        const { type, payload } = event.data;

        switch (type) {
            case 'SYNC_COMPLETE':
                this.showSuccessMessage('データ同期が完了しました');
                break;
            case 'CACHE_UPDATED':
                this.showUpdateAvailable();
                break;
            case 'OFFLINE_READY':
                console.log('オフライン機能が準備完了');
                break;
            default:
                console.log('Service Worker message:', event.data);
        }
    }

    // アップデート通知の表示
    showUpdateAvailable() {
        const banner = document.createElement('div');
        banner.className = 'update-banner';
        banner.innerHTML = `
            <div style="background: #1e40af; color: white; padding: 12px 20px; position: fixed; top: 0; left: 0; right: 0; z-index: 9999; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                <span>新しいバージョンが利用可能です</span>
                <button onclick="location.reload()" style="background: white; color: #1e40af; border: none; padding: 6px 12px; margin-left: 15px; border-radius: 4px; cursor: pointer;">
                    更新
                </button>
                <button onclick="this.parentNode.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 6px 12px; margin-left: 8px; border-radius: 4px; cursor: pointer;">
                    後で
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
    }

    // 成功メッセージの表示
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #22c55e;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 分析イベントの追跡
    trackEvent(eventName, properties = {}) {
        // 実際の分析ツールとの連携
        console.log('PWA Event:', eventName, properties);
        
        // ローカル分析データの保存
        const analyticsData = JSON.parse(localStorage.getItem('pwa_analytics') || '[]');
        analyticsData.push({
            event: eventName,
            properties,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            isStandalone: this.isStandalone
        });
        
        // 最新1000件のみ保持
        if (analyticsData.length > 1000) {
            analyticsData.splice(0, analyticsData.length - 1000);
        }
        
        localStorage.setItem('pwa_analytics', JSON.stringify(analyticsData));
    }

    // PWA機能の有効/無効チェック
    getPWACapabilities() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            notifications: 'Notification' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            pushMessaging: 'serviceWorker' in navigator && 'PushManager' in window,
            installPrompt: this.deferredPrompt !== null,
            standalone: this.isStandalone,
            offlineStorage: 'localStorage' in window && 'indexedDB' in window
        };
    }

    // デバッグ情報の取得
    getDebugInfo() {
        return {
            capabilities: this.getPWACapabilities(),
            registration: this.registration ? {
                scope: this.registration.scope,
                updateViaCache: this.registration.updateViaCache,
                active: !!this.registration.active
            } : null,
            networkStatus: navigator.onLine,
            displayMode: this.isStandalone ? 'standalone' : 'browser',
            userAgent: navigator.userAgent,
            cacheStatus: 'caches' in window
        };
    }
}

// PWA管理をグローバルに公開
window.PWAManager = PWAManager;

// 自動初期化（HTMLファイルで個別に無効化可能）
if (!window.PWA_MANUAL_INIT) {
    window.pwaManager = new PWAManager();
}