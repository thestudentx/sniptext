// === quilbot2.js ===
// This script handles sending the user's text to your backend endpoint and updating the UI accordingly.

document.addEventListener('DOMContentLoaded', () => {
  const inputTextarea = document.getElementById('qb-input');
  const outputTextarea = document.getElementById('qb-output');
  const submitBtn = document.getElementById('qb-submit');
  const clearBtn = document.getElementById('qb-clear');
  const loader = document.getElementById('qb-loader');
  const errorMsg = document.getElementById('qb-error');

  // Dynamically set backend URL for local or live server
  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';

  // Clear input and output fields
  clearBtn.addEventListener('click', () => {
    inputTextarea.value = '';
    outputTextarea.value = '';
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
  });

  // Handle form submission
  submitBtn.addEventListener('click', async () => {
    const userText = inputTextarea.value.trim();
    if (!userText) {
      errorMsg.textContent = 'Please enter some text to paraphrase.';
      errorMsg.classList.remove('hidden');
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
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Include if your route requires auth
        },
        body: JSON.stringify({ text: userText }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Unknown error from server');
      }

      const data = await response.json();
      outputTextarea.value = data.paraphrased ?? '';
    } catch (err) {
      console.error('Paraphrase error:', err);
      errorMsg.textContent =
        'Sorry, something went wrong. Please try again later.';
      errorMsg.classList.remove('hidden');
    } finally {
      loader.classList.add('hidden');
      submitBtn.disabled = false;
      clearBtn.disabled = false;
    }
  });
});
