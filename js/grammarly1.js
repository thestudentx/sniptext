// File: grammarly1.js
document.addEventListener("DOMContentLoaded", () => {
  const checkBtn = document.getElementById("checkBtn");
  const inputText = document.getElementById("inputText");
  const outputText = document.getElementById("outputText");
  const wordCountElem = document.getElementById("wordCount");
  const btnSpinner = document.getElementById("btnSpinner");

  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutBtnMobile = document.getElementById("logoutBtnMobile");

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");

  const goalsBtn = document.getElementById("goalsBtn");
  const goalsOverlay = document.getElementById("goalsOverlay");
  const closeGoals = document.getElementById("closeGoals");
  const saveGoals = document.getElementById("saveGoals");

  const audienceSelect = document.getElementById("audienceSelect");
  const formalitySelect = document.getElementById("formalitySelect");
  const intentSelect = document.getElementById("intentSelect");
  const toneSelect = document.getElementById("toneSelect");
  const domainSelect = document.getElementById("domainSelect");

  // ✅ Backend URL based on environment
  const BACKEND_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "https://sniptext.onrender.com";

  // Hamburger Toggle
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

  logoutBtnMobile.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

  undoBtn.addEventListener("click", () => {
    document.execCommand("undo");
  });

  redoBtn.addEventListener("click", () => {
    document.execCommand("redo");
  });

  inputText.addEventListener("input", () => {
    const words = inputText.value.trim().split(/\s+/).filter((w) => w).length;
    wordCountElem.textContent = `${words} word${words !== 1 ? "s" : ""}`;
  });

  goalsBtn.addEventListener("click", () => {
    goalsOverlay.style.display = "flex";
  });

  closeGoals.addEventListener("click", () => {
    goalsOverlay.style.display = "none";
  });

  goalsOverlay.addEventListener("click", (e) => {
    if (e.target === goalsOverlay) {
      goalsOverlay.style.display = "none";
    }
  });

  saveGoals.addEventListener("click", () => {
    goalsOverlay.style.display = "none";
  });

  checkBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) {
      alert("Please enter some text to check.");
      return;
    }

    outputText.value = "";
    checkBtn.classList.add("loading");

    const goalsPayload = {
      audience: audienceSelect.value,
      formality: formalitySelect.value,
      intent: intentSelect.value,
      tone: toneSelect.value,
      domain: domainSelect.value,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/grammar-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          text,
          goals: goalsPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error. Try again later.");
      }

      const data = await response.json();
      const corrected = data.corrected_text || "";
      outputText.value = corrected;
    } catch (err) {
      outputText.value = `Error: ${err.message}`;
    } finally {
      checkBtn.classList.remove("loading");
    }
  });

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
