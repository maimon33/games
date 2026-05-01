// Battleship — turn-based multiplayer via MP
// Phase 1 (placement): serial — host places, then guest places.
// Phase 2 (battle): alternate shots. Ship positions in shared state (casual play).

const GRID = 10;
const SHIPS = [
  { name:'Carrier',    len:5 },
  { name:'Battleship', len:4 },
  { name:'Cruiser',    len:3 },
  { name:'Submarine',  len:3 },
  { name:'Destroyer',  len:2 },
];

const myCanvas    = document.getElementById('my-grid');
const enemyCanvas = document.getElementById('enemy-grid');
const myCtx       = myCanvas.getContext('2d');
const enemyCtx    = enemyCanvas.getContext('2d');
const statusEl    = document.getElementById('status');
const roomEl      = document.getElementById('room-id');
const colorEl     = document.getElementById('color-label');
const placementUI = document.getElementById('placement-ui');
const shipListEl  = document.getElementById('ship-list');
const btnReady    = document.getElementById('btn-ready');
const btnRotate   = document.getElementById('btn-rotate');
const enemyWrap   = document.getElementById('enemy-wrap');

let CELL, state, myColor, myRole, roomId, stopPoll;
let placing = { shipIdx: 0, horiz: true, preview: null, placed: [] };

// ── State ─────────────────────────────────────────────────────────────────────

function newState() {
  return {
    phase: 'placement',
    hostShips: null, guestShips: null,
    hostShots: [], guestShots: [],
    winner: null,
  };
}

function myShips(state)   { return myRole === 'host' ? state.hostShips : state.guestShips; }
function oppShips(state)  { return myRole === 'host' ? state.guestShips : state.hostShips; }
function myShots(state)   { return myRole === 'host' ? state.hostShots : state.guestShots; }
function oppShots(state)  { return myRole === 'host' ? state.guestShots : state.hostShots; }

// ── Ship helpers ──────────────────────────────────────────────────────────────

function shipCells(s) {
  const cells = [];
  for (let i = 0; i < s.len; i++)
    cells.push(s.horiz ? [s.r, s.c + i] : [s.r + i, s.c]);
  return cells;
}

function shipOccupies(ships, r, c) {
  return ships?.some(s => shipCells(s).some(([sr, sc]) => sr === r && sc === c));
}

function canPlace(placed, r, c, len, horiz) {
  for (let i = 0; i < len; i++) {
    const nr = horiz ? r : r + i, nc = horiz ? c + i : c;
    if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) return false;
    if (shipOccupies(placed, nr, nc)) return false;
  }
  return true;
}

function isHit(ships, r, c) { return shipOccupies(ships, r, c); }

function isSunk(ships, shots, shipIdx) {
  return shipCells(ships[shipIdx]).every(([r, c]) => shots.some(([sr, sc]) => sr === r && sc === c));
}

function allSunk(ships, shots) {
  return ships?.every((_, i) => isSunk(ships, shots, i));
}

// ── Placement UI ──────────────────────────────────────────────────────────────

function buildShipList() {
  shipListEl.innerHTML = '';
  SHIPS.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'ship-btn' + (i === placing.shipIdx ? ' active' : '') + (placing.placed[i] ? ' placed' : '');
    btn.textContent = `${s.name} (${s.len})`;
    btn.onclick = () => { if (!placing.placed[i]) { placing.shipIdx = i; buildShipList(); drawMyGrid(); } };
    shipListEl.appendChild(btn);
  });
}

function checkReadyBtn() {
  btnReady.disabled = placing.placed.length < SHIPS.length;
}

btnRotate.addEventListener('click', () => { placing.horiz = !placing.horiz; drawMyGrid(); });

btnReady.addEventListener('click', async () => {
  if (!roomId || placing.placed.length < SHIPS.length) return;
  const ships = SHIPS.map((s, i) => ({ ...placing.placed[i], len: s.len, name: s.name }));
  const newSt = { ...state };
  if (myRole === 'host') newSt.hostShips = ships;
  else { newSt.guestShips = ships; newSt.phase = 'battle'; }
  try {
    await MP.move(roomId, newSt);
    state = newSt;
    placementUI.style.display = 'none';
    if (state.phase === 'battle') enemyWrap.style.display = '';
    updateStatus(); drawAll();
  } catch (e) { statusEl.textContent = `Error: ${e.message}`; }
});

