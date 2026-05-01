// Chess — turn-based multiplayer via MP (multiplayer.js)

const INIT_BOARD = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

const GLYPH = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟',
};

const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const roomEl   = document.getElementById('room-id');
const colorEl  = document.getElementById('color-label');

let CELL, state, selected, moves, myColor, roomId, stopPoll, role;

// ── State ─────────────────────────────────────────────────────────────────────

function newState() {
  return {
    board:    INIT_BOARD.map(r => [...r]),
    turn:     'w',
    castling: { wK:true, wQ:true, bK:true, bQ:true },
    enPassant: null,
    status:   'playing',
  };
}

function opp(c) { return c === 'w' ? 'b' : 'w'; }

// ── Move generation ───────────────────────────────────────────────────────────

function rawMoves(board, r, c, castling, ep, skipCastle) {
  const p = board[r][c]; if (!p) return [];
  const col = p[0], type = p[1], o = opp(col);
  const M = [];

  if (type === 'P') {
    const d = col === 'w' ? -1 : 1, start = col === 'w' ? 6 : 1;
    const nr1 = r + d;
    if (nr1 >= 0 && nr1 < 8 && !board[nr1][c]) {
      M.push([nr1, c]);
      const nr2 = r + 2 * d;
      if (r === start && nr2 >= 0 && nr2 < 8 && !board[nr2][c]) M.push([nr2, c]);
    }
    for (const dc of [-1, 1]) {
      const nr = r + d, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (board[nr][nc]?.startsWith(o)) M.push([nr, nc]);
        if (ep && ep[0] === nr && ep[1] === nc)  M.push([nr, nc]);
      }
    }
  } else if (type === 'N') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = r+dr, nc = c+dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !board[nr][nc]?.startsWith(col))
        M.push([nr, nc]);
    }
  } else if (type === 'K') {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = r+dr, nc = c+dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !board[nr][nc]?.startsWith(col))
        M.push([nr, nc]);
    }
    if (!skipCastle && castling) {
      const hr = col === 'w' ? 7 : 0;
      if (r === hr && c === 4) {
        if (castling[col+'K'] && !board[hr][5] && !board[hr][6]) M.push([hr, 6]);
        if (castling[col+'Q'] && !board[hr][3] && !board[hr][2] && !board[hr][1]) M.push([hr, 2]);
      }
    }
  } else {
    const dirs = [];
    if (type === 'B' || type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (type === 'R' || type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for (const [dr,dc] of dirs) {
      let nr = r+dr, nc = c+dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (!board[nr][nc]) { M.push([nr, nc]); }
        else { if (board[nr][nc].startsWith(o)) M.push([nr, nc]); break; }
        nr += dr; nc += dc;
      }
    }
  }
  return M;
}

function squareAttacked(board, r, c, byColor) {
  for (let pr = 0; pr < 8; pr++) for (let pc = 0; pc < 8; pc++) {
    if (!board[pr][pc]?.startsWith(byColor)) continue;
    if (rawMoves(board, pr, pc, null, null, true).some(([nr,nc]) => nr===r && nc===c)) return true;
  }
  return false;
}

function inCheck(board, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === color+'K') return squareAttacked(board, r, c, opp(color));
  }
  return false;
}

function applyMove(st, [fr,fc], [tr,tc]) {
  const board    = st.board.map(r => [...r]);
  const p        = board[fr][fc];
  const col      = p[0], type = p[1];
  const castling = { ...st.castling };
  let   ep       = null;

  // En passant capture — remove the bypassed pawn
  if (type === 'P' && st.enPassant && tr === st.enPassant[0] && tc === st.enPassant[1])
    board[fr][tc] = null;

  // Castling — slide the rook
  if (type === 'K') {
    const hr = col === 'w' ? 7 : 0;
    if (tc === fc + 2) { board[hr][5] = board[hr][7]; board[hr][7] = null; }
    if (tc === fc - 2) { board[hr][3] = board[hr][0]; board[hr][0] = null; }
    castling[col+'K'] = false; castling[col+'Q'] = false;
  }
  if (type === 'R') {
    if (fc === 0) castling[col+'Q'] = false;
    if (fc === 7) castling[col+'K'] = false;
  }

  // Double pawn push — record en-passant target square
  if (type === 'P' && Math.abs(tr - fr) === 2) ep = [(fr + tr) / 2, fc];

  board[tr][tc] = p;
  board[fr][fc] = null;

  // Promotion → queen (auto)
  if (type === 'P' && (tr === 0 || tr === 7)) board[tr][tc] = col + 'Q';

  return { board, turn: opp(col), castling, enPassant: ep, status: 'playing' };
}

