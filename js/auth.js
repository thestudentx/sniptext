function runNavbarAuthLogic() {
  const token = localStorage.getItem('token');
  const dashboardLink = document.getElementById('nav-dashboard-link');
  const logoutLink = document.getElementById('nav-logout-link');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryDate = new Date(payload.accessDuration);
      const now = new Date();

      if (now > expiryDate) {
        localStorage.removeItem('token');
        if (dashboardLink) dashboardLink.href = '/login.html';
        if (logoutLink) logoutLink.style.display = 'none';
        return;
      }

      if (dashboardLink) dashboardLink.href = '/dashboard.html';
      if (logoutLink) {
        logoutLink.style.display = 'inline';
        logoutLink.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        });
      }
    } catch (err) {
      console.error("Token parse error:", err);
      localStorage.removeItem('token');
    }
  } else {
    if (dashboardLink) dashboardLink.href = '/login.html';
    if (logoutLink) logoutLink.style.display = 'none';
  }
}
