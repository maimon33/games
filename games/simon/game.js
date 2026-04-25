const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const roundEl = document.getElementById('round');
const btnStart = document.getElementById('btn-start');

const PADS = [
  { color: '#cc2222', bright: '#ff5555', r: 0, c: 0 },
  { color: '#2255cc', bright: '#5588ff', r: 0, c: 1 },
  { color: '#228822', bright: '#44cc44', r: 1, c: 0 },
  { color: '#bbaa00', bright: '#ffdd22', r: 1, c: 1 },
];

let sequence = [], playerIdx = 0, active = [-1], phase = 'idle', SIZE;

function resize() {
  SIZE = Math.min(window.innerWidth - 32, 360);
  canvas.width = canvas.height = SIZE;
  draw();
}

function draw() {
  const gap = Math.round(SIZE * 0.025);
  const padSize = (SIZE - gap * 3) / 2;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  ctx.fillRect(0, 0, SIZE, SIZE);
  PADS.forEach((pad, i) => {
    const x = gap + pad.c * (padSize + gap);
    const y = gap + pad.r * (padSize + gap);
    ctx.globalAlpha = active[0] === i ? 1 : 0.65;
    ctx.fillStyle = active[0] === i ? pad.bright : pad.color;
    ctx.beginPath();
    ctx.roundRect(x, y, padSize, padSize, Math.round(SIZE * 0.04));
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function flash(idx, duration) {
  return new Promise(resolve => {
    active = [idx];
    draw();
    setTimeout(() => { active = [-1]; draw(); setTimeout(resolve, 100); }, duration);
  });
}

async function playSequence() {
  phase = 'showing';
  statusEl.textContent = '';
  for (const idx of sequence) {
    await flash(idx, 500);
    await new Promise(r => setTimeout(r, 150));
  }
  phase = 'player';
  playerIdx = 0;
}

function startGame() {
  sequence = [];
  playerIdx = 0;
  phase = 'idle';
  statusEl.textContent = '';
  statusEl.className = '';
  roundEl.textContent = 0;
  active = [-1];
  draw();
  addAndPlay();
}

function addAndPlay() {
  sequence.push(Math.floor(Math.random() * 4));
  roundEl.textContent = sequence.length;
  setTimeout(playSequence, 600);
}

function handleInput(idx) {
  if (phase !== 'player') return;
  flash(idx, 200);
  if (idx !== sequence[playerIdx]) {
    phase = 'idle';
    statusEl.textContent = t('status.simon_over', { n: sequence.length });
    statusEl.className = 'lose';
    return;
  }
  playerIdx++;
  if (playerIdx === sequence.length) {
    phase = 'idle';
    if (sequence.length >= 20) {
      statusEl.textContent = t('status.win');
      statusEl.className = 'win';
      launchConfetti();
      return;
    }
    setTimeout(addAndPlay, 1000);
  }
}

function padFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  const x = (src.clientX - rect.left) * scaleX;
  const y = (src.clientY - rect.top) * scaleY;
  const gap = Math.round(SIZE * 0.025);
  const padSize = (SIZE - gap * 3) / 2;
  const c = x < gap + padSize ? 0 : 1;
  const r = y < gap + padSize ? 0 : 1;
  return PADS.findIndex(p => p.r === r && p.c === c);
}

canvas.addEventListener('click', e => { handleInput(padFromEvent(e)); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(padFromEvent(e)); }, { passive: false });

btnStart.addEventListener('click', startGame);

function onThemeChange() { draw(); }

window.addEventListener('resize', resize);
resize();
