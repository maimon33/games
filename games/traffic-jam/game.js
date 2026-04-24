// Traffic Jam — Rush Hour clone
// Grid: 6x6. Red car (id=0) is horizontal, must reach column 4-5 (exit on row 2, right wall).
// Each level: array of {id, row, col, len, dir} where dir='h'|'v'

const LEVELS = [
  // Level 1 — trivial
  [
    {id:0,row:2,col:1,len:2,dir:'h'},  // red car
    {id:1,row:0,col:2,len:2,dir:'v'},
    {id:2,row:3,col:1,len:2,dir:'h'},
  ],
  // Level 2
  [
    {id:0,row:2,col:0,len:2,dir:'h'},
    {id:1,row:0,col:2,len:3,dir:'v'},
    {id:2,row:2,col:3,len:2,dir:'v'},
    {id:3,row:4,col:0,len:3,dir:'h'},
  ],
  // Level 3
  [
    {id:0,row:2,col:1,len:2,dir:'h'},
    {id:1,row:0,col:3,len:2,dir:'v'},
    {id:2,row:2,col:3,len:2,dir:'v'},
    {id:3,row:1,col:0,len:2,dir:'h'},
    {id:4,row:4,col:1,len:3,dir:'h'},
  ],
  // Level 4
  [
    {id:0,row:2,col:0,len:2,dir:'h'},
    {id:1,row:0,col:2,len:2,dir:'v'},
    {id:2,row:0,col:4,len:2,dir:'v'},
    {id:3,row:2,col:2,len:2,dir:'h'},
    {id:4,row:2,col:4,len:2,dir:'v'},
    {id:5,row:4,col:0,len:3,dir:'h'},
  ],
  // Level 5
  [
    {id:0,row:2,col:1,len:2,dir:'h'},
    {id:1,row:0,col:0,len:3,dir:'v'},
    {id:2,row:0,col:3,len:2,dir:'h'},
    {id:3,row:1,col:3,len:2,dir:'v'},
    {id:4,row:2,col:3,len:2,dir:'v'},
    {id:5,row:4,col:1,len:2,dir:'h'},
    {id:6,row:3,col:4,len:2,dir:'v'},
  ],
  // Level 6
  [
    {id:0,row:2,col:0,len:2,dir:'h'},
    {id:1,row:0,col:2,len:2,dir:'v'},
    {id:2,row:0,col:4,len:3,dir:'v'},
    {id:3,row:2,col:2,len:2,dir:'v'},
    {id:4,row:3,col:0,len:2,dir:'h'},
    {id:5,row:4,col:2,len:2,dir:'h'},
    {id:6,row:5,col:0,len:3,dir:'h'},
  ],
  // Level 7
  [
    {id:0,row:2,col:1,len:2,dir:'h'},
    {id:1,row:0,col:0,len:2,dir:'v'},
    {id:2,row:0,col:2,len:3,dir:'v'},
    {id:3,row:0,col:4,len:2,dir:'h'},
    {id:4,row:1,col:4,len:2,dir:'v'},
    {id:5,row:2,col:3,len:3,dir:'v'},
    {id:6,row:4,col:0,len:2,dir:'h'},
    {id:7,row:5,col:2,len:3,dir:'h'},
  ],
  // Level 8
  [
    {id:0,row:2,col:0,len:2,dir:'h'},
    {id:1,row:0,col:2,len:2,dir:'v'},
    {id:2,row:0,col:4,len:2,dir:'h'},
    {id:3,row:1,col:3,len:2,dir:'v'},
    {id:4,row:2,col:2,len:2,dir:'h'},
    {id:5,row:2,col:4,len:3,dir:'v'},
    {id:6,row:3,col:0,len:3,dir:'v'},
    {id:7,row:4,col:1,len:2,dir:'h'},
    {id:8,row:5,col:3,len:3,dir:'h'},
  ],
  // Level 9
  [
    {id:0,row:2,col:2,len:2,dir:'h'},
    {id:1,row:0,col:0,len:3,dir:'v'},
    {id:2,row:0,col:2,len:2,dir:'v'},
    {id:3,row:0,col:4,len:2,dir:'v'},
    {id:4,row:2,col:0,len:2,dir:'h'},
    {id:5,row:3,col:2,len:2,dir:'v'},
    {id:6,row:3,col:4,len:2,dir:'v'},
    {id:7,row:4,col:0,len:2,dir:'h'},
    {id:8,row:5,col:2,len:3,dir:'h'},
  ],
  // Level 10
  [
    {id:0,row:2,col:1,len:2,dir:'h'},
    {id:1,row:0,col:0,len:2,dir:'v'},
    {id:2,row:0,col:2,len:2,dir:'v'},
    {id:3,row:0,col:4,len:3,dir:'v'},
    {id:4,row:1,col:1,len:2,dir:'h'},
    {id:5,row:2,col:3,len:2,dir:'v'},
    {id:6,row:3,col:0,len:3,dir:'h'},
    {id:7,row:4,col:3,len:2,dir:'h'},
    {id:8,row:5,col:0,len:2,dir:'v'},
    {id:9,row:5,col:2,len:2,dir:'h'},
  ],
];

