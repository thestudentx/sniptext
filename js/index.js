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




// -------------------------- HERO SECTION --------------------------
// Spotlight follows pointer
  (function () {
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    hero.addEventListener('pointermove', (e) => {
      if (reduce) return;
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--spot-x', x + '%');
      hero.style.setProperty('--spot-y', y + '%');
    });
  })();

  // Rotating word in tagline
  (function () {
    const el = document.querySelector('.rotate');
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const words = [
      'grammar checks',
      'plagiarism insights',
      'paraphrasing',
      'tone rewriting',
      'clarity boosts',
      'punctuation fixes'
    ];
    let i = 0;
    const swap = () => {
      i = (i + 1) % words.length;
      el.style.opacity = '0';
      setTimeout(() => { el.textContent = words[i]; el.style.opacity = '1'; }, 160);
    };
    if (!reduce) setInterval(swap, 1800);
  })();




  //  -------------------------- FEATURES CARDS / WHY CHOOSE US --------------------------
// reveal on scroll (staggered)
  (function(){
    const items = document.querySelectorAll('.features-section .reveal');
    if(!('IntersectionObserver' in window) || !items.length) return items.forEach(i=>i.classList.add('is-visible'));

    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e, idx)=>{
        if(e.isIntersecting){
          e.target.style.transitionDelay = (idx * 70) + 'ms';
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.12});
    items.forEach(i=>io.observe(i));
  })();

  // gentle 3D tilt on pointer (respects reduced motion)
  (function(){
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    document.querySelectorAll('.features-section .features-box').forEach(card=>{
      let leaveTimer;
      const damp = 18; // sensitivity
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('pointermove', (e)=>{
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const rx = (+py * damp);
        const ry = (-px * damp);
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', ()=>{
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(()=>{ card.style.transform = ''; }, 120);
      });
    });
  })();




  // -------------------------- TIMELINE SECTION --------------------------
  (function() {
  const section = document.getElementById('growth-timeline');
  if (!section) return;

  const items = Array.from(section.querySelectorAll('.timeline-item'));
  const line = section.querySelector('.timeline-line');
  const yearPill = section.querySelector('.year-pill');
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Assign stagger delays via CSS custom prop
  items.forEach((el, i) => el.style.setProperty('--i', i));

  // Reveal on scroll + active year update
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        e.target.classList.add('active');
        yearPill.textContent = e.target.dataset.year || yearPill.textContent;
      } else {
        e.target.classList.remove('active');
      }
      updateProgress();
    });
  }, {root: null, threshold: 0.26}) : null;

  if (io) items.forEach(el => io.observe(el)); else items.forEach(el => el.classList.add('is-visible'));

  // Progress fill = % of visible/active items (simple + performant)
  function updateProgress(){
    const active = items.filter(el => el.classList.contains('is-visible')).length;
    const pct = Math.round((active / items.length) * 100);
    line && line.style.setProperty('--progress', String(pct));
  }
  updateProgress();

  // Subtle pointer parallax on cards (disabled for reduced motion)
  if (!prefersReduce) {
    section.querySelectorAll('.timeline-content').forEach(card => {
      let t;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `translateY(-2px) rotateX(${y * 6}deg) rotateY(${x * -6}deg)`;
        clearTimeout(t);
      });
      card.addEventListener('pointerleave', () => {
        t = setTimeout(() => { card.style.transform = ''; }, 120);
      });
    });
  }
})();





// -------------------------- HOW IT WORKS SECTION --------------------------
(function(){
  const section = document.getElementById('how-it-works');
  if(!section) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const curve = section.querySelector('.curve-path');
  const steps = Array.from(section.querySelectorAll('.step-box.reveal'));

  // Reveal on scroll (staggered)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e, idx)=>{
        if(e.isIntersecting){
          e.target.style.transitionDelay = (idx * 80) + 'ms';
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18 });
    steps.forEach(s => io.observe(s));
  } else {
    steps.forEach(s => s.classList.add('is-visible'));
  }

  // Draw the connector curve when section enters viewport
  if (curve && 'IntersectionObserver' in window && !reduce) {
    const once = new IntersectionObserver((entries)=>{
      entries.forEach((e)=>{
        if(e.isIntersecting){
          requestAnimationFrame(()=>{ curve.style.strokeDashoffset = '0'; });
          once.disconnect();
        }
      });
    }, { threshold: 0.2 });
    once.observe(section);
  } else if (curve && !reduce) {
    curve.style.strokeDashoffset = '0';
  }

  // Subtle pointer tilt on cards
  if (!reduce) {
    section.querySelectorAll('.step-box').forEach(card=>{
      let timeout;
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('pointermove', (e)=>{
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `rotateX(${y*6}deg) rotateY(${x*-6}deg) translateY(-2px)`;
        clearTimeout(timeout);
      });
      card.addEventListener('pointerleave', ()=>{
        timeout = setTimeout(()=>{ card.style.transform = ''; }, 120);
      });
    });
  }
})();





