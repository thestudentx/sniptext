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
  const checkBtn      = document.getElementById("checkBtn");
  const inputText     = document.getElementById("inputText");
  const outputText    = document.getElementById("outputText");
  const wordCountElem = document.getElementById("wordCount");
  const undoBtn       = document.getElementById("undoBtn");
  const redoBtn       = document.getElementById("redoBtn");
  const goalsBtn      = document.getElementById("goalsBtn");
  const goalsOverlay  = document.getElementById("goalsOverlay");
  const closeGoals    = document.getElementById("closeGoals");
  const clearGoals    = document.getElementById("clearGoals");
  const saveGoals     = document.getElementById("saveGoals");
  const audienceSelect  = document.getElementById("audienceSelect");
  const formalitySelect = document.getElementById("formalitySelect");
  const intentSelect    = document.getElementById("intentSelect");
  const toneSelect      = document.getElementById("toneSelect");
  const domainSelect    = document.getElementById("domainSelect");
  const pasteBtn     = document.getElementById("pasteBtn");
  const copyBtn      = document.getElementById("copyBtn");
  const toggleBtn = document.getElementById("toggleHighlightsBtn");
  const highlightContainer = document.getElementById("grammarly-output-highlight");
  const uploadModal = document.getElementById("uploadModal");
const openUploadModalBtn = document.querySelector(".upload-label");
const closeUploadModal = document.getElementById("closeUploadModal");
const modalUploadInput = document.getElementById("modalUploadInput");
const modalFileInfo = document.getElementById("modalFileInfo");
const dropArea = document.getElementById("dropArea");


  // SHOW HIGHLIGHTS
  // Diff function
