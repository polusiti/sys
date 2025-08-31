export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // APIエンドポイント
        if (path.startsWith("/api/")) {
            return handleApiRequest(request, env);
        }

        // 静的ファイル配信
        return serveStaticAssets(request, env);
    }
};

async function handleApiRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 問題保存エンドポイント
    if (path === "/api/save-question" && request.method === "POST") {
        try {
            const { key, data } = await request.json();
            
            // R2バケットに保存
            await env.QUESTA_BUCKET.put(key, JSON.stringify(data));
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    // 問題一覧取得エンドポイント
    if (path === "/api/questions" && request.method === "GET") {
        try {
            const listed = await env.QUESTA_BUCKET.list();
            const questions = [];
            
            for (const object of listed.objects) {
                if (object.key.startsWith("questions/")) {
                    const obj = await env.QUESTA_BUCKET.get(object.key);
                    const data = await obj.json();
                    questions.push(data);
                }
            }
            
            return new Response(JSON.stringify(questions), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    return new Response("Not Found", { status: 404 });
}

async function serveStaticAssets(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    
    // Cloudflare R2からファイルを取得
    const object = await env.QUESTA_BUCKET.get(path.substring(1));
    
    if (!object) {
        return new Response("Not Found", { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    return new Response(object.body, {
        headers
    });
}
