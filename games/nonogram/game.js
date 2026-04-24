const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// Puzzle solutions stored as flat 1D arrays (row-major)
const PUZZLES = [
  { name: 'Cross',    size: 5, sol: [0,0,1,0,0, 0,0,1,0,0, 1,1,1,1,1, 0,0,1,0,0, 0,0,1,0,0] },
  { name: 'Diamond',  size: 5, sol: [0,0,1,0,0, 0,1,1,1,0, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0] },
  { name: 'Heart',    size: 5, sol: [0,1,0,1,0, 1,1,1,1,1, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0] },
  { name: 'T-shape',  size: 5, sol: [1,1,1,1,1, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0] },
  { name: 'Z-shape',  size: 5, sol: [1,1,1,1,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 1,1,1,1,1] },
  { name: 'Smiley',   size: 8, sol: [
    0,0,1,1,1,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,1,0,0,1,0,1,
    1,0,0,0,0,0,0,1,
    1,0,1,0,0,1,0,1,
    1,0,0,1,1,0,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,1,1,1,0,0,
  ]},
  { name: 'House',    size: 8, sol: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,0,1,1,
    1,1,0,1,1,0,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
  ]},
  { name: 'Tree',     size: 8, sol: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,0,0,0,0,0,0,0,
  ]},
];

let puzzleIdx = 0;
let userGrid;   // 0=empty, 1=filled, 2=marked(X)
let clues;

function cv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

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
  puzzleIdx = ((idx % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  const { sol, size } = PUZZLES[puzzleIdx];
  userGrid = new Uint8Array(size * size);
  clues = computeClues(sol, size);
  statusEl.textContent = '';
  statusEl.className = '';
  draw();
}

function sizes() {
  const { size } = PUZZLES[puzzleIdx];
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

  // Column clues (bottom-aligned above grid)
  for (let c = 0; c < size; c++) {
    const cl = clues.col[c];
    const x = gutter + c * cs + cs / 2;
    cl.forEach((n, i) => {
      const offset = cl.length - 1 - i;
      const y = gutter - offset * cs - cs / 2;
      ctx.fillStyle = cv('--muted');
      ctx.fillText(n, x, y);
    });
  }

  // Row clues (right-aligned left of grid)
  for (let r = 0; r < size; r++) {
    const cl = clues.row[r];
    const y = gutter + r * cs + cs / 2;
    cl.forEach((n, i) => {
      const offset = cl.length - 1 - i;
      const x = gutter - offset * cs - cs / 2;
      ctx.fillStyle = cv('--muted');
      ctx.fillText(n, x, y);
    });
  }

  // Grid cells
  const { sol } = PUZZLES[puzzleIdx];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = gutter + c * cs, y = gutter + r * cs;
      const state = userGrid[r * size + c];

      // Box background
      ctx.fillStyle = (r % 3 < 1 || c % 3 < 1) && size === 5
        ? cv('--surface')
        : cv('--surface');
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

      // 3x3 box shading for 5x5 puzzles (subtle)
      if ((Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0) {
        ctx.fillStyle = cv('--border') + '55';
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

      // Grid lines
      ctx.strokeStyle = cv('--border');
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cs, cs);

      // Thick lines every 5 cols/rows for 8x8
      if (size === 8) {
        if (c % 4 === 0) { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cs); ctx.stroke(); ctx.lineWidth = 1; }
        if (r % 4 === 0) { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke(); ctx.lineWidth = 1; }
      }
    }
  }

  // Outer border
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
  const { size } = PUZZLES[puzzleIdx];
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
  const { sol, size } = PUZZLES[puzzleIdx];
  for (let i = 0; i < size * size; i++) {
    if (sol[i] === 1 && userGrid[i] !== 1) return;
    if (sol[i] === 0 && userGrid[i] === 1) return;
  }
  statusEl.textContent = t('status.nonogram_solved', {name: PUZZLES[puzzleIdx].name});
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

document.getElementById('btn-prev').addEventListener('click', () => loadPuzzle(puzzleIdx - 1));
document.getElementById('btn-next').addEventListener('click', () => loadPuzzle(puzzleIdx + 1));
document.getElementById('btn-reveal').addEventListener('click', () => {
  const { sol, size } = PUZZLES[puzzleIdx];
  for (let i = 0; i < size * size; i++) userGrid[i] = sol[i] ? 1 : 0;
  draw();
  statusEl.textContent = `Answer revealed.`;
  statusEl.className = '';
});

window.addEventListener('resize', draw);
function onThemeChange() { draw(); }

loadPuzzle(0);
