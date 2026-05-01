// Checkers — turn-based multiplayer via MP

const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const roomEl   = document.getElementById('room-id');
const colorEl  = document.getElementById('color-label');

let CELL, state, selected, validMoves, myColor, roomId, stopPoll, role;

// ── State ─────────────────────────────────────────────────────────────────────
// board[r][c]: null | 'rm'=red man | 'rk'=red king | 'bm'=black man | 'bk'=black king
// Red (host) starts rows 0-2, moves toward row 7. Promotes at row 7.
// Black (guest) starts rows 5-7, moves toward row 0. Promotes at row 0.
// Dark squares: (r+c) % 2 === 1

function newState() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2 !== 1) continue;
    if (r <= 2) board[r][c] = 'rm';
    if (r >= 5) board[r][c] = 'bm';
  }
  return { board, turn: 'r', status: 'playing', winner: null, chainPiece: null };
}

function opp(c) { return c === 'r' ? 'b' : 'r'; }

// ── Move generation ───────────────────────────────────────────────────────────

function jumpDirs(piece) {
  if (piece === 'rm') return [[1,-1],[1,1]];
  if (piece === 'bm') return [[-1,-1],[-1,1]];
  return [[-1,-1],[-1,1],[1,-1],[1,1]];
}

function getJumps(board, r, c) {
  const piece = board[r][c]; if (!piece) return [];
  const o = opp(piece[0]);
  return jumpDirs(piece).flatMap(([dr, dc]) => {
    const mr = r+dr, mc = c+dc, lr = r+2*dr, lc = c+2*dc;
    if (lr<0||lr>7||lc<0||lc>7) return [];
    if (!board[mr]?.[mc]?.startsWith(o)) return [];
    if (board[lr][lc]) return [];
    return [{ to:[lr,lc], over:[mr,mc] }];
  });
}

function getSimpleMoves(board, r, c) {
  const piece = board[r][c]; if (!piece) return [];
  return jumpDirs(piece).flatMap(([dr, dc]) => {
    const nr = r+dr, nc = c+dc;
    if (nr<0||nr>7||nc<0||nc>7||board[nr][nc]) return [];
    return [{ to:[nr,nc], over:null }];
  });
}

function anyJump(board, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.startsWith(color) && getJumps(board, r, c).length) return true;
  }
  return false;
}

function movesFor(state, r, c) {
  const piece = state.board[r][c];
  if (!piece || !piece.startsWith(state.turn)) return [];
  if (state.chainPiece) {
    if (state.chainPiece[0] !== r || state.chainPiece[1] !== c) return [];
    return getJumps(state.board, r, c);
  }
  const jumps = getJumps(state.board, r, c);
  if (anyJump(state.board, state.turn)) return jumps;
  return getSimpleMoves(state.board, r, c);
}

function hasAnyMove(board, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (!board[r][c]?.startsWith(color)) continue;
    if (getJumps(board, r, c).length || getSimpleMoves(board, r, c).length) return true;
  }
  return false;
}

function applyMove(state, from, moveObj) {
  const board = state.board.map(r => [...r]);
  const [fr, fc] = from, [tr, tc] = moveObj.to;
  let piece = board[fr][fc];

  board[tr][tc] = piece;
  board[fr][fc] = null;
  if (moveObj.over) board[moveObj.over[0]][moveObj.over[1]] = null;

  // Promotion
  if (piece === 'rm' && tr === 7) { piece = 'rk'; board[tr][tc] = 'rk'; }
  if (piece === 'bm' && tr === 0) { piece = 'bk'; board[tr][tc] = 'bk'; }

  // Chain jump?
  let chainPiece = null, nextTurn = opp(state.turn);
  if (moveObj.over && getJumps(board, tr, tc).length > 0) {
    chainPiece = [tr, tc];
    nextTurn = state.turn;
  }

  // Check win
  let status = 'playing', winner = null;
  if (!hasAnyMove(board, nextTurn)) {
    status = 'win'; winner = state.turn;
  }

  return { board, turn: nextTurn, status, winner, chainPiece };
}

// ── Board orientation ─────────────────────────────────────────────────────────

function toActual(vr, vc) { return myColor === 'b' ? [7-vr, 7-vc] : [vr, vc]; }
function toView(r, c)     { return myColor === 'b' ? [7-r,  7-c]  : [r, c]; }

// ── Rendering ─────────────────────────────────────────────────────────────────

function resize() {
  const sz = Math.min(window.innerWidth - 32, 480);
  canvas.width = canvas.height = sz;
  CELL = sz / 8;
  draw();
}

function draw() {
  if (!state) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    ctx.fillStyle = (vr + vc) % 2 === 0 ? '#f0d9b5' : '#8b5e3c';
    ctx.fillRect(vc*CELL, vr*CELL, CELL, CELL);
  }

  // Highlight selected
  if (selected) {
    const [vsr, vsc] = toView(...selected);
    ctx.fillStyle = 'rgba(255,255,0,0.4)';
    ctx.fillRect(vsc*CELL, vsr*CELL, CELL, CELL);

    for (const mv of (validMoves || [])) {
      const [vmr, vmc] = toView(...mv.to);
      ctx.fillStyle = 'rgba(0,200,80,0.45)';
      ctx.beginPath();
      ctx.arc(vmc*CELL+CELL/2, vmr*CELL+CELL/2, CELL*0.2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Pieces
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    const [r, c] = toActual(vr, vc);
    const piece = state.board[r][c]; if (!piece) continue;
    const x = vc*CELL+CELL/2, y = vr*CELL+CELL/2, R = CELL*0.38;

    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2);
    ctx.fillStyle = piece[0] === 'r' ? '#e05252' : '#222';
    ctx.fill();
    ctx.strokeStyle = piece[0] === 'r' ? '#ff8888' : '#666';
    ctx.lineWidth = 2; ctx.stroke();

    // King crown
    if (piece[1] === 'k') {
      ctx.beginPath(); ctx.arc(x, y, R*0.45, 0, Math.PI*2);
      ctx.fillStyle = piece[0] === 'r' ? 'rgba(255,220,220,0.9)' : 'rgba(180,180,180,0.9)';
      ctx.fill();
    }
  }
}

