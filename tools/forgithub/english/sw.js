const CACHE_NAME = 'english-learning-system-v1';
const ASSETS = [
    '/english/',
    '/english/index.html',
    '/english/practice.html',
    '/english/english-manager.html',
    '/english/voca/',
    '/english/voca/index.html',
    '/english/grammar/',
    '/english/grammar/index.html',
    '/english/reading/',
    '/english/reading/index.html',
    '/english/listening/',
    '/english/listening/index.html',
    '/english/write/',
    '/english/write/index.html',
    '/english/manifest.json'
];

// Cloudflare R2バケットから静的リソースをキャッシュ
const R2_RESOURCES = [
    'https://pub-questa.r2.dev/english/voca/sample-data.js',
    'https://pub-questa.r2.dev/english/grammar/sample-data.js',
    'https://pub-questa.r2.dev/english/reading/sample-data.js',
    'https://pub-questa.r2.dev/english/listening/sample-data.js',
    'https://pub-questa.r2.dev/english/write/sample-data.js'
];

// インストールイベント
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS);
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
                    if (cacheName !== CACHE_NAME) {
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
    
    // Cloudflare R2リソースの場合はネットワークファースト
    if (R2_RESOURCES.some(r2Url => event.request.url.startsWith(r2Url))) {
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
                    // オフライン時はキャッシュから返す
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // その他のリソースはキャッシュファースト
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(response => {
                    // 新しいリソースをキャッシュ
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                });
            })
    );
});

// メッセージハンドラ
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});