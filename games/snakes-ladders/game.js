const boardEl = document.getElementById('board');
const playersEl = document.getElementById('players');
const statusEl = document.getElementById('status');
const countEl = document.getElementById('player-count');
const btnRoll = document.getElementById('btn-roll');

const LINKS = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98,
  16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80,
};

const PLAYER_COLORS = ['#ef4444', '#2563eb', '#22c55e', '#f59e0b'];
let players = [];
let turn = 0;
let finished = false;

function buildBoard() {
  boardEl.innerHTML = '';
  for (let row = 9; row >= 0; row--) {
    const nums = [];
    for (let col = 0; col < 10; col++) nums.push(row * 10 + col + 1);
    if ((9 - row) % 2 === 1) nums.reverse();
    nums.forEach(n => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.n = n;
      const num = document.createElement('div');
      num.className = 'cell-num';
      num.textContent = n;
      cell.appendChild(num);
      if (LINKS[n]) {
        const link = document.createElement('div');
        const ladder = LINKS[n] > n;
        link.className = `cell-link ${ladder ? 'ladder' : 'snake'}`;
        link.textContent = ladder ? `↑ ${LINKS[n]}` : `↓ ${LINKS[n]}`;
        cell.appendChild(link);
      }
      const tokens = document.createElement('div');
      tokens.className = 'tokens';
      cell.appendChild(tokens);
      boardEl.appendChild(cell);
    });
  }
}

function renderPlayers() {
  playersEl.innerHTML = '';
  players.forEach((player, idx) => {
    const pill = document.createElement('div');
    pill.className = 'player-pill';
    pill.style.borderColor = idx === turn && !finished ? player.color : '';
    pill.innerHTML = `<span class="dot" style="background:${player.color}"></span><strong>P${idx + 1}</strong><span>${player.pos}</span>`;
    playersEl.appendChild(pill);
  });
}

function placeTokens() {
  boardEl.querySelectorAll('.tokens').forEach(el => { el.innerHTML = ''; });
  players.forEach(player => {
    const cell = boardEl.querySelector(`[data-n="${player.pos}"] .tokens`);
    if (!cell) return;
    const token = document.createElement('div');
    token.className = 'token';
    token.style.background = player.color;
    cell.appendChild(token);
  });
}

function updateStatus(msg) {
  statusEl.textContent = msg;
  renderPlayers();
  placeTokens();
}

function newGame() {
  const count = +countEl.value;
  players = Array.from({ length: count }, (_, i) => ({ pos: 1, color: PLAYER_COLORS[i] }));
  turn = 0;
  finished = false;
  btnRoll.disabled = false;
  buildBoard();
  updateStatus(`Player 1 starts. Roll the die.`);
}

function roll() {
  if (finished) return;
  const die = 1 + Math.floor(Math.random() * 6);
  const player = players[turn];
  let next = player.pos + die;
  let text = `Player ${turn + 1} rolled ${die}. `;
  if (next <= 100) player.pos = next;
  if (LINKS[player.pos]) {
    const to = LINKS[player.pos];
    text += to > player.pos ? `Climbed a ladder to ${to}. ` : `Hit a snake to ${to}. `;
    player.pos = to;
  }
  if (player.pos === 100) {
    finished = true;
    btnRoll.disabled = true;
    updateStatus(`Player ${turn + 1} wins!`);
    return;
  }
  turn = (turn + 1) % players.length;
  text += `Player ${turn + 1}'s turn.`;
  updateStatus(text);
}

btnRoll.addEventListener('click', roll);
document.getElementById('btn-new').addEventListener('click', newGame);
countEl.addEventListener('change', newGame);
newGame();
