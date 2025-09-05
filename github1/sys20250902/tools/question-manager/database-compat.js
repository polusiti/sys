// Database compatibility wrapper for Enhanced Question Creator
// This provides the same interface as the new database.js but works with existing system

// Mock IndexedDB-like interface using localStorage
class LocalStorageDB {
  constructor(storeName) {
    this.storeName = storeName
    this.data = this.loadData()
  }

  loadData() {
    const stored = localStorage.getItem(`${this.storeName}_data`)
    return stored ? JSON.parse(stored) : {}
  }

  saveData() {
    localStorage.setItem(`${this.storeName}_data`, JSON.stringify(this.data))
  }

  async get(key) {
    return this.data[key] || null
  }

  async put(value) {
    this.data[value.id || value.key] = value
    this.saveData()
    return value
  }

  async getAll() {
    return Object.values(this.data)
  }

  async delete(key) {
    delete this.data[key]
    this.saveData()
  }

  async index(indexName) {
    return {
      getAll: async (key) => {
        const all = await this.getAll()
        if (!key) return all
        return all.filter(item => item[indexName] === key)
      }
    }
  }
}

let dbInstance = null

export async function initDB() {
  if (!dbInstance) {
    dbInstance = new LocalStorageDB('questions')
    console.log('LocalStorage DB initialized')
  }
  return dbInstance
}

export async function saveQuestion(question) {
  if (!dbInstance) await initDB()
  
  try {
    // Add timestamp
    question.updatedAt = new Date().toISOString()
    if (!question.createdAt) {
      question.createdAt = question.updatedAt
    }
    
    await dbInstance.put(question)
    
    // Also save to existing format if available
    if (window.Database && window.Database.saveQuestion) {
      window.Database.saveQuestion(question)
    }
    
    return true
  } catch (error) {
    console.error('Failed to save question:', error)
    return false
  }
}

export async function getQuestion(id) {
  if (!dbInstance) await initDB()
  
  try {
    // Try new format first
    const question = await dbInstance.get(id)
    if (question) return question
    
    // Fallback to existing system
    if (window.Database && window.Database.getQuestion) {
      return await window.Database.getQuestion(id)
    }
    
    return null
  } catch (error) {
    console.error('Failed to get question:', error)
    return null
  }
}

export async function getQuestions(options = {}) {
  if (!dbInstance) await initDB()
  
  try {
    const { limit = 20, offset = 0, subject, topic } = options
    let questions = await dbInstance.getAll()
    
    // Sort by updatedAt
    questions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    // Filter by subject
    if (subject) {
      questions = questions.filter(q => q.subject === subject)
    }
    
    // Filter by topic
    if (topic) {
      questions = questions.filter(q => q.topic === topic)
    }
    
    // Apply pagination
    return questions.slice(offset, offset + limit)
  } catch (error) {
    console.error('Failed to get questions:', error)
    
    // Fallback to existing system
    if (window.Database && window.Database.getQuestions) {
      return await window.Database.getQuestions(options)
    }
    
    return []
  }
}

export async function searchQuestions(options = {}) {
  if (!dbInstance) await initDB()
  
  try {
    const { query, subject } = options
    let questions = await getQuestions()
    
    // Filter by query
    if (query) {
      const searchQuery = query.toLowerCase()
      questions = questions.filter(q => 
        q.question?.toLowerCase().includes(searchQuery) ||
        q.topic?.toLowerCase().includes(searchQuery) ||
        q.explanation?.toLowerCase().includes(searchQuery)
      )
    }
    
    // Filter by subject
    if (subject) {
      questions = questions.filter(q => q.subject === subject)
    }
    
    return questions
  } catch (error) {
    console.error('Failed to search questions:', error)
    return []
  }
}

export async function deleteQuestion(id) {
  if (!dbInstance) await initDB()
  
  try {
    await dbInstance.delete(id)
    
    // Also delete from existing system
    if (window.Database && window.Database.deleteQuestion) {
      await window.Database.deleteQuestion(id)
    }
    
    return true
  } catch (error) {
    console.error('Failed to delete question:', error)
    return false
  }
}

export async function getAllQuestions() {
  if (!dbInstance) await initDB()
  
  try {
    return await dbInstance.getAll()
  } catch (error) {
    console.error('Failed to get all questions:', error)
    return []
  }
}

// Migration helper
export async function migrateFromExisting() {
  if (!window.Database || !window.Database.getAllQuestions) {
    console.log('No existing database found')
    return
  }
  
  try {
    console.log('Starting migration...')
    const existingQuestions = await window.Database.getAllQuestions()
    
    for (const question of existingQuestions) {
      await saveQuestion(question)
    }
    
    console.log(`Migrated ${existingQuestions.length} questions`)
  } catch (error) {
    console.error('Migration failed:', error)
  }
}