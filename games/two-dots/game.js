// Two Dots clone — 6×6 grid, 5 colors, loop detection, gravity animation

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

const ROWS = 6, COLS = 6, CELL = 55, DOT_R = 18;
const COLORS = ['#e05252','#4fa8e0','#52e07c','#e0c452','#c452e0'];

let grid, chain, dragging, score, fallAnim, animFrame;

function init() {
  grid = Array.from({length: ROWS}, () =>
    Array.from({length: COLS}, () => Math.floor(Math.random() * 5))
  );
  chain = [];
  dragging = false;
  score = 0;
  fallAnim = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  updateScore();
  draw();
}

function updateScore() {
  scoreEl.textContent = score;
}

function dotCenter(r, c) {
  return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
}

function cellFromPoint(px, py) {
  const c = Math.floor(px / CELL);
  const r = Math.floor(py / CELL);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  const center = dotCenter(r, c);
  const dx = px - center.x, dy = py - center.y;
  if (dx * dx + dy * dy > DOT_R * DOT_R * 2.25) return null;
  return { r, c };
}

function isAdjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    px: (src.clientX - rect.left) * scaleX,
    py: (src.clientY - rect.top) * scaleY
  };
}

function onPointerDown(e) {
  e.preventDefault();
  if (animFrame) return;
  const { px, py } = getPointerPos(e);
  const cell = cellFromPoint(px, py);
  if (!cell) return;
  const { r, c } = cell;
  if (grid[r][c] === -1) return;
  chain = [{ r, c }];
  dragging = true;
  draw();
}

function onPointerMove(e) {
  e.preventDefault();
  if (!dragging || animFrame) return;
  const { px, py } = getPointerPos(e);
  const cell = cellFromPoint(px, py);
  if (!cell) return;
  const { r, c } = cell;
  if (grid[r][c] === -1) return;

  const last = chain[chain.length - 1];
  if (last.r === r && last.c === c) return;

  // Backtrack: stepped onto the second-to-last cell
  if (chain.length >= 2) {
    const prev = chain[chain.length - 2];
    if (prev.r === r && prev.c === c) {
      chain.pop();
      draw();
      return;
    }
  }

  // Must be adjacent to last
  if (!isAdjacent(last.r, last.c, r, c)) return;

  // Must be same color as chain start
  if (grid[r][c] !== grid[chain[0].r][chain[0].c]) return;

  // Loop closure: stepped back onto the first dot
  if (r === chain[0].r && c === chain[0].c && chain.length >= 3) {
    commitChain(true);
    return;
  }

  // Don't revisit existing chain cells (except the first for loop closure handled above)
  if (chain.some(p => p.r === r && p.c === c)) return;

  chain.push({ r, c });
  draw();
}

function onPointerUp(e) {
  e.preventDefault();
  if (!dragging) return;
  commitChain(false);
}

function commitChain(forceLoop) {
  dragging = false;
  if (chain.length < 2) {
    chain = [];
    draw();
    return;
  }

  const first = chain[0];
  const last = chain[chain.length - 1];
  const isLoop = forceLoop || (
    chain.length >= 4 &&
    isAdjacent(first.r, first.c, last.r, last.c) &&
    grid[first.r][first.c] === grid[last.r][last.c]
  );

  const color = grid[first.r][first.c];
  const toRemove = new Set();

  if (isLoop) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (grid[r][c] === color) toRemove.add(`${r},${c}`);
  } else {
    for (const { r, c } of chain) toRemove.add(`${r},${c}`);
  }

  const removed = toRemove.size;
  score += removed;
  updateScore();

  for (const key of toRemove) {
    const [r, c] = key.split(',').map(Number);
    grid[r][c] = -1;
  }

  chain = [];

  showStatus(isLoop ? `Loop! ×${removed}` : `+${removed}`);
  applyGravity();
}

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.className = '';
  clearTimeout(statusEl._timer);
  statusEl._timer = setTimeout(() => { statusEl.textContent = ''; }, 1200);
}

