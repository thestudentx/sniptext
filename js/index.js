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
