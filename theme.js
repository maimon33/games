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
