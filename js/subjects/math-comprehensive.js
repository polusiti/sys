(function(){
  const DATA_URL = '../data/questions/math.json';  // comprehensive.html からの相対
  const LS_KEY   = 'learning_notebook_math_comprehensive_session_v1';

  // 要素取得
  const startBtn       = document.getElementById('startBtn');
  const resumeBtn      = document.getElementById('resumeBtn');
  const gradeBtn       = document.getElementById('gradeBtn');
  const retryBtn       = document.getElementById('retryBtn');
  const mistakeBtn     = document.getElementById('mistakeBtn');
  const countSel       = document.getElementById('countSel');
  const diffSel        = document.getElementById('diffSel');
  const modeSel        = document.getElementById('modeSel');
  const testSection    = document.getElementById('testSection');
  const questionContainer = document.getElementById('questionContainer');
  const testMeta       = document.getElementById('testMeta');
  const resultBox      = document.getElementById('resultBox');

  let allQuestions = [];
  let currentSet   = [];
  let answers      = {};
  let graded       = false;
  let lastMistakeSet = [];

  init();

  async function init(){
    await loadData();
    detectResume();
    wireEvents();
  }

  async function loadData(){
    try {
      const res = await fetch(DATA_URL, {cache:'no-store'});
      if(!res.ok){
        console.error('問題データ取得失敗 status=', res.status);
        return;
      }
      const data = await res.json();
      allQuestions = Array.isArray(data)
        ? data.filter(q => q && q.active !== false)
        : [];
      if(!allQuestions.length){
        console.warn('有効な問題が0件です');
      }
    } catch(e){
      console.error('データ取得エラー', e);
    }
  }

  function detectResume(){
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return;
    try{
      const session = JSON.parse(raw);
      if(session && Array.isArray(session.questions) && !session.completed){
        resumeBtn.style.display = 'inline-flex';
        resumeBtn.addEventListener('click', ()=>{
          currentSet = session.questions;
            answers   = session.answers || {};
          renderQuestions(currentSet);
          updateMeta('(前回復元)');
          testSection.style.display = '';
        }, {once:true});
      }
    }catch(e){
      console.warn('復元失敗', e);
    }
  }

  function wireEvents(){
    startBtn.addEventListener('click', startNew);
    retryBtn.addEventListener('click', startNew);
    gradeBtn.addEventListener('click', grade);
    mistakeBtn.addEventListener('click', ()=>{
      if(!lastMistakeSet.length) return;
      currentSet = lastMistakeSet
        .map(id => allQuestions.find(q=> q.id === id))
        .filter(Boolean);
      answers = {};
      graded = false;
      lastMistakeSet = [];
      renderQuestions(currentSet);
      updateMeta('(復習セット)');
      resultBox.innerHTML = '';
      mistakeBtn.disabled = true;
      persistSession();
    });
  }

  function startNew(){
    graded = false;
    resultBox.innerHTML = '';
    lastMistakeSet = [];

    const count    = parseInt(countSel.value,10);
    const diffSpec = diffSel.value.trim();
    const mode     = modeSel.value;

    const filtered = filterByDifficulty(allQuestions, diffSpec);
    if(!filtered.length){
      alert('該当難易度の問題がありません');
      return;
    }

    currentSet = (mode === 'balanced')
      ? balancedSample(filtered, count)
      : uniformSample(filtered, count);

    answers = {};
    renderQuestions(currentSet);
    updateMeta();
    testSection.style.display = '';
    mistakeBtn.disabled = true;
    persistSession();
  }

  function filterByDifficulty(list, spec){
    if(!spec) return list;
    const set = new Set();
    spec.split(',').forEach(part=>{
      const p = part.trim();
      if(!p) return;
      if(p.includes('-')){
        const [a,b] = p.split('-').map(n=>parseInt(n,10));
        if(Number.isInteger(a) && Number.isInteger(b) && a<=b){
          for(let i=a;i<=b;i++) set.add(i);
        }
      } else {
        const v = parseInt(p,10);
        if(Number.isInteger(v)) set.add(v);
      }
    });
    return set.size ? list.filter(q=> set.has(q.difficulty)) : list;
  }

  function uniformSample(list, k){
    if(k >= list.length) return shuffle([...list]).slice(0,k);
    const used = new Set();
    const out = [];
    while(out.length < k){
      const idx = Math.floor(Math.random()*list.length);
      if(!used.has(idx)){
        used.add(idx);
        out.push(list[idx]);
      }
    }
    return out;
  }

  function balancedSample(list, k){
    const buckets = {};
    list.forEach(q => (buckets[q.difficulty] ||= []).push(q));
    Object.values(buckets).forEach(arr => shuffle(arr));
    const diffs = Object.keys(buckets).sort((a,b)=> a - b);
    const result = [];
    let i=0;
    while(result.length < k && result.length < list.length){
      const d = diffs[i % diffs.length];
      const arr = buckets[d];
      if(arr && arr.length){
        result.push(arr.shift());
      }
      i++;
      if(diffs.every(dd => (buckets[dd]||[]).length === 0)) break;
    }
    return result;
  }

  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function renderQuestions(qs){
    questionContainer.innerHTML = qs.map((q,i)=>{
      const name = `q_${q.id}`;
      return `
        <fieldset class="subject-card obs" data-qid="${escapeAttr(q.id)}" style="min-width:260px;">
          <legend style="font-weight:600;">Q${i+1}. ${escapeHtml(q.stem||'')}</legend>
          <p style="font-size:.8rem; margin-top:.3rem;">${escapeHtml(q.question||'')}</p>
          <ul style="list-style:none; margin-top:.6rem; display:flex; flex-direction:column; gap:.4rem; padding:0;">
            ${(q.choices||[]).map((c,ci)=>`
              <li>
                <label style="display:flex; gap:.45rem; align-items:flex-start; font-size:.78rem;">
                  <input type="radio" name="${name}" value="${ci}" ${answers[q.id]===ci?'checked':''}>
                  <span>${escapeHtml(String(c))}</span>
                </label>
              </li>`).join('')}
          </ul>
          <div class="explanation" data-exp="${escapeAttr(q.id)}" hidden
               style="margin-top:.6rem; font-size:.7rem; background:var(--layer-bg-alt,#f4f7fb);
                      padding:.55rem .65rem; border-radius:10px;"></div>
        </fieldset>`;
    }).join('');

    typesetMath(questionContainer);
  }

  function grade(){
    if(!currentSet.length) return;

    currentSet.forEach(q=>{
      const sel = questionContainer.querySelector(`input[name="q_${CSS.escape(q.id)}"]:checked`);
      answers[q.id] = sel ? parseInt(sel.value,10) : null;
    });

    let correct = 0;
    const mistakes = [];

    currentSet.forEach(q=>{
      const ok = answers[q.id] === q.answer;
      if(ok) correct++; else mistakes.push(q.id);
      const box = questionContainer.querySelector(`.explanation[data-exp="${CSS.escape(q.id)}"]`);
      if(box){
        box.hidden = false;
        box.innerHTML = `
          <strong>${ok?'✔ 正解':'✖ 不正解'}</strong><br>
          正解: ${escapeHtml(choiceLabel(q,q.answer))}<br>
          あなた: ${answers[q.id]!=null ? escapeHtml(choiceLabel(q,answers[q.id])) : '(未回答)'}<br>
          <em>${escapeHtml(q.explanation || '')}</em>
        `;
        box.style.color = ok ? '#166534' : '#b91c1c';
      }
    });

    const pct = Math.round(correct / currentSet.length * 100);
    resultBox.innerHTML = `
      <div class="glass" style="padding:1rem 1.2rem;">
        <h3 style="margin-bottom:.4rem;">結果: ${correct}/${currentSet.length} (${pct}%)</h3>
        <p style="font-size:.7rem;">${mistakes.length ? '間違え: '+mistakes.join(', ') : '全問正解！'}</p>
      </div>
    `;

    graded = true;
    lastMistakeSet = mistakes;
    mistakeBtn.disabled = mistakes.length === 0;
    persistSession(true);

    typesetMath(questionContainer);
    typesetMath(resultBox);
  }

  function choiceLabel(q, idx){
    if(!q || !Array.isArray(q.choices) || idx==null || idx<0 || idx>=q.choices.length) return '';
    return String(q.choices[idx]);
  }

  function updateMeta(extra=''){
    const diffInfo = diffSel.value ? `難易度=${diffSel.value}` : '難易度=全';
    testMeta.textContent = `問題数=${currentSet.length} / ${diffInfo} ${extra}`;
  }

  function persistSession(completed=false){
    try{
      const session = {
        version:1,
        timestamp:new Date().toISOString(),
        questions: currentSet,
        answers,
        completed: completed || graded
      };
      localStorage.setItem(LS_KEY, JSON.stringify(session));
    }catch(e){
      console.warn('保存失敗', e);
    }
  }

  function typesetMath(scope){
    if(!(window.MathJax && window.MathJax.typesetPromise)) return;
    window.MathJax.typesetPromise([scope]).catch(err=>{
      console.error('MathJax typeset error:', err);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function escapeAttr(s){
    return escapeHtml(s).replace(/"/g,'&quot;');
  }
})();
