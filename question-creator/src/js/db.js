// IndexedDB Database Operations
import { openDB } from 'idb'

const DB_NAME = 'QuestionCreatorDB'
const DB_VERSION = 1
const STORE_NAME = 'questions'

let db = null

export async function initDB() {
  try {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('subject', 'subject')
        store.createIndex('topic', 'topic')
        store.createIndex('createdAt', 'createdAt')
        store.createIndex('updatedAt', 'updatedAt')
      }
    })
    console.log('Database initialized')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}

export async function saveQuestion(question) {
  if (!db) await initDB()
  
  try {
    await db.put(STORE_NAME, {
      ...question,
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('Failed to save question:', error)
    return false
  }
}

export async function getQuestion(id) {
  if (!db) await initDB()
  
  try {
    return await db.get(STORE_NAME, id)
  } catch (error) {
    console.error('Failed to get question:', error)
    return null
  }
}

export async function getQuestions(options = {}) {
  if (!db) await initDB()
  
  try {
    let query = null
    const { limit = 20, offset = 0, subject, topic } = options
    
    if (subject) {
      query = db.index('subject')
    } else if (topic) {
      query = db.index('topic')
    } else {
      query = db.index('updatedAt')
    }
    
    const questions = await query.getAll(
      subject || topic || IDBKeyRange.lowerBound(0),
      limit + offset
    )
    
    return questions.slice(offset, offset + limit)
  } catch (error) {
    console.error('Failed to get questions:', error)
    return []
  }
}

export async function searchQuestions(options = {}) {
  if (!db) await initDB()
  
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
  if (!db) await initDB()
  
  try {
    await db.delete(STORE_NAME, id)
    return true
  } catch (error) {
    console.error('Failed to delete question:', error)
    return false
  }
}

export async function getAllQuestions() {
  if (!db) await initDB()
  
  try {
    return await db.getAll(STORE_NAME)
  } catch (error) {
    console.error('Failed to get all questions:', error)
    return []
  }
}