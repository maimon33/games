const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');
const speedSelect = document.getElementById('speed-select');

const COLS = 13;
const ROWS = 14;
const HOME_COLS = [1.5, 4, 6.5, 9, 11.5];

let cell;
let score = 0;
let lives = 3;
let level = 1;
let player;
let roads = [];
let rivers = [];
let homes = [];
let lastTime = 0;
let animId = 0;
let running = false;
let touchStart = null;

function speedFactor() {
  return Number(speedSelect.value || 1);
}

function resize() {
  const width = Math.min(window.innerWidth - 32, 700);
  canvas.width = width;
  canvas.height = Math.round(width * 0.94);
  cell = canvas.width / COLS;
  draw();
}

function laneY(row) {
  return row * cell;
}

function makeLane(row, speed, widths, gap, color) {
  const items = [];
  let x = 0;
  while (x < canvas.width + gap) {
    const w = widths[Math.floor(Math.random() * widths.length)] * cell;
    items.push({ x, w, row, speed, color });
    x += w + gap * cell;
  }
  return items;
}

function buildWorld() {
  const scale = speedFactor() * (1 + (level - 1) * 0.14);
  roads = [
    ...makeLane(11, -110 * scale, [1.4, 1.8], 1.4, '#f97316'),
    ...makeLane(10, 150 * scale, [1.2, 1.6], 1.1, '#38bdf8'),
    ...makeLane(9, -180 * scale, [1.6, 2.1], 1.6, '#f43f5e'),
    ...makeLane(8, 130 * scale, [1.3, 1.7], 1.2, '#facc15'),
  ];
  rivers = [
    ...makeLane(5, 95 * scale, [2.6, 3], 1.8, '#8b5a2b'),
    ...makeLane(4, -120 * scale, [2.4, 2.8], 1.5, '#7c4a1d'),
    ...makeLane(3, 135 * scale, [2.2, 2.7], 1.7, '#9a6732'),
  ];
  homes = HOME_COLS.map(x => ({ x: x * cell, filled: false }));
}

function resetPlayer() {
  player = {
    x: HOME_COLS[2] * cell,
    row: 13,
    size: cell * 0.36,
  };
}

function newGame() {
  score = 0;
  lives = 3;
  level = 1;
  buildWorld();
  resetPlayer();
  statusEl.textContent = 'Cross safely.';
  running = true;
  updateUI();
  lastTime = 0;
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function updateUI() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

function wrapItem(item) {
  if (item.speed > 0 && item.x - item.w / 2 > canvas.width + cell) item.x = -item.w - cell;
  if (item.speed < 0 && item.x + item.w / 2 < -cell) item.x = canvas.width + item.w + cell;
}

function loseLife(message) {
  if (!running) return;
  lives--;
  updateUI();
  if (lives <= 0) {
    running = false;
    statusEl.textContent = `Game over. Score: ${score}`;
    return;
  }
  statusEl.textContent = message;
  resetPlayer();
}

function finishHome() {
  const home = homes.find(slot => !slot.filled && Math.abs(slot.x - player.x) < cell * 0.65);
  if (!home) {
    loseLife('That home is blocked.');
    return;
  }
  home.filled = true;
  score += 50;
  updateUI();
  resetPlayer();
  if (homes.every(slot => slot.filled)) {
    level++;
    score += 200;
    buildWorld();
    resetPlayer();
    updateUI();
    statusEl.textContent = `Level ${level}`;
  } else {
    statusEl.textContent = 'Home reached.';
  }
}

function move(dx, dy) {
  if (!running) return;
  player.x = Math.max(cell * 0.6, Math.min(canvas.width - cell * 0.6, player.x + dx * cell));
  player.row = Math.max(0, Math.min(13, player.row + dy));
  if (dy < 0) score += 10;
  updateUI();
  if (player.row === 0) finishHome();
}

function intersects(item) {
  const px = player.x;
  const py = laneY(player.row) + cell / 2;
  return Math.abs(item.x + item.w / 2 - px) < item.w / 2 + player.size * 0.75 &&
    Math.abs(laneY(item.row) + cell / 2 - py) < cell * 0.38 + player.size;
}

function update(dt) {
  for (const item of roads) {
    item.x += item.speed * dt;
    wrapItem(item);
    if (item.row === player.row && intersects(item)) {
      loseLife('Traffic got you.');
      return;
    }
  }

  let riding = null;
  for (const log of rivers) {
    log.x += log.speed * dt;
    wrapItem(log);
    if (log.row === player.row && intersects(log)) riding = log;
  }

  if (player.row >= 3 && player.row <= 5) {
    if (!riding) {
      loseLife('Splash.');
      return;
    }
    player.x += riding.speed * dt;
    if (player.x < cell * 0.4 || player.x > canvas.width - cell * 0.4) {
      loseLife('You drifted away.');
    }
  }
}

function drawBackground() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = light ? '#d9f99d' : '#16311e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = light ? '#166534' : '#14532d';
  ctx.fillRect(0, laneY(0), canvas.width, cell);
  ctx.fillRect(0, laneY(6), canvas.width, cell * 2);
  ctx.fillRect(0, laneY(12), canvas.width, cell * 2);

  ctx.fillStyle = light ? '#60a5fa' : '#1d4ed8';
  ctx.fillRect(0, laneY(3), canvas.width, cell * 3);

  ctx.fillStyle = light ? '#334155' : '#0f172a';
  ctx.fillRect(0, laneY(8), canvas.width, cell * 4);

  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvas.height);
    ctx.stroke();
  }
}

