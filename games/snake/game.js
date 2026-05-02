const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl  = document.getElementById('best');
const statusEl = document.getElementById('status');

const GRID = 20;
let CELL, snake, dir, nextDir, food, score, best, dead, animId, lastStep, stepMs;

function resize() {
  const sz = Math.min(window.innerWidth - 32, 480);
  canvas.width = canvas.height = sz;
  CELL = sz / GRID;
  draw();
}

function newGame() {
  snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir = {x:1,y:0}; nextDir = {x:1,y:0};
  score = 0; dead = false; stepMs = 200;
  best = +(localStorage.getItem('snake_best') || 0);
  scoreEl.textContent = 0; bestEl.textContent = best;
  statusEl.textContent = '';
  placeFood();
  cancelAnimationFrame(animId);
  lastStep = performance.now();
  animId = requestAnimationFrame(loop);
}

function placeFood() {
  let cell;
  do { cell = {x:Math.floor(Math.random()*GRID), y:Math.floor(Math.random()*GRID)}; }
  while (snake.some(s => s.x===cell.x && s.y===cell.y));
  food = cell;
}

function step() {
  const head = {x: snake[0].x + nextDir.x, y: snake[0].y + nextDir.y};
  dir = nextDir;
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    dead = true;
    if (score > best) {
      best = score;
      localStorage.setItem('snake_best', best);
      bestEl.textContent = best;
    }
    statusEl.textContent = `Game Over — Score: ${score}`;
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    stepMs = Math.max(80, 200 - score * 5);
    placeFood();
  } else {
    snake.pop();
  }
}

function loop(ts) {
  if (!dead) animId = requestAnimationFrame(loop);
  if (ts - lastStep >= stepMs) { step(); lastStep = ts; draw(); }
}

function draw() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = light ? '#f4f4f8' : '#0f0f13';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid
  ctx.strokeStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i*CELL, 0); ctx.lineTo(i*CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i*CELL); ctx.lineTo(canvas.width, i*CELL); ctx.stroke();
  }

  // Food
  ctx.fillStyle = '#e05252';
  ctx.beginPath();
  ctx.arc(food.x*CELL + CELL/2, food.y*CELL + CELL/2, CELL * 0.38, 0, Math.PI*2);
  ctx.fill();
  // Food shine
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(food.x*CELL + CELL*0.35, food.y*CELL + CELL*0.3, CELL*0.12, 0, Math.PI*2);
  ctx.fill();

  // Snake segments
  snake.forEach((seg, i) => {
    const t = i / Math.max(snake.length - 1, 1);
    ctx.fillStyle = i === 0 ? '#7c6ff7' : `hsl(${250 - t*30}, 65%, ${58 - t*12}%)`;
    const pad = 1.5;
    roundRect(ctx, seg.x*CELL + pad, seg.y*CELL + pad, CELL - pad*2, CELL - pad*2, CELL * 0.28);
    ctx.fill();

    // Eyes on head
    if (i === 0) {
      ctx.fillStyle = '#fff';
      const ex = dir.x === 0 ? [CELL*0.28, CELL*0.72] : [CELL * (dir.x > 0 ? 0.7 : 0.3)];
      const ey = dir.y === 0 ? [CELL*0.28, CELL*0.72] : [CELL * (dir.y > 0 ? 0.7 : 0.3)];
      const eyePairs = dir.x !== 0 ? [[ex[0], CELL*0.3],[ex[0], CELL*0.7]] : [[CELL*0.3, ey[0]],[CELL*0.7, ey[0]]];
      eyePairs.forEach(([ex2, ey2]) => {
        ctx.beginPath();
        ctx.arc(seg.x*CELL + ex2, seg.y*CELL + ey2, CELL*0.1, 0, Math.PI*2);
        ctx.fill();
      });
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

// Keyboard
document.addEventListener('keydown', e => {
  const map = {
    ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
    w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0}
  };
  const d = map[e.key];
  if (!d) return;
  if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (dead) newGame();
});

// Touch swipe
let touchStart = null;
canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, {passive:true});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { if (dead) newGame(); return; }
  const d = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? {x:1,y:0} : {x:-1,y:0})
    : (dy > 0 ? {x:0,y:1} : {x:0,y:-1});
  if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
}, {passive:true});

document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }
resize();
newGame();
