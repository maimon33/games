const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const nextBoxEl = document.getElementById('next-box');
const statusEl = document.getElementById('status');
const btnNew = document.getElementById('btn-new');

const PAD = 8, GAP = 8, CELL = 65, N = 4;
let grid, nextTile, best, gameOver;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function tileStyle(val) {
  if (val === 1)   return { bg: '#4fa8e0', fg: '#ffffff' };
  if (val === 2)   return { bg: '#e05252', fg: '#ffffff' };
  if (val === 3)   return { bg: '#fff5e4', fg: '#3a2800' };
  if (val === 6)   return { bg: '#ffd89a', fg: '#3a2800' };
  if (val === 12)  return { bg: '#ffb84a', fg: '#3a2800' };
  if (val === 24)  return { bg: '#ff9030', fg: '#ffffff' };
  if (val === 48)  return { bg: '#ff6820', fg: '#ffffff' };
  if (val === 96)  return { bg: '#ff4010', fg: '#ffffff' };
  return { bg: '#d42020', fg: '#ffffff' };
}

function fontSize(val) {
  if (val <= 99)  return 28;
  if (val <= 999) return 20;
  return 14;
}

function cellX(c) { return PAD + c * (CELL + GAP); }
function cellY(r) { return PAD + r * (CELL + GAP); }

function draw() {
  const W = canvas.width;
  ctx.clearRect(0, 0, W, W);

  ctx.fillStyle = cv('--surface');
  ctx.beginPath(); ctx.roundRect(0, 0, W, W, 12); ctx.fill();

  ctx.fillStyle = cv('--bg');
  ctx.beginPath(); ctx.roundRect(PAD - 4, PAD - 4, W - (PAD - 4) * 2, W - (PAD - 4) * 2, 8); ctx.fill();

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = cellX(c), y = cellY(r), val = grid[r][c];
      if (val === 0) {
        ctx.fillStyle = cv('--surface');
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.roundRect(x, y, CELL, CELL, 8); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        const { bg, fg } = tileStyle(val);
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.roundRect(x, y, CELL, CELL, 8); ctx.fill();
        ctx.fillStyle = fg;
        ctx.font = `700 ${fontSize(val)}px system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), x + CELL / 2, y + CELL / 2);
      }
    }
  }
}

function randomNextTile() {
  const r = Math.random();
  if (r < 0.45) return 1;
  if (r < 0.90) return 2;
  return 3;
}

function updateNextBox() {
  const { bg, fg } = tileStyle(nextTile);
  nextBoxEl.style.background = bg;
  nextBoxEl.style.color = fg;
  nextBoxEl.textContent = nextTile;
}

function boardScore() {
  let s = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) s += grid[r][c];
  return s;
}

function canMerge(a, b) {
  if (a === 1 && b === 2) return true;
  if (a === 2 && b === 1) return true;
  if (a >= 3 && a === b)  return true;
  return false;
}

function mergeResult(a, b) {
  if (a === 1 && b === 2) return 3;
  if (a === 2 && b === 1) return 3;
  return a * 2;
}

function slideRow(row) {
  const merged = [false, false, false, false];
  let changed = false;
  for (let i = 1; i < N; i++) {
    if (row[i] === 0) continue;
    let j = i;
    while (j > 0) {
      if (row[j - 1] === 0) {
        row[j - 1] = row[j]; row[j] = 0; j--; changed = true;
      } else if (!merged[j - 1] && !merged[j] && canMerge(row[j - 1], row[j])) {
        row[j - 1] = mergeResult(row[j - 1], row[j]); row[j] = 0;
        merged[j - 1] = true; changed = true; break;
      } else {
        break;
      }
    }
  }
  return changed;
}

function rotateRight(g) {
  const out = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out[c][N - 1 - r] = g[r][c];
  return out;
}

function rotateLeft(g) {
  const out = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out[N - 1 - c][r] = g[r][c];
  return out;
}

function slideLeft(g) {
  let changed = false;
  for (let r = 0; r < N; r++) { if (slideRow(g[r])) changed = true; }
  return changed;
}

function slideRight(g) {
  for (let r = 0; r < N; r++) g[r].reverse();
  const changed = slideLeft(g);
  for (let r = 0; r < N; r++) g[r].reverse();
  return changed;
}

function slideUp(g) {
  const rot = rotateRight(g);
  const changed = slideLeft(rot);
  const back = rotateLeft(rot);
  for (let r = 0; r < N; r++) g[r] = back[r];
  return changed;
}

function slideDown(g) {
  const rot = rotateLeft(g);
  const changed = slideLeft(rot);
  const back = rotateRight(rot);
  for (let r = 0; r < N; r++) g[r] = back[r];
  return changed;
}

function emptyCells() {
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] === 0) cells.push([r, c]);
  return cells;
}

function spawnTile(val) {
  const empty = emptyCells();
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = val;
}

function hasValidMove() {
  if (emptyCells().length > 0) return true;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c + 1 < N && canMerge(grid[r][c], grid[r][c + 1])) return true;
      if (r + 1 < N && canMerge(grid[r][c], grid[r + 1][c])) return true;
    }
  }
  return false;
}

function move(dir) {
  if (gameOver) return;
  let changed = false;
  if (dir === 'left')  changed = slideLeft(grid);
  if (dir === 'right') changed = slideRight(grid);
  if (dir === 'up')    changed = slideUp(grid);
  if (dir === 'down')  changed = slideDown(grid);
  if (!changed) return;

  spawnTile(nextTile);
  nextTile = randomNextTile();
  updateNextBox();

  const s = boardScore();
  scoreEl.textContent = s;
  if (s > best) { best = s; bestEl.textContent = best; localStorage.setItem('threes-best', best); }

  draw();

  if (!hasValidMove()) {
    gameOver = true;
    statusEl.textContent = t('status.game_over');
  }
}

function newGame() {
  grid = Array.from({ length: N }, () => new Array(N).fill(0));
  gameOver = false;
  statusEl.textContent = '';
  statusEl.className = '';

  const startVals = [];
  for (let i = 0; i < 9; i++) startVals.push([1, 2, 3][Math.floor(Math.random() * 3)]);
  const positions = [];
  while (positions.length < 9) {
    const idx = Math.floor(Math.random() * 16);
    if (!positions.includes(idx)) positions.push(idx);
  }
  positions.forEach((idx, i) => { grid[Math.floor(idx / N)][idx % N] = startVals[i]; });

  nextTile = randomNextTile();
  updateNextBox();

  const s = boardScore();
  scoreEl.textContent = s;
  draw();
}

document.addEventListener('keydown', e => {
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
});

let touchStart = null;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: false });
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
  if (Math.abs(dx) >= Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
}, { passive: false });

btnNew.addEventListener('click', newGame);

function onThemeChange() { draw(); }

best = parseInt(localStorage.getItem('threes-best') || '0', 10);
bestEl.textContent = best;
newGame();
