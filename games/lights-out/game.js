const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const movesEl  = document.getElementById('moves');
const btnNew   = document.getElementById('btn-new');
const btnSize  = document.getElementById('btn-size');
const btnDiff  = document.getElementById('btn-diff');

const SIZES = [3, 4, 5, 6];
const DIFFS = [
  { label: 'Easy',   clicks: 8  },
  { label: 'Medium', clicks: 20 },
  { label: 'Hard',   clicks: 40 },
];
let sizeIdx = 2; // default 5×5
let diffIdx = 1;
let grid, size, moves, won;

function cv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

function cs() {
  const s = SIZES[sizeIdx];
  return Math.floor(Math.min(window.innerWidth - 64, window.innerHeight * 0.55) / s);
}

function initGame() {
  size = SIZES[sizeIdx];
  grid = new Uint8Array(size * size); // all off
  moves = 0; won = false;
  movesEl.textContent = 0;
  statusEl.textContent = '';
  statusEl.className = '';

  // Generate puzzle: make random clicks from solved state
  const n = DIFFS[diffIdx].clicks;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    applyToggle(r, c);
  }

  // If puzzle ended up solved (rare), retry
  if (grid.every(v => v === 0)) initGame();

  const side = cs() * size;
  canvas.width = canvas.height = side;
  draw();
}

function applyToggle(r, c) {
  const toggle = (rr, cc) => {
    if (rr >= 0 && rr < size && cc >= 0 && cc < size)
      grid[rr * size + cc] ^= 1;
  };
  toggle(r, c);
  toggle(r - 1, c);
  toggle(r + 1, c);
  toggle(r, c - 1);
  toggle(r, c + 1);
}

function draw() {
  const side = cs();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const on = grid[r * size + c];
      const x = c * side, y = r * side;
      const pad = side * 0.06;

      ctx.fillStyle = on ? cv('--accent') : cv('--surface');
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, side - pad * 2, side - pad * 2, 8);
      ctx.fill();

      if (on) {
        // Glow effect
        ctx.fillStyle = cv('--accent') + '44';
        ctx.beginPath();
        ctx.roundRect(x, y, side, side, 8);
        ctx.fill();
      }
    }
  }
}

function handleClick(clientX, clientY) {
  if (won) return;
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const side = cs();
  const c = Math.floor((clientX - rect.left) * scale / side);
  const r = Math.floor((clientY - rect.top)  * scale / side);
  if (r < 0 || r >= size || c < 0 || c >= size) return;

  applyToggle(r, c);
  moves++;
  movesEl.textContent = moves;
  draw();

  if (grid.every(v => v === 0)) {
    won = true;
    statusEl.textContent = `All out in ${moves} move${moves !== 1 ? 's' : ''}!`;
    statusEl.className = 'win';
  }
}

canvas.addEventListener('click', e => handleClick(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  handleClick(t.clientX, t.clientY);
}, { passive: true });

btnNew.addEventListener('click', initGame);
btnSize.addEventListener('click', () => {
  sizeIdx = (sizeIdx + 1) % SIZES.length;
  btnSize.textContent = `Size: ${SIZES[sizeIdx]}×${SIZES[sizeIdx]}`;
  initGame();
});
btnDiff.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  btnDiff.textContent = DIFFS[diffIdx].label;
  initGame();
});

window.addEventListener('resize', () => {
  const side = cs() * size;
  canvas.width = canvas.height = side;
  draw();
});

function onThemeChange() { draw(); }

initGame();
