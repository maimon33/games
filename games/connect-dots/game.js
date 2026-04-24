// Connect Dots — Flow Free clone
// Each puzzle: {size, dots: [[r1,c1,r2,c2], ...] per color}
// Player draws paths connecting each color pair; all cells must be filled.

const COLORS = ['#e05252','#52a0e0','#52e07c','#e0c452','#e07c52','#a052e0','#52e0d0','#e052b0'];

const LEVELS = [
  // 5x5
  {size:5, dots:[[0,0,4,4],[0,4,4,0],[1,1,3,3],[2,0,2,4]]},
  {size:5, dots:[[0,0,0,4],[4,0,4,4],[0,2,4,2],[2,1,2,3]]},
  {size:5, dots:[[0,0,2,4],[0,3,4,3],[1,0,3,0],[4,1,4,4],[2,2,0,4]]},
  {size:5, dots:[[0,0,4,2],[0,2,2,4],[0,4,4,0],[1,1,3,3],[3,1,1,3]]},
  // 6x6
  {size:6, dots:[[0,0,5,5],[0,5,5,0],[0,2,2,5],[3,0,5,2],[1,1,4,4],[2,2,3,3]]},
  {size:6, dots:[[0,0,0,5],[5,0,5,5],[0,2,5,2],[2,0,2,5],[1,1,4,4],[3,1,3,4]]},
  {size:6, dots:[[0,0,3,5],[0,3,5,3],[1,0,5,0],[1,4,4,4],[2,1,4,2],[0,5,5,5]]},
  {size:6, dots:[[0,1,5,4],[0,4,5,1],[1,0,4,5],[1,2,4,3],[2,0,3,5],[0,0,5,5],[2,3,3,2]]},
  // 7x7
  {size:7, dots:[[0,0,6,6],[0,6,6,0],[0,3,6,3],[3,0,3,6],[1,1,5,5],[1,4,5,2],[2,2,4,4]]},
  {size:7, dots:[[0,0,0,6],[6,0,6,6],[0,3,6,3],[3,0,3,6],[1,2,5,4],[2,1,4,5],[1,4,5,2],[2,5,4,1]]},
];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const levelLabel = document.getElementById('level-label');

let CELL, GRID_SIZE, dots, paths, dragging, levelIdx;

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize() {
  const size = Math.min(window.innerWidth - 32, 420);
  canvas.width = canvas.height = size;
  CELL = GRID_SIZE ? size / GRID_SIZE : size / 5;
  draw();
}

function initLevel(idx) {
  levelIdx = idx;
  const lvl = LEVELS[idx];
  GRID_SIZE = lvl.size;
  CELL = canvas.width / GRID_SIZE;
  dots = lvl.dots.map(([r1,c1,r2,c2], i) => ({color: COLORS[i % COLORS.length], r1, c1, r2, c2}));
  // paths: per color idx, array of {r,c}
  paths = dots.map(() => []);
  dragging = null;
  statusEl.textContent = '';
  statusEl.className = '';
  levelLabel.textContent = t('status.level', {n: idx + 1});
  draw();
}

function cellAt(r, c) {
  // returns color index if dot, else -1
  for (let i = 0; i < dots.length; i++) {
    const d = dots[i];
    if ((d.r1 === r && d.c1 === c) || (d.r2 === r && d.c2 === c)) return i;
  }
  return -1;
}

function pathColorAt(r, c) {
  for (let i = 0; i < paths.length; i++) {
    if (paths[i].some(p => p.r === r && p.c === c)) return i;
  }
  return -1;
}