let showingHighlights = false;
function generateDiffHTML(original, rewritten) {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(original, rewritten);
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

// Toggle action
toggleBtn.addEventListener("click", () => {
  if (!outputText.value.trim()) {
    showToast("Nothing to highlight yet!", "error"); 
    return;
  }

  showingHighlights = !showingHighlights;

    // ✅ Toggle button style
  toggleBtn.classList.toggle("active");

  if (showingHighlights) {
    const diffHTML = generateDiffHTML(inputText.value, outputText.value);
    highlightContainer.innerHTML = diffHTML;
    highlightContainer.classList.remove("hidden");
    outputText.classList.add("hidden");
    toggleBtn.textContent = "Hide Changes";
  } else {
    highlightContainer.classList.add("hidden");
    outputText.classList.remove("hidden");
    toggleBtn.textContent = "Highlight Changes";
  }
});

// ─────────────────────────────────────────────────────────────────────
// Download Output as .txt file
document.getElementById("downloadBtn").addEventListener("click", () => {
  const text = outputText.value.trim(); // assuming outputText is your textarea or div
  if (!text) {
    showToast("Output is empty", "error");
    return;
  }

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "SnipText_Grammar_Correction.txt"; // 🔥 filename updated
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
});


  // ─────────────────────────────────────────────────────────────────────
  // Tokenize original markdown into markers & text chunks
  function tokenizeMarkdown(raw) {
    const lines  = raw.split("\n");
    const tokens = [];
    lines.forEach((line, idx) => {
      // strip editorial meta-lines entirely
      if (/^\s*(STAGE\s*\d+:|Final Polished Text:|Explanation of Changes:|.*Style Pass.*)$/i.test(line)) {
        // skip this line
      } else {
        // detect leading list/blockquote/heading marker
        const markerMatch = line.match(/^(\s*([*>#+\-]\s|[0-9]+\.\s))/);
        if (markerMatch) {
          tokens.push({ type: "marker", value: markerMatch[1] });
          tokens.push({ type: "text",   value: line.slice(markerMatch[1].length) });
        } else {
          tokens.push({ type: "text",   value: line });
        }
      }
      if (idx < lines.length - 1) {
        tokens.push({ type: "marker", value: "\n" });
      }
    });
    return tokens;
  }

  // Rebuild markdown from tokens + diffs
  function rebuildTokens(tokens, diffs) {
    let rebuilt = "";
    let diffIdx = 0;

    tokens.forEach(tok => {
      if (tok.type === "marker") {
        rebuilt += tok.value;
      } else {
        // tok.type === "text"
        let needed = tok.value.length;
        let chunk  = "";

        while (needed > 0 && diffIdx < diffs.length) {
          const [op, data] = diffs[diffIdx];
          if (op === 0) { // EQUAL
            const take = data.slice(0, needed);
            chunk += take;
            diffs[diffIdx][1] = data.slice(needed);
            needed -= take.length;
            if (!diffs[diffIdx][1]) diffIdx++;
          } else if (op === 1) { // INSERT
            chunk += data;
            diffIdx++;
          } else if (op === -1) { // DELETE
            diffIdx++;
          }
        }
        rebuilt += chunk;
      }
    });

    return rebuilt;
  }


  
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


/**
 * Split text into roughly maxWords‑sized chunks.
 */
function chunkText(text, maxWords = 300) {
  const words = text.trim().split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
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


  // 📤 Upload file
  openUploadModalBtn.addEventListener("click", (e) => {
  e.preventDefault();
  uploadModal.classList.remove("hidden");
});

closeUploadModal.addEventListener("click", () => {
  uploadModal.classList.add("hidden");
  modalFileInfo.classList.add("hidden");
});

// Drag & Drop Logic
["dragenter", "dragover"].forEach(event => {
  dropArea.addEventListener(event, e => {
    e.preventDefault();
    dropArea.classList.add("hover");
  });
});

["dragleave", "drop"].forEach(event => {
  dropArea.addEventListener(event, e => {
    e.preventDefault();
    dropArea.classList.remove("hover");
  });
});

dropArea.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  handleFileUpload(file);
});

modalUploadInput.addEventListener("change", e => {
  const file = e.target.files[0];
  handleFileUpload(file);
});

async function handleFileUpload(file) {
  if (!file) return;

  const maxSize = 300 * 1024 * 1024; // 300MB
  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));
  const allowedTypes = [".txt", ".docx", ".pdf"];

  if (!allowedTypes.includes(ext)) {
    modalFileInfo.textContent = "❌ Unsupported file type.";
    modalFileInfo.classList.remove("hidden");
    showToast("Only .txt, .docx, and .pdf files allowed", "error");
    return;
  }

  if (file.size > maxSize) {
    modalFileInfo.textContent = "❌ File too large.";
    modalFileInfo.classList.remove("hidden");
    showToast("File must be below 300MB", "error");
    return;
  }

  modalFileInfo.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  modalFileInfo.classList.remove("hidden");

  try {
    let text = "";
    if (ext === ".txt") {
      text = await file.text();
    } else if (ext === ".docx") {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      text = value;
    } else if (ext === ".pdf") {
      const pdfText = await readPDF(file);
      text = pdfText;
    }

    inputText.value = text;
    inputText.dispatchEvent(new Event("input"));
    showToast("File uploaded successfully!", "success");
    uploadModal.classList.add("hidden");
  } catch (err) {
    modalFileInfo.textContent = "⚠️ Failed to read file.";
    showToast("Error reading file", "error");
  }
}

async function readPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        resolve(text);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}


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
  if (wordsArray.length > 20000) {
    const trimmedText = wordsArray.slice(0, 20000).join(" ");
    inputText.value = trimmedText;
    showToast("🚫 Max 20000 words allowed! Paste trimmed.", "error");
    inputText.dispatchEvent(new Event("input")); // update word count
  }
});


// 🎯 Writing Goals Modal
let userSelectedGoals = {}; // Store selected goals

// Open the goals overlay
goalsBtn.addEventListener("click", () => {
  goalsOverlay.style.display = "flex";
});

// Close the overlay with close button
closeGoals.addEventListener("click", () => {
  goalsOverlay.style.display = "none";
});

// Close overlay if clicked outside panel
goalsOverlay.addEventListener("click", (e) => {
  if (e.target === goalsOverlay) goalsOverlay.style.display = "none";
});

// Clear: reset all dropdowns to "default"
clearGoals.addEventListener("click", () => {
  document.querySelectorAll('.goal-select').forEach(select => {
    select.value = 'default';
  });
  showToast("Rewrite style cleared.", "info");
});

