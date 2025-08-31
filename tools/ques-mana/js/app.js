// 簡易ルーター + 画面描画
const Router = {
  routes: {},
  init() {
    window.addEventListener("hashchange", () => this.render());
    this.render();
    document.getElementById("linkDashboard")?.addEventListener("click", () => {});
    document.getElementById("linkQuestions")?.addEventListener("click", () => {});
    document.getElementById("linkEditor")?.addEventListener("click", () => {});
  },
  async render() {
    const app = document.getElementById("app");
    const hash = location.hash || "#/dashboard";
    const [_, path] = hash.split("#/");
    switch (path.split("?")[0]) {
      case "questions":
        app.innerHTML = Views.questions();
        Views.bindQuestions();
        break;
      case "editor":
        app.innerHTML = Views.editor();
        Views.bindEditor();
        break;
      case "dashboard":
      default:
        app.innerHTML = Views.dashboard();
        await Views.bindDashboard();
        break;
    }
  }
};

const Views = {
  dashboard() {
    return `
      <div class="grid cols-2">
        <section class="card">
          <h2 style="margin-bottom:12px;">📈 システム統計</h2>
          <div class="grid cols-3">
            <div class="card"><div class="badge">総問題数</div><div id="statTotal" style="font-size:28px;font-weight:700;margin-top:8px;">-</div></div>
            <div class="card"><div class="badge">今日の作成</div><div id="statToday" style="font-size:28px;font-weight:700;margin-top:8px;">-</div></div>
            <div class="card"><div class="badge">平均難易度</div><div id="statAvg" style="font-size:28px;font-weight:700;margin-top:8px;">-</div></div>
          </div>
        </section>
        <section class="card">
          <h2 style="margin-bottom:12px;">🕐 最近のアクティビティ</h2>
          <ul id="activityList" style="margin:0;padding-left:18px;"></ul>
        </section>
      </div>
      <section class="card" style="margin-top:16px;">
        <h2 style="margin-bottom:12px;">🚀 クイック操作</h2>
        <div class="toolbar">
          <a class="btn btn-primary" href="#/editor">新規問題</a>
          <button class="btn btn-secondary" id="goQuestions">問題管理へ</button>
        </div>
      </section>
    `;
  },
  async bindDashboard() {
    const questions = await Data.all();
    const todayStr = new Date().toDateString();
    const todayCount = questions.filter(q => {
      const d = new Date(q.metadata?.createdAt || 0).toDateString();
      return d === todayStr;
    }).length;
    const avg = questions.length ? (questions.reduce((s,q)=>s+(q.difficulty||1),0)/questions.length).toFixed(1) : 0;
    document.getElementById("statTotal").textContent = questions.length;
    document.getElementById("statToday").textContent = todayCount;
    document.getElementById("statAvg").textContent = avg;

    const logs = JSON.parse(localStorage.getItem("qm_access_log") || "[]").slice(-5).reverse();
    const ul = document.getElementById("activityList");
    ul.innerHTML = logs.map(l => `<li>🔐 ${l.user} がログイン（${new Date(l.time).toLocaleString()}）</li>`).join("") || "<li>履歴はまだありません</li>";

    document.getElementById("goQuestions")?.addEventListener("click", () => location.hash = "#/questions");
  },

  questions() {
    return `
      <section class="card">
        <h2 style="margin-bottom:12px;">📋 問題管理</h2>
        <div class="toolbar">
          <a class="btn btn-primary" href="#/editor">新規作成</a>
          <button class="btn btn-secondary" id="btnImport">インポート(JSON)</button>
          <button class="btn btn-secondary" id="btnExport">エクスポート(JSON)</button>
          <button class="btn btn-secondary" id="btnValidate">検証</button>
          <button class="btn" id="btnBackup">バックアップ</button>
          <input id="search" placeholder="ID / テキスト / タグ を検索..." style="flex:1; min-width:180px;">
          <select id="filterSubject" style="min-width:140px;"></select>
          <select id="filterFormat" style="min-width:140px;"></select>
          <span>
            <label class="checkbox"><input type="checkbox" class="diff" value="1">基礎</label>
            <label class="checkbox"><input type="checkbox" class="diff" value="2">標準</label>
            <label class="checkbox"><input type="checkbox" class="diff" value="3">応用</label>
          </span>
        </div>
        <div class="card">
          <table class="table" id="qTable">
            <thead>
              <tr><th style="width:140px;">ID</th><th>問題文</th><th style="width:120px;">科目</th><th style="width:120px;">形式</th><th style="width:80px;">難易度</th><th style="width:160px;">操作</th></tr>
            </thead>
            <tbody id="qBody"><tr><td colspan="6">読み込み中...</td></tr></tbody>
          </table>
        </div>
      </section>
    `;
  },
  async bindQuestions() {
    // フィルタ初期化
    const cfg = await fetch("config.json").then(r=>r.json()).catch(()=>({categories:{subjects:[],formats:[]}}));
    const subjSel = document.getElementById("filterSubject");
    subjSel.innerHTML = `<option value="">すべての科目</option>` + (cfg.categories.subjects || []).map(s=>`<option value="${s.id}">${s.icon||""} ${s.name}</option>`).join("");
    const fmtSel = document.getElementById("filterFormat");
    fmtSel.innerHTML = `<option value="">すべての形式</option>` + (cfg.categories.formats || []).map(f=>`<option value="${f.id}">${f.name}</option>`).join("");

    const state = { search:"", subject:"", format:"", diffs:[] };
    const apply = async () => {
      const list = await Data.all();
      const term = state.search.toLowerCase();
      const filtered = list.filter(q => {
        const text = (q.questionContent?.text || q.question || "").toLowerCase();
        const tags = (q.tags || []).map(t=>(t||"").toLowerCase());
        const matchesSearch = !term || text.includes(term) || (q.id||"").toLowerCase().includes(term) || tags.some(t=>t.includes(term));
        const matchesSub = !state.subject || q.subject === state.subject;
        const matchesFmt = !state.format || q.answerFormat === state.format;
        const matchesDiff = !state.diffs.length || state.diffs.includes(String(q.difficulty));
        return matchesSearch && matchesSub && matchesFmt && matchesDiff;
      });
      const tbody = document.getElementById("qBody");
      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6">該当する問題がありません</td></tr>`;
        return;
      }
      tbody.innerHTML = filtered.map(q => `
        <tr>
          <td><code>${q.id}</code></td>
          <td>${escapeHtml((q.questionContent?.text || q.question || "")).slice(0,120)}${(q.questionContent?.text || q.question || "").length>120?"...":""}</td>
          <td>${q.subject||"-"}</td>
          <td>${q.answerFormat||"-"}</td>
          <td>${q.difficulty||"-"}</td>
          <td>
            <button class="btn btn-secondary" data-edit="${q.id}">編集</button>
            <button class="btn btn-danger" data-del="${q.id}">削除</button>
          </td>
        </tr>
      `).join("");
      tbody.querySelectorAll("[data-edit]").forEach(btn=>{
        btn.addEventListener("click", ()=>{ location.hash = "#/editor?id="+btn.getAttribute("data-edit"); });
      });
      tbody.querySelectorAll("[data-del]").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
          const id = btn.getAttribute("data-del");
          if (confirm(`ID: ${id} を削除しますか？`)) {
            await Data.removeById(id);
            toast("🗑️ 削除しました");
            apply();
          }
        });
      });

      // エクスポートに使用
      Views._currentFiltered = filtered;
    };

    document.getElementById("search").addEventListener("input", (e)=>{ state.search = e.target.value; apply(); });
    subjSel.addEventListener("change", (e)=>{ state.subject = e.target.value; apply(); });
    fmtSel.addEventListener("change", (e)=>{ state.format = e.target.value; apply(); });
    document.querySelectorAll(".diff").forEach(cb => cb.addEventListener("change", ()=>{
      state.diffs = Array.from(document.querySelectorAll(".diff:checked")).map(x=>x.value);
      apply();
    }));

    // ツールボタン
    document.getElementById("btnImport").addEventListener("click", async ()=>{
      const input = document.createElement("input");
      input.type = "file"; input.accept = "application/json";
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const text = await file.text();
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json.questions)) {
            const all = await Data.all();
            const merged = all.concat(json.questions);
            Data.save(merged);
            toast(`📥 ${json.questions.length}件をインポートしました`);
            apply();
          } else if (Array.isArray(json)) {
            const all = await Data.all();
            Data.save(all.concat(json));
            toast(`📥 ${json.length}件をインポートしました`);
            apply();
          } else {
            alert("JSON形式が不正です");
          }
        } catch (e) {
          alert("読み込みに失敗しました");
        }
      };
      input.click();
    });

    document.getElementById("btnExport").addEventListener("click", async ()=>{
      const all = await Data.all();
      const filtered = Views._currentFiltered || all;
      const diffs = Array.from(document.querySelectorAll(".diff:checked")).map(x=>parseInt(x.value));
      const exportData = {
        exportDate: new Date().toISOString(),
        totalQuestions: all.length,
        exportedQuestions: filtered.length,
        filters: {
          search: document.getElementById("search").value,
          subject: document.getElementById("filterSubject").value,
          format: document.getElementById("filterFormat").value,
          difficulties: diffs
        },
        questions: filtered
      };
      downloadJson(exportData, `questions-export-${new Date().toISOString().slice(0,10)}.json`);
      toast(`📤 ${filtered.length}件をエクスポートしました`);
    });

    document.getElementById("btnValidate").addEventListener("click", async ()=>{
      const list = await Data.all();
      const issues = [];
      list.forEach((q, i) => {
        if (!q.id) issues.push(`No.${i+1}: IDが未設定`);
        if (!q.questionContent?.text && !q.question) issues.push(`${q.id || i+1}: 問題文が未入力`);
        if (!q.explanation?.text) issues.push(`${q.id || i+1}: 解説が未入力`);
        if (["A1","A2","A3"].includes(q.answerFormat||"")) {
          if (!q.answerData?.choices || q.answerData.choices.length < 2) issues.push(`${q.id}: 選択肢が不足`);
          if (!q.answerData?.correctAnswers || !q.answerData.correctAnswers.length) issues.push(`${q.id}: 正解が未設定`);
        }
      });
      if (!issues.length) alert(`✅ 検証完了\n問題は見つかりませんでした（${list.length}件）`);
      else alert(`⚠️ 検証結果（${issues.length}件）\n\n${issues.slice(0,20).join("\n")}${issues.length>20?`\n...他 ${issues.length-20}件`:``}`);
    });

    document.getElementById("btnBackup").addEventListener("click", async ()=>{
      const list = await Data.all();
      const logs = JSON.parse(localStorage.getItem("qm_access_log") || "[]").slice(-100);
      const payload = {
        backupDate: new Date().toISOString(),
        version: "1.0",
        data: { questions: list, accessLog: logs }
      };
      downloadJson(payload, `backup-${new Date().toISOString().slice(0,10)}.json`);
      toast("💾 バックアップを作成しました");
    });

    apply();
  },

  editor() {
    const params = new URLSearchParams((location.hash.split("?")[1]||""));
    const id = params.get("id") || "";
    return `
      <section class="card">
        <h2 style="margin-bottom:12px;">✏️ 問題エディタ ${id?`(編集: ${id})`:"(新規)"}</h2>
        <div class="form-row">
          <div class="form-group"><label>ID</label><input id="fId" placeholder="unique-id"></div>
          <div class="form-group"><label>科目</label><input id="fSubject" placeholder="math / english"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>形式</label><input id="fFormat" placeholder="A1 / F1 / F2"></div>
          <div class="form-group"><label>難易度</label><input id="fDiff" type="number" min="1" max="5" value="1"></div>
        </div>
        <div class="form-group"><label>問題文</label><textarea id="fText" rows="5" placeholder="問題文を入力"></textarea></div>
        <div class="form-group"><label>解説</label><textarea id="fExp" rows="4" placeholder="解説を入力"></textarea></div>
        <div class="form-group"><label>タグ（カンマ区切り）</label><input id="fTags" placeholder="数学, 計算"></div>
        <div class="toolbar">
          <button class="btn btn-primary" id="btnSave">保存</button>
          <a class="btn btn-secondary" href="#/questions">一覧へ戻る</a>
        </div>
      </section>
    `;
  },
  async bindEditor() {
    const params = new URLSearchParams((location.hash.split("?")[1]||""));
    const id = params.get("id");
    if (id) {
      const q = (await Data.all()).find(x=>x.id===id);
      if (q) {
        document.getElementById("fId").value = q.id;
        document.getElementById("fSubject").value = q.subject || "";
        document.getElementById("fFormat").value = q.answerFormat || "";
        document.getElementById("fDiff").value = q.difficulty || 1;
        document.getElementById("fText").value = q.questionContent?.text || q.question || "";
        document.getElementById("fExp").value = q.explanation?.text || "";
        document.getElementById("fTags").value = (q.tags||[]).join(", ");
      }
    }
    document.getElementById("btnSave").addEventListener("click", async ()=>{
      const q = {
        id: document.getElementById("fId").value.trim(),
        subject: document.getElementById("fSubject").value.trim(),
        answerFormat: document.getElementById("fFormat").value.trim(),
        difficulty: parseInt(document.getElementById("fDiff").value || "1", 10),
        tags: document.getElementById("fTags").value.split(",").map(s=>s.trim()).filter(Boolean),
        questionContent: { text: document.getElementById("fText").value },
        explanation: { text: document.getElementById("fExp").value },
        metadata: { createdAt: new Date().toISOString() },
        active: true
      };
      if (!q.id) { alert("ID は必須です"); return; }
      await Data.upsert(q);
      toast("💾 保存しました");
      location.hash = "#/questions";
    });
  }
};

// 共通ユーティリティ
function toast(message, type="success") {
  const el = document.createElement("div");
  el.className = "toast";
  el.style.background = type==="error" ? "#ef4444" : type==="warning" ? "#f59e0b" : "#22c55e";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(()=> el.style.transform = "translateX(0)", 50);
  setTimeout(()=> {
    el.style.transform = "translateX(120px)";
    setTimeout(()=> el.remove(), 250);
  }, 2500);
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// 起動
document.addEventListener("DOMContentLoaded", () => {
  // 既に auth.js がログイン状態を保証
  if (!AuthenticationSystem.getCurrentUser()) return;
  Router.init();
});
