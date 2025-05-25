function loadComponent(selector, filePath, callback) {
  fetch(filePath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.text();
    })
    .then(data => {
      document.querySelector(selector).innerHTML = data;
      if (callback) callback();
    })
    .catch(err => console.error(`Error loading ${filePath}:`, err));
}

window.addEventListener("DOMContentLoaded", () => {
  const basePath = "components/";

  // Load navbar and then trigger auth logic
  loadComponent("#navbar", basePath + "navbar.html", () => {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        hamburger.classList.toggle("active");
      });
    }

    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll("#nav-links a").forEach(link => {
      const linkPage = link.getAttribute("href").split("/").pop();
      if (!link.classList.contains("login-btn") && linkPage === currentPage) {
        link.classList.add("active");
      }
    });

    // ✅ Call auth logic after navbar is injected
    if (typeof runNavbarAuthLogic === 'function') {
      runNavbarAuthLogic();
    }
  });

  // Load footer as usual
  loadComponent("#footer", basePath + "footer.html");
});
