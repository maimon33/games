// Connect Four — turn-based multiplayer via MP

const ROWS = 6, COLS = 7;

const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const roomEl   = document.getElementById('room-id');
const colorEl  = document.getElementById('color-label');

let CELL, state, myColor, roomId, stopPoll, role, hoverCol = null;

// ── State ─────────────────────────────────────────────────────────────────────

function newState() {
  return {
    board:  Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    turn:   'r',
    status: 'playing',
    winner: null,
  };
}

// ── Win detection ─────────────────────────────────────────────────────────────

const WIN_DIRS = [[0,1],[1,0],[1,1],[1,-1]];

function checkWin(board, r, c) {
  const color = board[r][c]; if (!color) return false;
  for (const [dr, dc] of WIN_DIRS) {
    let n = 1;
    for (let s = 1; s <= 3; s++) { const nr=r+dr*s, nc=c+dc*s; if (nr<0||nr>=ROWS||nc<0||nc>=COLS||board[nr][nc]!==color) break; n++; }
    for (let s = 1; s <= 3; s++) { const nr=r-dr*s, nc=c-dc*s; if (nr<0||nr>=ROWS||nc<0||nc>=COLS||board[nr][nc]!==color) break; n++; }
    if (n >= 4) return true;
  }
  return false;
}

function dropPiece(state, col) {
  let landRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) { if (!state.board[r][col]) { landRow = r; break; } }
  if (landRow === -1) return null;

  const board = state.board.map(r => [...r]);
  board[landRow][col] = state.turn;

  let status = 'playing', winner = null;
  if (checkWin(board, landRow, col)) { status = 'win'; winner = state.turn; }
  else if (board[0].every(c => c)) { status = 'draw'; }

  return { board, turn: state.turn === 'r' ? 'y' : 'r', status, winner };
}

function landRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) { if (!board[r][col]) return r; }
  return -1;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function resize() {
  CELL = Math.floor(Math.min(window.innerWidth - 32, 420) / COLS);
  canvas.width = CELL * COLS; canvas.height = CELL * ROWS;
  draw();
}

function draw() {
  if (!state) return;
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();

  ctx.fillStyle = '#1e40af';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const myTurn = !myColor || state.turn === myColor;

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = c * CELL + CELL/2, y = r * CELL + CELL/2;
    ctx.beginPath();
    ctx.arc(x, y, CELL * 0.42, 0, Math.PI * 2);

    const cell = state.board[r][c];
    if (cell === 'r') {
      ctx.fillStyle = '#ef4444';
    } else if (cell === 'y') {
      ctx.fillStyle = '#eab308';
    } else if (hoverCol === c && state.status === 'playing' && myTurn && landRow(state.board, c) === r) {
      ctx.fillStyle = myColor === 'r' ? 'rgba(239,68,68,0.35)' : myColor === 'y' ? 'rgba(234,179,8,0.35)' : 'rgba(255,255,255,0.15)';
    } else {
      ctx.fillStyle = surface || '#1a1a24';
    }
    ctx.fill();
  }
}

function updateStatus() {
  if (!state) return;
  if (state.status === 'win') {
    statusEl.textContent = myColor
      ? (myColor === state.winner ? 'You win! 🎉' : 'Opponent wins.')
      : `${state.winner === 'r' ? 'Red' : 'Yellow'} wins!`;
    statusEl.className = myColor === state.winner || !myColor ? 'win' : '';
  } else if (state.status === 'draw') {
    statusEl.textContent = "It's a draw!"; statusEl.className = '';
  } else {
    const myTurn = myColor && state.turn === myColor;
    statusEl.textContent = myColor
      ? (myTurn ? 'Your turn' : "Opponent's turn")
      : `${state.turn === 'r' ? 'Red' : 'Yellow'}'s turn`;
    statusEl.className = '';
  }
}

// ── Input ─────────────────────────────────────────────────────────────────────

function colFromClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return Math.floor((clientX - rect.left) * (canvas.width / rect.width) / CELL);
}

canvas.addEventListener('mousemove', e => {
  const c = colFromClientX(e.clientX);
  if (c !== hoverCol) { hoverCol = (c >= 0 && c < COLS) ? c : null; draw(); }
});
canvas.addEventListener('mouseleave', () => { hoverCol = null; draw(); });

async function handleTap(clientX) {
  if (!state || state.status !== 'playing') return;
  if (myColor && state.turn !== myColor) return;
  const col = colFromClientX(clientX);
  if (col < 0 || col >= COLS) return;

  const next = dropPiece(state, col);
  if (!next) return;

  if (roomId) {
    try { await MP.move(roomId, next); state = next; }
    catch (e) { statusEl.textContent = e.message; return; }
  } else { state = next; }

  updateStatus(); draw();
  if (state.status === 'win') launchConfetti();
}

canvas.addEventListener('click', e => handleTap(e.clientX));
canvas.addEventListener('touchend', e => { e.preventDefault(); const t = e.changedTouches[0]; if (t) handleTap(t.clientX); }, { passive: false });

// ── Multiplayer ───────────────────────────────────────────────────────────────

function startPolling() {
  if (stopPoll) stopPoll();
  stopPoll = MP.poll(roomId, room => {
    state = room.state;
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
      myColor = room.host === MP.myToken() ? 'r' : room.guest === MP.myToken() ? 'y' : null;
      state = room.state;
      roomEl.textContent  = rid;
      colorEl.textContent = myColor === 'r' ? '(Red)' : myColor === 'y' ? '(Yellow)' : '(Spectator)';
      if (role === 'host' && !room.guest) statusEl.textContent = 'Waiting for opponent…';
      startPolling();
    } catch { state = newState(); statusEl.textContent = 'Room not found.'; }
  } else { state = newState(); }
  updateStatus(); draw();
}

document.getElementById('btn-new').addEventListener('click', () => {
  if (stopPoll) { stopPoll(); stopPoll = null; }
  roomId = null; myColor = null; role = null; hoverCol = null;
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
  state = newState(); hoverCol = null;
  try {
    const { id, url, qrUrl } = await MP.createRoom('connect-four', state);
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
