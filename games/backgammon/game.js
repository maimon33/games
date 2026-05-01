// Backgammon — turn-based multiplayer via MP
// Moves are buffered locally; one S3 write per full turn.

const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const roomEl   = document.getElementById('room-id');
const colorEl  = document.getElementById('color-label');
const diceRow  = document.getElementById('dice-row');
const btnRoll  = document.getElementById('btn-roll');
const btnDone  = document.getElementById('btn-done');

let state, myColor, roomId, stopPoll, role, myTurnFlag = false;
// Local turn state (buffered, not in S3 until endTurn())
let myDice = [], myBoard = null, selected = null, highlights = [];

// ── Initial state ─────────────────────────────────────────────────────────────

function newState() {
  const pts = Array.from({ length: 25 }, () => ({ color: null, count: 0 }));
  pts[24] = { color:'w', count:2 }; pts[13] = { color:'w', count:5 };
  pts[8]  = { color:'w', count:3 }; pts[6]  = { color:'w', count:5 };
  pts[1]  = { color:'b', count:2 }; pts[12] = { color:'b', count:5 };
  pts[17] = { color:'b', count:3 }; pts[19] = { color:'b', count:5 };
  return { pts, bar:{w:0,b:0}, off:{w:0,b:0}, turn:'w', status:'playing', winner:null };
}

function opp(c) { return c === 'w' ? 'b' : 'w'; }

function cloneBoard(b) {
  return { pts: b.pts.map(p => ({...p})), bar:{...b.bar}, off:{...b.off} };
}

// ── Rules ─────────────────────────────────────────────────────────────────────

function canLand(board, color, pt) {
  if (pt < 1 || pt > 24) return false;
  const c = board.pts[pt];
  return c.color !== opp(color) || c.count <= 1;
}

function allHome(board, color) {
  if (board.bar[color] > 0) return false;
  const [lo, hi] = color === 'w' ? [1,6] : [19,24];
  for (let p = 1; p <= 24; p++) {
    if (p < lo || p > hi) { if (board.pts[p].color === color && board.pts[p].count > 0) return false; }
  }
  return true;
}

function movesFrom(board, color, from, dice) {
  const moves = [], seen = new Set();
  for (let di = 0; di < dice.length; di++) {
    const d = dice[di];
    if (seen.has(d)) continue; seen.add(d);

    if (from === 'bar') {
      const t = color === 'w' ? 25 - d : d;
      if (canLand(board, color, t)) moves.push({ to:t, dieIdx:di });
    } else {
      const t = color === 'w' ? from - d : from + d;
      if (t >= 1 && t <= 24 && canLand(board, color, t)) {
        moves.push({ to:t, dieIdx:di });
      } else if (allHome(board, color)) {
        if (color === 'w' && t <= 0) {
          if (from === d) {
            moves.push({ to:'off', dieIdx:di });
          } else if (d > from) {
            // overshoot: valid only if `from` is the highest white piece in home
            const noHigher = !range(from+1, 6).some(p => board.pts[p].color==='w' && board.pts[p].count>0);
            if (noHigher) moves.push({ to:'off', dieIdx:di });
          }
        }
        if (color === 'b' && t >= 25) {
          if (from + d === 25) {
            moves.push({ to:'off', dieIdx:di });
          } else if (from + d > 25) {
            const noHigher = !range(from+1, 24).some(p => board.pts[p].color==='b' && board.pts[p].count>0);
            if (noHigher) moves.push({ to:'off', dieIdx:di });
          }
        }
      }
    }
  }
  return moves;
}

function range(lo, hi) { const r = []; for (let i=lo;i<=hi;i++) r.push(i); return r; }

function hasAnyMove(board, color, dice) {
  if (board.bar[color] > 0) return movesFrom(board, color, 'bar', dice).length > 0;
  for (let p=1;p<=24;p++) {
    if (board.pts[p].color===color && board.pts[p].count>0 && movesFrom(board,color,p,dice).length) return true;
  }
  return false;
}

function applyMoveLocal(board, color, from, to, dieIdx, dice) {
  const b = cloneBoard(board);
  const newDice = dice.filter((_, i) => i !== dieIdx);

  if (from === 'bar') { b.bar[color]--; }
  else { b.pts[from].count--; if (!b.pts[from].count) b.pts[from].color = null; }

  if (to === 'off') {
    b.off[color]++;
  } else {
    const o = opp(color);
    if (b.pts[to].color === o && b.pts[to].count === 1) { b.pts[to] = {color:null,count:0}; b.bar[o]++; }
    b.pts[to].color = color; b.pts[to].count++;
  }
  return { board: b, dice: newDice };
}

// ── Canvas geometry ───────────────────────────────────────────────────────────

