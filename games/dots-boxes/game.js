// Dots & Boxes — turn-based multiplayer via MP
// Local buffer: player draws lines until one doesn't complete a box → submit to S3

const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const roomEl   = document.getElementById('room-id');
const colorEl  = document.getElementById('color-label');
const scoreREl = document.getElementById('score-r');
const scoreBEl = document.getElementById('score-b');

const N = 5; // 5×5 dots → 4×4 boxes
let STEP, OFFSET, DOT_R;
let state, myColor, roomId, stopPoll, role;

// ── State ─────────────────────────────────────────────────────────────────────
// hLines[r][c]: bool — horizontal line from dot(r,c) to dot(r,c+1),  r∈[0,N-1], c∈[0,N-2]
// vLines[r][c]: bool — vertical   line from dot(r,c) to dot(r+1,c),  r∈[0,N-2], c∈[0,N-1]
// boxes[r][c]:  null|'r'|'b'                                           r,c∈[0,N-2]

function newState() {
  return {
    hLines: Array.from({length:N},   () => Array(N-1).fill(false)),
    vLines: Array.from({length:N-1}, () => Array(N).fill(false)),
    boxes:  Array.from({length:N-1}, () => Array(N-1).fill(null)),
    scores: {r:0, b:0},
    turn: 'r',
    status: 'playing',
    winner: null,
  };
}

// ── Geometry ──────────────────────────────────────────────────────────────────

function resize() {
  const sz = Math.min(window.innerWidth - 32, 380);
  canvas.width = canvas.height = sz;
  OFFSET = sz * 0.1;
  STEP   = (sz - OFFSET * 2) / (N - 1);
  DOT_R  = sz * 0.022;
  draw();
}

// Which line is near (x,y)? Returns {type:'h'|'v', r, c} or null
function lineAt(x, y) {
  const thresh = STEP * 0.3;
  // Horizontal lines
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N-1; c++) {
      const mx = OFFSET + c*STEP + STEP/2;
      const my = OFFSET + r*STEP;
      if (Math.abs(y - my) < thresh && Math.abs(x - mx) < STEP/2 + thresh)
        return {type:'h', r, c};
    }
  }
  // Vertical lines
  for (let r = 0; r < N-1; r++) {
    for (let c = 0; c < N; c++) {
      const mx = OFFSET + c*STEP;
      const my = OFFSET + r*STEP + STEP/2;
      if (Math.abs(x - mx) < thresh && Math.abs(y - my) < STEP/2 + thresh)
        return {type:'v', r, c};
    }
  }
  return null;
}

// Check which boxes got completed by drawing hLines[r][c] or vLines[r][c]
function checkBoxes(st, type, r, c) {
  const completed = [];
  if (type === 'h') {
    // Could complete box above (r-1,c) or below (r,c)
    for (const [br, bc] of [[r-1, c],[r, c]]) {
      if (br < 0 || br >= N-1 || bc < 0 || bc >= N-1) continue;
      if (!st.boxes[br][bc] &&
          st.hLines[br][bc] && st.hLines[br+1][bc] &&
          st.vLines[br][bc] && st.vLines[br][bc+1]) completed.push([br, bc]);
    }
  } else {
    // Could complete box left (r,c-1) or right (r,c)
    for (const [br, bc] of [[r, c-1],[r, c]]) {
      if (br < 0 || br >= N-1 || bc < 0 || bc >= N-1) continue;
      if (!st.boxes[br][bc] &&
          st.hLines[br][bc] && st.hLines[br+1][bc] &&
          st.vLines[br][bc] && st.vLines[br][bc+1]) completed.push([br, bc]);
    }
  }
  return completed;
}

