const Data = (() => {
  const KEY = "qm_questions";
  let cache = null;

  async function load() {
    if (cache) return cache;
    const stored = localStorage.getItem(KEY);
    if (stored) {
      try {
        cache = JSON.parse(stored);
        return cache;
      } catch {}
    }
    // 初回はサンプルを読み込み
    try {
      const res = await fetch("data/sample-questions.json");
      if (res.ok) {
        cache = await res.json();
        save(cache);
        return cache;
      }
    } catch {}
    cache = [];
    return cache;
  }

  function save(list) {
    cache = list.slice();
    localStorage.setItem(KEY, JSON.stringify(cache));
    return cache;
  }

  async function all() {
    return await load();
  }

  async function upsert(question) {
    const list = await load();
    const idx = list.findIndex(q => q.id === question.id);
    if (idx >= 0) list[idx] = question;
    else list.push(question);
    save(list);
  }

  async function removeById(id) {
    const list = await load();
    save(list.filter(q => q.id !== id));
  }

  return { all, upsert, removeById, save };
})();
