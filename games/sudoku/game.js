const gridEl   = document.getElementById('grid');
const statusEl = document.getElementById('status');
const btnNew   = document.getElementById('btn-new');
const btnDiff  = document.getElementById('btn-diff');
const btnCheck = document.getElementById('btn-check');

const DIFFS = ['Easy', 'Medium', 'Hard'];
const CLUES = { Easy: 36, Medium: 28, Hard: 22 };
let diffIdx = 0;

let puzzle, solution, userGrid, selected;

// ---- Generator ----

function getUsed(g, r, c) {
  const s = new Set();
  for (let i = 0; i < 9; i++) { s.add(g[r][i]); s.add(g[i][c]); }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s.add(g[br + i][bc + j]);
  return s;
}

function fillGrid(g) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g[r][c] !== 0) continue;
      const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
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
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] !== 0) continue;
        const used = getUsed(g, r, c);
        for (let n = 1; n <= 9; n++) {
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
  const sol = Array.from({ length: 9 }, () => new Array(9).fill(0));
  fillGrid(sol);
  const puz = sol.map(r => [...r]);
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const target = CLUES[difficulty];
  let remaining = 81;

  for (const idx of cells) {
    if (remaining <= target) break;
    const r = Math.floor(idx / 9), c = idx % 9;
    const val = puz[r][c];
    puz[r][c] = 0;
    if (countSolutions(puz, 2) !== 1) { puz[r][c] = val; }
    else { remaining--; }
  }
  return { puzzle: puz, solution: sol };
}

// ---- Render ----

function renderGrid() {
  gridEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
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
          (Math.floor(sr/3) === Math.floor(r/3) && Math.floor(sc/3) === Math.floor(c/3))) {
          cell.classList.add('peer');
        }
      }

      if (!isGiven && val !== 0 && val !== solution[r][c]) cell.classList.add('error');
      if (c % 3 === 0 && c !== 0) cell.classList.add('box-left');
      if (r % 3 === 0 && r !== 0) cell.classList.add('box-top');

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
  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.textContent = n;
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
  checkWin();
}

function checkWin() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if ((puzzle[r][c] || userGrid[r][c]) !== solution[r][c]) return;
  statusEl.textContent = 'Solved!';
  statusEl.className = 'win';
}

// ---- Keyboard ----
document.addEventListener('keydown', e => {
  if (!selected) return;
  const [r, c] = selected;
  const moves = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
  if (moves[e.key]) {
    const [dr, dc] = moves[e.key];
    const nr = Math.max(0, Math.min(8, r + dr));
    const nc = Math.max(0, Math.min(8, c + dc));
    selected = [nr, nc];
    renderGrid();
    return;
  }
  if (e.key >= '1' && e.key <= '9') input(parseInt(e.key));
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
    userGrid = Array.from({ length: 9 }, () => new Array(9).fill(0));
    statusEl.textContent = '';
    renderGrid();
  }, 10);
}

btnNew.addEventListener('click', newGame);
btnDiff.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  btnDiff.textContent = DIFFS[diffIdx];
  newGame();
});
btnCheck.addEventListener('click', () => {
  let errors = 0;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (!puzzle[r][c] && userGrid[r][c] && userGrid[r][c] !== solution[r][c]) errors++;
  if (errors === 0) { statusEl.textContent = 'No errors!'; statusEl.className = 'win'; }
  else { statusEl.textContent = `${errors} error${errors > 1 ? 's' : ''} found`; statusEl.className = 'error-msg'; }
});

renderNumpad();
newGame();
