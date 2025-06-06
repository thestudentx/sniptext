// js/auth.js

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

// Inject the navbar and footer components
window.addEventListener('DOMContentLoaded', () => {
  // Navbar auth logic
  runNavbarAuthLogic();

  // Protect turnitin1.html from unauthorized access
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage === "turnitin1.html") {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryDate = new Date(payload.accessDuration);
      const now = new Date();
      if (now > expiryDate) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
      }
    } catch (err) {
      console.error("Token parse error on turnitin1:", err);
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }
  }

  // Optional: hamburger toggle
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("active");
    });
  }

  // Optional: highlight current page
  document.querySelectorAll("#nav-links a").forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (!link.classList.contains("login-btn") && linkPage === currentPage) {
      link.classList.add("active");
    }
  });
});