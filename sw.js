const CACHE_NAME = 'learning-notebook-v1.0.1';
const STATIC_CACHE = 'learning-notebook-static-v1.0.1';
const DYNAMIC_CACHE = 'learning-notebook-dynamic-v1.0.1';
const RUNTIME_CACHE = 'learning-notebook-runtime-v1.0.1';

// キャッシュするリソースのリスト（拡張子なしURL）
const STATIC_ASSETS = [
    '/pages/login',
    '/pages/subject-select',
    '/pages/english-menu',
    '/pages/profile',
    '/style.css',
    '/css/theme-toggle.css',
    '/js/theme.js',
    '/js/login.js',
    '/js/study.js',
    '/js/app.js',
    '/manifest.json',
    'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg',
    'https://pub-8aefaeaf72ff490ba094da8a873c6686.r2.dev/notebook-icon.png'
];

// インストールイベント - 静的リソースをキャッシュ
self.addEventListener('install', event => {
    console.log('Service Worker: インストール開始');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: 静的リソースをキャッシュ中');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: インストール完了');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: インストール失敗', error);
            })
    );
});

// アクティベートイベント - 古いキャッシュを削除
self.addEventListener('activate', event => {
    console.log('Service Worker: アクティベート開始');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 新しいバージョンではないキャッシュを削除
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== RUNTIME_CACHE) {
                            console.log('Service Worker: 古いキャッシュを削除', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: アクティベート完了');
                return self.clients.claim();
            })
            .catch(error => {
                console.error('Service Worker: アクティベート失敗', error);
            })
    );
});

// フェッチイベント - Cloudflare Pages PWA対応
self.addEventListener('fetch', event => {
    const { request } = event;

    // GETリクエストのみキャッシュ
    if (request.method !== 'GET') {
        return;
    }

    // リクエストはそのまま使用
    const actualRequest = request;

    // WebAuthn APIリクエストは常にネットワークから取得（キャッシュしない）
    if (request.url.includes('/api/auth/passkey/')) {
        event.respondWith(
            fetch(actualRequest).catch(() => getOfflineResponse(request))
        );
    }
    // オンライン戦略：ネットワーク優先、フォールバックをキャッシュ
    else if (isOnlineAsset(request.url)) {
        event.respondWith(
            caches.match(actualRequest)
                .then(cachedResponse => {
                    // キャッシュが存在し、新しくない（5分以上経過）場合はネットワークから更新
                    if (cachedResponse) {
                        const cachedTime = cachedResponse.headers.get('sw-cached-time');
                        if (cachedTime && (Date.now() - parseInt(cachedTime)) < 300000) {
                            return cachedResponse;
                        }
                    }

                    return fetch(actualRequest)
                        .then(response => {
                            // レスポンスが有効な場合のみキャッシュ
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => {
                                        // キャッシュ時間を記録
                                        const headers = new Headers(responseClone.headers);
                                        headers.set('sw-cached-time', Date.now().toString());

                                        const cachedResponse = new Response(responseClone.body, {
                                            status: responseClone.status,
                                            statusText: responseClone.statusText,
                                            headers: headers
                                        });

                                        // 静的ファイルをキャッシュ
                                        cache.put(request, cachedResponse);
                                    });
                            }
                            return response;
                        })
                        .catch(() => {
                            // オフライン時はキャッシュを返す
                            return cachedResponse || getOfflineResponse(request);
                        });
                })
        );
    }
    // オフラインファースト戦略：静的リソース
    else {
        event.respondWith(
            caches.match(actualRequest)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // キャッシュにない場合はネットワークから取得
                    return fetch(actualRequest)
                        .then(response => {
                            // 有効なレスポンスの場合はキャッシュ
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(RUNTIME_CACHE)
                                    .then(cache => {
                                        // 静的ファイルをキャッシュ
                                        cache.put(request, responseClone);
                                    });
                            }
                            return response;
                        })
                        .catch(() => {
                            // オフライン時の代替コンテンツ
                            return getOfflineResponse(request);
                        });
                })
        );
    }
});

// オンライン資源の判定
function isOnlineAsset(url) {
    // APIリクエストや動的コンテンツはオンライン戦略（WebAuthn APIは除く）
    return (url.includes('/api/') && !url.includes('/api/auth/passkey/')) ||
           url.includes('cloudflare') ||
           url.includes('r2.dev');
}

// オフライン時の代替レスポンス
function getOfflineResponse(request) {
    const url = new URL(request.url);

    // HTMLページの場合
    if (request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/index.html') || new Response(
            '<html><body><h1>オフライン</h1><p>インターネット接続がありません。</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
        );
    }

    // 画像の場合
    if (request.destination === 'image') {
        return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }

    // その他の場合
    return new Response('オフラインモード', { status: 503 });
}

// メッセージング - PWAの更新通知
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// バックグラウンド同期 - 学習進捗の同期
self.addEventListener('sync', event => {
    if (event.tag === 'sync-study-progress') {
        event.waitUntil(syncStudyProgress());
    }
});

// 学習進捗を同期する関数
async function syncStudyProgress() {
    try {
        // localStorageの学習データを取得してサーバーに同期
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_STUDY_PROGRESS'
            });
        });
        console.log('Study progress sync completed');
    } catch (error) {
        console.error('Study progress sync failed:', error);
    }
}

// プッシュ通知
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || '新しい学習コンテンツが利用可能です',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || 1
            },
            actions: [
                {
                    action: 'explore',
                    title: '学習を続ける',
                    icon: '/images/checkmark.png'
                },
                {
                    action: 'close',
                    title: '閉じる',
                    icon: '/images/xmark.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || '学習ノート', options)
        );
    }
});

// 通知クリック処理
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/pages/subject-select.html')
        );
    } else if (event.action === 'close') {
        // 閉じるアクション
    } else {
        // 通知本体をクリックした場合
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('Service Worker: 読み込み完了 - バージョン 1.0.0');
