// LaTeX-first normalizer + validator + KaTeX preview support
// Modes: 'generic' | 'line' | 'ratio' | 'vector' | 'congruence'
(function(global){
  const FULL_TO_HALF = {
    '０':'0','１':'1','２':'2','３':'3','４':'4','５':'5','６':'6','７':'7','８':'8','９':'9',
    '＋':'+','－':'-','ー':'-','―':'-','−':'-','＊':'*','／':'/','：':':','＾':'^','＝':'=',
    '（':'(', '）':')','｛':'{','｝':'}','［':'[','］':']','　':' ',
    '＜':'<','＞':'>'
  };

  function toHalfWidth(s){
    return s.replace(/[\uFF01-\uFF5E\u3000\u2212\u2010-\u2015\uFF0D\uFF0F\uFF3C\u2264\u2265]/g, ch => {
      if (ch === '≤') return '\\le';
      if (ch === '≥') return '\\ge';
      return FULL_TO_HALF[ch] ?? ch;
    }).replace(/\u2044/g,'/'); // fraction slash
  }
  function sanitize(s){ return s.replace(/[\u0000-\u001F]/g,'').replace(/</g,'&lt;'); }

  // 1) トークン正規化（LaTeX標準へ統一）
  function normalizeTokens(input){
    let t = input;
    t = toHalfWidth(t);
    t = t.replace(/\s+/g,'');                // 余分な空白除去
    t = t.replace(/π/g,'\\pi');              // pi
    t = t.replace(/(\d+)°/g, (_m,n)=>`${n}^{\\circ}`); // 度
    t = t.replace(/>=/g,'\\ge').replace(/<=/g,'\\le'); // 不等号

    // sqrt 系 → \sqrt{...}
    t = t.replace(/sqrt\(([^()]+)\)/gi, (_m,p1)=>`\\sqrt{${p1}}`);
    t = t.replace(/√\(([^()]+)\)/g, (_m,p1)=>`\\sqrt{${p1}}`);
    t = t.replace(/√([A-Za-z0-9]+)/g, (_m,p1)=>`\\sqrt{${p1}}`);

    // 互換：独自コマンドを標準へ（入力としては受けるが、出力は LaTeX 標準に）
    t = t.replace(/\\f\{([^}]+)\}\{([^}]+)\}/g, (_m,a,b)=>`\\frac{${a}}{${b}}`);
    t = t.replace(/\\s\{([^}]+)\}/g, (_m,x)=>`\\sqrt{${x}}`);
    t = t.replace(/\\v\{([^}]+)\}/g, (_m,v)=>`\\vec{${v}}`);
    t = t.replace(/\\c\{([^}]+)\}\{([^}]+)\}/g, (_m,n,k)=>`\\binom{${n}}{${k}}`);
    t = t.replace(/\\p\{([^}]+)\}\{([^}]+)\}/g, (_m,n,k)=>`{}_{${n}}\\mathrm{P}_{${k}}`);

    // 既に \frac, \sqrt, \vec, \binom はそのまま

    // 三角/対数の軽い正規化
    t = t.replace(/\bcos\(/g,'\\cos(').replace(/\bsin\(/g,'\\sin(').replace(/\btan\(/g,'\\tan(');
    // cosx, sin2x → \cos(x), \sin(2x) 等
    t = t.replace(/\bcos([A-Za-z0-9])/g, (_m,p)=>`\\cos(${p}`);
    t = t.replace(/\bsin([A-Za-z0-9])/g, (_m,p)=>`\\sin(${p}`);
    t = t.replace(/\btan([A-Za-z0-9])/g, (_m,p)=>`\\tan(${p}`);

    // 対数の底：log2(n), log_2 n → \log_{2}(n)
    t = t.replace(/\blog_?(\d+)\(([^\)]+)\)/g, (_m,b,arg)=>`\\log_{${b}}(${arg})`);
    t = t.replace(/\blog_?(\d+)([A-Za-z0-9]+)/g, (_m,b,arg)=>`\\log_{${b}}(${arg})`);
    t = t.replace(/\blog(\d+)\(([^\)]+)\)/g, (_m,b,arg)=>`\\log_{${b}}(${arg})`);

    // 組合せ/順列：nCk, C(n,k), nPk, P(n,k)
    t = t.replace(/\b([A-Za-z0-9])C_?([A-Za-z0-9])\b/g, (_m,n,k)=>`\\binom{${n}}{${k}}`);
    t = t.replace(/\bC\(([^\),]+),([^\)]+)\)/g, (_m,n,k)=>`\\binom{${n}}{${k}}`);
    t = t.replace(/\b([A-Za-z0-9])P_?([A-Za-z0-9])\b/g, (_m,n,k)=>`{}_{${n}}\\mathrm{P}_{${k}}`);
    t = t.replace(/\bP\(([^\),]+),([^\)]+)\)/g, (_m,n,k)=>`{}_{${n}}\\mathrm{P}_{${k}}`);

    // 合同：a=b(mod m) を a \equiv b \pmod{m} に（式中どこでも）
    t = t.replace(/\(\\?mod\s*([^)]+)\)/gi,'(mod $1)');
    t = t.replace(/(\S+)=([^=]+)\(mod\s*([^)]+)\)/gi, (_m,a,b,m)=>`${a}\\equiv${b}\\pmod{${m}}`);

    // ±
    t = t.replace(/±/g,'\\pm');

    // コマンド退避（n2→2n の適用対象から除外）
    const CMD = [];
    t = t.replace(/\\[A-Za-z]+(?:_[A-Za-z0-9]+)?(?:\{[^{}]*\})*/g, m=>{
      const i = CMD.push(m)-1;
      return `§§${i}§§`;
    });

    // 文字は数字の後ろに：n130 → 130n（下付き n_2 は退避済み）
    t = t.replace(/([A-Za-z])(\d+)/g, (_m,letch,num)=>`${num}${letch}`);

    // 復元
    t = t.replace(/§§(\d+)§§/g, (_m,i)=>CMD[Number(i)]);
    return t;
  }

  function balanced(s, open, close){
    let c=0;
    for(const ch of s){ if(ch===open) c++; else if(ch===close){ c--; if(c<0) return false; } }
    return c===0;
  }

  function requireExponentBraces(t, errors){
    // ^{...} はOK。^x（1文字）もOK。それ以外は { } 必須。
    const rx = /\^/g;
    let m;
    while((m = rx.exec(t))){
      const i = m.index+1;
      const ch = t[i];
      if(ch === '{') continue;
      if(/^[A-Za-z0-9]$/.test(ch)){
        if(/^[A-Za-z0-9]/.test(t[i+1]||'')){ errors.push('指数（^）が複数文字です。必ず { } で囲ってください（例: x^{ab}）。'); break; }
      }else{
        errors.push('指数（^）の直後は { } で囲ってください。'); break;
      }
    }
  }

  function detectAmbiguousSqrt(t){
    // \sqrt{...} 直後に英数/「(」が連続 → 掛け算 * を要求
    return /\\sqrt\{[^}]+\}(?=[A-Za-z0-9\(])/g.test(t);
  }

  // 比 a:b の既約化
  function canonicalizeRatio(t){
    const m = t.match(/^(-?\d+):(-?\d+)$/);
    if(!m) return { text: t, errors: ['比は半角で a:b の形式で入力してください（例: 1:3）。'], warnings: [] };
    let a = parseInt(m[1],10), b = parseInt(m[2],10);
    if(b===0) return { text: `${a}:${b}`, errors: ['比の右項が 0 です。'], warnings: [] };
    if(b<0){ a = -a; b = -b; }
    const g = (x,y)=>y?g(y,x%y):Math.abs(x);
    const d = g(Math.abs(a),Math.abs(b)) || 1;
    a = a/d; b = b/d;
    return { text: `${a}:${b}`, errors: [], warnings: [] };
  }

  // ベクトル項の整列（\vec{a}, \vec{b}, ...）
  function canonicalizeVector(t, errors){
    const terms = [];
    let s = t;
    while(s.length){
      let sign = '+';
      if(s[0]==='+'){ s=s.slice(1); }
      else if(s[0]==='-'){ sign='-'; s=s.slice(1); }
      let coef = '';
      if(s.startsWith('\\frac{')){
        // \frac{A}{B}
        const aStart = 6, aEnd = s.indexOf('}', aStart);
        if(aEnd<0){ errors.push('分数係数 \\frac{A}{B} の "}" が不足しています。'); return t; }
        if(s[aEnd+1] !== '{'){ errors.push('分数係数 \\frac{A}{B} の形式が不正です。'); return t; }
        const bStart = aEnd+2, bEnd = s.indexOf('}', bStart);
        if(bEnd<0){ errors.push('分数係数 \\frac{A}{B} の "}" が不足しています。'); return t; }
        coef = s.slice(0, bEnd+1);
        s = s.slice(bEnd+1);
      }else{
        const m = s.match(/^\d+/);
        if(m){ coef=m[0]; s=s.slice(m[0].length); }
      }
      if(!s.startsWith('\\vec{')){ errors.push('ベクトルは \\vec{a} の形式で入力してください。'); return t; }
      const vEnd = s.indexOf('}', 5);
      if(vEnd<0){ errors.push('ベクトル \\vec{a} の "}" が不足しています。'); return t; }
      const name = s.slice(5, vEnd);
      if(!/^[A-Za-z]$/.test(name)){ errors.push('\\vec{a} のように英字1文字でベクトル名を指定してください。'); return t; }
      terms.push({sign, coef, name});
      s = s.slice(vEnd+1);
    }
    terms.sort((p,q)=>p.name.localeCompare(q.name));
    return terms.map((t,i)=>{
      const sgn = (i===0 && t.sign==='+') ? '' : t.sign;
      const coef = t.coef || '';
      return `${sgn}${coef}\\vec{${t.name}}`;
    }).join('');
  }

  function warnBareSetBraces(t, warnings){
    // 裸の { ... } を警告（\{...\} はOK）。TeXの ^{...}, _{...}, \frac{...}{...} の引数は対象外。
    const allowedStarts = ['\\frac{','\\sqrt{','\\vec{','\\binom{','\\log_{','\\cos(','\\sin(','\\tan('];
    let temp = t;
    for(const key of allowedStarts){ temp = temp.split(key).join(key.replace('{','§')); }
    if(/[^{\\]\{/.test(temp) || /[^\\]\}/.test(temp)){
      warnings.push('集合の中括弧は \\{ ... \\} を使用してください（裸の { } は不可）。');
    }
  }

  function canonicalizeByMode(t, mode){
    const errors = [];
    const warnings = [];

    // グローバル検証
    if(detectAmbiguousSqrt(t)){ errors.push('\\sqrt{...} の直後に文字や数字を続けないでください（掛け算は * を挿入してください）。'); }
    requireExponentBraces(t, errors);

    // モード別
    if(mode==='line'){
      if(!/^y=/.test(t) && !/^x=/.test(t)){
        errors.push('直線は y=...（y項が無いときは x=...）の形式で入力してください。');
      }
      if(/^y=/.test(t) && /y/.test(t.slice(2))){
        errors.push('y= の右辺に y を含めないでください。');
      }
    }else if(mode==='ratio'){
      const can = canonicalizeRatio(t);
      return { text: can.text, errors: can.errors, warnings };
    }else if(mode==='vector'){
      // \v{a} を \vec{a} へ置換済みなので、その規則で整列
      const rebuilt = canonicalizeVector(t, errors);
      if(errors.length) return { text: t, errors, warnings };
      t = rebuilt;
    }else if(mode==='congruence'){
      if(!/\\equiv/.test(t) || !/\\pmod\{[^}]+\}/.test(t)){
        errors.push('合同式は a \\equiv b \\pmod{m} の形式で入力してください（a=b(mod m) も可）。');
      }
    }

    warnBareSetBraces(t, warnings);

    // 括弧対応
    if(!balanced(t,'(',')')) errors.push('括弧 () の対応が取れていません。');
    if(!balanced(t,'{','}')) errors.push('波括弧 {} の対応が取れていません。');

    return { text: t, errors, warnings };
  }

  function normalizeAnswer(input, mode='generic'){
    const raw = String(input ?? '');
    const safe = sanitize(raw);
    const tokens = normalizeTokens(safe);
    const {text, errors, warnings} = canonicalizeByMode(tokens, mode);
    // そのまま KaTeX へ渡せる（ダブルバックスラッシュ化しない）
    return { normalized: text, katex: text, errors, warnings };
  }

  // export
  global.AnswerNormalizer = { normalizeAnswer };
})(window);
