const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const mineCountEl = document.getElementById('mine-count');
const timerEl  = document.getElementById('timer');
const btnNew   = document.getElementById('btn-new');
const btnDiff  = document.getElementById('btn-diff');

const DIFFS = [
  { label: 'Easy',   cols: 9,  rows: 9,  mines: 10 },
  { label: 'Medium', cols: 12, rows: 12, mines: 20 },
  { label: 'Hard',   cols: 16, rows: 16, mines: 40 },
];
let diffIdx = 0;

let cols, rows, mines, board, revealed, flagged, firstClick, won, lost, timerInterval, startTime, flags;

function cv(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function cellSize() {
  const maxW = Math.min(window.innerWidth - 32, 520);
  const maxH = window.innerHeight * 0.55;
  return Math.floor(Math.min(maxW / cols, maxH / rows));
}

function initGame() {
  ({ cols, rows, mines } = DIFFS[diffIdx]);
  board    = new Array(rows * cols).fill(0);
  revealed = new Uint8Array(rows * cols);
  flagged  = new Uint8Array(rows * cols);
  firstClick = true;
  won = lost = false;
  flags = 0;
  clearInterval(timerInterval);
  timerEl.textContent = '0';
  mineCountEl.textContent = mines;
  statusEl.textContent = '';
  statusEl.className = '';
  const cs = cellSize();
  canvas.width  = cols * cs;
  canvas.height = rows * cs;
  draw();
}

function placeMines(safeIdx) {
  const indices = Array.from({ length: rows * cols }, (_, i) => i).filter(i => i !== safeIdx);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  indices.slice(0, mines).forEach(i => { board[i] = -1; });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r * cols + c] === -1) continue;
      let count = 0;
      forNeighbors(r, c, (nr, nc) => { if (board[nr * cols + nc] === -1) count++; });
      board[r * cols + c] = count;
    }
  }
}

function forNeighbors(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
    }
}

function reveal(r, c) {
  const idx = r * cols + c;
  if (revealed[idx] || flagged[idx]) return;
  revealed[idx] = 1;
  if (board[idx] === 0) forNeighbors(r, c, (nr, nc) => reveal(nr, nc));
}

function handleClick(r, c) {
  if (won || lost) return;
  const idx = r * cols + c;
  if (flagged[idx]) return;
  if (firstClick) {
    firstClick = false;
    placeMines(idx);
    startTime = Date.now();
    timerInterval = setInterval(() => {
      timerEl.textContent = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
  }
  if (revealed[idx]) {
    // Chord: if adjacent flags === cell number, reveal all unflagged neighbors
    let adjFlags = 0;
    forNeighbors(r, c, (nr, nc) => { if (flagged[nr * cols + nc]) adjFlags++; });
    if (adjFlags === board[idx]) forNeighbors(r, c, (nr, nc) => {
      if (!flagged[nr * cols + nc]) reveal(nr, nc);
    });
  } else {
    reveal(r, c);
  }
  if (board[idx] === -1) {
    lost = true;
    clearInterval(timerInterval);
    revealed.fill(1);
    statusEl.textContent = 'Boom! Game over.';
    statusEl.className = 'lose';
  } else {
    checkWin();
  }
  draw();
}

function handleFlag(r, c) {
  if (won || lost || revealed[r * cols + c]) return;
  const idx = r * cols + c;
  flagged[idx] = flagged[idx] ? 0 : 1;
  flags += flagged[idx] ? 1 : -1;
  mineCountEl.textContent = mines - flags;
  draw();
}

function checkWin() {
  const safe = rows * cols - mines;
  let count = 0;
  for (let i = 0; i < rows * cols; i++) if (revealed[i]) count++;
  if (count === safe) {
    won = true;
    clearInterval(timerInterval);
    statusEl.textContent = 'Cleared!';
    statusEl.className = 'win';
  }
}

const NUM_COLORS = ['', '#4a9eff', '#4ade80', '#ef4444', '#7c6ff7', '#f97316', '#22d3ee', '#000', '#888'];

function draw() {
  const cs = cellSize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = c * cs, y = r * cs;

      if (revealed[idx]) {
        ctx.fillStyle = board[idx] === -1 ? '#7f1d1d' : cv('--surface');
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        if (board[idx] === -1) {
          ctx.fillStyle = '#ef4444';
          ctx.font = `${cs * 0.6}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✕', x + cs / 2, y + cs / 2);
        } else if (board[idx] > 0) {
          ctx.fillStyle = NUM_COLORS[board[idx]];
          ctx.font = `bold ${cs * 0.55}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(board[idx], x + cs / 2, y + cs / 2);
        }
      } else {
        ctx.fillStyle = flagged[idx] ? cv('--accent') + '44' : cv('--border');
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        if (flagged[idx]) {
          ctx.fillStyle = cv('--accent');
          ctx.font = `${cs * 0.55}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚑', x + cs / 2, y + cs / 2);
        }
      }

      // Grid lines
      ctx.strokeStyle = cv('--bg');
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cs, cs);
    }
  }
}

function posFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const cs = cellSize();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top)  * (canvas.height / rect.height);
  return { r: Math.floor(y / cs), c: Math.floor(x / cs) };
}

canvas.addEventListener('click', e => {
  const { r, c } = posFromEvent(e);
  handleClick(r, c);
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const { r, c } = posFromEvent(e);
  handleFlag(r, c);
});

// Long-press for flagging on mobile
let longPressTimer = null;
canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    const rect = canvas.getBoundingClientRect();
    const cs = cellSize();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top)  * (canvas.height / rect.height);
    handleFlag(Math.floor(y / cs), Math.floor(x / cs));
  }, 400);
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
});
canvas.addEventListener('touchmove', e => {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
}, { passive: true });

btnNew.addEventListener('click', initGame);
btnDiff.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  btnDiff.textContent = DIFFS[diffIdx].label;
  initGame();
});

window.addEventListener('resize', () => {
  const cs = cellSize();
  canvas.width  = cols * cs;
  canvas.height = rows * cs;
  draw();
});

function onThemeChange() { draw(); }

initGame();
