const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const btnNew = document.getElementById('btn-new');
const btnSize = document.getElementById('btn-size');

const SIZES = [
  { label: 'Small',  cols: 9,  rows: 9  },
  { label: 'Medium', cols: 15, rows: 15 },
  { label: 'Large',  cols: 21, rows: 21 },
];
let sizeIdx = 1;
let grid, cols, rows, player, won;

function cv(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function initMaze() {
  ({ cols, rows } = SIZES[sizeIdx]);
  won = false;
  statusEl.textContent = '';
  statusEl.className = '';

  grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ n: false, s: false, e: false, w: false }))
  );

  const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
  const stack = [{ r: 0, c: 0 }];
  visited[0][0] = 1;

  const dirs = [
    { dr: -1, dc: 0, from: 's', to: 'n' },
    { dr:  1, dc: 0, from: 'n', to: 's' },
    { dr:  0, dc: 1, from: 'w', to: 'e' },
    { dr:  0, dc:-1, from: 'e', to: 'w' },
  ];

  while (stack.length) {
    const { r, c } = stack[stack.length - 1];
    const neighbors = dirs
      .map(d => ({ r: r + d.dr, c: c + d.dc, from: d.from, to: d.to }))
      .filter(n => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && !visited[n.r][n.c]);
    if (!neighbors.length) { stack.pop(); continue; }
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[r][c][next.to] = true;
    grid[next.r][next.c][next.from] = true;
    visited[next.r][next.c] = 1;
    stack.push({ r: next.r, c: next.c });
  }

  player = { r: 0, c: 0 };
  resize();
}

function cellSize() {
  const maxW = Math.min(window.innerWidth - 32, 520);
  const maxH = window.innerHeight * 0.6;
  return Math.floor(Math.min(maxW / cols, maxH / rows));
}

function resize() {
  const cs = cellSize();
  canvas.width  = cols * cs;
  canvas.height = rows * cs;
  draw();
}

function draw() {
  const cs = cellSize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = cv('--surface');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Goal
  ctx.fillStyle = cv('--accent') + '33';
  ctx.fillRect((cols - 1) * cs, (rows - 1) * cs, cs, cs);
  ctx.fillStyle = '#4ade80';
  ctx.font = `${cs * 0.6}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', (cols - 0.5) * cs, (rows - 0.5) * cs);

  // Walls
  ctx.strokeStyle = cv('--accent');
  ctx.lineWidth = 2;
  ctx.lineCap = 'square';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cs, y = r * cs;
      const cell = grid[r][c];
      ctx.beginPath();
      if (!cell.n) { ctx.moveTo(x, y);      ctx.lineTo(x + cs, y); }
      if (!cell.s) { ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); }
      if (!cell.w) { ctx.moveTo(x, y);      ctx.lineTo(x, y + cs); }
      if (!cell.e) { ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); }
      ctx.stroke();
    }
  }

  // Player
  ctx.beginPath();
  ctx.arc((player.c + 0.5) * cs, (player.r + 0.5) * cs, cs * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = cv('--accent');
  ctx.fill();
}

function move(dr, dc) {
  if (won) return;
  const { r, c } = player;
  const dir = dr === -1 ? 'n' : dr === 1 ? 's' : dc === 1 ? 'e' : 'w';
  if (!grid[r][c][dir]) return;
  player.r += dr;
  player.c += dc;
  draw();
  if (player.r === rows - 1 && player.c === cols - 1) {
    won = true;
    statusEl.textContent = t('status.solved');
    statusEl.className = 'win';
    launchConfetti();
  }
}

document.addEventListener('keydown', e => {
  const map = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1],
                w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
  const delta = map[e.key];
  if (!delta) return;
  e.preventDefault();
  move(...delta);
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
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1);
  else move(dy > 0 ? 1 : -1, 0);
}, { passive: true });

btnNew.addEventListener('click', initMaze);
btnSize.addEventListener('click', () => {
  sizeIdx = (sizeIdx + 1) % SIZES.length;
  btnSize.textContent = t('maze.size_' + SIZES[sizeIdx].label.toLowerCase());
  initMaze();
});

window.addEventListener('resize', resize);

function onThemeChange() { draw(); }
function onLangChange() { btnSize.textContent = t('maze.size_' + SIZES[sizeIdx].label.toLowerCase()); }

initMaze();
