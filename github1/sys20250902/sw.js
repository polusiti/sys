const CACHE_NAME = 'sys-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/chemistry.html',
  '/english.html',
  '/math.html',
  '/physics.html',
  '/syskuku.html',
  '/example/usage-snippet.html',
  '/assets/js/dynamic-image-by-time.js',
  '/assets/fantasy/fantasy.js',
  // R2の画像もキャッシュ
  'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/20250824_0148_image%20(1).png',
  'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/20250824_0148_image.png'
];

// インストール時のキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// ネットワークリクエストの処理
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュから返す
        if (response) {
          return response;
        }
        
        // ネットワークから取得してキャッシュに保存
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
