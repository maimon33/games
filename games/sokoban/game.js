const canvas    = document.getElementById('canvas');
const ctx       = canvas.getContext('2d');
const statusEl  = document.getElementById('status');
const levelNumEl   = document.getElementById('level-num');
const levelTotalEl = document.getElementById('level-total');
const movesEl   = document.getElementById('moves');

let levelIdx = 0;
let walls, targets, boxes, player, history, moves;

function cv(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

levelTotalEl.textContent = LEVELS.length;

function key(r, c) { return `${r},${c}`; }

function parseLevel(idx) {
  const lines = LEVELS[idx];
  walls   = new Set();
  targets = new Set();
  boxes   = new Set();
  player  = null;

  lines.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      if (ch === '#')            walls.add(key(r, c));
      if (ch === '.' || ch === '*' || ch === '+') targets.add(key(r, c));
      if (ch === '$' || ch === '*') boxes.add(key(r, c));
      if (ch === '@' || ch === '+') player = { r, c };
    });
  });

  history = [];
  moves   = 0;
  movesEl.textContent = 0;
  statusEl.textContent = '';
  statusEl.className = '';
  levelNumEl.textContent = idx + 1;
}

function gridBounds() {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const k of walls) {
    const [r, c] = k.split(',').map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  return { minR, maxR, minC, maxC };
}

function cellSize() {
  const { minR, maxR, minC, maxC } = gridBounds();
  const gRows = maxR - minR + 1, gCols = maxC - minC + 1;
  const maxW = Math.min(window.innerWidth - 32, 480);
  const maxH = window.innerHeight * 0.55;
  return Math.floor(Math.min(maxW / gCols, maxH / gRows));
}

function draw() {
  const { minR, maxR, minC, maxC } = gridBounds();
  const cs = cellSize();
  const gCols = maxC - minC + 1, gRows = maxR - minR + 1;
  canvas.width  = gCols * cs;
  canvas.height = gRows * cs;

  ctx.fillStyle = cv('--bg');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const x = (c - minC) * cs, y = (r - minR) * cs;
      const k = key(r, c);

      if (walls.has(k)) {
        ctx.fillStyle = cv('--border');
        ctx.fillRect(x, y, cs, cs);
        ctx.fillStyle = cv('--muted') + '44';
        ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        continue;
      }

      // Floor
      ctx.fillStyle = cv('--surface');
      ctx.fillRect(x, y, cs, cs);

      // Target
      if (targets.has(k)) {
        ctx.fillStyle = cv('--accent') + '44';
        ctx.fillRect(x + cs * 0.25, y + cs * 0.25, cs * 0.5, cs * 0.5);
      }

      // Box
      if (boxes.has(k)) {
        const onTarget = targets.has(k);
        ctx.fillStyle = onTarget ? '#4ade80' : cv('--accent');
        ctx.beginPath();
        ctx.roundRect(x + cs * 0.1, y + cs * 0.1, cs * 0.8, cs * 0.8, 4);
        ctx.fill();
      }
    }
  }

  // Player
  const px = (player.c - minC + 0.5) * cs;
  const py = (player.r - minR + 0.5) * cs;
  ctx.beginPath();
  ctx.arc(px, py, cs * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = cv('--text');
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py - cs * 0.08, cs * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = cv('--bg');
  ctx.fill();
}

function tryMove(dr, dc) {
  if (statusEl.className === 'win') return;
  const nr = player.r + dr, nc = player.c + dc;
  const nk = key(nr, nc);
  if (walls.has(nk)) return;

  let pushedBox = null;
  if (boxes.has(nk)) {
    const br = nr + dr, bc = nc + dc;
    const bk = key(br, bc);
    if (walls.has(bk) || boxes.has(bk)) return;
    pushedBox = { from: nk, to: bk };
  }

  history.push({ player: { ...player }, boxes: new Set(boxes), pushedBox });
  if (pushedBox) {
    boxes.delete(pushedBox.from);
    boxes.add(pushedBox.to);
  }
  player = { r: nr, c: nc };
  moves++;
  movesEl.textContent = moves;

  draw();

  if ([...targets].every(t => boxes.has(t))) {
    statusEl.textContent = `Level ${levelIdx + 1} complete! (${moves} moves)`;
    statusEl.className = 'win';
  }
}

function undo() {
  if (!history.length) return;
  const state = history.pop();
  player = state.player;
  boxes  = state.boxes;
  moves--;
  movesEl.textContent = moves;
  statusEl.textContent = '';
  statusEl.className = '';
  draw();
}

function loadLevel(idx) {
  levelIdx = ((idx % LEVELS.length) + LEVELS.length) % LEVELS.length;
  parseLevel(levelIdx);
  draw();
}

document.addEventListener('keydown', e => {
  const map = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1],
                w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
  if (map[e.key]) { e.preventDefault(); tryMove(...map[e.key]); }
  if (e.key === 'z' || e.key === 'Z') undo();
});

let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
  if (Math.abs(dx) > Math.abs(dy)) tryMove(0, dx > 0 ? 1 : -1);
  else tryMove(dy > 0 ? 1 : -1, 0);
}, { passive: true });

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-restart').addEventListener('click', () => loadLevel(levelIdx));
document.getElementById('btn-prev').addEventListener('click', () => loadLevel(levelIdx - 1));
document.getElementById('btn-next').addEventListener('click', () => loadLevel(levelIdx + 1));

window.addEventListener('resize', draw);
function onThemeChange() { draw(); }

loadLevel(0);
