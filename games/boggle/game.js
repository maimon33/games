const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const scoreEl     = document.getElementById('score');
const timerEl     = document.getElementById('timer');
const wordsEl     = document.getElementById('words-found');
const currentEl   = document.getElementById('current-word');
const foundWordsEl = document.getElementById('found-words');
const statusEl    = document.getElementById('status');

const GRID_N = 4;
const LETTER_WEIGHTS = (
  'AAAAAAAAEEEEEEEEEEEEIIIIIIIOOOOOOUUURRRRTTTTNNNNSSSSLLLLCCCDDDDGGBBFFHHMMPPVVWWYYKJXQZ'
).split('');
const SCORE_TABLE = [0,0,0,1,1,2,3,5,11];

let CELL, grid, path, foundWords, score, totalWords, timeLeft, timerInterval, gameOver;

// ── Grid ──────────────────────────────────────────────────────────────────────

function newGame() {
  grid = Array.from({length:GRID_N}, () =>
    Array.from({length:GRID_N}, () => LETTER_WEIGHTS[Math.floor(Math.random()*LETTER_WEIGHTS.length)])
  );
  // Replace Q with QU on display
  path = [];
  foundWords = new Set();
  score = 0; timeLeft = 180; gameOver = false;
  scoreEl.textContent = 0;
  wordsEl.textContent = 0;
  foundWordsEl.innerHTML = '';
  currentEl.textContent = '';
  currentEl.className = '';
  statusEl.textContent = 'Find words of 3+ letters';
  clearInterval(timerInterval);
  timerEl.textContent = '3:00';
  timerEl.className = '';
  timerInterval = setInterval(tick, 1000);
  draw();
}

function tick() {
  timeLeft--;
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  timerEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  timerEl.className = timeLeft <= 30 ? 'urgent' : '';
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    gameOver = true;
    path = [];
    currentEl.textContent = '';
    statusEl.textContent = `Time's up! Score: ${score} — ${foundWords.size} words`;
    draw();
  }
}

// ── Path helpers ──────────────────────────────────────────────────────────────

function adjacent(r1, c1, r2, c2) {
  return Math.abs(r1-r2) <= 1 && Math.abs(c1-c2) <= 1 && !(r1===r2 && c1===c2);
}

function pathWord() {
  return path.map(([r,c]) => grid[r][c]).join('');
}

function submitWord() {
  const word = pathWord().toLowerCase();
  if (word.length < 3) { clearPath(); return; }
  if (foundWords.has(word)) { flash('invalid'); clearPath(); return; }
  if (!WORDS.has(word))     { flash('invalid'); clearPath(); return; }
  const pts = SCORE_TABLE[Math.min(word.length, 8)] || 11;
  score += pts;
  scoreEl.textContent = score;
  foundWords.add(word);
  wordsEl.textContent = foundWords.size;
  addChip(word, pts);
  currentEl.textContent = '';
  currentEl.className = '';
  clearPath();
}

function clearPath() {
  path = [];
  currentEl.textContent = '';
  currentEl.className = '';
  draw();
}

function flash(cls) {
  currentEl.className = cls;
  setTimeout(() => { currentEl.className = ''; }, 500);
}