const CAR_COLORS = ['#e05252','#52a0e0','#52e07c','#e0c452','#e07c52','#a052e0','#52e0d0','#e052b0','#8de052','#c0c0c0'];

const GRID = 6;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const levelLabel = document.getElementById('level-label');

let CELL, PAD, cars, selected, levelIdx, moves;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize() {
  const size = Math.min(window.innerWidth - 32, 420);
  canvas.width = canvas.height = size;
  CELL = size / GRID;
  PAD = CELL * 0.08;
  draw();
}

function deepCopy(lvl) {
  return lvl.map(c => ({...c}));
}

function buildGrid(carList) {
  const g = Array.from({length:GRID}, () => new Array(GRID).fill(-1));
  carList.forEach(c => {
    for (let i = 0; i < c.len; i++) {
      const r = c.dir === 'h' ? c.row : c.row + i;
      const col = c.dir === 'h' ? c.col + i : c.col;
      if (r >= 0 && r < GRID && col >= 0 && col < GRID) g[r][col] = c.id;
    }
  });
  return g;
}

function initLevel(idx) {
  levelIdx = idx;
  cars = deepCopy(LEVELS[idx]);
  selected = null;
  moves = 0;
  statusEl.textContent = '';
  statusEl.className = '';
  levelLabel.textContent = t('status.level', {n: idx + 1});
  draw();
}

