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

  // Hamburger Toggle
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });

  // Logout (desktop)
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });
  // Logout (mobile)
  logoutBtnMobile.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

  // Undo / Redo
  undoBtn.addEventListener("click", () => {
    document.execCommand("undo");
  });
  redoBtn.addEventListener("click", () => {
    document.execCommand("redo");
  });

  // Word Count updater
  inputText.addEventListener("input", () => {
    const words = inputText.value.trim().split(/\s+/).filter((w) => w).length;
    wordCountElem.textContent = `${words} word${words !== 1 ? "s" : ""}`;
  });

  // Toggle Writing Goals Overlay
  goalsBtn.addEventListener("click", () => {
    goalsOverlay.style.display = "flex";
  });
  closeGoals.addEventListener("click", () => {
    goalsOverlay.style.display = "none";
  });
  // If user clicks outside the panel, close it
  goalsOverlay.addEventListener("click", (e) => {
    if (e.target === goalsOverlay) {
      goalsOverlay.style.display = "none";
    }
  });
  // Save goals (just closes overlay; values used on next check)
  saveGoals.addEventListener("click", () => {
    goalsOverlay.style.display = "none";
  });

  // Check Grammar → Single “Corrected Text” Output
  checkBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) {
      alert("Please enter some text to check.");
      return;
    }

    // Clear previous output & show loading
    outputText.value = "";
    checkBtn.classList.add("loading");

    // Gather goal values
    const goalsPayload = {
      audience: audienceSelect.value,
      formality: formalitySelect.value,
      intent: intentSelect.value,
      tone: toneSelect.value,
      domain: domainSelect.value,
    };

    try {
      const response = await fetch("/api/grammar-check", {
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
      // Assume data.corrected_text contains the returned full corrected text
      const corrected = data.corrected_text || "";
      outputText.value = corrected;
    } catch (err) {
      outputText.value = `Error: ${err.message}`;
    } finally {
      checkBtn.classList.remove("loading");
    }
  });

  // Escape HTML helper (not needed for plain textarea output, but kept if you switch to innerHTML)
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
