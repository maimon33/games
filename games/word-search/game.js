const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const wordListEl = document.getElementById('word-list');

const THEMES = [
  { name:'Animals',   words:['ELEPHANT','DOLPHIN','PENGUIN','TIGER','RABBIT','PYTHON','PARROT','JAGUAR'] },
  { name:'Countries', words:['FRANCE','BRAZIL','MEXICO','JAPAN','INDIA','EGYPT','SPAIN','CANADA'] },
  { name:'Fruits',    words:['APPLE','MANGO','GRAPE','PEACH','LEMON','CHERRY','BANANA','ORANGE'] },
  { name:'Sports',    words:['TENNIS','BOXING','HOCKEY','SOCCER','RUGBY','GOLF','CRICKET','SURFING'] },
  { name:'Space',     words:['SATURN','COMET','NEBULA','GALAXY','ORBIT','METEOR','PULSAR','VENUS'] },
  { name:'Ocean',     words:['SHARK','CORAL','WHALE','SQUID','CLAM','ANCHOR','TRENCH','KELP'] },
  { name:'Music',     words:['PIANO','GUITAR','VIOLIN','TRUMPET','DRUMS','FLUTE','CELLO','HARP'] },
  { name:'Colors',    words:['CRIMSON','TEAL','AMBER','VIOLET','SCARLET','INDIGO','JADE','CORAL'] },
];

const DIRS = [
  [0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]
];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GRID_SIZE = 12;
const HIGHLIGHT_COLORS = [
  'rgba(124,111,247,0.45)','rgba(82,224,124,0.45)','rgba(224,165,82,0.45)',
  'rgba(82,200,224,0.45)','rgba(224,82,165,0.45)','rgba(224,224,82,0.45)',
  'rgba(224,82,82,0.45)','rgba(82,132,224,0.45)',
];

let CELL, grid, words, placements, found, theme;
let dragStart = null, dragCurrent = null;

// ── Grid generation ───────────────────────────────────────────────────────────

function newGame() {
  theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  words = theme.words.slice();
  grid = Array.from({length:GRID_SIZE}, () => Array(GRID_SIZE).fill(''));
  placements = {};
  found = new Set();

  for (const word of words) {
    placeWord(word);
  }

  // Fill blanks
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c]) grid[r][c] = ALPHA[Math.floor(Math.random()*26)];

  renderWordList();
  statusEl.textContent = `Find all ${words.length} ${theme.name.toLowerCase()}`;
  statusEl.className = '';
  draw();
}

function placeWord(word) {
  const tries = 200;
  for (let t = 0; t < tries; t++) {
    const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    const cells = [];
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const nr = r + dr*i, nc = c + dc*i;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) { ok = false; break; }
      if (grid[nr][nc] && grid[nr][nc] !== word[i]) { ok = false; break; }
      cells.push([nr, nc]);
    }
    if (ok) {
      cells.forEach(([nr,nc], i) => { grid[nr][nc] = word[i]; });
      placements[word] = cells;
      return true;
    }
  }
  return false;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function resize() {
  const sz = Math.min(window.innerWidth - 32, 420);
  canvas.width = canvas.height = sz;
  CELL = sz / GRID_SIZE;
  draw();
}

function draw() {
  if (!grid) return;
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const bg    = light ? '#f4f4f8' : '#0f0f13';
  const textC = light ? '#1a1a2e' : '#e8e8f0';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Found word highlights
  words.forEach((word, idx) => {
    if (!found.has(word)) return;
    const cells = placements[word];
    if (!cells) return;
    ctx.fillStyle = HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length];
    cells.forEach(([r,c]) => {
      ctx.beginPath();
      ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.46, 0, Math.PI*2);
      ctx.fill();
    });
  });

  // Drag selection highlight
  const sel = getSelection();
  if (sel && sel.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    sel.forEach(([r,c]) => {
      ctx.beginPath();
      ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, CELL*0.46, 0, Math.PI*2);
      ctx.fill();
    });
  }

  // Letters
  ctx.font = `bold ${CELL * 0.52}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const inSel = sel && sel.some(([sr,sc]) => sr===r && sc===c);
      ctx.fillStyle = inSel ? '#fff' : textC;
      ctx.fillText(grid[r][c], c*CELL + CELL/2, r*CELL + CELL/2);
    }
  }
}

// ── Selection logic ───────────────────────────────────────────────────────────

function cellAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width  / rect.width);
  const y = (clientY - rect.top)  * (canvas.height / rect.height);
  const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
  if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
  return [r, c];
}

function getSelection() {
  if (!dragStart || !dragCurrent) return null;
  const [r0, c0] = dragStart, [r1, c1] = dragCurrent;
  const dr = r1 - r0, dc = c1 - c0;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  if (len === 0) return [[r0, c0]];
  // Must be straight line (horizontal, vertical, or diagonal)
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  // Only allow 8 valid directions
  if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) {
    // not diagonal — snap to dominant axis
    if (Math.abs(dr) >= Math.abs(dc)) {
      dragCurrent = [r1, r0 + dr]; // vertical
      return getSelection();
    } else {
      dragCurrent = [r0 + dc > GRID_SIZE ? GRID_SIZE-1 : r0, c1];
      return getSelection();
    }
  }
  const cells = [];
  for (let i = 0; i <= len; i++) {
    const r = r0 + stepR*i, c = c0 + stepC*i;
    if (r < 0||r >= GRID_SIZE||c < 0||c >= GRID_SIZE) break;
    cells.push([r, c]);
  }
  return cells;
}

function checkSelection() {
  const sel = getSelection();
  if (!sel || sel.length < 2) return;
  const forward  = sel.map(([r,c]) => grid[r][c]).join('');
  const backward = [...forward].reverse().join('');
  for (const word of words) {
    if (found.has(word)) continue;
    if (word === forward || word === backward) {
      found.add(word);
      updateWordList();
      if (found.size === words.length) {
        statusEl.textContent = '🎉 All words found!';
        statusEl.className = 'win';
        launchConfetti();
      }
      break;
    }
  }
}

function renderWordList() {
  wordListEl.innerHTML = '';
  words.forEach(word => {
    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.id = `chip-${word}`;
    chip.textContent = word;
    wordListEl.appendChild(chip);
  });
}

function updateWordList() {
  found.forEach(word => {
    const chip = document.getElementById(`chip-${word}`);
    if (chip) chip.classList.add('found');
  });
}

// ── Event handlers ────────────────────────────────────────────────────────────

canvas.addEventListener('mousedown', e => {
  dragStart = cellAt(e.clientX, e.clientY);
  dragCurrent = dragStart;
  draw();
});
canvas.addEventListener('mousemove', e => {
  if (!dragStart) return;
  dragCurrent = cellAt(e.clientX, e.clientY) || dragCurrent;
  draw();
});
canvas.addEventListener('mouseup', () => {
  checkSelection(); dragStart = null; dragCurrent = null; draw();
});
canvas.addEventListener('mouseleave', () => {
  if (dragStart) { checkSelection(); dragStart = null; dragCurrent = null; draw(); }
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  dragStart = cellAt(e.touches[0].clientX, e.touches[0].clientY);
  dragCurrent = dragStart; draw();
}, {passive:false});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  dragCurrent = cellAt(e.touches[0].clientX, e.touches[0].clientY) || dragCurrent;
  draw();
}, {passive:false});
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  checkSelection(); dragStart = null; dragCurrent = null; draw();
}, {passive:false});

document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', resize);
function onThemeChange() { draw(); }
resize();
newGame();