// ── Rendering ─────────────────────────────────────────────────────────────────

function resize() {
  const sz = Math.min(Math.floor((window.innerWidth - 72) / 2), 220);
  CELL = sz / GRID;
  myCanvas.width = myCanvas.height = sz;
  enemyCanvas.width = enemyCanvas.height = sz;
  drawAll();
}

function drawGrid(ctx, size) {
  ctx.strokeStyle = 'rgba(100,120,160,0.4)'; ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i*CELL, 0); ctx.lineTo(i*CELL, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i*CELL); ctx.lineTo(size, i*CELL); ctx.stroke();
  }
}

function drawShip(ctx, s, alpha) {
  const x = s.c*CELL, y = s.r*CELL;
  const w = s.horiz ? s.len*CELL : CELL, h = s.horiz ? CELL : s.len*CELL;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#4a6080';
  ctx.fillRect(x+1, y+1, w-2, h-2);
  ctx.strokeStyle = '#6a90b0'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x+1, y+1, w-2, h-2);
  ctx.globalAlpha = 1;
}

function drawShots(ctx, shots, ships) {
  for (const [r, c] of shots) {
    const x = c*CELL+CELL/2, y = r*CELL+CELL/2;
    const hit = ships && isHit(ships, r, c);
    if (hit) {
      ctx.fillStyle = '#e05252';
      ctx.beginPath(); ctx.arc(x, y, CELL*0.35, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle = '#7a7a96'; ctx.lineWidth = 1.5;
      const d = CELL*0.25;
      ctx.beginPath(); ctx.moveTo(x-d,y-d); ctx.lineTo(x+d,y+d); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+d,y-d); ctx.lineTo(x-d,y+d); ctx.stroke();
    }
  }
}

function drawMyGrid() {
  const sz = myCanvas.width;
  myCtx.clearRect(0, 0, sz, sz);
  myCtx.fillStyle = '#0c1e30';
  myCtx.fillRect(0, 0, sz, sz);
  drawGrid(myCtx, sz);

  if (state?.phase === 'placement') {
    // Draw already-placed ships
    placing.placed.forEach((s, i) => s && drawShip(myCtx, { ...s, len: SHIPS[i].len }, 0.85));
    // Draw preview
    if (placing.preview) {
      const { r, c } = placing.preview, s = SHIPS[placing.shipIdx];
      const ok = canPlace(placing.placed.filter(Boolean), r, c, s.len, placing.horiz);
      myCtx.globalAlpha = 0.5;
      myCtx.fillStyle = ok ? '#52a0e0' : '#e05252';
      const w = placing.horiz ? s.len*CELL : CELL, h = placing.horiz ? CELL : s.len*CELL;
      myCtx.fillRect(c*CELL+1, r*CELL+1, w-2, h-2);
      myCtx.globalAlpha = 1;
    }
  } else if (state) {
    const ships = myShips(state);
    if (ships) ships.forEach(s => drawShip(myCtx, s, 0.85));
    drawShots(myCtx, oppShots(state), ships);
  }
}

function drawEnemyGrid() {
  const sz = enemyCanvas.width;
  enemyCtx.clearRect(0, 0, sz, sz);
  enemyCtx.fillStyle = '#0c1e30';
  enemyCtx.fillRect(0, 0, sz, sz);
  drawGrid(enemyCtx, sz);

  if (!state) return;
  const oShips = oppShots(state) ? oppShips(state) : null;
  const shots = myShots(state);

  // Show opponent ships only where we've hit
  if (oShips) {
    oShips.forEach(s => {
      shipCells(s).forEach(([r, c]) => {
        if (shots.some(([sr, sc]) => sr === r && sc === c)) {
          enemyCtx.fillStyle = 'rgba(100,80,50,0.6)';
          enemyCtx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2);
        }
      });
    });
  }
  drawShots(enemyCtx, shots, oShips);
}

function drawAll() { drawMyGrid(); drawEnemyGrid(); }

