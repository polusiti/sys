// cloudflare-auth-worker.js - Debug version
var cloudflare_auth_worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    console.log("Worker called with path:", path);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Debug: return path info for any request
    if (path.startsWith("/api/")) {
      return new Response(JSON.stringify({
        debug: true,
        path: path,
        method: request.method,
        message: "Debug endpoint reached"
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: "Not found",
      path: path,
      debug: "Worker is running"
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};

export { cloudflare_auth_worker_default as default };