(function () {
  const S3_BASE   = 'https://s3.il-central-1.amazonaws.com/games.maimons.dev/ratings';
  const GH_ISSUES = 'https://github.com/maimon33/games/issues/new';

  // Derive game slug from URL: /games/chess/ → "chess"
  function slug() {
    const parts = location.pathname.replace(/\/$/, '').split('/');
    const i = parts.lastIndexOf('games');
    return i >= 0 && parts[i + 1] ? parts[i + 1] : 'unknown';
  }

  let gameName = slug();
  let userVote  = localStorage.getItem('vote_' + gameName); // 'up'|'down'|null
  let counts    = { up: 0, down: 0 };
  let modalEl   = null;

  // ── S3 helpers ──────────────────────────────────────────────────────────────

  async function fetchCounts() {
    try {
      const r = await fetch(S3_BASE + '/' + gameName + '.json', { cache: 'no-store' });
      if (r.ok) counts = await r.json();
    } catch (_) {}
  }

  async function saveCounts() {
    try {
      await fetch(S3_BASE + '/' + gameName + '.json', {
        method: 'PUT',
        body: JSON.stringify(counts),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_) {}
  }

  // ── Rating ───────────────────────────────────────────────────────────────────

  async function vote(type) {
    if (userVote) return;
    counts[type] = (counts[type] || 0) + 1;
    userVote = type;
    localStorage.setItem('vote_' + gameName, type);
    renderButtons();
    await saveCounts();
  }

  // ── Inject UI ────────────────────────────────────────────────────────────────

  const CSS = `
    .rating-bar{display:flex;align-items:center;gap:.6rem;justify-content:center;padding:.25rem 0;}
    .r-btn{display:inline-flex;align-items:center;gap:.3rem;background:var(--surface);border:1px solid var(--border);
      border-radius:8px;padding:.28rem .75rem;font-size:.8rem;color:var(--muted);cursor:pointer;
      transition:border-color .15s,color .15s;-webkit-tap-highlight-color:transparent;}
    .r-btn:hover:not([disabled]){border-color:var(--accent);color:var(--text);}
    .r-btn[disabled]{opacity:.65;cursor:default;}
    .r-btn.r-active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--text);}
    .r-sep{color:var(--border);user-select:none;}
    .r-feedback{background:none;border:none;color:var(--muted);font-size:.8rem;cursor:pointer;
      text-decoration:underline;text-underline-offset:2px;padding:0;}
    .r-feedback:hover{color:var(--text);}
    #fb-modal{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);
      z-index:9999;display:none;align-items:center;justify-content:center;padding:1rem;}
    #fb-modal.open{display:flex;}
    #fb-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;
      padding:1.5rem;max-width:380px;width:100%;position:relative;}
    #fb-close{position:absolute;top:.7rem;right:.8rem;background:none;border:none;
      color:var(--muted);font-size:1.4rem;cursor:pointer;line-height:1;padding:0;}
    #fb-close:hover{color:var(--text);}
    .fb-title{font-size:1rem;font-weight:700;margin-bottom:.9rem;}
    .fb-types{display:flex;gap:.6rem;margin-bottom:.75rem;flex-wrap:wrap;}
    .fb-types label{display:flex;align-items:center;gap:.3rem;font-size:.85rem;cursor:pointer;
      background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.3rem .7rem;
      transition:border-color .15s;}
    .fb-types label:has(input:checked){border-color:var(--accent);}
    #fb-text{width:100%;height:5.5rem;background:var(--bg);border:1px solid var(--border);
      border-radius:8px;padding:.55rem;color:var(--text);font-family:inherit;font-size:.88rem;
      resize:vertical;outline:none;}
    #fb-text:focus{border-color:var(--accent);}
    .fb-footer{display:flex;justify-content:space-between;align-items:center;margin-top:.75rem;}
    .fb-hint{font-size:.72rem;color:var(--muted);}
    #fb-submit{background:var(--accent);color:#fff;border:none;border-radius:8px;
      padding:.45rem 1.1rem;font-size:.88rem;font-weight:600;cursor:pointer;}
    #fb-submit:hover{opacity:.9;}
  `;

  function injectCSS() {
    if (document.getElementById('rating-css')) return;
    const s = document.createElement('style');
    s.id = 'rating-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function renderButtons() {
    const up   = document.getElementById('r-up');
    const down = document.getElementById('r-down');
    if (!up) return;
    up.querySelector('.r-count').textContent   = counts.up   || 0;
    down.querySelector('.r-count').textContent = counts.down || 0;
    if (userVote) {
      up.disabled = true;
      down.disabled = true;
      up.classList.toggle('r-active',   userVote === 'up');
      down.classList.toggle('r-active', userVote === 'down');
    }
  }

  function injectRatingBar() {
    const bar = document.createElement('div');
    bar.className = 'rating-bar';
    bar.innerHTML =
      `<button class="r-btn" id="r-up"   onclick="Rating.vote('up')"  title="Thumbs up">👍 <span class="r-count">…</span></button>` +
      `<button class="r-btn" id="r-down" onclick="Rating.vote('down')" title="Thumbs down">👎 <span class="r-count">…</span></button>` +
      `<span class="r-sep">·</span>` +
      `<button class="r-feedback" onclick="Rating.openFeedback()">Send feedback</button>`;

    const controls = document.querySelector('.controls');
    if (controls) controls.after(bar);
    else document.body.appendChild(bar);
  }

  function injectModal() {
    modalEl = document.createElement('div');
    modalEl.id = 'fb-modal';
    modalEl.innerHTML = `
      <div id="fb-box">
        <button id="fb-close" onclick="Rating.closeFeedback()">×</button>
        <div class="fb-title">Send Feedback</div>
        <div class="fb-types">
          <label><input type="radio" name="fb-type" value="bug" checked> 🐛 Bug</label>
          <label><input type="radio" name="fb-type" value="suggestion"> 💡 Suggestion</label>
          <label><input type="radio" name="fb-type" value="other"> 💬 Other</label>
        </div>
        <textarea id="fb-text" placeholder="Describe the issue or idea…"></textarea>
        <div class="fb-footer">
          <span class="fb-hint">Opens GitHub — sign in to submit</span>
          <button id="fb-submit" onclick="Rating.submitFeedback()">Open on GitHub →</button>
        </div>
      </div>`;
    modalEl.addEventListener('click', e => { if (e.target === modalEl) closeFeedback(); });
    document.body.appendChild(modalEl);
  }

  // ── Feedback ─────────────────────────────────────────────────────────────────

  function openFeedback() {
    if (modalEl) { modalEl.classList.add('open'); document.getElementById('fb-text').focus(); }
  }

  function closeFeedback() {
    if (modalEl) modalEl.classList.remove('open');
  }

  function submitFeedback() {
    const type  = (document.querySelector('input[name="fb-type"]:checked') || {}).value || 'bug';
    const body  = (document.getElementById('fb-text').value || '').trim();
    const title = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : gameName;

    const typeMap = { bug: '🐛 Bug Report', suggestion: '💡 Suggestion', other: '💬 Other' };
    const labelMap = { bug: 'bug', suggestion: 'enhancement', other: 'question' };

    const issueTitle = '[' + title + '] ' + typeMap[type];
    const issueBody  =
      '**Game:** ' + title + '\n' +
      '**Type:** ' + typeMap[type] + '\n\n' +
      (body || '*(no description provided)*') + '\n\n' +
      '---\n*Reported from ' + location.href + '*';

    const url = GH_ISSUES +
      '?title=' + encodeURIComponent(issueTitle) +
      '&body='  + encodeURIComponent(issueBody) +
      '&labels=' + encodeURIComponent(labelMap[type]);

    window.open(url, '_blank');
    closeFeedback();
    document.getElementById('fb-text').value = '';
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────

  async function init() {
    injectCSS();
    injectRatingBar();
    injectModal();
    await fetchCounts();
    renderButtons();
  }

  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('open')) closeFeedback();
  });

  window.Rating = { vote, openFeedback, closeFeedback, submitFeedback };
})();
