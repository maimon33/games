// Tank — destroy all enemies to advance. W=wall, .=empty, P=player, E=enemy, B=base(protect)
// Grid-based movement with real-time shooting.

const LEVELS = [
  {grid:[
    'WWWWWWWWWWWWWWWW',
    'W..............W',
    'W..WW...WW....W',
    'W.............W',
    'W...E....E....W',
    'W.............W',
    'W..WW...WW....W',
    'W.............W',
    'W..........E..W',
    'W.............W',
    'W....WW.......W',
    'W.............W',
    'W.....P.......W',
    'WWWWWWWWWWWWWWWW',
  ]},
  {grid:[
    'WWWWWWWWWWWWWWWW',
    'W..............W',
    'W.WW.E..E.WW..W',
    'W.............W',
    'W.W........W..W',
    'W...E....E....W',
    'W.W........W..W',
    'W.............W',
    'W.WW......WW..W',
    'W....E.E......W',
    'W.............W',
    'W.....P.......W',
    'WWWWWWWWWWWWWWWW',
  ]},
  {grid:[
    'WWWWWWWWWWWWWWWW',
    'W.E..........EW',
    'W.WWWW..WWWW..W',
    'W.............W',
    'W.W.E......W..W',
    'W.W........W..W',
    'W.......E.....W',
    'W.W........W..W',
    'W.W.E......W..W',
    'W.............W',
    'W.WWWW..WWWW..W',
    'W.............W',
    'W.......P.....W',
    'WWWWWWWWWWWWWWWW',
  ]},
  {grid:[
    'WWWWWWWWWWWWWWWW',
    'W.E..E..E..E..W',
    'W.............W',
    'W.WWW..WWW....W',
    'W.............W',
    'W.E.........E.W',
    'W.............W',
    'W.WWW..WWW....W',
    'W.............W',
    'W...E.....E...W',
    'W.............W',
    'W.....P.......W',
    'W.............W',
    'WWWWWWWWWWWWWWWW',
  ]},
  {grid:[
    'WWWWWWWWWWWWWWWW',
    'WE.E..E..E.E..W',
    'W.............W',
    'W.WW.WW.WW....W',
    'W.E.........E.W',
    'W.W.......W...W',
    'W...E...E.....W',
    'W.W.......W...W',
    'W.E.........E.W',
    'W.WW.WW.WW....W',
    'W.............W',
    'W.....P.......W',
    'W.E.........E.W',
    'WWWWWWWWWWWWWWWW',
  ]},
];

const DIRS = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const DIR_ANGLE = {up:-Math.PI/2, down:Math.PI/2, left:Math.PI, right:0};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const levelLabel = document.getElementById('level-label');

let CELL, COLS, ROWS;
let grid, player, enemies, bullets, levelIdx, rafId, gameOver;
let keys = {};

function cv(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function resize() {
  const size = Math.min(window.innerWidth - 32, 520);
  canvas.width = size;
  if (grid) {
    CELL = size / COLS;
    canvas.height = CELL * ROWS;
  } else {
    canvas.height = size * 0.875;
  }
  draw();
}

function parseLevel(lvl) {
  const lines = lvl.grid;
  ROWS = lines.length;
  COLS = lines[0].length;
  CELL = canvas.width / COLS;
  canvas.height = CELL * ROWS;
  grid = [];
  enemies = [];
  player = null;
  bullets = [];

  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    for (let c = 0; c < COLS; c++) {
      const ch = lines[r][c];
      if (ch === 'W') { grid[r].push('W'); }
      else {
        grid[r].push('.');
        if (ch === 'P') player = {x: c, y: r, dir: 'up', cooldown: 0};
        if (ch === 'E') enemies.push({x: c, y: r, dir: 'down', cooldown: 0, moveTimer: 0, alive: true});
      }
    }
  }
}

function initLevel(idx) {
  if (rafId) cancelAnimationFrame(rafId);
  levelIdx = idx;
  parseLevel(LEVELS[idx]);
  gameOver = false;
  statusEl.textContent = '';
  statusEl.className = '';
  levelLabel.textContent = `Level ${idx + 1}`;
  rafId = requestAnimationFrame(loop);
}

// --- Draw ---
function drawTank(cx, cy, dir, color, size) {
  const s = size * 0.4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(DIR_ANGLE[dir]);
  // body
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-s*0.7, -s*0.6, s*1.4, s*1.2, 3); ctx.fill();
  // barrel
  ctx.fillStyle = color;
  ctx.fillRect(-s*0.1, -s*0.9, s*0.2, s*0.9);
  // tracks
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-s*0.9, -s*0.6, s*0.25, s*1.2);
  ctx.fillRect(s*0.65, -s*0.6, s*0.25, s*1.2);
  ctx.restore();
}

function draw() {
  if (!grid) return;
  const surface = cv('--surface'), border = cv('--border'), accent = cv('--accent'), muted = cv('--muted'), text = cv('--text');

  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = c * CELL + CELL/2, cy = r * CELL + CELL/2;
      if (grid[r][c] === 'W') {
        ctx.fillStyle = border;
        ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2);
        ctx.strokeStyle = muted; ctx.lineWidth = 1;
        ctx.strokeRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2);
      }
    }
  }

  // Bullets
  bullets.forEach(b => {
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(b.px * CELL + CELL/2, b.py * CELL + CELL/2, CELL*0.12, 0, Math.PI*2);
    ctx.fill();
  });

  // Enemies
  enemies.forEach(e => {
    if (!e.alive) return;
    drawTank(e.x * CELL + CELL/2, e.y * CELL + CELL/2, e.dir, '#e05252', CELL);
  });

  // Player
  if (player) {
    drawTank(player.x * CELL + CELL/2, player.y * CELL + CELL/2, player.dir, accent, CELL);
  }
}

