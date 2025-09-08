const CACHE_NAME = 'questa-manager-v1';
const urlsToCache = [
  '/manager/',
  '/manager/manifest.json',
  '/manager/english/',
  '/manager/english/voca/',
  '/manager/english/grammar/',
  '/manager/english/reading/',
  '/manager/english/listening/',
  '/manager/english/write/',
  '/manager/questa-r2-client.js',
  // 外部リソース
  'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg',
  'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/741.jpg'
];

// Service Worker インストール
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] キャッシュ開始');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { cache: 'reload' });
        }));
      })
      .catch(error => {
        console.error('[SW] キャッシュエラー:', error);
      })
  );
  self.skipWaiting();
});

// Service Worker アクティブ化
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 古いキャッシュ削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ネットワークリクエストのインターセプト
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // R2 APIリクエストの場合
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 成功時はそのまま返す
          return response;
        })
        .catch(error => {
          console.log('[SW] API呼び出し失敗（オフライン）:', error);
          // オフライン時のフォールバック応答
          return new Response(JSON.stringify({
            error: 'オフラインです。R2サーバーに接続できません。',
            offline: true,
            timestamp: new Date().toISOString()
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // 静的リソースの場合（キャッシュファースト戦略）
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          console.log('[SW] キャッシュから提供:', event.request.url);
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('[SW] ネットワークエラー:', error);
            // HTMLページの場合はオフライン用ページを返す
            if (event.request.destination === 'document') {
              return caches.match('/manager/')
                .then(response => {
                  if (response) {
                    return response;
                  }
                  // 基本的なオフラインページ
                  return new Response(`
                    <!DOCTYPE html>
                    <html lang="ja">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>オフライン - Questa Manager</title>
                      <style>
                        body { 
                          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                          text-align: center; 
                          padding: 50px; 
                          background: #ecfdf5; 
                          color: #1f2937;
                        }
                        .offline-message {
                          background: white;
                          padding: 30px;
                          border-radius: 12px;
                          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                          max-width: 400px;
                          margin: 0 auto;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="offline-message">
                        <h1>📱 オフライン</h1>
                        <p>現在インターネットに接続されていません。</p>
                        <p>接続が復旧したら、ページを再読み込みしてください。</p>
                        <button onclick="location.reload()">再読み込み</button>
                      </div>
                    </body>
                    </html>
                  `, {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                  });
                });
            }
            throw error;
          });
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] バックグラウンド同期実行');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // 保留中のデータをR2に同期する処理
    const pendingData = await getStoredPendingData();
    if (pendingData && pendingData.length > 0) {
      for (const data of pendingData) {
        try {
          await syncToR2(data);
          await removePendingData(data.id);
        } catch (error) {
          console.error('[SW] 同期エラー:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] バックグラウンド同期エラー:', error);
  }
}

// IndexedDBからの保留データ取得（実装は省略）
async function getStoredPendingData() {
  // 実際の実装では IndexedDB からデータを取得
  return [];
}

// R2への同期（実装は省略）
async function syncToR2(data) {
  // 実際の実装では R2 API を呼び出し
  return fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// 保留データの削除（実装は省略）
async function removePendingData(id) {
  // 実際の実装では IndexedDB からデータを削除
}

// プッシュ通知（将来の拡張用）
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '新しい通知があります',
    icon: 'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg',
    badge: 'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: '確認',
        icon: 'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: 'https://pub-d59d6e46c3154423956f648f8df909ae.r2.dev/61203.jpg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Questa Manager', options)
  );
});

console.log('[SW] Service Worker 読み込み完了');