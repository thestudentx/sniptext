// ==== CONFIG =====
const loaderMessages = [
  "Initializing secure session…",
  "Waking up our servers…",
  "Establishing encrypted connection…",
  "Verifying credentials…",
  "Loading your dashboard…",
  "Syncing real-time data…",
  "Almost there… finishing up!"
];
const MESSAGE_DURATION = 5000; // ms between messages
const FADE_DURATION   = 500;  // ms for fade-out/in

// ==== STATE =====
let messageIndex   = 0;
let rotateInterval = null;
let textEl         = null;

// ==== HELPERS =====
function ensureLoaderText() {
  if (!textEl) {
    const container = document.getElementById("global-loader");
    textEl = document.createElement("div");
    textEl.id = "loader-text";
    // you can tweak these inline styles or pull them into CSS
    Object.assign(textEl.style, {
      marginTop: "1rem",
      fontFamily: `"Poppins", sans-serif`,
      fontSize: "0.9rem",
      color: "#ffffffaa",
      textAlign: "center",
      maxWidth: "240px",
      lineHeight: "1.4",
      opacity: "0"
    });
    container.appendChild(textEl);
  }
}

function fade(element, from, to, duration) {
  element.style.transition = `opacity ${duration}ms ease`;
  element.style.opacity = from;
  // force a repaint so transition actually kicks in
  element.getBoundingClientRect();
  element.style.opacity = to;
}

// ==== ROTATION =====
function startLoaderMessages() {
  ensureLoaderText();
  // show first message
  textEl.textContent = loaderMessages[messageIndex];
  fade(textEl, 0, 1, FADE_DURATION);

  rotateInterval = setInterval(() => {
    // fade out
    fade(textEl, 1, 0, FADE_DURATION);
    setTimeout(() => {
      // next message & fade back in
      messageIndex = (messageIndex + 1) % loaderMessages.length;
      textEl.textContent = loaderMessages[messageIndex];
      fade(textEl, 0, 1, FADE_DURATION);
    }, FADE_DURATION);
  }, MESSAGE_DURATION);
}

function stopLoaderMessages() {
  clearInterval(rotateInterval);
  messageIndex = 0;
  if (textEl) {
    // optional: remove from DOM or hide
    fade(textEl, 1, 0, FADE_DURATION);
    setTimeout(() => textEl.remove(), FADE_DURATION);
    textEl = null;
  }
}

// ==== PUBLIC API =====
function showLoader() {
  const loader = document.getElementById("global-loader");
  loader.style.display = "flex";
  document.body.classList.add("no-interaction");
  startLoaderMessages();
}

function hideLoader() {
  const loader = document.getElementById("global-loader");
  loader.style.display = "none";
  document.body.classList.remove("no-interaction");
  stopLoaderMessages();
}

// ==== LOGIN MESSAGE ==== (unchanged)
function showLoginMessage(message, isSuccess = true, duration = 3000) {
  const box = document.getElementById('login-message-box');
  box.textContent = message;
  box.style.backgroundColor = isSuccess ? 'var(--color-primary)' : 'var(--color-used-often)';
textEl.classList.add("visible");
textEl.classList.remove("hidden");

  setTimeout(() => {
textEl.classList.add("hidden");
textEl.classList.remove("visible");
  }, duration);
}
