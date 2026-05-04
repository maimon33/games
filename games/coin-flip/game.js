const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const headsEl = document.getElementById('heads-count');
const tailsEl = document.getElementById('tails-count');
const headsLblEl = document.getElementById('heads-label');
const tailsLblEl = document.getElementById('tails-label');
const btnFlip = document.getElementById('btn-flip');

let heads = 0;
let tails = 0;
let flipping = false;
let side = null;

const COIN = {
  silverHi: '#f6f8fc',
  silverMid: '#c7cfdb',
  silverLo: '#6e7787',
  rimHi: '#eef2f8',
  rimLo: '#727b8b',
  stroke: '#4b5565',
  shadow: 'rgba(3, 7, 18, 0.28)',
};

function star5(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawLetterArc(text, radius, startAngle, endAngle, size, upsideDown = false) {
  const chars = text.split('');
  if (!chars.length) return;
  ctx.save();
  ctx.font = `600 ${size}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  chars.forEach((ch, index) => {
    const t = chars.length === 1 ? 0.5 : index / (chars.length - 1);
    const angle = startAngle + (endAngle - startAngle) * t;
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(0, -radius);
    ctx.rotate(upsideDown ? angle + Math.PI : angle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function drawCoinBase(scaleX) {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.39;
  const faceR = R * 0.86;

  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.translate(cx, cy);

  const shadow = ctx.createRadialGradient(0, R * 0.45, 0, 0, R * 0.45, R * 1.2);
  shadow.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
  shadow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.62, R * 0.92, R * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(Math.abs(scaleX), 1);

  for (let i = 0; i < 96; i++) {
    const a1 = (i / 96) * Math.PI * 2;
    const a2 = ((i + 0.72) / 96) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(0, 0, R, a1, a2);
    ctx.arc(0, 0, faceR, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? COIN.rimHi : COIN.rimLo;
    ctx.fill();
  }

  const face = ctx.createRadialGradient(-faceR * 0.34, -faceR * 0.42, faceR * 0.04, 0, 0, faceR * 1.04);
  face.addColorStop(0, COIN.silverHi);
  face.addColorStop(0.46, COIN.silverMid);
  face.addColorStop(1, COIN.silverLo);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(0, 0, faceR, 0, Math.PI * 2);
  ctx.fill();

  const sheen = ctx.createRadialGradient(-faceR * 0.18, -faceR * 0.58, 0, -faceR * 0.18, -faceR * 0.58, faceR * 0.95);
  sheen.addColorStop(0, 'rgba(255,255,255,0.6)');
  sheen.addColorStop(0.46, 'rgba(255,255,255,0.1)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(0, 0, faceR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(74, 85, 104, 0.55)';
  ctx.lineWidth = R * 0.018;
  ctx.beginPath();
  ctx.arc(0, 0, faceR * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = R * 0.012;
  ctx.beginPath();
  ctx.arc(0, 0, faceR * 0.74, 0, Math.PI * 2);
  ctx.stroke();

  return { R, faceR };
}

function drawKennedyPortrait(faceR) {
  const s = faceR;
  ctx.save();
  ctx.translate(-s * 0.02, s * 0.06);

  ctx.fillStyle = 'rgba(66, 73, 86, 0.86)';

  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.34);
  ctx.quadraticCurveTo(-s * 0.18, s * 0.22, -s * 0.08, s * 0.16);
  ctx.quadraticCurveTo(s * 0.04, s * 0.08, s * 0.2, s * 0.12);
  ctx.quadraticCurveTo(s * 0.28, s * 0.2, s * 0.3, s * 0.32);
  ctx.quadraticCurveTo(s * 0.08, s * 0.5, -s * 0.16, s * 0.48);
  ctx.quadraticCurveTo(-s * 0.28, s * 0.43, -s * 0.3, s * 0.34);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-s * 0.16, -s * 0.32);
  ctx.quadraticCurveTo(-s * 0.03, -s * 0.48, s * 0.1, -s * 0.42);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.38, s * 0.18, -s * 0.18);
  ctx.quadraticCurveTo(s * 0.16, s * 0.02, s * 0.06, s * 0.12);
  ctx.quadraticCurveTo(-s * 0.04, s * 0.22, -s * 0.14, s * 0.14);
  ctx.quadraticCurveTo(-s * 0.26, s * 0.02, -s * 0.26, -s * 0.14);
  ctx.quadraticCurveTo(-s * 0.26, -s * 0.22, -s * 0.16, -s * 0.32);
  ctx.fill();

  ctx.fillStyle = 'rgba(245, 248, 252, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.26);
  ctx.quadraticCurveTo(s * 0.02, -s * 0.34, s * 0.1, -s * 0.22);
  ctx.quadraticCurveTo(s * 0.04, -s * 0.16, -s * 0.04, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.14, -s * 0.06, -s * 0.18, -s * 0.14);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(s * 0.05, -s * 0.02);
  ctx.quadraticCurveTo(s * 0.14, s * 0.08, s * 0.1, s * 0.24);
  ctx.quadraticCurveTo(s * 0.02, s * 0.28, -s * 0.02, s * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawObverse(faceR) {
  drawKennedyPortrait(faceR);

  ctx.save();
  ctx.fillStyle = 'rgba(56, 65, 81, 0.95)';
  drawLetterArc('LIBERTY', faceR * 0.82, -2.48, -0.66, faceR * 0.12);
  drawLetterArc('IN GOD WE TRUST', faceR * 0.77, 0.62, 2.48, faceR * 0.064, true);

  ctx.font = `600 ${faceR * 0.11}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1964', 0, faceR * 0.62);
  ctx.restore();
}

function drawShield(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y - h * 0.42);
  ctx.lineTo(x + w * 0.5, y - h * 0.42);
  ctx.lineTo(x + w * 0.4, y + h * 0.15);
  ctx.quadraticCurveTo(x, y + h * 0.52, x - w * 0.4, y + h * 0.15);
  ctx.closePath();
}

