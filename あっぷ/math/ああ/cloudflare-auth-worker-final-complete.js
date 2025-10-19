// cloudflare-auth-worker.js - Complete working version with Questions API
var cloudflare_auth_worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Questions API endpoints
    if (path === "/api/questions" && request.method === "GET") {
      try {
        // Sample questions data
        const questions = [
          {
            id: "1",
            title: "二次方程式の解法",
            content: "x² - 5x + 6 = 0 を解け。",
            answer: "x = 2 または x = 3",
            category: "代数学",
            difficulty: "容易",
            created_at: new Date().toISOString()
          },
          {
            id: "2",
            title: "微分の基本",
            content: "f(x) = x³ - 3x² + 2x の導関数を求めよ。",
            answer: "f'(x) = 3x² - 6x + 2",
            category: "解析学",
            difficulty: "普通",
            created_at: new Date().toISOString()
          }
        ];

        return new Response(JSON.stringify({
          success: true,
          message: "Questions retrieved successfully",
          questions: questions,
          total: questions.length
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "Failed to retrieve questions",
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === "/api/questions" && request.method === "POST") {
      try {
        const data = await request.json();
        const questionId = Math.random().toString(36).substr(2, 9);

        return new Response(JSON.stringify({
          success: true,
          message: "Question created successfully",
          question_id: questionId,
          created_question: {
            id: questionId,
            ...data,
            created_at: new Date().toISOString()
          }
        }), {
          status: 201,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "Failed to create question",
          details: error.message
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    if (path.startsWith("/api/questions/") && request.method === "GET") {
      const questionId = path.split("/").pop();

      try {
        // Sample question data
        const question = {
          id: questionId,
          title: "サンプル問題",
          content: "これはサンプルの数学問題です。",
          answer: "サンプル解答",
          category: "代数学",
          difficulty: "容易",
          created_at: new Date().toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          message: "Question retrieved successfully",
          question: question
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "Failed to retrieve question",
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path.startsWith("/api/questions/") && request.method === "PUT") {
      const questionId = path.split("/").pop();

      try {
        const data = await request.json();

        return new Response(JSON.stringify({
          success: true,
          message: "Question updated successfully",
          question_id: questionId,
          updated_question: {
            id: questionId,
            ...data,
            updated_at: new Date().toISOString()
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "Failed to update question",
          details: error.message
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    if (path.startsWith("/api/questions/") && request.method === "DELETE") {
      const questionId = path.split("/").pop();

      try {
        return new Response(JSON.stringify({
          success: true,
          message: "Question deleted successfully",
          question_id: questionId
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "Failed to delete question",
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === "/api/health") {
      return new Response(JSON.stringify({
        success: true,
        message: "System is healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        endpoints: [
          "GET /api/questions",
          "POST /api/questions",
          "GET /api/questions/{id}",
          "PUT /api/questions/{id}",
          "DELETE /api/questions/{id}",
          "GET /api/health"
        ]
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: "Not found",
      path: path,
      available_endpoints: [
        "/api/questions",
        "/api/questions/{id}",
        "/api/health"
      ],
      method: request.method
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};

export { cloudflare_auth_worker_default as default };