function drawHomes() {
  for (const slot of homes) {
    ctx.fillStyle = slot.filled ? '#22c55e' : 'rgba(15,23,42,0.25)';
    ctx.beginPath();
    ctx.roundRect(slot.x - cell * 0.6, cell * 0.14, cell * 1.2, cell * 0.7, 12);
    ctx.fill();
  }
}

function drawItems(items, rounded) {
  for (const item of items) {
    const y = laneY(item.row) + cell * 0.18;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(item.x, y, item.w, cell * 0.64, rounded);
    ctx.fill();
  }
}

function drawPlayer() {
  const px = player.x;
  const py = laneY(player.row) + cell / 2;
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(px, py, player.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#052e16';
  ctx.beginPath();
  ctx.arc(px - player.size * 0.35, py - player.size * 0.25, player.size * 0.12, 0, Math.PI * 2);
  ctx.arc(px + player.size * 0.35, py - player.size * 0.25, player.size * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawBackground();
  drawHomes();
  drawItems(rivers, 10);
  drawItems(roads, 8);
  if (player) drawPlayer();
}

function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.032, (ts - lastTime) / 1000);
  lastTime = ts;
  if (running) update(dt);
  draw();
  if (running) animId = requestAnimationFrame(loop);
}

function handleKey(e) {
  if (e.key === 'ArrowLeft') move(-1, 0);
  if (e.key === 'ArrowRight') move(1, 0);
  if (e.key === 'ArrowUp') move(0, -1);
  if (e.key === 'ArrowDown') move(0, 1);
}

canvas.addEventListener('touchstart', e => {
  touchStart = e.touches[0] ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (!touchStart || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 18) move(dx > 0 ? 1 : -1, 0);
  else if (Math.abs(dy) > 18) move(0, dy > 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });

document.addEventListener('keydown', handleKey);
document.getElementById('btn-new').addEventListener('click', newGame);
speedSelect.addEventListener('change', () => {
  const currentLevel = level;
  buildWorld();
  level = currentLevel;
  updateUI();
  statusEl.textContent = `Speed: ${speedSelect.options[speedSelect.selectedIndex].text}`;
  draw();
});
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }

resize();
newGame();
