const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const wordEl = document.getElementById('word-display');
const keyboardEl = document.getElementById('keyboard');

const WORDS = [
  'apple','beach','brain','bridge','candy','castle','cloud','dance',
  'eagle','earth','flame','forest','ghost','giant','grass','happy',
  'heart','honey','horse','house','igloo','island','jelly','jungle',
  'knife','lemon','light','magic','mango','mouse','music','night',
  'ninja','ocean','orbit','panda','paper','peace','peach','piano',
  'pizza','power','queen','radio','river','robot','salad','seven',
  'shark','shore','space','storm','sugar','table','tiger','torch',
  'tower','train','truck','ultra','unity','valor','video','water',
  'witch','world','youth','zebra'
];

let word = '', guessed = new Set(), wrong = 0, gameOver = false;
const MAX_WRONG = 6;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function drawGallows() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = cv('--border');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // Base
  ctx.beginPath(); ctx.moveTo(20, H - 10); ctx.lineTo(W - 20, H - 10); ctx.stroke();
  // Pole
  ctx.beginPath(); ctx.moveTo(60, H - 10); ctx.lineTo(60, 20); ctx.stroke();
  // Top bar
  ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(150, 20); ctx.stroke();
  // Noose
  ctx.beginPath(); ctx.moveTo(150, 20); ctx.lineTo(150, 50); ctx.stroke();

  if (wrong < 1) return;
  // Head
  ctx.strokeStyle = cv('--text');
  ctx.beginPath(); ctx.arc(150, 65, 16, 0, Math.PI * 2); ctx.stroke();
  if (wrong < 2) return;
  // Body
  ctx.beginPath(); ctx.moveTo(150, 81); ctx.lineTo(150, 130); ctx.stroke();
  if (wrong < 3) return;
  // Left arm
  ctx.beginPath(); ctx.moveTo(150, 95); ctx.lineTo(120, 115); ctx.stroke();
  if (wrong < 4) return;
  // Right arm
  ctx.beginPath(); ctx.moveTo(150, 95); ctx.lineTo(180, 115); ctx.stroke();
  if (wrong < 5) return;
  // Left leg
  ctx.beginPath(); ctx.moveTo(150, 130); ctx.lineTo(120, 165); ctx.stroke();
  if (wrong < 6) return;
  // Right leg
  ctx.beginPath(); ctx.moveTo(150, 130); ctx.lineTo(180, 165); ctx.stroke();
}

function renderWord() {
  wordEl.innerHTML = '';
  for (const ch of word) {
    const span = document.createElement('span');
    span.style.cssText = `display:inline-block;min-width:1.2em;text-align:center;border-bottom:3px solid ${guessed.has(ch) ? 'transparent' : cv('--border')};`;
    span.textContent = guessed.has(ch) ? ch.toUpperCase() : ' ';
    wordEl.appendChild(span);
  }
}

function renderKeyboard() {
  keyboardEl.innerHTML = '';
  for (let i = 65; i <= 90; i++) {
    const ch = String.fromCharCode(i).toLowerCase();
    const btn = document.createElement('button');
    btn.textContent = String.fromCharCode(i);
    if (guessed.has(ch)) {
      btn.classList.add(word.includes(ch) ? 'used-right' : 'used-wrong');
      btn.disabled = true;
    }
    btn.addEventListener('click', () => guess(ch));
    keyboardEl.appendChild(btn);
  }
}

function guess(ch) {
  if (gameOver || guessed.has(ch)) return;
  guessed.add(ch);
  if (!word.includes(ch)) wrong++;
  drawGallows();
  renderWord();
  renderKeyboard();
  checkEnd();
}

function checkEnd() {
  const won = [...word].every(ch => guessed.has(ch));
  if (won) {
    gameOver = true;
    statusEl.textContent = t('status.hangman_win');
    statusEl.className = 'win';
    launchConfetti();
    return;
  }
  if (wrong >= MAX_WRONG) {
    gameOver = true;
    statusEl.textContent = t('status.hangman_lose', { word: word.toUpperCase() });
    statusEl.className = 'lose';
    // Reveal word
    for (const ch of word) guessed.add(ch);
    renderWord();
  }
}

function newGame() {
  word = WORDS[Math.floor(Math.random() * WORDS.length)];
  guessed = new Set();
  wrong = 0;
  gameOver = false;
  statusEl.textContent = '';
  statusEl.className = '';
  drawGallows();
  renderWord();
  renderKeyboard();
}

document.getElementById('btn-new').addEventListener('click', newGame);

document.addEventListener('keydown', e => {
  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) guess(e.key.toLowerCase());
});

function onThemeChange() { drawGallows(); }

newGame();
