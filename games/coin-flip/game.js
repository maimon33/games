const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const headsEl = document.getElementById('heads-count');
const tailsEl = document.getElementById('tails-count');
const headsLblEl = document.getElementById('heads-label');
const tailsLblEl = document.getElementById('tails-label');
const btnFlip = document.getElementById('btn-flip');
const btnTheme = document.getElementById('btn-theme');

let heads = 0, tails = 0, flipping = false, side = null, themeIdx = 0;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

// ── helpers ────────────────────────────────────────────────────────────────

function star5(cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    else ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

// ── theme draw functions ────────────────────────────────────────────────────

function drawLiberty(R, faceR, c) {
  const s = faceR * 0.95;
  ctx.save();
  ctx.fillStyle = c.ink + 'cc';

  // Bust
  ctx.beginPath();
  ctx.ellipse(s * 0.04, s * 0.38, s * 0.32, s * 0.26, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(s * 0.32, s * 0.72); ctx.lineTo(-s * 0.32, s * 0.72);
  ctx.closePath(); ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(s * 0.04, -s * 0.08, s * 0.14, s * 0.19, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Crown spikes (5)
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.3;
    ctx.beginPath();
    ctx.moveTo(s * 0.04 + Math.cos(a - 0.12) * s * 0.13, -s * 0.25 + Math.sin(a - 0.12) * s * 0.13);
    ctx.lineTo(s * 0.04 + Math.cos(a) * s * 0.4,         -s * 0.25 + Math.sin(a) * s * 0.4);
    ctx.lineTo(s * 0.04 + Math.cos(a + 0.12) * s * 0.13, -s * 0.25 + Math.sin(a + 0.12) * s * 0.13);
    ctx.closePath(); ctx.fill();
  }

  // Stars row
  ctx.fillStyle = c.ink + 'aa';
  for (let i = 0; i < 5; i++) { star5((-2 + i) * s * 0.2, -s * 0.67, R * 0.04); ctx.fill(); }

  // LIBERTY
  ctx.fillStyle = c.ink + 'cc';
  ctx.font = `bold ${R * 0.115}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('LIBERTY', 0, s * 0.74);
  ctx.restore();
}

function drawEagle(R, faceR, c) {
  const s = faceR * 0.9;
  ctx.save();
  ctx.fillStyle = c.ink + 'dd';

  // Left wing
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, -s * 0.04);
  ctx.bezierCurveTo(-s * 0.24, -s * 0.24, -s * 0.54, -s * 0.18, -s * 0.68, -s * 0.02);
  ctx.bezierCurveTo(-s * 0.5, s * 0.09, -s * 0.3, s * 0.14, -s * 0.08, s * 0.1);
  ctx.closePath(); ctx.fill();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(s * 0.08, -s * 0.04);
  ctx.bezierCurveTo(s * 0.24, -s * 0.24, s * 0.54, -s * 0.18, s * 0.68, -s * 0.02);
  ctx.bezierCurveTo(s * 0.5, s * 0.09, s * 0.3, s * 0.14, s * 0.08, s * 0.1);
  ctx.closePath(); ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, s * 0.18, s * 0.12, s * 0.21, 0, 0, Math.PI * 2);
  ctx.fill();

  // White head
  ctx.fillStyle = c.hi;
  ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.1, 0, Math.PI * 2); ctx.fill();

  // Tail feathers
  ctx.fillStyle = c.ink + 'cc';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s * 0.045, s * 0.37);
    ctx.lineTo((i - 0.4) * s * 0.045, s * 0.54);
    ctx.lineTo((i + 0.4) * s * 0.045, s * 0.54);
    ctx.closePath(); ctx.fill();
  }

  ctx.font = `${R * 0.083}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('E PLURIBUS UNUM', 0, s * 0.73);
  ctx.restore();
}

const STAR_POS = [[-.72,-.6],[.64,-.5],[-.5,.58],[.7,.46],[.1,-.77],[-.62,.17],[.44,.69]];

function drawSaturn(R, faceR, c) {
  const s = faceR;
  ctx.save();

  // Background stars
  ctx.fillStyle = c.ink;
  STAR_POS.forEach(([sx, sy]) => {
    ctx.beginPath(); ctx.arc(sx * s, sy * s, R * 0.022, 0, Math.PI * 2); ctx.fill();
  });

  // Ring back (behind planet)
  ctx.strokeStyle = c.rim1; ctx.lineWidth = s * 0.052;
  ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.62, s * 0.14, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = c.rim2; ctx.lineWidth = s * 0.032;
  ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.76, s * 0.17, 0, Math.PI, Math.PI * 2); ctx.stroke();

  // Planet body
  const grad = ctx.createRadialGradient(-s * 0.14, -s * 0.17, 0, 0, s * 0.05, s * 0.38);
  grad.addColorStop(0, c.hi); grad.addColorStop(0.6, c.mid); grad.addColorStop(1, c.lo);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.36, 0, Math.PI * 2); ctx.fill();

  // Bands
  ctx.strokeStyle = c.lo + '55'; ctx.lineWidth = s * 0.042;
  for (const oy of [-0.09, 0.07]) {
    ctx.save(); ctx.scale(1, 0.34);
    ctx.beginPath(); ctx.arc(0, (s * 0.05 + oy * s) / 0.34, s * 0.27, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Ring front
  ctx.strokeStyle = c.rim1; ctx.lineWidth = s * 0.052;
  ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.62, s * 0.14, 0, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = c.rim2; ctx.lineWidth = s * 0.032;
  ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.76, s * 0.17, 0, 0, Math.PI); ctx.stroke();

  ctx.fillStyle = c.ink;
  ctx.font = `bold ${R * 0.11}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ORBIT', 0, s * 0.74);
  ctx.restore();
}

const DIPPER = [[-0.4,-0.3],[-0.18,-0.42],[0.06,-0.4],[0.3,-0.32],[0.28,-0.07],[0.06,0.12],[-0.18,0.3]];
const BG_STARS = [[-.72,-.58],[.64,-.48],[-.5,.57],[.7,.45],[-.62,.16],[.44,.68],[.3,-.35],[-.38,.38]];

function drawConstellation(R, faceR, c) {
  const s = faceR;
  ctx.save();

  ctx.fillStyle = c.ink + 'cc';
  BG_STARS.forEach(([sx, sy]) => {
    ctx.beginPath(); ctx.arc(sx * s, sy * s, R * 0.018, 0, Math.PI * 2); ctx.fill();
  });

  // Dipper lines
  ctx.strokeStyle = c.ink + '68'; ctx.lineWidth = R * 0.016;
  ctx.beginPath();
  DIPPER.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x*s, y*s); else ctx.lineTo(x*s, y*s); });
  ctx.moveTo(DIPPER[0][0]*s, DIPPER[0][1]*s); ctx.lineTo(DIPPER[3][0]*s, DIPPER[3][1]*s);
  ctx.stroke();

  // Dipper stars
  ctx.fillStyle = c.hi;
  DIPPER.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x*s, y*s, R * 0.032, 0, Math.PI * 2); ctx.fill(); });

  // Polaris
  ctx.fillStyle = c.hi; star5(-s * 0.08, -s * 0.63, R * 0.052); ctx.fill();

  ctx.fillStyle = c.ink;
  ctx.font = `bold ${R * 0.11}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('STARS', 0, s * 0.74);
  ctx.restore();
}

function drawMenorah(R, faceR, c) {
  const s = faceR * 0.88;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // Base
  ctx.fillStyle = c.ink + 'ee';
  ctx.beginPath();
  ctx.moveTo(-s * 0.35, s * 0.55); ctx.lineTo(s * 0.35, s * 0.55);
  ctx.lineTo(s * 0.26, s * 0.46); ctx.lineTo(-s * 0.26, s * 0.46);
  ctx.closePath(); ctx.fill();

  // Main stem
  ctx.strokeStyle = c.ink + 'ee'; ctx.lineWidth = R * 0.048;
  ctx.beginPath(); ctx.moveTo(0, s * 0.46); ctx.lineTo(0, -s * 0.44); ctx.stroke();

  // 3 arms each side
  const armXs = [-0.44, -0.27, -0.13, 0.13, 0.27, 0.44];
  const joinYs = [-s * 0.06, -s * 0.17, -s * 0.28];
  const topYs  = [-s * 0.19, -s * 0.28, -s * 0.37];

  for (let i = 0; i < 6; i++) {
    const ax = armXs[i] * s;
    const idx = i < 3 ? 2 - i : i - 3;
    const jy = joinYs[idx], ty = topYs[idx];
    ctx.lineWidth = R * 0.032;
    ctx.strokeStyle = c.ink + 'ee';
    ctx.beginPath();
    ctx.moveTo(0, jy);
    ctx.quadraticCurveTo(ax * 0.45, jy + s * 0.06, ax, ty);
    ctx.stroke();
    // Candle
    ctx.lineWidth = R * 0.028;
    ctx.beginPath(); ctx.moveTo(ax, ty); ctx.lineTo(ax, ty - s * 0.07); ctx.stroke();
    // Flame
    ctx.fillStyle = '#f0b020';
    ctx.beginPath(); ctx.ellipse(ax, ty - s * 0.13, R * 0.022, R * 0.046, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Center candle & flame
  ctx.strokeStyle = c.ink + 'ee'; ctx.lineWidth = R * 0.028;
  ctx.beginPath(); ctx.moveTo(0, -s * 0.44); ctx.lineTo(0, -s * 0.51); ctx.stroke();
  ctx.fillStyle = '#f0b020';
  ctx.beginPath(); ctx.ellipse(0, -s * 0.58, R * 0.024, R * 0.05, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawShekelSign(R, faceR, c) {
  const s = faceR;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = c.ink + 'ee';

  ctx.font = `bold ${R * 0.82}px serif`;
  ctx.fillText('₪', 0, -s * 0.04);

  ctx.font = `${R * 0.115}px system-ui`;
  ctx.fillText('ישראל', 0, -s * 0.7);

  ctx.font = `bold ${R * 0.13}px serif`;
  ctx.fillText('½  ₪', 0, s * 0.7);
  ctx.restore();
}

function drawGlobe(R, faceR, c) {
  const s = faceR * 0.87;
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.clip();

  // Grid
  ctx.strokeStyle = c.ink + '32'; ctx.lineWidth = R * 0.013;
  for (let i = -3; i <= 3; i++) {
    const y = i * s * 0.28, r = Math.sqrt(Math.max(0, s*s - y*y));
    ctx.beginPath(); ctx.moveTo(-r, y); ctx.lineTo(r, y); ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 6);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.35, s, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Continents
  ctx.fillStyle = c.rim2 + 'c0';
  [
    [s * 0.14,  s * 0.05,  s * 0.14, s * 0.29,  0.2],
    [-s * 0.3,  s * 0.15,  s * 0.1,  s * 0.22, -0.2],
    [-s * 0.27, -s * 0.28, s * 0.14, s * 0.17,  0.3],
    [ s * 0.06, -s * 0.38, s * 0.12, s * 0.1,   0.3],
    [ s * 0.36, -s * 0.22, s * 0.22, s * 0.18, -0.2],
    [ s * 0.44,  s * 0.42, s * 0.1,  s * 0.08,  0.2],
  ].forEach(([cx, cy, rx, ry, rot]) => {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

function drawCompassRose(R, faceR, c) {
  const s = faceR * 0.84;
  ctx.save();

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const len = i % 2 === 0 ? s * 0.6 : s * 0.37;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - 0.17) * len * 0.3, Math.sin(a - 0.17) * len * 0.3);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.lineTo(Math.cos(a + 0.17) * len * 0.3, Math.sin(a + 0.17) * len * 0.3);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? c.ink + 'ee' : c.mid + 'bb';
    ctx.fill();
  }

  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.13);
  cg.addColorStop(0, c.hi); cg.addColorStop(1, c.mid);
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.13, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = c.ink;
  ctx.font = `bold ${R * 0.13}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const r2 = s * 0.76;
  ctx.fillText('N', 0, -r2); ctx.fillText('S', 0, r2);
  ctx.fillText('E', r2, 0);  ctx.fillText('W', -r2, 0);
  ctx.restore();
}

// ── themes ─────────────────────────────────────────────────────────────────

const THEMES = [
  {
    name: 'Liberty',
    headLabel: 'HEADS', tailLabel: 'TAILS',
    hc: { hi:'#f0f0fc', mid:'#b0b0cc', lo:'#3a3a52', rim1:'#8888a8', rim2:'#585870', ink:'#1e1e2a' },
    tc: { hi:'#f0f0fc', mid:'#b0b0cc', lo:'#3a3a52', rim1:'#8888a8', rim2:'#585870', ink:'#1e1e2a' },
    drawH: drawLiberty, drawT: drawEagle,
  },
  {
    name: 'Space',
    headLabel: 'ORBIT', tailLabel: 'STARS',
    hc: { hi:'#d0c8ff', mid:'#6848c8', lo:'#10082a', rim1:'#4838a8', rim2:'#282078', ink:'#e8e0ff' },
    tc: { hi:'#d0c8ff', mid:'#6848c8', lo:'#10082a', rim1:'#4838a8', rim2:'#282078', ink:'#e8e0ff' },
    drawH: drawSaturn, drawT: drawConstellation,
  },
  {
    name: 'Shekel',
    headLabel: 'ראש', tailLabel: 'זנב',
    hc: { hi:'#fffff0', mid:'#c8c030', lo:'#383000', rim1:'#808010', rim2:'#505008', ink:'#181800' },
    tc: { hi:'#fffff0', mid:'#c8c030', lo:'#383000', rim1:'#808010', rim2:'#505008', ink:'#181800' },
    drawH: drawMenorah, drawT: drawShekelSign,
  },
  {
    name: 'World',
    headLabel: 'HEADS', tailLabel: 'TAILS',
    hc: { hi:'#a8d8f8', mid:'#3878b8', lo:'#0c2840', rim1:'#2858a0', rim2:'#183878', ink:'#e0f4ff' },
    tc: { hi:'#a8e8a8', mid:'#389838', lo:'#0c280c', rim1:'#287828', rim2:'#184818', ink:'#e0ffe0' },
    drawH: drawGlobe, drawT: drawCompassRose,
  },
];

// ── core drawing ────────────────────────────────────────────────────────────

function drawCoin(scaleX, currentSide) {
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.41;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.abs(scaleX), 1);

  const th = THEMES[themeIdx];
  const isEdge = currentSide === null;
  const isHeads = currentSide === 'H';
  const c = isHeads ? th.hc : th.tc;
  const faceR = R * 0.86;

  // Milled edge
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

  // Face gradient
  const grad = ctx.createRadialGradient(-faceR * 0.28, -faceR * 0.28, faceR * 0.04, 0, 0, faceR * 1.05);
  grad.addColorStop(0, c.hi); grad.addColorStop(0.5, c.mid); grad.addColorStop(1, c.lo);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, faceR, 0, Math.PI * 2); ctx.fill();

  // Sheen
  const sheen = ctx.createRadialGradient(-faceR * 0.15, -faceR * 0.45, 0, -faceR * 0.15, -faceR * 0.45, faceR * 0.9);
  sheen.addColorStop(0, 'rgba(255,255,255,0.34)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath(); ctx.arc(0, 0, faceR, 0, Math.PI * 2); ctx.fill();

  if (!isEdge) {
    // Inner relief ring
    ctx.strokeStyle = c.ink + '48'; ctx.lineWidth = R * 0.018;
    ctx.beginPath(); ctx.arc(0, 0, faceR * 0.76, 0, Math.PI * 2); ctx.stroke();

    // Theme artwork
    if (isHeads) th.drawH(R, faceR, c);
    else th.drawT(R, faceR, c);
  }

  ctx.restore();
}

// ── theme cycling ───────────────────────────────────────────────────────────

function cycleTheme() {
  themeIdx = (themeIdx + 1) % THEMES.length;
  updateThemeUI();
  drawCoin(1, side);
}

function updateThemeUI() {
  const th = THEMES[themeIdx];
  btnTheme.textContent = th.name;
  headsLblEl.textContent = th.headLabel;
  tailsLblEl.textContent = th.tailLabel;
  if (side) statusEl.textContent = side === 'H' ? th.headLabel : th.tailLabel;
}

// ── flip ────────────────────────────────────────────────────────────────────

function flip() {
  if (flipping) return;
  flipping = true;
  const result = Math.random() < 0.5 ? 'H' : 'T';
  const totalFrames = 28, mid = totalFrames / 2;
  let frame = 0;
  function animate() {
    frame++;
    const progress = frame / totalFrames;
    const scaleX = Math.cos(progress * Math.PI * 3);
    drawCoin(scaleX, frame < mid ? side : result);
    if (frame < totalFrames) { requestAnimationFrame(animate); return; }
    side = result;
    flipping = false;
    if (result === 'H') { heads++; headsEl.textContent = heads; }
    else { tails++; tailsEl.textContent = tails; }
    const th = THEMES[themeIdx];
    statusEl.textContent = result === 'H' ? th.headLabel : th.tailLabel;
    drawCoin(1, side);
  }
  requestAnimationFrame(animate);
}

btnFlip.addEventListener('click', flip);
canvas.addEventListener('click', flip);
btnTheme.addEventListener('click', cycleTheme);

function onThemeChange() { drawCoin(1, side); }
function onLangChange() { updateThemeUI(); }

updateThemeUI();
drawCoin(1, null);
