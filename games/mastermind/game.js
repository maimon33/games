const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const COLORS = ['#e74c3c','#3498db','#2ecc71','#f1c40f','#9b59b6','#e67e22'];
const PEGS = 4, MAX_ROWS = 10;

let secret, guesses, current, selectedColor, done;
let W, ROW_H, PAD, PEG_R, FB_R, PALETTE_Y;

function computeLayout() {
  const sz = Math.min(window.innerWidth - 32, 400);
  W = sz;
  PAD = sz * 0.06;
  ROW_H = (sz * 0.7) / MAX_ROWS;
  PEG_R = ROW_H * 0.34;
  FB_R  = ROW_H * 0.14;
  PALETTE_Y = sz * 0.72;
  canvas.width  = sz;
  canvas.height = sz;
}

function newGame() {
  secret = Array.from({length: PEGS}, () => Math.floor(Math.random() * COLORS.length));
  guesses = [];
  current = [];
  selectedColor = 0;
  done = false;
  statusEl.textContent = 'Pick colors and fill the row';
  statusEl.className = '';
  draw();
}

function getFeedback(guess, sec) {
  let black = 0, white = 0;
  const s = [...sec], g = [...guess];
  for (let i = 0; i < PEGS; i++) if (g[i] === s[i]) { black++; s[i] = g[i] = -1; }
  for (let i = 0; i < PEGS; i++) {
    if (g[i] === -1) continue;
    const j = s.indexOf(g[i]);
    if (j >= 0) { white++; s[j] = -1; }
  }
  return {black, white};
}

function submitGuess() {
  if (current.length < PEGS || done) return;
  const fb = getFeedback(current, secret);
  guesses.push({code: [...current], fb});
  current = [];
  if (fb.black === PEGS) {
    done = true;
    statusEl.textContent = `Cracked it in ${guesses.length}! 🎉`;
    statusEl.className = 'win';
    launchConfetti();
  } else if (guesses.length === MAX_ROWS) {
    done = true;
    statusEl.textContent = `Game over! Code was: ${secret.map(i => '●').join(' ')}`;
    statusEl.className = 'lose';
  } else {
    statusEl.textContent = `${MAX_ROWS - guesses.length} attempts left`;
  }
  draw();
}

// ── Drawing ───────────────────────────────────────────────────────────────────

