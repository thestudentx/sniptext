document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  showLoader(); // 🔵 Show global loader

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const BACKEND_URL = location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://sniptext.onrender.com';

  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('Login response:', data);

    hideLoader(); // 🟢 Hide loader before showing message

    if (response.ok) {
      localStorage.setItem('token', data.token);
      showLoginMessage("Login successful!", true); // ✅ Message box
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    } else {
      showLoginMessage(data.message || "Login failed. Please try again.", false); // ❌ Message box
    }
  } catch (err) {
    console.error('Login error:', err);
    hideLoader();
    showLoginMessage("Something went wrong. Please try again.", false);
  }
});
