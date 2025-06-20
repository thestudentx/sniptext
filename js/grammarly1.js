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
  const btnSpinner    = document.getElementById("btnSpinner");
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
  const uploadBtn    = document.getElementById("uploadBtn");
  const fileInfo     = document.getElementById("fileInfo");
  const toastContainer = document.getElementById("g-toast-container");
  const toggleBtn = document.getElementById("toggleHighlightsBtn");
  const highlightContainer = document.getElementById("grammarly-output-highlight");


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






  // ✅ Toast Notification (Title on top, Message below)
function showToast(a1, a2, a3) {
  let title, message, type;

  // Handle overload: (message, type) or (title, message, type)
  if (a3 === undefined && ['success','error','info','warning'].includes(a2)) {
    message = a1;
    type    = a2;
    title   = type.charAt(0).toUpperCase() + type.slice(1); // auto-title
  } else {
    title   = a1;
    message = a2;
    type    = a3 || 'info';
  }

  const toast = document.createElement('div');
  toast.classList.add('toast', type);

  // 🔔 Icon
  const iconMap = {
    success: 'fa-check-circle',
    error:   'fa-times-circle',
    info:    'fa-info-circle',
    warning: 'fa-exclamation-circle'
  };
  const c1 = document.createElement('div');
  c1.className = 'container-1';
  const icon = document.createElement('i');
  icon.classList.add('fas', iconMap[type]);
  c1.appendChild(icon);

  // 📝 Text Block: Title on top, Message below
  const c2 = document.createElement('div');
  c2.className = 'container-2';

  const pTitle = document.createElement('p');
  pTitle.className = 'toast-title';
  pTitle.textContent = title;

  const pMsg = document.createElement('p');
  pMsg.className = 'toast-message';
  pMsg.textContent = message;

  c2.append(pTitle, pMsg);

  // ❌ Close Button
  const btn = document.createElement('button');
  btn.className = 'toast-close';
  btn.innerHTML = '&times;';
  btn.addEventListener('click', () => {
    toast.remove();
    if (!toastContainer.childElementCount) {
      toastContainer.classList.add('hidden');
    }
  });

  // 🧩 Assemble
  toast.append(c1, c2, btn);
  toastContainer.appendChild(toast);
  toastContainer.classList.remove('hidden');

  // ⏱️ Auto-Remove after 4s
  setTimeout(() => {
    toast.remove();
    if (!toastContainer.childElementCount) {
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
        showToast("Error", "Only .txt and .docx files allowed", "error");
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
  if (wordsArray.length > 20000) {
    const trimmedText = wordsArray.slice(0, 20000).join(" ");
    inputText.value = trimmedText;
    showToast("🚫 Max 20000 words allowed! Paste trimmed.", "error");
    inputText.dispatchEvent(new Event("input")); // update word count
  }
});



// 🎯 Writing Goals Modal
let userSelectedGoals = {}; // Store selected goals

goalsBtn.addEventListener("click", () => {
  goalsOverlay.style.display = "flex";
});
closeGoals.addEventListener("click", () => {
  goalsOverlay.style.display = "none";
});
goalsOverlay.addEventListener("click", (e) => {
  if (e.target === goalsOverlay) goalsOverlay.style.display = "none";
});

// Clear: reset all dropdowns to "default"
clearGoals.addEventListener("click", () => {
  document.querySelectorAll('.goal-select').forEach(select => {
    select.value = 'default';
  });
});

// Save: gather only non-default goals, then hide overlay
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

  userSelectedGoals = goals; // ✅ store it globally
  console.log("🎯 Goals saved:", userSelectedGoals);

  goalsOverlay.style.display = "none";
});



 // ✅ Grammar Check API with diff-based reapply
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

    outputText.value = "";
    checkBtn.classList.add("loading");

   const goalsPayload = userSelectedGoals;

    try {
      console.log("📤 Payload:", {
  text: plainText,
  goals: goalsPayload
});
      const response = await fetch(`${BACKEND_URL}/api/grammar-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ text: plainText, goals: goalsPayload }),
      });
      if (!response.ok) throw new Error("Server error. Try again later.");

      const data = await response.json();
      let corrected = data.corrected_text || "";

      // cut off at any editorial markers server might still inject
      corrected = corrected.split(/(Final Polished Text:|Polished Version:|Revised Version:)/i)[0].trim();

      // 3) Diff-match-patch
      // 3a) Instantiate
const dmp = new diff_match_patch();

// 3b) Turn each unique line into a “char” for the library
const tmp = dmp.diff_linesToChars_(plainText, corrected);
const chars1    = tmp.chars1;
const chars2    = tmp.chars2;
const lineArray = tmp.lineArray;

// 3c) Diff on those pseudo‑chars (fast, and line boundaries are honored)
let diffs = dmp.diff_main(chars1, chars2, false);

// 3d) Convert the char diffs back into real lines
dmp.diff_charsToLines_(diffs, lineArray);

// 3e) (Optional) Clean up the diff for readability 
dmp.diff_cleanupSemantic(diffs);

// 4) Rebuild original formatting + new text
let rebuilt = rebuildTokens(tokens, diffs);



// 5) POST-PROCESSING CLEANUP

// Collapse 3+ newlines to 2
rebuilt = rebuilt.replace(/\n{3,}/g, '\n\n');

// Remove trailing stars or hashes (leftovers)
rebuilt = rebuilt.replace(/[*#]+\s*$/gm, '');

// Fix mid-sentence broken lines: "This i\ns a problem" → "This is a problem"
rebuilt = rebuilt.replace(/(?<![#*+\-0-9])(\w+)\n(\w+)/g, '$1 $2');

// Preserve horizontal rules
rebuilt = rebuilt.replace(/^---$/gm, '\n---\n');

// Capitalize all headings (Markdown style)
rebuilt = rebuilt.replace(/^#+\s*(.*)$/gm, (_, heading) => {
  return heading.replace(/\b\w/g, (c) => c.toUpperCase());
});

// Fix STAGE lines → bold markdown
// rebuilt = rebuilt.replace(/^STAGE\s*(\d+):/gi, (_, n) => `**STAGE ${n}: Grammar and Typography Pass**`);

// Merge repeated sentences like: "It affects X. It affects Y." → "It affects X and Y."
rebuilt = rebuilt.replace(/It affects ([\w\s]+?)\. It affects ([\w\s]+?)\./gi, 'It affects $1 and $2.');

// ✅ Normalize bullets & keep them as Markdown list items
rebuilt = rebuilt.replace(/^\s*[-+*]\s+(.*)/gm, (_, item) => {
  return `- ${item.trim()}`; // normalize to `-` and clean spacing
});

// ✅ Normalize numbered lists like "1. something"
rebuilt = rebuilt.replace(/^\s*\d+\.\s+(.*)/gm, (_, item) => {
  return `1. ${item.trim()}`; // just normalize spacing (number will be updated below)
});

// ✅ Auto-correct sequential numbers (so all are not just "1.")
let number = 1;
rebuilt = rebuilt.replace(/^1\.\s+/gm, () => `${number++}. `);

// ✅ Add spacing before and after lists for clarity
rebuilt = rebuilt.replace(/((?:^|\n)- .+?)(?=\n[^-\n]|$)/gs, '\n$1\n');
rebuilt = rebuilt.replace(/((?:^|\n)\d+\. .+?)(?=\n[^\d\n]|$)/gs, '\n$1\n');

// Fix accidental leftover list symbols like "- +" at end
rebuilt = rebuilt.replace(/[-+*]\s*[-+*]/g, '').replace(/[-+*]\s*$/, '');

// Remove random symbols only if not part of a legit structure
rebuilt = rebuilt.replace(/^[-+*]\s*$/gm, '');

// Normalize multiple blank lines followed by symbols
rebuilt = rebuilt.replace(/\n\s*\n(?=[-+*])/g, '\n\n');

// Normalize heading/title spacing
rebuilt = rebuilt.replace(/\n{2,}(?=[A-Z🧠🔥🌍✍️])/g, '\n\n');

// Trim overall output
rebuilt = rebuilt.trim();



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