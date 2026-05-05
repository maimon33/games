// The Witness — panel path-drawing puzzle
// Nodes at (r,c), cells between nodes, path divides grid into regions.

const LEVELS = [
  // 1: 3×3, intro — just reach exit
  { N:3, start:{r:0,c:0}, exit:{r:2,c:2}, walls:[], symbols:[] },
  // 2: 3×3, wall maze
  { N:3, start:{r:0,c:0}, exit:{r:0,c:2},
    walls:[[[0,0],[1,0]],[[1,0],[1,1]],[[1,1],[1,2]],[[0,1],[0,2]]],
    symbols:[] },
  // 3: 3×3, simple color separation
  { N:3, start:{r:2,c:0}, exit:{r:0,c:2},
    walls:[],
    symbols:[{r:0,c:0,color:'black'},{r:1,c:1,color:'white'}] },
  // 4: 4×4, wall maze
  { N:4, start:{r:0,c:0}, exit:{r:3,c:3},
    walls:[[[0,1],[1,1]],[[1,0],[1,1]],[[1,1],[2,1]],[[2,1],[2,2]],[[2,2],[3,2]]],
    symbols:[] },
  // 5: 3×3, color separation with walls
  { N:3, start:{r:0,c:0}, exit:{r:2,c:2},
    walls:[[[0,1],[1,1]]],
    symbols:[{r:0,c:0,color:'black'},{r:0,c:1,color:'black'},{r:1,c:1,color:'white'}] },
  // 6: 4×4, color separation
  { N:4, start:{r:0,c:0}, exit:{r:3,c:3},
    walls:[],
    symbols:[{r:0,c:0,color:'black'},{r:0,c:1,color:'black'},{r:1,c:2,color:'white'},{r:2,c:2,color:'white'}] },
  // 7: 4×4, harder maze with symbols
  { N:4, start:{r:0,c:0}, exit:{r:0,c:3},
    walls:[[[0,1],[0,2]],[[1,1],[1,2]],[[2,0],[2,1]],[[2,2],[2,3]],[[3,1],[3,2]]],
    symbols:[{r:0,c:1,color:'black'},{r:2,c:1,color:'white'}] },
  // 8: 5×5, complex
  { N:5, start:{r:0,c:0}, exit:{r:4,c:4},
    walls:[[[0,2],[1,2]],[[1,1],[1,2]],[[2,1],[3,1]],[[3,2],[3,3]],[[2,3],[2,4]]],
    symbols:[{r:0,c:0,color:'black'},{r:1,c:3,color:'white'},{r:3,c:1,color:'black'},{r:3,c:3,color:'white'}] },
  // 9: 4×4, mirrored maze
  { N:4, start:{r:3,c:0}, exit:{r:0,c:3},
    walls:[[[0,1],[1,1]],[[1,1],[1,2]],[[2,0],[2,1]],[[2,2],[3,2]]],
    symbols:[] },
  // 10: 4×4, open separation
  { N:4, start:{r:0,c:3}, exit:{r:3,c:0},
    walls:[],
    symbols:[{r:0,c:0,color:'black'},{r:0,c:1,color:'black'},{r:2,c:1,color:'white'},{r:2,c:2,color:'white'}] },
  // 11: 5×5, vertical gates
  { N:5, start:{r:4,c:0}, exit:{r:0,c:4},
    walls:[[[0,1],[1,1]],[[1,3],[2,3]],[[2,1],[3,1]],[[3,2],[3,3]],[[1,0],[1,1]]],
    symbols:[] },
  // 12: 5×5, quadrant separation
  { N:5, start:{r:0,c:4}, exit:{r:4,c:0},
    walls:[],
    symbols:[{r:0,c:0,color:'black'},{r:1,c:1,color:'black'},{r:2,c:2,color:'white'},{r:3,c:3,color:'white'}] },
  // 13: 5×5, walls and split colors
  { N:5, start:{r:2,c:0}, exit:{r:2,c:4},
    walls:[[[0,2],[1,2]],[[1,1],[1,2]],[[2,2],[3,2]],[[3,2],[3,3]],[[1,3],[2,3]]],
    symbols:[{r:0,c:0,color:'black'},{r:1,c:0,color:'black'},{r:2,c:3,color:'white'},{r:3,c:3,color:'white'}] },
  // 14: 6×6, long route
  { N:6, start:{r:0,c:0}, exit:{r:5,c:5},
    walls:[[[0,2],[1,2]],[[1,2],[1,3]],[[2,1],[2,2]],[[2,4],[3,4]],[[3,2],[4,2]],[[4,3],[4,4]]],
    symbols:[] },
  // 15: 6×6, broad color split
  { N:6, start:{r:5,c:0}, exit:{r:0,c:5},
    walls:[],
    symbols:[{r:0,c:0,color:'black'},{r:1,c:1,color:'black'},{r:3,c:3,color:'white'},{r:4,c:4,color:'white'}] },
  // 16: 6×6, final mixed panel
  { N:6, start:{r:0,c:5}, exit:{r:5,c:0},
    walls:[[[0,3],[1,3]],[[1,1],[1,2]],[[2,4],[3,4]],[[3,2],[3,3]],[[4,1],[5,1]],[[4,3],[4,4]]],
    symbols:[{r:0,c:1,color:'black'},{r:1,c:3,color:'black'},{r:3,c:1,color:'white'},{r:4,c:3,color:'white'}] },
];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const levelNumEl = document.getElementById('level-num');
const levelTotalEl = document.getElementById('level-total');

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