function draw() {
  const bg = cv('--bg'), surface = cv('--surface'), border = cv('--border'), muted = cv('--muted'), accent = cv('--accent');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Board background
  ctx.fillStyle = surface;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
  ctx.fill();

  // Grid lines
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
  }

  // Exit arrow
  ctx.fillStyle = '#e05252';
  ctx.font = `bold ${CELL * 0.4}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('→', canvas.width - CELL * 0.25, 2.5 * CELL);

  // Cars
  cars.forEach(c => {
    const w = c.dir === 'h' ? c.len * CELL - PAD * 2 : CELL - PAD * 2;
    const h = c.dir === 'h' ? CELL - PAD * 2 : c.len * CELL - PAD * 2;
    const x = c.col * CELL + PAD;
    const y = c.row * CELL + PAD;

    ctx.fillStyle = CAR_COLORS[c.id % CAR_COLORS.length];
    ctx.globalAlpha = selected === c.id ? 1 : 0.85;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (selected === c.id) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${CELL * 0.35}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.id === 0 ? '★' : String.fromCharCode(65 + c.id - 1), x + w/2, y + h/2);
  });
}

function carAt(r, c) {
  const g = buildGrid(cars);
  const id = g[r] && g[r][c] !== undefined ? g[r][c] : -1;
  return id >= 0 ? cars.find(x => x.id === id) : null;
}

function tryMove(car, dir) {
  // dir: -1 or +1
  const g = buildGrid(cars);
  const steps = dir > 0 ? 1 : -1;
  if (car.dir === 'h') {
    const checkCol = dir > 0 ? car.col + car.len : car.col - 1;
    if (checkCol < 0 || checkCol >= GRID) return false;
    if (g[car.row][checkCol] !== -1) return false;
    car.col += steps;
  } else {
    const checkRow = dir > 0 ? car.row + car.len : car.row - 1;
    if (checkRow < 0 || checkRow >= GRID) return false;
    if (g[checkRow][car.col] !== -1) return false;
    car.row += steps;
  }
  moves++;
  return true;
}

function checkWin() {
  const red = cars.find(c => c.id === 0);
  return red && red.dir === 'h' && red.col + red.len >= GRID;
}

canvas.addEventListener('click', e => {
  if (statusEl.className === 'win') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const col = Math.floor(mx / CELL);
  const row = Math.floor(my / CELL);
  if (row < 0 || row >= GRID || col < 0 || col >= GRID) return;

  const clicked = carAt(row, col);

  if (selected === null) {
    if (clicked) { selected = clicked.id; draw(); }
    return;
  }

  const selCar = cars.find(c => c.id === selected);
  if (clicked && clicked.id === selected) {
    selected = null; draw(); return;
  }

  // Try to move selected car toward click
  if (selCar.dir === 'h') {
    const diff = col - (selCar.col + Math.floor(selCar.len / 2));
    if (diff !== 0) {
      const dir = diff > 0 ? 1 : -1;
      let moved = false;
      for (let i = 0; i < Math.abs(diff); i++) {
        if (!tryMove(selCar, dir)) break;
        moved = true;
      }
      if (moved) { selected = null; draw(); if (checkWin()) win(); return; }
    }
  } else {
    const diff = row - (selCar.row + Math.floor(selCar.len / 2));
    if (diff !== 0) {
      const dir = diff > 0 ? 1 : -1;
      let moved = false;
      for (let i = 0; i < Math.abs(diff); i++) {
        if (!tryMove(selCar, dir)) break;
        moved = true;
      }
      if (moved) { selected = null; draw(); if (checkWin()) win(); return; }
    }
  }

  if (clicked) { selected = clicked.id; }
  else { selected = null; }
  draw();
});

// Touch drag support
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (t.clientX - rect.left) * scaleX;
  const my = (t.clientY - rect.top) * scaleY;
  touchStart = {mx, my, col: Math.floor(mx/CELL), row: Math.floor(my/CELL)};
}, {passive:false});

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (t.clientX - rect.left) * scaleX;
  const my = (t.clientY - rect.top) * scaleY;
  const dx = mx - touchStart.mx, dy = my - touchStart.my;

  if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
    // treat as tap
    canvas.dispatchEvent(new MouseEvent('click', {clientX: t.clientX, clientY: t.clientY}));
    touchStart = null; return;
  }

  if (selected === null) {
    const car = carAt(touchStart.row, touchStart.col);
    if (car) { selected = car.id; }
    touchStart = null; return;
  }

  const selCar = cars.find(c => c.id === selected);
  if (!selCar) { touchStart = null; return; }

  if (selCar.dir === 'h' && Math.abs(dx) > Math.abs(dy)) {
    const steps = Math.round(dx / CELL);
    const dir = steps > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(steps); i++) { if (!tryMove(selCar, dir)) break; }
  } else if (selCar.dir === 'v' && Math.abs(dy) > Math.abs(dx)) {
    const steps = Math.round(dy / CELL);
    const dir = steps > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(steps); i++) { if (!tryMove(selCar, dir)) break; }
  }
  selected = null;
  draw();
  if (checkWin()) win();
  touchStart = null;
}, {passive:false});

function win() {
  statusEl.textContent = t('status.solved_moves', {n: moves});
  statusEl.className = 'win';
  draw();
  launchConfetti();
}

document.getElementById('btn-reset').addEventListener('click', () => initLevel(levelIdx));
document.getElementById('btn-prev').addEventListener('click', () => { if (levelIdx > 0) initLevel(levelIdx - 1); });
document.getElementById('btn-next').addEventListener('click', () => { if (levelIdx < LEVELS.length - 1) initLevel(levelIdx + 1); });

function onThemeChange() { draw(); }

window.addEventListener('resize', resize);
resize();
initLevel(0);