// -------------------------- USE CASES SECTION --------------------------
(function(){
  const section = document.getElementById('use-cases');
  if (!section) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid = section.querySelector('#use-cases-grid');
  const cards = Array.from(section.querySelectorAll('.use-case-card'));
  const chips = Array.from(section.querySelectorAll('.filter-chip'));

  // reveal on scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e, i)=>{
        if(e.isIntersecting){
          e.target.style.transitionDelay = (i * 80) + 'ms';
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(c => io.observe(c));
  } else {
    cards.forEach(c => c.classList.add('is-visible'));
  }

  // filter
  chips.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      chips.forEach(c=>{ c.classList.remove('is-active'); c.setAttribute('aria-selected','false'); });
      btn.classList.add('is-active'); btn.setAttribute('aria-selected','true');
      const value = btn.dataset.filter;
      cards.forEach(card=>{
        const role = card.dataset.userRole;
        const show = (value === 'all' || value === role);
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  // subtle tilt (disabled with reduced motion)
  if (!reduce) {
    cards.forEach(card=>{
      let t;
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('pointermove', (e)=>{
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `rotateX(${y*6}deg) rotateY(${x*-6}deg) translateY(-2px)`;
        clearTimeout(t);
      });
      card.addEventListener('pointerleave', ()=>{ t = setTimeout(()=>{ card.style.transform = ''; }, 120); });
    });
  }
})();




// ---------------- TESTIMONIALS — snap aware paging with dots ----------------
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("testimonials");
  const viewport = section.querySelector(".testimonial-viewport");
  const track = section.querySelector(".testimonial-track");
  const cards = Array.from(track.children);
  const prev = section.querySelector(".carousel-btn.prev");
  const next = section.querySelector(".carousel-btn.next");
  const dotsWrap = section.querySelector(".carousel-dots");
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Avatar initials fallback
  function initials(name=""){
    const p = name.trim().split(/\s+/).filter(Boolean);
    return ((p[0]?.[0]||"") + (p[1]?.[0]||"")).toUpperCase() || "??";
  }
  function gradient(name){
    let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0;
    const h1=h%360, h2=(h1+40+(h%20))%360;
    return `linear-gradient(135deg,hsl(${h1} 72% 48%),hsl(${h2} 72% 52%))`;
  }
  cards.forEach(card=>{
    const wrap = card.querySelector(".avatar-wrap");
    const img = card.querySelector("img.avatar");
    const n = card.dataset.name || card.querySelector("h4")?.textContent || "User";
    const make = ()=>{
      wrap.innerHTML = "";
      const d = document.createElement("div");
      d.className = "avatar-initial";
      d.textContent = initials(n);
      d.style.background = gradient(n);
      wrap.appendChild(d);
    };
    if (!wrap) return;
    if (!img || !img.getAttribute("src")) { make(); return; }
    img.addEventListener("error", make, { once: true });
  });

  // Reveal on scroll
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    },{ threshold: 0.12 });
    cards.forEach(c=>io.observe(c));
  } else { cards.forEach(c=>c.classList.add("is-visible")); }

  // Snap paging helpers
  function pages(){
    // total pages = ceil(scrollWidth / clientWidth)
    return Math.max(1, Math.ceil(viewport.scrollWidth / viewport.clientWidth));
  }
  function currentPage(){
    return Math.round(viewport.scrollLeft / viewport.clientWidth);
  }
  function goTo(pageIndex){
    const x = pageIndex * viewport.clientWidth;
    viewport.scrollTo({ left: x, behavior: prefersReduce ? "auto" : "smooth" });
  }

  // Dots
  function renderDots(){
    const n = pages();
    dotsWrap.innerHTML = "";
    for(let i=0;i<n;i++){
      const b=document.createElement("button");
      b.type="button"; if(i===currentPage()) b.classList.add("is-active");
      b.setAttribute("role","tab");
      b.setAttribute("aria-label",`Go to page ${i+1}`);
      b.addEventListener("click",()=>goTo(i));
      dotsWrap.appendChild(b);
    }
  }
  function updateDotsActive(){
    const i = currentPage();
    Array.from(dotsWrap.children).forEach((d,idx)=>d.classList.toggle("is-active", idx===i));
  }

  // Buttons
  prev.addEventListener("click", ()=>goTo(currentPage()-1));
  next.addEventListener("click", ()=>goTo(currentPage()+1));

  // Keyboard on viewport
  section.addEventListener("keydown", (e)=>{
    if (e.key === "ArrowRight") goTo(currentPage()+1);
    if (e.key === "ArrowLeft")  goTo(currentPage()-1);
  });

  // Sync dots on scroll end
  let t=null;
  viewport.addEventListener("scroll", ()=>{
    clearTimeout(t);
    t=setTimeout(updateDotsActive, 80);
  }, { passive:true });

  // Resize observer to keep everything responsive
  const ro = new ResizeObserver(()=>{ renderDots(); updateDotsActive(); });
  ro.observe(viewport);

  // Init
  renderDots(); updateDotsActive();
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