const PAD = 40;
let levelIdx = 0;
let lvl, path, drawing, won;

// ----- geometry -----

function spacing() { return (canvas.width - 2 * PAD) / (lvl.N - 1); }

function nodeX(c) { return PAD + c * spacing(); }
function nodeY(r) { return PAD + r * spacing(); }

function nodeAt(px, py) {
  const sp = spacing();
  const snap = Math.min(sp * 0.45, 22);
  for (let r = 0; r < lvl.N; r++) {
    for (let c = 0; c < lvl.N; c++) {
      const dx = px - nodeX(c), dy = py - nodeY(r);
      if (Math.sqrt(dx*dx + dy*dy) <= snap) return {r, c};
    }
  }
  return null;
}

function edgeKey(r1, c1, r2, c2) {
  if (r1 > r2 || (r1 === r2 && c1 > c2)) return `${r2},${c2}-${r1},${c1}`;
  return `${r1},${c1}-${r2},${c2}`;
}

function isWall(r1, c1, r2, c2) {
  const key = edgeKey(r1, c1, r2, c2);
  return lvl.walls.some(([a, b]) => edgeKey(a[0],a[1],b[0],b[1]) === key);
}

function adjacent(a, b) {
  return (Math.abs(a.r-b.r) + Math.abs(a.c-b.c)) === 1;
}

function exitDir() {
  const e = lvl.exit;
  if (e.r === 0) return 'up';
  if (e.r === lvl.N-1) return 'down';
  if (e.c === 0) return 'left';
  return 'right';
}

// ----- path edge set -----

function buildPathEdgeSet(p) {
  const s = new Set();
  for (let i = 0; i < p.length - 1; i++) {
    s.add(edgeKey(p[i].r, p[i].c, p[i+1].r, p[i+1].c));
  }
  return s;
}

// ----- flood fill cells -----
// cell (r,c) is between nodes (r,c),(r,c+1),(r+1,c),(r+1,c+1)
// moving cell(r,c)→cell(r+1,c) crosses node-edge (r+1,c)-(r+1,c+1) [horizontal]
// moving cell(r,c)→cell(r,c+1) crosses node-edge (r,c+1)-(r+1,c+1) [vertical]