function draw() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const bgC   = light ? '#f4f4f8' : '#0f0f13';
  const surfC = light ? '#ffffff' : '#1a1a24';
  const bordC = light ? '#dddde8' : '#2a2a38';
  const textC = light ? '#1a1a2e' : '#e8e8f0';
  const mutedC = light ? '#6a6a86' : '#7a7a96';

  ctx.fillStyle = bgC;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const activeRow = guesses.length;

  // Draw rows top→bottom, but label from bottom (latest attempt at bottom)
  for (let row = 0; row < MAX_ROWS; row++) {
    const guessIdx = row; // row 0 = first guess (top)
    const y = PAD + row * ROW_H;
    const isActive = guessIdx === activeRow && !done;

    // Row background
    ctx.fillStyle = isActive ? (light ? 'rgba(124,111,247,0.07)' : 'rgba(124,111,247,0.08)') : 'transparent';
    ctx.fillRect(PAD * 0.5, y, W - PAD, ROW_H);

    // Row number
    ctx.fillStyle = mutedC;
    ctx.font = `${ROW_H * 0.3}px system-ui`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(MAX_ROWS - row, PAD * 0.9, y + ROW_H / 2);

    // 4 code peg holes
    const pegAreaW = W * 0.55;
    const pegSpacing = pegAreaW / PEGS;
    const pegStartX = PAD * 1.2;

    for (let p = 0; p < PEGS; p++) {
      const cx = pegStartX + p * pegSpacing + pegSpacing / 2;
      const cy = y + ROW_H / 2;

      // hole
      ctx.beginPath();
      ctx.arc(cx, cy, PEG_R, 0, Math.PI * 2);
      if (guessIdx < guesses.length) {
        ctx.fillStyle = COLORS[guesses[guessIdx].code[p]];
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (isActive && p < current.length) {
        ctx.fillStyle = COLORS[current[p]];
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // empty hole
        ctx.fillStyle = isActive ? (light ? '#e8e8f0' : '#2a2a38') : (light ? '#ebebf0' : '#22222e');
        ctx.fill();
        ctx.strokeStyle = bordC;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Feedback pegs (2×2 grid)
    if (guessIdx < guesses.length) {
      const {black, white} = guesses[guessIdx].fb;
      const fbX = W - PAD * 0.5 - ROW_H * 0.7;
      const fbY = y + ROW_H / 2 - FB_R * 2.2;
      let count = 0;
      for (let fr = 0; fr < 2; fr++) for (let fc = 0; fc < 2; fc++) {
        const fx = fbX + fc * FB_R * 2.6;
        const fy = fbY + fr * FB_R * 2.6;
        ctx.beginPath();
        ctx.arc(fx, fy, FB_R, 0, Math.PI * 2);
        if (count < black) {
          ctx.fillStyle = '#222';
          ctx.fill();
          ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
        } else if (count < black + white) {
          ctx.fillStyle = '#eee';
          ctx.fill();
          ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.stroke();
        } else {
          ctx.fillStyle = light ? '#d8d8e0' : '#2a2a38';
          ctx.fill();
        }
        count++;
      }
    }

    // Submit arrow on active row
    if (isActive && current.length === PEGS) {
      const ax = W - PAD * 0.3;
      const ay = y + ROW_H / 2;
      ctx.fillStyle = '#7c6ff7';
      ctx.font = `bold ${ROW_H * 0.5}px system-ui`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('→', ax, ay);
    }
  }

  // Divider
  ctx.strokeStyle = bordC;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD * 0.5, PALETTE_Y - PAD * 0.4);
  ctx.lineTo(W - PAD * 0.5, PALETTE_Y - PAD * 0.4);
  ctx.stroke();

  // Secret display (revealed when done) or hidden code
  const secretY = PALETTE_Y - PAD * 0.15;
  const secretSpacing = (W * 0.55) / PEGS;
  const secretStartX = PAD * 1.2;
  for (let p = 0; p < PEGS; p++) {
    const cx = secretStartX + p * secretSpacing + secretSpacing / 2;
    ctx.beginPath();
    ctx.arc(cx, secretY, PEG_R * 0.7, 0, Math.PI * 2);
    if (done) {
      ctx.fillStyle = COLORS[secret[p]];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.fillStyle = light ? '#bbbbc8' : '#3a3a4e';
      ctx.fill();
    }
  }

  // Color palette
  const palR = Math.min(W * 0.065, 22);
  const palSpacing = (W - PAD * 2) / COLORS.length;
  COLORS.forEach((c, i) => {
    const cx = PAD + i * palSpacing + palSpacing / 2;
    const cy = PALETTE_Y + palR + PAD * 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, palR, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    // Selection ring
    if (i === selectedColor && !done) {
      ctx.strokeStyle = textC;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Instruction
  ctx.fillStyle = mutedC;
  ctx.font = `${W * 0.033}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('● = right place   ○ = wrong place', W / 2, PALETTE_Y + palR * 2 + PAD * 1.2);
}

// ── Input ─────────────────────────────────────────────────────────────────────

function handleClick(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top)  * (canvas.height / rect.height);

  if (done) return;

  // Palette click
  const palR = Math.min(W * 0.065, 22);
  const palSpacing = (W - PAD * 2) / COLORS.length;
  const palY = PALETTE_Y + palR + PAD * 0.6;
  for (let i = 0; i < COLORS.length; i++) {
    const cx = PAD + i * palSpacing + palSpacing / 2;
    if (Math.hypot(x - cx, y - palY) < palR + 6) {
      selectedColor = i; draw(); return;
    }
  }

  // Submit arrow / active row click
  const activeRow = guesses.length;
  const ry = PAD + activeRow * ROW_H;
  if (y >= ry && y < ry + ROW_H) {
    const pegAreaW = W * 0.55;
    const pegSpacing = pegAreaW / PEGS;
    const pegStartX = PAD * 1.2;
    for (let p = 0; p < PEGS; p++) {
      const cx = pegStartX + p * pegSpacing + pegSpacing / 2;
      if (Math.hypot(x - cx, y - (ry + ROW_H/2)) < PEG_R + 4) {
        if (p < current.length) {
          current.splice(p, 1);
        } else if (current.length < PEGS) {
          current.push(selectedColor);
        }
        draw(); return;
      }
    }
    // Submit arrow area (right side of row)
    if (x > W * 0.8 && current.length === PEGS) { submitGuess(); return; }
    // Clicking anywhere else on active row fills next empty peg
    if (current.length < PEGS) { current.push(selectedColor); draw(); }
  }
}

canvas.addEventListener('click', e => handleClick(e.clientX, e.clientY));
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  if (t) handleClick(t.clientX, t.clientY);
}, {passive: false});

document.getElementById('btn-new').addEventListener('click', newGame);
window.addEventListener('resize', () => { computeLayout(); draw(); });
function onThemeChange() { draw(); }

computeLayout();
newGame();