// ── Status ────────────────────────────────────────────────────────────────────

function updateStatus() {
  if (!state) return;
  if (state.winner) {
    statusEl.textContent = myRole === state.winner ? 'You win! All enemy ships sunk!' : 'You lose. Your fleet was destroyed.';
    statusEl.className = myRole === state.winner ? 'win' : '';
    placementUI.style.display = 'none';
    return;
  }
  if (state.phase === 'placement') {
    if (!myRole) { statusEl.textContent = 'Spectating…'; return; }
    const myShipsPlaced = myRole === 'host' ? state.hostShips : state.guestShips;
    const oppShipsPlaced = myRole === 'host' ? state.guestShips : state.hostShips;
    if (myShipsPlaced && !oppShipsPlaced) { statusEl.textContent = 'Waiting for opponent to place ships…'; placementUI.style.display = 'none'; return; }
    if (!myShipsPlaced) {
      const isMyTurn = (myRole === 'host' && !state.hostShips) || (myRole === 'guest' && state.hostShips && !state.guestShips);
      statusEl.textContent = isMyTurn ? 'Place your ships' : 'Waiting for opponent to place ships…';
      placementUI.style.display = isMyTurn ? '' : 'none';
      return;
    }
  }
  if (state.phase === 'battle') {
    placementUI.style.display = 'none';
    enemyWrap.style.display = '';
    if (!myRole) { statusEl.textContent = 'Spectating…'; return; }
    // It's your turn if room.turn === MP.myToken()
    // We track this via a cached myTurnFlag set on poll
    statusEl.textContent = myTurnFlag ? 'Your turn — fire!' : "Opponent's turn…";
  }
}

let myTurnFlag = false;

function syncState(room) {
  state = room.state;
  myTurnFlag = room.turn === MP.myToken();

  if (state.phase === 'battle') {
    enemyWrap.style.display = '';
    placementUI.style.display = 'none';
  }
  if (state.winner && room.guest && myRole === 'host') MP.closeInviteModal();
  updateStatus(); drawAll();
  if (state.winner && myRole === state.winner) launchConfetti();
}

// ── Placement input ───────────────────────────────────────────────────────────

function gridCell(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.floor((clientY - rect.top)  * (canvas.height / rect.height) / CELL),
    Math.floor((clientX - rect.left) * (canvas.width  / rect.width)  / CELL),
  ];
}

myCanvas.addEventListener('mousemove', e => {
  if (state?.phase !== 'placement') return;
  const [r, c] = gridCell(myCanvas, e.clientX, e.clientY);
  if (r >= 0 && r < GRID && c >= 0 && c < GRID) { placing.preview = { r, c }; drawMyGrid(); }
});
myCanvas.addEventListener('mouseleave', () => { placing.preview = null; drawMyGrid(); });

myCanvas.addEventListener('click', e => {
  if (state?.phase !== 'placement') return;
  if (placing.placed[placing.shipIdx]) return;
  const [r, c] = gridCell(myCanvas, e.clientX, e.clientY);
  const s = SHIPS[placing.shipIdx];
  if (!canPlace(placing.placed.filter(Boolean), r, c, s.len, placing.horiz)) return;

  placing.placed[placing.shipIdx] = { r, c, horiz: placing.horiz };
  // Move to next unplaced ship
  const next = SHIPS.findIndex((_, i) => i > placing.shipIdx && !placing.placed[i]);
  if (next !== -1) placing.shipIdx = next;
  buildShipList(); checkReadyBtn(); drawMyGrid();
});

myCanvas.addEventListener('touchend', e => {
  e.preventDefault();
  const t = e.changedTouches[0]; if (!t) return;
  if (state?.phase !== 'placement') return;
  const [r, c] = gridCell(myCanvas, t.clientX, t.clientY);
  const s = SHIPS[placing.shipIdx];
  if (!canPlace(placing.placed.filter(Boolean), r, c, s.len, placing.horiz)) return;
  placing.placed[placing.shipIdx] = { r, c, horiz: placing.horiz };
  const next = SHIPS.findIndex((_, i) => i > placing.shipIdx && !placing.placed[i]);
  if (next !== -1) placing.shipIdx = next;
  buildShipList(); checkReadyBtn(); drawMyGrid();
}, { passive: false });

