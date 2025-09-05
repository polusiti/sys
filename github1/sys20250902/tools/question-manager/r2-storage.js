// R2 Storage Integration for Question Manager
class R2Storage {
  constructor(config) {
    this.config = config.r2
    this.apiBase = config.api.baseUrl
  }

  // Upload question to R2
  async uploadQuestion(question) {
    const key = `questions/${question.subject}/${question.topic || 'general'}/${question.id}.json`
    
    try {
      const response = await fetch(`${this.apiBase}/api/questions/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(question, null, 2)
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      const result = await response.json()
      return result.success ? key : null
    } catch (error) {
      console.error('R2 upload error:', error)
      return null
    }
  }

  // Get question from R2
  async getQuestion(id, subject, topic = 'general') {
    const key = `questions/${subject}/${topic}/${id}.json`
    
    try {
      const response = await fetch(`${this.apiBase}/api/questions/${key}`)
      if (!response.ok) return null
      
      const result = await response.json()
      return result.success ? result.question : null
    } catch (error) {
      console.error('R2 fetch error:', error)
      return null
    }
  }

  // List questions
  async listQuestions(subject = null, topic = null) {
    const params = new URLSearchParams()
    if (subject) params.append('subject', subject)
    if (topic) params.append('topic', topic)
    
    try {
      const response = await fetch(`${this.apiBase}/api/questions?${params}`)
      if (!response.ok) return []
      
      const result = await response.json()
      return result.success ? result.questions : []
    } catch (error) {
      console.error('R2 list error:', error)
      return []
    }
  }

  // Upload image
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(`${this.apiBase}/api/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Image upload failed')
      
      const result = await response.json()
      return result.success ? result.url : null
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    }
  }

  // Get public URL for R2 object
  getPublicUrl(key) {
    return `${this.config.publicUrl}/${key}`
  }

  // Delete question
  async deleteQuestion(id, subject, topic = 'general') {
    const key = `questions/${subject}/${topic}/${id}.json`
    
    try {
      const response = await fetch(`${this.apiBase}/api/questions/${key}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Delete failed')
      
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('R2 delete error:', error)
      return false
    }
  }

  // Get statistics
  async getStats() {
    try {
      const response = await fetch(`${this.apiBase}/api/stats`)
      if (!response.ok) return null
      
      const result = await response.json()
      return result.success ? result.stats : null
    } catch (error) {
      console.error('Stats fetch error:', error)
      return null
    }
  }
}

// Initialize R2 storage
let r2Storage = null

export function initR2Storage(config) {
  r2Storage = new R2Storage(config)
  return r2Storage
}

export function getR2Storage() {
  return r2Storage
}

// Auto-sync functionality
export class AutoSync {
  constructor(storage, localDB) {
    this.storage = storage
    this.localDB = localDB
    this.syncQueue = []
    this.isOnline = navigator.onLine
  }

  async init() {
    // Load unsynced items
    await this.loadSyncQueue()
    
    // Setup online/offline handlers
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Periodic sync
    setInterval(() => this.sync(), 30000) // Every 30 seconds
  }

  async queueForSync(question, action = 'save') {
    this.syncQueue.push({
      ...question,
      _syncAction: action,
      _queuedAt: new Date().toISOString()
    })
    
    await this.saveSyncQueue()
    
    if (this.isOnline) {
      this.sync()
    }
  }

  async sync() {
    if (!this.isOnline || this.syncQueue.length === 0) return
    
    const items = [...this.syncQueue]
    this.syncQueue = []
    
    for (const item of items) {
      try {
        if (item._syncAction === 'save') {
          await this.storage.uploadQuestion(item)
        } else if (item._syncAction === 'delete') {
          await this.storage.deleteQuestion(item.id, item.subject, item.topic)
        }
      } catch (error) {
        console.error('Sync failed for item:', item.id, error)
        this.syncQueue.push(item)
      }
    }
    
    await this.saveSyncQueue()
  }

  async loadSyncQueue() {
    const stored = localStorage.getItem('questionSyncQueue')
    if (stored) {
      this.syncQueue = JSON.parse(stored)
    }
  }

  async saveSyncQueue() {
    localStorage.setItem('questionSyncQueue', JSON.stringify(this.syncQueue))
  }

  handleOnline() {
    this.isOnline = true
    this.sync()
  }

  handleOffline() {
    this.isOnline = false
  }
}