// --- Logic ---
let frameCount = 0;
function loop() {
  if (gameOver) return;
  frameCount++;

  // Player move (every 6 frames)
  if (frameCount % 6 === 0 && player) {
    const dirs = ['up','down','left','right'].filter(d => keys[d]);
    if (dirs.length) {
      const d = dirs[0];
      player.dir = d;
      const [dx, dy] = DIRS[d];
      const nx = player.x + dx, ny = player.y + dy;
      if (canMove(nx, ny)) { player.x = nx; player.y = ny; }
    }
  }

  // Player shoot
  if (player && player.cooldown > 0) player.cooldown--;
  if (keys.fire && player && player.cooldown === 0) {
    shootBullet(player.x, player.y, player.dir, 'player');
    player.cooldown = 15;
    keys.fire = false;
  }

  // Enemy AI (every 30 frames, randomize dir or move toward player)
  enemies.forEach(e => {
    if (!e.alive) return;
    e.moveTimer++;
    if (e.moveTimer % 20 === 0) {
      // Try to aim at player
      if (player && Math.random() < 0.35) {
        const dx = player.x - e.x, dy = player.y - e.y;
        if (Math.abs(dx) > Math.abs(dy)) e.dir = dx > 0 ? 'right' : 'left';
        else e.dir = dy > 0 ? 'down' : 'up';
      } else {
        const dirs = ['up','down','left','right'];
        e.dir = dirs[Math.floor(Math.random() * dirs.length)];
      }
    }
    if (e.moveTimer % 25 === 0) {
      const [dx, dy] = DIRS[e.dir];
      const nx = e.x + dx, ny = e.y + dy;
      if (canMove(nx, ny)) { e.x = nx; e.y = ny; }
    }
    // Enemy shoots occasionally
    if (e.cooldown > 0) { e.cooldown--; }
    else if (Math.random() < 0.012) {
      shootBullet(e.x, e.y, e.dir, 'enemy');
      e.cooldown = 40;
    }
  });

  // Move bullets (every 2 frames)
  if (frameCount % 2 === 0) {
    bullets = bullets.filter(b => {
      const [dx, dy] = DIRS[b.dir];
      b.px += dx; b.py += dy;
      if (b.px < 0 || b.px >= COLS || b.py < 0 || b.py >= ROWS) return false;
      if (grid[Math.round(b.py)][Math.round(b.px)] === 'W') return false;

      // Hit enemy
      if (b.owner === 'player') {
        for (const e of enemies) {
          if (e.alive && Math.round(b.px) === e.x && Math.round(b.py) === e.y) {
            e.alive = false; return false;
          }
        }
      }
      // Hit player
      if (b.owner === 'enemy' && player) {
        if (Math.round(b.px) === player.x && Math.round(b.py) === player.y) {
          player = null;
          gameOver = true;
          draw();
          statusEl.textContent = 'You were destroyed!';
          statusEl.className = 'lose';
          return false;
        }
      }
      return true;
    });
  }

  draw();

  // Check win
  if (enemies.every(e => !e.alive)) {
    gameOver = true;
    draw();
    if (levelIdx + 1 < LEVELS.length) {
      statusEl.textContent = 'Level cleared! ▶ Next';
      statusEl.className = 'win';
      setTimeout(() => initLevel(levelIdx + 1), 1200);
    } else {
      statusEl.textContent = 'All levels complete!';
      statusEl.className = 'win';
    }
    return;
  }

  rafId = requestAnimationFrame(loop);
}

function canMove(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  if (grid[y][x] === 'W') return false;
  if (enemies.some(e => e.alive && e.x === x && e.y === y)) return false;
  return true;
}

function shootBullet(x, y, dir, owner) {
  const [dx, dy] = DIRS[dir];
  bullets.push({px: x + dx, py: y + dy, dir, owner});
}

// --- Input ---
const KEY_MAP = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',' ':'fire'};
document.addEventListener('keydown', e => {
  const k = KEY_MAP[e.key];
  if (k) { e.preventDefault(); keys[k] = true; }
});
document.addEventListener('keyup', e => {
  const k = KEY_MAP[e.key];
  if (k) keys[k] = false;
});

document.querySelectorAll('[data-dir]').forEach(btn => {
  btn.addEventListener('touchstart', e => { e.preventDefault(); keys[btn.dataset.dir] = true; }, {passive:false});
  btn.addEventListener('touchend', e => { e.preventDefault(); keys[btn.dataset.dir] = false; }, {passive:false});
  btn.addEventListener('mousedown', () => { keys[btn.dataset.dir] = true; });
  btn.addEventListener('mouseup', () => { keys[btn.dataset.dir] = false; });
});

document.getElementById('btn-fire').addEventListener('touchstart', e => {
  e.preventDefault(); keys.fire = true;
}, {passive:false});
document.getElementById('btn-fire').addEventListener('mousedown', () => { keys.fire = true; });

document.getElementById('btn-restart').addEventListener('click', () => initLevel(levelIdx));
document.getElementById('btn-prev').addEventListener('click', () => { if (levelIdx > 0) initLevel(levelIdx - 1); });
document.getElementById('btn-next').addEventListener('click', () => { if (levelIdx < LEVELS.length - 1) initLevel(levelIdx + 1); });

function onThemeChange() { draw(); }

window.addEventListener('resize', resize);
resize();
initLevel(0);
