// Cloudflare Workers for R2 Proxy
import { Hono } from 'hono'

const app = new Hono()

// CORS middleware
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', c.env.ALLOWED_ORIGIN)
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (c.req.method === 'OPTIONS') {
    return c.status(200).end()
  }
  
  await next()
})

// List questions
app.get('/api/questions', async (c) => {
  const { subject, topic } = c.req.query()
  let prefix = 'questions/'
  
  if (subject) {
    prefix += `${subject}/`
    if (topic) {
      prefix += `${topic}/`
    }
  }
  
  try {
    const objects = await c.env.QUESTA_BUCKET.list({ prefix })
    const questions = await Promise.all(
      objects.objects.map(async (obj) => {
        const question = await c.env.QUESTA_BUCKET.get(obj.key)
        return {
          key: obj.key,
          metadata: question.customMetadata,
          size: obj.size,
          uploaded: obj.uploaded
        }
      })
    )
    
    return c.json({ success: true, questions })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get question
app.get('/api/questions/:key', async (c) => {
  const key = `questions/${c.req.param('key')}`
  
  try {
    const object = await c.env.QUESTA_BUCKET.get(key)
    if (!object) {
      return c.json({ success: false, error: 'Question not found' }, 404)
    }
    
    const data = await object.text()
    const metadata = object.customMetadata
    
    return c.json({
      success: true,
      question: JSON.parse(data),
      metadata
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create/update question
app.put('/api/questions/:key', async (c) => {
  const key = `questions/${c.req.param('key')}`
  const body = await c.req.json()
  
  try {
    // Validate question structure
    if (!body.id || !body.subject || !body.question) {
      return c.json({ success: false, error: 'Invalid question structure' }, 400)
    }
    
    // Add metadata
    const metadata = {
      subject: body.subject,
      topic: body.topic || '',
      difficulty: body.difficulty || 1,
      createdAt: new Date().toISOString(),
      version: '1.0'
    }
    
    await c.env.QUESTA_BUCKET.put(key, JSON.stringify(body, null, 2), {
      customMetadata: metadata
    })
    
    return c.json({ success: true, key, metadata })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Delete question
app.delete('/api/questions/:key', async (c) => {
  const key = `questions/${c.req.param('key')}`
  
  try {
    await c.env.QUESTA_BUCKET.delete(key)
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Upload image
app.post('/api/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')
  
  if (!file) {
    return c.json({ success: false, error: 'No file provided' }, 400)
  }
  
  const filename = `images/${Date.now()}-${file.name}`
  
  try {
    await c.env.QUESTA_BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    })
    
    // Generate signed URL for access
    const signedUrl = await c.env.QUESTA_BUCKET.sign(filename, { 
      expiresIn: 3600 
    })
    
    return c.json({ 
      success: true, 
      filename,
      url: signedUrl 
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get statistics
app.get('/api/stats', async (c) => {
  try {
    const subjects = {}
    let totalQuestions = 0
    
    // List all questions
    const objects = await c.env.QUESTA_BUCKET.list({ prefix: 'questions/' })
    
    for (const obj of objects.objects) {
      const question = await c.env.QUESTA_BUCKET.get(obj.key)
      const metadata = question.customMetadata
      
      if (metadata.subject) {
        subjects[metadata.subject] = (subjects[metadata.subject] || 0) + 1
        totalQuestions++
      }
    }
    
    return c.json({
      success: true,
      stats: {
        totalQuestions,
        bySubject: subjects,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app