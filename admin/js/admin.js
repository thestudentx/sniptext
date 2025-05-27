document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // ✅ Prevents <a href="#"> from reloading the page

      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));

      link.classList.add('active');
      const section = document.getElementById(`${link.dataset.section}-section`);
      if (section) section.classList.remove('hidden');

      document.getElementById('section-title').textContent = link.textContent.trim();
    });
  });


  // Modal Helpers
  window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  };

  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  };

  // Cancel buttons (with data-modal-close attr)
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-close');
      if (modalId) closeModal(modalId);
    });
  });

  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
});
