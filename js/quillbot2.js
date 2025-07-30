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
  const toastContainer = document.getElementById('toast-container');
  const countDisplay = document.getElementById('qb-count');
  const pasteBtn = document.getElementById('qb-paste');
  const copyBtn = document.getElementById('qb-copy');
  const uploadInput = document.getElementById('qb-upload'); // ✅ File input element
  const toggleBtn = document.getElementById('qb-toggle-highlights');
  const highlightContainer = document.getElementById('qb-output-highlight');

  // 🌍 MULTI: Language selector element (must exist in your HTML)
  const langSelect = document.getElementById('qb-language-select');

    // 🌍 MULTI: franc + mapping (ISO-639-3 → ISO-639-1)
  const isoMap = {
    eng: 'en',
    spa: 'es',
    fra: 'fr',
    deu: 'de',
    cmn: 'zh',
    // add more as needed
  };
  function detectLanguage(text) {
    const francCode = franc.min(text); // e.g. 'eng'
    return isoMap[francCode] || 'en';
  }

  // 🌍 MULTI: RTL/LTR helper
  const rtlLangs = ['ar', 'he'];
  function applyTextDirection(lang) {
    const isRTL = rtlLangs.includes(lang);
    inputTextarea.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    inputTextarea.style.textAlign = isRTL ? 'right' : 'left';
    outputTextarea.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    outputTextarea.style.textAlign = isRTL ? 'right' : 'left';
  }

  // 🌍 MULTI: toast on manual change + direction switch
  langSelect.addEventListener('change', () => {
    const val = langSelect.value;
    const label = val === 'auto'
      ? 'Will auto-detect input language'
      : `Will use ${langSelect.options[langSelect.selectedIndex].text}`;
    showToast(label, 'info');

    // 👉 Just apply dir/textAlign on the textareas only
    applyTextDirection(val);
  });


  //  // Toggle highlights on/off
  // keep track of view state
  let showingHighlights = false;

  // function to compute diff HTML
  function generateDiffHTML(original, rewritten) {
    const dmp = new diff_match_patch();
    let diffs = dmp.diff_main(original, rewritten);
    dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([op, text]) => {
      switch (op) {
        case DIFF_INSERT:
          return `<span class="diff-added">${text}</span>`;
        case DIFF_DELETE:
          return `<span class="diff-deleted">${text}</span>`;
        case DIFF_EQUAL:
        default:
          return `<span class="diff-equal">${text}</span>`;
      }
    }).join('');
  }

  // toggle view
  toggleBtn.addEventListener('click', () => {
    if (!outputTextarea.value.trim()) {
      showToast('Nothing to highlight yet!', 'error');
      return;
    }

    showingHighlights = !showingHighlights;
    if (showingHighlights) {
      // generate & show highlights
      const diffHTML = generateDiffHTML(inputTextarea.value, outputTextarea.value);
      highlightContainer.innerHTML = diffHTML;
      highlightContainer.classList.remove('hidden');
      outputTextarea.classList.add('hidden');
      toggleBtn.textContent = 'Show Clean';
    } else {
      // back to clean textarea
      highlightContainer.classList.add('hidden');
      outputTextarea.classList.remove('hidden');
      toggleBtn.textContent = 'Show Highlights';
    }
  });

  /**
 * 1) Remove editorial meta-lines:
 *    • STAGE 1: …
 *    • STAGE 2: …
 *    • Final Polished Text:
 *    • Explanation of Changes:
 *    • Any “Style Pass” lines
 * 2) Strip stray markdown (#, **, *), but:
 *    • Preserve & indent true lists (–, *, +, 1., 2., etc.)
 *    • Preserve blockquotes (>)
 *    • Keep legitimate “Explanation:” lines
 */
  function formatCleanText(text) {
    return text
      .split("\n")
      // 1) DROP only the unwanted metadata
      .filter(line => {
        return !/^\s*(STAGE\s*\d+:|Final Polished Text:|Explanation of Changes:|.*Style Pass.*)$/i.test(line);
      })
      .map(line => {
        // keep blockquotes verbatim
        if (/^\s*>/.test(line)) {
          return line.trim();
        }

        // strip ALL # heading markers
        line = line.replace(/^#{1,6}\s*/, "").replace(/#/g, "");

        // unwrap bold/italic everywhere
        line = line
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/\*(.+?)\*/g, "$1");

        const trimmed = line.trim();

        // true numbered list?
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return "  " + numMatch[1] + ". " + numMatch[2].trim();
        }

        // true bullet list?
        const bulletMatch = trimmed.match(/^([*+\-])\s+(.*)/);
        if (bulletMatch) {
          return "  " + bulletMatch[1] + " " + bulletMatch[2].trim();
        }

        // leave em-dashes at start alone (not a list)
        if (/^[—–]\s+/.test(trimmed)) {
          return trimmed;
        }

        // otherwise just return the trimmed line
        return trimmed;
      })
      .join("\n")
      .trim();  // drop any leading/trailing blank lines
  }

