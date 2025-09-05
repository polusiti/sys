// Cloudflare Worker for Question Manager R2 Integration
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
    
    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    
    // Route handling
    try {
      if (url.pathname === '/api/questions' && request.method === 'GET') {
        return await handleListQuestions(request, env, corsHeaders)
      } else if (url.pathname.startsWith('/api/questions/') && request.method === 'GET') {
        return await handleGetQuestion(request, env, corsHeaders)
      } else if (url.pathname.startsWith('/api/questions/') && request.method === 'PUT') {
        return await handlePutQuestion(request, env, corsHeaders)
      } else if (url.pathname.startsWith('/api/questions/') && request.method === 'DELETE') {
        return await handleDeleteQuestion(request, env, corsHeaders)
      } else if (url.pathname === '/api/upload' && request.method === 'POST') {
        return await handleUpload(request, env, corsHeaders)
      } else if (url.pathname === '/api/stats' && request.method === 'GET') {
        return await handleStats(request, env, corsHeaders)
      } else if (url.pathname === '/api/health' && request.method === 'GET') {
        return await handleHealth(env, corsHeaders)
      }
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Default response
    return new Response('Not Found', { status: 404 })
  }
}

// List questions
async function handleListQuestions(request, env, headers) {
  const url = new URL(request.url)
  const subject = url.searchParams.get('subject')
  const topic = url.searchParams.get('topic')
  
  let prefix = 'questions/'
  if (subject) {
    prefix += `${subject}/`
    if (topic) {
      prefix += `${topic}/`
    }
  }
  
  const objects = await env.QUESTA_BUCKET.list({ prefix })
  const questions = []
  
  for (const obj of objects.objects) {
    const object = await env.QUESTA_BUCKET.get(obj.key)
    if (object) {
      questions.push({
        key: obj.key,
        metadata: object.customMetadata,
        size: obj.size,
        uploaded: obj.uploaded
      })
    }
  }
  
  return new Response(JSON.stringify({ success: true, questions }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// Get specific question
async function handleGetQuestion(request, env, headers) {
  const key = request.url.split('/api/questions/')[1]
  
  const object = await env.QUESTA_BUCKET.get(key)
  if (!object) {
    return new Response(JSON.stringify({ success: false, error: 'Question not found' }), {
      status: 404,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
  
  const data = await object.text()
  const question = JSON.parse(data)
  
  return new Response(JSON.stringify({
    success: true,
    question,
    metadata: object.customMetadata
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// Put/create question
async function handlePutQuestion(request, env, headers) {
  const key = request.url.split('/api/questions/')[1]
  const question = await request.json()
  
  // Validate question
  if (!question.id || !question.subject || !question.question) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid question structure' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
  
  // Prepare metadata
  const metadata = {
    subject: question.subject,
    topic: question.topic || '',
    difficulty: question.difficulty || 1,
    answerFormat: question.answerFormat || 'unknown',
    createdAt: question.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0'
  }
  
  // Store in R2
  await env.QUESTA_BUCKET.put(key, JSON.stringify(question, null, 2), {
    customMetadata: metadata,
    httpMetadata: {
      contentType: 'application/json'
    }
  })
  
  return new Response(JSON.stringify({
    success: true,
    key,
    metadata
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// Delete question
async function handleDeleteQuestion(request, env, headers) {
  const key = request.url.split('/api/questions/')[1]
  
  await env.QUESTA_BUCKET.delete(key)
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// Upload file (images, etc.)
async function handleUpload(request, env, headers) {
  const formData = await request.formData()
  const file = formData.get('file')
  
  if (!file) {
    return new Response(JSON.stringify({ success: false, error: 'No file provided' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
  
  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const filename = `images/${timestamp}-${file.name}`
  
  // Upload to R2
  await env.QUESTA_BUCKET.put(filename, file.stream(), {
    httpMetadata: {
      contentType: file.type
    }
  })
  
  // Generate public URL
  const publicUrl = `https://pub-xxxxxxxx.r2.dev/${filename}`
  
  return new Response(JSON.stringify({
    success: true,
    filename,
    url: publicUrl
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// Get statistics
async function handleStats(request, env, headers) {
  const objects = await env.QUESTA_BUCKET.list({ prefix: 'questions/' })
  
  const stats = {
    totalQuestions: 0,
    bySubject: {},
    byFormat: {},
    lastUpdated: new Date().toISOString()
  }
  
  for (const obj of objects.objects) {
    const object = await env.QUESTA_BUCKET.get(obj.key)
    if (object && object.customMetadata) {
      const metadata = object.customMetadata
      
      stats.totalQuestions++
      
      // Count by subject
      if (metadata.subject) {
        stats.bySubject[metadata.subject] = (stats.bySubject[metadata.subject] || 0) + 1
      }
      
      // Count by format
      if (metadata.answerFormat) {
        stats.byFormat[metadata.answerFormat] = (stats.byFormat[metadata.answerFormat] || 0) + 1
      }
    }
  }
  
  return new Response(JSON.stringify({ success: true, stats }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// Health check
async function handleHealth(env, headers) {
  // Check if R2 bucket is accessible
  try {
    await env.QUESTA_BUCKET.list({ limit: 1 })
    return new Response(JSON.stringify({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      r2: 'connected'
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      status: 'unhealthy',
      error: 'R2 connection failed'
    }), {
      status: 503,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}