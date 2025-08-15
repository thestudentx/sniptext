// File: grammarly1.js
// Safe, fast, accessible grammar checker client for Snip Text

document.addEventListener('DOMContentLoaded', () => {
  /* ===============================
   * 0) UTILITIES (notify, escape, etc.)
   * =============================== */

  // Thin notifier: forwards to global showToast only (no local UI/fallback)
  const notify = (msg, type = 'info', opts = {}) => {
    try {
      if (typeof window.showToast !== 'function') return;
      if (typeof msg === 'object') return window.showToast(msg);
      return window.showToast({
        title: opts.title || (type[0].toUpperCase() + type.slice(1)),
        message: msg,
        type,
        duration: opts.duration ?? (type === 'error' ? 5200 : 3400),
        position: opts.position || 'tr',
        aria: opts.aria,
        actions: opts.actions
      });
    } catch (_) { /* ignore */ }
  };

  // XSS-safe HTML escape
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Queued toast (sequential), uses global showToast via notify
  const qtoast = (() => {
    const queue = [];
    let active = false;

    const next = () => {
      const item = queue.shift();
      if (!item) { active = false; return; }
      active = true;
      const dur = item.opts?.duration ?? (item.type === 'error' ? 5200 : 1400);
      notify(item.msg, item.type, item.opts);
      setTimeout(next, dur + 60);
    };

    const push = (msg, type = 'info', opts = {}) => {
      queue.push({ msg, type, opts });
      if (!active) next();
    };

    push.clear = () => { queue.length = 0; };

    return push;
  })();

  // Small aria-live region for screen reader updates
  const ariaLive = document.createElement('div');
  ariaLive.setAttribute('aria-live', 'polite');
  ariaLive.style.position = 'absolute';
  ariaLive.style.left = '-9999px';
  ariaLive.style.width = '1px';
  ariaLive.style.height = '1px';
  document.body.appendChild(ariaLive);
  const announce = (t) => { ariaLive.textContent = t; };

  /* ===============================
   * 1) AUTH CHECK (supports exp + accessDuration)
   * =============================== */
  function decodeJwtPayload(t) {
    const seg = (t.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = seg + '='.repeat((4 - seg.length % 4) % 4);
    return JSON.parse(atob(pad || ''));
  }

  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/login.html'; return; }
  try {
    const decodedPayload = decodeJwtPayload(token);
    const expMs = decodedPayload?.exp ? decodedPayload.exp * 1000
                  : (decodedPayload?.accessDuration ? new Date(decodedPayload.accessDuration).getTime() : 0);
    if (!expMs || Date.now() > expMs) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }
    console.log('✅ Access granted');
  } catch (err) {
    console.error('Invalid token', err);
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    return;
  }

  /* ===============================
   * 2) BACKEND URL
   * =============================== */
  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';

  /* ===============================
   * 3) DOM ELEMENTS
   * =============================== */
  const checkBtn      = document.getElementById('checkBtn');
  const inputText     = document.getElementById('inputText');
  const outputText    = document.getElementById('outputText');
  const wordCountElem = document.getElementById('wordCount');

  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  const goalsBtn      = document.getElementById('goalsBtn');
  const goalsOverlay  = document.getElementById('goalsOverlay');
  const closeGoals    = document.getElementById('closeGoals');
  const clearGoals    = document.getElementById('clearGoals');
  const saveGoals     = document.getElementById('saveGoals');

  const audienceSelect  = document.getElementById('audienceSelect');
  const formalitySelect = document.getElementById('formalitySelect');
  const intentSelect    = document.getElementById('intentSelect');
  const toneSelect      = document.getElementById('toneSelect');
  const domainSelect    = document.getElementById('domainSelect');

  const pasteBtn    = document.getElementById('pasteBtn');
  const copyBtn     = document.getElementById('copyBtn');
  const toggleBtn   = document.getElementById('toggleHighlightsBtn');
  const highlightContainer = document.getElementById('grammarly-output-highlight');

  // Footer hidden input (native upload)
  const footerUploadInput = document.getElementById('uploadBtn');

  // Modal upload elements (kept, but not hijacking footer label)
  const uploadModal       = document.getElementById('uploadModal');
  const closeUploadModal  = document.getElementById('closeUploadModal');
  const modalUploadInput  = document.getElementById('modalUploadInput');
  const modalFileInfo     = document.getElementById('modalFileInfo');
  const dropArea          = document.getElementById('dropArea');

  /* ===============================
   * 4) DIFF (single lib usage + escaping)
   * =============================== */
  function generateDiffHTML(original, rewritten) {
    if (typeof diff_match_patch !== 'function') {
      // library not ready—show clean output
      return esc(rewritten);
    }
    const dmp = new diff_match_patch();
    const o = esc(original);
    const r = esc(rewritten);
    const diffs = dmp.diff_main(o, r);
    dmp.diff_cleanupSemantic(diffs);
    return diffs.map(([op, text]) => {
      if (op === dmp.DIFF_INSERT) return `<span class="diff-added">${text}</span>`;
      if (op === dmp.DIFF_DELETE) return `<span class="diff-deleted">${text}</span>`;
      return `<span class="diff-equal">${text}</span>`;
    }).join('');
  }

  let showingHighlights = false;
  toggleBtn?.addEventListener('click', () => {
    if (!outputText.value.trim()) { notify('Nothing to highlight yet!', 'error'); return; }
    showingHighlights = !showingHighlights;
    toggleBtn.classList.toggle('active');
    if (showingHighlights) {
      if (typeof diff_match_patch !== 'function') {
        notify('Change highlighter not ready. Try again in a moment.', 'warning');
      }
      const diffHTML = generateDiffHTML(inputText.value, outputText.value);
      if (!highlightContainer) { notify('Highlight panel missing in DOM.', 'warning'); return; }
      highlightContainer.innerHTML = diffHTML;
      highlightContainer.classList.remove('hidden');
      outputText.classList.add('hidden');
      toggleBtn.textContent = 'Hide Changes';
    } else {
      highlightContainer?.classList.add('hidden');
      outputText.classList.remove('hidden');
      toggleBtn.textContent = 'Highlight Changes';
    }
  });

  /* ===============================
   * 5) DOWNLOAD OUTPUT (.txt)
   * =============================== */
  document.getElementById('downloadBtn')?.addEventListener('click', () => {
    const text = outputText.value.trim();
    if (!text) { notify('Output is empty', 'error'); return; }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'SnipText_Grammar_Correction.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  /* ===============================
   * 6) TOKENIZE → REBUILD (format-safe)
   * =============================== */
  function tokenizeMarkdown(raw) {
    const lines  = raw.split('\n');
    const tokens = [];
    lines.forEach((line, idx) => {
      // strip editorial meta-lines entirely
      if (/^\s*(STAGE\s*\d+:|Final Polished Text:|Explanation of Changes:|.*Style Pass.*)$/i.test(line)) {
        // skip this line
      } else {
        // improved marker detection (headings, nested blockquotes, bullets, ordered lists)
        const markerMatch = line.match(/^(\s*(?:>+|\#{1,6}|[*+\-]|\d+\.)\s+)/);
        if (markerMatch) {
          tokens.push({ type: 'marker', value: markerMatch[1] });
          tokens.push({ type: 'text',   value: line.slice(markerMatch[1].length) });
        } else {
          tokens.push({ type: 'text', value: line });
        }
      }
      if (idx < lines.length - 1) tokens.push({ type: 'marker', value: '\n' });
    });
    return tokens;
  }

  function rebuildTokens(tokens, diffs) {
    let rebuilt = '';
    let diffIdx = 0;
    const clone = diffs.map(d => [d[0], d[1]]); // avoid mutating original
    tokens.forEach(tok => {
      if (tok.type === 'marker') {
        rebuilt += tok.value;
      } else {
        let needed = tok.value.length;
        let chunk  = '';
        while (needed > 0 && diffIdx < clone.length) {
          const [op, data] = clone[diffIdx];
          if (op === 0) { // equal
            const take = data.slice(0, needed);
            chunk += take;
            clone[diffIdx][1] = data.slice(needed);
            needed -= take.length;
            if (!clone[diffIdx][1]) diffIdx++;
          } else if (op === 1) { // insert
            chunk += data;
            diffIdx++;
          } else if (op === -1) { // delete
            diffIdx++;
          }
        }
        rebuilt += chunk;
      }
    });
    return rebuilt;
  }

  function formatCleanText(text, { preserveMarkdown = true } = {}) {
    let t = text
      .split('\n')
      .filter(line => !/^\s*(STAGE\s*\d+:|Final Polished Text:|Explanation of Changes:|.*Style Pass.*)$/i.test(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!preserveMarkdown) {
      t = t
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1');
    }
    return t;
  }

  const MAX_WORDS = 5000;
  function chunkText(text, maxWords = 300) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWords) chunks.push(words.slice(i, i + maxWords).join(' '));
    return chunks;
  }

  /* ===============================
   * 7) UNDO / REDO (simple stacks)
   * =============================== */
  const history = [];
  let hIndex = -1;
  let saveTimer = null;
  function pushHistory(val) {
    history.splice(hIndex + 1);
    history.push(val);
    hIndex = history.length - 1;
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => pushHistory(inputText.value), 250);
  }
  inputText?.addEventListener('input', scheduleSave);
  pushHistory(inputText?.value || '');

  undoBtn?.addEventListener('click', () => {
    if (hIndex > 0) {
      hIndex -= 1;
      inputText.value = history[hIndex];
      inputText.dispatchEvent(new Event('input'));
    }
  });
  redoBtn?.addEventListener('click', () => {
    if (hIndex < history.length - 1) {
      hIndex += 1;
      inputText.value = history[hIndex];
      inputText.dispatchEvent(new Event('input'));
    }
  });

  /* ===============================
   * 8) PASTE / COPY
   * =============================== */
  pasteBtn?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { notify('Clipboard is empty!', 'error'); return; }
      inputText.value = text;
      inputText.dispatchEvent(new Event('input'));
      notify('Text pasted from clipboard!', 'success');
    } catch {
      notify('Failed to read clipboard. Allow permission?', 'error');
    }
  });

  copyBtn?.addEventListener('click', async () => {
    const output = outputText.value.trim();
    if (!output) { notify('Nothing to copy!', 'error'); return; }
    try {
      await navigator.clipboard.writeText(output);
      notify('Copied to clipboard!', 'success');
    } catch {
      notify('Failed to copy', 'error');
    }
  });

  /* ===============================
   * 9) UNIFIED INPUT HANDLER (count + limit + RTL)
   * =============================== */
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/; // he, ar, fa, ur ranges
  inputText?.addEventListener('input', () => {
    const words = inputText.value.trim().split(/\s+/).filter(Boolean);
    if (words.length > MAX_WORDS) {
      inputText.value = words.slice(0, MAX_WORDS).join(' ') + ' ';
      notify(`🚫 Max ${MAX_WORDS} words allowed! Paste trimmed.`, 'error');
    }
    wordCountElem.textContent = `${words.length} word${words.length !== 1 ? 's' : ''}`;

    const isRTL = rtlRegex.test(inputText.value);
    inputText.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    outputText.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  });
  setTimeout(() => inputText?.dispatchEvent(new Event('input')), 0);

  /* ===============================
   * 10) GOALS (dialog semantics + persistence)
   * =============================== */
  let userSelectedGoals = {};
  try {
    const saved = JSON.parse(localStorage.getItem('st_goals') || '{}');
    userSelectedGoals = saved;
    const map = { audience: audienceSelect, formality: formalitySelect, intent: intentSelect, tone: toneSelect, domain: domainSelect };
    Object.entries(saved).forEach(([k, v]) => { if (map[k]) map[k].value = v; });
  } catch {}

  function openDialog() {
    if (!goalsOverlay) return;
    goalsOverlay.style.display = 'flex';
    goalsOverlay.setAttribute('role', 'dialog');
    goalsOverlay.setAttribute('aria-modal', 'true');
    (goalsOverlay.querySelector('.goal-select') || closeGoals)?.focus();
    const focusables = goalsOverlay.querySelectorAll('button, [href], select, textarea, input, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    goalsOverlay.onkeydown = (e) => {
      if (e.key === 'Escape') { closeDialog(); }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
  }
  function closeDialog() {
    goalsOverlay.style.display = 'none';
    goalsOverlay.onkeydown = null;
    goalsBtn?.focus();
  }

  goalsBtn?.addEventListener('click', openDialog);
  closeGoals?.addEventListener('click', closeDialog);
  goalsOverlay?.addEventListener('click', (e) => { if (e.target === goalsOverlay) closeDialog(); });

  clearGoals?.addEventListener('click', () => {
    document.querySelectorAll('.goal-select').forEach(s => { s.value = 'default'; });
    userSelectedGoals = {};
    localStorage.removeItem('st_goals');
    notify('Rewrite style cleared.', 'info');
  });

  saveGoals?.addEventListener('click', () => {
    const raw = {
      audience: audienceSelect.value,
      formality: formalitySelect.value,
      intent: intentSelect.value,
      tone: toneSelect.value,
      domain: domainSelect.value
    };
    const goals = {};
    Object.entries(raw).forEach(([k, v]) => { if (v !== 'default') goals[k] = v; });
    userSelectedGoals = goals;
    localStorage.setItem('st_goals', JSON.stringify(goals));
    notify(
      Object.keys(goals).length ? 'Rewrite style saved and applied.' : 'All rewrite options are set to default.',
      Object.keys(goals).length ? 'success' : 'info'
    );
    closeDialog();
  });

  /* ===============================
   * 11) FILE UPLOADS (footer input + modal inputs)
   * =============================== */
  footerUploadInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileSmart(file); // supports txt/docx/pdf (pdf won’t appear due to accept)
      inputText.value = text || '';
      inputText.dispatchEvent(new Event('input'));
      notify('File loaded.', 'success');
    } catch {
      notify('File read failed.', 'error');
    } finally {
      e.target.value = '';
    }
  });

  closeUploadModal?.addEventListener('click', () => {
    uploadModal.classList.add('hidden');
    modalFileInfo.classList.add('hidden');
  });

  ['dragenter','dragover'].forEach(ev => {
    dropArea?.addEventListener(ev, e => { e.preventDefault(); dropArea.classList.add('hover'); });
  });
  ['dragleave','drop'].forEach(ev => {
    dropArea?.addEventListener(ev, e => { e.preventDefault(); dropArea.classList.remove('hover'); });
  });
  dropArea?.addEventListener('drop', e => {
    const file = e.dataTransfer.files?.[0]; handleModalUpload(file);
  });
  modalUploadInput?.addEventListener('change', e => {
    const file = e.target.files?.[0]; handleModalUpload(file);
  });

  async function handleModalUpload(file) {
    if (!file) return;
    const maxSize = 300 * 1024 * 1024;
    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    const allowed = ['.txt','.docx','.pdf'];
    if (!allowed.includes(ext)) {
      modalFileInfo.textContent = '❌ Unsupported file type.'; modalFileInfo.classList.remove('hidden');
      notify('Only .txt, .docx, and .pdf files allowed', 'error'); return;
    }
    if (file.size > maxSize) {
      modalFileInfo.textContent = '❌ File too large.'; modalFileInfo.classList.remove('hidden');
      notify('File must be below 300MB', 'error'); return;
    }
    modalFileInfo.textContent = `📄 ${file.name} (${(file.size/1024).toFixed(1)} KB)`; modalFileInfo.classList.remove('hidden');
    try {
      const text = await readFileSmart(file);
      inputText.value = text || '';
      inputText.dispatchEvent(new Event('input'));
      notify('File uploaded successfully!', 'success');
      uploadModal.classList.add('hidden');
    } catch {
      modalFileInfo.textContent = '⚠️ Failed to read file.'; notify('Error reading file', 'error');
    }
  }

  async function ensureMammoth() {
    if (window.mammoth?.extractRawText) return window.mammoth;
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js';
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return window.mammoth;
  }

  async function readFileSmart(file) {
    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    if (ext === '.txt') return file.text();
    if (ext === '.docx') {
      const ab = await file.arrayBuffer();
      const mm = await ensureMammoth();
      const { value } = await mm.extractRawText({ arrayBuffer: ab });
      return value || '';
    }
    if (ext === '.pdf') {
      return await readPDF(file);
    }
    return '';
  }

  // Lazy-load pdf.js if not present; then extract text quickly
  async function readPDF(file) {
    async function ensurePdfJs() {
      if (window.pdfjsLib?.getDocument) return window.pdfjsLib;
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      return window.pdfjsLib;
    }
    const pdfjsLib = await ensurePdfJs();
    const reader = new FileReader();
    const data = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
  }

  /* ===============================
   * 12) NETWORK (retry/backoff + abort)
   * =============================== */
  let currentAbort = null;

  async function fetchWithRetry(url, options = {}, retries = 2) {
    let attempt = 0, delay = 600;
    while (true) {
      try {
        const res = await fetch(url, options);
        if (res.status === 401) {
          notify('Session expired. Redirecting to login…', 'error', { aria: 'assertive' });
          localStorage.removeItem('token');
          window.location.href = '/login.html';
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          if ((res.status === 429 || res.status >= 500) && attempt < retries) {
            attempt++; await new Promise(r => setTimeout(r, delay + Math.random()*300)); delay *= 1.6; continue;
          }
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res;
      } catch (e) {
        if (options.signal && options.signal.aborted) throw e;
        if (attempt < retries) {
          attempt++; await new Promise(r => setTimeout(r, delay + Math.random()*300)); delay *= 1.6; continue;
        }
        throw e;
      }
    }
  }

  /* ===============================
   * 13) GRAMMAR CHECK (chunked, concurrency=3, progressive, final rebuild)
   * =============================== */
  function setBusy(busy, status = '') {
    checkBtn.disabled = busy;
    checkBtn.classList.toggle('loading', busy);
    if (status) announce(status);
  }

  checkBtn?.addEventListener('click', async () => {
    const raw = inputText.value || '';
    if (!raw.trim()) { notify('Please enter some text to check!', 'error'); return; }

    // Abort any in-flight run and clear queued toasts
    if (currentAbort) { try { currentAbort.abort(); } catch {} qtoast.clear?.(); }
    currentAbort = new AbortController();

    // Tokenize & extract plain text for API
    const tokens = tokenizeMarkdown(raw);
    const plainText = tokens.filter(t => t.type === 'text').map(t => t.value).join('\n');

    const chunks = chunkText(plainText, 300);
    const total = chunks.length;

    // Announce start
    qtoast.clear?.();
    notify(total > 1 ? `Starting grammar check in ${total} chunks…` : 'Starting grammar check…', 'info', { duration: 1600, position: 'tr' });
    announce(total > 1 ? `Started grammar check in ${total} chunks.` : 'Started grammar check.');

    // Progressive placeholders and render batching
    const PLACEHOLDER = '⏳ Checking…';
    const results = Array(total).fill(PLACEHOLDER);
    const corrected = Array(total).fill('');

    const rafRender = (() => {
      let queued = false;
      return () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          const live = corrected.map((t, i) => t || results[i]).join('\n\n');
          outputText.value = live;
          queued = false;
        });
      };
    })();

    // Disable highlights during run
    showingHighlights = false;
    highlightContainer?.classList.add('hidden');
    outputText.classList.remove('hidden');
    toggleBtn && (toggleBtn.textContent = 'Highlight Changes');
    toggleBtn && (toggleBtn.disabled = true);

    outputText.value = results.join('\n\n');
    setBusy(true, `0%`);

    // Concurrency control
    const queue = chunks.map((text, index) => ({ text, index }));
    const CONCURRENCY = Math.min(3, total);
    let inFlight = 0, i = 0, completed = 0, failed = 0;

    async function runOne(job) {
      const body = { text: job.text, goals: userSelectedGoals };
      const res = await fetchWithRetry(`${BACKEND_URL}/api/grammar-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
        signal: currentAbort.signal
      });
      const data = await res.json();
      return (data?.corrected_text || '').trim();
    }

    return new Promise((resolve) => {
      const next = () => {
        if (i >= queue.length && inFlight === 0) {
          // Final rebuild with diff to preserve original markers/structure
          try {
            notify('Combining chunks & formatting…', 'info', { duration: 1200, position: 'tr' });
            announce('Combining chunks and formatting.');
            const fullCorrected = corrected.join('\n\n');
            if (typeof diff_match_patch === 'function') {
              const dmp = new diff_match_patch();
              const tmp = dmp.diff_linesToChars_(plainText, fullCorrected);
              let diffs = dmp.diff_main(tmp.chars1, tmp.chars2, false);
              dmp.diff_charsToLines_(diffs, tmp.lineArray);
              dmp.diff_cleanupSemantic(diffs);
              let rebuilt = rebuildTokens(tokens, diffs);
              rebuilt = formatCleanText(rebuilt, { preserveMarkdown: true });
              outputText.value = rebuilt;
            } else {
              outputText.value = formatCleanText(fullCorrected, { preserveMarkdown: true });
            }
            const finalMsg = failed ? `Completed with ${failed} chunk issue(s).` : 'Grammar check completed!';
            notify(finalMsg, failed ? 'warning' : 'success', { aria: 'assertive' });
            announce(finalMsg);
          } catch (e) {
            console.error(e);
            notify('Failed to finalize formatting. Showing plain output.', 'warning', { aria: 'assertive' });
            outputText.value = corrected.join('\n\n');
          } finally {
            toggleBtn && (toggleBtn.disabled = false);
            setBusy(false, '');
            resolve();
          }
          return;
        }

        while (inFlight < CONCURRENCY && i < queue.length) {
          const job = queue[i++];
          inFlight++;
          const chunkNo = job.index + 1;

          runOne(job).then(text => {
            corrected[job.index] = text || '';
            completed++;
            const pct = Math.round((completed / total) * 100);
            setBusy(true, `${pct}%`);
            qtoast(`Checked part ${chunkNo} of ${total}…`, 'info', { duration: 1200, position: 'tr' });
            rafRender();
          }).catch(err => {
            if (currentAbort.signal.aborted) return; // cancelled
            console.error('Chunk failed:', err);
            failed++;
            corrected[job.index] = job.text; // fallback to original chunk
            qtoast('A chunk failed. Kept original for that part.', 'warning', { duration: 1400, position: 'tr' });
            rafRender();
          }).finally(() => {
            inFlight--;
            next();
          });
        }
      };
      next();
    });
  });

  /* ===============================
   * 14) HIGHLIGHT TOGGLE SAFE STATE
   * =============================== */
  // (handled above by disabling during run)

  /* ===============================
   * 15) HTML ESCAPE (utility export)
   * =============================== */
  function escapeHtml(str) { return esc(str); }

  // Expose minimal helpers if needed elsewhere
  window.__sniptext = Object.assign(window.__sniptext || {}, {
    escapeHtml,
    openGoals: () => goalsBtn?.click()
  });
});
