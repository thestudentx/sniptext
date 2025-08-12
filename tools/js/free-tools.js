/**
 * main.js
 * - keyboard / click support for the cards
 * - theme helper (optional) - toggles data-theme on <html>
 * - simple reveal animation via IntersectionObserver
 */

// ------------------------------- HERO SECTION -------------------------------
  // Gentle parallax on mouse move (visual only; no layout shifts)
  (() => {
    const v = document.querySelector('.tools-hero--writing .hero-visual');
    if(!v) return;
    let rAF;
    v.addEventListener('pointermove', (e) => {
      const rect = v.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        v.querySelector('.writing-visual').style.transform =
          `translate3d(${x*8}px, ${y* -6}px, 0)`;
      });
    });
    v.addEventListener('pointerleave', () => {
      v.querySelector('.writing-visual').style.transform = '';
    });
  })();




  

/* ===== card click / keyboard behavior ===== */
document.addEventListener('click', function (e) {
  const card = e.target.closest('.tool-card');
  if (card && card.dataset.href) {
    // allow clicking CTA anchor to behave normally
    if (e.target.closest('a')) return;
    window.location.href = card.dataset.href;
  }
});

document.addEventListener('keydown', function (e) {
  // Enter key opens focused card
  if (e.key === 'Enter') {
    const active = document.activeElement;
    if (active && active.classList.contains('tool-card') && active.dataset.href) {
      window.location.href = active.dataset.href;
    }
  }
});

/* ===== optional: theme toggle utility (safe to use if you don't already have one) ===== */
window.themeToggle = function (to) {
  // to: "dark" | "light" | "system"
  const root = document.documentElement;
  if (to === 'system') {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', to === 'dark' ? 'dark' : 'light');
};

/* ===== reveal animation (lightweight) ===== */
(function () {
  if (!('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.tool-card, .hero-content, .hero-visual');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.style.transition = 'opacity 420ms ease, transform 500ms cubic-bezier(.2,.9,.25,1)';
        ent.target.style.opacity = 1;
        ent.target.style.transform = 'translateY(0)';
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach((it, i) => {
    it.style.opacity = 0;
    it.style.transform = 'translateY(12px)';
    io.observe(it);
  });
})();
