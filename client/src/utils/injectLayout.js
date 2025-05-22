function loadComponent(selector, filePath, callback) {
  fetch(filePath)
    .then(res => res.text())
    .then(data => {
      document.querySelector(selector).innerHTML = data;
      if (callback) callback();  // Run callback after injection
    });
}

window.addEventListener("DOMContentLoaded", () => {
  loadComponent("#navbar", "/client/src/components/navbar.html", () => {
    // Add navbar script here AFTER it's injected
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        hamburger.classList.toggle("active");
      });
    }
  });

  loadComponent("#footer", "/client/src/components/footer.html");
});