// ── Battle input ──────────────────────────────────────────────────────────────

async function fireShot(r, c) {
  if (!state || state.phase !== 'battle' || state.winner) return;
  if (!myTurnFlag) return;
  const shots = myShots(state);
  if (shots.some(([sr, sc]) => sr === r && sc === c)) return; // already shot here

  const newShots = [...shots, [r, c]];
  const newSt = { ...state };
  if (myRole === 'host') newSt.hostShots = newShots;
  else newSt.guestShots = newShots;

  // Check win
  const oShips = oppShips(newSt);
  if (allSunk(oShips, newShots)) newSt.winner = myRole;

  try {
    await MP.move(roomId, newSt);
    state = newSt; myTurnFlag = false;
    updateStatus(); drawAll();
    if (state.winner) launchConfetti();
  } catch (e) { statusEl.textContent = e.message; }
}

enemyCanvas.addEventListener('click', e => {
  const [r, c] = gridCell(enemyCanvas, e.clientX, e.clientY);
  if (r >= 0 && r < GRID && c >= 0 && c < GRID) fireShot(r, c);
});
enemyCanvas.addEventListener('touchend', e => {
  e.preventDefault();
  const t = e.changedTouches[0]; if (!t) return;
  const [r, c] = gridCell(enemyCanvas, t.clientX, t.clientY);
  if (r >= 0 && r < GRID && c >= 0 && c < GRID) fireShot(r, c);
}, { passive: false });

// ── Multiplayer ───────────────────────────────────────────────────────────────

function startPolling() {
  if (stopPoll) stopPoll();
  stopPoll = MP.poll(roomId, syncState);
}

function resetPlacement() {
  placing = { shipIdx: 0, horiz: true, preview: null, placed: [] };
  buildShipList(); checkReadyBtn();
}

async function initMultiplayer() {
  const rid = new URLSearchParams(location.search).get('room');
  resetPlacement();
  if (rid) {
    try {
      const { room, role: r } = await MP.joinRoom(rid);
      roomId = rid; myRole = r === 'spectator' ? null : r;
      myColor = myRole === 'host' ? 'Blue' : 'Red';
      myTurnFlag = room.turn === MP.myToken();
      state = room.state;
      roomEl.textContent  = rid;
      colorEl.textContent = myRole ? `(${myRole === 'host' ? 'Host' : 'Guest'})` : '(Spectator)';
      if (myRole === 'host' && !room.guest) statusEl.textContent = 'Waiting for opponent…';
      if (state.phase === 'battle') { enemyWrap.style.display = ''; placementUI.style.display = 'none'; }
      startPolling();
    } catch { state = newState(); statusEl.textContent = 'Room not found.'; }
  } else { state = newState(); }
  updateStatus(); drawAll();
}

document.getElementById('btn-new').addEventListener('click', () => {
  if (stopPoll) { stopPoll(); stopPoll = null; }
  roomId = null; myRole = null; myColor = null; myTurnFlag = false;
  roomEl.textContent = '—'; colorEl.textContent = '';
  enemyWrap.style.display = 'none';
  state = newState();
  history.replaceState({}, '', location.pathname);
  resetPlacement();
  placementUI.style.display = '';
  updateStatus(); drawAll();
});

document.getElementById('btn-invite').addEventListener('click', async () => {
  if (roomId) {
    const url = `${location.origin}${location.pathname}?room=${roomId}`;
    MP.showInviteModal({ id: roomId, url, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}` });
    return;
  }
  state = newState(); resetPlacement();
  try {
    const { id, url, qrUrl } = await MP.createRoom('battleship', state);
    roomId = id; myRole = 'host'; myTurnFlag = true;
    history.replaceState({}, '', `?room=${id}`);
    roomEl.textContent = id; colorEl.textContent = '(Host)';
    MP.showInviteModal({ id, url, qrUrl });
    startPolling(); updateStatus(); drawAll();
  } catch (e) { statusEl.textContent = `Error: ${e.message}`; }
});

function onThemeChange() { drawAll(); }
window.addEventListener('resize', resize);
resize();
initMultiplayer();
