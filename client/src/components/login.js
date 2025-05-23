document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorContainer = document.getElementById('login-error');

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Temporary check – replace with real authentication logic later
    if (username === 'user@gmail.com' && password === 'pass123') {
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = '/client/src/pages/dashboard.html';
    } else {
      errorContainer.textContent = 'Invalid credentials. Please try again.';
    }
  });
});
