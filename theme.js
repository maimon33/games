(function () {
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

document.addEventListener('DOMContentLoaded', () => {
  const t = document.documentElement.getAttribute('data-theme');
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.textContent = t === 'dark' ? 'Light' : 'Dark';
  });
});

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.textContent = next === 'dark' ? 'Light' : 'Dark';
  });
  if (typeof onThemeChange === 'function') onThemeChange();
}
