// Common English Vocabulary quiz script for lev1~lev4 pages
// Enhanced with R2 integration via QuestaQuestionLoader
(function(){
  const questionContainer = document.getElementById('questionContainer');
  const loadBtn = document.getElementById('loadBtn');
  const gradeBtn = document.getElementById('gradeBtn');
  const mistakeBtn = document.getElementById('mistakeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const countSel = document.getElementById('countSel');
  const resultBox = document.getElementById('resultBox');
  const testMeta = document.getElementById('testMeta');

  const body = document.body;
  const dataUrl = body.getAttribute('data-json');
  const dataLevel = body.getAttribute('data-level') || 'lev1';

  // Initialize QuestaQuestionLoader for R2 integration
  let questionLoader = null;
  if (typeof QuestaQuestionLoader !== 'undefined') {
    questionLoader = new QuestaQuestionLoader({
      baseURL: 'https://questa-r2-api.t88596565.workers.dev/api',
      fallbackPath: '/data/questions'
    });
  }

  let allQuestions = [];
  let currentSet = [];
  let answers = {}; // qid -> selected index
  let graded = false;
  let mistakeIds = [];
  const STORE_KEY = 'english_vocab_session_' + dataLevel;

  function escapeHtml(s){
    return String(s).replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  async function loadData(){
    if (questionLoader) {
      // Try R2 first, fallback to static JSON
      try {
        console.log(`🔄 Loading vocab questions: english-vocab-${dataLevel}...`);
        const questions = await questionLoader.loadQuestions('english-vocab', dataLevel);
        allQuestions = Array.isArray(questions) ? questions : [];
        console.log(`✅ Loaded ${allQuestions.length} questions from R2/fallback`);
        buildSet();
        return;
      } catch (error) {
        console.warn('QuestaQuestionLoader failed, using traditional fetch:', error.message);
      }
    }
    
    // Fallback to traditional fetch
    fetch(dataUrl+'?_='+Date.now())
      .then(r=>{
        if(!r.ok) throw new Error('HTTP '+r.status);
        return r.json();
      })
      .then(data=>{
        allQuestions = Array.isArray(data)?data:[];
        console.log(`📋 Loaded ${allQuestions.length} questions from static JSON`);
        buildSet();
      })
      .catch(e=>{
        questionContainer.innerHTML = `<p style="color:#dc2626;font-size:.75rem;">ロード失敗: ${escapeHtml(e.message)}</p>`;
      });
  }

  function buildSet(){
    const n = parseInt(countSel.value,10);
    shuffle(allQuestions);
    currentSet = allQuestions.slice(0,n);
    answers = {};
    graded = false;
    mistakeIds = [];
    renderQuestions();
    resultBox.innerHTML = '';
    mistakeBtn.disabled = true;
    updateMeta();
    persistSession();
  }

  function renderQuestions(){
    questionContainer.innerHTML = currentSet.map((q,i)=>{
      const picked = answers[q.id];
      return `<fieldset class="qbox" data-qid="${escapeHtml(q.id)}">
        <legend>${escapeHtml(q.id)} (${i+1}/${currentSet.length})</legend>
        <p style="font-size:.8rem;margin-top:.25rem;">${escapeHtml(q.question)}</p>
        <div class="choices" role="group" aria-label="選択肢">
          ${q.choices.map((c,idx)=>{
            const sel = picked===idx ? 'choice-selected':'';
            return `<button type="button" data-choice="${idx}" class="btn small ${sel}" style="justify-content:flex-start;">${String.fromCharCode(65+idx)}. ${escapeHtml(c)}</button>`;
          }).join('')}
        </div>
        <div class="explanation" data-exp="${escapeHtml(q.id)}" hidden style="margin-top:.5rem;font-size:.65rem;background:var(--layer-bg-alt,#f4f7fb);padding:.5rem .6rem;border-radius:10px;"></div>
      </fieldset>`;
    }).join('');
    bindChoiceEvents();
  }

  function bindChoiceEvents(){
    questionContainer.querySelectorAll('fieldset.qbox').forEach(fs=>{
      fs.querySelectorAll('.choices button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(graded) return;
          const qid = fs.getAttribute('data-qid');
          const idx = parseInt(btn.getAttribute('data-choice'),10);
          answers[qid] = idx;
          fs.querySelectorAll('.choices button').forEach(b=>b.classList.remove('choice-selected'));
          btn.classList.add('choice-selected');
          persistSession();
        });
      });
    });
  }

  function grade(){
    if(!currentSet.length) return;
    let correct = 0;
    mistakeIds = [];
    currentSet.forEach(q=>{
      const user = answers[q.id];
      const ok = (typeof user==='number') && user===q.answer;
      if(ok) correct++; else mistakeIds.push(q.id);

      const fs = questionContainer.querySelector(`fieldset[data-qid="${CSS.escape(q.id)}"]`);
      if(fs){
        const exp = fs.querySelector(`.explanation[data-exp="${CSS.escape(q.id)}"]`);
        fs.querySelectorAll('.choices button').forEach(btn=>{
          const idx = parseInt(btn.getAttribute('data-choice'),10);
            if(idx === q.answer) btn.classList.add('correct');
            if(idx === user && idx !== q.answer) btn.classList.add('incorrect');
            btn.disabled = true;
            btn.classList.remove('choice-selected');
        });
        if(exp){
          exp.hidden = false;
          exp.innerHTML = `<strong>${ok?'✔ 正解':'✖ 不正解'}</strong><br>
            正答: ${escapeHtml(q.choices[q.answer])}<br>
            <em>${escapeHtml(q.explanation||'')}</em>`;
          exp.style.color = ok ? '#166534' : '#b91c1c';
        }
      }
    });
    const pct = Math.round(correct / currentSet.length * 100);
    resultBox.innerHTML = `<div class="glass" style="padding:1rem 1.2rem;">
      <h3 style="margin-bottom:.4rem;">結果: ${correct}/${currentSet.length} (${pct}%)</h3>
      <p style="font-size:.7rem;">${mistakeIds.length? '間違い: '+mistakeIds.join(', ') : '全問正解！'}</p>
    </div>`;
    graded = true;
    mistakeBtn.disabled = mistakeIds.length===0;
    updateMeta('(採点済)');
    persistSession(true);
  }

  function reviewMistakes(){
    if(!mistakeIds.length) return;
    currentSet = mistakeIds.map(id=>allQuestions.find(q=>q.id===id)).filter(Boolean);
    answers = {};
    graded = false;
    mistakeIds = [];
    renderQuestions();
    resultBox.innerHTML = '';
    mistakeBtn.disabled = true;
    updateMeta('(復習)');
    persistSession();
  }

  function clearAll(){
    currentSet = [];
    answers = {};
    graded = false;
    mistakeIds = [];
    questionContainer.innerHTML = '';
    resultBox.innerHTML = '';
    updateMeta('(クリア)');
    persistSession(true);
  }

  function updateMeta(extra=''){
    testMeta.textContent = `問題数=${currentSet.length}${extra?' '+extra:''}`;
  }

  function persistSession(finalize=false){
    try{
      const data = {
        count: countSel.value,
        currentSetIds: currentSet.map(q=>q.id),
        answers,
        graded,
        mistakeIds,
        finalize
      };
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    }catch(e){}
  }

  async function restoreSession(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw) return;
      const saved = JSON.parse(raw);
      if(!saved.currentSetIds) return;
      countSel.value = saved.count || '20';
      
      if (questionLoader) {
        try {
          const questions = await questionLoader.loadQuestions('english-vocab', dataLevel);
          allQuestions = Array.isArray(questions) ? questions : [];
          restoreFromSession(saved);
          return;
        } catch (error) {
          console.warn('Session restore R2 failed, using static:', error.message);
        }
      }
      
      // Fallback to static fetch
      fetch(dataUrl)
        .then(r=>r.json())
        .then(data=>{
          allQuestions = data;
          restoreFromSession(saved);
        });
    }catch(e){}
  }

  function restoreFromSession(saved) {
    currentSet = saved.currentSetIds.map(id=>allQuestions.find(q=>q.id===id)).filter(Boolean);
    answers = saved.answers || {};
    graded = !!saved.graded;
    mistakeIds = saved.mistakeIds || [];
    renderQuestions();
    if(graded) grade(); else updateMeta('(復元)');
  }

  loadBtn?.addEventListener('click', buildSet);
  gradeBtn?.addEventListener('click', grade);
  mistakeBtn?.addEventListener('click', reviewMistakes);
  clearBtn?.addEventListener('click', clearAll);

  document.addEventListener('DOMContentLoaded', ()=>{
    loadData();
    restoreSession();
  });
})();