function applyLine(st, type, r, c) {
  const next = {
    hLines: st.hLines.map(row => [...row]),
    vLines: st.vLines.map(row => [...row]),
    boxes:  st.boxes.map(row => [...row]),
    scores: {...st.scores},
    turn: st.turn,
    status: st.status,
    winner: st.winner,
  };
  if (type === 'h') next.hLines[r][c] = true;
  else              next.vLines[r][c] = true;

  const completed = checkBoxes(next, type, r, c);
  completed.forEach(([br, bc]) => {
    next.boxes[br][bc] = st.turn;
    next.scores[st.turn]++;
  });

  const totalBoxes = (N-1) * (N-1);
  if (next.scores.r + next.scores.b === totalBoxes) {
    next.status = 'done';
    if (next.scores.r > next.scores.b) next.winner = 'r';
    else if (next.scores.b > next.scores.r) next.winner = 'b';
    else next.winner = 'draw';
  } else if (completed.length === 0) {
    next.turn = st.turn === 'r' ? 'b' : 'r';
  }
  // If completed boxes: same player keeps turn

  return {next, scoredBoxes: completed.length};
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function draw(hover) {
  if (!state) return;
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const bg    = light ? '#f4f4f8' : '#0f0f13';
  const dotC  = light ? '#1a1a2e' : '#e8e8f0';
  const emptyC = light ? '#dddde8' : '#2a2a38';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Boxes
  for (let r = 0; r < N-1; r++) for (let c = 0; c < N-1; c++) {
    if (!state.boxes[r][c]) continue;
    ctx.fillStyle = state.boxes[r][c] === 'r'
      ? 'rgba(224,82,82,0.25)' : 'rgba(82,133,224,0.25)';
    ctx.fillRect(OFFSET+c*STEP+3, OFFSET+r*STEP+3, STEP-6, STEP-6);
    // initials
    ctx.fillStyle = state.boxes[r][c] === 'r' ? '#e05252' : '#5285e0';
    ctx.font = `bold ${STEP*0.3}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.boxes[r][c].toUpperCase(),
      OFFSET + c*STEP + STEP/2, OFFSET + r*STEP + STEP/2);
  }

  // Hover preview
  if (hover && state.status === 'playing') {
    const myTurn = !myColor || state.turn === myColor;
    if (myTurn) {
      const c = state.turn === 'r' ? 'rgba(224,82,82,0.4)' : 'rgba(82,133,224,0.4)';
      drawLine(hover.type, hover.r, hover.c, c, 5);
    }
  }

  // Drawn lines
  for (let r = 0; r < N; r++) for (let c = 0; c < N-1; c++) {
    if (!state.hLines[r][c]) continue;
    drawLine('h', r, c, light ? '#1a1a2e' : '#e8e8f0', 3);
  }
  for (let r = 0; r < N-1; r++) for (let c = 0; c < N; c++) {
    if (!state.vLines[r][c]) continue;
    drawLine('v', r, c, light ? '#1a1a2e' : '#e8e8f0', 3);
  }

  // Empty line hints (subtle)
  for (let r = 0; r < N; r++) for (let c = 0; c < N-1; c++) {
    if (!state.hLines[r][c]) drawLine('h', r, c, emptyC, 2);
  }
  for (let r = 0; r < N-1; r++) for (let c = 0; c < N; c++) {
    if (!state.vLines[r][c]) drawLine('v', r, c, emptyC, 2);
  }

  // Dots
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    ctx.beginPath();
    ctx.arc(OFFSET+c*STEP, OFFSET+r*STEP, DOT_R, 0, Math.PI*2);
    ctx.fillStyle = dotC; ctx.fill();
  }

  updateScores();
}

function drawLine(type, r, c, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (type === 'h') {
    ctx.moveTo(OFFSET + c*STEP, OFFSET + r*STEP);
    ctx.lineTo(OFFSET + (c+1)*STEP, OFFSET + r*STEP);
  } else {
    ctx.moveTo(OFFSET + c*STEP, OFFSET + r*STEP);
    ctx.lineTo(OFFSET + c*STEP, OFFSET + (r+1)*STEP);
  }
  ctx.stroke();
}

function updateScores() {
  scoreREl.textContent = state.scores.r;
  scoreBEl.textContent = state.scores.b;
}

function updateStatus() {
  if (!state) return;
  if (state.status === 'done') {
    if (state.winner === 'draw') { statusEl.textContent = "It's a draw!"; statusEl.className = 'win'; }
    else {
      const name = state.winner === 'r' ? 'Red' : 'Blue';
      statusEl.textContent = myColor
        ? (myColor === state.winner ? 'You win!' : `${name} wins!`)
        : `${name} wins!`;
      statusEl.className = 'win';
    }
  } else {
    const turnName = state.turn === 'r' ? 'Red' : 'Blue';
    const myTurn = myColor && state.turn === myColor;
    statusEl.textContent = myColor
      ? (myTurn ? 'Your turn' : "Opponent's turn")
      : `${turnName}'s turn`;
    statusEl.className = '';
  }
}

// ── Input ─────────────────────────────────────────────────────────────────────

function canvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return [
    (clientX - rect.left) * (canvas.width  / rect.width),
    (clientY - rect.top)  * (canvas.height / rect.height),
  ];
}

