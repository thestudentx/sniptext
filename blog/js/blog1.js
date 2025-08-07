// ===== blog1.js =====

document.addEventListener('DOMContentLoaded', () => {
  // Read More Toggle
  document.querySelectorAll('.read-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const full = btn.nextElementSibling;
      full.classList.toggle('expanded');
      btn.textContent = full.classList.contains('expanded') ? 'Show Less' : 'Read More';

      // On expand, gently scroll just enough to reveal content
      if (full.classList.contains('expanded')) {
        full.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',    // <-- only scroll minimally
          inline: 'nearest'
        });
      }
    });
  });

  // Optional: Intersection Observer to trigger CSS animations when cards scroll into view
  const cards = document.querySelectorAll('.post-item');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    cards.forEach(card => observer.observe(card));
  }
});
