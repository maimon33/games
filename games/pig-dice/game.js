const playersEl = document.getElementById('players');
const dieEl = document.getElementById('die');
const turnScoreEl = document.getElementById('turn-score');
const statusEl = document.getElementById('status');
const playerCountEl = document.getElementById('player-count');
const targetScoreEl = document.getElementById('target-score');

let players = [];
let turn = 0;
let turnBank = 0;
let targetScore = 100;
let finished = false;
let lastRoll = 1;

function renderDie(value) {
  dieEl.innerHTML = '';
  const spots = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };
  spots[value].forEach(([x, y]) => {
    const pip = document.createElement('div');
    pip.className = 'pip';
    pip.style.left = `calc(${x}% - 7px)`;
    pip.style.top = `calc(${y}% - 7px)`;
    dieEl.appendChild(pip);
  });
}

function renderPlayers() {
  playersEl.innerHTML = '';
  players.forEach((player, idx) => {
    const div = document.createElement('div');
    div.className = `player${idx === turn && !finished ? ' active' : ''}`;
    div.innerHTML = `<div>Player ${idx + 1}</div><strong>${player.score}</strong><small>${idx === turn && !finished ? 'Current turn' : 'Waiting'}</small>`;
    playersEl.appendChild(div);
  });
  turnScoreEl.textContent = turnBank;
  renderDie(lastRoll);
}

function newGame() {
  const count = +playerCountEl.value;
  targetScore = Math.max(30, Math.min(200, +targetScoreEl.value || 100));
  targetScoreEl.value = targetScore;
  players = Array.from({ length: count }, () => ({ score: 0 }));
  turn = 0;
  turnBank = 0;
  finished = false;
  lastRoll = 1;
  document.getElementById('btn-roll').disabled = false;
  document.getElementById('btn-hold').disabled = false;
  statusEl.textContent = `Player 1 starts. First to ${targetScore} wins.`;
  renderPlayers();
}

function nextTurn(message) {
  turn = (turn + 1) % players.length;
  turnBank = 0;
  statusEl.textContent = `${message} Player ${turn + 1}'s turn.`;
  renderPlayers();
}

function roll() {
  if (finished) return;
  const value = 1 + Math.floor(Math.random() * 6);
  lastRoll = value;
  if (value === 1) {
    nextTurn(`Player ${turn + 1} rolled a 1 and lost the turn bank.`);
    return;
  }
  turnBank += value;
  statusEl.textContent = `Player ${turn + 1} rolled ${value}. Roll again or hold.`;
  renderPlayers();
}

function hold() {
  if (finished) return;
  players[turn].score += turnBank;
  if (players[turn].score >= targetScore) {
    finished = true;
    document.getElementById('btn-roll').disabled = true;
    document.getElementById('btn-hold').disabled = true;
    statusEl.textContent = `Player ${turn + 1} wins with ${players[turn].score}!`;
    renderPlayers();
    return;
  }
  nextTurn(`Player ${turn + 1} banked ${turnBank} points.`);
}

document.getElementById('btn-roll').addEventListener('click', roll);
document.getElementById('btn-hold').addEventListener('click', hold);
document.getElementById('btn-new').addEventListener('click', newGame);
playerCountEl.addEventListener('change', newGame);
newGame();