// ✅ Save: gather only non-default goals, show toast, then hide overlay
saveGoals.addEventListener("click", () => {
  const raw = {
    audience: audienceSelect.value,
    formality: formalitySelect.value,
    intent: intentSelect.value,
    tone: toneSelect.value,
    domain: domainSelect.value
  };

  const goals = {};
  Object.entries(raw).forEach(([key, val]) => {
    if (val !== 'default') goals[key] = val;
  });

  userSelectedGoals = goals; // ✅ store globally
  console.log("🎯 Goals saved:", userSelectedGoals);

  // ✅ Show success or info toast
  if (Object.keys(goals).length > 0) {
    showToast("Rewrite style saved and applied.", "success");
  } else {
    showToast("All rewrite options are set to default.", "info");
  }

  // ✅ Close overlay after toast
  goalsOverlay.style.display = "none";
});



 // ✅ Grammar Check API with diff-based reapply (chunked)
checkBtn.addEventListener("click", async () => {
  const raw = inputText.value;
  if (!raw.trim()) {
    showToast("Please enter some text to check!", "error");
    return;
  }

  // 1) Tokenize & strip editorial markers
  const tokens = tokenizeMarkdown(raw);

  // 2) Extract plain text for API
  const plainText = tokens
    .filter(t => t.type === "text")
    .map(t => t.value)
    .join("\n");

  // 3) Split into ~300-word chunks
  const chunks = chunkText(plainText, 300);

  outputText.value = "";
  checkBtn.classList.add("loading");

  try {
    const correctedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      showToast(`Checking chunk ${i + 1} of ${chunks.length}…`, "info");

      const res = await fetch(`${BACKEND_URL}/api/grammar-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ text: chunks[i], goals: userSelectedGoals }),
      });
      if (!res.ok) throw new Error(await res.text());

      const { corrected_text = "" } = await res.json();
      correctedChunks.push(corrected_text);
    }

    // 4) Stitch all corrected chunks back together
    const fullCorrected = correctedChunks.join("\n\n");

    // 5) Run your diff-match-patch + rebuildTokens on the full text
    const dmp = new diff_match_patch();
    const tmp = dmp.diff_linesToChars_(plainText, fullCorrected);
    let diffs = dmp.diff_main(tmp.chars1, tmp.chars2, false);
    dmp.diff_charsToLines_(diffs, tmp.lineArray);
    dmp.diff_cleanupSemantic(diffs);

    let rebuilt = rebuildTokens(tokens, diffs);

    // 6) Post‑processing cleanup (all your existing replacements)
    rebuilt = rebuilt.replace(/\n{3,}/g, "\n\n")
                     .replace(/[*#]+\s*$/gm, "")
                     .replace(/(?<![#*+\-0-9])(\w+)\n(\w+)/g, "$1 $2")
                     .replace(/^---$/gm, "\n---\n")
                     .replace(/^#+\s*(.*)$/gm, (_, h) => h.replace(/\b\w/g, c => c.toUpperCase()))
                     .replace(/It affects ([\w\s]+?)\. It affects ([\w\s]+?)\./gi, "It affects $1 and $2.")
                     .replace(/^\s*[-+*]\s+(.*)/gm, (_, item) => `- ${item.trim()}`)
                     .replace(/^\s*\d+\.\s+(.*)/gm, (_, item) => `1. ${item.trim()}`)
                     .replace(/^1\.\s+/gm, () => `${(function(){let n=1;return n++})()}. `)  // auto‑increment
                     .replace(/((?:^|\n)- .+?)(?=\n[^-\n]|$)/gs, "\n$1\n")
                     .replace(/((?:^|\n)\d+\. .+?)(?=\n[^\d\n]|$)/gs, "\n$1\n")
                     .replace(/[-+*]\s*[-+*]/g, "")
                     .replace(/[-+*]\s*$/g, "")
                     .replace(/^[-+*]\s*$/gm, "")
                     .replace(/\n\s*\n(?=[-+*])/g, "\n\n")
                     .replace(/\n{2,}(?=[A-Z🧠])/g, "\n\n")
                     .trim();

    outputText.value = rebuilt;
    showToast("Grammar check completed!", "success");
  } catch (err) {
    console.error(err);
    outputText.value = `Error: ${err.message}`;
    showToast("Grammar check failed. Please try again.", "error");
  } finally {
    checkBtn.classList.remove("loading");
  }
});


  // 🧼 Optional HTML escape (unchanged)
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});