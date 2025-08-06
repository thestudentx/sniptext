 // --- Theme Toggle ---
const themeIcon = themeToggle.querySelector('.theme-icon');

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const initial = savedTheme || (prefersDark ? 'dark' : 'light');

document.documentElement.setAttribute('data-theme', initial);
themeIcon.textContent = initial === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);

  // Animate the icon switch
  themeIcon.classList.add('fade');
  setTimeout(() => {
    themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
    themeIcon.classList.remove('fade');
  }, 150);

  showToast(`Switched to ${next.charAt(0).toUpperCase() + next.slice(1)} Mode`, 'success');
});