function floodFillCells(pathEdges) {
  const N = lvl.N;
  const cells = N - 1; // number of cell rows/cols
  const region = Array.from({length: cells}, () => new Array(cells).fill(-1));
  let nextRegion = 0;

  function canMoveCellDown(r, c) {
    // crossing horizontal edge between nodes (r+1,c) and (r+1,c+1)
    return !pathEdges.has(edgeKey(r+1, c, r+1, c+1));
  }
  function canMoveCellRight(r, c) {
    // crossing vertical edge between nodes (r,c+1) and (r+1,c+1)
    return !pathEdges.has(edgeKey(r, c+1, r+1, c+1));
  }

  for (let sr = 0; sr < cells; sr++) {
    for (let sc = 0; sc < cells; sc++) {
      if (region[sr][sc] !== -1) continue;
      const id = nextRegion++;
      const queue = [{r: sr, c: sc}];
      region[sr][sc] = id;
      while (queue.length) {
        const {r, c} = queue.shift();
        // up
        if (r > 0 && region[r-1][c] === -1 && canMoveCellDown(r-1, c)) {
          region[r-1][c] = id; queue.push({r:r-1, c});
        }
        // down
        if (r < cells-1 && region[r+1][c] === -1 && canMoveCellDown(r, c)) {
          region[r+1][c] = id; queue.push({r:r+1, c});
        }
        // left
        if (c > 0 && region[r][c-1] === -1 && canMoveCellRight(r, c-1)) {
          region[r][c-1] = id; queue.push({r, c:c-1});
        }
        // right
        if (c < cells-1 && region[r][c+1] === -1 && canMoveCellRight(r, c)) {
          region[r][c+1] = id; queue.push({r, c:c+1});
        }
      }
    }
  }
  return region;
}

// ----- validate -----

function validatePath() {
  if (!path.length) return false;
  const first = path[0];
  const last = path[path.length - 1];
  if (first.r !== lvl.start.r || first.c !== lvl.start.c) return false;
  if (last.r !== lvl.exit.r || last.c !== lvl.exit.c) return false;
  if (!lvl.symbols.length) return true;

  const pathEdges = buildPathEdgeSet(path);
  const region = floodFillCells(pathEdges);

  // group symbols by region
  const regionColors = {};
  for (const sym of lvl.symbols) {
    const rid = region[sym.r][sym.c];
    if (regionColors[rid] === undefined) {
      regionColors[rid] = sym.color;
    } else if (regionColors[rid] !== sym.color) {
      return false;
    }
  }
  return true;
}

// ----- init / reset -----

function initLevel(idx) {
  levelIdx = idx;
  lvl = LEVELS[idx];
  path = [];
  drawing = false;
  won = false;
  statusEl.textContent = '';
  statusEl.className = '';
  levelNumEl.textContent = idx + 1;
  levelTotalEl.textContent = LEVELS.length;
  draw();
}

function resetLevel() {
  path = [];
  drawing = false;
  won = false;
  statusEl.textContent = '';
  statusEl.className = '';
  draw();
}

// ----- draw -----

function draw() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // panel background
  ctx.fillStyle = cv('--surface');
  ctx.beginPath();
  ctx.roundRect(4, 4, w-8, h-8, 10);
  ctx.fill();

  drawGrid();
  drawSymbols();
  drawExit();
  drawPath();
  drawStart();
}

function drawGrid() {
  const N = lvl.N;
  ctx.strokeStyle = cv('--border');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      // horizontal edge to (r, c+1)
      if (c < N-1 && !isWall(r, c, r, c+1)) {
        ctx.beginPath();
        ctx.moveTo(nodeX(c), nodeY(r));
        ctx.lineTo(nodeX(c+1), nodeY(r));
        ctx.stroke();
      }
      // vertical edge to (r+1, c)
      if (r < N-1 && !isWall(r, c, r+1, c)) {
        ctx.beginPath();
        ctx.moveTo(nodeX(c), nodeY(r));
        ctx.lineTo(nodeX(c), nodeY(r+1));
        ctx.stroke();
      }
    }
  }
}

