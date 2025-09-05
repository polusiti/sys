const CACHE_NAME = 'question-manager-v1.0.0';
const OFFLINE_URL = '/tools/question-manager/offline.html';
const DATA_CACHE_NAME = 'question-manager-data-v1.0.0';

// キャッシュするリソース
const STATIC_RESOURCES = [
  '/tools/question-manager/',
  '/tools/question-manager/login.html',
  '/tools/question-manager/dashboard.html', 
  '/tools/question-manager/index.html',
  '/tools/question-manager/advanced-editor.html',
  '/tools/question-manager/auth.js',
  '/tools/question-manager/dashboard.js',
  '/tools/question-manager/question-manager.js',
  '/tools/question-manager/advanced-editor.js',
  '/tools/question-manager/manifest.json',
  '/tools/question-manager/offline.html'
];

// データキャッシュ対象のURL
const DATA_URLS = [
  '/data/questions/quiz-choice-questions.json',
  '/data/questions/quiz-f1-questions.json', 
  '/data/questions/quiz-f2-questions.json',
  '/tools/question-manager/config.json'
];

// CDNリソース
const CDN_RESOURCES = [
  'https://polyfill.io/v3/polyfill.min.js?features=es6',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching static resources');
        return cache.addAll([
          ...STATIC_RESOURCES,
          ...CDN_RESOURCES,
          OFFLINE_URL
        ]);
      })
      .then(() => {
        console.log('[ServiceWorker] Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Pre-caching failed:', error);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // データAPIへのリクエストの場合
  if (DATA_URLS.some(dataUrl => url.pathname.includes(dataUrl))) {
    event.respondWith(handleDataRequest(event.request));
    return;
  }
  
  // 静的リソースまたはアプリケーション内のリクエスト
  if (url.origin === location.origin || CDN_RESOURCES.some(cdn => event.request.url.includes(cdn))) {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
  
  // 外部リクエストの場合はそのまま通す
  event.respondWith(fetch(event.request));
});

// 静的リソースのリクエスト処理
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // キャッシュから取得を試行
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache:', request.url);
      
      // バックグラウンドでキャッシュを更新（stale-while-revalidate）
      fetch(request).then(response => {
        if (response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // ネットワークエラーは無視
      });
      
      return cachedResponse;
    }
    
    // ネットワークから取得
    console.log('[ServiceWorker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      // 成功時はキャッシュに保存
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch error:', error);
    
    // オフライン用ページを返す
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      return offlineResponse || new Response('オフラインです', { status: 503 });
    }
    
    throw error;
  }
}

// データリクエストの処理
async function handleDataRequest(request) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    
    // ネットワークファーストで取得を試行
    try {
      console.log('[ServiceWorker] Fetching data from network:', request.url);
      const networkResponse = await fetch(request);
      
      if (networkResponse.status === 200) {
        // 成功時はキャッシュに保存
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (networkError) {
      console.warn('[ServiceWorker] Network request failed:', networkError);
    }
    
    // ネットワーク取得に失敗した場合、キャッシュから取得
    console.log('[ServiceWorker] Serving data from cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // キャッシュにもない場合は空のレスポンスを返す
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[ServiceWorker] Data request error:', error);
    return new Response(JSON.stringify([]), {
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : '新しい問題が追加されました',
    icon: '/tools/question-manager/icons/icon-192.png',
    badge: '/tools/question-manager/icons/badge-72.png',
    data: {
      url: '/tools/question-manager/dashboard.html'
    },
    actions: [
      {
        action: 'view',
        title: '確認する',
        icon: '/tools/question-manager/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: '後で',
        icon: '/tools/question-manager/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    tag: 'question-manager-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification('問題管理システム', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'dismiss') {
    // 何もしない
  } else {
    // デフォルトアクション
    event.waitUntil(
      clients.openWindow('/tools/question-manager/dashboard.html')
    );
  }
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'question-sync') {
    console.log('[ServiceWorker] Background sync triggered');
    event.waitUntil(syncQuestions());
  }
});

// 問題データの同期
async function syncQuestions() {
  try {
    // ローカルストレージの変更を取得
    const drafts = await getStoredDrafts();
    
    for (const draft of drafts) {
      try {
        // サーバーに送信
        await fetch('/tools/question-manager/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(draft)
        });
        
        // 送信成功時はローカルから削除
        await removeDraft(draft.id);
      } catch (error) {
        console.error('Draft sync failed:', draft.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// ローカルストレージからドラフトを取得
async function getStoredDrafts() {
  // 実際の実装では IndexedDB を使用することを推奨
  return [];
}

// ドラフトを削除
async function removeDraft(id) {
  // 実際の実装では IndexedDB を使用することを推奨
  console.log('Draft removed:', id);
}