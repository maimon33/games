const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const levelNumEl = document.getElementById('level-num');

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

const W = 320, H = 400;
const GRAVITY = 0.5;
const DAMPING = 0.98;
const CONSTRAINT_ITERS = 5;
const CANDY_RADIUS = 18;
const STAR_RADIUS = 10;
const OMNOM_X = 160, OMNOM_Y = 360;
const OMNOM_RADIUS = 28;
const MOUTH_RADIUS = 22;
const STAR_COLLECT_DIST = 20;
const CUT_DIST = 12;

let levelIdx = 0;
let state = 'playing'; // 'playing' | 'won' | 'lost' | 'alldone'
let points = [];
let constraints = [];
let stars = [];
let starsCollected = 0;
let winTimer = 0;
let rafId = null;

// ── Level definitions ────────────────────────────────────────────────────────

function buildLevel(idx) {
  const SEG_LEN = 30;

  switch (idx) {
    case 0: {
      // Single rope, anchor (160,0), 8 segments straight down, candy above mouth
      const N = 9; // 0..8, points[8] = candy
      const pts = [];
      for (let i = 0; i < N; i++) {
        pts.push({ x: 160, y: i * SEG_LEN, px: 160, py: i * SEG_LEN, pinned: i === 0 });
      }
      const cons = [];
      for (let i = 0; i < N - 1; i++) cons.push({ a: i, b: i + 1, restLen: SEG_LEN, active: true });
      return { points: pts, constraints: cons, candyIdx: N - 1, stars: [] };
    }

    case 1: {
      // Single rope angled from (280,20) to candy at right; star at (220,200)
      const anchor = { x: 280, y: 20 };
      const candy  = { x: 250, y: 200 };
      const N = 7;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        pts.push({ x: anchor.x + (candy.x - anchor.x) * t, y: anchor.y + (candy.y - anchor.y) * t,
                   px: anchor.x + (candy.x - anchor.x) * t, py: anchor.y + (candy.y - anchor.y) * t,
                   pinned: i === 0 });
      }
      const dx = candy.x - anchor.x, dy = candy.y - anchor.y;
      const segLen = Math.sqrt(dx * dx + dy * dy) / (N - 1);
      const cons = [];
      for (let i = 0; i < N - 1; i++) cons.push({ a: i, b: i + 1, restLen: segLen, active: true });
      return { points: pts, constraints: cons, candyIdx: N - 1,
               stars: [{ x: 220, y: 200, collected: false }] };
    }

    case 2: {
      // Two ropes sharing candy: rope1 anchor (80,10), rope2 anchor (240,10)
      // Layout: [anchor1=0, r1p1=1, r1p2=2, candy=3, r2p1=4, r2p2=5, anchor2=6]
      const a1 = { x: 80,  y: 10 };
      const a2 = { x: 240, y: 10 };
      const cy = 200;
      const cx = 160;

      function interp(p1, p2, t) {
        return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
      }

      const candy = { x: cx, y: cy };
      const p1a = interp(a1, candy, 1/3);
      const p1b = interp(a1, candy, 2/3);
      const p2a = interp(a2, candy, 1/3);
      const p2b = interp(a2, candy, 2/3);

      const pts = [
        { x: a1.x, y: a1.y, px: a1.x, py: a1.y, pinned: true },   // 0 anchor1
        { x: p1a.x, y: p1a.y, px: p1a.x, py: p1a.y, pinned: false }, // 1
        { x: p1b.x, y: p1b.y, px: p1b.x, py: p1b.y, pinned: false }, // 2
        { x: cx, y: cy, px: cx, py: cy, pinned: false },              // 3 candy
        { x: p2a.x, y: p2a.y, px: p2a.x, py: p2a.y, pinned: false }, // 4
        { x: p2b.x, y: p2b.y, px: p2b.x, py: p2b.y, pinned: false }, // 5
        { x: a2.x, y: a2.y, px: a2.x, py: a2.y, pinned: true },   // 6 anchor2
      ];

      const segLen1 = Math.hypot(candy.x - a1.x, candy.y - a1.y) / 3;
      const segLen2 = Math.hypot(candy.x - a2.x, candy.y - a2.y) / 3;

      const cons = [
        { a: 0, b: 1, restLen: segLen1, active: true },
        { a: 1, b: 2, restLen: segLen1, active: true },
        { a: 2, b: 3, restLen: segLen1, active: true },
        { a: 6, b: 5, restLen: segLen2, active: true },
        { a: 5, b: 4, restLen: segLen2, active: true },
        { a: 4, b: 3, restLen: segLen2, active: true },
      ];

      return { points: pts, constraints: cons, candyIdx: 3,
               stars: [
                 { x: 100, y: 180, collected: false },
                 { x: 220, y: 180, collected: false },
               ]};
    }

    case 3: {
      // Single rope from (160,0), candy starts high; stars at sides and middle
      const N = 9;
      const pts = [];
      for (let i = 0; i < N; i++) {
        pts.push({ x: 160, y: i * SEG_LEN, px: 160, py: i * SEG_LEN, pinned: i === 0 });
      }
      const cons = [];
      for (let i = 0; i < N - 1; i++) cons.push({ a: i, b: i + 1, restLen: SEG_LEN, active: true });
      return { points: pts, constraints: cons, candyIdx: N - 1,
               stars: [
                 { x: 80,  y: 200, collected: false },
                 { x: 240, y: 200, collected: false },
                 { x: 160, y: 280, collected: false },
               ]};
    }

    case 4: {
      // Two ropes: rope1 anchor (40,80), rope2 anchor (280,80); stars at three spots
      const a1 = { x: 40,  y: 80 };
      const a2 = { x: 280, y: 80 };
      const cx = 160, cy = 220;

      function interp(p1, p2, t) {
        return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
      }

      const p1a = interp(a1, { x: cx, y: cy }, 1/3);
      const p1b = interp(a1, { x: cx, y: cy }, 2/3);
      const p2a = interp(a2, { x: cx, y: cy }, 1/3);
      const p2b = interp(a2, { x: cx, y: cy }, 2/3);

      const pts = [
        { x: a1.x, y: a1.y, px: a1.x, py: a1.y, pinned: true },
        { x: p1a.x, y: p1a.y, px: p1a.x, py: p1a.y, pinned: false },
        { x: p1b.x, y: p1b.y, px: p1b.x, py: p1b.y, pinned: false },
        { x: cx, y: cy, px: cx, py: cy, pinned: false },
        { x: p2a.x, y: p2a.y, px: p2a.x, py: p2a.y, pinned: false },
        { x: p2b.x, y: p2b.y, px: p2b.x, py: p2b.y, pinned: false },
        { x: a2.x, y: a2.y, px: a2.x, py: a2.y, pinned: true },
      ];

      const segLen1 = Math.hypot(cx - a1.x, cy - a1.y) / 3;
      const segLen2 = Math.hypot(cx - a2.x, cy - a2.y) / 3;

      const cons = [
        { a: 0, b: 1, restLen: segLen1, active: true },
        { a: 1, b: 2, restLen: segLen1, active: true },
        { a: 2, b: 3, restLen: segLen1, active: true },
        { a: 6, b: 5, restLen: segLen2, active: true },
        { a: 5, b: 4, restLen: segLen2, active: true },
        { a: 4, b: 3, restLen: segLen2, active: true },
      ];

      return { points: pts, constraints: cons, candyIdx: 3,
               stars: [
                 { x: 60,  y: 220, collected: false },
                 { x: 160, y: 180, collected: false },
                 { x: 260, y: 220, collected: false },
               ]};
    }

    default:
      return buildLevel(0);
  }
}