async function handleClick(clientX, clientY) {
  if (!state || state.status !== 'playing') return;
  if (myColor && state.turn !== myColor) return;
  const [x, y] = canvasCoords(clientX, clientY);
  const line = lineAt(x, y);
  if (!line) return;
  const already = line.type === 'h' ? state.hLines[line.r][line.c] : state.vLines[line.r][line.c];
  if (already) return;

  const {next, scoredBoxes} = applyLine(state, line.type, line.r, line.c);

  if (roomId) {
    // Submit only when turn ends (no box completed = turn switches)
    if (scoredBoxes === 0 || next.status === 'done') {
      try { await MP.move(roomId, next); state = next; }
      catch (e) { statusEl.textContent = e.message; return; }
    } else {
      // Box completed: keep going locally without S3 write yet
      // But we need to write once the chain ends; track locally
      state = next;
    }
  } else {
    state = next;
  }

  updateStatus(); draw();
  if (state.status === 'done') launchConfetti();
}

let hoverLine = null;
canvas.addEventListener('mousemove', e => {
  const [x, y] = canvasCoords(e.clientX, e.clientY);
  hoverLine = lineAt(x, y);
  draw(hoverLine);
});
canvas.addEventListener('mouseleave', () => { hoverLine = null; draw(); });
canvas.addEventListener('click',    e => handleClick(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  if (t) handleClick(t.clientX, t.clientY);
}, {passive:false});

// ── Multiplayer ───────────────────────────────────────────────────────────────

function startPolling() {
  if (stopPoll) stopPoll();
  stopPoll = MP.poll(roomId, room => {
    state = room.state;
    if (room.guest && role === 'host') MP.closeInviteModal();
    updateStatus(); draw();
    if (state.status === 'done') launchConfetti();
  });
}

async function initMultiplayer() {
  const rid = new URLSearchParams(location.search).get('room');
  if (rid) {
    try {
      const {room, role: r} = await MP.joinRoom(rid);
      roomId = rid; role = r;
      myColor = room.host === MP.myToken() ? 'r' : room.guest === MP.myToken() ? 'b' : null;
      state = room.state;
      roomEl.textContent  = rid;
      colorEl.textContent = myColor === 'r' ? '(Red)' : myColor === 'b' ? '(Blue)' : '(Spectator)';
      if (role === 'host' && !room.guest) statusEl.textContent = 'Waiting for opponent…';
      startPolling();
    } catch { state = newState(); statusEl.textContent = 'Room not found.'; }
  } else { state = newState(); }
  updateStatus(); draw();
}

document.getElementById('btn-new').addEventListener('click', () => {
  if (stopPoll) { stopPoll(); stopPoll = null; }
  roomId = null; myColor = null; role = null;
  roomEl.textContent = '—'; colorEl.textContent = '';
  state = newState();
  history.replaceState({}, '', location.pathname);
  updateStatus(); draw();
});

document.getElementById('btn-invite').addEventListener('click', async () => {
  if (roomId) {
    const url = `${location.origin}${location.pathname}?room=${roomId}`;
    MP.showInviteModal({id:roomId, url, qrUrl:`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`});
    return;
  }
  state = newState();
  try {
    const {id, url, qrUrl} = await MP.createRoom('dots-boxes', state);
    roomId = id; role = 'host'; myColor = 'r';
    history.replaceState({}, '', `?room=${id}`);
    roomEl.textContent = id; colorEl.textContent = '(Red)';
    MP.showInviteModal({id, url, qrUrl});
    startPolling(); updateStatus(); draw();
  } catch (e) { statusEl.textContent = `Error: ${e.message}`; }
});

function onThemeChange() { draw(); }
window.addEventListener('resize', resize);
resize();
initMultiplayer();
