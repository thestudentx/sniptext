document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  // Show loader
  showLoader();

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
      hideLoader();
      // Show a success toast
      showToast('Success', 'Logged in successfully!', 'success');
      // Redirect after a brief pause so the user sees the toast
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);

    } else {
      hideLoader();
      // Error toast
      showToast('Error', data.message || 'Login failed', 'error');
    }
  } catch (err) {
    console.error('Admin login error:', err);
    hideLoader();
    showToast('Error', 'Server error. Please try again.', 'error');
  }
});
