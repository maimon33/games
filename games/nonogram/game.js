const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const PUZZLES = [
  // === EASY (5×5) ===
  { name: 'Cross',    size: 5, diff: 'Easy', sol: [
    0,0,1,0,0, 0,0,1,0,0, 1,1,1,1,1, 0,0,1,0,0, 0,0,1,0,0] },
  { name: 'Diamond',  size: 5, diff: 'Easy', sol: [
    0,0,1,0,0, 0,1,1,1,0, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0] },
  { name: 'Heart',    size: 5, diff: 'Easy', sol: [
    0,1,0,1,0, 1,1,1,1,1, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0] },
  { name: 'T-shape',  size: 5, diff: 'Easy', sol: [
    1,1,1,1,1, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0] },
  { name: 'Z-shape',  size: 5, diff: 'Easy', sol: [
    1,1,1,1,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 1,1,1,1,1] },
  { name: 'Frame',    size: 5, diff: 'Easy', sol: [
    1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1] },
  { name: 'L-shape',  size: 5, diff: 'Easy', sol: [
    1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1] },
  { name: 'Steps',    size: 5, diff: 'Easy', sol: [
    1,1,0,0,0, 1,1,0,0,0, 0,1,1,0,0, 0,0,1,1,0, 0,0,0,1,1] },
  { name: 'U-shape',  size: 5, diff: 'Easy', sol: [
    1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1] },
  { name: 'Checkers', size: 5, diff: 'Easy', sol: [
    1,0,1,0,1, 0,1,0,1,0, 1,0,1,0,1, 0,1,0,1,0, 1,0,1,0,1] },

  // === MEDIUM (8×8) ===
  { name: 'Smiley',   size: 8, diff: 'Medium', sol: [
    0,0,1,1,1,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,1,0,0,1,0,1,
    1,0,0,0,0,0,0,1,
    1,0,1,0,0,1,0,1,
    1,0,0,1,1,0,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,1,1,1,0,0] },
  { name: 'House',    size: 8, diff: 'Medium', sol: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,0,1,1,
    1,1,0,1,1,0,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1] },
  { name: 'Tree',     size: 8, diff: 'Medium', sol: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,0,0,0,0,0,0,0] },
  { name: 'Star',     size: 8, diff: 'Medium', sol: [
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0] },
  { name: 'Arrow',    size: 8, diff: 'Medium', sol: [
    0,0,0,0,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,0,1,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,0,1,0,0,0] },
  { name: 'Crown',    size: 8, diff: 'Medium', sol: [
    1,0,1,0,0,1,0,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,0,0,0,1,1,
    1,1,0,0,0,0,1,1,
    1,1,0,0,0,0,1,1,
    0,0,0,0,0,0,0,0] },
  { name: 'Diamond8', size: 8, diff: 'Medium', sol: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0,
    0,0,0,1,1,0,0,0] },
  { name: 'Sailboat', size: 8, diff: 'Medium', sol: [
    0,0,0,0,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,0,0,0,
    0,1,1,1,1,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0] },

  // === HARD (10×10) ===
  { name: 'Mushroom', size: 10, diff: 'Hard', sol: [
    0,0,0,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,0,0,
    0,1,1,0,1,1,0,1,1,0,
    0,1,1,1,1,1,1,1,1,0,
    0,1,1,1,1,1,1,1,1,0,
    0,0,1,1,1,1,1,1,0,0,
    0,0,0,0,1,1,0,0,0,0,
    0,0,0,0,1,1,0,0,0,0,
    0,0,0,1,1,1,1,0,0,0,
    0,0,0,0,0,0,0,0,0,0] },
  { name: 'Castle',   size: 10, diff: 'Hard', sol: [
    1,1,0,1,1,1,1,0,1,1,
    1,1,0,1,1,1,1,0,1,1,
    1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,
    1,1,0,0,1,1,0,0,1,1,
    1,1,0,0,1,1,0,0,1,1,
    1,1,1,1,1,1,1,1,1,1,
    1,1,1,0,0,0,0,1,1,1,
    1,1,1,0,0,0,0,1,1,1,
    1,1,1,0,0,0,0,1,1,1] },
  { name: 'Sun',      size: 10, diff: 'Hard', sol: [
    0,0,0,1,0,0,1,0,0,0,
    0,1,0,0,0,0,0,0,1,0,
    0,0,1,1,1,1,1,1,0,0,
    1,0,1,1,1,1,1,1,0,1,
    0,0,1,1,1,1,1,1,0,0,
    0,0,1,1,1,1,1,1,0,0,
    1,0,1,1,1,1,1,1,0,1,
    0,0,1,1,1,1,1,1,0,0,
    0,1,0,0,0,0,0,0,1,0,
    0,0,0,1,0,0,1,0,0,0] },
  { name: 'Robot',    size: 10, diff: 'Hard', sol: [
    0,1,1,1,1,1,1,1,1,0,
    1,0,0,0,0,0,0,0,0,1,
    1,0,1,1,0,0,1,1,0,1,
    1,0,1,1,0,0,1,1,0,1,
    1,0,0,0,0,0,0,0,0,1,
    1,0,1,0,0,0,0,1,0,1,
    1,0,0,1,1,1,1,0,0,1,
    1,0,0,0,0,0,0,0,0,1,
    0,1,1,1,1,1,1,1,1,0,
    0,0,1,1,0,0,1,1,0,0] },
  { name: 'Spaceship',size: 10, diff: 'Hard', sol: [
    0,0,0,0,1,1,0,0,0,0,
    0,0,0,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,0,0,
    0,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,
    0,1,1,0,1,1,0,1,1,0,
    0,1,0,0,1,1,0,0,1,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0] },
  { name: 'Skull',    size: 10, diff: 'Hard', sol: [
    0,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,1,0,1,1,
    1,1,0,1,1,1,1,0,1,1,
    1,1,1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,1,0,
    0,0,1,1,1,1,1,1,0,0,
    0,1,0,1,1,1,1,0,1,0,
    0,1,1,0,1,1,0,1,1,0,
    0,0,0,0,0,0,0,0,0,0] },

  // === EXPERT (15×15) ===
  { name: 'Building', size: 15, diff: 'Expert', sol: [
    0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,
    0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,
    1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,
    1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,
    1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,
    1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,
    1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,
    1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,
    1,1,1,1,1,1,0,0,0,1,1,1,1,1,1] },
  { name: 'Letter H', size: 15, diff: 'Expert', sol: [
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1] },
  { name: 'Big Cross',size: 15, diff: 'Expert', sol: [
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,0,0,0,0,0,0] },
];