let selectedType = 'mode';
let selectedMode = 'standard';
let selectedStyle = 'default';
let selectedTone = 'default';

const modeTabs = document.querySelectorAll('.qb-tab-mode');
const styleTabs = document.querySelectorAll('.qb-tab-style');
const toneTabs = document.querySelectorAll('.qb-tab-tone');

// helper to clear all tab groups
function clearAllTabs() {
  modeTabs.forEach(t => t.classList.remove('active'));
  styleTabs.forEach(t => t.classList.remove('active'));
  toneTabs.forEach(t => t.classList.remove('active'));
}

// MODE SELECT
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    clearAllTabs();
    tab.classList.add('active');
    selectedType = 'mode';
    selectedMode = tab.getAttribute('data-mode');
    selectedStyle = '';
    selectedTone = '';
  });
});

// STYLE SELECT
styleTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    clearAllTabs();
    tab.classList.add('active');
    selectedType = 'style';
    selectedStyle = tab.getAttribute('data-style');
    selectedMode = '';
    selectedTone = '';
  });
});

// TONE SELECT
toneTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    clearAllTabs();
    tab.classList.add('active');
    selectedType = 'tone';
    selectedTone = tab.getAttribute('data-tone');
    selectedMode = '';
    selectedStyle = '';
  });
});


  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';



  // COUNTER
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

  /**
 * Splits a string into chunks of roughly `maxWords` words,
 * breaking only at whitespace boundaries.
 */
function chunkText(text, maxWords = 300) {
  const words = text.trim().split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}


submitBtn.addEventListener('click', async () => {
  const userText = inputTextarea.value.trim();
  if (!userText) {
    errorMsg.textContent = 'Please enter some text to paraphrase.';
    errorMsg.classList.remove('hidden');
    showToast('You need to type something first.', 'error');
    return;
  }

  // decide language
  let languageToSend = langSelect.value === 'auto'
    ? detectLanguage(userText)
    : langSelect.value;

  // chunk if too big
  const chunks = chunkText(userText, 300);

  loader.classList.remove('hidden');
  submitBtn.disabled = true;
  clearBtn.disabled = true;
  errorMsg.classList.add('hidden');

  try {
    const paraphrasedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      showToast(`Paraphrasing chunk ${i + 1} of ${chunks.length}…`, 'info');

      const body = {
        text: chunks[i],
        language: languageToSend,
        ...(selectedType === 'mode'   && { mode:  selectedMode   }),
        ...(selectedType === 'style'  && { style: selectedStyle  }),
        ...(selectedType === 'tone'   && { tone:  selectedTone   }),
      };

      const res = await fetch(`${BACKEND_URL}/api/cohere/paraphrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      const { paraphrased = '' } = await res.json();
      paraphrasedChunks.push(formatCleanText(paraphrased));
    }

    // join all the paraphrased chunks back into one text
    const finalParaphrase = paraphrasedChunks.join('\n\n');
    outputTextarea.value = finalParaphrase;
    highlightContainer.classList.add('hidden');
    outputTextarea.classList.remove('hidden');
    toggleBtn.textContent = 'Show Highlights';
    showToast('Paraphrase complete!', 'success');
  } catch (err) {
    console.error('Paraphrase error:', err);
    errorMsg.textContent = 'Sorry, something went wrong. Please try again later.';
    errorMsg.classList.remove('hidden');
    showToast('Failed to paraphrase. Check console.', 'error');
  } finally {
    loader.classList.add('hidden');
    submitBtn.disabled = false;
    clearBtn.disabled = false;
  }
});

// Paste/Copy Logic 
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
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        text = html;
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

// === Reveal Animation for Why Section Cards ===
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.fade-in-box').forEach((box) => {
    observer.observe(box);
  });
});
