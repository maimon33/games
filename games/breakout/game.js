const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');

let W;
let H;
let paddle;
let ball;
let bricks;
let score;
let lives;
let level;
let animId;
let running;

function resize() {
  const width = Math.min(window.innerWidth - 32, 560);
  canvas.width = width;
  canvas.height = Math.round(width * 1.18);
  W = canvas.width;
  H = canvas.height;
  if (paddle) {
    paddle.w = W * 0.18;
    paddle.y = H - 34;
  }
  draw();
}

function makeBricks() {
  const rows = Math.min(7, 4 + level);
  const cols = 8;
  const gap = 6;
  const pad = 18;
  const top = 48;
  const bw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const bh = 22;
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        x: pad + c * (bw + gap),
        y: top + r * (bh + gap),
        w: bw,
        h: bh,
        alive: true,
        color: `hsl(${18 + r * 18}, 85%, ${58 - r * 4}%)`,
      });
    }
  }
  return out;
}

function resetBall() {
  ball = {
    x: W / 2,
    y: H - 60,
    vx: (Math.random() > 0.5 ? 1 : -1) * (3 + level * 0.2),
    vy: -(4.2 + level * 0.24),
    r: 8,
  };
}

function newGame() {
  score = 0;
  lives = 3;
  level = 1;
  paddle = { x: W / 2 - W * 0.09, y: H - 34, w: W * 0.18, h: 12 };
  bricks = makeBricks();
  resetBall();
  running = true;
  updateUI();
  statusEl.textContent = 'Break the wall.';
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function updateUI() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  levelEl.textContent = level;
}

function nextLevel() {
  level++;
  bricks = makeBricks();
  resetBall();
  updateUI();
  statusEl.textContent = `Level ${level}`;
}

function loseLife() {
  lives--;
  updateUI();
  if (lives <= 0) {
    running = false;
    cancelAnimationFrame(animId);
    statusEl.textContent = `Game over. Final score: ${score}`;
    return;
  }
  resetBall();
  statusEl.textContent = `${lives} lives left.`;
}

function update() {
  if (!running) return;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) ball.vx *= -1;
  if (ball.y - ball.r <= 0) ball.vy *= -1;
  if (ball.y - ball.r > H) loseLife();

  if (
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.vy > 0
  ) {
    const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.vx = hit * 5.2;
    ball.vy = -Math.abs(ball.vy);
  }

  for (const brick of bricks) {
    if (!brick.alive) continue;
    if (
      ball.x + ball.r > brick.x &&
      ball.x - ball.r < brick.x + brick.w &&
      ball.y + ball.r > brick.y &&
      ball.y - ball.r < brick.y + brick.h
    ) {
      brick.alive = false;
      score += 10;
      updateUI();
      ball.vy *= -1;
      break;
    }
  }

  if (bricks.every(brick => !brick.alive)) nextLevel();
}

function draw() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = light ? '#f8fafc' : '#081220';
  ctx.fillRect(0, 0, W || canvas.width, H || canvas.height);

  if (!bricks || !paddle || !ball) return;

  ctx.fillStyle = light ? '#dbeafe' : '#12263f';
  ctx.fillRect(12, 12, W - 24, H - 24);

  bricks.forEach(brick => {
    if (!brick.alive) return;
    ctx.fillStyle = brick.color;
    roundRect(brick.x, brick.y, brick.w, brick.h, 6);
    ctx.fill();
  });

  ctx.fillStyle = '#e2e8f0';
  roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 7);
  ctx.fill();

  const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r + 2);
  grad.addColorStop(0, '#fff7ed');
  grad.addColorStop(1, '#f97316');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function loop() {
  update();
  draw();
  if (running) animId = requestAnimationFrame(loop);
}

function movePaddle(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  paddle.x = Math.max(12, Math.min(W - 12 - paddle.w, x - paddle.w / 2));
}

canvas.addEventListener('mousemove', e => { if (paddle) movePaddle(e.clientX); });
canvas.addEventListener('touchmove', e => {
  if (!paddle) return;
  movePaddle(e.touches[0].clientX);
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('click', () => { if (!running) newGame(); });
document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }

resize();
newGame();