function drawSymbols() {
  const sp = spacing();
  const size = sp * 0.28;
  for (const sym of lvl.symbols) {
    const cx = nodeX(sym.c) + sp / 2;
    const cy = nodeY(sym.r) + sp / 2;
    ctx.fillStyle = sym.color === 'black' ? '#1a1a1a' : '#eeeeee';
    ctx.strokeStyle = sym.color === 'black' ? '#555' : '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(cx - size, cy - size, size*2, size*2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawExit() {
  const e = lvl.exit;
  const ex = nodeX(e.c), ey = nodeY(e.r);
  const len = 22;
  const dir = exitDir();
  let tx = ex, ty = ey;
  if (dir === 'up')    ty = ey - len;
  if (dir === 'down')  ty = ey + len;
  if (dir === 'left')  tx = ex - len;
  if (dir === 'right') tx = ex + len;

  ctx.strokeStyle = cv('--border');
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // if path reaches exit, draw accent-colored exit stub
  if (path.length && path[path.length-1].r === e.r && path[path.length-1].c === e.c) {
    ctx.strokeStyle = won ? '#52e07c' : cv('--accent');
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
}

function drawPath() {
  if (!path.length) return;
  const color = won ? '#52e07c' : cv('--accent');

  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(nodeX(path[0].c), nodeY(path[0].r));
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(nodeX(path[i].c), nodeY(path[i].r));
  }
  ctx.stroke();

  // dots on intermediate nodes
  ctx.fillStyle = color;
  for (let i = 1; i < path.length; i++) {
    ctx.beginPath();
    ctx.arc(nodeX(path[i].c), nodeY(path[i].r), 5, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawStart() {
  const s = lvl.start;
  const color = path.length ? cv('--accent') : cv('--accent');
  ctx.fillStyle = won ? '#52e07c' : color;
  ctx.beginPath();
  ctx.arc(nodeX(s.c), nodeY(s.r), 10, 0, Math.PI*2);
  ctx.fill();
}

// ----- input -----

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top) * scaleY,
  };
}

function onPointerDown(e) {
  e.preventDefault();
  if (won) return;
  const {x, y} = getPos(e);
  const node = nodeAt(x, y);
  if (!node) return;
  if (node.r === lvl.start.r && node.c === lvl.start.c) {
    path = [node];
    drawing = true;
    draw();
  }
}

function onPointerMove(e) {
  e.preventDefault();
  if (!drawing || won) return;
  const {x, y} = getPos(e);
  const node = nodeAt(x, y);
  if (!node) return;

  const last = path[path.length - 1];
  if (node.r === last.r && node.c === last.c) return;

  // backtrack
  if (path.length >= 2) {
    const prev = path[path.length - 2];
    if (node.r === prev.r && node.c === prev.c) {
      path.pop();
      draw();
      return;
    }
  }

  // extend
  if (!adjacent(last, node)) return;
  if (isWall(last.r, last.c, node.r, node.c)) return;
  if (path.some(p => p.r === node.r && p.c === node.c)) return;

  path.push(node);
  draw();
}

function onPointerUp(e) {
  e.preventDefault();
  if (!drawing) return;
  drawing = false;

  if (!path.length) return;
  const last = path[path.length - 1];
  if (last.r !== lvl.exit.r || last.c !== lvl.exit.c) {
    draw();
    return;
  }

  if (validatePath()) {
    won = true;
    draw();
    const isLast = levelIdx === LEVELS.length - 1;
    if (isLast) {
      statusEl.textContent = t('status.all_levels');
      statusEl.className = 'win';
      if (typeof launchConfetti === 'function') launchConfetti();
    } else {
      statusEl.textContent = t('status.solved');
      statusEl.className = 'win';
      setTimeout(() => initLevel(levelIdx + 1), 900);
    }
  } else {
    statusEl.textContent = t('status.level_failed');
    statusEl.className = 'lose';
    setTimeout(() => {
      path = [];
      statusEl.textContent = '';
      statusEl.className = '';
      draw();
    }, 800);
  }
}

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('touchstart', onPointerDown, {passive: false});
canvas.addEventListener('touchmove', onPointerMove, {passive: false});
canvas.addEventListener('touchend', onPointerUp, {passive: false});

document.getElementById('btn-reset').addEventListener('click', resetLevel);

function onThemeChange() { draw(); }
function onLangChange() {}

initLevel(0);
