// -------------------------- DASHBOARD DROPDOWN MENU --------------------------
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.getElementById('nav-links');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (isLoggedIn) {
    // Replace the last <li> (Login) with Dashboard dropdown
    const lastLi = navLinks.lastElementChild;
    lastLi.innerHTML = `
      <div class="dashboard-dropdown">
        <button class="dashboard-btn">Dashboard ▼</button>
        <div class="dropdown-menu">
          <a href="/client/src/pages/dashboard.html">My Dashboard</a>
          <a href="#" id="logoutBtn">Logout</a>
        </div>
      </div>
    `;

    // Handle Logout
    setTimeout(() => {
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('isLoggedIn');
          window.location.href = '/client/src/pages/login.html';
        });
      }
    }, 100);
  }

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
});




// -------------------------- TESTIMONIAL SECTION --------------------------
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".testimonial-track");
  const prev = document.querySelector(".carousel-btn.prev");
  const next = document.querySelector(".carousel-btn.next");
  const carousel = document.querySelector(".testimonial-carousel");

  let index = 0;
  const cardCount = track.children.length;
  let autoplayInterval;

  function updateCarousel() {
    const cardWidth = carousel.getBoundingClientRect().width;
    track.style.transform = `translateX(-${index * cardWidth}px)`;
  }

  function startAutoplay() {
    autoplayInterval = setInterval(() => {
      index = (index + 1) % cardCount;
      updateCarousel();
    }, 5000); // every 5 seconds
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  next.addEventListener("click", () => {
    index = (index + 1) % cardCount;
    updateCarousel();
  });

  prev.addEventListener("click", () => {
    index = (index - 1 + cardCount) % cardCount;
    updateCarousel();
  });

  window.addEventListener("resize", updateCarousel);

  // Pause autoplay on hover
  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  // Init
  updateCarousel();
  startAutoplay();
});






// -------------------------- FAQ SECTION --------------------------
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answer = btn.nextElementSibling;

      btn.setAttribute('aria-expanded', !isExpanded);
      const allAnswers = document.querySelectorAll('.faq-answer');
      const allQuestions = document.querySelectorAll('.faq-question');

      allAnswers.forEach(ans => {
        if (ans !== answer) {
          ans.style.maxHeight = null;
          ans.previousElementSibling.setAttribute('aria-expanded', false);
        }
      });

      if (!isExpanded) {
        answer.style.maxHeight = answer.scrollHeight + "px";
      } else {
        answer.style.maxHeight = null;
      }
    });
  });

  // Scroll animation
  const faqItems = document.querySelectorAll('.faq-item');

  const revealOnScroll = () => {
    faqItems.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        item.classList.add('visible');
        item.style.transitionDelay = `${i * 0.1}s`;
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  window.addEventListener('load', revealOnScroll);





// -------------------------- TOAST NOTIFICATION --------------------------
function showToast(a1, a2, a3) {
  let title, message, type;

  // Support both (message, type) or (title, message, type)
  if (a3 === undefined && ['success','error','info','warning'].includes(a2)) {
    message = a1;
    type    = a2;
    title   = type.charAt(0).toUpperCase() + type.slice(1);
  } else {
    title   = a1;
    message = a2;
    type    = a3 || 'info';
  }

  // Emoji icons
  // Inline SVG icons from Heroicons (24×24, solid)
  const icons = {
    success: `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 0 1 .083 1.32l-.083.094L8.414 15l-4.121-4.121a1 1 0 0 1 1.32-1.497l.094.083L8.414 12.586l7.879-7.879a1 1 0 0 1 1.414 0z" clip-rule="evenodd"/>
      </svg>`,
    error: `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.32-.083l.094.083L10 8.586l4.293-4.293a1 1 0 0 1 1.497 1.32l-.083.094L11.414 10l4.293 4.293a1 1 0 0 1-1.32 1.497l-.094-.083L10 11.414l-4.293 4.293a1 1 0 0 1-1.497-1.32l.083-.094L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd"/>
      </svg>`,
    info: `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
        <path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-9-4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm1 3a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0v-4a1 1 0 0 0-1-1z"/>
      </svg>`,
    warning: `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l5.285 9.4c.75 1.33-.213 2.9-1.742 2.9H4.714c-1.529 0-2.492-1.57-1.742-2.9l5.285-9.4zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-3a1 1 0 0 0-.993.883L9 11v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1z" clip-rule="evenodd"/>
      </svg>`
  };

  // Ensure container exists
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

   // ** FIFO: if already 3 toasts, remove the oldest **
  if (toastContainer.children.length >= 3) {
    toastContainer.removeChild(toastContainer.firstChild);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerHTML = `
    <div class="icon">${icons[type]}</div>
    <div class="text">
      <p>${title}</p>
      <p>${message}</p>
    </div>
    <button aria-label="Close toast" class="toast-close">&times;</button>
    <div class="progress-bar"></div>
  `;

  // Close button handler
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove();
    if (!toastContainer.children.length) toastContainer.classList.add("hidden");
  });

  // Auto-dismiss
  let timeoutId = setTimeout(() => {
    toast.remove();
    if (!toastContainer.children.length) toastContainer.classList.add("hidden");
  }, 4000);

  // Pause on hover
  toast.addEventListener("mouseenter", () => {
    toast.style.animationPlayState = "paused";
    toast.querySelector(".progress-bar").style.animationPlayState = "paused";
    clearTimeout(timeoutId);
  });
  toast.addEventListener("mouseleave", () => {
    toast.style.animationPlayState = "running";
    toast.querySelector(".progress-bar").style.animationPlayState = "running";
    // restart auto-dismiss
    timeoutId = setTimeout(() => {
      toast.remove();
      if (!toastContainer.children.length) toastContainer.classList.add("hidden");
    }, 2000); // give them 2s after un-hover
  });

  // Show it
  toastContainer.classList.remove("hidden");
  toastContainer.appendChild(toast);
}

// Expose globally
window.showToast = showToast;






// -------------------------- SCROLL TO TOP BUTTON --------------------------
const scrollBtn = document.getElementById("scrollToTopBtn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollBtn.classList.add("show");
  } else {
    scrollBtn.classList.remove("show");
  }
});

scrollBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});