function applyGravity() {
  // Per-column: compact existing dots downward, fill top with new random dots
  // Track per-cell how many rows it fell so we can animate from above
  const newFall = Array.from({length: ROWS}, () => Array(COLS).fill(0));

  for (let c = 0; c < COLS; c++) {
    // Collect surviving dots bottom-to-top
    const existing = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== -1) existing.push({ color: grid[r][c], srcRow: r });
    }
    const missing = ROWS - existing.length;

    // Place surviving dots from bottom
    for (let i = 0; i < existing.length; i++) {
      const destRow = ROWS - 1 - i;
      const { color, srcRow } = existing[i];
      grid[destRow][c] = color;
      const fell = destRow - srcRow;
      newFall[destRow][c] = -fell * CELL;
    }

    // Fill top with new random dots
    for (let i = 0; i < missing; i++) {
      const destRow = missing - 1 - i;
      grid[destRow][c] = Math.floor(Math.random() * 5);
      // New dots fall from above: they start "missing - destRow" rows above row 0
      newFall[destRow][c] = -(missing - destRow) * CELL;
    }
  }

  fallAnim = newFall;
  startFallAnimation();
}

function startFallAnimation() {
  if (animFrame) cancelAnimationFrame(animFrame);

  function step() {
    let active = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (Math.abs(fallAnim[r][c]) > 0.5) {
          fallAnim[r][c] *= 0.65;
          active = true;
        } else {
          fallAnim[r][c] = 0;
        }
      }
    }
    draw();
    if (active) {
      animFrame = requestAnimationFrame(step);
    } else {
      animFrame = null;
    }
  }

  animFrame = requestAnimationFrame(step);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = cv('--bg');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cell backgrounds
  ctx.fillStyle = cv('--surface');
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 6);
      ctx.fill();
    }
  }

  // Connection lines (drawn under dots)
  if (chain.length >= 2) {
    const color = COLORS[grid[chain[0].r][chain[0].c]];
    ctx.strokeStyle = color;
    ctx.lineWidth = DOT_R * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    chain.forEach(({ r, c }, i) => {
      const center = dotCenter(r, c);
      const y = center.y + (fallAnim[r][c] || 0);
      if (i === 0) ctx.moveTo(center.x, y);
      else ctx.lineTo(center.x, y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Loop-close indicator: faint line from last chain dot to first if closeable
  if (chain.length >= 3) {
    const first = chain[0];
    const last = chain[chain.length - 1];
    if (isAdjacent(first.r, first.c, last.r, last.c)) {
      const color = COLORS[grid[first.r][first.c]];
      const fc = dotCenter(first.r, first.c);
      const lc = dotCenter(last.r, last.c);
      ctx.strokeStyle = color;
      ctx.lineWidth = DOT_R * 0.8;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(lc.x, lc.y + (fallAnim[last.r][last.c] || 0));
      ctx.lineTo(fc.x, fc.y + (fallAnim[first.r][first.c] || 0));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  // Dots
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === -1) continue;
      const center = dotCenter(r, c);
      const yOff = fallAnim[r][c] || 0;
      const cy = center.y + yOff;
      const color = COLORS[grid[r][c]];
      const inChain = chain.some(p => p.r === r && p.c === c);
      const radius = DOT_R * (inChain ? 1.2 : 1);

      ctx.beginPath();
      ctx.arc(center.x, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Inner highlight shine
      ctx.beginPath();
      ctx.arc(center.x - DOT_R * 0.28, cy - DOT_R * 0.28, DOT_R * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
    }
  }
}

// Pointer events — mouse
canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('mouseleave', onPointerUp);

// Pointer events — touch
canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove', onPointerMove, { passive: false });
canvas.addEventListener('touchend', onPointerUp, { passive: false });

function onThemeChange() { draw(); }

init();
