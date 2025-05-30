document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const loginErr = document.getElementById('loginError');
  const loader   = document.getElementById('global-loader');

  // Show loader
  loader.style.display = 'flex'; // or 'block' if no flex styles

  const host = window.location.hostname;
  const BASE_URL = (host === 'localhost' || host === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://sniptext.onrender.com';

  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem('adminToken', data.token);
      window.location.href = '/admin';
    } else {
      loader.style.display = 'none'; // Hide loader
      loginErr.textContent = data.message || 'Login failed';
    }
  } catch (err) {
    console.error('Admin login error:', err);
    loader.style.display = 'none'; // Hide loader
    loginErr.textContent = 'Server error. Please try again.';
  }
});
