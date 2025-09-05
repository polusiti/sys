// Offline Sync Manager
const SYNC_QUEUE_KEY = 'questionSyncQueue'
const LAST_SYNC_KEY = 'lastSyncTimestamp'

export function setupOfflineSync() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration)
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error)
      })
  }
  
  // Sync on online
  window.addEventListener('online', () => {
    syncQueuedItems()
  })
  
  // Periodic sync
  setInterval(() => {
    if (navigator.onLine) {
      syncQueuedItems()
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}

export function queueForSync(question) {
  const queue = getSyncQueue()
  queue.push({
    ...question,
    _syncAction: question.id ? 'update' : 'create',
    _queuedAt: new Date().toISOString()
  })
  
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  console.log('Question queued for sync:', question.id)
}

export function getSyncQueue() {
  const queue = localStorage.getItem(SYNC_QUEUE_KEY)
  return queue ? JSON.parse(queue) : []
}

export async function syncQueuedItems() {
  if (!navigator.onLine) return
  
  const queue = getSyncQueue()
  if (queue.length === 0) return
  
  console.log(`Syncing ${queue.length} queued items...`)
  
  const results = await Promise.allSettled(
    queue.map(item => syncItem(item))
  )
  
  // Remove successfully synced items
  const successful = results.filter(r => r.status === 'fulfilled' && r.value)
  const failed = results.filter(r => r.status === 'rejected')
  
  if (successful.length > 0) {
    const newQueue = queue.filter((_, index) => 
      results[index].status === 'rejected'
    )
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(newQueue))
    
    console.log(`Synced ${successful.length} items successfully`)
  }
  
  if (failed.length > 0) {
    console.error(`Failed to sync ${failed.length} items:`, failed)
  }
  
  // Update last sync timestamp
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
  
  return {
    successful: successful.length,
    failed: failed.length
  }
}

async function syncItem(item) {
  try {
    const { _syncAction, _queuedAt, ...question } = item
    
    const url = `/api/questions/${question.id}`
    const method = _syncAction === 'update' ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(question)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Sync failed for item:', item.id, error)
    throw error
  }
}

export function getLastSyncTime() {
  const timestamp = localStorage.getItem(LAST_SYNC_KEY)
  return timestamp ? new Date(timestamp) : null
}

export function getSyncStatus() {
  return {
    isOnline: navigator.onLine,
    queuedCount: getSyncQueue().length,
    lastSync: getLastSyncTime()
  }
}