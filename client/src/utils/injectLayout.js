function loadComponent(selector, filePath, callback) {
  fetch(filePath)
    .then(res => res.text())
    .then(data => {
      document.querySelector(selector).innerHTML = data;
      if (callback) callback();  // Run callback after component is injected
    });
}

window.addEventListener("DOMContentLoaded", () => {
  // Inject Navbar first
  loadComponent("#navbar", "/client/src/components/navbar.html", () => {
  // Mobile menu toggle
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("active");
    });
  }

  // ✅ Highlight active nav link
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll("#nav-links a").forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (!link.classList.contains("login-btn") && linkPage === currentPage) {
      link.classList.add("active");
    }
  });
});


  // Inject Footer normally
  loadComponent("#footer", "/client/src/components/footer.html");
});