// ── Physics ──────────────────────────────────────────────────────────────────

function stepPhysics() {
  for (const p of points) {
    if (p.pinned) continue;
    const vx = (p.x - p.px) * DAMPING;
    const vy = (p.y - p.py) * DAMPING;
    p.px = p.x; p.py = p.y;
    p.x += vx;
    p.y += vy + GRAVITY;
  }

  for (let iter = 0; iter < CONSTRAINT_ITERS; iter++) {
    for (const c of constraints) {
      if (!c.active) continue;
      const pa = points[c.a], pb = points[c.b];
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;
      const factor = (dist - c.restLen) / dist;
      if (pa.pinned) {
        pb.x -= dx * factor;
        pb.y -= dy * factor;
      } else if (pb.pinned) {
        pa.x += dx * factor;
        pa.y += dy * factor;
      } else {
        pa.x += dx * factor * 0.5;
        pa.y += dy * factor * 0.5;
        pb.x -= dx * factor * 0.5;
        pb.y -= dy * factor * 0.5;
      }
    }
  }
}

// ── Cut detection ─────────────────────────────────────────────────────────────

function tryCut(cx, cy) {
  // Find which rope segments are visible as sequential chains
  // We test midpoints of consecutive points connected by active constraints
  for (const c of constraints) {
    if (!c.active) continue;
    const pa = points[c.a], pb = points[c.b];
    const mx = (pa.x + pb.x) / 2;
    const my = (pa.y + pb.y) / 2;
    const dx = cx - mx, dy = cy - my;
    if (Math.sqrt(dx * dx + dy * dy) <= CUT_DIST) {
      c.active = false;
      return true;
    }
  }
  return false;
}

