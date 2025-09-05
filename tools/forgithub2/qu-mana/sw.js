const CACHE_NAME = 'question-manager-v1';
const API_CACHE_NAME = 'question-manager-api-v1';

// キャッシュするアセット
const STATIC_CACHE_URLS = [
    '/sys/tools/question-manager/',
    '/sys/tools/question-manager/index.html',
    '/sys/tools/question-manager/create.html',
    '/sys/tools/question-manager/edit.html',
    '/sys/tools/question-manager/list.html',
    '/sys/tools/question-manager/stats.html',
    '/sys/tools/question-manager/css/style.css',
    '/sys/tools/question-manager/js/app.js',
    '/sys/tools/question-manager/manifest.json',
    '/sys/tools/question-manager/data/config.js',
    '/sys/tools/question-manager/data/question-types.js',
    '/sys/tools/question-manager/data/sample-data.js'
];

// インストールイベント
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// アクティベートイベント
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// フェッチイベント
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // HTMLファイルの場合はネットワークファースト
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // レスポンスをキャッシュ
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // データファイルの場合はキャッシュファースト
    if (url.pathname.includes('/data/') || url.pathname.includes('/js/') || url.pathname.includes('/css/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(event.request).then(response => {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                        return response;
                    });
                })
        );
        return;
    }
    
    // その他のリソースはネットワークファースト
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// メッセージハンドラ
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATS') {
        event.ports[0].postMessage({
            type: 'CACHE_STATS',
            data: {
                cacheName: CACHE_NAME,
                urls: STATIC_CACHE_URLS
            }
        });
    }
});

// バックグラウンド同期
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // ここでバックグラウンド同期を実装
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// プッシュ通知
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/sys/tools/question-manager/assets/icons/icon-192x192.png',
            badge: '/sys/tools/question-manager/assets/icons/badge.png',
            tag: data.tag || 'default',
            requireInteraction: data.requireInteraction || false
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 通知クリック
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action) {
        // アクションボタンがクリックされた場合
        clients.openWindow(event.action);
    } else {
        // 通知自体がクリックされた場合
        clients.openWindow('/sys/tools/question-manager/');
    }
});