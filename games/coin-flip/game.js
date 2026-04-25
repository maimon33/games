const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const headsEl = document.getElementById('heads-count');
const tailsEl = document.getElementById('tails-count');
const btnFlip = document.getElementById('btn-flip');

let heads = 0, tails = 0, flipping = false, side = null;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function drawCoin(scaleX, currentSide) {
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.41;
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.abs(scaleX), 1);

  const isHeads = currentSide === 'H';
  const isEdge = currentSide === null;

  const gold = { hi: '#fff5b0', mid: '#e8c000', lo: '#8a6200', rim1: '#d4a800', rim2: '#a07800', ink: '#5a3e00' };
  const silver = { hi: '#f4f4fc', mid: '#b8b8cc', lo: '#4a4a5a', rim1: '#9090a8', rim2: '#606070', ink: '#282830' };
  const c = (!isEdge && !isHeads) ? silver : gold;

  const faceR = R * 0.86;

  // Milled edge — alternating raised/recessed segments
  const segs = 80;
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 0.62) / segs) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(0, 0, R, a1, a2);
    ctx.arc(0, 0, faceR, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? c.rim1 : c.rim2;
    ctx.fill();
  }

  // Coin face gradient
  const grad = ctx.createRadialGradient(-faceR * 0.28, -faceR * 0.28, faceR * 0.04, 0, 0, faceR * 1.05);
  grad.addColorStop(0,   c.hi);
  grad.addColorStop(0.5, c.mid);
  grad.addColorStop(1,   c.lo);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, faceR, 0, Math.PI * 2); ctx.fill();

  // Specular sheen
  const sheen = ctx.createRadialGradient(-faceR * 0.15, -faceR * 0.45, 0, -faceR * 0.15, -faceR * 0.45, faceR * 0.9);
  sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath(); ctx.arc(0, 0, faceR, 0, Math.PI * 2); ctx.fill();

  if (!isEdge) {
    // Inner relief ring
    ctx.strokeStyle = c.ink + '50';
    ctx.lineWidth = R * 0.018;
    ctx.beginPath(); ctx.arc(0, 0, faceR * 0.76, 0, Math.PI * 2); ctx.stroke();

    // Small dots along inner ring
    const dots = 12;
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      ctx.fillStyle = c.ink + '55';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * faceR * 0.76, Math.sin(a) * faceR * 0.76, R * 0.022, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central icon — embossed look (shadow then lit face)
    const iconSize = R * 0.5;
    ctx.font = `${iconSize}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shadow
    ctx.fillStyle = c.lo;
    ctx.fillText(isHeads ? '☀' : '☽', R * 0.022, -R * 0.04 + R * 0.022);
    // Face
    ctx.fillStyle = c.hi;
    ctx.fillText(isHeads ? '☀' : '☽', 0, -R * 0.04);

    // Label text
    ctx.font = `bold ${R * 0.145}px system-ui`;
    ctx.fillStyle = c.ink + 'cc';
    ctx.fillText(isHeads ? 'HEADS' : 'TAILS', 0, faceR * 0.54);
  }

  ctx.restore();
}

function flip() {
  if (flipping) return;
  flipping = true;
  const result = Math.random() < 0.5 ? 'H' : 'T';
  const totalFrames = 28;
  const mid = totalFrames / 2;
  let frame = 0;

  function animate() {
    frame++;
    const progress = frame / totalFrames;
    const scaleX = Math.cos(progress * Math.PI * 3);
    const currentSide = frame < mid ? side : result;
    drawCoin(scaleX, currentSide);
    if (frame < totalFrames) { requestAnimationFrame(animate); return; }
    side = result;
    flipping = false;
    if (result === 'H') { heads++; headsEl.textContent = heads; }
    else { tails++; tailsEl.textContent = tails; }
    statusEl.textContent = result === 'H' ? 'Heads ☀' : 'Tails ☽';
    drawCoin(1, side);
  }
  requestAnimationFrame(animate);
}

btnFlip.addEventListener('click', flip);
canvas.addEventListener('click', flip);

function onThemeChange() { drawCoin(1, side); }

drawCoin(1, null);
