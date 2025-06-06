// LOGIN CHECK 
const adminToken = localStorage.getItem('adminToken');
if (!adminToken) {
  window.location.href = 'admin-login.html'; // or './admin-login.html' if needed
}

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

  // Logout button handler
const logoutBtn = document.getElementById('adminLogoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html'; // update if your login page path is different
  });
}

// Toast Notifications
window.showToast = function (message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;

  // Reset class to base
  toast.className = 'toast';

  // Add type class for styling
  toast.classList.add(type); // e.g., 'success', 'error'

  // Show animation
  toast.classList.add('show');

  // Hide after duration
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};


});
