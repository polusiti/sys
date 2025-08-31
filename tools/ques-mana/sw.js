const CACHE_NAME = "ques-mana-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./styles.css",
  "./js/auth.js",
  "./js/api.js",
  "./js/app.js",
  "./config.json",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// APIは常にネットワーク優先（書き込み・最新性を担保）
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isAPI = url.pathname.includes("/tools/ques-mana/api/");
  if (isAPI || e.request.method !== "GET") return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(e.request);
    const fetchPromise = fetch(e.request).then((res) => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
