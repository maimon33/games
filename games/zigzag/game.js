const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

const W = 320, H = 480;
const TILE_W = 46, TILE_H = 32, BALL_R = 10;
const COLS = 7;
const X_OFFSET = (W - COLS * TILE_W) / 2; // = (320 - 322) / 2 = -1, visually centered
const BALL_SPEED = 2.5;
const TRACK_LEN = 200;

let track, tileIdx, ballX, ballY, progress, dir, score, state, cameraY, deadVY, deadGravity, rafId;

function generateTrack() {
  track = [3]; // start tile at col 3
  let col = 3, segDir = 1;
  while (track.length < TRACK_LEN) {
    const segLen = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < segLen && track.length < TRACK_LEN; i++) {
      const next = col + segDir;
      if (next < 1 || next > 5) { segDir = -segDir; break; }
      col = next;
      track.push(col);
    }
    segDir = -segDir;
  }
}

function tileCenterX(col) { return X_OFFSET + col * TILE_W + TILE_W / 2; }
function tileCenterY(idx) { return idx * TILE_H + TILE_H / 2; }

function startGame() {
  if (rafId) cancelAnimationFrame(rafId);
  generateTrack();
  tileIdx = 0;
  progress = 0;
  ballX = tileCenterX(track[0]);
  ballY = tileCenterY(0);
  dir = 1;
  score = 0;
  cameraY = 0;
  deadVY = 0;
  deadGravity = 0;
  state = 'playing';
  scoreEl.textContent = '0';
  statusEl.textContent = '';
  statusEl.className = '';
  rafId = requestAnimationFrame(loop);
}

function handleTap() {
  if (state === 'idle' || state === 'dead') { startGame(); return; }
  if (state === 'playing') dir = -dir;
}

function nextTileIdx() {
  const nextCol = track[tileIdx] + dir;
  // find next tile index that matches the expected column
  const ni = tileIdx + 1;
  if (ni >= track.length) return -1;
  if (track[ni] === nextCol) return ni;
  return -1;
}

function update() {
  if (state !== 'playing') return;

  let ni = nextTileIdx();

  if (ni === -1) {
    triggerDeath();
    return;
  }

  progress += BALL_SPEED / TILE_H;

  if (progress >= 1) {
    progress -= 1;
    tileIdx = ni;
    score++;
    scoreEl.textContent = score;

    ni = nextTileIdx();
    if (ni === -1) {
      ballX = tileCenterX(track[tileIdx]);
      ballY = tileCenterY(tileIdx);
      triggerDeath();
      return;
    }
  }

  const fromX = tileCenterX(track[tileIdx]);
  const toX = tileCenterX(track[ni]);
  const fromY = tileCenterY(tileIdx);
  const toY = tileCenterY(ni);
  ballX = fromX + (toX - fromX) * progress;
  ballY = fromY + (toY - fromY) * progress;

  cameraY = ballY - H * 0.33;
  if (cameraY < 0) cameraY = 0;
}

function triggerDeath() {
  state = 'dying';
  deadVY = -4;
  deadGravity = 0.4;
}

function updateDying() {
  deadVY += deadGravity;
  ballY += deadVY;
  ballX += dir * 1.5;
  cameraY = ballY - H * 0.33;

  if (deadVY > 12) {
    state = 'dead';
    statusEl.textContent = t('status.zigzag_over', { n: score });
    statusEl.className = 'lose';
  }
}

function drawTile(col, row, isCurrent) {
  const x = X_OFFSET + col * TILE_W;
  const y = row * TILE_H - cameraY;

  if (y + TILE_H < 0 || y > H) return;

  const accent = cv('--accent');
  const surface = cv('--surface');

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, TILE_W - 4, TILE_H - 4, 6);

  if (isCurrent) {
    ctx.fillStyle = accent;
  } else {
    // blend: surface with a tint of accent
    ctx.fillStyle = surface;
  }
  ctx.fill();

  if (!isCurrent) {
    ctx.strokeStyle = accent + '66';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  const bg = cv('--bg');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (state === 'idle') {
    drawIdleScreen();
    return;
  }

  // draw visible tiles
  const firstRow = Math.max(0, Math.floor(cameraY / TILE_H) - 1);
  const lastRow = Math.min(track.length - 1, firstRow + Math.ceil(H / TILE_H) + 2);

  for (let i = firstRow; i <= lastRow; i++) {
    drawTile(track[i], i, i === tileIdx);
  }

  // draw ball
  const accent = cv('--accent');
  const text = cv('--text');
  const screenY = ballY - cameraY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(ballX, screenY, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.strokeStyle = text;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  if (state === 'dead') {
    drawDeadOverlay();
  }
}

function drawIdleScreen() {
  const muted = cv('--muted');
  const text = cv('--text');

  // draw a few static tiles as decoration
  for (let i = 0; i < 8; i++) {
    const col = 1 + (i % 5);
    drawTile(col, i + 2, i === 0);
  }

  ctx.save();
  ctx.fillStyle = text;
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ZigZag', W / 2, H / 2 - 24);
  ctx.fillStyle = muted;
  ctx.font = '15px system-ui';
  ctx.fillText('Tap to start', W / 2, H / 2 + 14);
  ctx.restore();
}

function drawDeadOverlay() {
  const text = cv('--text');
  const surface = cv('--surface');

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = surface;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 110, H / 2 - 44, 220, 88, 14);
  ctx.fill();
  ctx.fillStyle = '#e05252';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', W / 2, H / 2 - 18);
  ctx.fillStyle = text;
  ctx.font = '14px system-ui';
  ctx.fillText('Score: ' + score + '  —  Tap to restart', W / 2, H / 2 + 14);
  ctx.restore();
}

function loop() {
  if (state === 'playing') update();
  else if (state === 'dying') updateDying();
  draw();
  if (state !== 'dead') {
    rafId = requestAnimationFrame(loop);
  }
}

// input
canvas.addEventListener('click', handleTap);
canvas.addEventListener('touchstart', e => { e.preventDefault(); handleTap(); }, { passive: false });
document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') handleTap(); });

function onThemeChange() { draw(); }
function onLangChange() {}

// initial idle draw
state = 'idle';
cameraY = 0;
draw();
