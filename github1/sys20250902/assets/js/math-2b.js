// Math II-B: LaTeX single-input + live preview + normalization + grading
(function(){
  const DATA_URL = '../data/questions/math2b.json';
  const STORE_KEY = 'math2b_latex_v1';

  const qWrap = document.getElementById('questionContainer');
  const loadBtn = document.getElementById('loadBtn');
  const gradeBtn = document.getElementById('gradeBtn');
  const mistakeBtn = document.getElementById('mistakeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const countSel = document.getElementById('countSel');
  const diffSel = document.getElementById('diffSel');
  const resultBox = document.getElementById('resultBox');
  const testMeta = document.getElementById('testMeta');
  const kbd = document.getElementById('globalKbd');

  let allQ = [];
  let setQ = [];
  let answers = {};
  let mistakes = [];
  let graded = false;
  let lastFocusedInput = null;

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]];} return a; }
  function esc(s){ return String(s).replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Fallback（data が無いとき用；本番では JSON を使用）
  const SAMPLE = [];

  function katexRender(tex, el){
    try{ window.katex && katex.render(tex, el, {throwOnError:false}); }
    catch(_){ el.textContent = tex; }
  }

  function stripInlineDollar(s){
    if(!s) return '';
    const m = s.match(/^\s*\$(.*)\$\s*$/);
    return m ? m[1] : s;
  }

  function normalizeExpected(q){
    // expectedLatex があればそれを基準に expectedNormalized を作成
    const forms = Array.isArray(q.expectedLatex) ? q.expectedLatex : [];
    if(forms.length){
      q.expectedNormalized = forms.map(s=>{
        const r = window.AnswerNormalizer.normalizeAnswer(s, q.mode || 'generic');
        return r.normalized;
      }).filter(Boolean);
      return;
    }
    // フォールバック：型に応じて expected から 1 つだけ組み立て（本 JSON では基本不要）
    const latex = buildExpectedFromObject(q) || '';
    if(latex){
      const r = window.AnswerNormalizer.normalizeAnswer(latex, q.mode || 'generic');
      q.expectedNormalized = [ r.normalized ];
    }else{
      q.expectedNormalized = [];
    }
  }

  // 型ごとのフォールバック（今回の JSON では使わない前提）
  function buildExpectedFromObject(q){
    if(!q.expected) return '';
    const t = q.type;
    if(t==='vector' && q.expected.terms){
      const terms = (q.expected.terms||[]).slice().sort((p,q)=>p.name.localeCompare(q.name));
      return terms.map((it,i)=>{
        const n=it.coef?.num|0, d=(it.coef?.den|0)||1;
        const mag = d===1? Math.abs(n) : `\\frac{${Math.abs(n)}}{${d}}`;
        if(n===1 && d===1) return `${i?'+':''}\\vec{${it.name}}`;
        if(n===-1 && d===1) return `${i?'-':'-'}\\vec{${it.name}}`;
        return `${n<0?(i?'-':'-'):(i?'+':'')}${mag}\\vec{${it.name}}`;
      }).join('');
    }
    if(t==='ratio' && q.expected.a!==undefined) return `${q.expected.a}:${q.expected.b}`;
    if(t==='line'){
      const e=q.expected;
      if(e.form==='x') return `x=${fracToLatex(e.c)}`;
      const ms=(e.m.num===1 && e.m.den===1)?'x':(e.m.num===-1 && e.m.den===1)?'-x':`${fracToLatex(e.m)}x`;
      const bs=(e.b.num===0)?'':(e.b.num>0?`+${fracToLatex(e.b)}`:`${fracToLatex(e.b)}`);
      return `y=${ms}${bs}`;
    }
    if(t==='congruence') return `${q.expected.a}\\equiv${q.expected.b}\\pmod{${q.expected.m}}`;
    return '';
  }
  function fracToLatex(fr){ if(!fr) return '0'; const n=fr.num|0, d=(fr.den|0)||1; return d===1? String(n): `\\frac{${n}}{${d}}`; }

  function loadData(){
    fetch(DATA_URL+'?_='+(Date.now()))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP '+r.status)))
      .then(data => {
        allQ = Array.isArray(data) && data.length ? data : SAMPLE;
        // mode 決定（型→normalizer の mode）
        allQ.forEach(q=>{
          const map = { vector:'generic', sequence:'generic', 'sequence-sum':'generic', comb:'generic' };
          q.mode = map[q.type] || 'generic';
          normalizeExpected(q);
        });
        buildSet();
      })
      .catch(_=>{
        allQ = SAMPLE;
        buildSet();
      });
  }

  function buildSet(){
    const n = parseInt(countSel.value,10);
    const diff = diffSel.value ? parseInt(diffSel.value,10) : null;
    let pool = allQ;
    if(diff) pool = pool.filter(q=>q.difficulty===diff);
    shuffle(pool);
    setQ = pool.slice(0,n);
    answers = {};
    mistakes = [];
    graded = false;
    render();
    resultBox.innerHTML = '';
    mistakeBtn.disabled = true;
    updateMeta();
    persist();
  }

  function render(){
    qWrap.innerHTML = setQ.map((q,i)=>{
      const aid = q.id;
      const ans = answers[aid] || {raw:'', normalized:'', error:'', warn:'', katex:''};
      return `<fieldset class="qbox" data-qid="${esc(aid)}">
        <legend>${esc(aid)} / 難度:${esc(q.difficulty)} (${i+1}/${setQ.length}) <span class="mode-tag">[${esc(q.type)}]</span></legend>
        <div class="qtext">
          <div class="stem" id="stem-${esc(aid)}"></div>
          <div class="ques" id="ques-${esc(aid)}"></div>
        </div>
        <div class="input-area">
          <input type="text" id="in-${esc(aid)}" placeholder="LaTeX で入力（例: a_n=2^{n}-1, \\frac{3^{n}-1}{2}, -\\frac{2}{3}, \\sqrt{17}）"
                 autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(ans.raw)}" />
          <div class="preview" id="prev-${esc(aid)}"></div>
          <div class="norm" id="norm-${esc(aid)}">${esc(ans.normalized||'')}</div>
          <div class="err" id="err-${esc(aid)}">${esc(ans.error||'')}</div>
          <div class="warn" id="warn-${esc(aid)}">${esc(ans.warn||'')}</div>
        </div>
      </fieldset>`;
    }).join('');

    // 表示（stem はテキスト、question は $...$ 内を KaTeX レンダ）
    setQ.forEach(q=>{
      const stemEl = document.getElementById(`stem-${q.id}`);
      const quesEl = document.getElementById(`ques-${q.id}`);
      if(stemEl) stemEl.textContent = q.stem || '';
      if(quesEl){
        const tex = stripInlineDollar(q.question||'');
        katexRender(tex, quesEl);
      }
    });

    // 入力イベント
    setQ.forEach(q=>{
      const inp = document.getElementById(`in-${q.id}`);
      inp.addEventListener('focus', ()=>{ lastFocusedInput = inp; });
      inp.addEventListener('input', ()=> handleInput(q.id));
    });
  }

  function handleInput(qid){
    const q = setQ.find(x=>x.id===qid);
    if(!q) return;
    const inp = document.getElementById(`in-${qid}`);
    const prev = document.getElementById(`prev-${qid}`);
    const norm = document.getElementById(`norm-${qid}`);
    const err = document.getElementById(`err-${qid}`);
    const warn = document.getElementById(`warn-${qid}`);

    const r = window.AnswerNormalizer.normalizeAnswer(inp.value, q.mode || 'generic');
    answers[qid] = {
      raw: inp.value,
      normalized: r.normalized,
      error: (r.errors[0]||''),
      warn: (r.warnings && r.warnings[0]) || '',
      katex: r.katex
    };
    norm.textContent = r.normalized || '';
    warn.textContent = (r.warnings && r.warnings[0]) || '';
    if(r.errors.length){
      err.textContent = r.errors[0];
      prev.textContent = '';
    }else{
      err.textContent = '';
      katexRender(r.katex, prev);
    }
    persist();
  }

  function grade(){
    if(!setQ.length) return;
    mistakes = [];
    let correct = 0;

    setQ.forEach(q=>{
      const aid = q.id;
      const ans = answers[aid] || {normalized:'', raw:''};
      const expects = Array.isArray(q.expectedNormalized) ? q.expectedNormalized : [];
      const ok = ans.normalized && expects.includes(ans.normalized);
      if(ok) correct++; else mistakes.push(aid);

      const err = document.getElementById(`err-${aid}`);
      if(ok){
        err.innerHTML = `<span class="ok">✔ 正解</span>`;
      }else{
        const show = (q.expectedLatex && q.expectedLatex[0]) || '';
        err.innerHTML = `<span class="ng">✖ 不正解</span> / 正解例: <code>${esc(show)}</code>`;
      }
    });

    const pct = Math.round(correct / setQ.length * 100);
    resultBox.innerHTML = `<div class="glass"><h3 style="margin-bottom:.4rem;">結果: ${correct}/${setQ.length} (${pct}%)</h3>
      <p style="font-size:.85rem;">${mistakes.length? '間違い: '+mistakes.join(', ') : '全問正解！'}</p></div>`;
    graded = true;
    mistakeBtn.disabled = mistakes.length===0;
    updateMeta('(採点済)');
    persist(true);
  }

  function reviewMistakes(){
    if(!mistakes.length) return;
    setQ = mistakes.map(id=> allQ.find(q=>q.id===id)).filter(Boolean);
    answers = {};
    mistakes = [];
    graded = false;
    render();
    resultBox.innerHTML = '';
    mistakeBtn.disabled = true;
    updateMeta('(復習)');
    persist();
  }

  function clearAll(){
    setQ = [];
    answers = {};
    mistakes = [];
    graded = false;
    qWrap.innerHTML = '';
    resultBox.innerHTML = '';
    updateMeta('(クリア)');
    persist(true);
  }

  function updateMeta(extra=''){
    testMeta.textContent = `問題数=${setQ.length}${extra?' '+extra:''}`;
  }

  function persist(finalize=false){
    try{
      localStorage.setItem(STORE_KEY, JSON.stringify({
        count: countSel.value,
        diff: diffSel.value,
        ids: setQ.map(q=>q.id),
        answers, graded, mistakes, finalize
      }));
    }catch(_){}
  }

  function restore(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw){ loadData(); return; }
      const saved = JSON.parse(raw);
      if(saved.count) countSel.value = saved.count;
      if(saved.diff!==undefined) diffSel.value = saved.diff;

      fetch(DATA_URL).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
        allQ = Array.isArray(data)&&data.length ? data : SAMPLE;
        allQ.forEach(q=>{
          const map = { vector:'generic', sequence:'generic', 'sequence-sum':'generic', comb:'generic' };
          q.mode = map[q.type] || 'generic';
          normalizeExpected(q);
        });

        if(Array.isArray(saved.ids) && saved.ids.length){
          setQ = saved.ids.map(id=> allQ.find(q=>q.id===id)).filter(Boolean);
        }else{
          const n = parseInt(countSel.value,10);
          setQ = shuffle(allQ.slice()).slice(0,n);
        }
        answers = saved.answers || {};
        graded = !!saved.graded;
        mistakes = saved.mistakes || [];
        render();
        Object.keys(answers).forEach(id=>{
          const a = answers[id];
          const inp = document.getElementById(`in-${id}`);
          if(inp){ inp.value = a.raw || ''; handleInput(id); }
        });
        if(graded) grade(); else updateMeta('(復元)');
      }).catch(()=>{
        allQ = SAMPLE;
        buildSet();
      });
    }catch(_){
      loadData();
    }
  }

  // グローバルキーボード
  if(kbd){
    kbd.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-ins]');
      if(!btn) return;
      if(!lastFocusedInput) return;
      const text = btn.getAttribute('data-ins') || '';
      insertAtCursor(lastFocusedInput, text);
      lastFocusedInput.dispatchEvent(new Event('input', {bubbles:true}));
      lastFocusedInput.focus();
    });
  }
  function insertAtCursor(input, text){
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    input.setRangeText(text, start, end, 'end');
  }

  // イベント
  loadBtn.addEventListener('click', buildSet);
  gradeBtn.addEventListener('click', grade);
  mistakeBtn.addEventListener('click', reviewMistakes);
  clearBtn.addEventListener('click', clearAll);
  document.addEventListener('DOMContentLoaded', restore);
})();
