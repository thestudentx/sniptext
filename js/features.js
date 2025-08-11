/* ==========================================================================
   FEATURES PAGE INTERACTIONS
   - reveal on scroll
   - sticky tabs active state
   - safe hamburger toggle (uses existing logic)
   ========================================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          if (!reduce) e.target.style.transitionDelay = (i * 60) + 'ms';
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Sticky tabs highlight ---------- */
  const tabs = Array.from(document.querySelectorAll('.features-tabs .tab'));
  const sections = tabs.map(t => document.querySelector(t.getAttribute('href')));
  if ('IntersectionObserver' in window) {
    const hi = new IntersectionObserver((entries) => {
      // find the top-most visible section
      const vis = entries.filter(e => e.isIntersecting).sort((a,b)=>a.boundingClientRect.top - b.boundingClientRect.top);
      if (!vis.length) return;
      const id = '#' + vis[0].target.id;
      tabs.forEach(tab => tab.classList.toggle('is-active', tab.getAttribute('href') === id));
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });
    sections.forEach(s => s && hi.observe(s));
  }
  // click smooth scroll
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const sel = tab.getAttribute('href');
      const target = document.querySelector(sel);
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60) - 8;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Hamburger existing logic safety (kept intact, adds ARIA) ---------- */
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  if (hamburger && navLinks) {
    const toggleMenu = () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', navLinks.classList.contains('open') ? 'true' : 'false');
    };
    // avoid double-binding: remove old listeners by cloning
    const clone = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(clone, hamburger);
    clone.addEventListener('click', toggleMenu);
    clone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
  }
})();
