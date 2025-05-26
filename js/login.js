document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  showLoader(); // 🔵 Show global loader

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // 🔍 Log the submitted data
  console.log('🧪 Submitted login data:', { email, password });

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

    // 📩 Log server response details
    console.log('📩 Server responded with status:', response.status);
    console.log('📨 Response body:', data);

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

// Function to Show/Hide password 
document.getElementById('toggle-password').addEventListener('click', function () {
  const passwordInput = document.getElementById('password');
  const type = passwordInput.getAttribute('type');
  const isHidden = type === 'password';

  passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
  this.textContent = isHidden ? '🙈' : '👁️';
  this.setAttribute('aria-label', isHidden ? 'Hide Password' : 'Show Password');
});