const BAR_FRAC = 0.07, OFF_W = 28;

function layout() {
  const W = canvas.width, H = canvas.height;
  const BAR_W = Math.round(W * BAR_FRAC);
  const PW = (W - BAR_W - OFF_W) / 12;
  const BAR_X = 6 * PW;
  const PIECE_R = PW * 0.42;
  return { W, H, BAR_W, PW, BAR_X, PIECE_R };
}

function ptX(pt, {PW, BAR_X, BAR_W}) {
  if (pt>=19&&pt<=24) return BAR_X + BAR_W + (pt-19)*PW + PW/2;
  if (pt>=13&&pt<=18) return (pt-13)*PW + PW/2;
  if (pt>=7 &&pt<=12) return (12-pt)*PW + PW/2;
  if (pt>=1 &&pt<=6)  return BAR_X + BAR_W + (6-pt)*PW + PW/2;
  return 0;
}

function ptTop(pt) { return pt >= 13 && pt <= 24; }

function pieceY(stackIdx, top, {H, PIECE_R}) {
  return top ? PIECE_R + stackIdx*PIECE_R*1.9 : H - PIECE_R - stackIdx*PIECE_R*1.9;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function resize() {
  const W = Math.min(window.innerWidth - 32, 560);
  canvas.width = W; canvas.height = Math.round(W * 320/560);
  draw();
}

function drawPiece(x, y, R, color, sel) {
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2);
  ctx.fillStyle = color === 'w' ? '#f0f0ee' : '#1e1e1e'; ctx.fill();
  ctx.strokeStyle = sel ? 'rgba(255,220,0,0.9)' : (color==='w'?'#888':'#aaa');
  ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
}

