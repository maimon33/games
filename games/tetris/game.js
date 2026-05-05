const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');

const COLS = 10;
const ROWS = 20;
const COLORS = {
  I: '#22d3ee',
  O: '#facc15',
  T: '#c084fc',
  S: '#4ade80',
  Z: '#fb7185',
  J: '#60a5fa',
  L: '#fb923c',
};
const PIECES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

let board;
let current;
let nextTick = 0;
let lastTime = 0;
let dropMs = 900;
let score = 0;
let lines = 0;
let level = 1;
let running = false;
let animId = 0;
let cell = 32;

function resize() {
  const width = Math.min(window.innerWidth - 32, 360);
  canvas.width = width;
  canvas.height = Math.round(width * 2);
  cell = canvas.width / COLS;
  draw();
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(''));
}

function rotate(shape) {
  return shape[0].map((_, col) => shape.map(row => row[col]).reverse());
}

function randPiece() {
  const keys = Object.keys(PIECES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return { type, shape: PIECES[type].map(row => [...row]), x: 3, y: -1 };
}

function newGame() {
  board = emptyBoard();
  current = randPiece();
  score = 0;
  lines = 0;
  level = 1;
  dropMs = 900;
  statusEl.textContent = 'Stack clean lines.';
  running = true;
  updateUI();
  lastTime = 0;
  nextTick = 0;
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function updateUI() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function collides(piece, dx = 0, dy = 0, shape = piece.shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const nx = piece.x + x + dx;
      const ny = piece.y + y + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function merge() {
  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (!current.shape[y][x]) continue;
      const by = current.y + y;
      if (by < 0) {
        gameOver();
        return;
      }
      board[by][current.x + x] = current.type;
    }
  }
  clearLines();
  current = randPiece();
  if (collides(current)) gameOver();
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(''));
      cleared++;
      y++;
    }
  }
  if (!cleared) return;
  lines += cleared;
  score += [0, 100, 300, 500, 800][cleared] * level;
  level = Math.floor(lines / 8) + 1;
  dropMs = Math.max(140, 900 - (level - 1) * 70);
  updateUI();
  statusEl.textContent = cleared > 1 ? `${cleared} lines!` : 'Line clear!';
}

function gameOver() {
  running = false;
  statusEl.textContent = `Game over. Score: ${score}`;
}

function softDrop() {
  if (!running) return;
  if (!collides(current, 0, 1)) current.y++;
  else merge();
}

function hardDrop() {
  if (!running) return;
  while (!collides(current, 0, 1)) current.y++;
  merge();
}

function move(dx) {
  if (!running) return;
  if (!collides(current, dx, 0)) current.x += dx;
}

function turn() {
  if (!running) return;
  const rotated = rotate(current.shape);
  if (!collides(current, 0, 0, rotated)) current.shape = rotated;
  else if (!collides(current, -1, 0, rotated)) {
    current.x--;
    current.shape = rotated;
  } else if (!collides(current, 1, 0, rotated)) {
    current.x++;
    current.shape = rotated;
  }
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
}

function draw() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = light ? '#e2e8f0' : '#08111f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = board[y][x];
      ctx.fillStyle = type ? COLORS[type] : (light ? '#cbd5e1' : '#122235');
      ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
    }
  }

  if (!current) return;
  for (let y = 0; y < current.shape.length; y++) {
    for (let x = 0; x < current.shape[y].length; x++) {
      if (!current.shape[y][x]) continue;
      const py = current.y + y;
      if (py >= 0) drawCell(current.x + x, py, COLORS[current.type]);
    }
  }
}

function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = ts - lastTime;
  lastTime = ts;
  nextTick += dt;
  if (running && nextTick >= dropMs) {
    nextTick = 0;
    softDrop();
  }
  draw();
  if (running) animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
  if (e.key === 'ArrowDown') softDrop();
  if (e.key === 'ArrowUp') turn();
  if (e.key === ' ') {
    e.preventDefault();
    hardDrop();
  }
});

document.getElementById('btn-left').addEventListener('click', () => move(-1));
document.getElementById('btn-right').addEventListener('click', () => move(1));
document.getElementById('btn-down').addEventListener('click', softDrop);
document.getElementById('btn-rotate').addEventListener('click', turn);
document.getElementById('btn-drop').addEventListener('click', hardDrop);
document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }

resize();
newGame();
