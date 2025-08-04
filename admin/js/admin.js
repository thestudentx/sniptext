// LOGIN CHECK 
const adminToken = localStorage.getItem('adminToken');
if (!adminToken) {
  window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Modal Helpers
  window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  };

  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  };

  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Logout button handler
const logoutBtn = document.getElementById('adminLogoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    showToast('Info', 'Logged out successfully!', 'info');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 2000);
  });
}

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

});