function drawReverse(faceR) {
  const s = faceR;
  ctx.save();

  ctx.fillStyle = 'rgba(61, 70, 86, 0.92)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, -s * 0.02);
  ctx.bezierCurveTo(-s * 0.22, -s * 0.3, -s * 0.48, -s * 0.28, -s * 0.62, -s * 0.1);
  ctx.bezierCurveTo(-s * 0.42, s * 0.03, -s * 0.22, s * 0.1, -s * 0.08, s * 0.09);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(s * 0.08, -s * 0.02);
  ctx.bezierCurveTo(s * 0.22, -s * 0.3, s * 0.48, -s * 0.28, s * 0.62, -s * 0.1);
  ctx.bezierCurveTo(s * 0.42, s * 0.03, s * 0.22, s * 0.1, s * 0.08, s * 0.09);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, s * 0.12, s * 0.11, s * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(245, 248, 252, 0.25)';
  ctx.beginPath();
  ctx.arc(0, -s * 0.08, s * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(61, 70, 86, 0.92)';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s * 0.036, s * 0.36);
    ctx.lineTo((i - 0.45) * s * 0.036, s * 0.5);
    ctx.lineTo((i + 0.45) * s * 0.036, s * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  drawShield(0, s * 0.08, s * 0.24, s * 0.34);
  ctx.fillStyle = 'rgba(245, 248, 252, 0.18)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(61, 70, 86, 0.82)';
  ctx.lineWidth = s * 0.02;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(61, 70, 86, 0.88)';
  ctx.lineWidth = s * 0.018;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.18);
  ctx.lineTo(0, s * 0.26);
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.09, -s * 0.12 + i * s * 0.08);
    ctx.lineTo(s * 0.09, -s * 0.12 + i * s * 0.08);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(61, 70, 86, 0.92)';
  drawLetterArc('UNITED STATES OF AMERICA', s * 0.86, -2.48, -0.64, s * 0.07);
  drawLetterArc('HALF DOLLAR', s * 0.84, 0.74, 2.42, s * 0.09, true);

  ctx.font = `600 ${s * 0.068}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E PLURIBUS UNUM', 0, s * 0.62);

  for (let i = 0; i < 13; i++) {
    const angle = -Math.PI / 2 + (i / 13) * Math.PI * 2;
    star5(Math.cos(angle) * s * 0.71, Math.sin(angle) * s * 0.71, s * 0.026);
    ctx.fill();
  }

  ctx.restore();
}

function drawCoin(scaleX, currentSide) {
  const { faceR } = drawCoinBase(scaleX);
  if (currentSide === null) {
    ctx.restore();
    return;
  }

  if (currentSide === 'H') drawObverse(faceR);
  else drawReverse(faceR);

  ctx.restore();
}

function updateLabels() {
  headsLblEl.textContent = 'HEADS';
  tailsLblEl.textContent = 'TAILS';
  if (side === 'H') statusEl.textContent = 'HEADS';
  if (side === 'T') statusEl.textContent = 'TAILS';
}

function flip() {
  if (flipping) return;
  flipping = true;
  const result = Math.random() < 0.5 ? 'H' : 'T';
  const totalFrames = 34;
  const mid = totalFrames / 2;
  let frame = 0;

  function animate() {
    frame++;
    const progress = frame / totalFrames;
    const scaleX = Math.cos(progress * Math.PI * 4);
    drawCoin(scaleX, frame < mid ? side : result);
    if (frame < totalFrames) {
      requestAnimationFrame(animate);
      return;
    }

    side = result;
    flipping = false;
    if (result === 'H') {
      heads++;
      headsEl.textContent = heads;
    } else {
      tails++;
      tailsEl.textContent = tails;
    }
    statusEl.textContent = result === 'H' ? 'HEADS' : 'TAILS';
    drawCoin(1, side);
  }

  requestAnimationFrame(animate);
}

btnFlip.addEventListener('click', flip);
canvas.addEventListener('click', flip);

function onThemeChange() {
  drawCoin(1, side);
}

function onLangChange() {
  updateLabels();
}

updateLabels();
drawCoin(1, null);
