// Modern Blog JavaScript - Enhanced User Experience

class ModernBlog {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.handleLoading();
    this.setupScrollProgress();
    this.setupThemeToggle();
    this.setupSmoothScrolling();
    this.setupBackToTop();
    this.setupMobileNavigation();
    this.setupCollapsibleSections();
    this.setupIntersectionObserver();
    this.setupLazyLoading();
  }

  setupEventListeners() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }

    // Window events
    window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    window.addEventListener('load', this.handleWindowLoad.bind(this));
  }

  onDOMReady() {
    // Initialize theme from localStorage
    this.initializeTheme();
    
    // Add fade-in animations to elements
    this.addFadeInAnimations();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
  }

  handleLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Simulate loading time for demo purposes
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }
    }, 1500);
  }

  handleWindowLoad() {
    // Additional optimizations after full page load
    this.optimizeImages();
    this.preloadCriticalResources();
  }

  setupScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    this.updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressBar.setAttribute('aria-valuenow', Math.round(progress));
    };

    // Initial call
    this.updateScrollProgress();
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Add transition class for smooth theme change
      document.documentElement.classList.add('theme-transition');
      
      // Update theme
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update icon
      if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      }
      
      // Remove transition class after animation
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
      
      // Announce theme change for screen readers
      this.announceToScreenReader(`Switched to ${newTheme} mode`);
    });
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  setupSmoothScrolling() {
    // Handle navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
          const targetPosition = targetElement.offsetTop - navbarHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Update URL without jumping
          history.pushState(null, null, `#${targetId}`);
          
          // Close mobile menu if open
          this.closeMobileMenu();
        }
      });
    });
  }

  setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Show/hide based on scroll position
    this.toggleBackToTop = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldShow = scrollTop > 300;
      
      backToTopBtn.classList.toggle('visible', shouldShow);
    };
  }

  setupMobileNavigation() {
    const hamburger = document.getElementById('nav-hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.contains('active');
      
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      
      // Update ARIA attributes
      hamburger.setAttribute('aria-expanded', !isActive);
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isActive ? '' : 'hidden';
      
      // Announce state change for screen readers
      this.announceToScreenReader(isActive ? 'Menu closed' : 'Menu opened');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  closeMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  setupCollapsibleSections() {
    document.querySelectorAll('.collapsible-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const content = toggle.nextElementSibling;
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Toggle expanded state
        toggle.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('expanded');
        
        // Smooth height animation
        if (!isExpanded) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0px';
        }
        
        // Announce state change for screen readers
        const sectionTitle = toggle.querySelector('span').textContent;
        this.announceToScreenReader(`${sectionTitle} ${isExpanded ? 'collapsed' : 'expanded'}`);
      });
    });
  }

  setupIntersectionObserver() {
    // Animate elements as they come into view
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements that should animate on scroll
    document.querySelectorAll('.article-card, .bio-card, .section-title').forEach(el => {
      observer.observe(el);
    });
  }

  setupLazyLoading() {
    // Lazy load images when they come into view
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Skip to main content (accessibility)
      if (e.key === 'Tab' && e.shiftKey && document.activeElement === document.body) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.focus();
          e.preventDefault();
        }
      }
      
      // Navigate with arrow keys in article grid
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('article-card')) {
          const articles = Array.from(document.querySelectorAll('.article-card'));
          const currentIndex = articles.indexOf(focusedElement);
          let nextIndex;
          
          if (e.key === 'ArrowDown') {
            nextIndex = Math.min(currentIndex + 1, articles.length - 1);
          } else {
            nextIndex = Math.max(currentIndex - 1, 0);
          }
          
          articles[nextIndex].focus();
          e.preventDefault();
        }
      }
    });
  }

  addFadeInAnimations() {
    // Add staggered animations to grid items
    const gridItems = document.querySelectorAll('.articles-grid .article-card');
    gridItems.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
    });
  }

  handleScroll() {
    // Update scroll progress
    if (this.updateScrollProgress) {
      this.updateScrollProgress();
    }
    
    // Toggle back to top button
    if (this.toggleBackToTop) {
      this.toggleBackToTop();
    }
    
    // Update navbar appearance on scroll
    this.updateNavbarOnScroll();
  }

  updateNavbarOnScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldAddShadow = scrollTop > 10;
    
    navbar.style.boxShadow = shouldAddShadow 
      ? '0 2px 20px rgba(0, 0, 0, 0.1)' 
      : 'none';
  }

  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }
    
    // Recalculate scroll progress
    if (this.updateScrollProgress) {
      this.updateScrollProgress();
    }
  }

  optimizeImages() {
    // Add loading="lazy" to images below the fold
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach((img, index) => {
      if (index > 2) { // Skip first few images
        img.loading = 'lazy';
      }
    });
  }

  preloadCriticalResources() {
    // Preload critical fonts
    const fontPreloads = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap'
    ];
    
    fontPreloads.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  announceToScreenReader(message) {
    // Create a live region for screen reader announcements
    let liveRegion = document.getElementById('sr-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'sr-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  // Utility functions
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
}

// Enhanced Share Functionality
class ShareManager {
  constructor() {
    this.setupShareButtons();
  }

  setupShareButtons() {
    document.querySelectorAll('.share-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const shareType = link.textContent.toLowerCase();
        const url = window.location.href;
        const title = document.title;
        
        this.share(shareType, url, title);
      });
    });
  }

  share(type, url, title) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    switch (type) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'copy':
        this.copyToClipboard(url);
        break;
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showCopyFeedback('Link copied to clipboard!');
    }
  }

  showCopyFeedback(message) {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--accent-primary);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: var(--font-heading);
      font-weight: 500;
      z-index: 10000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }
}

// Performance Monitor
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor largest contentful paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.lcp = entry.startTime;
          }
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  logMetrics() {
    const loadTime = performance.now() - this.startTime;
    console.log('Performance Metrics:', {
      loadTime: `${loadTime.toFixed(2)}ms`,
      lcp: this.metrics.lcp ? `${this.metrics.lcp.toFixed(2)}ms` : 'Not available'
    });
  }
}

// Add CSS for copy feedback animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }
  
  .theme-transition * {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
  }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const blog = new ModernBlog();
  const shareManager = new ShareManager();
  const performanceMonitor = new PerformanceMonitor();
  
  // Log performance metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logMetrics();
    }, 1000);
  });
});

// Service Worker Registration (for future PWA capabilities)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment when service worker is implemented
    // navigator.serviceWorker.register('/sw.js')
    //   .then(registration => console.log('SW registered'))
    //   .catch(error => console.log('SW registration failed'));
  });
}


// Filter Pills Functionality (Added separately for clarity)
document.addEventListener("DOMContentLoaded", () => {
  const pills = document.querySelectorAll(".filter-pill");
  const articles = document.querySelectorAll(".article-card");

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      // update active pill
      pills.forEach(p => {
        p.classList.remove("is-active");
        p.setAttribute("aria-pressed", "false");
      });
      pill.classList.add("is-active");
      pill.setAttribute("aria-pressed", "true");

      // get filter category
      const filter = pill.getAttribute("data-filter");

      // filter articles
      articles.forEach(article => {
        if (filter === "all" || article.dataset.cat.includes(filter)) {
          article.style.display = "";
        } else {
          article.style.display = "none";
        }
      });
    });
  });

  // mark the initial active pill for screen readers
  const active = document.querySelector(".filter-pill.is-active");
  if (active) active.setAttribute("aria-pressed", "true");
});