// -------------------------- FOOTER & SCROLL TO TOP BUTTON ----------------------------------------
(() => {
  // current year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // back-to-top + progress ring
  const btn = document.getElementById('to-top');
  if (!btn) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll(){
    const st = window.scrollY || document.documentElement.scrollTop;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    const pct = Math.max(0, Math.min(1, dh ? st / dh : 0));
    btn.style.setProperty('--p', (pct * 100) + '%');
    btn.classList.toggle('is-visible', st > 120);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll);

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();





// -------------------------------------------------------------------------------------
// ULTRA TOAST JS (keeps your API + adds options, positions, actions, swipe, a11y)
// -------------------------------------------------------------------------------------
(function(){
  const TYPES = ['success','error','info','warning'];
  const ICONS = {
    success:`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="18" height="18"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 0 1 .083 1.32l-.083.094L8.414 15l-4.121-4.121a1 1 0 0 1 1.32-1.497l.094.083L8.414 12.586l7.879-7.879a1 1 0 0 1 1.414 0z" clip-rule="evenodd"/></svg>`,
    error:`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="18" height="18"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.32-.083l.094.083L10 8.586l4.293-4.293a1 1 0 0 1 1.497 1.32l-.083.094L11.414 10l4.293 4.293a1 1 0 0 1-1.32 1.497l-.094-.083L10 11.414l-4.293 4.293a1 1 0 0 1-1.497-1.32l.083-.094L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd"/></svg>`,
    info:`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="18" height="18"><path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-9-4a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm1 3a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0v-4a1 1 0 0 0-1-1z"/></svg>`,
    warning:`<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="18" height="18"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l5.285 9.4c.75 1.33-.213 2.9-1.742 2.9H4.714c-1.529 0-2.492-1.57-1.742-2.9l5.285-9.4zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-3a1 1 0 0 0-.993.883L9 11v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1z" clip-rule="evenodd"/></svg>`
  };

  function getContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container toast-pos-tr';
      el.setAttribute('aria-live','polite');
      el.setAttribute('aria-atomic','true');
      document.body.appendChild(el);
    }
    return el;
  }

  function parseArgs(a1, a2, a3){
    // Backward compatible:
    // showToast(message, type) | showToast(title, message, type)
    // New: showToast({ title, message, type, duration, actions, position, aria })
    if (typeof a1 === 'object') {
      const o = {...a1};
      if (!o.type) o.type = 'info';
      if (!o.title) o.title = o.type.charAt(0).toUpperCase()+o.type.slice(1);
      return o;
    }
    if (a3 === undefined && TYPES.includes(a2)) {
      return {
        title: a2.charAt(0).toUpperCase()+a2.slice(1),
        message: a1, type: a2
      };
    }
    return { title:a1, message:a2, type: a3 || 'info' };
  }

  function setPosition(container, pos){
    if (!pos) return;
    container.classList.remove('toast-pos-tr','toast-pos-br','toast-pos-tl','toast-pos-bl','toast-pos-center');
    container.classList.add(`toast-pos-${pos}`);
  }

  function createToast({title, message, type, duration, actions, aria}){
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.style.setProperty('--toast-duration', (duration || 4200) + 'ms');
    t.setAttribute('role', (type === 'error' || type === 'warning') ? 'alert' : 'status');
    if (aria?.label) t.setAttribute('aria-label', aria.label);

    // stagger based on current stack
    const container = getContainer();
    const index = container.children.length;
    t.style.setProperty('--stagger', (index * 60) + 'ms');

    t.innerHTML = `
      <div class="icon" aria-hidden="true">${ICONS[type] || ICONS.info}</div>
      <div class="text">
        <p class="title">${title}</p>
        <p class="desc">${message}</p>
        ${Array.isArray(actions) && actions.length ? `<div class="actions">${actions.map((a,i)=>`<button class="btn ${a.primary?'primary':''}" data-idx="${i}">${a.label}</button>`).join('')}</div>`:''}
      </div>
      <button class="toast-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.3 5.71a1 1 0 0 1 0 1.41L13.41 12l4.89 4.88a1 1 0 0 1-1.42 1.42L12 13.41l-4.88 4.89a1 1 0 1 1-1.42-1.42L10.59 12 5.7 7.12A1 1 0 1 1 7.12 5.7L12 10.59l4.88-4.89a1 1 0 0 1 1.42 0Z"/></svg>
      </button>
      <div class="progress"></div>
    `;

    // close
    const close = ()=> {
      if (t._closing) return;
      t._closing = true;
      // trigger exit sooner
      const now = getComputedStyle(t).getPropertyValue('--toast-duration');
      t.style.setProperty('--leave-delay','0ms');
      // allow exit animation to play
      setTimeout(()=> { t.remove(); if (!container.children.length) container.classList.add('hidden'); }, 260);
    };
    t.querySelector('.toast-close').addEventListener('click', close);

    // actions
    if (Array.isArray(actions)) {
      t.querySelectorAll('.actions .btn').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          const idx = +btn.dataset.idx;
          try { actions[idx]?.onClick?.(e); } catch(_){}
          close();
        });
      });
    }

    // auto dismiss
    let timer = setTimeout(close, duration || 4200);

    // pause on hover/focus
    const pause = ()=> { t.style.animationPlayState='paused'; t.querySelector('.progress').style.animationPlayState='paused'; clearTimeout(timer); };
    const resume= ()=> {
      t.style.animationPlayState='running';
      t.querySelector('.progress').style.animationPlayState='running';
      timer = setTimeout(close, Math.min(2200, (duration||4200)/2)); // grace after resume
    };
    t.addEventListener('mouseenter', pause);
    t.addEventListener('mouseleave', resume);
    t.addEventListener('focusin', pause);
    t.addEventListener('focusout', resume);

    // swipe to dismiss
    let startX=0, dx=0, swiping=false;
    const onDown = e=>{
      swiping=true;
      t.classList.add('swiping');
      startX = (e.touches? e.touches[0].clientX : e.clientX);
      pause();
    };
    const onMove = e=>{
      if(!swiping) return;
      const x = (e.touches? e.touches[0].clientX : e.clientX);
      dx = x - startX;
      t.style.transform = `translateX(${dx}px)`;
      t.style.opacity = String(Math.max(0, 1 - Math.abs(dx)/160));
    };
    const onUp = ()=>{
      if(!swiping) return;
      swiping=false;
      t.classList.remove('swiping');
      if (Math.abs(dx) > 100) { close(); }
      else {
        t.style.transition = 'transform .35s cubic-bezier(.2,.7,.2,1.1), opacity .35s ease';
        t.style.transform = '';
        t.style.opacity = '';
        setTimeout(()=> t.style.transition='', 360);
        resume();
      }
    };
    t.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, {once:false});

    // cleanup listeners on close
    t.addEventListener('transitionend', ()=>{
      if (!document.body.contains(t)) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    });

    return t;
  }

  function showToast(a1, a2, a3){
    const opts = parseArgs(a1, a2, a3);
    const container = getContainer();

    // positioning (optional in opts)
    if (opts.position) setPosition(container, opts.position);

    // FIFO cap 3
    while (container.children.length >= 3) container.removeChild(container.firstElementChild);

    const el = createToast(opts);
    container.classList.remove('hidden');
    container.appendChild(el);
  }

  // expose
  window.showToast = showToast;
})();
