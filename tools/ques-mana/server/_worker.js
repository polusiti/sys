// Cloudflare Worker (R2: QUESA -> bucket "quesa")
// ルート: /tools/ques-mana/api/*
// - GET    /questions              : 一覧
// - GET    /questions/:id          : 取得
// - PUT    /questions/:id          : 作成/更新（JSON）
// - DELETE /questions/:id          : 削除
// - POST   /uploads                : 画像アップロード（multipart） -> { key, url }
// - GET    /uploads/:key           : 画像取得（配信）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const prefix = "/tools/ques-mana/api";
    if (!url.pathname.startsWith(prefix)) {
      return new Response("Not Found", { status: 404 });
    }

    const path = url.pathname.slice(prefix.length);
    const method = request.method.toUpperCase();

    try {
      // CORS（同一オリジン想定だが念のため）
      if (method === "OPTIONS") {
        return cors(new Response(null, { status: 204 }));
      }

      if (path === "/questions" && method === "GET") {
        const list = await listQuestions(env);
        return cors(json(list));
      }

      if (path.startsWith("/questions/")) {
        const id = decodeURIComponent(path.split("/")[2] || "");
        if (!id) return cors(json({ error: "id required" }, 400));
        if (method === "GET") {
          const obj = await env.QUESA.get(keyQ(id));
          if (!obj) return cors(json({ error: "not found" }, 404));
          const q = await obj.json();
          return cors(json(q));
        }
        if (method === "PUT") {
          const body = await request.json();
          if (!body?.id || body.id !== id) return cors(json({ error: "id mismatch" }, 400));
          await env.QUESA.put(keyQ(id), JSON.stringify(body), { httpMetadata: { contentType: "application/json" } });
          return cors(json({ ok: true }));
        }
        if (method === "DELETE") {
          await env.QUESA.delete(keyQ(id));
          return cors(json({ ok: true }));
        }
      }

      if (path === "/uploads" && method === "POST") {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return cors(json({ error: "file required" }, 400));
        const key = keyU(Date.now() + "-" + sanitize(file.name || "image.bin"));
        await env.QUESA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
        const urlPublic = `${url.origin}${prefix}/uploads/${encodeURIComponent(key.split("/").pop())}`;
        // 保存時の相対URLを返す（配信は GET /uploads/:name で行う）
        return cors(json({ key, url: urlPublic }), 201);
      }

      if (path.startsWith("/uploads/") && method === "GET") {
        const name = decodeURIComponent(path.split("/")[2] || "");
        if (!name) return cors(new Response("Bad Request", { status: 400 }));
        // アップロード時に keyU(...) の最後のファイル名を返しているため、再構築
        const list = await env.QUESA.list({ prefix: "ques-mana/uploads/" });
        const obj = list.objects.find(o => o.key.endsWith("/" + name));
        if (!obj) return cors(new Response("Not Found", { status: 404 }));
        const file = await env.QUESA.get(obj.key);
        const body = await file.arrayBuffer();
        return cors(new Response(body, { status: 200, headers: { "Content-Type": file.httpMetadata?.contentType || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } }));
      }

      return cors(new Response("Not Found", { status: 404 }));
    } catch (e) {
      return cors(json({ error: String(e?.message || e) }, 500));
    }
  }
};

const keyQ = (id) => `ques-mana/questions/${sanitize(id)}.json`;
const keyU = (name) => `ques-mana/uploads/${name}`;
const sanitize = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");

async function listQuestions(env) {
  const out = [];
  let cursor;
  do {
    const resp = await env.QUESA.list({ prefix: "ques-mana/questions/", limit: 1000, cursor });
    for (const o of resp.objects) {
      const obj = await env.QUESA.get(o.key);
      if (obj) out.push(await obj.json());
    }
    cursor = resp.truncated ? resp.cursor : undefined;
  } while (cursor);
  // id順で安定
  out.sort((a,b)=> String(a.id).localeCompare(String(b.id)));
  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function cors(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(res.body, { status: res.status, headers: h });
}
