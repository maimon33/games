const gridEl   = document.getElementById('grid');
const statusEl = document.getElementById('status');
const btnNew   = document.getElementById('btn-new');
const btnDiff  = document.getElementById('btn-diff');
const btnCheck = document.getElementById('btn-check');

const DIFFS = ['Easy', 'Medium', 'Hard'];
const CLUES = {
  Easy:   { 9: 36, 6: 20 },
  Medium: { 9: 28, 6: 16 },
  Hard:   { 9: 22, 6: 12 },
};
let diffIdx = 0;
let gridN = 9, boxR = 3, boxC = 3;

let puzzle, solution, userGrid, selected;

// ---- Generator ----

function getUsed(g, r, c) {
  const s = new Set();
  for (let i = 0; i < gridN; i++) { s.add(g[r][i]); s.add(g[i][c]); }
  const br = Math.floor(r / boxR) * boxR, bc = Math.floor(c / boxC) * boxC;
  for (let i = 0; i < boxR; i++) for (let j = 0; j < boxC; j++) s.add(g[br + i][bc + j]);
  return s;
}

function fillGrid(g) {
  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      if (g[r][c] !== 0) continue;
      const nums = Array.from({length: gridN}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
      const used = getUsed(g, r, c);
      for (const n of nums) {
        if (!used.has(n)) {
          g[r][c] = n;
          if (fillGrid(g)) return true;
          g[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function countSolutions(g, max) {
  let count = 0;
  function solve(g) {
    if (count >= max) return;
    for (let r = 0; r < gridN; r++) {
      for (let c = 0; c < gridN; c++) {
        if (g[r][c] !== 0) continue;
        const used = getUsed(g, r, c);
        for (let n = 1; n <= gridN; n++) {
          if (!used.has(n)) { g[r][c] = n; solve(g); g[r][c] = 0; }
        }
        return;
      }
    }
    count++;
  }
  solve(g.map(r => [...r]));
  return count;
}

function generate(difficulty) {
  const sol = Array.from({ length: gridN }, () => new Array(gridN).fill(0));
  fillGrid(sol);
  const puz = sol.map(r => [...r]);
  const cells = Array.from({ length: gridN * gridN }, (_, i) => i).sort(() => Math.random() - 0.5);
  const target = CLUES[difficulty][gridN];
  let remaining = gridN * gridN;

  for (const idx of cells) {
    if (remaining <= target) break;
    const r = Math.floor(idx / gridN), c = idx % gridN;
    const val = puz[r][c];
    puz[r][c] = 0;
    if (countSolutions(puz, 2) !== 1) { puz[r][c] = val; }
    else { remaining--; }
  }
  return { puzzle: puz, solution: sol };
}

// ---- Render ----

function renderGrid() {
  const sudokuGridEl = document.querySelector('.sudoku-grid');
  sudokuGridEl.style.gridTemplateColumns = `repeat(${gridN}, 1fr)`;
  gridEl.innerHTML = '';
  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const isGiven = puzzle[r][c] !== 0;
      const val = isGiven ? puzzle[r][c] : userGrid[r][c];

      if (isGiven) cell.classList.add('given');
      else if (val !== 0) cell.classList.add('user-input');

      if (selected) {
        const [sr, sc] = selected;
        if (sr === r && sc === c) {
          cell.classList.add('selected');
        } else if (sr === r || sc === c ||
          (Math.floor(sr / boxR) === Math.floor(r / boxR) && Math.floor(sc / boxC) === Math.floor(c / boxC))) {
          cell.classList.add('peer');
        }
      }

      if (!isGiven && val !== 0 && val !== solution[r][c]) cell.classList.add('error');
      if (c % boxC === 0 && c !== 0) cell.classList.add('box-left');
      if (r % boxR === 0 && r !== 0) cell.classList.add('box-top');

      if (val !== 0) cell.textContent = val;

      if (!isGiven) {
        cell.addEventListener('click', () => {
          selected = [r, c];
          renderGrid();
        });
      }
      gridEl.appendChild(cell);
    }
  }
}

function renderNumpad() {
  const pad = document.getElementById('numpad');
  pad.innerHTML = '';
  const counts = new Array(gridN + 1).fill(0);
  for (let r = 0; r < gridN; r++)
    for (let c = 0; c < gridN; c++) {
      const v = puzzle[r][c] || userGrid[r][c];
      if (v) counts[v]++;
    }
  const cols = gridN === 6 ? 4 : 5;
  pad.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  for (let n = 1; n <= gridN; n++) {
    const btn = document.createElement('button');
    btn.textContent = n;
    if (counts[n] >= gridN) {
      btn.disabled = true;
      btn.classList.add('done');
    }
    btn.addEventListener('click', () => input(n));
    pad.appendChild(btn);
  }
  const erase = document.createElement('button');
  erase.textContent = '✕';
  erase.className = 'erase';
  erase.addEventListener('click', () => input(0));
  pad.appendChild(erase);
}

function input(n) {
  if (!selected) return;
  const [r, c] = selected;
  if (puzzle[r][c] !== 0) return;
  userGrid[r][c] = n;
  statusEl.textContent = '';
  statusEl.className = '';
  renderGrid();
  renderNumpad();
  checkWin();
}

function checkWin() {
  for (let r = 0; r < gridN; r++)
    for (let c = 0; c < gridN; c++)
      if ((puzzle[r][c] || userGrid[r][c]) !== solution[r][c]) return;
  statusEl.textContent = t('status.solved');
  statusEl.className = 'win';
  launchConfetti();
}

// ---- Keyboard ----
document.addEventListener('keydown', e => {
  if (!selected) return;
  const [r, c] = selected;
  const moves = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
  if (moves[e.key]) {
    const [dr, dc] = moves[e.key];
    const nr = Math.max(0, Math.min(gridN - 1, r + dr));
    const nc = Math.max(0, Math.min(gridN - 1, c + dc));
    selected = [nr, nc];
    renderGrid();
    return;
  }
  if (e.key >= '1' && parseInt(e.key) <= gridN) input(parseInt(e.key));
  if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') input(0);
});

// ---- Controls ----

function newGame() {
  statusEl.textContent = 'Generating…';
  statusEl.className = '';
  selected = null;
  setTimeout(() => {
    const diff = DIFFS[diffIdx];
    ({ puzzle, solution } = generate(diff));
    userGrid = Array.from({ length: gridN }, () => new Array(gridN).fill(0));
    statusEl.textContent = '';
    renderGrid();
    renderNumpad();
  }, 10);
}

function toggle6x6() {
  if (gridN === 9) { gridN = 6; boxR = 2; boxC = 3; }
  else             { gridN = 9; boxR = 3; boxC = 3; }
  const btn = document.getElementById('btn-size');
  btn.textContent = gridN === 9 ? '6×6' : '9×9';
  selected = null;
  newGame();
}

btnNew.addEventListener('click', newGame);
btnDiff.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  btnDiff.textContent = t('btn.diff_' + DIFFS[diffIdx].toLowerCase());
  newGame();
});
btnCheck.addEventListener('click', () => {
  let errors = 0;
  for (let r = 0; r < gridN; r++)
    for (let c = 0; c < gridN; c++)
      if (!puzzle[r][c] && userGrid[r][c] && userGrid[r][c] !== solution[r][c]) errors++;
  if (errors === 0) { statusEl.textContent = t('status.no_errors'); statusEl.className = 'win'; }
  else { statusEl.textContent = `${errors} error${errors > 1 ? 's' : ''} found`; statusEl.className = 'error-msg'; }
});

function onLangChange() { btnDiff.textContent = t('btn.diff_' + DIFFS[diffIdx].toLowerCase()); }

renderNumpad();
newGame();
