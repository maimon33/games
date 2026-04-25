(function () {
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function _themeLabel(theme) {
  const label = theme === 'dark' ? 'Light' : 'Dark';
  return (typeof window.t === 'function') ? window.t(theme === 'dark' ? 'btn.light' : 'btn.dark') : label;
}

document.addEventListener('DOMContentLoaded', () => {
  const t = document.documentElement.getAttribute('data-theme');
  document.querySelectorAll('.theme-btn[onclick="toggleTheme()"]').forEach(b => {
    b.textContent = _themeLabel(t);
  });
  _setupStreak();
});

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('.theme-btn[onclick="toggleTheme()"]').forEach(b => {
    b.textContent = _themeLabel(next);
  });
  if (typeof onThemeChange === 'function') onThemeChange();
}

function _setupStreak() {
  const statusEl = document.getElementById('status');
  const messageEl = document.getElementById('message');
  const targets = [statusEl, messageEl].filter(Boolean);
  if (!targets.length) return;

  const overlay = document.createElement('div');
  overlay.id = 'streak-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(4px);z-index:2000;display:none;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.75rem 1.5rem;max-width:290px;width:100%;text-align:center;">' +
    '<div style="font-size:2.4rem;margin-bottom:.4rem;">🏆</div>' +
    '<div id="streak-title" style="font-size:1.15rem;font-weight:700;margin-bottom:.35rem;"></div>' +
    '<div id="streak-body" style="color:var(--muted);font-size:.88rem;margin-bottom:1.25rem;"></div>' +
    '<div style="display:flex;gap:.65rem;justify-content:center;">' +
    '<button id="streak-repeat" style="background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:.52rem 1rem;cursor:pointer;font-size:.88rem;"></button>' +
    '<button id="streak-next" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:.52rem 1.1rem;cursor:pointer;font-size:.88rem;font-weight:700;"></button>' +
    '</div></div>';
  document.body.appendChild(overlay);

  document.getElementById('streak-repeat').onclick = () => { overlay.style.display = 'none'; location.reload(); };
  document.getElementById('streak-next').onclick = () => { sessionStorage.removeItem('streakWins'); window.location.href = '../../'; };

  let winCounted = false;
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.attributeName !== 'class') continue;
      if (m.target.classList.contains('win') && !winCounted) {
        winCounted = true;
        const count = (parseInt(sessionStorage.getItem('streakWins') || '0') + 1);
        sessionStorage.setItem('streakWins', count);
        if (count >= 3 && count % 3 === 0) {
          setTimeout(() => _showStreakModal(count), 1400);
        }
      }
    }
  });
  targets.forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));
}

function _showStreakModal(count) {
  const tFn = typeof window.t === 'function' ? window.t : k => k;
  document.getElementById('streak-title').textContent = tFn('streak.title');
  document.getElementById('streak-body').textContent = tFn('streak.body', { n: count });
  document.getElementById('streak-repeat').textContent = tFn('btn.play_again');
  document.getElementById('streak-next').textContent = tFn('streak.next');
  document.getElementById('streak-modal').style.display = 'flex';
}
