const CACHE_NAME = 'test-app-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/base.css',
  '/css/components.css',
  '/css/ui.css',
  '/js/app.js',
  '/js/ui.js',
  '/js/auth.js',
  '/js/stats.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }

        // キャッシュがなければネットワークにリクエスト
        return fetch(event.request).then(
          function(response) {
            // レスポンスが有効かチェック
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュ
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});