function draw() {
  const surface = cv('--surface'), border = cv('--border');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = surface;
  ctx.beginPath(); ctx.roundRect(0, 0, canvas.width, canvas.height, 8); ctx.fill();

  // Grid
  ctx.strokeStyle = border; ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath(); ctx.moveTo(i*CELL, 0); ctx.lineTo(i*CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i*CELL); ctx.lineTo(canvas.width, i*CELL); ctx.stroke();
  }

  // Paths
  paths.forEach((path, i) => {
    if (path.length < 2) return;
    ctx.strokeStyle = dots[i].color;
    ctx.lineWidth = CELL * 0.35;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(path[0].c * CELL + CELL/2, path[0].r * CELL + CELL/2);
    for (let j = 1; j < path.length; j++) {
      ctx.lineTo(path[j].c * CELL + CELL/2, path[j].r * CELL + CELL/2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Dots
  const R = CELL * 0.3;
  dots.forEach((d, i) => {
    [[d.r1,d.c1],[d.r2,d.c2]].forEach(([r,c]) => {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(c*CELL + CELL/2, r*CELL + CELL/2, R, 0, Math.PI*2);
      ctx.fill();
    });
  });
}

function posToCell(mx, my) {
  return {r: Math.floor(my / CELL), c: Math.floor(mx / CELL)};
}

function adjacent(a, b) {
  return Math.abs(a.r-b.r) + Math.abs(a.c-b.c) === 1;
}

function startDrag(r, c) {
  const ci = cellAt(r, c);
  if (ci >= 0) {
    // start new path from this dot
    paths[ci] = [{r, c}];
    dragging = {ci, r, c};
    return;
  }
  // start from existing path
  const pi = pathColorAt(r, c);
  if (pi >= 0) {
    const idx = paths[pi].findIndex(p => p.r === r && p.c === c);
    paths[pi] = paths[pi].slice(0, idx + 1);
    dragging = {ci: pi, r, c};
  }
}

function continueDrag(r, c) {
  if (!dragging) return;
  const {ci} = dragging;
  const path = paths[ci];
  const last = path[path.length - 1];
  if (last.r === r && last.c === c) return;
  if (!adjacent(last, {r, c})) return;

  // Check if cell is a dot of another color — block
  const di = cellAt(r, c);
  if (di >= 0 && di !== ci) return;

  // Check if cell is occupied by another color's path — clear that path
  const pi = pathColorAt(r, c);
  if (pi >= 0 && pi !== ci) { paths[pi] = []; }

  // Check backtrack
  if (path.length >= 2) {
    const prev = path[path.length - 2];
    if (prev.r === r && prev.c === c) { path.pop(); dragging.r = r; dragging.c = c; draw(); return; }
  }

  // Check loop in own path
  if (path.some(p => p.r === r && p.c === c)) return;

  path.push({r, c});
  dragging.r = r; dragging.c = c;

  // Check if reached endpoint
  const d = dots[ci];
  const isEnd = (r === d.r2 && c === d.c2 && path[0].r === d.r1 && path[0].c === d.c1) ||
                (r === d.r1 && c === d.c1 && path[0].r === d.r2 && path[0].c === d.c2);
  if (isEnd) {
    dragging = null;
    draw();
    checkWin();
    return;
  }
  draw();
}

function endDrag() { dragging = null; draw(); checkWin(); }

function checkWin() {
  const total = GRID_SIZE * GRID_SIZE;
  const filled = paths.reduce((s, p) => s + p.length, 0);
  const allConnected = dots.every((d, i) => {
    const p = paths[i];
    if (p.length < 2) return false;
    const first = p[0], last = p[p.length-1];
    return ((first.r===d.r1&&first.c===d.c1&&last.r===d.r2&&last.c===d.c2) ||
            (first.r===d.r2&&first.c===d.c2&&last.r===d.r1&&last.c===d.c1));
  });
  if (allConnected && filled === total) {
    statusEl.textContent = t('status.solved');
    statusEl.className = 'win';
    launchConfetti();
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return {mx: (src.clientX - rect.left) * scaleX, my: (src.clientY - rect.top) * scaleY};
}

canvas.addEventListener('mousedown', e => {
  const {mx,my} = getPos(e);
  const {r,c} = posToCell(mx,my);
  if (r<0||r>=GRID_SIZE||c<0||c>=GRID_SIZE) return;
  startDrag(r,c); draw();
});
canvas.addEventListener('mousemove', e => {
  if (!dragging) return;
  const {mx,my} = getPos(e);
  const {r,c} = posToCell(mx,my);
  if (r<0||r>=GRID_SIZE||c<0||c>=GRID_SIZE) return;
  continueDrag(r,c);
});
canvas.addEventListener('mouseup', () => endDrag());

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const {mx,my} = getPos(e);
  const {r,c} = posToCell(mx,my);
  if (r<0||r>=GRID_SIZE||c<0||c>=GRID_SIZE) return;
  startDrag(r,c); draw();
}, {passive:false});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!dragging) return;
  const {mx,my} = getPos(e);
  const {r,c} = posToCell(mx,my);
  if (r<0||r>=GRID_SIZE||c<0||c>=GRID_SIZE) return;
  continueDrag(r,c);
}, {passive:false});
canvas.addEventListener('touchend', e => { e.preventDefault(); endDrag(); }, {passive:false});

document.getElementById('btn-reset').addEventListener('click', () => initLevel(levelIdx));
document.getElementById('btn-prev').addEventListener('click', () => { if (levelIdx > 0) initLevel(levelIdx - 1); });
document.getElementById('btn-next').addEventListener('click', () => { if (levelIdx < LEVELS.length - 1) initLevel(levelIdx + 1); });

function onThemeChange() { draw(); }

window.addEventListener('resize', resize);
resize();
initLevel(0);
