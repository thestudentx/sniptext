document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const emailElement = document.getElementById("user-email");
  const accessDurationElement = document.getElementById("access-duration");
  const timeRemainingElement = document.getElementById("time-remaining");
  const modelLinksContainer = document.getElementById("modelLinks");

  // Protect dashboard access
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  let decodedPayload;
  try {
    const payloadBase64 = token.split(".")[1];
    decodedPayload = JSON.parse(atob(payloadBase64));
  } catch (err) {
    console.error("Token decode error:", err);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return;
  }

  console.log("Decoded Payload:", decodedPayload); // ✅ Add this

  const { email, plan, accessDuration, models } = decodedPayload;
  const expiryDate = new Date(accessDuration);
  const now = new Date();

  if (now > expiryDate) {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return;
  }

  // ✅ Authorized: Proceed to render dashboard content

  emailElement.textContent = email;
  accessDurationElement.textContent = expiryDate.toDateString();

  // Display user plan 
  const planElement = document.getElementById("active-plan");
  planElement.textContent = plan || "Not Assigned";
  


  // Countdown timer
  function updateTimer() {
    const now = new Date();
    const diff = expiryDate - now;

    if (diff <= 0) {
      timeRemainingElement.textContent = "Access expired";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timeRemainingElement.textContent =
      `Time left: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);

  const allModelCards = {
    stealthwriter1: {
    id: "model-stealthwriter-1",
    href: "https://app.stealthwriter.ai/auth/sign-in", 
    img: "images/stealthwriter_logo.png", 
    title: "Stealth Writer 1",
    description: "Copy the info below and click the button to open Stealth Writer now.",
    model: "StealthWriter",
  },
    chatgpt1: {
      id: "model-chatgpt-1",
      href: "https://auth.openai.com/log-in", 
      img: "images/chatgpt_icon.png",
      title: "ChatGPT 1",       
      description: "Copy the info below and click the button to open ChatGPT now.",
      model: "ChatGPT",
    },
    turnitin1: {
      id: "model-turnitin-1",
      href: "https://turndetect.com/login",
      img: "images/turnitin-logo.png",
      title: "Turnitin 1",
      description: "Copy the info below and click the button to open Turnitin now.",
      model: "Turnitindetect",
    },
    turnitin2: {
      id: "model-turnitin-2",
      href: "ai-detection.html",
      img: "images/ai-detection.png",
      title: "AI Detection",
      description: "AI Detection Made Easy",
      model: "Turnitin",
    },
    turnitin3: {
      id: "model-turnitin-3",
      href: "turnitin3.html",
      img: "images/turnitin-logo.png",
      title: "Turnitin 3",
      description: "Plagiarism Checker Tool",
      model: "Turnitin",
    },
    turnitin4: {
      id: "model-turnitin-4",
      href: "https://turnitindetect.org/login",
      img: "images/turnitin-logo.png",
      title: "Turnitin 4",
      description: "Plagiarism Check & AI Detection",
      model: "Turnitin",
    },
    quillbot1: {
      id: "model-quillbot-1",
      href: "/quillbot1.html",
      img: "images/quilbot-logo.png",
      title: "Quillbot 1",
      description: "Paraphrasing & Styling Tool",
      model: "Quillbot",
    },
    quillbot2: {
      id: "model-quillbot-2",
      href: "/quillbot2.html",
      img: "images/quilbot-logo.png",
      title: "Quillbot 2",
      description: "Paraphrasing & Styling Tool",
      model: "Quillbot",
    },
    quillbot3: {
      id: "model-quillbot-3",
      href: "/model/quillbot3",
      img: "images/quilbot-logo.png",
      title: "Quillbot 3",
      description: "Paraphrasing & Styling Tool",
      model: "Quillbot",
    },
    grammarly1: {
      id: "model-grammarly-1",
      href: "/grammarly1.html",
      img: "images/grammarly-logo.png",
      title: "Grammarly 1",
      description: "Grammar Checker & Styling",
      model: "Grammarly",
    },
    grammarly2: {
      id: "model-grammarly-2",
      href: "/model/grammarly2",
      img: "images/grammarly-logo.png",
      title: "Grammarly 2",
      description: "Grammar Checker & Styling",
      model: "Grammarly",
    },
    grammarly3: {
      id: "model-grammarly-3",
      href: "/model/grammarly3",
      img: "images/grammarly-logo.png",
      title: "Grammarly 3",
      description: "Grammar Checker & Styling",
      model: "Grammarly",
    },
    dummy1: {
      id: "model-dummy-1",
      href: "/model/dummy1",
      img: "images/dummy-model-icon.png",
      title: "Dummy Model 1",
      description: "Coming Soon",
      model: "Dummy",
    },
    dummy2: {
      id: "model-dummy-2",
      href: "/model/dummy2",
      img: "images/dummy-model-icon.png",
      title: "Dummy Model 2",
      description: "Coming Soon",
      model: "Dummy",
    },
    dummy3: {
      id: "model-dummy-3",
      href: "/model/dummy3",
      img: "images/dummy-model-icon.png",
      title: "Dummy Model 3",
      description: "Coming Soon",
      model: "Dummy",
    },
  };


  // Filter models based on user access
  // Email, Password buttons in turnitin1 card 
models.forEach((modelKey) => {
  const model = allModelCards[modelKey];
  if (model) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.id = model.id;
    cardDiv.dataset.model = model.model;

    const img = document.createElement("img");
    img.src = model.img;
    img.alt = `${model.model} Icon`;
    img.className = "card-icon";

    const title = document.createElement("h2");
    const cleanTitle = model.title.replace(/\s\d+$/, "");
    title.textContent = cleanTitle;

    const desc = document.createElement("p");
    desc.textContent = model.description;

    cardDiv.appendChild(img);
    cardDiv.appendChild(title);
    cardDiv.appendChild(desc);

if (modelKey === "turnitin1" || modelKey === "chatgpt1" || modelKey === "stealthwriter1") {
  // Disable pointer/hover on the entire card
  cardDiv.style.cursor = "default";
  cardDiv.onmouseenter = null;
  cardDiv.onmouseleave = null;

  // Per-model credentials + link label
  const perModel = {
    turnitin1: {
      email: "thesniptext@gmail.com",
      password: "Plag@123",
      linkText: "Go to Turnitin",
    },
    chatgpt1: {
      email: "beingwaria@gmail.com", 
      password: "beingwaria786",   
      linkText: "Open ChatGPT",
    },
    stealthwriter1: {
    email: "thesniptext@email.com",
    password: "thesniptext37",
    linkText: "Open Stealth Writer",
  },
  };

  const { email: copyEmail, password: copyPassword, linkText } = perModel[modelKey];

  // --- Copy Email button ---
  const btnEmail = document.createElement("button");
  btnEmail.textContent = "Copy Email";
  btnEmail.className = "copy-btn";
  btnEmail.title = "Click to copy";
  btnEmail.dataset.value = copyEmail;

  btnEmail.addEventListener("click", () => {
    navigator.clipboard.writeText(btnEmail.dataset.value);
    btnEmail.textContent = "Copied Email! ✅";
    btnEmail.classList.add("clicked", "pulse");
    cardDiv.classList.add("blur");
    setTimeout(() => {
      btnEmail.classList.remove("clicked", "pulse");
      cardDiv.classList.remove("blur");
      btnEmail.textContent = "Copy Email";
    }, 1000);
  });

  // --- Copy Password button ---
  const btnPass = document.createElement("button");
  btnPass.textContent = "Copy Password";
  btnPass.className = "copy-btn";
  btnPass.title = "Click to copy";
  btnPass.dataset.value = copyPassword;

  btnPass.addEventListener("click", () => {
    navigator.clipboard.writeText(btnPass.dataset.value);
    btnPass.textContent = "Copied Password! ✅";
    btnPass.classList.add("clicked", "pulse");
    cardDiv.classList.add("blur");
    setTimeout(() => {
      btnPass.classList.remove("clicked", "pulse");
      cardDiv.classList.remove("blur");
      btnPass.textContent = "Copy Password";
    }, 1000);
  });

  cardDiv.appendChild(btnEmail);
  cardDiv.appendChild(btnPass);

  const singleLink = document.createElement("a");
  singleLink.href = model.href;
  singleLink.target = "_blank";
  singleLink.rel = "noopener noreferrer";
  singleLink.className = "model-link";
  singleLink.textContent = linkText;

  cardDiv.appendChild(singleLink);
  modelLinksContainer.appendChild(cardDiv);
} else {
      // --- Default card with full link (unchanged) ---
      const note = document.createElement("p");
      // note.textContent = "Use your Snip Text login to access this tool.";
      note.className = "card-note";

      const cardLink = document.createElement("a");
      cardLink.href = model.href;
      cardLink.target = "_blank";
      cardLink.rel = "noopener noreferrer";
      cardLink.className = "card-link";

      cardDiv.appendChild(note);
      cardLink.appendChild(cardDiv);
      modelLinksContainer.appendChild(cardLink);
    }
  }
});
/* =========================
   HOW-TO: Screenshots Map
   ========================= */
const HOWTO_SHOTS = {
  stealthwriter1: [
    { src: "/images/login_process/step_1.png", caption: "Go to Stealth Writer login page." },
    { src: "/images/login_process/step_2.png", caption: "Enter the provided email." },
    { src: "/images/login_process/step_3.png", caption: "Paste the password." },
    { src: "/images/login_process/step_4.png", caption: "Click Sign in." },
    { src: "/images/login_process/step_5.png", caption: "You’re in - dashboard overview." },
  ],
  chatgpt1: [
    { src: "/images/login_process/step_1.png", caption: "Open ChatGPT homepage." },
    { src: "/images/login_process/step_2.png", caption: "Click Log in." },
    { src: "/images/login_process/step_3.png", caption: "Use the provided email." },
    { src: "/images/login_process/step_4.png", caption: "Paste the password." },
    { src: "/images/login_process/step_5.png", caption: "Landing page confirmation." },
  ],
  turnitin1: [
    { src: "/images/login_process/step_1.png", caption: "Open Turnitin login portal." },
    { src: "/images/login_process/step_2.png", caption: "Enter the provided email." },
    { src: "/images/login_process/step_3.png", caption: "Paste the password." },
    { src: "/images/login_process/step_4.png", caption: "Click Log in." },
    { src: "/images/login_process/step_5.png", caption: "Turnitin dashboard - ready to use." },
  ],
  // Add more tools if needed…
};

/* =========================
   HOW-TO: Modal Controller
   ========================= */
(function initHowToModal() {
  const $modal = document.getElementById("howto-modal");
  const $img = document.getElementById("howto-image");
  const $caption = document.getElementById("howto-caption");
  const $subtitle = document.getElementById("howto-subtitle");
  const $counter = document.getElementById("howto-counter");
  const $prev = document.getElementById("howto-prev");
  const $next = document.getElementById("howto-next");

  let currentList = [];
  let currentIdx = 0;
  let currentToolKey = null;
  let lastFocusedEl = null;

  function setSlide(i) {
    if (!currentList.length) return;
    currentIdx = (i + currentList.length) % currentList.length;
    const item = currentList[currentIdx];
    $img.src = item.src;
    $img.alt = item.caption || "Login step";
    $caption.textContent = item.caption || "";
    $counter.textContent = `${currentIdx + 1} / ${currentList.length}`;
  }

  function openModal(toolKey) {
    currentToolKey = toolKey;
    const list = HOWTO_SHOTS[toolKey] || [];
    if (!list.length) return;

    // Optional: subtitle shows which tool
    const modelName = (allModelCards[toolKey]?.title || "").replace(/\s\d+$/, "");
    $subtitle.textContent = modelName ? `Steps for ${modelName}` : "";

    currentList = list.slice();
    currentIdx = 0;

    // Preload images
    currentList.forEach(s => { const im = new Image(); im.src = s.src; });

    lastFocusedEl = document.activeElement;
    $modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setSlide(0);
    // Move focus for accessibility
    $modal.querySelector(".howto-close").focus();
  }

  function closeModal() {
    $modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    currentList = [];
    currentIdx = 0;
    currentToolKey = null;
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  }

  // Wire controls
  $prev.addEventListener("click", () => setSlide(currentIdx - 1));
  $next.addEventListener("click", () => setSlide(currentIdx + 1));

  $modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    const open = $modal.getAttribute("aria-hidden") === "false";
    if (!open) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") setSlide(currentIdx + 1);
    if (e.key === "ArrowLeft") setSlide(currentIdx - 1);
  });

  // Expose to outer scope
  window.__openHowTo = openModal;
})();

/* =========================
   HOW-TO: Add button to cards
   ========================= */
(function addHowToButtons() {
  // After your cards are appended, iterate over them and inject the button
  // We’ll piggyback on the container you already use:
  const container = document.getElementById("modelLinks");
  if (!container) return;

  // Run once after your models.forEach has built the DOM.
  // If your code is all in one file, you can call this at the very end.
  const cards = container.querySelectorAll(".card");
  cards.forEach(card => {
    const modelKey = Object.keys(allModelCards).find(k => allModelCards[k].id === card.id);
    if (!modelKey) return;

    // Only add if we actually have screenshots for this tool
    if (!HOWTO_SHOTS[modelKey] || HOWTO_SHOTS[modelKey].length === 0) return;

    const howBtn = document.createElement("button");
    howBtn.className = "howto-btn";
    howBtn.type = "button";
    howBtn.textContent = "View Login Steps";
    howBtn.addEventListener("click", () => window.__openHowTo(modelKey));

    // Place it under your existing content and above links
    // If you want it above the Copy buttons for special cards:
    const lastButton = card.querySelector(".model-link") || card.lastElementChild;
    card.insertBefore(howBtn, lastButton);
  });
})();

});