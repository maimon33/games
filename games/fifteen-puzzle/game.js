const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const movesEl  = document.getElementById('moves');
const timerEl  = document.getElementById('timer');
const btnNew   = document.getElementById('btn-new');

const N = 4; // 4×4 grid
let board, emptyIdx, moves, won, timerInterval, startTime, started;

function cv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

function boardPx() { return Math.min(window.innerWidth - 32, window.innerHeight * 0.65, 440); }
function cs()      { return Math.floor(boardPx() / N); }

function initGame() {
  // Start from solved state and make 300 random valid moves
  board = Array.from({ length: N * N }, (_, i) => i === N * N - 1 ? 0 : i + 1);
  emptyIdx = N * N - 1;

  const dirs = [-1, 1, -N, N];
  let last = -1;
  for (let i = 0; i < 300; i++) {
    const valid = dirs.map(d => emptyIdx + d).filter(ni => {
      if (ni < 0 || ni >= N * N) return false;
      if (d === -1 && emptyIdx % N === 0) return false;
      if (d ===  1 && emptyIdx % N === N - 1) return false;
      return ni !== last;
    });
    const ni = valid[Math.floor(Math.random() * valid.length)];
    [board[emptyIdx], board[ni]] = [board[ni], board[emptyIdx]];
    last = emptyIdx;
    emptyIdx = ni;
  }

  moves = 0; won = false; started = false;
  clearInterval(timerInterval);
  movesEl.textContent = 0;
  timerEl.textContent = 0;
  statusEl.textContent = '';
  statusEl.className = '';

  const side = cs() * N;
  canvas.width = canvas.height = side;
  draw();
}

function draw() {
  const side = cs();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = cv('--border');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < N * N; i++) {
    const v = board[i];
    const r = Math.floor(i / N), c = i % N;
    const x = c * side, y = r * side;
    const pad = 4;

    if (v === 0) {
      ctx.fillStyle = cv('--bg');
      ctx.fillRect(x + pad, y + pad, side - pad * 2, side - pad * 2);
      continue;
    }

    const solved = v === i + 1;
    ctx.fillStyle = solved ? cv('--accent') + 'cc' : cv('--surface');
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, side - pad * 2, side - pad * 2, 8);
    ctx.fill();

    ctx.fillStyle = solved ? '#fff' : cv('--text');
    ctx.font = `bold ${side * 0.4}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(v, x + side / 2, y + side / 2);
  }
}

function slide(tileIdx) {
  if (won) return;
  const er = Math.floor(emptyIdx / N), ec = emptyIdx % N;
  const tr = Math.floor(tileIdx / N), tc = tileIdx % N;
  if (!((er === tr && Math.abs(ec - tc) === 1) || (ec === tc && Math.abs(er - tr) === 1))) return;

  if (!started) {
    started = true;
    startTime = Date.now();
    timerInterval = setInterval(() => { timerEl.textContent = Math.floor((Date.now() - startTime) / 1000); }, 1000);
  }

  [board[emptyIdx], board[tileIdx]] = [board[tileIdx], board[emptyIdx]];
  emptyIdx = tileIdx;
  moves++;
  movesEl.textContent = moves;
  draw();

  if (board.every((v, i) => v === (i === N * N - 1 ? 0 : i + 1))) {
    won = true;
    clearInterval(timerInterval);
    statusEl.textContent = t('status.solved_moves', {n: moves});
    statusEl.className = 'win';
    launchConfetti();
  }
}

function clickAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const side = cs();
  const c = Math.floor((clientX - rect.left) * scale / side);
  const r = Math.floor((clientY - rect.top)  * scale / side);
  if (r < 0 || r >= N || c < 0 || c >= N) return;
  slide(r * N + c);
}

canvas.addEventListener('click', e => clickAt(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => {
  clickAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
}, { passive: true });

document.addEventListener('keydown', e => {
  const er = Math.floor(emptyIdx / N), ec = emptyIdx % N;
  // Arrow key moves the tile INTO the empty space (empty moves in arrow direction)
  const map = {
    ArrowUp:    er > 0     ? emptyIdx - N : -1,
    ArrowDown:  er < N - 1 ? emptyIdx + N : -1,
    ArrowLeft:  ec > 0     ? emptyIdx - 1 : -1,
    ArrowRight: ec < N - 1 ? emptyIdx + 1 : -1,
  };
  const target = map[e.key];
  if (target !== undefined && target >= 0) { e.preventDefault(); slide(target); }
});

btnNew.addEventListener('click', initGame);
window.addEventListener('resize', () => {
  const side = cs() * N;
  canvas.width = canvas.height = side;
  draw();
});

function onThemeChange() { draw(); }

initGame();
