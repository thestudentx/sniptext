// Double-submit guard
let submitting = false;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Read fields
  const emailEl = document.getElementById('email');
  const passEl  = document.getElementById('password');
  const email    = emailEl.value.trim();
  const password = passEl.value;

  // Simple validation without changing your flow
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (!email || !isValidEmail(email) || !password || password.length < 6) {
    // keep your loader intact by not starting it on invalid input
    showToast('Please enter a valid email and a password of at least 6 characters.', 'error');
    return;
  }

  if (submitting) return;
  submitting = true;

  // Start your existing loader
  showLoader();

  // Disable button to prevent fast resubmits
  const btn = document.querySelector('.btn-login');
  const originalBtnText = btn ? btn.textContent : null;
  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Signing in...';
  }

  console.log('🧪 Submitted login data:', { email, password });

  const BACKEND_URL = location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://sniptext.onrender.com';

  try {
    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // Safer JSON parsing if backend returns empty body or non-JSON
    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    console.log('📩 Status:', res.status, 'Body:', data);

    hideLoader();

    // Re-enable button
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = originalBtnText || 'Login';
    }
    submitting = false;

    if (res.ok) {
      if (data.token) localStorage.setItem('token', data.token);
      showToast('Welcome Back! Your dashboard is ready', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    } else {
      showToast(data.message || 'Login failed. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    hideLoader();
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = originalBtnText || 'Login';
    }
    submitting = false;
    showToast('Something went wrong. Please try again.', 'error');
  }
});

// Toggle password visibility
const toggleBtn = document.getElementById('toggle-password');
if (toggleBtn) {
  toggleBtn.addEventListener('click', function () {
    const pw = document.getElementById('password');
    const isHidden = pw.type === 'password';
    pw.type = isHidden ? 'text' : 'password';
    this.textContent = isHidden ? '🙈' : '👁️';
    this.setAttribute('aria-label', isHidden ? 'Hide Password' : 'Show Password');
  });
}
