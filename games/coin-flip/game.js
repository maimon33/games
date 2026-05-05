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
const faceImages = {
  H: new Image(),
  T: new Image(),
};
let imagesLoaded = 0;

faceImages.H.onload = faceImages.T.onload = () => {
  imagesLoaded++;
  drawCoin(1, side);
};
faceImages.H.src = 'heads.svg';
faceImages.T.src = 'tails.svg';

const COIN = {
  silverHi: '#f6f8fc',
  silverMid: '#c7cfdb',
  silverLo: '#6e7787',
  rimHi: '#eef2f8',
  rimLo: '#727b8b',
  stroke: '#4b5565',
  shadow: 'rgba(3, 7, 18, 0.28)',
};

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

function drawFaceImage(faceR, currentSide) {
  const img = faceImages[currentSide];
  if (!img || !img.complete || !img.naturalWidth) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, faceR * 0.98, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, -faceR, -faceR, faceR * 2, faceR * 2);

  const sheen = ctx.createRadialGradient(-faceR * 0.18, -faceR * 0.58, 0, -faceR * 0.18, -faceR * 0.58, faceR * 0.95);
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(0.56, 'rgba(255,255,255,0.05)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(0, 0, faceR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCoin(scaleX, currentSide) {
  const { faceR } = drawCoinBase(scaleX);
  if (currentSide === null) {
    ctx.restore();
    return;
  }

  drawFaceImage(faceR, currentSide);

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
