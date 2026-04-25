const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const btnStart = document.getElementById('btn-start');

const GRID = 3, HOLES = 9;
let CELL, score, timeLeft, moles, moleTimes, gameRunning, gameInterval, spawnInterval;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize() {
  const size = Math.min(window.innerWidth - 32, 360);
  canvas.width = canvas.height = size;
  CELL = size / GRID;
  draw();
}

function draw() {
  const W = canvas.width;
  ctx.clearRect(0, 0, W, W);
  ctx.fillStyle = cv('--surface');
  ctx.beginPath(); ctx.roundRect(0, 0, W, W, 8); ctx.fill();

  for (let i = 0; i < HOLES; i++) {
    const r = Math.floor(i / GRID), c = i % GRID;
    const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
    const holeR = CELL * 0.3;

    // Hole shadow
    ctx.fillStyle = cv('--bg');
    ctx.beginPath(); ctx.ellipse(cx, cy + holeR * 0.1, holeR, holeR * 0.5, 0, 0, Math.PI * 2); ctx.fill();

    if (moles[i]) {
      // Mole body
      ctx.fillStyle = '#8B5E3C';
      ctx.beginPath(); ctx.arc(cx, cy - holeR * 0.3, holeR * 0.75, 0, Math.PI * 2); ctx.fill();
      // Mole face
      ctx.fillStyle = '#C49070';
      ctx.beginPath(); ctx.ellipse(cx, cy - holeR * 0.15, holeR * 0.48, holeR * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(cx - holeR * 0.2, cy - holeR * 0.3, holeR * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + holeR * 0.2, cy - holeR * 0.3, holeR * 0.1, 0, Math.PI * 2); ctx.fill();
      // Nose
      ctx.fillStyle = '#e05252';
      ctx.beginPath(); ctx.arc(cx, cy - holeR * 0.12, holeR * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function spawnMole() {
  if (!gameRunning) return;
  const inactive = moles.map((m, i) => !m ? i : -1).filter(i => i >= 0);
  if (inactive.length === 0) return;
  const idx = inactive[Math.floor(Math.random() * inactive.length)];
  moles[idx] = true;
  draw();
  const duration = Math.max(400, 900 - score * 18);
  moleTimes[idx] = setTimeout(() => { moles[idx] = false; draw(); }, duration);
}

function hitMole(idx) {
  if (!moles[idx] || !gameRunning) return;
  clearTimeout(moleTimes[idx]);
  moles[idx] = false;
  score++;
  scoreEl.textContent = score;
  draw();
  resetSpawn();
}

function resetSpawn() {
  clearInterval(spawnInterval);
  const rate = Math.max(350, 750 - score * 20);
  spawnInterval = setInterval(spawnMole, rate);
}

function startGame() {
  score = 0;
  timeLeft = 30;
  moles = new Array(HOLES).fill(false);
  moleTimes = new Array(HOLES).fill(null);
  gameRunning = true;
  scoreEl.textContent = 0;
  timerEl.textContent = 30;
  statusEl.textContent = '';
  statusEl.className = '';
  btnStart.textContent = t('btn.restart');
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  draw();
  resetSpawn();
  gameInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      gameRunning = false;
      clearInterval(gameInterval);
      clearInterval(spawnInterval);
      moles.fill(false);
      draw();
      statusEl.textContent = t('status.time_up_score', { n: score });
      statusEl.className = 'win';
      if (score >= 10) launchConfetti();
    }
  }, 1000);
}

function cellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  const x = (src.clientX - rect.left) * scaleX;
  const y = (src.clientY - rect.top) * scaleY;
  return Math.floor(y / CELL) * GRID + Math.floor(x / CELL);
}

canvas.addEventListener('click', e => { hitMole(cellFromEvent(e)); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); hitMole(cellFromEvent(e)); }, { passive: false });

btnStart.addEventListener('click', startGame);

function onThemeChange() { draw(); }

window.addEventListener('resize', resize);
resize();
moles = new Array(HOLES).fill(false);
moleTimes = new Array(HOLES).fill(null);
draw();