function addChip(word, pts) {
  const chip = document.createElement('div');
  chip.className = 'found-chip';
  chip.textContent = `${word} +${pts}`;
  foundWordsEl.prepend(chip);
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function resize() {
  const sz = Math.min(window.innerWidth - 32, 320);
  canvas.width = canvas.height = sz;
  CELL = sz / GRID_N;
  draw();
}

function draw() {
  if (!grid) return;
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const bg    = light ? '#f4f4f8' : '#0f0f13';
  const surfC = light ? '#ffffff' : '#1a1a24';
  const bordC = light ? '#dddde8' : '#2a2a38';
  const textC = light ? '#1a1a2e' : '#e8e8f0';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < GRID_N; r++) {
    for (let c = 0; c < GRID_N; c++) {
      const x = c * CELL, y = r * CELL;
      const inPath = path.findIndex(([pr,pc]) => pr===r && pc===c);
      const isLast  = inPath === path.length - 1 && path.length > 0;
      const isInPath = inPath >= 0;

      // Cell background
      ctx.fillStyle = isLast ? '#7c6ff7' : isInPath ? (light ? '#d8d4fa' : '#3a3560') : surfC;
      roundRect(ctx, x+3, y+3, CELL-6, CELL-6, CELL*0.18);
      ctx.fill();
      ctx.strokeStyle = isInPath ? '#7c6ff7' : bordC;
      ctx.lineWidth = isInPath ? 2 : 1;
      ctx.stroke();

      // Letter
      ctx.fillStyle = isLast ? '#fff' : isInPath ? '#7c6ff7' : textC;
      ctx.font = `bold ${CELL * 0.44}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(grid[r][c], x + CELL/2, y + CELL/2);

      // Path order number
      if (inPath >= 0) {
        ctx.fillStyle = isLast ? 'rgba(255,255,255,0.8)' : 'rgba(124,111,247,0.7)';
        ctx.font = `${CELL * 0.2}px system-ui`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(inPath + 1, x + CELL - 6, y + 4);
      }
    }
  }

  // Draw path lines
  if (path.length > 1) {
    ctx.strokeStyle = 'rgba(124,111,247,0.4)';
    ctx.lineWidth = CELL * 0.12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    path.forEach(([r,c], i) => {
      const x = c*CELL + CELL/2, y = r*CELL + CELL/2;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  // Update current word display
  const word = pathWord();
  if (word.length > 0) {
    currentEl.textContent = word;
    const valid = word.length >= 3 && WORDS.has(word.toLowerCase()) && !foundWords.has(word.toLowerCase());
    const tooShort = word.length < 3;
    currentEl.className = tooShort ? '' : (valid ? '' : 'invalid');
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x, y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ── Input ─────────────────────────────────────────────────────────────────────

function cellAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width  / rect.width);
  const y = (clientY - rect.top)  * (canvas.height / rect.height);
  const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
  if (r < 0 || r >= GRID_N || c < 0 || c >= GRID_N) return null;
  return [r, c];
}

function tryAddCell(cell) {
  if (!cell || gameOver) return;
  const [r, c] = cell;
  const inPath = path.findIndex(([pr,pc]) => pr===r && pc===c);

  if (path.length === 0) {
    path.push([r,c]);
  } else if (inPath === path.length - 2 && path.length >= 2) {
    // Backtrack
    path.pop();
  } else if (inPath >= 0) {
    // Already in path (not backtrack) — ignore
    return;
  } else {
    const [lr, lc] = path[path.length-1];
    if (adjacent(lr, lc, r, c)) path.push([r,c]);
  }
  draw();
}

let dragging = false;
canvas.addEventListener('mousedown', e => {
  dragging = true;
  path = [];
  tryAddCell(cellAt(e.clientX, e.clientY));
});
canvas.addEventListener('mousemove', e => {
  if (!dragging) return;
  tryAddCell(cellAt(e.clientX, e.clientY));
});
canvas.addEventListener('mouseup', () => { dragging = false; submitWord(); });
canvas.addEventListener('mouseleave', () => { if (dragging) { dragging = false; submitWord(); } });

canvas.addEventListener('touchstart', e => {
  e.preventDefault(); dragging = true; path = [];
  tryAddCell(cellAt(e.touches[0].clientX, e.touches[0].clientY));
}, {passive:false});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  tryAddCell(cellAt(e.touches[0].clientX, e.touches[0].clientY));
}, {passive:false});
canvas.addEventListener('touchend', e => {
  e.preventDefault(); dragging = false; submitWord();
}, {passive:false});

document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }
resize();
newGame();
