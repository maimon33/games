const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const totalEl = document.getElementById('total');
const countDisplay = document.getElementById('count-display');
const sidesSelect = document.getElementById('sides-select');

const SIDES_LIST = [4, 6, 8, 10, 12, 20, 100];
let diceCount = 2, results = [], rolling = false;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function getSides() { return parseInt(sidesSelect.value, 10); }

function updateCanvas() {
  const W = Math.min(window.innerWidth - 32, 420);
  const cols = Math.min(diceCount, 5);
  const rows = Math.ceil(diceCount / cols);
  canvas.width = W;
  canvas.height = Math.round((W / cols) * rows);
}

// Pip positions as [x, y] fractions of half-die-size, per face value
const PIPS = {
  1: [[0, 0]],
  2: [[-0.35, -0.35], [0.35, 0.35]],
  3: [[-0.35, -0.35], [0, 0], [0.35, 0.35]],
  4: [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]],
  5: [[-0.35, -0.35], [0.35, -0.35], [0, 0], [-0.35, 0.35], [0.35, 0.35]],
  6: [[-0.35, -0.38], [0.35, -0.38], [-0.35, 0], [0.35, 0], [-0.35, 0.38], [0.35, 0.38]],
};

function drawPips(cx, cy, dieSize, val) {
  const half = dieSize / 2;
  const pipR = dieSize * 0.09;
  for (const [px, py] of PIPS[val]) {
    const x = cx + px * half, y = cy + py * half;
    // Inset shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(x, y + pipR * 0.4, pipR, 0, Math.PI * 2); ctx.fill();
    // Pip
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, pipR, 0, Math.PI * 2); ctx.fill();
  }
}

function draw() {
  const W = canvas.width, H = canvas.height;
  const cols = Math.min(diceCount, 5);
  const rows = Math.ceil(diceCount / cols);
  const cellW = W / cols, cellH = H / rows;
  const dieSize = Math.min(cellW, cellH) * 0.72;
  const r = dieSize * 0.15;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = cv('--surface');
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 8); ctx.fill();

  results.forEach((val, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    // Center last incomplete row
    const thisRowCols = row === rows - 1 ? diceCount - row * cols : cols;
    const offsetX = row === rows - 1 ? (cols - thisRowCols) * cellW / 2 : 0;
    const cx = offsetX + (col + 0.5) * cellW;
    const cy = (row + 0.5) * cellH;
    const x = cx - dieSize / 2, y = cy - dieSize / 2;

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = cv('--accent');
    ctx.beginPath(); ctx.roundRect(x, y, dieSize, dieSize, r); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Highlight top edge
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.roundRect(x, y, dieSize, dieSize * 0.35, [r, r, 0, 0]); ctx.fill();

    if (getSides() === 6 && val >= 1 && val <= 6) {
      drawPips(cx, cy, dieSize, val);
    } else {
      const fontSize = Math.round(dieSize * (val >= 100 ? 0.28 : val >= 10 ? 0.38 : 0.5));
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, cx, cy);
    }
  });
}

function rollDice() {
  if (rolling) return;
  rolling = true;
  const sides = getSides();
  let frame = 0;
  const frames = 18;
  const interval = setInterval(() => {
    results = Array.from({ length: diceCount }, () => 1 + Math.floor(Math.random() * sides));
    draw();
    frame++;
    if (frame >= frames) {
      clearInterval(interval);
      rolling = false;
      const total = results.reduce((a, b) => a + b, 0);
      totalEl.innerHTML = `Total: <strong>${total}</strong>`;
    }
  }, 45);
}

document.getElementById('btn-minus').addEventListener('click', () => {
  if (diceCount > 1) { diceCount--; countDisplay.textContent = diceCount; updateCanvas(); draw(); }
});
document.getElementById('btn-plus').addEventListener('click', () => {
  if (diceCount < 10) { diceCount++; countDisplay.textContent = diceCount; updateCanvas(); draw(); }
});
document.getElementById('btn-roll').addEventListener('click', rollDice);
sidesSelect.addEventListener('change', () => { results = []; draw(); totalEl.textContent = ''; });

function onThemeChange() { draw(); }

window.addEventListener('resize', () => { updateCanvas(); draw(); });
updateCanvas();
results = Array.from({ length: diceCount }, () => 1 + Math.floor(Math.random() * getSides()));
draw();
totalEl.innerHTML = `Total: <strong>${results.reduce((a, b) => a + b, 0)}</strong>`;
