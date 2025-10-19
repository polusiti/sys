// D1 Questions API Endpoints for Math Editor Integration
// These endpoints should be added to the existing cloudflare-auth-worker.js

// Add these routes to the existing router:

// GET /api/questions - Get all questions or filter by subject
case '/api/questions':
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject');

    let sql = 'SELECT * FROM questions';
    let params = [];

    if (subject) {
      sql += ' WHERE subject = ?';
      params.push(subject);
    }

    sql += ' ORDER BY created_at DESC';

    try {
      const result = await env.DB.prepare(sql).bind(...params).all();

      if (result.results) {
        return new Response(JSON.stringify({
          success: true,
          questions: result.results
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        return new Response(JSON.stringify({
          success: true,
          questions: []
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (error) {
      console.error('Questions fetch error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch questions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  break;

// POST /api/questions - Create new question
case '/api/questions':
  if (request.method === 'POST') {
    try {
      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.question_text || !data.subject) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields: title, question_text, subject'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Generate ID if not provided
      const questionId = data.id || crypto.randomUUID();

      const sql = `
        INSERT INTO questions (
          id, subject, title, question_text, field_code,
          normalized_content, mode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        questionId,
        data.subject || 'math',
        data.title,
        data.question_text,
        data.field_code || null,
        data.normalized_content || null,
        data.mode || null,
        data.created_at || new Date().toISOString(),
        new Date().toISOString()
      ];

      await env.DB.prepare(sql).bind(...params).run();

      return new Response(JSON.stringify({
        success: true,
        question_id: questionId,
        message: 'Question created successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      console.error('Question creation error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create question'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  break;

// GET /api/questions/{id} - Get specific question
case '/api/questions/': {
  const questionId = path.split('/')[3];

  if (request.method === 'GET') {
    try {
      const result = await env.DB.prepare('SELECT * FROM questions WHERE id = ?')
        .bind(questionId)
        .first();

      if (result) {
        return new Response(JSON.stringify({
          success: true,
          question: result
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Question not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (error) {
      console.error('Question fetch error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch question'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  break;
}

// PUT /api/questions/{id} - Update question
case '/api/questions/': {
  const questionId = path.split('/')[3];

  if (request.method === 'PUT') {
    try {
      const data = await request.json();

      // Check if question exists
      const existing = await env.DB.prepare('SELECT * FROM questions WHERE id = ?')
        .bind(questionId)
        .first();

      if (!existing) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Question not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const sql = `
        UPDATE questions SET
          title = COALESCE(?, title),
          question_text = COALESCE(?, question_text),
          field_code = COALESCE(?, field_code),
          normalized_content = COALESCE(?, normalized_content),
          mode = COALESCE(?, mode),
          updated_at = ?
        WHERE id = ?
      `;

      const params = [
        data.title,
        data.question_text,
        data.field_code,
        data.normalized_content,
        data.mode,
        new Date().toISOString(),
        questionId
      ];

      await env.DB.prepare(sql).bind(...params).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Question updated successfully'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      console.error('Question update error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update question'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  break;
}

// DELETE /api/questions/{id} - Delete question
case '/api/questions/': {
  const questionId = path.split('/')[3];

  if (request.method === 'DELETE') {
    try {
      const result = await env.DB.prepare('DELETE FROM questions WHERE id = ?')
        .bind(questionId)
        .run();

      if (result.meta.changes > 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Question deleted successfully'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Question not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } catch (error) {
      console.error('Question deletion error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete question'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  break;
}

// GET /api/health - Health check endpoint
case '/api/health':
  if (request.method === 'GET') {
    try {
      // Simple database connectivity test
      await env.DB.prepare('SELECT 1').first();

      return new Response(JSON.stringify({
        success: true,
        message: 'D1 connection healthy',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'D1 connection failed',
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  break;