function legalMoves(st, r, c) {
  const p = st.board[r][c]; if (!p) return [];
  const col = p[0];
  return rawMoves(st.board, r, c, st.castling, st.enPassant).filter(([tr, tc]) => {
    // Castle: king must not start in check or pass through an attacked square
    if (p[1] === 'K' && Math.abs(tc - c) === 2) {
      if (squareAttacked(st.board, r, c, opp(col)))           return false;
      if (squareAttacked(st.board, r, (c + tc) / 2, opp(col))) return false;
    }
    const next = applyMove(st, [r, c], [tr, tc]);
    return !inCheck(next.board, col);
  });
}

function hasAnyLegal(st, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (st.board[r][c]?.startsWith(color) && legalMoves(st, r, c).length) return true;
  }
  return false;
}

function computeStatus(st) {
  const col = st.turn, checked = inCheck(st.board, col), has = hasAnyLegal(st, col);
  if (!has) return checked ? 'checkmate' : 'stalemate';
  return checked ? 'check' : 'playing';
}

// ── Board orientation ─────────────────────────────────────────────────────────
// Black plays with their pieces at the bottom — board is visually flipped.

function toActual(vr, vc) { return myColor === 'b' ? [7-vr, 7-vc] : [vr, vc]; }

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

  // Squares
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    ctx.fillStyle = (vr + vc) % 2 === 0 ? '#f0d9b5' : '#b58863';
    ctx.fillRect(vc * CELL, vr * CELL, CELL, CELL);
  }

  // Selected square highlight
  if (selected) {
    const [sr, sc] = selected;
    const [vsr, vsc] = myColor === 'b' ? [7-sr, 7-sc] : [sr, sc];
    ctx.fillStyle = 'rgba(255,255,0,0.45)';
    ctx.fillRect(vsc * CELL, vsr * CELL, CELL, CELL);

    // Legal move indicators
    for (const [mr, mc] of (moves || [])) {
      const [vmr, vmc] = myColor === 'b' ? [7-mr, 7-mc] : [mr, mc];
      if (state.board[mr][mc]) {
        // Capture — red ring
        ctx.strokeStyle = 'rgba(210,40,40,0.7)'; ctx.lineWidth = Math.max(3, CELL * 0.07);
        ctx.strokeRect(vmc * CELL + ctx.lineWidth/2, vmr * CELL + ctx.lineWidth/2,
                       CELL - ctx.lineWidth, CELL - ctx.lineWidth);
      } else {
        // Quiet move — dot
        ctx.fillStyle = 'rgba(0,170,0,0.42)';
        ctx.beginPath();
        ctx.arc(vmc * CELL + CELL/2, vmr * CELL + CELL/2, CELL * 0.17, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Pieces
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(CELL * 0.72)}px serif`;
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    const [r, c] = toActual(vr, vc);
    const p = state.board[r][c]; if (!p) continue;
    ctx.shadowColor = p[0] === 'w' ? '#555' : '#bbb'; ctx.shadowBlur = 4;
    ctx.fillStyle   = p[0] === 'w' ? '#fff' : '#111';
    ctx.fillText(GLYPH[p], vc * CELL + CELL/2, vr * CELL + CELL/2 + CELL * 0.03);
    ctx.shadowBlur = 0;
  }

  // Rank labels (left edge)
  ctx.shadowBlur = 0;
  ctx.font = `bold ${Math.floor(CELL * 0.19)}px system-ui`;
  const flip = myColor === 'b';
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle   = i % 2 === 0 ? '#b58863' : '#f0d9b5';
    ctx.textAlign   = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(flip ? i+1 : 8-i, 2, i * CELL + 2);
  }
  // File labels (bottom edge)
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle   = (7 + i) % 2 === 0 ? '#b58863' : '#f0d9b5';
    ctx.textAlign   = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('abcdefgh'[flip ? 7-i : i], (i+1) * CELL - 2, 8 * CELL - 2);
  }
}

function updateStatus() {
  if (!state) return;
  const turnName = state.turn === 'w' ? 'White' : 'Black';
  const myTurn   = myColor && state.turn === myColor;
  if (state.status === 'checkmate') {
    statusEl.textContent = `Checkmate — ${state.turn === 'w' ? 'Black' : 'White'} wins!`;
    statusEl.className = 'win';
  } else if (state.status === 'stalemate') {
    statusEl.textContent = 'Stalemate — draw';
    statusEl.className = '';
  } else {
    const chk = state.status === 'check' ? ' (check)' : '';
    statusEl.textContent = myColor
      ? (myTurn ? `Your turn${chk}` : `Opponent's turn${chk}`)
      : `${turnName} to move${chk}`;
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
  if (!state || state.status === 'checkmate' || state.status === 'stalemate') return;
  if (myColor && state.turn !== myColor) return;

  const [vr, vc] = viewCell(clientX, clientY);
  if (vr < 0 || vr > 7 || vc < 0 || vc > 7) return;
  const [r, c] = toActual(vr, vc);

  if (selected) {
    const hit = (moves || []).find(([mr, mc]) => mr === r && mc === c);
    if (hit) {
      const next = applyMove(state, selected, [r, c]);
      next.status = computeStatus(next);
      selected = null; moves = [];
      draw();
      if (roomId) {
        try { await MP.move(roomId, next); state = next; }
        catch (e) { statusEl.textContent = e.message; return; }
      } else {
        state = next;
      }
      updateStatus(); draw();
      if (next.status === 'checkmate') launchConfetti();
      return;
    }
    selected = null; moves = [];
  }

  const piece = state.board[r]?.[c];
  if (piece && piece[0] === state.turn) {
    selected = [r, c];
    moves = legalMoves(state, r, c);
  }
  draw();
}

canvas.addEventListener('click',    e => handleTap(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  if (t) handleTap(t.clientX, t.clientY);
}, { passive: false });

// ── Multiplayer ───────────────────────────────────────────────────────────────

function applyRoomState(room) {
  state = room.state;
  state.status = computeStatus(state);
  selected = null; moves = [];
  updateStatus(); draw();
  if (state.status === 'checkmate') launchConfetti();
}

function startPolling() {
  if (stopPoll) stopPoll();
  stopPoll = MP.poll(roomId, room => {
    applyRoomState(room);
    // Close "waiting" message once guest joins
    if (room.guest && role === 'host') MP.closeInviteModal();
  });
}

async function initMultiplayer() {
  const params = new URLSearchParams(location.search);
  const rid    = params.get('room');

  if (rid) {
    try {
      const { room, role: r } = await MP.joinRoom(rid);
      roomId   = rid;
      role     = r;
      myColor  = room.host === MP.myToken() ? 'w' : (room.guest === MP.myToken() ? 'b' : null);
      roomEl.textContent   = rid;
      colorEl.textContent  = myColor === 'w' ? '(White)' : myColor === 'b' ? '(Black)' : '(Spectator)';
      applyRoomState(room);
      if (role === 'host' && !room.guest) statusEl.textContent = 'Waiting for opponent to join…';
      startPolling();
    } catch (e) {
      statusEl.textContent = 'Room not found.';
      state = newState(); updateStatus(); draw();
    }
  } else {
    state = newState(); updateStatus(); draw();
  }
}

document.getElementById('btn-new').addEventListener('click', () => {
  if (stopPoll) { stopPoll(); stopPoll = null; }
  roomId = null; myColor = null; role = null; selected = null; moves = [];
  roomEl.textContent  = '—';
  colorEl.textContent = '';
  state = newState();
  history.replaceState({}, '', location.pathname);
  updateStatus(); draw();
});

document.getElementById('btn-invite').addEventListener('click', async () => {
  if (roomId) {
    // Re-show invite for current room
    const url    = `${location.origin}${location.pathname}?room=${roomId}`;
    const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
    MP.showInviteModal({ id: roomId, url, qrUrl });
    return;
  }
  state = newState(); selected = null; moves = [];
  try {
    const { id, url, qrUrl } = await MP.createRoom('chess', state);
    roomId = id; role = 'host'; myColor = 'w';
    history.replaceState({}, '', `?room=${id}`);
    roomEl.textContent  = id;
    colorEl.textContent = '(White)';
    MP.showInviteModal({ id, url, qrUrl });
    startPolling();
    updateStatus(); draw();
  } catch (e) {
    statusEl.textContent = `S3 error: ${e.message}`;
  }
});

function onThemeChange() { draw(); }
window.addEventListener('resize', resize);
resize();
initMultiplayer();
