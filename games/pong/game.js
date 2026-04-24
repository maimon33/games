const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const btnStart = document.getElementById('btn-start');
const btnDiff = document.getElementById('btn-diff');

const WIN_SCORE = 7;
const DIFFS = ['Easy', 'Medium', 'Hard'];
const AI_SPEED = [2, 4, 7]; // max px/frame the AI paddle moves
let diffIdx = 1;

let W, H, PADDLE_W, PADDLE_H, BALL_R;
let ball, playerPaddle, aiPaddle, scoreP, scoreAI;
let running = false, rafId = null;
let mouseY = null, touchY = null;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize() {
  const w = Math.min(window.innerWidth - 32, 480);
  const h = Math.round(w * 0.6);
  canvas.width = W = w;
  canvas.height = H = h;
  PADDLE_W = Math.round(W * 0.025);
  PADDLE_H = Math.round(H * 0.22);
  BALL_R = Math.round(W * 0.018);
  if (!running) drawIdle();
}

function resetBall(dir) {
  const speed = W * 0.007;
  const angle = (Math.random() * 0.6 - 0.3);
  ball = {
    x: W / 2, y: H / 2,
    vx: Math.cos(angle) * speed * dir,
    vy: Math.sin(angle) * speed,
  };
}

function initGame() {
  scoreP = 0; scoreAI = 0;
  playerPaddle = {x: PADDLE_W * 2, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H};
  aiPaddle = {x: W - PADDLE_W * 3, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H};
  resetBall(1);
  statusEl.textContent = '';
  statusEl.className = '';
}

function drawIdle() {
  const surface = cv('--surface'), border = cv('--border'), muted = cv('--muted'), text = cv('--text'), accent = cv('--accent');
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, W, H);
  // dashed center line
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = muted;
  ctx.font = `bold ${W*0.12}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PONG', W/2, H/2);
}

function draw() {
  const surface = cv('--surface'), border = cv('--border'), text = cv('--text'), accent = cv('--accent'), muted = cv('--muted');
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, W, H);

  // center line
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = border; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.setLineDash([]);

  // scores
  ctx.fillStyle = text; ctx.font = `bold ${W*0.07}px system-ui`; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.fillText(scoreP, W/4, H*0.05);
  ctx.fillText(scoreAI, W*3/4, H*0.05);

  // paddles
  const rounding = 4;
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.roundRect(playerPaddle.x, playerPaddle.y, playerPaddle.w, playerPaddle.h, rounding); ctx.fill();
  ctx.fillStyle = muted;
  ctx.beginPath(); ctx.roundRect(aiPaddle.x, aiPaddle.y, aiPaddle.w, aiPaddle.h, rounding); ctx.fill();

  // ball
  ctx.fillStyle = text;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI*2); ctx.fill();
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function update() {
  // Move player paddle toward mouse/touch
  const targetY = touchY !== null ? touchY : mouseY !== null ? mouseY : null;
  if (targetY !== null) {
    const center = playerPaddle.y + playerPaddle.h / 2;
    const dy = targetY - center;
    playerPaddle.y += clamp(dy, -H*0.05, H*0.05);
    playerPaddle.y = clamp(playerPaddle.y, 0, H - playerPaddle.h);
  }

  // AI paddle
  const aiCenter = aiPaddle.y + aiPaddle.h / 2;
  const aiTarget = ball.y;
  const aiDiff = aiTarget - aiCenter;
  const aiMaxSpeed = AI_SPEED[diffIdx];
  aiPaddle.y += clamp(aiDiff, -aiMaxSpeed, aiMaxSpeed);
  aiPaddle.y = clamp(aiPaddle.y, 0, H - aiPaddle.h);

  // Ball movement
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom wall bounce
  if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }
  if (ball.y + BALL_R > H) { ball.y = H - BALL_R; ball.vy = -Math.abs(ball.vy); }

  // Player paddle collision
  if (ball.vx < 0 &&
      ball.x - BALL_R < playerPaddle.x + playerPaddle.w &&
      ball.x + BALL_R > playerPaddle.x &&
      ball.y > playerPaddle.y && ball.y < playerPaddle.y + playerPaddle.h) {
    ball.x = playerPaddle.x + playerPaddle.w + BALL_R;
    const relY = (ball.y - (playerPaddle.y + playerPaddle.h/2)) / (playerPaddle.h/2);
    const angle = relY * 0.9;
    const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy) * 1.04;
    ball.vx = Math.abs(Math.cos(angle) * speed);
    ball.vy = Math.sin(angle) * speed;
  }

  // AI paddle collision
  if (ball.vx > 0 &&
      ball.x + BALL_R > aiPaddle.x &&
      ball.x - BALL_R < aiPaddle.x + aiPaddle.w &&
      ball.y > aiPaddle.y && ball.y < aiPaddle.y + aiPaddle.h) {
    ball.x = aiPaddle.x - BALL_R;
    const relY = (ball.y - (aiPaddle.y + aiPaddle.h/2)) / (aiPaddle.h/2);
    const angle = relY * 0.9;
    const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy) * 1.04;
    ball.vx = -(Math.abs(Math.cos(angle) * speed));
    ball.vy = Math.sin(angle) * speed;
  }

  // Score
  if (ball.x + BALL_R < 0) {
    scoreAI++;
    if (scoreAI >= WIN_SCORE) { endGame(false); return; }
    resetBall(1);
  }
  if (ball.x - BALL_R > W) {
    scoreP++;
    if (scoreP >= WIN_SCORE) { endGame(true); return; }
    resetBall(-1);
  }
}

function loop() {
  update();
  draw();
  rafId = requestAnimationFrame(loop);
}

function startGame() {
  if (rafId) cancelAnimationFrame(rafId);
  initGame();
  running = true;
  btnStart.textContent = t('btn.restart');
  rafId = requestAnimationFrame(loop);
}

function endGame(playerWon) {
  running = false;
  cancelAnimationFrame(rafId);
  draw();
  statusEl.textContent = t(playerWon ? 'status.win' : 'status.lose_ai');
  statusEl.className = playerWon ? 'win' : '';
  if (playerWon) launchConfetti();
  btnStart.textContent = t('btn.play_again');
}

btnStart.addEventListener('click', startGame);
btnDiff.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  btnDiff.textContent = t('btn.ai_' + DIFFS[diffIdx].toLowerCase());
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseY = (e.clientY - rect.top) * (H / rect.height);
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchY = (e.touches[0].clientY - rect.top) * (H / rect.height);
}, {passive: false});
canvas.addEventListener('touchend', () => { touchY = null; }, {passive: false});

function onThemeChange() { if (!running) drawIdle(); else draw(); }
function onLangChange() { btnDiff.textContent = t('btn.ai_' + DIFFS[diffIdx].toLowerCase()); }

window.addEventListener('resize', resize);
resize();
drawIdle();
