// Shogi mini game with point-symmetric random start (non-pawn pieces permuted on original occupied squares)
// Author: You (polusiti) - MIT
(() => {
  const boardEl = document.getElementById('board');
  const newBtn = document.getElementById('newGameBtn');
  const shufflePawnsChk = document.getElementById('shufflePawns');
  const showCoordsChk = document.getElementById('showCoords');
  const turnInfo = document.getElementById('turnInfo');

  const SENTE = 'S'; // 先手
  const GOTE  = 'G'; // 後手

  // Piece types: P(歩) L(香) N(桂) S(銀) G(金) B(角) R(飛) K(王)
  const KANJI = { P:'歩', L:'香', N:'桂', S:'銀', G:'金', B:'角', R:'飛', K:'王' };
  const PROMO = { P:'+P', L:'+L', N:'+N', S:'+S', B:'+B', R:'+R' }; // 金相当の動きになる駒、角飛は馬龍
  const UNPROMOTE = { '+P':'P', '+L':'L', '+N':'N', '+S':'S', '+B':'B', '+R':'R' };

  const size = 9;

  const state = {
    board: emptyBoard(),
    turn: SENTE,
    selected: null, // {x,y}
    moves: [],      // list of {x,y,capture:boolean, promoteAllowed:boolean, promoteForced:boolean}
  };

  function emptyBoard(){
    return Array.from({length:size}, ()=> Array.from({length:size}, ()=> null));
  }

  function clonePiece(p){ return p ? {...p} : null; }

  function placePiece(board, x,y, piece){
    board[y][x] = piece ? clonePiece(piece) : null;
  }

  function render(){
    boardEl.innerHTML = '';
    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        if(showCoordsChk.checked){
          const cx = document.createElement('div');
          cx.className='coord x';
          cx.textContent = (9-x);
          const cy = document.createElement('div');
          cy.className='coord y';
          cy.textContent = (y+1);
          cell.appendChild(cx); cell.appendChild(cy);
        }

        const p = state.board[y][x];
        if(p){
          const el = document.createElement('div');
          el.className = 'piece ' + (p.side===SENTE?'sente':'gote') + (isPromoted(p)?' promoted':'');
          el.textContent = kanjiFor(p);
          cell.appendChild(el);
        }

        // mark selection and moves
        if(state.selected && state.selected.x===x && state.selected.y===y){
          cell.classList.add('selected');
        }
        if(state.moves.some(m=>m.x===x && m.y===y)){
          const cap = state.board[y][x] && state.board[y][x].side !== sideToMove();
          cell.classList.add(cap ? 'capture' : 'move');
        }

        cell.addEventListener('click', onCellClick);
        boardEl.appendChild(cell);
      }
    }
    turnInfo.textContent = sideToMove()===SENTE ? '先手番' : '後手番';
  }

  function sideToMove(){ return state.turn; }
  function oppositeSide(s){ return s===SENTE ? GOTE : SENTE; }

  function isPromoted(p){ return p.type.startsWith('+'); }

  function baseType(p){ return isPromoted(p) ? UNPROMOTE[p.type] : p.type; }

  function kanjiFor(p){
    const t = baseType(p);
    const k = KANJI[t];
    if(isPromoted(p)){
      if(t==='B') return '馬';
      if(t==='R') return '龍';
      // +P +L +N +S は金と同じ動きだが表記は「と・成香・成桂・成銀」を簡略で「金」扱いでもOK
      // ここでは「と」「杏」「圭」「全」にせず、簡略: 金 と表す
      return '金';
    }
    return k;
  }

  // Standard initial setup to derive original occupied squares
  function standardBoard(){
    const b = emptyBoard();
    // Sente (bottom, y=8 back rank)
    const back = ['L','N','S','G','K','G','S','N','L'];
    for(let x=0;x<9;x++) placePiece(b, x, 8, {type:back[x], side:SENTE});
    placePiece(b, 1, 7, {type:'B', side:SENTE});
    placePiece(b, 7, 7, {type:'R', side:SENTE});
    for(let x=0;x<9;x++) placePiece(b, x, 6, {type:'P', side:SENTE});
    // Gote (top, y=0 back rank)
    for(let x=0;x<9;x++) placePiece(b, 8-x, 0, {type:back[x], side:GOTE}); // mirror
    placePiece(b, 7, 1, {type:'B', side:GOTE});
    placePiece(b, 1, 1, {type:'R', side:GOTE});
    for(let x=0;x<9;x++) placePiece(b, x, 2, {type:'P', side:GOTE});
    return b;
  }

  // Generate variant start according to rules
  function generateVariant({ shufflePawns=false } = {}){
    const base = standardBoard();
    const board = emptyBoard();

    // 1) Sente non-pawn occupied squares (11 squares): y=8 (9 squares) and (1,7),(7,7)
    const nonPawnSquares = [];
    for(let x=0;x<9;x++) nonPawnSquares.push({x, y:8});
    nonPawnSquares.push({x:1, y:7});
    nonPawnSquares.push({x:7, y:7});

    // 2) Collect Sente non-pawn pieces
    const pool = [];
    nonPawnSquares.forEach(({x,y})=>{
      const p = base[y][x];
      if(p && p.type!=='P') pool.push(p.type);
    });
    // Sanity: pool should be length 11
    if(pool.length!==11){
      console.warn('Unexpected non-pawn count:', pool.length);
    }

    // 3) Shuffle pool and place to the same non-pawn squares
    shuffleInPlace(pool);
    nonPawnSquares.forEach(({x,y}, i)=>{
      const t = pool[i];
      placePiece(board, x, y, {type:t, side:SENTE});
    });

    // 4) Pawns
    const pawnRow = 6; // Sente
    const files = Array.from({length:9}, (_,x)=>x);
    if(shufflePawns){
      shuffleInPlace(files); // still fills all 9 squares; 見た目は同じだが将来的に「穴」を許すならここで調整
    }
    files.forEach(x=>{
      placePiece(board, x, pawnRow, {type:'P', side:SENTE});
    });

    // 5) Mirror for Gote (point-symmetric)
    for(let y=0;y<9;y++){
      for(let x=0;x<9;x++){
        const sp = board[y][x];
        if(sp){
          const mx = 8 - x;
          const my = 8 - y;
          placePiece(board, mx, my, {type:sp.type, side:GOTE});
        }
      }
    }

    return board;
  }

  function shuffleInPlace(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = (Math.random()*(i+1))|0;
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
  }

  // Movement generation (no self-check validation in MVP)
  function generateMoves(x,y){
    const b = state.board;
    const p = b[y][x];
    if(!p) return [];
    const dir = (p.side===SENTE? -1 : 1);
    const moves = [];

    function pushStep(nx,ny){
      if(nx<0||nx>=9||ny<0||ny>=9) return;
      const t = b[ny][nx];
      if(!t){
        moves.push({x:nx,y:ny,capture:false});
        return true;
      }else if(t.side!==p.side){
        moves.push({x:nx,y:ny,capture:true});
      }
      return false;
    }
    function slide(dx,dy){
      let nx=x+dx, ny=y+dy;
      while(nx>=0&&nx<9&&ny>=0&&ny<9){
        const cont = pushStep(nx,ny);
        if(cont===false) break; // blocked by own or captured opponent
        const hasPiece = state.board[ny][nx]!=null;
        if(hasPiece) break; // captured opponent; stop
        nx+=dx; ny+=dy;
      }
    }

    const t = baseType(p);
    const promoted = isPromoted(p);

    if(t==='K'){
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        pushStep(x+dx,y+dy);
      }
    }else if(t==='G' || (promoted && ['P','L','N','S'].includes(t))){
      const deltas = p.side===SENTE
        ? [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]]
        : [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]];
      for(const [dx,dy] of deltas) pushStep(x+dx,y+dy);
    }else if(t==='S' && !promoted){
      const deltas = p.side===SENTE ? [[0,-1],[1,-1],[-1,-1],[1,1],[-1,1]]
                                    : [[0,1],[1,1],[-1,1],[1,-1],[-1,-1]];
      for(const [dx,dy] of deltas) pushStep(x+dx,y+dy);
    }else if(t==='N' && !promoted){
      const steps = p.side===SENTE ? [[-1,-2],[1,-2]] : [[-1,2],[1,2]];
      for(const [dx,dy] of steps) pushStep(x+dx,y+dy);
    }else if(t==='L' && !promoted){
      slide(0, dir);
    }else if(t==='P' && !promoted){
      pushStep(x, y+dir);
    }else if(t==='B'){
      slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1);
      if(promoted){
        pushStep(x+1,y); pushStep(x-1,y); pushStep(x,y+1); pushStep(x,y-1);
      }
    }else if(t==='R'){
      slide(1,0); slide(-1,0); slide(0,1); slide(0,-1);
      if(promoted){
        pushStep(x+1,y+1); pushStep(x+1,y-1); pushStep(x-1,y+1); pushStep(x-1,y-1);
      }
    }else if(promoted){
      // Promoted L/N/S/P are handled as Gold above; already covered
    }

    // Promotion flags
    const zoneY = (p.side===SENTE) ? [0,1,2] : [6,7,8];
    const inZone = (yy)=> zoneY.includes(yy);
    const mustPromote = (fromY,toY,base)=>{
      if(base==='P' || base==='L'){
        // moving into last rank
        if((p.side===SENTE && toY===0) || (p.side===GOTE && toY===8)) return true;
      }
      if(base==='N'){
        if((p.side===SENTE && toY<=1) || (p.side===GOTE && toY>=7)) return true;
      }
      return false;
    };

    for(const m of moves){
      const base = baseType(p);
      const can = (inZone(y) || inZone(m.y)) && (['P','L','N','S','B','R'].includes(base)) && !isPromoted(p);
      m.promoteAllowed = !!can;
      m.promoteForced = can && mustPromote(y, m.y, base);
    }

    return moves;
  }

  function onCellClick(e){
    const x = Number(e.currentTarget.dataset.x);
    const y = Number(e.currentTarget.dataset.y);
    const b = state.board;
    const sel = state.selected;

    // If selecting own piece
    if(b[y][x] && b[y][x].side === sideToMove()){
      state.selected = {x,y};
      state.moves = generateMoves(x,y);
      render();
      return;
    }

    // If we have a selection and clicked a legal destination
    if(sel){
      const mv = state.moves.find(m=>m.x===x && m.y===y);
      if(mv){
        moveSelectedTo(x,y,mv);
        state.selected = null;
        state.moves = [];
        state.turn = oppositeSide(state.turn);
        render();
        return;
      }
    }

    // else clear selection
    state.selected = null;
    state.moves = [];
    render();
  }

  function moveSelectedTo(nx,ny, mvInfo){
    const {x,y} = state.selected;
    const p = clonePiece(state.board[y][x]);
    // capture
    const tgt = state.board[ny][nx];
    if(tgt && tgt.side !== p.side){
      // MVP: 持ち駒化は未実装（今は除去のみ）
      // ここで「持ち駒」機能を拡張予定
    }
    // promotion
    if(mvInfo.promoteForced){
      p.type = promoteType(p);
    }else if(mvInfo.promoteAllowed){
      const ok = confirm('成りますか？');
      if(ok) p.type = promoteType(p);
    }
    placePiece(state.board, nx, ny, p);
    placePiece(state.board, x, y, null);
  }

  function promoteType(p){
    const base = baseType(p);
    if(PROMO[base]) return PROMO[base];
    return p.type;
  }

  function newGame(){
    state.board = generateVariant({ shufflePawns: shufflePawnsChk.checked });
    state.turn = SENTE;
    state.selected = null;
    state.moves = [];
    render();
  }

  // Build board cells once (to keep grid sizing stable)
  function buildStaticGrid(){
    // grid is built by render() each time with events; no prebuild for simplicity
  }

  // Wire UI
  newBtn.addEventListener('click', newGame);
  shufflePawnsChk.addEventListener('change', newGame);
  showCoordsChk.addEventListener('change', render);

  // Initialize
  newGame();
})();
