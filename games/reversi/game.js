const boardEl = document.getElementById('board');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const statusEl = document.getElementById('status');
const btnMode = document.getElementById('btn-mode');

const SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
const WEIGHTS = [
  [120,-20,20,5,5,20,-20,120],
  [-20,-40,-5,-5,-5,-5,-40,-20],
  [20,-5,15,3,3,15,-5,20],
  [5,-5,3,3,3,3,-5,5],
  [5,-5,3,3,3,3,-5,5],
  [20,-5,15,3,3,15,-5,20],
  [-20,-40,-5,-5,-5,-5,-40,-20],
  [120,-20,20,5,5,20,-20,120],
];

let board;
let turn;
let vsAI = true;
let busy = false;

function newBoard() {
  const next = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  next[3][3] = WHITE;
  next[3][4] = BLACK;
  next[4][3] = BLACK;
  next[4][4] = WHITE;
  return next;
}

function inBounds(r, c) {
  return r >= 0 && c >= 0 && r < SIZE && c < SIZE;
}

function flipsForMove(grid, r, c, color) {
  if (!inBounds(r, c) || grid[r][c] !== EMPTY) return [];
  const opp = color === BLACK ? WHITE : BLACK;
  const flips = [];
  for (const [dr, dc] of DIRS) {
    const line = [];
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc) && grid[nr][nc] === opp) {
      line.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (line.length && inBounds(nr, nc) && grid[nr][nc] === color) flips.push(...line);
  }
  return flips;
}

function validMoves(grid, color) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const flips = flipsForMove(grid, r, c, color);
      if (flips.length) moves.push({ r, c, flips });
    }
  }
  return moves;
}

function applyMove(grid, move, color) {
  grid[move.r][move.c] = color;
  move.flips.forEach(([r, c]) => { grid[r][c] = color; });
}

function scoreBoard() {
  let black = 0;
  let white = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
}

function updateStatus() {
  const { black, white } = scoreBoard();
  blackScoreEl.textContent = black;
  whiteScoreEl.textContent = white;

  const blackMoves = validMoves(board, BLACK);
  const whiteMoves = validMoves(board, WHITE);
  if (!blackMoves.length && !whiteMoves.length) {
    if (black === white) statusEl.textContent = `Draw game at ${black}-${white}.`;
    else statusEl.textContent = `${black > white ? 'Black' : 'White'} wins ${Math.max(black, white)}-${Math.min(black, white)}.`;
    return;
  }

  const currentMoves = turn === BLACK ? blackMoves : whiteMoves;
  if (!currentMoves.length) {
    turn = turn === BLACK ? WHITE : BLACK;
    statusEl.textContent = `${turn === BLACK ? 'Black' : 'White'} plays. Opponent had no legal move.`;
    render();
    maybeAIMove();
    return;
  }

  statusEl.textContent = `${turn === BLACK ? 'Black' : 'White'} to move.`;
}

function render() {
  const moves = validMoves(board, turn);
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      const valid = moves.find(m => m.r === r && m.c === c);
      if (valid) btn.classList.add('valid');
      const cell = board[r][c];
      if (cell !== EMPTY) {
        const disc = document.createElement('div');
        disc.className = `disc ${cell === BLACK ? 'black' : 'white'}`;
        btn.appendChild(disc);
      }
      btn.onclick = () => playMove(r, c);
      boardEl.appendChild(btn);
    }
  }
}

function playMove(r, c) {
  if (busy) return;
  if (vsAI && turn === WHITE) return;
  const flips = flipsForMove(board, r, c, turn);
  if (!flips.length) return;
  applyMove(board, { r, c, flips }, turn);
  turn = turn === BLACK ? WHITE : BLACK;
  render();
  updateStatus();
  maybeAIMove();
}

function bestAIMove() {
  const moves = validMoves(board, WHITE);
  if (!moves.length) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    let score = WEIGHTS[move.r][move.c] + move.flips.length * 8;
    move.flips.forEach(([r, c]) => { score += WEIGHTS[r][c] * 0.12; });
    const sim = board.map(row => [...row]);
    applyMove(sim, move, WHITE);
    score -= validMoves(sim, BLACK).length * 3;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function maybeAIMove() {
  if (!vsAI || turn !== WHITE) return;
  const move = bestAIMove();
  if (!move) {
    turn = BLACK;
    render();
    updateStatus();
    return;
  }
  busy = true;
  setTimeout(() => {
    applyMove(board, move, WHITE);
    turn = BLACK;
    busy = false;
    render();
    updateStatus();
  }, 260);
}

function newGame() {
  board = newBoard();
  turn = BLACK;
  busy = false;
  render();
  updateStatus();
}

btnMode.addEventListener('click', () => {
  vsAI = !vsAI;
  btnMode.textContent = `VS AI: ${vsAI ? 'On' : 'Off'}`;
  newGame();
});

document.getElementById('btn-new').addEventListener('click', newGame);
newGame();
