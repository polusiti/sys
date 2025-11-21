/**
 * Service Worker for PWA Support
 * Version: 1.0.0
 */

const CACHE_NAME = 'zero-learning-v1';
const DYNAMIC_CACHE = 'zero-dynamic-v1';

// Core files to cache on install
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/pages/login.html',
    '/pages/subject-select.html',
    '/pages/study.html',
    '/css/style.css',
    '/css/theme-toggle.css',
    '/css/rating-system.css',
    '/js/theme.js',
    '/js/core/unified-api-client.js',
    '/js/core/auth-manager.js',
    '/js/components/sidebar.js',
    '/js/features/study.js',
    '/js/features/login.js',
    '/js/features/sidebar-toggle.js',
    '/js/features/rating-system.js',
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

// Fetch event - serve from cache, fallback to network
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

    // Network-first strategy for API calls
    if (request.url.includes('/api/')) {
        return event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response before caching
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone response before caching
                        const responseToCache = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });

                        return response;
                    })
                    .catch(() => {
                        // Network failed, show offline page if available
                        return caches.match('/pages/offline.html');
                    });
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