function draw() {
  if (!state) return;
  const L = layout();
  const { W, H, BAR_W, PW, BAR_X, PIECE_R } = L;
  const board = myBoard || state;

  ctx.fillStyle = '#1a5c2a'; ctx.fillRect(0, 0, W, H);

  // Bar
  ctx.fillStyle = '#2a1a08'; ctx.fillRect(BAR_X, 0, BAR_W, H);

  // Bearing-off zone
  ctx.fillStyle = '#0e3a1a'; ctx.fillRect(W - OFF_W, 0, OFF_W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = `${Math.max(9, Math.round(PW*0.22))}px system-ui`; ctx.textAlign = 'center';
  ctx.save(); ctx.translate(W - OFF_W/2, H/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('BEAR OFF', 0, 0); ctx.restore();

  // Centre divider
  ctx.fillStyle = '#1a5c2a'; ctx.fillRect(0, H/2-1, W-OFF_W, 2);

  // Triangles
  for (let pt = 1; pt <= 24; pt++) {
    const x = ptX(pt, L);
    const top = ptTop(pt);
    const gi = pt<=6?6-pt:pt<=12?pt-7:pt<=18?pt-13:pt-19;
    ctx.fillStyle = gi%2===0 ? '#7a1a1a' : '#c8a055';
    ctx.beginPath();
    if (top) { ctx.moveTo(x-PW/2,0); ctx.lineTo(x+PW/2,0); ctx.lineTo(x, H/2-12); }
    else      { ctx.moveTo(x-PW/2,H); ctx.lineTo(x+PW/2,H); ctx.lineTo(x, H/2+12); }
    ctx.closePath(); ctx.fill();

    // Point number labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `${Math.max(8, Math.round(PW*0.2))}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText(pt, x, top ? H/2-2 : H/2+10);
  }

  // Highlights (valid move destinations)
  for (const h of highlights) {
    if (h.pt === 'off') {
      ctx.fillStyle = 'rgba(50,220,120,0.45)';
      ctx.fillRect(W-OFF_W, 0, OFF_W, H);
    } else {
      const x = ptX(h.pt, L), top = ptTop(h.pt);
      const y = top ? H/4 : H*3/4;
      ctx.fillStyle = 'rgba(50,220,120,0.4)';
      ctx.beginPath(); ctx.arc(x, y, PIECE_R*0.75, 0, Math.PI*2); ctx.fill();
    }
  }

  // Pieces on points
  for (let pt = 1; pt <= 24; pt++) {
    const cell = board.pts[pt]; if (!cell.color || !cell.count) continue;
    const x = ptX(pt, L), top = ptTop(pt);
    for (let i = 0; i < Math.min(cell.count, 8); i++) {
      drawPiece(x, pieceY(i, top, L), PIECE_R, cell.color, pt === selected);
    }
    if (cell.count > 5) {
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(PIECE_R*0.8)}px system-ui`; ctx.textAlign = 'center';
      ctx.fillText(cell.count, x, pieceY(Math.min(cell.count-1,4), top, L));
    }
  }

  // Bar pieces
  [[board.bar.w,'w'],[board.bar.b,'b']].forEach(([n, c]) => {
    for (let i=0;i<Math.min(n,4);i++) {
      const y = c==='w' ? H/2 - PIECE_R - i*PIECE_R*1.9 : H/2 + PIECE_R + i*PIECE_R*1.9;
      drawPiece(BAR_X + BAR_W/2, y, PIECE_R, c, selected==='bar');
    }
    if (n) {
      ctx.fillStyle = '#fff'; ctx.font = `${Math.round(PIECE_R)}px system-ui`; ctx.textAlign = 'center';
      const y = c==='w' ? H/2-PIECE_R*0.3 : H/2+PIECE_R*1.3;
      ctx.fillText(n+'×', BAR_X + BAR_W/2, y);
    }
  });

  // Borne-off counts
  ctx.fillStyle = '#e0e0e0'; ctx.font = `bold ${Math.round(PIECE_R*0.85)}px system-ui`; ctx.textAlign = 'center';
  ctx.fillText(`W: ${board.off.w}`, W-OFF_W/2, H-6);
  ctx.fillText(`B: ${board.off.b}`, W-OFF_W/2, 14);

  updateDiceDisplay();
}

// ── Input ─────────────────────────────────────────────────────────────────────

function tapTarget(cx, cy) {
  const rect = canvas.getBoundingClientRect();
  const x = (cx - rect.left) * (canvas.width / rect.width);
  const y = (cy - rect.top)  * (canvas.height / rect.height);
  const L = layout();
  const { W, H, BAR_W, PW, BAR_X, PIECE_R } = L;

  if (x >= W - OFF_W) return 'off';

  if (x >= BAR_X && x <= BAR_X + BAR_W) return 'bar';

  let best = null, bestDist = Infinity;
  for (let pt = 1; pt <= 24; pt++) {
    const px = ptX(pt, L);
    const dist = Math.abs(x - px);
    if (dist < PW/2 + 2 && dist < bestDist) { bestDist = dist; best = pt; }
  }
  return best;
}

function currentColor() { return myColor || state?.turn || 'w'; }
function isMyTurn() { return roomId ? myTurnFlag : true; }

async function handleTap(cx, cy) {
  if (!isMyTurn() || state?.status !== 'playing') return;
  if (myDice.length === 0) return;
  const color = currentColor();
  const brd = myBoard || (myBoard = cloneBoard(state));
  const target = tapTarget(cx, cy);
  if (target === null) return;

  // Apply highlighted move
  const mv = highlights.find(h => h.pt === target || (target === 'off' && h.pt === 'off'));
  if (mv) {
    const { board: nb, dice: nd } = applyMoveLocal(brd, color, selected, mv.to, mv.dieIdx, myDice);
    myBoard = nb; myDice = nd; selected = null; highlights = [];

    if (myBoard.off[color] === 15) { endTurn(true); return; }
    if (!hasAnyMove(myBoard, color, myDice) || myDice.length === 0) { endTurn(false); return; }

    draw(); updateButtons(); return;
  }

  // Select piece
  if (brd.bar[color] > 0) {
    if (target === 'bar') {
      selected = 'bar';
      highlights = movesFrom(brd, color, 'bar', myDice).map(m => ({pt:m.to, dieIdx:m.dieIdx}));
    } else { selected = null; highlights = []; }
  } else if (typeof target === 'number' && brd.pts[target]?.color === color && brd.pts[target].count > 0) {
    selected = target;
    highlights = movesFrom(brd, color, target, myDice).map(m => ({pt:m.to, dieIdx:m.dieIdx}));
  } else {
    selected = null; highlights = [];
  }
  draw();
}

canvas.addEventListener('click',    e => handleTap(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => { e.preventDefault(); const t=e.changedTouches[0]; if(t) handleTap(t.clientX,t.clientY); }, {passive:false});

// ── Turn management ───────────────────────────────────────────────────────────

btnRoll.addEventListener('click', () => {
  if (!isMyTurn() || myDice.length > 0) return;
  const d1 = Math.ceil(Math.random()*6), d2 = Math.ceil(Math.random()*6);
  myDice = d1===d2 ? [d1,d1,d1,d1] : [d1,d2];
  myBoard = cloneBoard(state);
  selected = null; highlights = [];

  if (!hasAnyMove(myBoard, currentColor(), myDice)) {
    statusEl.textContent = `No legal moves — turn passes.`;
    setTimeout(() => endTurn(false), 1200);
  }
  updateButtons(); draw();
});

btnDone.addEventListener('click', () => { if (isMyTurn() && myDice.length >= 0) endTurn(false); });

async function endTurn(won) {
  const brd = myBoard || state;
  const nextTurn = myColor ? opp(myColor) : opp(state.turn);
  const newSt = { ...state, pts:brd.pts, bar:brd.bar, off:brd.off,
    turn: nextTurn, status: won?'done':'playing', winner: won?(myColor||state.turn):null };

  myBoard = null; myDice = []; selected = null; highlights = []; myTurnFlag = false;

  if (roomId) {
    try { await MP.move(roomId, newSt); state = newSt; }
    catch (e) { statusEl.textContent = e.message; return; }
  } else { state = newSt; myTurnFlag = true; } // local play: always allow next move

  updateButtons(); updateStatus(); draw();
  if (won) launchConfetti();
}

function updateButtons() {
  const it = isMyTurn();
  btnRoll.style.display = (it && myDice.length===0 && state?.status==='playing') ? '' : 'none';
  btnDone.style.display = (it && myDice.length>0) ? '' : 'none';
}

function updateDiceDisplay() {
  diceRow.innerHTML = '';
  const PIPS = ['','⚀','⚁','⚂','⚃','⚄','⚅'];
  myDice.forEach(d => {
    const el = document.createElement('div'); el.className='die';
    el.textContent = PIPS[d] || d; diceRow.appendChild(el);
  });
}

function updateStatus() {
  if (!state) return;
  if (state.status === 'done') {
    const wName = state.winner==='w'?'White':'Black';
    statusEl.textContent = (myColor&&myColor===state.winner) ? 'You win!' : `${wName} wins!`;
    statusEl.className = (myColor&&myColor===state.winner) ? 'win' : ''; return;
  }
  if (!myColor) {
    statusEl.textContent = `${state.turn==='w'?'White':'Black'}'s turn`; return;
  }
  const it = isMyTurn();
  statusEl.textContent = it
    ? (myDice.length ? 'Click a piece to move' : 'Roll the dice!')
    : "Opponent's turn…";
  statusEl.className = '';
}

// ── Multiplayer ───────────────────────────────────────────────────────────────

function startPolling() {
  if (stopPoll) stopPoll();
  stopPoll = MP.poll(roomId, room => {
    const wasMyTurn = myTurnFlag;
    myTurnFlag = room.turn === MP.myToken();
    if (!wasMyTurn && myTurnFlag) {
      state = room.state; myBoard = null; myDice = []; selected = null; highlights = [];
    } else if (!myTurnFlag) { state = room.state; }
    if (room.guest && role==='host') MP.closeInviteModal();
    updateButtons(); updateStatus(); draw();
    if (state.status==='done' && myColor===state.winner) launchConfetti();
  });
}

async function initMultiplayer() {
  const rid = new URLSearchParams(location.search).get('room');
  if (rid) {
    try {
      const { room, role:r } = await MP.joinRoom(rid);
      roomId=rid; role=r;
      myColor = room.host===MP.myToken()?'w': room.guest===MP.myToken()?'b':null;
      myTurnFlag = room.turn === MP.myToken();
      state = room.state;
      roomEl.textContent  = rid;
      colorEl.textContent = myColor==='w'?'(White)': myColor==='b'?'(Black)':'(Spectator)';
      if (role==='host' && !room.guest) statusEl.textContent='Waiting for opponent…';
      startPolling();
    } catch { state=newState(); myTurnFlag=true; statusEl.textContent='Room not found.'; }
  } else { state=newState(); myTurnFlag=true; }
  updateButtons(); updateStatus(); draw();
}

document.getElementById('btn-new').addEventListener('click', () => {
  if (stopPoll) { stopPoll(); stopPoll=null; }
  roomId=null; myColor=null; role=null; myTurnFlag=true;
  myBoard=null; myDice=[]; selected=null; highlights=[];
  roomEl.textContent='—'; colorEl.textContent='';
  state=newState();
  history.replaceState({},'',location.pathname);
  updateButtons(); updateStatus(); draw();
});

document.getElementById('btn-invite').addEventListener('click', async () => {
  if (roomId) {
    const url=`${location.origin}${location.pathname}?room=${roomId}`;
    MP.showInviteModal({id:roomId, url, qrUrl:`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`});
    return;
  }
  state=newState(); myBoard=null; myDice=[]; selected=null; highlights=[];
  try {
    const {id,url,qrUrl} = await MP.createRoom('backgammon',state);
    roomId=id; role='host'; myColor='w'; myTurnFlag=true;
    history.replaceState({},'',`?room=${id}`);
    roomEl.textContent=id; colorEl.textContent='(White)';
    MP.showInviteModal({id,url,qrUrl});
    startPolling(); updateButtons(); updateStatus(); draw();
  } catch(e) { statusEl.textContent=`Error: ${e.message}`; }
});

function onThemeChange() { draw(); }
window.addEventListener('resize', resize);
resize();
initMultiplayer();