// ── Win/lose checks ───────────────────────────────────────────────────────────

function checkCollections(candyIdx) {
  const cp = points[candyIdx];
  for (const s of stars) {
    if (s.collected) continue;
    if (Math.hypot(cp.x - s.x, cp.y - s.y) <= STAR_COLLECT_DIST) {
      s.collected = true;
      starsCollected++;
    }
  }
}

function checkWin(candyIdx) {
  const cp = points[candyIdx];
  return Math.hypot(cp.x - OMNOM_X, cp.y - OMNOM_Y) <= MOUTH_RADIUS;
}

function checkLose(candyIdx) {
  const cp = points[candyIdx];
  return cp.y > H + 100 || cp.x < -100 || cp.x > W + 100;
}

// ── Drawing ───────────────────────────────────────────────────────────────────

function drawRopes() {
  // Build forward adjacency map for active constraints
  const activeByA = {};
  for (const c of constraints) {
    if (!c.active) continue;
    if (!activeByA[c.a]) activeByA[c.a] = [];
    activeByA[c.a].push(c.b);
  }

  // Chain starts: active 'a' indices that are not any active 'b'
  const activeBSet = new Set();
  for (const c of constraints) {
    if (c.active) activeBSet.add(c.b);
  }

  const startsSet = new Set();
  for (const c of constraints) {
    if (c.active && !activeBSet.has(c.a)) startsSet.add(c.a);
  }
  const starts = [...startsSet];

  for (const startIdx of starts) {
    const chain = [startIdx];
    let cur = startIdx;
    while (activeByA[cur] && activeByA[cur].length > 0) {
      const next = activeByA[cur][0];
      chain.push(next);
      cur = next;
    }
    if (chain.length < 2) continue;

    ctx.beginPath();
    ctx.strokeStyle = '#a07060';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(points[chain[0]].x, points[chain[0]].y);
    for (let i = 1; i < chain.length; i++) {
      ctx.lineTo(points[chain[i]].x, points[chain[i]].y);
    }
    ctx.stroke();
  }
}