const DIFFS = ['All', 'Easy', 'Medium', 'Hard', 'Expert'];
let diffIdx = 0;
let filteredIdx = 0;
let userGrid;
let clues;

function cv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

function getFiltered() {
  return diffIdx === 0 ? PUZZLES : PUZZLES.filter(p => p.diff === DIFFS[diffIdx]);
}

function currentPuzzle() { return getFiltered()[filteredIdx]; }

function computeClues(sol, size) {
  const row = [], col = [];
  for (let r = 0; r < size; r++) {
    const c = []; let run = 0;
    for (let i = 0; i < size; i++) {
      if (sol[r*size+i]) { run++; }
      else if (run) { c.push(run); run = 0; }
    }
    if (run) c.push(run);
    row.push(c.length ? c : [0]);
  }
  for (let c = 0; c < size; c++) {
    const cl = []; let run = 0;
    for (let r = 0; r < size; r++) {
      if (sol[r*size+c]) { run++; }
      else if (run) { cl.push(run); run = 0; }
    }
    if (run) cl.push(run);
    col.push(cl.length ? cl : [0]);
  }
  return { row, col };
}

function loadPuzzle(idx) {
  const filtered = getFiltered();
  filteredIdx = ((idx % filtered.length) + filtered.length) % filtered.length;
  const p = filtered[filteredIdx];
  userGrid = new Uint8Array(p.size * p.size);
  clues = computeClues(p.sol, p.size);
  statusEl.textContent = '';
  statusEl.className = '';
  draw();
}

function sizes() {
  const { size } = currentPuzzle();
  const maxClues = Math.max(
    ...clues.row.map(c => c.length),
    ...clues.col.map(c => c.length)
  );
  const avail = Math.min(window.innerWidth - 32, 480);
  const cs = Math.floor(avail / (size + maxClues));
  const gutter = maxClues * cs;
  return { cs, gutter, size };
}

