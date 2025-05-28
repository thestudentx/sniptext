document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const loginError = document.getElementById('loginError');

const host = window.location.hostname;
const BASE_URL = (host === 'localhost' || host === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://sniptext.onrender.com';

  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem('adminToken', data.token);
      window.location.href = 'index.html'; // redirect to admin dashboard
    } else {
      loginError.textContent = data.message || 'Login failed';
    }
  } catch (err) {
    loginError.textContent = 'Server error. Please try again.';
  }
});
