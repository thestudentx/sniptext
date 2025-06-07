// quilbot2.js
// This script handles page access, user input, sending to backend, word counts, UI feedback, etc.

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

  // === Main Feature Logic ===
  const inputTextarea = document.getElementById('qb-input');
  const outputTextarea = document.getElementById('qb-output');
  const submitBtn = document.getElementById('qb-submit');
  const clearBtn = document.getElementById('qb-clear');
  const loader = document.getElementById('qb-loader');
  const errorMsg = document.getElementById('qb-error');
  const toastContainer = document.getElementById('qb-toast-container');
  const countDisplay = document.getElementById('qb-count');
  const pasteBtn = document.getElementById('qb-paste');
  const copyBtn = document.getElementById('qb-copy');
  const uploadInput = document.getElementById('qb-upload'); // ✅ File input element

  let selectedMode = 'standard';
  let selectedStyle = 'default';

  const modeTabs = document.querySelectorAll('.qb-tab-mode');
  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      modeTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      selectedMode = tab.getAttribute('data-mode');
    });
  });

  const styleTabs = document.querySelectorAll('.qb-tab-style');
  styleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      styleTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      selectedStyle = tab.getAttribute('data-style');
    });
  });

  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('qb-toast', `qb-toast--${type}`);
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
      if (toastContainer.childElementCount === 0) {
        toastContainer.classList.add('hidden');
      }
    }, 4000);
    toastContainer.classList.remove('hidden');
  }

  function updateCount() {
    const text = inputTextarea.value.trim();
    if (!text) {
      countDisplay.textContent = 'Words: 0 | Approx. Tokens: 0';
      return;
    }
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    const approxTokens = Math.ceil(words * 1.3);
    countDisplay.textContent = `Words: ${words} | Approx. Tokens: ${approxTokens}`;
  }

  // Existing input event listener to trim excess words after typing or other input
  inputTextarea.addEventListener('input', () => {
    const wordsArray = inputTextarea.value.trim().split(/\s+/).filter(w => w);
    if (wordsArray.length > 5000) {
      const trimmedText = wordsArray.slice(0, 5000).join(' ');
      inputTextarea.value = trimmedText;
      showToast("🚫 Max 5000 words allowed!", "error");
      updateCount(); // Keep token count correct
    } else {
      updateCount();
    }
  });

  // NEW: paste event listener that enforces word limit before pasting
  inputTextarea.addEventListener('paste', (e) => {
    e.preventDefault(); // Prevent default paste

    // Get pasted text from clipboard
    const paste = (e.clipboardData || window.clipboardData).getData('text');

    // Current words in textarea
    const currentWords = inputTextarea.value.trim().split(/\s+/).filter(w => w);

    // Words in pasted text
    const pasteWords = paste.trim().split(/\s+/).filter(w => w);

    // Total words if we add full paste
    const totalWords = currentWords.length + pasteWords.length;

    if (totalWords > 5000) {
      const allowedPasteCount = 5000 - currentWords.length;
      if (allowedPasteCount > 0) {
        // Add only allowed number of words from paste
        const allowedPaste = pasteWords.slice(0, allowedPasteCount).join(' ');
        inputTextarea.value = (inputTextarea.value + ' ' + allowedPaste).trim() + ' ';
        showToast(`🚫 Max 5000 words allowed! Paste trimmed.`, 'error');
      } else {
        showToast(`🚫 Max 5000 words reached! Paste blocked.`, 'error');
      }
    } else {
      // Safe to paste fully
      inputTextarea.value += paste;
    }

    updateCount();

    // Trigger input event manually to update UI or other listeners
    inputTextarea.dispatchEvent(new Event('input'));
  });

  clearBtn.addEventListener('click', () => {
    inputTextarea.value = '';
    outputTextarea.value = '';
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    updateCount();
    showToast('Cleared text fields.', 'info');
  });

  submitBtn.addEventListener('click', async () => {
    const userText = inputTextarea.value.trim();

    if (!userText) {
      errorMsg.textContent = 'Please enter some text to paraphrase.';
      errorMsg.classList.remove('hidden');
      showToast('You need to type something first.', 'error');
      return;
    }

    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    loader.classList.remove('hidden');
    submitBtn.disabled = true;
    clearBtn.disabled = true;

    try {
      const response = await fetch(`${BACKEND_URL}/api/cohere/paraphrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: userText,
          mode: selectedMode,
          style: selectedStyle,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Unknown error from server');
      }

      const data = await response.json();
      outputTextarea.value = data.paraphrased ?? '';
      showToast('Paraphrase complete!', 'success');
    } catch (err) {
      console.error('Paraphrase error:', err);
      errorMsg.textContent =
        'Sorry, something went wrong. Please try again later.';
      errorMsg.classList.remove('hidden');
      showToast('Failed to paraphrase. Check console for details.', 'error');
    } finally {
      loader.classList.add('hidden');
      submitBtn.disabled = false;
      clearBtn.disabled = false;
    }
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast('Clipboard is empty.', 'error');
        return;
      }
      inputTextarea.value = text;
      updateCount();
      showToast('Pasted text from clipboard!', 'success');
    } catch (err) {
      console.error('Paste failed:', err);
      showToast('Failed to read clipboard. Allow permission?', 'error');
    }
  });

  copyBtn.addEventListener('click', async () => {
    const outputText = outputTextarea.value.trim();
    if (!outputText) {
      showToast('Nothing to copy yet!', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      showToast('Copied paraphrased text!', 'success');
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Failed to copy text.', 'error');
    }
  });

  // 📁 File Upload Logic
  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    try {
      let text = "";

      const allowedTypes = ['.txt', '.docx'];
      const ext = name.slice(name.lastIndexOf('.'));

      if (!allowedTypes.includes(ext)) {
        showToast("Only .txt and .docx files are allowed. Try again.", "error");
        return;
      }

      if (ext === '.txt') {
        text = await file.text();
      } else if (ext === '.docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        text = value;
      }

      inputTextarea.value = text;
      inputTextarea.dispatchEvent(new Event("input")); // ⛽ Trigger word/token count update
      showToast("File uploaded successfully!", "success");
    } catch (err) {
      console.error("File read error:", err);
      showToast("File read failed. Try another one.", "error");
    } finally {
      uploadInput.value = ""; // allow same file re-upload
    }
  });
});
