// ルーター + 画面描画 + 問題作成エディタ（A1/A2/A3/F1/F2対応）
const Router = {
  init() {
    window.addEventListener("hashchange", () => this.render());
    this.render();
  },
  async render() {
    const app = document.getElementById("app");
    const hash = location.hash || "#/dashboard";
    const path = hash.split("?")[0].slice(2);
    switch (path) {
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
        Views.bindDashboard();
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
          <a class="btn btn-secondary" href="#/questions">問題管理へ</a>
        </div>
      </section>
    `;
  },
  async bindDashboard() {
    try {
      const questions = await Api.listQuestions();
      const todayStr = new Date().toDateString();
      const todayCount = questions.filter(q => {
        const d = new Date(q.metadata?.createdAt || 0).toDateString();
        return d === todayStr;
      }).length;
      const avg = questions.length ? (questions.reduce((s,q)=>s+(q.difficulty||1),0)/questions.length).toFixed(1) : 0;
      document.getElementById("statTotal").textContent = questions.length;
      document.getElementById("statToday").textContent = todayCount;
      document.getElementById("statAvg").textContent = avg;
    } catch (e) {
      document.getElementById("statTotal").textContent = "0";
      document.getElementById("statToday").textContent = "0";
      document.getElementById("statAvg").textContent = "0";
    }
    const logs = JSON.parse(localStorage.getItem("qm_access_log") || "[]").slice(-5).reverse();
    const ul = document.getElementById("activityList");
    ul.innerHTML = logs.map(l => `<li>🔐 ${l.user} がログイン（${new Date(l.time).toLocaleString()}）</li>`).join("") || "<li>履歴はまだありません</li>";
  },

  questions() {
    return `
      <section class="card">
        <h2 style="margin-bottom:12px;">📋 問題管理</h2>
        <div class="toolbar">
          <a class="btn btn-primary" href="#/editor">新規作成</a>
          <button class="btn btn-secondary" id="btnExport">エクスポート(JSON)</button>
          <input id="search" placeholder="ID / テキスト / タグ を検索..." style="flex:1; min-width:180px;">
          <select id="filterSubject" style="min-width:140px;"></select>
          <select id="filterFormat" style="min-width:140px;"></select>
          <span class="row small">
            <label class="checkbox"><input type="checkbox" class="diff" value="1">基礎</label>
            <label class="checkbox"><input type="checkbox" class="diff" value="2">標準</label>
            <label class="checkbox"><input type="checkbox" class="diff" value="3">応用</label>
            <label class="checkbox"><input type="checkbox" class="diff" value="4">発展</label>
            <label class="checkbox"><input type="checkbox" class="diff" value="5">挑戦</label>
          </span>
        </div>
        <div class="card">
          <table class="table" id="qTable">
            <thead>
              <tr><th style="width:140px;">ID</th><th>問題文</th><th style="width:120px;">科目</th><th style="width:140px;">形式</th><th style="width:80px;">難易度</th><th style="width:160px;">操作</th></tr>
            </thead>
            <tbody id="qBody"><tr><td colspan="6">読み込み中...</td></tr></tbody>
          </table>
        </div>
      </section>
    `;
  },
  async bindQuestions() {
    const cfg = await fetch("config.json").then(r=>r.json()).catch(()=>({categories:{subjects:[],formats:[]}}));
    const subjSel = document.getElementById("filterSubject");
    subjSel.innerHTML = `<option value="">すべての科目</option>` + (cfg.categories.subjects || []).map(s=>`<option value="${s.id}">${s.icon||""} ${s.name}</option>`).join("");
    const fmtSel = document.getElementById("filterFormat");
    fmtSel.innerHTML = `<option value="">すべての形式</option>` + (cfg.categories.formats || []).map(f=>`<option value="${f.id}">${f.name}</option>`).join("");

    const state = { search:"", subject:"", format:"", diffs:[] };
    const apply = async () => {
      const list = await Api.listQuestions();
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
          <td>${escapeHtml((q.questionContent?.text || q.question || "")).slice(0,140)}${(q.questionContent?.text || q.question || "").length>140?"...":""}</td>
          <td>${q.subject||"-"}</td>
          <td>${q.answerFormat||"-"}</td>
          <td>${q.difficulty||"-"}</td>
          <td class="row">
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
            await Api.deleteQuestion(id);
            toast("🗑️ 削除しました");
            apply();
          }
        });
      });

      Views._currentFiltered = filtered;
    };

    document.getElementById("search").addEventListener("input", (e)=>{ state.search = e.target.value; apply(); });
    subjSel.addEventListener("change", (e)=>{ state.subject = e.target.value; apply(); });
    fmtSel.addEventListener("change", (e)=>{ state.format = e.target.value; apply(); });
    document.querySelectorAll(".diff").forEach(cb => cb.addEventListener("change", ()=>{
      state.diffs = Array.from(document.querySelectorAll(".diff:checked")).map(x=>x.value);
      apply();
    }));

    document.getElementById("btnExport").addEventListener("click", async ()=>{
      const all = await Api.listQuestions();
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
          <div class="form-group"><label>科目</label><input id="fSubject" placeholder="math / english / science"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>形式</label>
            <select id="fFormat">
              <option value="A1">A1（4択・単一正解）</option>
              <option value="A2">A2（4択・複数正解）</option>
              <option value="A3">A3（正誤）</option>
              <option value="F1">F1（数値/分数）</option>
              <option value="F2">F2（自由記述）</option>
            </select>
          </div>
          <div class="form-group"><label>難易度</label><input id="fDiff" type="number" min="1" max="5" value="1"></div>
        </div>

        <div class="form-group"><label>タグ（カンマ区切り）</label><input id="fTags" placeholder="数学, 計算"></div>

        <div class="form-group">
          <label>問題文（LaTeX可）</label>
          <textarea id="fText" rows="6" placeholder="例: $\\frac{2}{3} + \\frac{1}{4} = ?$"></textarea>
          <div class="row small">
            <input type="file" id="qImgInput" accept="image/*" style="display:none;">
            <button class="btn btn-secondary" id="btnAddImage" type="button">画像を追加</button>
            <span id="imgStatus" class="small"></span>
          </div>
          <div id="preview" class="card" style="margin-top:8px;">
            <div class="badge">プレビュー</div>
            <div id="previewBody" style="margin-top:8px;"></div>
          </div>
        </div>

        <div id="answerEditor" class="card" style="margin:12px 0; padding:16px;">
          <div class="badge">解答データ</div>
          <div id="answerBody" style="margin-top:12px;"></div>
        </div>

        <div class="form-group">
          <label>解説（LaTeX可）</label>
          <textarea id="fExp" rows="5" placeholder="解説を入力"></textarea>
          <div id="expPreview" class="card" style="margin-top:8px;">
            <div class="badge">解説プレビュー</div>
            <div id="expPreviewBody" style="margin-top:8px;"></div>
          </div>
        </div>

        <div class="toolbar">
          <button class="btn btn-primary" id="btnSave">保存</button>
          <a class="btn btn-secondary" href="#/questions">一覧へ戻る</a>
        </div>
      </section>
    `;
  },

  async bindEditor() {
    const $ = (id) => document.getElementById(id);
    const params = new URLSearchParams((location.hash.split("?")[1]||""));
    const id = params.get("id");
    const model = {
      id: "", subject: "", answerFormat: "A1", difficulty: 1,
      tags: [], questionContent: { text: "", images: [] },
      answerData: {}, explanation: { text: "" }, metadata: { createdAt: new Date().toISOString() }, active: true
    };

    const renderPreview = async () => {
      $("previewBody").textContent = model.questionContent.text || "(プレビューなし)";
      await MathJax.typesetPromise?.();
    };
    const renderExpPreview = async () => {
      $("expPreviewBody").textContent = model.explanation.text || "(プレビューなし)";
      await MathJax.typesetPromise?.();
    };

    // 解答エディタ
    const renderAnswer = () => {
      const root = $("answerBody");
      const fmt = model.answerFormat;
      const ui = [];
      if (fmt === "A1" || fmt === "A2") {
        const isMulti = fmt === "A2";
        model.answerData.type = "multiple-choice";
        model.answerData.choices = model.answerData.choices || ["", "", "", ""];
        model.answerData.correctAnswers = model.answerData.correctAnswers || [];
        ui.push(`<div class="small">選択肢と正解を設定（${isMulti?"複数":"単一"}）</div>`);
        ui.push(`<table class="table"><thead><tr><th style="width:60px;">正解</th><th>選択肢</th><th style="width:60px;">操作</th></tr></thead><tbody id="choicesBody"></tbody></table>`);
        root.innerHTML = ui.join("");
        const tbody = $("choicesBody");
        const drawChoices = () => {
          tbody.innerHTML = model.answerData.choices.map((c, idx) => `
            <tr>
              <td>${isMulti
                ? `<input type="checkbox" data-correct="${idx}" ${model.answerData.correctAnswers.includes(idx)?'checked':''}>`
                : `<input name="correct" type="radio" data-correct="${idx}" ${model.answerData.correctAnswers.includes(idx)?'checked':''}>`}</td>
              <td><input data-choice="${idx}" value="${escapeHtml(c)}"></td>
              <td><button class="btn btn-danger" data-del-choice="${idx}">削除</button></td>
            </tr>
          `).join("");
          tbody.querySelectorAll("[data-choice]").forEach(inp=>{
            inp.addEventListener("input",(e)=>{
              const i = parseInt(inp.getAttribute("data-choice"),10);
              model.answerData.choices[i] = e.target.value;
            });
          });
          tbody.querySelectorAll("[data-del-choice]").forEach(btn=>{
            btn.addEventListener("click", ()=>{
              const i = parseInt(btn.getAttribute("data-del-choice"),10);
              model.answerData.choices.splice(i,1);
              model.answerData.correctAnswers = model.answerData.correctAnswers.filter(x=>x!==i).map(x=> x>i?x-1:x);
              drawChoices();
            });
          });
          tbody.querySelectorAll("[data-correct]").forEach(inp=>{
            inp.addEventListener("change", ()=>{
              const i = parseInt(inp.getAttribute("data-correct"),10);
              if (isMulti) {
                if (inp.checked && !model.answerData.correctAnswers.includes(i)) model.answerData.correctAnswers.push(i);
                if (!inp.checked) model.answerData.correctAnswers = model.answerData.correctAnswers.filter(x=>x!==i);
              } else {
                model.answerData.correctAnswers = [i];
                tbody.querySelectorAll("[name='correct']").forEach(r=>{ if (parseInt(r.getAttribute("data-correct"),10)!==i) r.checked=false; });
              }
            });
          });
        };
        drawChoices();
        const addBtn = document.createElement("button");
        addBtn.className = "btn btn-secondary";
        addBtn.textContent = "選択肢を追加";
        addBtn.addEventListener("click", ()=>{ model.answerData.choices.push(""); drawChoices(); });
        root.appendChild(addBtn);
      } else if (fmt === "A3") {
        model.answerData.type = "boolean";
        if (!Array.isArray(model.answerData.correctAnswers)) model.answerData.correctAnswers = [0];
        root.innerHTML = `
          <div class="row"><label class="checkbox"><input type="radio" name="tf" value="true" ${model.answerData.correctAnswers[0]===1?'checked':''}> 正しい</label>
          <label class="checkbox"><input type="radio" name="tf" value="false" ${model.answerData.correctAnswers[0]!==1?'checked':''}> 誤り</label></div>
        `;
        root.querySelectorAll('input[name="tf"]').forEach(r=>{
          r.addEventListener("change", ()=>{
            model.answerData.correctAnswers = [r.value==="true"?1:0];
          });
        });
      } else if (fmt === "F1") {
        model.answerData.type = "numeric";
        model.answerData.expected = model.answerData.expected || [""];
        model.answerData.tolerance = model.answerData.tolerance ?? 0;
        root.innerHTML = `
          <div class="small">期待する数値（分数可: 1/2 など）、複数入力可</div>
          <div id="numWrap"></div>
          <div class="form-row">
            <div class="form-group"><label>許容誤差</label><input id="numTol" type="number" step="any" value="${model.answerData.tolerance}"></div>
            <div class="form-group small" style="display:flex;align-items:flex-end;">例: 3.14 / 22/7</div>
          </div>
          <button class="btn btn-secondary" id="btnAddExpected">期待値を追加</button>
        `;
        const wrap = document.getElementById("numWrap");
        const draw = () => {
          wrap.innerHTML = model.answerData.expected.map((v,i)=>`
            <div class="row" style="margin:6px 0;">
              <input data-exp="${i}" value="${v}">
              <button class="btn btn-danger" data-del-exp="${i}">削除</button>
            </div>
          `).join("");
          wrap.querySelectorAll("[data-exp]").forEach(inp=>{
            inp.addEventListener("input",(e)=>{
              const i = parseInt(inp.getAttribute("data-exp"),10);
              model.answerData.expected[i] = e.target.value;
            });
          });
          wrap.querySelectorAll("[data-del-exp]").forEach(btn=>{
            btn.addEventListener("click", ()=>{
              const i = parseInt(btn.getAttribute("data-del-exp"),10);
              model.answerData.expected.splice(i,1);
              draw();
            });
          });
        };
        draw();
        document.getElementById("btnAddExpected").addEventListener("click", ()=>{ model.answerData.expected.push(""); draw(); });
        document.getElementById("numTol").addEventListener("input",(e)=>{ model.answerData.tolerance = parseFloat(e.target.value || "0")||0; });
      } else if (fmt === "F2") {
        model.answerData.type = "text";
        model.answerData.keywords = model.answerData.keywords || [];
        root.innerHTML = `
          <div class="small">キーワード（含まれていれば正解扱いなど）、改行で複数</div>
          <textarea id="kw" rows="4" placeholder="例: 反復\n理解\n実践">${model.answerData.keywords.join("\n")}</textarea>
        `;
        document.getElementById("kw").addEventListener("input",(e)=>{
          model.answerData.keywords = e.target.value.split("\n").map(s=>s.trim()).filter(Boolean);
        });
      }
    };

    // 画像アップロード
    $("btnAddImage").addEventListener("click", ()=> $("qImgInput").click());
    $("qImgInput").addEventListener("change", async (e)=>{
      const f = e.target.files?.[0];
      if (!f) return;
      $("imgStatus").textContent = "アップロード中...";
      try {
        const { url, key } = await Api.uploadFile(f);
        model.questionContent.images = model.questionContent.images || [];
        model.questionContent.images.push({ key, url });
        model.questionContent.text += `\n\n![画像](${url})\n`;
        $("fText").value = model.questionContent.text;
        await renderPreview();
        $("imgStatus").textContent = "アップロード完了";
      } catch (err) {
        $("imgStatus").textContent = "アップロード失敗";
      } finally {
        setTimeout(()=> $("imgStatus").textContent = "", 2000);
        e.target.value = "";
      }
    });

    // 入力紐付け
    const syncFields = async () => {
      model.id = $("fId").value.trim();
      model.subject = $("fSubject").value.trim();
      model.answerFormat = $("fFormat").value;
      model.difficulty = parseInt($("fDiff").value || "1", 10);
      model.tags = $("fTags").value.split(",").map(s=>s.trim()).filter(Boolean);
      model.questionContent.text = $("fText").value;
      model.explanation.text = $("fExp").value;
      await renderPreview();
      await renderExpPreview();
      renderAnswer();
    };

    ["fId","fSubject","fFormat","fDiff","fTags","fText","fExp"].forEach(id=>{
      document.getElementById(id).addEventListener("input", syncFields);
    });
    document.getElementById("fFormat").addEventListener("change", syncFields);

    // 既存ロード
    if (id) {
      const q = await Api.getQuestion(id);
      if (q) {
        Object.assign(model, q);
        $("fId").value = model.id;
        $("fSubject").value = model.subject || "";
        $("fFormat").value = model.answerFormat || "A1";
        $("fDiff").value = model.difficulty || 1;
        $("fText").value = model.questionContent?.text || model.question || "";
        $("fExp").value = model.explanation?.text || "";
        $("fTags").value = (model.tags||[]).join(", ");
      }
    }

    // 初期描画
    await syncFields();

    // 保存
    document.getElementById("btnSave").addEventListener("click", async ()=>{
      const q = structuredClone(model);
      if (!q.id) { alert("ID は必須です"); return; }
      // 後方互換: question にもテキストを入れておく
      q.question = q.questionContent?.text || q.question || "";
      if (!q.metadata?.createdAt) q.metadata = { ...(q.metadata||{}), createdAt: new Date().toISOString() };
      try {
        await Api.saveQuestion(q);
        toast("💾 保存しました");
        location.hash = "#/questions";
      } catch (e) {
        toast("保存に失敗しました", "error");
      }
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
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

// 起動
document.addEventListener("DOMContentLoaded", () => {
  if (!AuthenticationSystem.getCurrentUser()) return;
  Router.init();
});
