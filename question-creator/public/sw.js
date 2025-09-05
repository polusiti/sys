// Service Worker for Question Creator PWA
const CACHE_NAME = 'question-creator-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/bundle.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }
  
  // Skip API calls - let them fail when offline
  if (event.request.url.includes('/api/')) {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response
        }
        
        // Clone the request
        const fetchRequest = event.request.clone()
        
        // Make network request
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // Clone the response
          const responseToCache = response.clone()
          
          // Cache the new resource
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-questions') {
    event.waitUntil(syncQuestions())
  }
})

// Sync questions with server
async function syncQuestions() {
  try {
    // Get queued items from IndexedDB or localStorage
    const queue = await getQueuedItems()
    
    if (queue.length === 0) {
      return
    }
    
    // Sync each item
    for (const item of queue) {
      try {
        await syncItem(item)
        await removeFromQueue(item.id)
      } catch (error) {
        console.error('Sync failed for item:', item.id, error)
      }
    }
    
    // Notify client
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        success: true
      })
    })
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Helper functions for IndexedDB operations
async function getQueuedItems() {
  // Implementation depends on your IndexedDB setup
  return []
}

async function removeFromQueue(id) {
  // Implementation depends on your IndexedDB setup
}

async function syncItem(item) {
  const response = await fetch(`/api/questions/${item.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  })
  
  if (!response.ok) {
    throw new Error('Sync failed')
  }
  
  return await response.json()
}