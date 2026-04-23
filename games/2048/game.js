const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const scoreEl  = document.getElementById('score');
const bestEl   = document.getElementById('best');
const statusEl = document.getElementById('status');
const btnNew   = document.getElementById('btn-new');

const SIZE = 4;
const GAP  = 10;
let board, score, best, won, over;

function cv(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function boardSize() {
  return Math.min(window.innerWidth - 32, 400);
}

function tileSize() {
  return Math.floor((boardSize() - GAP * (SIZE + 1)) / SIZE);
}

const TILE_COLORS = {
  0:    null,
  2:    ['#eee4da', '#776e65'],
  4:    ['#ede0c8', '#776e65'],
  8:    ['#f2b179', '#f9f6f2'],
  16:   ['#f59563', '#f9f6f2'],
  32:   ['#f67c5f', '#f9f6f2'],
  64:   ['#f65e3b', '#f9f6f2'],
  128:  ['#edcf72', '#f9f6f2'],
  256:  ['#edcc61', '#f9f6f2'],
  512:  ['#edc850', '#f9f6f2'],
  1024: ['#edc53f', '#f9f6f2'],
  2048: ['#edc22e', '#f9f6f2'],
};

function tileColor(v) {
  return TILE_COLORS[v] || ['#3c3a32', '#f9f6f2'];
}

function initGame() {
  board = new Array(SIZE * SIZE).fill(0);
  score = 0;
  won = over = false;
  statusEl.textContent = '';
  statusEl.className = '';
  best = parseInt(localStorage.getItem('2048-best') || '0');
  addTile(); addTile();
  resize();
}

function addTile() {
  const empty = board.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
  if (!empty.length) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = Math.random() < 0.9 ? 2 : 4;
}

function resize() {
  const bs = boardSize();
  canvas.width = canvas.height = bs;
  draw();
}

function draw() {
  const bs = boardSize();
  const ts = tileSize();

  ctx.fillStyle = cv('--border');
  ctx.beginPath();
  ctx.roundRect(0, 0, bs, bs, 8);
  ctx.fill();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r * SIZE + c];
      const x = GAP + c * (ts + GAP);
      const y = GAP + r * (ts + GAP);

      const [bg, fg] = v ? tileColor(v) : [cv('--surface'), ''];

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x, y, ts, ts, 6);
      ctx.fill();

      if (v) {
        const fontSize = v >= 1024 ? ts * 0.35 : v >= 128 ? ts * 0.42 : ts * 0.5;
        ctx.fillStyle = fg;
        ctx.font = `bold ${fontSize}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(v, x + ts / 2, y + ts / 2);
      }
    }
  }
}

function slide(row) {
  let tiles = row.filter(v => v !== 0);
  let merged = 0;
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] === tiles[i + 1]) {
      tiles[i] *= 2;
      merged += tiles[i];
      tiles.splice(i + 1, 1);
    }
  }
  while (tiles.length < SIZE) tiles.push(0);
  return { tiles, merged };
}

function move(dir) {
  if (over) return;
  const prev = [...board];
  let gained = 0;

  for (let i = 0; i < SIZE; i++) {
    let row;
    if (dir === 'left')  row = board.slice(i * SIZE, i * SIZE + SIZE);
    if (dir === 'right') row = board.slice(i * SIZE, i * SIZE + SIZE).reverse();
    if (dir === 'up')    row = [0,1,2,3].map(j => board[j * SIZE + i]);
    if (dir === 'down')  row = [3,2,1,0].map(j => board[j * SIZE + i]);

    const { tiles, merged } = slide(row);
    gained += merged;

    if (dir === 'right') tiles.reverse();

    for (let j = 0; j < SIZE; j++) {
      if (dir === 'left' || dir === 'right') board[i * SIZE + j] = tiles[j];
      if (dir === 'up')   board[j * SIZE + i] = tiles[j];
      if (dir === 'down') board[(SIZE - 1 - j) * SIZE + i] = tiles[j];
    }
  }

  const changed = board.some((v, i) => v !== prev[i]);
  if (!changed) return;

  score += gained;
  if (score > best) {
    best = score;
    localStorage.setItem('2048-best', best);
  }
  scoreEl.textContent = score;
  bestEl.textContent  = best;

  addTile();

  if (!won && board.includes(2048)) {
    won = true;
    statusEl.textContent = 'You reached 2048!';
    statusEl.className = 'win';
  }

  if (!canMove()) {
    over = true;
    statusEl.textContent = 'No moves left.';
    statusEl.className = 'lose';
  }

  draw();
}

function canMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r * SIZE + c];
      if (v === 0) return true;
      if (c < SIZE - 1 && v === board[r * SIZE + c + 1]) return true;
      if (r < SIZE - 1 && v === board[(r + 1) * SIZE + c]) return true;
    }
  }
  return false;
}

document.addEventListener('keydown', e => {
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
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
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
}, { passive: true });

btnNew.addEventListener('click', initGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }

initGame();
