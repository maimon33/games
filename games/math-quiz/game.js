const statusEl = document.getElementById('status');
const questionEl = document.getElementById('question');
const inputEl = document.getElementById('answer-input');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const btnStart = document.getElementById('btn-start');
const btnDiff = document.getElementById('btn-diff');

const DIFFS = ['Easy', 'Medium', 'Hard'];
let diffIdx = 0, score = 0, timeLeft = 0, timerInterval = null, current = null, running = false;

function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

function generate() {
  const ops = diffIdx === 0 ? ['+', '-'] : diffIdx === 1 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, ans;
  if (op === '+') {
    a = diffIdx === 0 ? rnd(1, 9) : rnd(10, 99);
    b = diffIdx === 0 ? rnd(1, 9) : rnd(10, 99);
    ans = a + b;
  } else if (op === '-') {
    a = diffIdx === 0 ? rnd(2, 9) : rnd(20, 99);
    b = diffIdx === 0 ? rnd(1, a) : rnd(1, a);
    ans = a - b;
  } else if (op === '×') {
    a = rnd(2, 12); b = rnd(2, 12); ans = a * b;
  } else {
    b = rnd(2, 12); ans = rnd(2, 12); a = b * ans;
  }
  return { q: `${a} ${op} ${b} = ?`, ans };
}

function nextQuestion() {
  current = generate();
  questionEl.textContent = current.q;
  inputEl.value = '';
  inputEl.focus();
}

function submitAnswer() {
  if (!running || !current) return;
  const val = parseInt(inputEl.value, 10);
  if (isNaN(val)) return;
  if (val === current.ans) { score++; scoreEl.textContent = score; }
  nextQuestion();
}

function startGame() {
  running = true;
  score = 0;
  timeLeft = 60;
  scoreEl.textContent = 0;
  timerEl.textContent = 60;
  statusEl.textContent = '';
  statusEl.className = '';
  btnStart.textContent = t('btn.restart');
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      running = false;
      current = null;
      questionEl.textContent = '—';
      statusEl.textContent = t('status.time_up_score', { n: score });
      statusEl.className = 'win';
      if (score >= 10) launchConfetti();
    }
  }, 1000);
  nextQuestion();
}

inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
document.getElementById('btn-submit').addEventListener('click', submitAnswer);
btnStart.addEventListener('click', startGame);
btnDiff.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  btnDiff.textContent = t('btn.diff_' + DIFFS[diffIdx].toLowerCase());
  if (running) startGame();
});

function onLangChange() {
  btnDiff.textContent = t('btn.diff_' + DIFFS[diffIdx].toLowerCase());
  btnStart.textContent = running ? t('btn.restart') : t('btn.start');
}