function draw() {
  const { cs, gutter, size } = sizes();
  canvas.width  = gutter + size * cs;
  canvas.height = gutter + size * cs;

  ctx.fillStyle = cv('--bg');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const font = `${Math.max(cs * 0.5, 10)}px system-ui`;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let c = 0; c < size; c++) {
    const cl = clues.col[c];
    const x = gutter + c * cs + cs / 2;
    cl.forEach((n, i) => {
      const offset = cl.length - 1 - i;
      ctx.fillStyle = cv('--muted');
      ctx.fillText(n, x, gutter - offset * cs - cs / 2);
    });
  }

  for (let r = 0; r < size; r++) {
    const cl = clues.row[r];
    const y = gutter + r * cs + cs / 2;
    cl.forEach((n, i) => {
      const offset = cl.length - 1 - i;
      ctx.fillStyle = cv('--muted');
      ctx.fillText(n, gutter - offset * cs - cs / 2, y);
    });
  }

  const bs = size <= 6 ? 2 : 5;
  const { sol } = currentPuzzle();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = gutter + c * cs, y = gutter + r * cs;
      const state = userGrid[r * size + c];

      ctx.fillStyle = cv('--surface');
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

      if ((Math.floor(r / bs) + Math.floor(c / bs)) % 2 === 0) {
        ctx.fillStyle = cv('--border') + '44';
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      }

      if (state === 1) {
        ctx.fillStyle = cv('--accent');
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      } else if (state === 2) {
        ctx.fillStyle = cv('--muted');
        ctx.font = `${cs * 0.55}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', x + cs / 2, y + cs / 2);
        ctx.font = font;
      }

      ctx.strokeStyle = cv('--border');
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cs, cs);

      if (size >= 10 && bs > 2) {
        if (c % bs === 0 && c > 0) {
          ctx.lineWidth = 2; ctx.strokeStyle = cv('--muted') + '88';
          ctx.beginPath(); ctx.moveTo(x, gutter); ctx.lineTo(x, gutter + size * cs); ctx.stroke();
          ctx.lineWidth = 1;
        }
        if (r % bs === 0 && r > 0) {
          ctx.lineWidth = 2; ctx.strokeStyle = cv('--muted') + '88';
          ctx.beginPath(); ctx.moveTo(gutter, y); ctx.lineTo(gutter + size * cs, y); ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
    }
  }

  ctx.strokeStyle = cv('--text');
  ctx.lineWidth = 2;
  ctx.strokeRect(gutter, gutter, size * cs, size * cs);
}

function cellFromPos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const { cs, gutter, size } = sizes();
  const x = (clientX - rect.left) * scaleX - gutter;
  const y = (clientY - rect.top)  * scaleY - gutter;
  const c = Math.floor(x / cs), r = Math.floor(y / cs);
  if (r < 0 || r >= size || c < 0 || c >= size) return null;
  return { r, c };
}

function toggleCell(r, c, mode) {
  const { size } = currentPuzzle();
  const idx = r * size + c;
  if (mode === 'fill') {
    userGrid[idx] = userGrid[idx] === 1 ? 0 : 1;
  } else {
    userGrid[idx] = userGrid[idx] === 2 ? 0 : 2;
  }
  draw();
  checkWin();
}

function checkWin() {
  const { sol, size, name } = currentPuzzle();
  for (let i = 0; i < size * size; i++) {
    if (sol[i] === 1 && userGrid[i] !== 1) return;
    if (sol[i] === 0 && userGrid[i] === 1) return;
  }
  statusEl.textContent = t('status.nonogram_solved', {name});
  statusEl.className = 'win';
  launchConfetti();
}

canvas.addEventListener('click', e => {
  const cell = cellFromPos(e.clientX, e.clientY);
  if (cell) toggleCell(cell.r, cell.c, 'fill');
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const cell = cellFromPos(e.clientX, e.clientY);
  if (cell) toggleCell(cell.r, cell.c, 'mark');
});

let longPressTimer = null;
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    const cell = cellFromPos(t.clientX, t.clientY);
    if (cell) toggleCell(cell.r, cell.c, 'mark');
  }, 400);
}, { passive: true });
canvas.addEventListener('touchend', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } });
canvas.addEventListener('touchmove', () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } }, { passive: true });

document.getElementById('btn-prev').addEventListener('click', () => loadPuzzle(filteredIdx - 1));
document.getElementById('btn-next').addEventListener('click', () => loadPuzzle(filteredIdx + 1));
document.getElementById('btn-reveal').addEventListener('click', () => {
  const { sol, size } = currentPuzzle();
  for (let i = 0; i < size * size; i++) userGrid[i] = sol[i] ? 1 : 0;
  draw();
  statusEl.textContent = t('btn.reveal');
  statusEl.className = '';
});

function cycleDiff() {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  filteredIdx = 0;
  document.getElementById('btn-diff').textContent = t('btn.diff_' + DIFFS[diffIdx].toLowerCase());
  loadPuzzle(0);
}

function onLangChange() {
  document.getElementById('btn-diff').textContent = t('btn.diff_' + DIFFS[diffIdx].toLowerCase());
}

window.addEventListener('resize', draw);
function onThemeChange() { draw(); }

loadPuzzle(0);
