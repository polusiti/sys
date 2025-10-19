// cloudflare-auth-worker.js - Simple version for debugging
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

    // Return path information for any request
    return new Response(JSON.stringify({
      success: true,
      path: path,
      full_url: url.href,
      method: request.method,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
};

export { cloudflare_auth_worker_default as default };