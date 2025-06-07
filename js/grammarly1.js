// File: grammarly1.js
document.addEventListener('DOMContentLoaded', () => {
  // 🔒 AUTH CHECK: Protect page from unauthorized or expired users
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const expiryDate = new Date(decodedPayload.accessDuration);
    const now = new Date();

    if (now > expiryDate) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }

    console.log('✅ Access granted to:', decodedPayload.email);
  } catch (err) {
    console.error('Invalid token', err);
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    return;
  }


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

  const pasteBtn = document.getElementById("pasteBtn");
  const copyBtn = document.getElementById("copyBtn");

  // ←— NEW: grab the hidden file-input
  const uploadBtn = document.getElementById("uploadBtn");

  // ✅ Backend URL based on environment
  const BACKEND_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "https://sniptext.onrender.com";

  // 🍔 Hamburger Toggle
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });

  // 🔒 Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });
  logoutBtnMobile.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

  // ↩️ Undo/Redo (browser-native)
  undoBtn.addEventListener("click", () => document.execCommand("undo"));
  redoBtn.addEventListener("click", () => document.execCommand("redo"));

  // 📋 Paste into input
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputText.value = text;
      inputText.dispatchEvent(new Event("input")); // Update word count
    } catch (err) {
      alert("Failed to read clipboard: " + err.message);
    }
  });

  // 📂 File Upload
  uploadBtn.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    try {
      let text = "";

      if (name.endsWith(".txt")) {
        text = await file.text();
      } else if (name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
        text = rawText;
      } else {
        alert("Unsupported format. Please use .txt or .docx");
        return;
      }

      inputText.value = text;
      inputText.dispatchEvent(new Event("input"));
    } catch (err) {
      alert("Error reading file: " + err.message);
    } finally {
      uploadBtn.value = ""; // allow uploading same file again
    }
  });

  // 📄 Copy from output
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(outputText.value);
    } catch (err) {
      alert("Failed to copy text: " + err.message);
    }
  });

  // 🧮 Word Count
  inputText.addEventListener("input", () => {
    const words = inputText.value.trim().split(/\s+/).filter((w) => w).length;
    wordCountElem.textContent = `${words} word${words !== 1 ? "s" : ""}`;
  });

  // 🎯 Writing Goals Modal
  goalsBtn.addEventListener("click", () => (goalsOverlay.style.display = "flex"));
  closeGoals.addEventListener("click", () => (goalsOverlay.style.display = "none"));
  goalsOverlay.addEventListener("click", (e) => {
    if (e.target === goalsOverlay) goalsOverlay.style.display = "none";
  });
  saveGoals.addEventListener("click", () => (goalsOverlay.style.display = "none"));

  // ✅ Grammar Check
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
        body: JSON.stringify({ text, goals: goalsPayload }),
      });

      if (!response.ok) throw new Error("Server error. Try again later.");

      const data = await response.json();
      outputText.value = data.corrected_text || "";
    } catch (err) {
      outputText.value = `Error: ${err.message}`;
    } finally {
      checkBtn.classList.remove("loading");
    }
  });

  // Optional: HTML escape (not used but kept for safety)
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
