/**
 * Service Worker for PWA Support (Optimized)
 * Version: 2.0.0 - App Shell + Stale-while-revalidate
 */

const CACHE_NAME = 'zero-learning-v2';
const DYNAMIC_CACHE = 'zero-dynamic-v2';

// App Shell: Core files to cache on install (爆速起動のため)
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/pages/login.html',
    '/pages/subject-select.html',
    '/pages/study.html',
    '/pages/english-menu.html',
    '/css/style.css',
    '/css/theme-toggle.css',
    '/css/rating-system.css',
    '/css/english-composition.css',
    '/js/theme.js',
    '/js/core/unified-api-client.js',
    '/js/core/auth-manager.js',
    '/js/components/sidebar.js',
    '/js/features/study.js',
    '/js/features/login.js',
    '/js/features/sidebar-toggle.js',
    '/js/features/rating-system.js',
    '/js/subjects/english-composition.js',
    '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .catch((error) => {
                console.error('[SW] Cache installation failed:', error);
            })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control immediately
});

// Fetch event - Optimized strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external resources (fonts, CDN)
    if (request.url.includes('fonts.googleapis.com') ||
        request.url.includes('fonts.gstatic.com') ||
        request.url.includes('cdn.jsdelivr.net') ||
        request.url.includes('pub-d59d6e46c3154423956f648f8df909ae.r2.dev') ||
        request.url.includes('questa-r2-api.t88596565.workers.dev') ||
        request.url.includes('api.allfrom0.top')) {
        return event.respondWith(fetch(request));
    }

    // Network-first strategy for API calls (常に最新データ優先)
    if (request.url.includes('/api/')) {
        return event.respondWith(
            fetch(request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
    }

    // Stale-While-Revalidate strategy for static assets (爆速表示)
    // まず古いキャッシュを即返し、裏で新しいデータを取得
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // キャッシュがあれば即座に返す
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        // 成功したらキャッシュを更新
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // ネットワークエラー時はキャッシュに頼る
                        return cachedResponse || caches.match('/pages/offline.html');
                    });

                // キャッシュがあれば即座に返し、裏で更新
                // キャッシュがなければネットワークを待つ
                return cachedResponse || fetchPromise;
            })
    );
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => caches.delete(cache))
            );
        }).then(() => {
            console.log('[SW] All caches cleared');
        });
    }
});
