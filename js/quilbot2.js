// === quilbot2.js ===
// This script handles sending the user's text (and selected mode) to your backend endpoint,
// showing loader/toasts, updating the UI, and managing live word/token counts.

document.addEventListener('DOMContentLoaded', () => {
  const inputTextarea = document.getElementById('qb-input');
  const outputTextarea = document.getElementById('qb-output');
  const submitBtn = document.getElementById('qb-submit');
  const clearBtn = document.getElementById('qb-clear');
  const loader = document.getElementById('qb-loader');
  const errorMsg = document.getElementById('qb-error');
  const modeSelect = document.getElementById('qb-mode');
  const toastContainer = document.getElementById('qb-toast-container');
  const countDisplay = document.getElementById('qb-count');

  // Dynamically set backend URL for local or live server
  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';

  // Utility: show a toast (type: "success" | "error" | "info")
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('qb-toast', `qb-toast--${type}`);
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Remove after animation (4s total: 0.3s in, 3.5s visible, 0.3s out)
    setTimeout(() => {
      toast.remove();
      if (toastContainer.childElementCount === 0) {
        toastContainer.classList.add('hidden');
      }
    }, 4000);

    // Ensure container is visible
    toastContainer.classList.remove('hidden');
  }

  // Utility: update word/token count below the textarea
  function updateCount() {
    const text = inputTextarea.value.trim();
    if (!text) {
      countDisplay.textContent = 'Words: 0 | Approx. Tokens: 0';
      return;
    }
    // Simple word count:
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    // Approx tokens ≈ words * 1.3 (rough estimate; adjust if needed)
    const approxTokens = Math.ceil(words * 1.3);
    countDisplay.textContent = `Words: ${words} | Approx. Tokens: ${approxTokens}`;
  }

  // Update count on every input
  inputTextarea.addEventListener('input', updateCount);

  // Clear input, output, error messages
  clearBtn.addEventListener('click', () => {
    inputTextarea.value = '';
    outputTextarea.value = '';
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    updateCount();
    showToast('Cleared text fields.', 'info');
  });

  // Handle form submission
  submitBtn.addEventListener('click', async () => {
    const userText = inputTextarea.value.trim();
    const selectedMode = modeSelect.value;

    if (!userText) {
      errorMsg.textContent = 'Please enter some text to paraphrase.';
      errorMsg.classList.remove('hidden');
      showToast('You need to type something first.', 'error');
      return;
    }

    // Reset error and show loader
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
          'Authorization': `Bearer ${localStorage.getItem('token')}` // include if required
        },
        body: JSON.stringify({
          text: userText,
          mode: selectedMode // backend now uses mode
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
});
