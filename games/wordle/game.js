const boardEl   = document.getElementById('board');
const keyboardEl = document.getElementById('keyboard');
const messageEl = document.getElementById('message');
const btnNew    = document.getElementById('btn-new');

const ROWS = 6, COLS = 5;
let target, guesses, current, done;

const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function pick() { return WORDS[Math.floor(Math.random() * WORDS.length)]; }

function initGame() {
  target  = pick();
  guesses = [];
  current = '';
  done    = false;
  messageEl.textContent = '';
  messageEl.className = '';
  renderBoard();
  renderKeyboard();
}

// ---- Render ----

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    for (let c = 0; c < COLS; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `t-${r}-${c}`;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
  // Fill in past guesses
  guesses.forEach((g, r) => applyGuessToRow(r, g));
  // Fill current input
  for (let c = 0; c < current.length; c++) {
    const tile = document.getElementById(`t-${guesses.length}-${c}`);
    if (tile) { tile.textContent = current[c].toUpperCase(); tile.classList.add('filled'); }
  }
}

function applyGuessToRow(r, guess) {
  const result = scoreGuess(guess);
  for (let c = 0; c < COLS; c++) {
    const tile = document.getElementById(`t-${r}-${c}`);
    if (!tile) continue;
    tile.textContent = guess[c].toUpperCase();
    tile.className = `tile ${result[c]}`;
  }
}

function renderKeyboard() {
  keyboardEl.innerHTML = '';
  KB_ROWS.forEach(row => {
    const div = document.createElement('div');
    div.className = 'kb-row';
    if (row === 'asdfghjkl') {
      div.appendChild(makeKey('Enter', 'wide', () => submit()));
      [...row].forEach(k => div.appendChild(makeKey(k, '', () => type(k))));
      div.appendChild(makeKey('⌫', 'wide', () => del()));
    } else {
      [...row].forEach(k => div.appendChild(makeKey(k, '', () => type(k))));
    }
    keyboardEl.appendChild(div);
  });
}

function makeKey(label, cls, fn) {
  const btn = document.createElement('button');
  btn.className = `key ${cls}`.trim();
  btn.textContent = label.toUpperCase();
  btn.id = `k-${label}`;
  btn.addEventListener('click', fn);
  return btn;
}

function updateKeyColors() {
  const state = {}; // letter → best state
  const priority = { correct: 3, present: 2, absent: 1 };
  guesses.forEach(g => {
    const r = scoreGuess(g);
    [...g].forEach((ch, i) => {
      if (!state[ch] || priority[r[i]] > priority[state[ch]]) state[ch] = r[i];
    });
  });
  Object.entries(state).forEach(([ch, s]) => {
    const btn = document.getElementById(`k-${ch}`);
    if (btn) btn.className = `key ${s}`;
  });
}

// ---- Logic ----

function scoreGuess(guess) {
  const result = Array(COLS).fill('absent');
  const tArr = [...target];
  const gArr = [...guess];
  const used = new Array(COLS).fill(false);

  // Pass 1: correct
  for (let i = 0; i < COLS; i++) {
    if (gArr[i] === tArr[i]) { result[i] = 'correct'; used[i] = true; }
  }
  // Pass 2: present
  for (let i = 0; i < COLS; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < COLS; j++) {
      if (!used[j] && gArr[i] === tArr[j]) { result[i] = 'present'; used[j] = true; break; }
    }
  }
  return result;
}

function type(ch) {
  if (done || current.length >= COLS) return;
  current += ch;
  renderBoard();
}

function del() {
  if (done || !current.length) return;
  current = current.slice(0, -1);
  renderBoard();
}

function submit() {
  if (done || current.length < COLS) return;

  guesses.push(current);
  current = '';
  renderBoard();
  updateKeyColors();

  if (guesses[guesses.length - 1] === target) {
    done = true;
    messageEl.textContent = [t('wordle.genius'), t('wordle.magnificent'), t('wordle.impressive'), t('wordle.splendid'), t('wordle.great'), t('wordle.phew')][guesses.length - 1] || t('wordle.nice');
    messageEl.className = 'win';
    launchConfetti();
    return;
  }
  if (guesses.length >= ROWS) {
    done = true;
    messageEl.textContent = target.toUpperCase();
    messageEl.className = 'lose';
  }
}

function flash() {
  const row = boardEl.children[guesses.length];
  if (!row) return;
  row.style.animation = 'none';
  row.style.opacity = '0.4';
  setTimeout(() => { row.style.opacity = '1'; }, 300);
}

// ---- Input ----

document.addEventListener('keydown', e => {
  if (done) return;
  if (e.key === 'Enter') { submit(); return; }
  if (e.key === 'Backspace') { del(); return; }
  if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toLowerCase());
});

btnNew.addEventListener('click', initGame);

initGame();
