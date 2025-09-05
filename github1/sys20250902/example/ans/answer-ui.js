;(function(global){
  'use strict';

  // Answer UI Version 3.0 - Completely redesigned F1 vertical fraction layout
  const ANSUI_VERSION = '3.0';

  // Styles (scoped)
  const style = document.createElement('style');
  style.textContent = `
  .ansui-root{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:99999; }
  .ansui-root .backdrop{ position:absolute; inset:0; background:rgba(2,6,23,.55); backdrop-filter: blur(2px); }
  .ansui-root .panel{ position:relative; width:min(92vw, 820px); background: var(--ansui-card, #0f172a); color: var(--ansui-fg, #e2e8f0); border:1px solid var(--ansui-border, #1f2a44); border-radius:14px; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .ansui-root .head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 14px; border-bottom:1px solid var(--ansui-border, #1f2a44); }
  .ansui-root .title{ font-weight:800; }
  .ansui-root .close{ background:transparent; color:inherit; border:1px solid var(--ansui-border,#1f2a44); border-radius:10px; padding:6px 10px; cursor:pointer; }
  .ansui-root .body{ padding:14px; display:grid; gap:16px; }
  .ansui-root .question{ font-size:1.05rem; }
  .ansui-root .choices{ display:grid; gap:8px; }
  .ansui-root .choices.cols-2{ grid-template-columns: repeat(2, 1fr); }
  .ansui-root .choices.cols-3{ grid-template-columns: repeat(3, 1fr); }
  .ansui-root .btn{ background: var(--ansui-accent, #22d3ee); color: #001018; border:0; padding:10px 12px; border-radius:10px; font-weight:800; cursor:pointer; text-align:center; }
  .ansui-root .btn.alt{ background: transparent; color: inherit; border:1px solid var(--ansui-border, #1f2a44); }
  .ansui-root .btn.mini{ padding:4px 8px; font-size:.9rem; }
  .ansui-root .row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

  .ansui-root input[type="number"], .ansui-root input[type="text"]{
    width: 100%; max-width: 140px; padding:8px; border-radius:8px;
    border:1px solid var(--ansui-border, #1f2a44);
    background: color-mix(in oklab, var(--ansui-card,#0f172a), #0b1220 20%);
    color: var(--ansui-fg, #e2e8f0);
  }

  .ansui-root .grid-3{ display:grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap:10px; align-items:end; }
  .ansui-root .preview{ padding:8px 10px; border-radius:8px; border:1px solid var(--ansui-border, #1f2a44);
    background: color-mix(in oklab, var(--ansui-card,#0f172a), #0b1220 20%); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .ansui-root .foot{ display:flex; gap:8px; justify-content:flex-end; align-items:center; padding:12px 14px; border-top:1px solid var(--ansui-border, #1f2a44); }
  .ansui-root.light{ --ansui-card:#ffffff; --ansui-fg:#0f172a; --ansui-border:#e2e8f0; --ansui-accent:#0891b2; }

  /* Center/displaystyle-like vertical fraction with tap-to-fill boxes (\\anaume{...}風) */
  .ansui-root .disp-wrap{ display:flex; align-items:center; justify-content:center; }
  .ansui-root .frac-disp{ display:inline-grid; grid-template-rows:auto 3px auto; justify-items:center; align-items:center; gap:10px;
    font-size: clamp(22px, 3.2vw, 34px); line-height: 1.25; }
  .ansui-root .frac-disp .bar{ border-top:3px solid currentColor; width: 100%; }
  .ansui-root .num, .ansui-root .den{ display:flex; align-items:flex-end; gap:16px; }

  /* sqrt look */
  .ansui-root .sqrt{ display:flex; align-items:flex-end; gap:8px; }
  .ansui-root .sqrt .radical{ font-weight:900; font-size: 1.4em; line-height:1; transform: translateY(-2px); }
  .ansui-root .sqrt .over{ display:flex; align-items:flex-end; gap:8px; padding-top:6px; border-top:3px solid currentColor; }

  /* anaume tap boxes */
  .ansui-root .anaume{
    min-width: 2.2em; min-height: 1.8em; padding: .15em .35em; display:inline-flex; align-items:center; justify-content:center;
    border: 2px solid currentColor; border-radius:6px; font-weight:900; user-select:none; cursor: pointer;
    background: color-mix(in oklab, var(--ansui-card,#0f172a), #0b1220 16%);
  }
  .ansui-root .anaume.empty{ color: color-mix(in oklab, currentColor, transparent 45%); }
  .ansui-root .anaume .label{ opacity:.65; font-size:.7em; margin-left:.25em; }
  .ansui-root .anaume.active{ outline: 3px solid color-mix(in oklab, currentColor, transparent 60%); outline-offset: 3px; }

  /* small inline popover near the box */
  .ansui-root .popover{
    position: fixed; z-index: 100000; background: var(--ansui-card,#0f172a); color: var(--ansui-fg,#e2e8f0);
    border:1px solid var(--ansui-border,#1f2a44); border-radius:10px; box-shadow: 0 10px 24px rgba(0,0,0,.45);
    padding:10px; display:grid; gap:8px; min-width: 220px;
  }
  .ansui-root .popover .row{ display:flex; gap:8px; align-items:center; }
  .ansui-root .popover input{
    flex:1 1 auto; padding:10px; border-radius:8px; border:1px solid var(--ansui-border,#1f2a44);
    background: color-mix(in oklab, var(--ansui-card,#0f172a), #0b1220 20%); color: var(--ansui-fg,#e2e8f0);
    font-size: 16px;
  }
  .ansui-root .popover .btn{ padding:8px 10px; }
  .ansui-root .hint{ font-size:.95rem; opacity:.85; }
  
  /* Center exam style (sheet layout) - TRUE Vertical fraction like real exam */
  .ansui-root .sheet-main-container{ 
    display:flex; flex-direction:column; align-items:center; justify-content:center; 
    padding:30px; gap:20px; font-size: clamp(24px, 4vw, 36px);
  }
  .ansui-root .sheet-equation-line{ 
    display:flex; align-items:center; gap:16px; font-weight:600; 
  }
  .ansui-root .sheet-big-fraction{
    display:flex; flex-direction:column; align-items:center; 
    border: 3px solid currentColor; border-radius:12px; 
    background: color-mix(in oklab, var(--ansui-card,#0f172a), #0b1220 8%);
    padding:24px 32px; margin:16px 0; min-width:280px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .ansui-root .sheet-numerator-section{ 
    display:flex; align-items:center; justify-content:center; gap:12px;
    min-height:80px; padding:16px; width:100%;
    border-bottom: 4px solid currentColor; margin-bottom:16px;
  }
  .ansui-root .sheet-denominator-section{ 
    display:flex; align-items:center; justify-content:center;
    min-height:60px; padding:16px; width:100%;
  }
  .ansui-root .sheet-exam-box{
    min-width: 60px; min-height: 50px; border:3px solid currentColor; border-radius:8px;
    display:flex; align-items:center; justify-content:center; font-weight:900; cursor:pointer;
    background: var(--ansui-card,#0f172a); font-size:1.2em;
    transition: all 0.2s ease; position:relative;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
  }
  .ansui-root .sheet-exam-box:hover{
    transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .ansui-root .sheet-exam-box.empty{ 
    background: color-mix(in oklab, var(--ansui-card,#0f172a), transparent 20%);
  }
  .ansui-root .sheet-exam-box.active{ 
    outline: 4px solid #4285f4; outline-offset: 4px;
    box-shadow: 0 0 20px rgba(66, 133, 244, 0.3);
  }
  .ansui-root .sheet-sqrt-symbol{
    font-size:1.4em; font-weight:900; margin-right:8px; color:#4285f4;
  }
  .ansui-root .sheet-plus-symbol{
    font-size:1.2em; font-weight:700; margin:0 8px;
  }
  `;
  document.head.appendChild(style);

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function clampInt(v, min, max){ v = Math.trunc(v); return Math.max(min, Math.min(max, v)); }
  function ensureArray(a){ return Array.isArray(a) ? a : []; }

  function buildRoot(theme){
    const root = document.createElement('div');
    root.className = 'ansui-root' + (theme==='light' ? ' light' : '');
    root.innerHTML = `
      <div class="backdrop" data-role="backdrop"></div>
      <div class="panel" role="dialog" aria-modal="true">
        <div class="head">
          <div class="title">解答</div>
          <button class="close" data-action="cancel">キャンセル</button>
        </div>
        <div class="body">
          <div class="question" data-slot="q"></div>
          <div data-slot="content"></div>
        </div>
        <div class="foot">
          <button class="btn alt" data-action="cancel">キャンセル</button>
          <button class="btn" data-action="ok">決定</button>
        </div>
      </div>
    `;
    return root;
  }

  function formatF1(a,b,c){
    const frac = `(${a}+√${b})/${c}`;
    const latex = `\\frac{${a}+\\sqrt{${b}}}{${c}}`;
    return { text: frac, latex, a, b, c };
  }

  function colsForCount(n){
    if(n<=4) return 'cols-2';
    if(n<=6) return 'cols-3';
    return 'cols-3';
  }

  // Tap-to-edit "anaume" box (single box; not per-digit). Shows popover input on click.
  function createAnaumeBox({ key, initial, allowNegative=true, min=-999999, max=999999, disallowZero=false }){
    const el = document.createElement('div');
    el.className = 'anaume';
    let value = initial;
    function render(){
      el.innerHTML = '';
      el.classList.remove('empty');
      if(value === null || value === undefined || value === ''){
        el.classList.add('empty');
        el.textContent = '';
      }else{
        el.textContent = String(value);
      }
    }
    render();

    function openPopover(){
      const pop = document.createElement('div');
      pop.className = 'popover';
      const r = el.getBoundingClientRect();
      // Position: below the box, clamped to viewport
      const margin = 8;
      let left = r.left + window.scrollX;
      let top = r.bottom + window.scrollY + margin;
      const vw = document.documentElement.clientWidth;
      const ph = 160, pw = 260;
      if(left + pw > window.scrollX + vw - 8) left = window.scrollX + vw - pw - 8;
      pop.style.left = `${left}px`; pop.style.top = `${top}px`;

      const row1 = document.createElement('div'); row1.className = 'row';
      const signBtn = document.createElement('button'); signBtn.className = 'btn alt'; signBtn.type='button';
      signBtn.textContent = allowNegative ? ( (Number(value)||0) >= 0 ? '+/-' : '-/+' ) : '+';
      const inp = document.createElement('input');
      inp.type = 'tel'; inp.inputMode = 'numeric';
      inp.placeholder = key.toUpperCase();
      inp.value = (value!==null && value!==undefined && value!=='') ? String(value) : '';
      row1.appendChild(signBtn); row1.appendChild(inp);

      const row2 = document.createElement('div'); row2.className = 'row';
      const ok = document.createElement('button'); ok.className='btn'; ok.type='button'; ok.textContent='OK';
      const clr = document.createElement('button'); clr.className='btn alt'; clr.type='button'; clr.textContent='クリア';
      const close = document.createElement('button'); close.className='btn alt'; close.type='button'; close.textContent='閉じる';
      row2.appendChild(ok); row2.appendChild(clr); row2.appendChild(close);

      const hint = document.createElement('div'); hint.className = 'hint';

      function sanitizeInput(raw){
        raw = String(raw||'').trim();
        // allow leading '-'
        raw = raw.replace(/[^\d-]/g, '');
        // only first '-' at start
        raw = raw.replace(/(?!^)-/g,'');
        if(!allowNegative) raw = raw.replace(/-/g,'');
        return raw;
      }
      function validate(vn){
        let msg = '';
        if(disallowZero && vn===0) msg = `${key.toUpperCase()} は 0 以外を入力してください`;
        if(!allowNegative && vn<0) msg = `${key.toUpperCase()} は 0 以上を入力してください`;
        if(vn < min || vn > max) msg = `${key.toUpperCase()} は ${min}〜${max} の範囲`;
        hint.textContent = msg;
        ok.disabled = !!msg;
      }

      inp.addEventListener('input', ()=>{
        inp.value = sanitizeInput(inp.value);
        const vn = parseInt(inp.value || '0', 10);
        validate(Number.isFinite(vn) ? vn : 0);
      });
      signBtn.addEventListener('click', ()=>{
        if(!allowNegative) return;
        if(inp.value.startsWith('-')) inp.value = inp.value.replace(/^-/, '');
        else inp.value = '-' + (inp.value || '0');
        inp.dispatchEvent(new Event('input'));
      });

      ok.addEventListener('click', ()=>{
        const vn = parseInt((inp.value||'0'), 10);
        if(Number.isNaN(vn)) return;
        const cv = clampInt(vn, min, max);
        value = cv;
        render();
        document.body.removeChild(pop);
        el.classList.remove('active');
        notify();
      });
      clr.addEventListener('click', ()=>{
        value = 0;
        render();
        document.body.removeChild(pop);
        el.classList.remove('active');
        notify();
      });
      close.addEventListener('click', ()=>{
        document.body.removeChild(pop);
        el.classList.remove('active');
      });

      document.body.appendChild(pop);
      inp.focus();
      inp.select();
      const vn = parseInt((inp.value||'0'), 10);
      validate(Number.isFinite(vn) ? vn : 0);
    }

    el.addEventListener('click', ()=>{
      // toggle active
      document.querySelectorAll('.ansui-root .anaume.active').forEach(n=> n.classList.remove('active'));
      el.classList.add('active');
      openPopover();
    });

    function get(){ return (value===null||value===undefined||value==='') ? 0 : (value|0); }
    function set(v){ value = clampInt(v, min, max); render(); }
    let notify = ()=>{};
    function _setNotify(fn){ notify = fn; }

    return { el, get, set, _setNotify };
  }

  // Build F1 using tap-to-fill anaume boxes in true display fraction layout
  function buildAnaumeF1(contentEl, ui, defaults, limits){
    const digitsCfg = ui.f1Digits || {};
    // Limits default
    const aRange = limits.a || {min:-999999, max:999999};
    const bRange = limits.b || {min:0, max:999999};
    const cRange = limits.c || {min:-999999, max:999999};

    const a0 = clampInt(defaults.a ?? 1, aRange.min, aRange.max);
    const b0 = clampInt(Math.max(0, defaults.b ?? 2), bRange.min, bRange.max);
    const c0 = clampInt(defaults.c ?? 1, cRange.min, cRange.max);

    const dispWrap = document.createElement('div');
    dispWrap.className = 'disp-wrap';

    const frac = document.createElement('div');
    frac.className = 'frac-disp';

    // Numerator: A + √(B)
    const num = document.createElement('div'); num.className = 'num';
    const A = createAnaumeBox({ key:'a', initial:a0, allowNegative:true, min:aRange.min, max:aRange.max });
    const plus = document.createElement('div'); plus.textContent = '+';
    const sqrt = document.createElement('div'); sqrt.className = 'sqrt';
    const radical = document.createElement('span'); radical.className='radical'; radical.textContent='√';
    const over = document.createElement('span'); over.className='over';
    const B = createAnaumeBox({ key:'b', initial:b0, allowNegative:false, min:bRange.min, max:bRange.max });
    over.appendChild(B.el);
    sqrt.appendChild(radical); sqrt.appendChild(over);
    num.appendChild(A.el); num.appendChild(plus); num.appendChild(sqrt);

    // Bar
    const bar = document.createElement('div'); bar.className='bar';

    // Denominator: C
    const den = document.createElement('div'); den.className = 'den';
    const C = createAnaumeBox({ key:'c', initial:c0, allowNegative:true, min:cRange.min, max:cRange.max, disallowZero:true });
    den.appendChild(C.el);

    frac.appendChild(num); frac.appendChild(bar); frac.appendChild(den);
    dispWrap.appendChild(frac);

    const hint = document.createElement('div'); hint.className = 'hint';

    contentEl.appendChild(dispWrap);
    contentEl.appendChild(hint);

    function current(){
      const av = clampInt(A.get(), aRange.min, aRange.max);
      const bv = clampInt(B.get(), bRange.min, bRange.max);
      const cv = clampInt(C.get(), cRange.min, cRange.max);
      return { av, bv, cv };
    }
    function validate(){
      const { av, bv, cv } = current();
      let msg = '';
      let ok = true;
      if(cv === 0){ msg = 'c は 0 以外を入力してください'; ok = false; }
      if(bv < 0){ msg = 'b は 0 以上を入力してください'; ok = false; }
      hint.textContent = msg;
      return ok;
    }
    const notifyAny = ()=> validate();
    A._setNotify(notifyAny);
    B._setNotify(notifyAny);
    C._setNotify(notifyAny);

    function focusFirst(){ A.el.focus(); A.el.classList.add('active'); A.el.click(); }
    function getResult(){
      const { av, bv, cv } = current();
      const ok = validate();
      const v = formatF1(av, Math.max(0,bv), cv);
      return { av, bv:Math.max(0,bv), cv, valid: ok, v };
    }

    validate();
    return { focusFirst, getResult };
  }

  // Build F1 using TRUE vertical fraction layout (Center exam style v3.0)
  function buildSheetF1(contentEl, ui, defaults, limits){
    const aRange = limits.a || {min:-999999, max:999999};
    const bRange = limits.b || {min:0, max:999999};
    const cRange = limits.c || {min:-999999, max:999999};

    const a0 = clampInt(defaults.a ?? '', aRange.min, aRange.max);
    const b0 = clampInt(Math.max(0, defaults.b ?? ''), bRange.min, bRange.max);
    const c0 = clampInt(defaults.c ?? '', cRange.min, cRange.max);

    const mainContainer = document.createElement('div');
    mainContainer.className = 'sheet-main-container';
    
    // Equation header: v₀ = 
    const equationLine = document.createElement('div');
    equationLine.className = 'sheet-equation-line';
    equationLine.innerHTML = 'v<sub>0</sub> = ';
    
    // BIG fraction container with border
    const bigFraction = document.createElement('div');
    bigFraction.className = 'sheet-big-fraction';
    
    // Numerator section: [A] + √[B]
    const numeratorSection = document.createElement('div');
    numeratorSection.className = 'sheet-numerator-section';
    
    const A = createAnaumeBox({ key:'', initial:'', allowNegative:true, min:aRange.min, max:aRange.max });
    A.el.className = 'sheet-exam-box';
    
    const plusSymbol = document.createElement('span');
    plusSymbol.className = 'sheet-plus-symbol';
    plusSymbol.textContent = '+';
    
    const sqrtSymbol = document.createElement('span');
    sqrtSymbol.className = 'sheet-sqrt-symbol';
    sqrtSymbol.textContent = '√';
    
    const B = createAnaumeBox({ key:'', initial:'', allowNegative:false, min:bRange.min, max:bRange.max });
    B.el.className = 'sheet-exam-box';
    
    numeratorSection.appendChild(A.el);
    numeratorSection.appendChild(plusSymbol);
    numeratorSection.appendChild(sqrtSymbol);
    numeratorSection.appendChild(B.el);
    
    // Denominator section: [C]
    const denominatorSection = document.createElement('div');
    denominatorSection.className = 'sheet-denominator-section';
    
    const C = createAnaumeBox({ key:'', initial:'', allowNegative:true, min:cRange.min, max:cRange.max, disallowZero:true });
    C.el.className = 'sheet-exam-box';
    denominatorSection.appendChild(C.el);
    
    bigFraction.appendChild(numeratorSection);
    bigFraction.appendChild(denominatorSection);
    
    mainContainer.appendChild(equationLine);
    mainContainer.appendChild(bigFraction);
    
    const hint = document.createElement('div');
    hint.className = 'hint';
    
    contentEl.appendChild(mainContainer);
    contentEl.appendChild(hint);

    function current(){
      const av = clampInt(A.get(), aRange.min, aRange.max);
      const bv = clampInt(B.get(), bRange.min, bRange.max);
      const cv = clampInt(C.get(), cRange.min, cRange.max);
      return { av, bv, cv };
    }
    function validate(){
      const { av, bv, cv } = current();
      let msg = '';
      let ok = true;
      if(cv === 0){ msg = '分母は 0 以外を入力してください'; ok = false; }
      if(bv < 0){ msg = '√の中は 0 以上を入力してください'; ok = false; }
      hint.textContent = msg;
      return ok;
    }
    const notifyAny = ()=> validate();
    A._setNotify(notifyAny);
    B._setNotify(notifyAny);
    C._setNotify(notifyAny);

    function focusFirst(){ A.el.focus(); A.el.classList.add('active'); A.el.click(); }
    function getResult(){
      const { av, bv, cv } = current();
      const ok = validate();
      const v = formatF1(av, Math.max(0,bv), cv);
      return { av, bv:Math.max(0,bv), cv, valid: ok, v };
    }

    validate();
    return { focusFirst, getResult };
  }

  async function open(command){
    if(typeof command === 'string'){
      try{ command = JSON.parse(command); }
      catch(e){ throw new Error('Invalid JSON string'); }
    }
    if(!command || command.cmd !== 'answer.open'){
      throw new Error('cmd は "answer.open" を指定してください');
    }
    const id = command.id || ('ans-' + Math.random().toString(36).slice(2,8));
    const mode = command.mode;
    const question = command.question || '';
    const ui = command.ui || {};
    const theme = ui.theme === 'light' ? 'light' : (ui.theme === 'dark' ? 'dark' : 'auto');

    if(!['A1','A2','A3','F1','F2'].includes(mode)){
      throw new Error('mode は A1/A2/A3/F1/F2 のいずれかを指定してください');
    }

    // A modes
    let choices = null;
    if(mode==='A1' || mode==='A2' || mode==='A3'){
      choices = ensureArray(command.choices);
      const need = mode==='A1' ? 4 : (mode==='A2' ? 6 : 9);
      if(choices.length !== need){
        throw new Error(`${mode} は choices の長さが ${need} 必須です`);
      }
    }

    const root = buildRoot(theme==='light' ? 'light' : (theme==='dark' ? '' : ''));
    document.body.appendChild(root);

    const qEl = root.querySelector('[data-slot="q"]');
    const contentEl = root.querySelector('[data-slot="content"]');
    const okBtn = root.querySelector('[data-action="ok"]');
    const closeButtons = root.querySelectorAll('[data-action="cancel"]');
    const titleEl = root.querySelector('.title');

    titleEl.textContent = `解答（${mode}）`;
    qEl.textContent = question;

    let resolveOuter;
    const p = new Promise((resolve)=>{ resolveOuter=resolve; });

    const result = { id, mode, ok:false, canceled:false, timeMs:0 };
    const t0 = performance.now();

    function cleanup(){
      document.removeEventListener('keydown', onKey);
      root.remove();
    }
    function finishOk(extra){
      result.ok = true;
      result.canceled = false;
      result.timeMs = Math.max(0, Math.round(performance.now() - t0));
      Object.assign(result, extra||{});
      cleanup();
      resolveOuter(result);
    }
    function finishCancel(){
      result.ok = false;
      result.canceled = true;
      result.timeMs = Math.max(0, Math.round(performance.now() - t0));
      cleanup();
      resolveOuter(result);
    }
    function onKey(e){ if(e.key==='Escape'){ if(ui.allowCancel !== false) finishCancel(); } }
    document.addEventListener('keydown', onKey);
    closeButtons.forEach(b=> b.addEventListener('click', ()=>{ if(ui.allowCancel !== false) finishCancel(); }));
    root.querySelector('[data-role="backdrop"]').addEventListener('click', ()=>{ if(ui.allowCancel !== false) finishCancel(); });

    if(mode==='A1' || mode==='A2' || mode==='A3'){
      const cols = colsForCount(choices.length);
      const wrap = document.createElement('div'); wrap.className = `choices ${cols}`;
      let picked = -1;
      choices.forEach((label, idx)=>{
        const btn = document.createElement('button');
        btn.className='btn'; btn.type='button'; btn.textContent=label;
        btn.addEventListener('click', ()=> {
          picked = idx;
          finishOk({ selectedIndex: idx, selectedLabel: String(label), value: String(label) });
        });
        wrap.appendChild(btn);
      });
      contentEl.appendChild(wrap);
      okBtn.textContent = ui.submitLabel || '決定';
      okBtn.addEventListener('click', ()=>{ if(picked>=0){ finishOk({ selectedIndex:picked, selectedLabel:String(choices[picked]), value:String(choices[picked]) }); } });
      setTimeout(()=> wrap.querySelector('button.btn')?.focus(), 0);
    }

    if(mode==='F1'){
      // Layout variants:
      // - 'anaume' (recommended): displaystyle vertical fraction, tap boxes for a,b,c like \\anaume{a}
      // - 'compact' (legacy): simple 3-number inputs
      // - 'sheet' (center exam): シ、ス、セ boxes like center exam style
      const layout = (ui.f1Layout || 'anaume').toLowerCase();

      const def = command.defaults || {};
      const lim = command.limits || {};
      const aRange = lim.a || {min:-999999, max: 999999};
      const bRange = lim.b || {min:0, max: 999999};
      const cRange = lim.c || {min:-999999, max: 999999};

      if(layout === 'anaume'){
        const ana = buildAnaumeF1(contentEl, ui, def, { a: aRange, b: bRange, c: cRange });
        okBtn.textContent = ui.submitLabel || '決定';
        okBtn.addEventListener('click', ()=>{
          const r = ana.getResult();
          if(!r.valid) return;
          finishOk({
            values: { a: r.av, b: r.bv, c: r.cv },
            text: r.v.text,
            latex: r.v.latex,
            value: r.v.text
          });
        });
        setTimeout(()=> ana.focusFirst(), 0);
      } else if(layout === 'sheet'){
        const sheet = buildSheetF1(contentEl, ui, def, { a: aRange, b: bRange, c: cRange });
        okBtn.textContent = ui.submitLabel || '決定';
        okBtn.addEventListener('click', ()=>{
          const r = sheet.getResult();
          if(!r.valid) return;
          finishOk({
            values: { a: r.av, b: r.bv, c: r.cv },
            text: r.v.text,
            latex: r.v.latex,
            value: r.v.text
          });
        });
        setTimeout(()=> sheet.focusFirst(), 0);
      } else {
        // Compact 3-inputs (legacy)
        const grid = document.createElement('div'); grid.className='grid-3';
        const blockA = document.createElement('div'); blockA.innerHTML = `<label>A</label><input type="number" step="1" id="ansui-a" value="${def.a ?? 1}">`;
        const blockB = document.createElement('div'); blockB.innerHTML = `<label>B</label><input type="number" step="1" id="ansui-b" value="${def.b ?? 2}">`;
        const blockC = document.createElement('div'); blockC.innerHTML = `<label>C（0以外）</label><input type="number" step="1" id="ansui-c" value="${def.c ?? 1}">`;
        grid.appendChild(blockA); grid.appendChild(blockB); grid.appendChild(blockC);
        const preview = document.createElement('div'); preview.className='preview';

        const aInp = blockA.querySelector('input');
        const bInp = blockB.querySelector('input');
        const cInp = blockC.querySelector('input');
        const upd = ()=>{
          const aVal = parseInt(aInp.value || '0',10);
          const bVal = parseInt(bInp.value || '0',10);
          const cVal = parseInt(cInp.value || '0',10);
          const v = formatF1(aVal, Math.max(0,bVal), cVal || 1);
          preview.textContent = v.text + `   (LaTeX: ${v.latex})`;
        };
        [aInp,bInp,cInp].forEach(inp=> inp.addEventListener('input', upd));
        upd();

        contentEl.appendChild(grid);
        contentEl.appendChild(preview);

        okBtn.textContent = ui.submitLabel || '決定';
        okBtn.addEventListener('click', ()=>{
          let av = clampInt(parseInt(aInp.value||'0',10), aRange.min, aRange.max);
          let bv = clampInt(parseInt(bInp.value||'0',10), bRange.min, bRange.max);
          let cv = clampInt(parseInt(cInp.value||'0',10), cRange.min, cRange.max);
          if(cv === 0){ alert('C は 0 以外を入力してください'); return; }
          if(bv < 0) bv = 0;
          const v = formatF1(av, bv, cv);
          finishOk({ values:{ a:av,b:bv,c:cv }, text:v.text, latex:v.latex, value:v.text });
        });

        setTimeout(()=> aInp.focus(), 0);
      }
    }

    if(mode==='F2'){
      const def = command.defaults || {};
      const text = typeof def.text === 'string' ? def.text : '';

      const row = document.createElement('div'); row.className = 'row';
      const input = document.createElement('input');
      input.type = 'text'; input.placeholder = 'ここに自由入力'; input.value = text;
      input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ okBtn.click(); } });
      row.appendChild(input); contentEl.appendChild(row);

      okBtn.textContent = ui.submitLabel || '送信';
      okBtn.addEventListener('click', ()=>{ finishOk({ value:String(input.value||''), text:String(input.value||'') }); });
      setTimeout(()=> input.focus(), 0);
    }

    return p;
  }

  const AnswerUI = { 
    open,
    version: ANSUI_VERSION
  };
  if(typeof module !== 'undefined' && module.exports){ module.exports = AnswerUI; }
  else{ global.AnswerUI = AnswerUI; }

})(typeof window !== 'undefined' ? window : globalThis);
