const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');

const COLS = 26;
const ROWS = 18;
const WATER = 0;
const LAND = 1;
const TRAIL = 2;
const WIN_TARGET = 75;

let CELL;
let grid;
let player;
let dir;
let nextDir;
let enemies;
let lives;
let level;
let dead;
let captured;
let stepAcc = 0;
let lastTs = 0;
let animId;
let touchStart = null;

function resize() {
  const w = Math.min(window.innerWidth - 32, 620);
  CELL = Math.floor(Math.min(w / COLS, (window.innerHeight * 0.56) / ROWS));
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  draw();
}

function createGrid() {
  const next = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 ? LAND : WATER
    )
  );
  return next;
}

function spawnEnemies(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: 5 + i * 4,
      y: 4 + (i % 2) * 5,
      vx: i % 2 === 0 ? 0.12 : -0.12,
      vy: i % 2 === 0 ? 0.11 : -0.11,
    });
  }
  return list;
}

function resetPlayer() {
  clearTrail();
  player = { x: 1, y: 1, drawing: false };
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
}

function clearTrail() {
  if (!grid) return;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === TRAIL) grid[r][c] = WATER;
    }
  }
}

function newGame() {
  level = 1;
  lives = 3;
  dead = false;
  setupLevel();
}

function setupLevel() {
  grid = createGrid();
  enemies = spawnEnemies(Math.min(5, 2 + level));
  resetPlayer();
  captured = capturedPercent();
  updateUI();
  statusEl.textContent = `Reach ${WIN_TARGET}% to clear the level.`;
  cancelAnimationFrame(animId);
  stepAcc = 0;
  lastTs = 0;
  animId = requestAnimationFrame(loop);
}

function updateUI() {
  scoreEl.textContent = `${captured}%`;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

function capturedPercent() {
  let land = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) if (grid[r][c] === LAND) land++;
  }
  return Math.round((land / (ROWS * COLS)) * 100);
}

function tryMovePlayer() {
  if (dead) return;
  if (nextDir.x === -dir.x && nextDir.y === -dir.y) nextDir = dir;
  dir = nextDir;
  const nx = player.x + dir.x;
  const ny = player.y + dir.y;
  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
  const nextCell = grid[ny][nx];

  if (nextCell === TRAIL) {
    loseLife('You crossed your own trail.');
    return;
  }

  if (nextCell === WATER) {
    player.drawing = true;
    grid[ny][nx] = TRAIL;
  } else if (nextCell === LAND && player.drawing) {
    player.x = nx;
    player.y = ny;
    sealArea();
    player.drawing = false;
    captured = capturedPercent();
    updateUI();
    if (captured >= WIN_TARGET) {
      level++;
      statusEl.textContent = `Level cleared at ${captured}%!`;
      setupLevel();
      return;
    }
  }

  player.x = nx;
  player.y = ny;
}

function sealArea() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === TRAIL) grid[r][c] = LAND;
    }
  }

  const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const queue = [];
  enemies.forEach(enemy => {
    const c = Math.max(0, Math.min(COLS - 1, Math.floor(enemy.x)));
    const r = Math.max(0, Math.min(ROWS - 1, Math.floor(enemy.y)));
    if (grid[r][c] !== LAND && !seen[r][c]) {
      seen[r][c] = true;
      queue.push([r, c]);
    }
  });

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
      if (seen[nr][nc] || grid[nr][nc] === LAND) continue;
      seen[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }

  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (grid[r][c] === WATER && !seen[r][c]) grid[r][c] = LAND;
    }
  }
}

function moveEnemies() {
  for (const enemy of enemies) {
    let nextX = enemy.x + enemy.vx;
    let nextY = enemy.y + enemy.vy;
    const cellX = Math.floor(nextX);
    const cellY = Math.floor(enemy.y);
    const cellX2 = Math.floor(enemy.x);
    const cellY2 = Math.floor(nextY);

    if (grid[cellY]?.[cellX] === TRAIL || grid[cellY2]?.[cellX2] === TRAIL) {
      loseLife('An enemy hit your trail.');
      return;
    }

    if (cellX < 0 || cellX >= COLS || grid[cellY][cellX] !== WATER) {
      enemy.vx *= -1;
      nextX = enemy.x + enemy.vx;
    }
    if (cellY2 < 0 || cellY2 >= ROWS || grid[cellY2][cellX2] !== WATER) {
      enemy.vy *= -1;
      nextY = enemy.y + enemy.vy;
    }

    enemy.x = nextX;
    enemy.y = nextY;

    const er = Math.floor(enemy.y);
    const ec = Math.floor(enemy.x);
    if (Math.floor(player.x) === ec && Math.floor(player.y) === er && player.drawing) {
      loseLife('An enemy caught you in the field.');
      return;
    }
  }
}

function loseLife(message) {
  lives--;
  updateUI();
  if (lives <= 0) {
    dead = true;
    cancelAnimationFrame(animId);
    statusEl.textContent = `${message} Game over.`;
    return;
  }
  statusEl.textContent = `${message} ${lives} lives left.`;
  resetPlayer();
}

function loop(ts) {
  if (!lastTs) lastTs = ts;
  const delta = ts - lastTs;
  lastTs = ts;
  stepAcc += delta;

  while (stepAcc >= 95) {
    stepAcc -= 95;
    tryMovePlayer();
    moveEnemies();
  }

  draw();
  if (!dead) animId = requestAnimationFrame(loop);
}

function draw() {
  if (!grid) return;
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = light ? '#f8fafc' : '#081220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      ctx.fillStyle = cell === LAND ? (light ? '#d7dee8' : '#263244') :
        cell === TRAIL ? '#f59e0b' :
        (light ? '#d9f1ff' : '#0f3552');
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
    }
  }

  ctx.strokeStyle = light ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
  }

  for (const enemy of enemies || []) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc((enemy.x + 0.5) * CELL, (enemy.y + 0.5) * CELL, CELL * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = player?.drawing ? '#fbbf24' : '#22c55e';
  if (player) {
    ctx.fillRect(player.x * CELL + CELL * 0.18, player.y * CELL + CELL * 0.18, CELL * 0.64, CELL * 0.64);
  }
}

document.addEventListener('keydown', e => {
  const map = {
    ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
  };
  if (!map[e.key]) return;
  nextDir = map[e.key];
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (dead) newGame();
});

canvas.addEventListener('touchstart', e => {
  touchStart = e.touches[0];
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
  nextDir = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 })
    : (dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
}, { passive: true });

document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }

resize();
newGame();
