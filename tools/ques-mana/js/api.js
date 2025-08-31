// API クライアント（Cloudflare Worker / R2 "quesa" バケット連携）
// API は tools/ques-mana/server/_worker.js が提供する /tools/ques-mana/api 配下を想定
const Api = (() => {
  const API_BASE = "./api";

  async function listQuestions() {
    const res = await fetch(`${API_BASE}/questions`);
    if (!res.ok) throw new Error("Failed to list questions");
    return res.json();
  }

  async function getQuestion(id) {
    const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to get question");
    return res.json();
  }

  async function saveQuestion(q) {
    const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(q.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q)
    });
    if (!res.ok) throw new Error("Failed to save question");
    return res.json();
  }

  async function deleteQuestion(id) {
    const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete question");
    return res.json();
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      body: form
    });
    if (!res.ok) throw new Error("Failed to upload");
    return res.json(); // { key, url }
  }

  return { listQuestions, getQuestion, saveQuestion, deleteQuestion, uploadFile };
})();