function updateStatus() {
  if (!state) return;
  if (state.status === 'win') {
    const winName = state.winner === 'r' ? 'Red' : 'Black';
    statusEl.textContent = myColor
      ? (myColor === state.winner ? 'You win!' : `${winName} wins!`)
      : `${winName} wins!`;
    statusEl.className = 'win';
  } else {
    const turnName = state.turn === 'r' ? 'Red' : 'Black';
    const myTurn = myColor && state.turn === myColor;
    statusEl.textContent = myColor
      ? (myTurn ? (state.chainPiece ? 'Continue jumping!' : 'Your turn') : "Opponent's turn")
      : `${turnName}'s turn`;
    statusEl.className = '';
  }
}

// ── Input ─────────────────────────────────────────────────────────────────────

function viewCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.floor((clientY - rect.top)  * (canvas.height / rect.height) / CELL),
    Math.floor((clientX - rect.left) * (canvas.width  / rect.width)  / CELL),
  ];
}

async function handleTap(clientX, clientY) {
  if (!state || state.status !== 'playing') return;
  if (myColor && state.turn !== myColor) return;

  const [vr, vc] = viewCell(clientX, clientY);
  if (vr < 0 || vr > 7 || vc < 0 || vc > 7) return;
  const [r, c] = toActual(vr, vc);

  // Try applying a move
  if (selected) {
    const hit = (validMoves || []).find(m => m.to[0] === r && m.to[1] === c);
    if (hit) {
      const next = applyMove(state, selected, hit);
      selected = null; validMoves = [];
      draw();
      if (roomId) {
        try { await MP.move(roomId, next); state = next; }
        catch (e) { statusEl.textContent = e.message; return; }
      } else { state = next; }
      // If chain continues, auto-select the jumping piece
      if (state.chainPiece) {
        selected = state.chainPiece;
        validMoves = movesFor(state, ...state.chainPiece);
      }
      updateStatus(); draw();
      if (state.status === 'win') launchConfetti();
      return;
    }
    selected = null; validMoves = [];
  }

  // Select piece
  const mv = movesFor(state, r, c);
  if (mv.length) { selected = [r, c]; validMoves = mv; }
  draw();
}

canvas.addEventListener('click',    e => handleTap(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  if (t) handleTap(t.clientX, t.clientY);
}, { passive: false });

// ── Multiplayer ───────────────────────────────────────────────────────────────

function startPolling() {
  if (stopPoll) stopPoll();
  stopPoll = MP.poll(roomId, room => {
    state = room.state; selected = null; validMoves = [];
    if (room.guest && role === 'host') MP.closeInviteModal();
    updateStatus(); draw();
    if (state.status === 'win') launchConfetti();
  });
}

async function initMultiplayer() {
  const rid = new URLSearchParams(location.search).get('room');
  if (rid) {
    try {
      const { room, role: r } = await MP.joinRoom(rid);
      roomId = rid; role = r;
      myColor = room.host === MP.myToken() ? 'r' : room.guest === MP.myToken() ? 'b' : null;
      state = room.state; selected = null; validMoves = [];
      roomEl.textContent  = rid;
      colorEl.textContent = myColor === 'r' ? '(Red)' : myColor === 'b' ? '(Black)' : '(Spectator)';
      if (role === 'host' && !room.guest) statusEl.textContent = 'Waiting for opponent…';
      startPolling();
    } catch { state = newState(); statusEl.textContent = 'Room not found.'; }
  } else { state = newState(); }
  updateStatus(); draw();
}

document.getElementById('btn-new').addEventListener('click', () => {
  if (stopPoll) { stopPoll(); stopPoll = null; }
  roomId = null; myColor = null; role = null; selected = null; validMoves = [];
  roomEl.textContent = '—'; colorEl.textContent = '';
  state = newState();
  history.replaceState({}, '', location.pathname);
  updateStatus(); draw();
});

document.getElementById('btn-invite').addEventListener('click', async () => {
  if (roomId) {
    const url = `${location.origin}${location.pathname}?room=${roomId}`;
    MP.showInviteModal({ id: roomId, url, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}` });
    return;
  }
  state = newState(); selected = null; validMoves = [];
  try {
    const { id, url, qrUrl } = await MP.createRoom('checkers', state);
    roomId = id; role = 'host'; myColor = 'r';
    history.replaceState({}, '', `?room=${id}`);
    roomEl.textContent = id; colorEl.textContent = '(Red)';
    MP.showInviteModal({ id, url, qrUrl });
    startPolling(); updateStatus(); draw();
  } catch (e) { statusEl.textContent = `Error: ${e.message}`; }
});

function onThemeChange() { draw(); }
window.addEventListener('resize', resize);
resize();
initMultiplayer();
