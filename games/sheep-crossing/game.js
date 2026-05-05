const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');

const COLS = 9;
const ROWS = 12;

let cell;
let player;
let lanes = [];
let score = 0;
let lives = 3;
let level = 1;
let running = false;
let animId = 0;
let lastTime = 0;
let touchStart = null;

function resize() {
  const width = Math.min(window.innerWidth - 32, 520);
  canvas.width = width;
  canvas.height = Math.round(width * 1.22);
  cell = canvas.width / COLS;
  draw();
}

function makeLane(row, speed, palette) {
  const vehicles = [];
  let x = row % 2 === 0 ? -cell : 0;
  while (x < canvas.width + cell * 2) {
    const w = (1.2 + Math.random() * 0.9) * cell;
    vehicles.push({ x, row, w, speed, color: palette[Math.floor(Math.random() * palette.length)] });
    x += w + cell * (0.85 + Math.random() * 0.8);
  }
  return vehicles;
}

function buildLanes() {
  const scale = 1 + (level - 1) * 0.12;
  lanes = [
    ...makeLane(9, -130 * scale, ['#f97316', '#ef4444']),
    ...makeLane(8, 105 * scale, ['#facc15', '#38bdf8']),
    ...makeLane(7, -145 * scale, ['#fb7185', '#f59e0b']),
    ...makeLane(6, 120 * scale, ['#60a5fa', '#34d399']),
    ...makeLane(5, -165 * scale, ['#f97316', '#f43f5e']),
    ...makeLane(4, 135 * scale, ['#84cc16', '#eab308']),
    ...makeLane(3, -155 * scale, ['#22c55e', '#0ea5e9']),
  ];
}

function resetPlayer() {
  player = {
    col: Math.floor(COLS / 2),
    row: ROWS - 1,
    size: cell * 0.33,
  };
}

function updateUI() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

function newGame() {
  score = 0;
  lives = 3;
  level = 1;
  buildLanes();
  resetPlayer();
  statusEl.textContent = 'Guide the flock leader home.';
  updateUI();
  running = true;
  lastTime = 0;
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
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

function winCrossing() {
  score += 100;
  level++;
  updateUI();
  buildLanes();
  resetPlayer();
  statusEl.textContent = `Barn reached. Level ${level}`;
}

function move(dx, dy) {
  if (!running) return;
  player.col = Math.max(0, Math.min(COLS - 1, player.col + dx));
  player.row = Math.max(0, Math.min(ROWS - 1, player.row + dy));
  if (player.row === 0) winCrossing();
}

function wrapVehicle(v) {
  if (v.speed > 0 && v.x > canvas.width + cell * 1.5) v.x = -v.w - cell;
  if (v.speed < 0 && v.x + v.w < -cell * 1.5) v.x = canvas.width + cell;
}

function update(dt) {
  const px = player.col * cell + cell / 2;
  const py = player.row * cell + cell / 2;
  for (const v of lanes) {
    v.x += v.speed * dt;
    wrapVehicle(v);
    const vy = v.row * cell + cell * 0.15;
    if (player.row === v.row &&
      Math.abs(v.x + v.w / 2 - px) < v.w / 2 + player.size * 0.9 &&
      Math.abs(vy + cell * 0.35 - py) < cell * 0.32 + player.size) {
      loseLife('A tractor clipped the sheep.');
      return;
    }
  }
}

function drawBackground() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = light ? '#dcfce7' : '#16331f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < ROWS; row++) {
    if (row >= 3 && row <= 9) {
      ctx.fillStyle = light ? '#64748b' : '#1e293b';
      ctx.fillRect(0, row * cell, canvas.width, cell);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([14, 12]);
      ctx.beginPath();
      ctx.moveTo(0, row * cell + cell / 2);
      ctx.lineTo(canvas.width, row * cell + cell / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = row === 0 ? (light ? '#86efac' : '#166534') : (light ? '#bbf7d0' : '#14532d');
      ctx.fillRect(0, row * cell, canvas.width, cell);
    }
  }
}

function drawBarn() {
  const y = cell * 0.16;
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, y);
  ctx.lineTo(canvas.width / 2 + cell * 0.9, y + cell * 0.5);
  ctx.lineTo(canvas.width / 2 + cell * 0.9, y + cell * 1.15);
  ctx.lineTo(canvas.width / 2 - cell * 0.9, y + cell * 1.15);
  ctx.lineTo(canvas.width / 2 - cell * 0.9, y + cell * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fecaca';
  ctx.fillRect(canvas.width / 2 - cell * 0.28, y + cell * 0.62, cell * 0.56, cell * 0.53);
}

function drawVehicles() {
  for (const v of lanes) {
    const y = v.row * cell + cell * 0.18;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.roundRect(v.x, y, v.w, cell * 0.58, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(v.x + cell * 0.14, y + cell * 0.12, Math.min(cell * 0.55, v.w * 0.34), cell * 0.18);
  }
}

function drawPlayer() {
  const x = player.col * cell + cell / 2;
  const y = player.row * cell + cell / 2;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(x, y, player.size * 1.08, player.size * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x - player.size * 0.28, y - player.size * 0.12, player.size * 0.08, 0, Math.PI * 2);
  ctx.arc(x + player.size * 0.28, y - player.size * 0.12, player.size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - player.size * 0.25, y - player.size * 0.7);
  ctx.lineTo(x - player.size * 0.45, y - player.size * 1.05);
  ctx.moveTo(x + player.size * 0.25, y - player.size * 0.7);
  ctx.lineTo(x + player.size * 0.45, y - player.size * 1.05);
  ctx.stroke();
}

function draw() {
  drawBackground();
  drawBarn();
  drawVehicles();
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
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }

resize();
newGame();
