// cloudflare-auth-worker.js - Minimal test version
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

    if (path === "/api/test") {
      return new Response(JSON.stringify({
        message: "Test works!",
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    if (path === "/api/questions") {
      return new Response(JSON.stringify({
        success: true,
        message: "Questions endpoint works!",
        path: path
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    if (path === "/api/health") {
      return new Response(JSON.stringify({
        success: true,
        message: "System is healthy",
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: "Not found",
      path: path,
      available_endpoints: ["/api/test", "/api/questions", "/api/health"]
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};

export { cloudflare_auth_worker_default as default };