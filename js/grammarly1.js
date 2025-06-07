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

  // 🌐 Backend URL
  const BACKEND_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "https://sniptext.onrender.com";

  // 🌟 DOM Elements
  const checkBtn = document.getElementById("checkBtn");
  const inputText = document.getElementById("inputText");
  const outputText = document.getElementById("outputText");
  const wordCountElem = document.getElementById("wordCount");
  const btnSpinner = document.getElementById("btnSpinner");

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

  const uploadBtn = document.getElementById("uploadBtn");
  const fileInfo = document.getElementById("fileInfo");

  const toastContainer = document.getElementById("qb-toast-container");

  // ✅ Toast Notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('qb-toast', `qb-toast--${type}`);
    toast.textContent = message;
    toastContainer.appendChild(toast);
    toastContainer.classList.remove('hidden');
    setTimeout(() => {
      toast.remove();
      if (toastContainer.childElementCount === 0) {
        toastContainer.classList.add('hidden');
      }
    }, 4000);
  }

  // ↩️ Undo/Redo
  undoBtn.addEventListener("click", () => document.execCommand("undo"));
  redoBtn.addEventListener("click", () => document.execCommand("redo"));

  // 📋 Paste from clipboard
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showToast("Clipboard is empty!", "error");
        return;
      }
      inputText.value = text;
      inputText.dispatchEvent(new Event("input"));
      showToast("Text pasted from clipboard!", "success");
    } catch (err) {
      showToast("Failed to read clipboard", "error");
    }
  });

  // 📂 Upload File (.txt / .docx)
  uploadBtn.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    try {
      let text = "";
      const allowedTypes = [".txt", ".docx"];
      const ext = name.slice(name.lastIndexOf("."));

      if (!allowedTypes.includes(ext)) {
        fileInfo.textContent = "❌ Unsupported file type.";
        fileInfo.classList.remove("hidden");
        showToast("Only .txt and .docx files allowed", "error");
        return;
      }

      fileInfo.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      fileInfo.classList.remove("hidden");

      if (ext === ".txt") {
        text = await file.text();
      } else if (ext === ".docx") {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        text = value;
      }

      inputText.value = text;
      inputText.dispatchEvent(new Event("input"));
      showToast("File uploaded successfully!", "success");
    } catch (err) {
      fileInfo.textContent = "⚠️ Failed to read file.";
      fileInfo.classList.remove("hidden");
      showToast("Error reading file", "error");
    } finally {
      uploadBtn.value = ""; // allow re-upload of same file
    }
  });

  // 📤 Copy output
  copyBtn.addEventListener("click", async () => {
    try {
      const output = outputText.value.trim();
      if (!output) {
        showToast("Nothing to copy!", "error");
        return;
      }
      await navigator.clipboard.writeText(output);
      showToast("Copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy", "error");
    }
  });

  // 🧮 Word Count
  inputText.addEventListener("input", () => {
    const words = inputText.value.trim().split(/\s+/).filter((w) => w).length;
    wordCountElem.textContent = `${words} word${words !== 1 ? "s" : ""}`;
  });

  // 🚫 Word Limit Enforcement (Max 5000 words)
inputText.addEventListener("input", () => {
  const wordsArray = inputText.value.trim().split(/\s+/).filter((w) => w);
  if (wordsArray.length > 5000) {
    const trimmedText = wordsArray.slice(0, 5000).join(" ");
    inputText.value = trimmedText;
    showToast("🚫 Max 5000 words allowed! Paste trimmed.", "error");
    inputText.dispatchEvent(new Event("input")); // update word count
  }
});

  // 🎯 Writing Goals Modal
  goalsBtn.addEventListener("click", () => (goalsOverlay.style.display = "flex"));
  closeGoals.addEventListener("click", () => (goalsOverlay.style.display = "none"));
  goalsOverlay.addEventListener("click", (e) => {
    if (e.target === goalsOverlay) goalsOverlay.style.display = "none";
  });
  saveGoals.addEventListener("click", () => (goalsOverlay.style.display = "none"));

  // ✅ Grammar Check API
  checkBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) {
      showToast("Please enter some text to check!", "error");
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
      showToast("Grammar check completed!", "success");
    } catch (err) {
      outputText.value = `Error: ${err.message}`;
      showToast("Grammar check failed. Please try again.", "error");
    } finally {
      checkBtn.classList.remove("loading");
    }
  });

  // 🧼 Optional HTML escape
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
