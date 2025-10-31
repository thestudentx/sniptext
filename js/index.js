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




// ---------------- TESTIMONIALS - snap aware paging with dots ----------------
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


// -------------------------- CHAT / Q&A WIDGET (Debounce + No-dup + Avatars + Scroll Sentinel) --------------------------
(() => {
  // ========================== INTEGRATION HOOKS (logging) ==========================
  window.SNIPCHAT = window.SNIPCHAT || {};
  if (!window.SNIPCHAT.log){
    window.SNIPCHAT.log = (type, payload) => {
      console.log("[SnipChat log]", type, payload);
    };
  }

  const CALENDLY_URL = "https://calendly.com/checkai/sniptext-consult";
  const SUPPORT_EMAIL = "support@checkai.pro";

  // ========================== Q&A (strings OR cards) ==========================
  const QA = {
    /* Core */
    "how it works": {
      type: 'card',
      title: 'How SnipText works',
      bullets: [
        'Choose a tool (Grammar, Paraphrase, Originality, Tone)',
        'Upload or paste your content',
        'Review changes with explain-why details',
        'Export/share (DOCX/PDF) - privacy-first'
      ],
      ctas: [{ label: 'Try the Editor', href: '/editor' }]
    },
    "pro vs free": {
      type: 'card',
      title: 'Pro vs Free',
      bullets: [
        'Free: 20+ tools with fair-use limits',
        'Pro: higher quotas, batch files, premium AI models',
        'Extras: citation helpers, priority support'
      ],
      html: `Need help choosing? <a class="chat-link" href="https://checkai.pro/contact" target="_blank" rel="noopener">Contact sales</a>.`,
      ctas: [{ label: 'Contact sales', href: 'https://checkai.pro/contact' }]
    },
    "sniptext plagiarism checker": "Flags overlaps and paraphrases with similarity score and source hints-verify and cite as needed.",
    "sniptext paraphraser": "Rewrites while preserving meaning. Choose tones like Academic, Concise, Casual, Fluent, or Formal.",
    "contact": "Support: <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a> · Phone: +92 341 837 8430",
    "privacy": "Processing runs in-browser when possible. When cloud models are used, your text is not used to train them. You can export/delete anytime.",
    "what is sniptext": "An all-in-one writing workspace with AI-powered grammar, paraphrasing, originality checks, and fast export.",

    /* Turnitin */
    "turnitin pricing": "Reach us via <a href='https://checkai.pro/contact' target='_blank' rel='noopener' class='chat-link'>Contact page</a> for a Turnitin Student/Instructor quote, or email <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a>.",
    "turnitin how it works": "Submissions are checked against web, publications, and institutional databases; you receive a similarity report for review.",
    "turnitin report time": "Often minutes; during peak times it can take longer (up to ~24 hours).",
    "turnitin vs sniptext": "Turnitin is an academic originality checker (institution-licensed). SnipText is a writer-side workspace for drafting and revising pre-submission.",

    /* QuillBot */
    "quillbot pricing": "Flexible QuillBot plans (1, 3, 6, or 12 months). For current pricing, use the <a href='https://checkai.pro/contact' target='_blank' rel='noopener' class='chat-link'>Contact page</a> or email <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a>.",
    "quillbot how it works": "AI rephrasing with modes (e.g., Formal/Fluency). It rewrites text while aiming to preserve meaning.",
    "quillbot vs sniptext": "QuillBot focuses on paraphrasing. SnipText adds grammar, originality insights, citations, and exports-in one editor.",

    /* AI detection */
    "ai detection tools": "They estimate the likelihood text was AI-generated via statistical cues. Use as a signal, not a verdict.",
    "ai detection accuracy": "Varies by tool and text. Short or heavily edited text can be misclassified-always apply judgment.",
    "ai detection pricing": "AI detection plans available. For pricing, visit the <a href='https://checkai.pro/contact' target='_blank' rel='noopener' class='chat-link'>Contact page</a> or email <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a>.",
    "ai detection vs sniptext": "SnipText provides AI signals as guidance plus concrete editing tools. We encourage transparent, ethical writing.",

    /* ChatGPT */
    "chatgpt pricing": "We offer ChatGPT-5 subscriptions for 1- or 2-month durations. For current pricing, use the <a href='https://checkai.pro/contact' target='_blank' rel='noopener' class='chat-link'>Contact page</a> or email <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a>.",
    "chatgpt how it works": "You prompt a large language model for drafting/ideas. Review for accuracy and cite sources where needed.",
    "chatgpt vs sniptext": "ChatGPT is a general chat model. SnipText is a writing workspace with originality checks, citations, editor view, and exports.",

    /* Grammarly */
    "grammarly pricing": "Free basic checks plus Premium/Business tiers. For pricing, use the <a href='https://checkai.pro/contact' target='_blank' rel='noopener' class='chat-link'>Contact page</a> or email <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a>.",
    "grammarly how it works": "Real-time grammar, clarity, and tone suggestions via browser extensions and web apps.",
    "grammarly vs sniptext": "Grammarly focuses on grammar/style. SnipText adds paraphrasing, originality insights, citations, and export workflows.",

    /* Stealth writer */
    "stealth writer what is": "Tools that claim to ‘humanize’ or hide AI-generated text from detectors.",
    "stealth writer price": "Flexible plans available; request a quote via the <a href='https://checkai.pro/contact' target='_blank' rel='noopener' class='chat-link'>Contact page</a> or email <a href='mailto:support@checkai.pro' class='chat-link'>support@checkai.pro</a>.",
    "stealth writer risk": "We don’t support bypassing detectors. Such tools are unreliable, can degrade quality, and may violate policies.",
    "stealth writer alternative": {
      type: 'card',
      title: 'Better alternative',
      checklist: [
        'Draft honestly and cite sources',
        'Use paraphraser + grammar to refine',
        'Run originality checks before submission'
      ],
      ctas: [{ label: 'Explore Tools', href: '/tools' }]
    },

    /* Timings & misc */
    "how long plagiarism check": "Usually seconds to a couple of minutes; large files or peak times may take longer.",
    "how long paraphrase": "Instant - adjust tone/mode and see results immediately.",
    "how long grammar check": "Real-time in the editor.",
    "how long ai detection": "Seconds - depends on text length/quality.",
    "supported files": "DOCX, PDF, TXT, and Markdown. Export to DOCX/PDF or copy.",
    "integrations": "Connect Google Drive, Dropbox, Teams, Slack. Choose preferred AI models-no lock-in.",
    "academic formats": "APA, MLA, Chicago, IEEE, and more via Citations Helper.",
    "limits": "Free has fair-use limits. Pro increases quotas and unlocks premium features.",
    "account required": "Many free tools work without signup. Sign in for the full workspace and history.",
    "account creation, sign up": "Reach us via the Contact page for instant registration by our team.",
    "password reset": "Handled by our admin team-contact support to retrieve or reset your password.",
    "contact": "Support: support@checkai.com · Sales: sales@checkai.com · Phone: +92 341 837 8430",
    "support time": "We typically reply within 1 business day."
  };

  // ========================== TOPIC GROUPS + SYNONYMS ==========================
  const TOPIC_GROUPS = {
    "pricing": ["turnitin pricing","quillbot pricing","grammarly pricing","ai detection pricing","chatgpt pricing","stealth writer price"],
    "turnitin": ["turnitin how it works","turnitin pricing","turnitin report time","turnitin vs sniptext"],
    "quillbot": ["quillbot how it works","quillbot pricing","quillbot vs sniptext"],
    "ai detection": ["ai detection tools","ai detection accuracy","ai detection pricing","ai detection vs sniptext"],
    "chatgpt": ["chatgpt how it works","chatgpt pricing","chatgpt vs sniptext"],
    "grammarly": ["grammarly how it works","grammarly pricing","grammarly vs sniptext"],
    "stealth writer": ["stealth writer what is","stealth writer price","stealth writer risk","stealth writer alternative"]
  };

  const TOPIC_SYNONYMS = {
    "pricing": ["pricing","pricing plan","pricing plans","plan pricing","price","prices","price list","tool pricing","tools pricing","cost","costs","fee","fees","rates","packages","subscription","subscriptions","subscription pricing","billing","invoice","invoices"]
  };

  // ========================== ALIASES ==========================
  const ALIASES = {
    "what is snip text": "what is sniptext",
    "what is sniptext?": "what is sniptext",
    "how does it work": "how it works",
    "get started": "how it works",
    "is there a free plan": "free plan",
    "pro": "pro vs free",
    "privacy policy": "privacy",
    "store my text": "privacy",
    "data storage": "privacy",
    "turnitin price": "turnitin pricing",
    "turnitin pricing plans": "turnitin pricing",
    "turnitin time": "turnitin report time",
    "turnitin duration": "turnitin report time",
    "turnitin report": "turnitin report time",
    "compare turnitin": "turnitin vs sniptext",
    "quillbot price": "quillbot pricing",
    "quillbot vs": "quillbot vs sniptext",
    "ai detector": "ai detection tools",
    "detect ai": "ai detection tools",
    "ai detection accuracy": "ai detection accuracy",
    "chat gpt": "chatgpt how it works",
    "chatgpt price": "chatgpt pricing",
    "chatgpt vs": "chatgpt vs sniptext",
    "grammarly price": "grammarly pricing",
    "grammarly vs": "grammarly vs sniptext",
    "humanizer": "stealth writer what is",
    "bypass detector": "stealth writer risk",
    "avoid detection": "stealth writer risk",
    "undetectable ai": "stealth writer risk",
    "humanize ai": "stealth writer risk",
    "safe alternative": "stealth writer alternative",
    "how long turnitin": "turnitin report time",
    "plagiarism time": "how long plagiarism check",
    "paraphrase time": "how long paraphrase",
    "grammar time": "how long grammar check",
    "ai detection time": "how long ai detection",
    "files": "supported files",
    "formats": "supported files",
    "integrations list": "integrations",
    "citation styles": "academic formats",
    "signup": "account required",
    "sign up": "account required",
    "reset password": "password reset",
    "forgot password": "password reset",
    "support": "support time",
    "email": "contact",
    "phone": "contact"
  };

  // ========================== ELEMENTS ==========================
  const launcher = document.getElementById('chat-launcher');
  const panel    = document.getElementById('chat-panel');
  const bodyEl   = document.getElementById('chat-body');
  const form     = document.getElementById('chat-form');
  const input    = document.getElementById('chat-text');
  const quick    = document.getElementById('chat-quick');
  const closeBtn = document.getElementById('chat-close');
  const minBtn   = document.getElementById('chat-minimize');
  if (!launcher || !panel || !bodyEl || !form || !input || !quick) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Bottom sentinel (auto-scroll pause/resume)
  const sentinel = document.createElement('div');
  sentinel.id = 'chat-bottom-sentinel';
  bodyEl.appendChild(sentinel);

  let autoScrollOK = true; // start at bottom
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      autoScrollOK = !!entries[0]?.isIntersecting;
    }, { root: bodyEl, threshold: 1.0 });
    io.observe(sentinel);
  } else {
    bodyEl.addEventListener('scroll', () => {
      const nearBottom = (bodyEl.scrollHeight - (bodyEl.scrollTop + bodyEl.clientHeight)) < 24;
      autoScrollOK = nearBottom;
    });
  }
  function scrollToBottom(){
    if (!autoScrollOK) return;
    sentinel.scrollIntoView({ block: 'end', behavior: reduce ? 'auto':'smooth' });
  }

  // ========================== ICONS / LAUNCHER ==========================
  const ICONS = {
    chat: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6A3.5 3.5 0 0 1 16.5 16H11l-3.8 3.1c-.9.7-2.2-.1-2.2-1.2V16A3.5 3.5 0 0 1 4 12.5v-6z"
              fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="9.8" r="1.25" fill="currentColor"/>
        <circle cx="12" cy="9.8" r="1.25" fill="currentColor"/>
        <circle cx="15" cy="9.8" r="1.25" fill="currentColor"/>
      </svg>
    `
  };
  function setLauncher(type = 'chat', label = 'Chat'){
    const icon = ICONS[type] || ICONS.chat;
    const labelSpan = launcher.querySelector('.chat-label');
    const badge = launcher.querySelector('.notify-badge') || document.createElement('span');
    badge.className = 'notify-badge'; badge.hidden = true;
    launcher.innerHTML = icon;
    if (labelSpan){ launcher.appendChild(labelSpan); labelSpan.textContent = label; }
    else { const span = document.createElement('span'); span.className = 'chat-label'; span.textContent = label; launcher.appendChild(span); }
    launcher.appendChild(badge);
    launcher.title = 'Chat';
    launcher.setAttribute('aria-label', 'Chat – open chat');
  }

  // ========================== HELPERS ==========================
  const escapeRx = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const norm = s => (s||"").toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
  const uid  = () => 'm' + Math.random().toString(36).slice(2,9);
  const getUserInitial = () => (window.SNIPCHAT?.user?.name || "You").trim().charAt(0).toUpperCase();

  function renderCard(obj){
    const parts = [];
    if (obj.title) parts.push(`<h4>${obj.title}</h4>`);
    if (obj.bullets?.length){ parts.push(`<ul>${obj.bullets.map(li=>`<li>${li}</li>`).join('')}</ul>`); }
    if (obj.checklist?.length){ parts.push(`<ul class="checklist">${obj.checklist.map(li=>`<li>${li}</li>`).join('')}</ul>`); }
    if (obj.html) parts.push(`<div>${obj.html}</div>`);
    if (obj.ctas?.length){
      const btns = obj.ctas.map(c=>`<a class="chat-cta" href="${c.href}" target="_blank" rel="noopener">${c.label}</a>`).join('');
      parts.push(`<div class="chat-ctas">${btns}</div>`);
    }
    return `<div class="chat-card">${parts.join('')}</div>`;
  }

  function renderAnswer(value){
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value && value.type === 'card') return renderCard(value);
    return `<div class="chat-card"><div>${String(value)}</div></div>`;
  }

  function renderQuestionList(topicKey){
    const keys = (TOPIC_GROUPS[topicKey] || []).filter(k => QA[k]);
    if (!keys.length) return null;
    const chips = keys.map(k=>{
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      return `<button type="button" class="qa-chip" data-qkey="${k.replace(/"/g,'&quot;')}"
        style="display:inline-block;margin:.25rem .35rem .35rem 0;padding:.42rem .7rem;
               font:600 .86rem/1.1 var(--font-body,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif);
               color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);
               border-radius:999px;cursor:pointer;backdrop-filter:blur(6px);">
        ${label}
      </button>`;
    }).join('');
    return `
      <div role="group" aria-label="${topicKey} related questions" style="color:rgba(255,255,255,.96);">
        <div style="font-weight:700;margin:0 0 .5rem 0;color:#fff;">
          Related questions for “${topicKey.charAt(0).toUpperCase()+topicKey.slice(1)}”
        </div>
        <div>${chips}</div>
        <div style="margin-top:.65rem;font-size:.85rem;opacity:.85;">
          Tap a question above to see its answer.
        </div>
      </div>`;
  }

  // ========================== FEEDBACK + ESCALATION ==========================
  let needHumanCount = 0;
  let escalationShown = false;

  function maybeEscalate(lastUserText){
    if (escalationShown) return;
    const q = norm(lastUserText);
    const hit = /\b(billing|invoice|invoices|support|contact|human|agent|help|representative)\b/.test(q);
    if (hit) needHumanCount++;
    if (needHumanCount >= 2){
      escalationShown = true;
      const subject = encodeURIComponent("SnipText — Talk to a human (from chatbot)");
      const body    = encodeURIComponent(`Hi SnipText team,\n\nI’d like to talk to a human about: "${lastUserText}".\n\nThanks!`);
      const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      const card = {
        type: 'card',
        title: 'Talk to a human',
        bullets: [
          'Prefer a person? No problem — reach out directly.',
          'We can help with billing, setup, and account questions.'
        ],
        ctas: [
          { label: 'Email support', href: mailHref },
          { label: 'Book a call', href: CALENDLY_URL }
        ]
      };
      botSay(renderCard(card), { kind:"card", meta:"escalation" });
    }
  }

  function attachFeedbackUI(rowEl, contextMeta){
    const id = rowEl.dataset.msgId || uid();
    rowEl.dataset.msgId = id;

    const bar = document.createElement('div');
    bar.className = 'microfb';
    bar.innerHTML = `
      <div style="margin-top:.45rem; display:flex; gap:.5rem; align-items:center; font-size:.88rem; opacity:.95;">
        <span>Did this help?</span>
        <button type="button" data-fb="yes" data-for="${id}" style="border:0;border-radius:10px;padding:.25rem .5rem;cursor:pointer;background:rgba(34,197,94,.18);color:#fff;"> Yes</button>
        <button type="button" data-fb="no"  data-for="${id}" style="border:0;border-radius:10px;padding:.25rem .5rem;cursor:pointer;background:rgba(239,68,68,.18);color:#fff;"> No</button>
      </div>
    `;
    bar.dataset.context = JSON.stringify(contextMeta || {});
    rowEl.querySelector('.bubble').appendChild(bar);
  }

  function showFeedbackFollowup(container, msgId){
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div style="margin-top:.45rem;">
        <label style="display:block; font-size:.88rem; margin-bottom:.25rem; opacity:.9;">What were you looking for?</label>
        <div style="display:grid; grid-template-columns: 1fr auto; gap:.4rem;">
          <input type="text" data-fb-input="${msgId}" placeholder="Type here…"
                 style="width:100%; border-radius:10px; border:1px solid rgba(255,255,255,.14);
                        background: rgba(255,255,255,.06); color:#fff; padding:.5rem .6rem; outline:none;">
          <button type="button" data-fb-send="${msgId}"
                  style="border:0;border-radius:10px;padding:.5rem .7rem;cursor:pointer;background:linear-gradient(135deg, var(--gradient-cta-start), var(--gradient-cta-end));color:#fff;">
            Send
          </button>
        </div>
      </div>
    `;
    container.appendChild(wrap);
  }

  // ========================== BOT/USER RENDERERS (with avatars + sentinel) ==========================
  function botSay(html, meta){
    const row = document.createElement('div');
    row.className = 'chat-msg bot';
    row.innerHTML = `
      <div class="avatar bot" aria-hidden="true"><span>ST</span></div>
      <div class="bubble">${html}</div>
    `;
    bodyEl.appendChild(row);
    attachFeedbackUI(row, meta || {});
    scrollToBottom();
  }

  function userSay(text){
    const row = document.createElement('div');
    row.className = 'chat-msg user';
    row.innerHTML = `
      <div class="bubble">${text}</div>
      <div class="avatar user" aria-hidden="true"><span>${getUserInitial()}</span></div>
    `;
    bodyEl.appendChild(row);
    scrollToBottom();
  }

  // ========================== CORE ANSWER RESOLUTION ==========================
  function resolveAnswer(raw){
    const qRaw = (raw || "");
    const q = norm(qRaw);
    if (!q) return { html:"", kind:"empty" };

    // Topic bundles
    for (const topic of Object.keys(TOPIC_GROUPS)){
      let trigger = new RegExp(`(^|\\b)${escapeRx(topic)}(\\b|$)`, 'i').test(q);
      if (!trigger && TOPIC_SYNONYMS[topic]){
        for (const syn of TOPIC_SYNONYMS[topic]){
          if (new RegExp(`(^|\\b)${escapeRx(syn)}(\\b|$)`, 'i').test(q)){ trigger = true; break; }
        }
      }
      if (trigger){
        const html = renderQuestionList(topic);
        if (html) return { html, kind:"bundle", resolvedKey: topic };
      }
    }

    // Direct, alias, fuzzy
    if (QA[q]) return { html: renderAnswer(QA[q]), kind:"answer", resolvedKey: q };
    if (ALIASES[q] && QA[ALIASES[q]]) return { html: renderAnswer(QA[ALIASES[q]]), kind:"answer", resolvedKey: ALIASES[q] };

    for (const key of Object.keys(QA)){
      const k = norm(key);
      if (q.includes(k) || k.includes(q)){
        return { html: renderAnswer(QA[key]), kind:"answer", resolvedKey: key };
      }
    }

    const tokens = new Set(q.split(' '));
    let bestKey=null, best=0;
    for (const key of Object.keys(QA)){
      const ks = new Set(norm(key).split(' '));
      let score=0; ks.forEach(t => tokens.has(t) && score++);
      if (score>best){ best=score; bestKey=key; }
    }
    if (best>=1 && bestKey) return { html: renderAnswer(QA[bestKey]), kind:"answer", resolvedKey: bestKey };

    const tips = Object.keys(QA).slice(0,5).map(k => `• ${k}`).join('<br>');
    return { html:`Sorry, I’m not sure yet.<br>${tips}`, kind:"fallback" };
  }

  // ========================== DEFAULT QUICK CHIPS ==========================
  const DEFAULT_CHIPS = [
    { label: 'How it works', query: 'how it works' },
    { label: 'Pro vs Free',  query: 'pro vs free' },
    { label: 'Privacy',      query: 'privacy' },
    { label: 'Turnitin',     query: 'turnitin' },
    { label: 'QuillBot',     query: 'quillbot' },
    { label: 'ChatGPT',      query: 'chatgpt' }
  ];

  function populateQuickChips(){
    quick.innerHTML = '';
    DEFAULT_CHIPS.forEach(({label, query}) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-chip';
      btn.textContent = label;
      btn.setAttribute('data-query', query);
      btn.addEventListener('click', () => queueAnswer(label, query, "quick-chip"));
      quick.appendChild(btn);
    });
  }

  // ========================== ASK SEARCH (live question picker) ==========================
  let askWrap, askInput, askClear, askResults;

  function buildAskUI(){
    if (askWrap) return;
    askWrap = document.createElement('div');
    askWrap.className = 'chat-ask';
    askWrap.innerHTML = `
      <input id="chat-ask-input" type="search" placeholder="Ask - search questions (e.g., pricing, Turnitin)…" aria-label="Search questions">
      <button id="chat-ask-clear" type="button" aria-label="Clear search">Clear</button>
    `;
    panel.insertBefore(askWrap, quick);

    askInput  = askWrap.querySelector('#chat-ask-input');
    askClear  = askWrap.querySelector('#chat-ask-clear');

    askResults = document.createElement('div');
    askResults.className = 'chat-ask-results';
    askResults.style.display = 'none';
    panel.insertBefore(askResults, quick);

    const allKeys = Object.keys(QA);

    function renderMatches(q){
      const query = norm(q);
      if (!query){
        askResults.style.display = 'none';
        askResults.innerHTML = '';
        return;
      }
      const matches = allKeys.filter(k => norm(k).includes(query)).slice(0, 14);
      if (!matches.length){
        askResults.style.display = 'block';
        askResults.innerHTML = `<div style="opacity:.85;">No questions found. Try another term.</div>`;
        return;
      }
      const chips = matches.map(k=>{
        const label = k.charAt(0).toUpperCase() + k.slice(1);
        return `<button type="button" class="qa-chip" data-qkey="${k.replace(/"/g,'&quot;')}"
          style="display:inline-block;margin:.25rem .35rem .35rem 0;padding:.42rem .7rem;
                 font:600 .86rem/1.1 var(--font-body,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif);
                 color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);
                 border-radius:999px;cursor:pointer;backdrop-filter:blur(6px);">
          ${label}
        </button>`;
      }).join('');
      askResults.style.display = 'block';
      askResults.innerHTML = `
        <div style="font-weight:700;margin:0 0 .45rem 0;color:#fff;">Matching questions</div>
        <div>${chips}</div>
        <div style="margin-top:.5rem;font-size:.85rem;opacity:.85;">Tap a question to see its answer.</div>
      `;
    }

    let t;
    askInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(()=> renderMatches(askInput.value), 120);
    });
    askClear.addEventListener('click', () => {
      askInput.value = '';
      askResults.style.display = 'none';
      askResults.innerHTML = '';
      askInput.focus();
    });
  }

  // ========================== DEBOUNCED ANSWERING + DUP CHECK ==========================
  let answerTimer = null;
  let lastNormalizedQuery = ""; // ignore exact duplicate in a row

  function queueAnswer(userVisibleText, rawQuery, source){
    const normalized = norm(rawQuery || userVisibleText);
    if (!normalized) return;
    if (normalized === lastNormalizedQuery) {
      // ignore exact duplicate
      return;
    }
    lastNormalizedQuery = normalized;

    clearTimeout(answerTimer);
    answerTimer = setTimeout(() => {
      userSay(userVisibleText);
      const res = resolveAnswer(rawQuery || userVisibleText);
      botSay(res.html, { resolvedKey: res.resolvedKey, kind: res.kind, source: source || "free-text" });
      maybeEscalate(userVisibleText);
    }, 120); // 120ms debounce
  }

  // ========================== OPEN/CLOSE & WIRING ==========================
  function openPanel(){
    panel.hidden = false;
    panel.classList.add('is-open');
    launcher.classList.add('open');
    launcher.setAttribute('aria-expanded', 'true');
    if (!panel.dataset.greeted){
      botSay("Hi! Use the Ask bar to search questions, or pick a quick topic below. You can also type tool names like Turnitin, QuillBot, or say “pricing”.");
      populateQuickChips();
      panel.dataset.greeted = '1';
      launcher.querySelector('.notify-badge')?.removeAttribute('hidden');
      scrollToBottom();
    }
    buildAskUI();
    bodyEl.focus({ preventScroll: true });
    setTimeout(()=>input.focus(), 30);
    launcher.querySelector('.notify-badge')?.setAttribute('hidden','');
  }
  function closePanel(){
    panel.classList.remove('is-open');
    launcher.classList.remove('open');
    launcher.setAttribute('aria-expanded', 'false');
    setTimeout(()=>{ panel.hidden = true; }, 120);
    launcher.focus();
  }

  launcher.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  closeBtn?.addEventListener('click', closePanel);
  minBtn?.addEventListener('click', closePanel);

  // Outside click
  document.addEventListener('click', (e) => {
    if (panel.hidden) return;

    // Ask-results chip (outside bodyEl)
    const withinAsk = e.target.closest('.chat-ask-results');
    if (withinAsk){
      const btn = e.target.closest('button.qa-chip');
      if (!btn) return;
      const qKey = btn.getAttribute('data-qkey');
      const pretty = qKey.charAt(0).toUpperCase() + qKey.slice(1);
      queueAnswer(pretty, qKey, "ask-results");
      return;
    }

    const within = panel.contains(e.target) || launcher.contains(e.target);
    if (!within) closePanel();
  });

  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  // Submit (debounced + no-dup)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim(); if (!val) return;
    queueAnswer(val, val, "free-text");
    input.value = '';
    input.focus();
  });

  // Click-to-Answer inside chat body (topic question chips + micro-feedback)
  bodyEl.addEventListener('click', (e) => {
    // Topic-produced chips
    const chip = e.target.closest('button.qa-chip');
    if (chip){
      const qKey = chip.getAttribute('data-qkey');
      if (!qKey) return;
      const pretty = qKey.charAt(0).toUpperCase() + qKey.slice(1);
      queueAnswer(pretty, qKey, "question-chip");
      return;
    }

    // Micro-feedback buttons
    const fbBtn = e.target.closest('button[data-fb]');
    if (fbBtn){
      const type = fbBtn.getAttribute('data-fb'); // yes/no
      const id   = fbBtn.getAttribute('data-for');
      const msg  = e.target.closest('.chat-msg.bot');
      if (!msg) return;
      const ctxEl = msg.querySelector('.microfb');
      let context = {};
      try { context = JSON.parse(ctxEl?.dataset?.context || "{}"); } catch(_){}
      ctxEl.querySelectorAll('button[data-fb]').forEach(b => b.disabled = true);

      if (type === 'yes'){
        window.SNIPCHAT.log('feedback', { helpful: true, msgId: id, context });
        const ok = document.createElement('span');
        ok.textContent = " Thanks!";
        ok.style.opacity = ".9";
        ctxEl.querySelector('div').appendChild(ok);
      } else {
        window.SNIPCHAT.log('feedback', { helpful: false, msgId: id, context });
        showFeedbackFollowup(ctxEl, id);
      }
      return;
    }

    // Micro-feedback detail
    const sendBtn = e.target.closest('button[data-fb-send]');
    if (sendBtn){
      const id = sendBtn.getAttribute('data-fb-send');
      const wrap = e.target.closest('.microfb');
      const inputEl = wrap.querySelector(`input[data-fb-input="${id}"]`);
      const text = (inputEl?.value || "").trim();
      if (!text) return;
      let context = {};
      try { context = JSON.parse(wrap?.dataset?.context || "{}"); } catch(_){}
      window.SNIPCHAT.log('feedback_detail', { msgId:id, wanted:text, context });
      const ack = document.createElement('div');
      ack.style.marginTop = ".35rem";
      ack.style.opacity = ".92";
      ack.textContent = "Got it — thanks! We’ll use this to improve.";
      wrap.appendChild(ack);
      sendBtn.disabled = true;
      inputEl.disabled = true;
      return;
    }
  });

  // Responsive height
  const applyViewportSizing = () => {
    const vh = (window.visualViewport?.height || window.innerHeight);
    const maxH = Math.max(260, Math.floor(vh * 0.7));
    panel.style.maxHeight = maxH + 'px';
  };
  applyViewportSizing();
  window.addEventListener('resize', applyViewportSizing);
  window.visualViewport?.addEventListener('resize', applyViewportSizing);

  // Init icon + label
  setLauncher('chat', 'Chat');

  // Initial quick chips when panel first opens
  function initOnce(){
    if (!panel.dataset.greeted){
      populateQuickChips();
    }
  }
  initOnce();
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
