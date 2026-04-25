const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const optionInput = document.getElementById('option-input');
const optionList = document.getElementById('option-list');
const btnSpin = document.getElementById('btn-spin');
const btnAdd = document.getElementById('btn-add');

const SEG_COLORS = ['#e05252','#52a0e0','#52e07c','#e0c452','#e07c52','#a052e0','#52e0d0','#e052b0'];
let options = ['Rock', 'Paper', 'Scissors', 'Option 4', 'Option 5', 'Option 6'];
let angle = 0, spinning = false;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize() {
  const size = Math.min(window.innerWidth - 32, 360);
  canvas.width = canvas.height = size;
  draw();
}

function draw() {
  const W = canvas.width, cx = W / 2, cy = W / 2, R = W / 2 - 10;
  ctx.clearRect(0, 0, W, W);

  if (options.length < 2) {
    ctx.fillStyle = cv('--surface');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cv('--muted');
    ctx.font = `${W * 0.06}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Add options', cx, cy);
    return;
  }

  const arc = (Math.PI * 2) / options.length;
  options.forEach((opt, i) => {
    const start = angle + i * arc, end = start + arc;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, start, end); ctx.closePath();
    ctx.fillStyle = SEG_COLORS[i % SEG_COLORS.length]; ctx.fill();
    ctx.strokeStyle = cv('--bg'); ctx.lineWidth = 2; ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const fontSize = Math.min(W * 0.045, 18);
    ctx.font = `bold ${fontSize}px system-ui`;
    ctx.fillStyle = '#fff';
    const maxLen = 12;
    const label = opt.length > maxLen ? opt.slice(0, maxLen - 1) + '…' : opt;
    ctx.fillText(label, R - 12, 0);
    ctx.restore();
  });

  // Center cap
  ctx.beginPath(); ctx.arc(cx, cy, W * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = cv('--surface'); ctx.fill();
  ctx.strokeStyle = cv('--border'); ctx.lineWidth = 2; ctx.stroke();

  // Pointer (top)
  const pw = W * 0.045;
  ctx.beginPath();
  ctx.moveTo(cx - pw, 4);
  ctx.lineTo(cx + pw, 4);
  ctx.lineTo(cx, W * 0.12);
  ctx.closePath();
  ctx.fillStyle = cv('--text'); ctx.fill();
}

function spin() {
  if (spinning || options.length < 2) return;
  spinning = true;
  statusEl.textContent = '';
  const startAngle = angle;
  const extra = Math.PI * 2 * (6 + Math.random() * 6);
  const target = startAngle + extra;
  const startTime = performance.now();
  const duration = 3000 + Math.random() * 1000;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function frame(now) {
    const t = Math.min(1, (now - startTime) / duration);
    angle = startAngle + extra * easeOut(t);
    draw();
    if (t < 1) { requestAnimationFrame(frame); return; }
    spinning = false;
    angle = target % (Math.PI * 2);
    draw();
    showResult();
  }
  requestAnimationFrame(frame);
}

function showResult() {
  const arc = (Math.PI * 2) / options.length;
  // Pointer is at top (angle = -PI/2 from canvas 0). Normalize wheel angle.
  const normalized = (((-angle - Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor(normalized / arc) % options.length;
  statusEl.textContent = '🎉 ' + options[idx];
}

function renderList() {
  optionList.innerHTML = '';
  options.forEach((opt, i) => {
    const li = document.createElement('li');
    li.style.borderColor = SEG_COLORS[i % SEG_COLORS.length] + '88';
    li.textContent = opt;
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.addEventListener('click', () => { options.splice(i, 1); renderList(); draw(); });
    li.appendChild(btn);
    optionList.appendChild(li);
  });
}

function addOption() {
  const val = optionInput.value.trim();
  if (!val || options.length >= 12) return;
  options.push(val);
  optionInput.value = '';
  renderList();
  draw();
}

btnSpin.addEventListener('click', spin);
btnAdd.addEventListener('click', addOption);
canvas.addEventListener('click', spin);
optionInput.addEventListener('keydown', e => { if (e.key === 'Enter') addOption(); });

function onThemeChange() { draw(); }

window.addEventListener('resize', resize);
resize();
renderList();
