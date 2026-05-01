// Multiplayer room manager — S3-backed, no server required
// Configure S3_BASE to point at your bucket's public endpoint.
// Bucket policy must allow s3:GetObject + s3:PutObject on rooms/* to everyone.

const MP = (() => {
  // ── Config ────────────────────────────────────────────────────────────────
  const S3_BASE = 'https://s3.il-central-1.amazonaws.com/games.maimons.dev/rooms';
  const TOKEN_KEY = 'mp_player_token';
  const POLL_MS   = 1800;

  // ── Player identity ───────────────────────────────────────────────────────
  function myToken() {
    let t = localStorage.getItem(TOKEN_KEY);
    if (!t) { t = 'p_' + Math.random().toString(36).slice(2, 10); localStorage.setItem(TOKEN_KEY, t); }
    return t;
  }

  // ── Room ID ───────────────────────────────────────────────────────────────
  function genId() {
    // 6-char alphanumeric, uppercase — easy to read aloud
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  // ── S3 read / write ───────────────────────────────────────────────────────
  async function s3Get(id) {
    const res = await fetch(`${S3_BASE}/${id}.json`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`MP read error ${res.status}`);
    return res.json();
  }

  async function s3Put(id, obj) {
    const res = await fetch(`${S3_BASE}/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj),
    });
    if (!res.ok) throw new Error(`MP write error ${res.status}`);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  // Create a new room. Returns { id, code, url, qrUrl, room }
  async function createRoom(game, initialState) {
    const id    = genId();
    const token = myToken();
    const room  = {
      id, game,
      created: Date.now(),
      host:  token,
      guest: null,
      turn:  token,        // host moves first
      state: initialState,
    };
    await s3Put(id, room);
    const url   = `${location.origin}${location.pathname}?room=${id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
    return { id, code: id, url, qrUrl, room };
  }

  // Join or reconnect to a room. Returns { room, role: 'host'|'guest'|'spectator' }
  async function joinRoom(id) {
    const room  = await s3Get(id);
    if (!room) throw new Error('Room not found');
    const token = myToken();

    if (room.host === token)  return { room, role: 'host' };
    if (room.guest === token) return { room, role: 'guest' };
    if (room.guest)           return { room, role: 'spectator' };

    // Claim the guest slot
    room.guest = token;
    await s3Put(id, room);
    return { room, role: 'guest' };
  }

  // Fetch current room state
  async function getRoom(id) {
    return s3Get(id);
  }

  // Submit a move. Throws if it's not your turn.
  async function move(id, newState) {
    const room  = await s3Get(id);
    if (!room) throw new Error('Room not found');
    const token = myToken();
    if (room.turn !== token) throw new Error('Not your turn');

    room.state = newState;
    room.turn  = token === room.host ? room.guest : room.host;
    await s3Put(id, room);
    return room;
  }

  // Poll for changes. Returns a stop() function.
  // onUpdate(room) is called whenever state/turn/guest changes.
  function poll(id, onUpdate) {
    let lastSig = null;
    const iv = setInterval(async () => {
      const room = await s3Get(id).catch(() => null);
      if (!room) return;
      const sig = `${JSON.stringify(room.state)}|${room.turn}|${room.guest}`;
      if (sig !== lastSig) { lastSig = sig; onUpdate(room); }
    }, POLL_MS);
    return () => clearInterval(iv);
  }

  // ── Invite UI helper ──────────────────────────────────────────────────────
  // Call showInviteModal({ id, url, qrUrl }) to display the share sheet.
  // Inject the CSS once via injectStyles().

  function injectStyles() {
    if (document.getElementById('mp-styles')) return;
    const s = document.createElement('style');
    s.id = 'mp-styles';
    s.textContent = `
      #mp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);
        z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;}
      #mp-box{background:var(--surface,#1a1a24);border:1px solid var(--border,#2a2a38);
        border-radius:16px;padding:1.5rem;max-width:320px;width:100%;position:relative;text-align:center;}
      #mp-box h2{font-size:1rem;font-weight:700;margin-bottom:1rem;color:var(--text,#e8e8f0);}
      #mp-code{font-size:2.4rem;font-weight:800;letter-spacing:.2em;color:var(--accent,#7c6ff7);
        margin:.4rem 0;}
      #mp-qr{width:140px;height:140px;margin:.6rem auto;border-radius:8px;display:block;}
      #mp-link{font-size:.72rem;color:var(--muted,#7a7a96);word-break:break-all;margin:.4rem 0;}
      #mp-copy{margin-top:.75rem;background:var(--surface,#1a1a24);color:var(--text,#e8e8f0);
        border:1px solid var(--border,#2a2a38);border-radius:8px;padding:.45rem 1.1rem;
        font-size:.85rem;cursor:pointer;}
      #mp-copy:hover{border-color:var(--accent,#7c6ff7);}
      #mp-close{position:absolute;top:.6rem;right:.75rem;background:none;border:none;
        color:var(--muted,#7a7a96);font-size:1.4rem;cursor:pointer;line-height:1;padding:0;}
      #mp-close:hover{color:var(--text,#e8e8f0);}
      #mp-waiting{margin-top:.75rem;font-size:.8rem;color:var(--muted,#7a7a96);}
    `;
    document.head.appendChild(s);
  }

  function showInviteModal({ id, url, qrUrl }) {
    injectStyles();
    let el = document.getElementById('mp-overlay');
    if (el) el.remove();

    el = document.createElement('div');
    el.id = 'mp-overlay';
    el.innerHTML = `
      <div id="mp-box">
        <button id="mp-close">×</button>
        <h2>Share with your opponent</h2>
        <div id="mp-code">${id}</div>
        <img id="mp-qr" src="${qrUrl}" alt="QR code">
        <div id="mp-link">${url}</div>
        <button id="mp-copy">Copy link</button>
        <div id="mp-waiting">Waiting for opponent to join…</div>
      </div>`;
    document.body.appendChild(el);

    document.getElementById('mp-close').onclick = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el) el.remove(); });
    document.getElementById('mp-copy').onclick = () => {
      navigator.clipboard.writeText(url).then(() => {
        document.getElementById('mp-copy').textContent = 'Copied!';
        setTimeout(() => { const b = document.getElementById('mp-copy'); if (b) b.textContent = 'Copy link'; }, 1500);
      });
    };
  }

  function closeInviteModal() {
    const el = document.getElementById('mp-overlay');
    if (el) el.remove();
  }

  return { myToken, createRoom, joinRoom, getRoom, move, poll, showInviteModal, closeInviteModal };
})();