function drawStars() {
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, STAR_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = s.collected ? '#555544' : '#f5d020';
    ctx.fill();
    if (!s.collected) {
      ctx.fillStyle = '#fff';
      ctx.font = `${STAR_RADIUS * 1.4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', s.x, s.y);
    }
  }
}

function drawCandy(candyIdx) {
  const cp = points[candyIdx];
  const grad = ctx.createRadialGradient(cp.x - 6, cp.y - 6, 2, cp.x, cp.y, CANDY_RADIUS);
  grad.addColorStop(0, '#ff6b6b');
  grad.addColorStop(1, '#c0392b');
  ctx.beginPath();
  ctx.arc(cp.x, cp.y, CANDY_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  // shine
  ctx.beginPath();
  ctx.arc(cp.x - 6, cp.y - 6, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
}

function drawOmNom(mouthOpen) {
  const x = OMNOM_X, y = OMNOM_Y;

  // Body
  ctx.beginPath();
  ctx.arc(x, y, OMNOM_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#3cb371';
  ctx.fill();
  ctx.strokeStyle = '#2a8a52';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Eyes
  const eyeR = 7;
  const eyeOffX = 10, eyeOffY = -10;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + sign * eyeOffX, y + eyeOffY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + sign * eyeOffX + 1, y + eyeOffY + 1, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
  }

  // Mouth (open ellipse when expecting candy, smile otherwise)
  if (mouthOpen) {
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 14, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 10, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x, y + 4, 12, 0, Math.PI);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function isCandyNearMouth(candyIdx) {
  const cp = points[candyIdx];
  return Math.hypot(cp.x - OMNOM_X, cp.y - OMNOM_Y) < 60;
}

function draw(candyIdx) {
  ctx.fillStyle = cv('--bg');
  ctx.fillRect(0, 0, W, H);

  drawOmNom(isCandyNearMouth(candyIdx));
  drawStars();
  drawRopes();
  drawCandy(candyIdx);
}

// ── Game loop ─────────────────────────────────────────────────────────────────

let _candyIdx = 0;

function advanceLevel() {
  levelIdx++;
  const lvl = buildLevel(levelIdx);
  points = lvl.points;
  constraints = lvl.constraints;
  stars = lvl.stars;
  starsCollected = 0;
  _candyIdx = lvl.candyIdx;
  state = 'playing';
  winTimer = 0;
  levelNumEl.textContent = levelIdx + 1;
  statusEl.textContent = '';
  statusEl.className = '';
}

function loop() {
  if (state === 'playing') {
    stepPhysics();
    checkCollections(_candyIdx);
    if (checkWin(_candyIdx)) {
      state = 'won';
      winTimer = 0;
      const starStr = '★'.repeat(starsCollected);
      statusEl.textContent = (starStr ? starStr + ' ' : '') + t('status.level_cleared_next');
      statusEl.className = 'win';
      if (typeof launchConfetti === 'function') launchConfetti();
    } else if (checkLose(_candyIdx)) {
      state = 'lost';
      statusEl.textContent = t('status.level_failed');
      statusEl.className = 'lose';
    }
  } else if (state === 'won') {
    stepPhysics();
    winTimer++;
    if (winTimer >= 60) {
      if (levelIdx < 4) {
        advanceLevel();
      } else {
        state = 'alldone';
        statusEl.textContent = '★★★ All levels complete! ★★★';
        statusEl.className = 'win';
        if (typeof launchConfetti === 'function') launchConfetti();
      }
    }
  }

  draw(_candyIdx);
  rafId = requestAnimationFrame(loop);
}

// ── Input ─────────────────────────────────────────────────────────────────────

function handleClick(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width, scaleY = H / rect.height;
  let cx, cy;
  if (e.touches) {
    cx = (e.touches[0].clientX - rect.left) * scaleX;
    cy = (e.touches[0].clientY - rect.top) * scaleY;
  } else {
    cx = (e.clientX - rect.left) * scaleX;
    cy = (e.clientY - rect.top) * scaleY;
  }

  if (state === 'lost' || state === 'alldone') {
    if (state === 'lost') {
      const lvl = buildLevel(levelIdx);
      points = lvl.points;
      constraints = lvl.constraints;
      stars = lvl.stars;
      starsCollected = 0;
      _candyIdx = lvl.candyIdx;
      state = 'playing';
      winTimer = 0;
      statusEl.textContent = '';
      statusEl.className = '';
    }
    return;
  }

  if (state === 'playing') {
    tryCut(cx, cy);
  }
}

canvas.addEventListener('mousedown', handleClick);
canvas.addEventListener('touchstart', handleClick, { passive: false });

// ── Init ──────────────────────────────────────────────────────────────────────

function onThemeChange() { /* canvas redraws every frame */ }
function onLangChange() {}

{
  const lvl = buildLevel(levelIdx);
  points = lvl.points;
  constraints = lvl.constraints;
  stars = lvl.stars;
  _candyIdx = lvl.candyIdx;
  starsCollected = 0;
  state = 'playing';
  levelNumEl.textContent = 1;
}

loop();
