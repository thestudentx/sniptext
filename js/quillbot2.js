// js/quillbot2.js
document.addEventListener('DOMContentLoaded', () => {
  // 🔒 AUTH CHECK
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/login.html'; return; }

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const expMs = decodedPayload.exp ? decodedPayload.exp * 1000 : new Date(decodedPayload.accessDuration).getTime();
    if (!expMs || Date.now() > expMs) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }
    console.log('✅ Access granted to:', decodedPayload.email || 'user');
  } catch (err) {
    console.error('Invalid token', err);
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    return;
  }

  // === Main Feature Elements ===
  const inputTextarea   = document.getElementById('qb-input');
  const outputTextarea  = document.getElementById('qb-output');
  const submitBtn       = document.getElementById('qb-submit');
  const clearBtn        = document.getElementById('qb-clear');
  const loader          = document.getElementById('qb-loader');
  const errorMsg        = document.getElementById('qb-error');
  const toastContainer  = document.getElementById('toast-container');
  const countDisplay    = document.getElementById('qb-count');
  const pasteBtn        = document.getElementById('qb-paste');
  const copyBtn         = document.getElementById('qb-copy');
  const uploadInput     = document.getElementById('qb-upload');
  const toggleBtn       = document.getElementById('qb-toggle-highlights');
  const highlightContainer = document.getElementById('qb-output-highlight');
  const fileInfo        = document.getElementById('fileInfo');
  const langSelect      = document.getElementById('qb-language-select');
  const progressSpan    = document.getElementById('qb-progress');

  // NEW controls
  const chipsWrap   = document.getElementById('qb-protected-chips');
  const chipEntry   = document.getElementById('qb-protected-entry');
  const strength    = document.getElementById('qb-strength');
  const strengthVal = document.getElementById('qb-strength-value');
  const qualitySel  = document.getElementById('qb-quality');

  // === Model label (Zero-data badge area) ===
  const MODEL_STORAGE_KEY = 'qb-last-model';
  const DEFAULT_MODEL_LABEL = 'Cohere command-a-03-2025';
  const modelEl = document.getElementById('qb-model-label');
  if (modelEl) {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL_LABEL;
    modelEl.textContent = saved;
  }

  // Backend URL
  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';

  // === Toast wrapper (uses ULTRA TOAST if present; otherwise minimal fallback) ===
  const ultraToast = window.showToast; // keep reference; do NOT overwrite global
  function showToast(msg, type = 'info', opts = {}) {
    try {
      if (typeof ultraToast === 'function') {
        if (typeof msg === 'object') { ultraToast(msg); return; }
        ultraToast({
          title: opts.title || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Info'),
          message: msg,
          type,
          duration: opts.duration ?? (type === 'error' ? 5200 : 3400),
          position: opts.position,   // 'tr','br','tl','bl','center'
          actions: opts.actions,
          aria: opts.aria
        });
        return;
      }
    } catch (_) { /* fall through */ }

    // Fallback if ULTRA TOAST missing
    if (!toastContainer) { console.log(`[${type}] ${msg}`); return; }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = typeof msg === 'string' ? msg : (msg?.message || 'Notice');
    toastContainer.appendChild(el);
    toastContainer.classList.remove('hidden');
    setTimeout(() => {
      el.remove();
      if (!toastContainer.children.length) toastContainer.classList.add('hidden');
    }, 3000);
  }

  // Language detection (franc-min shim)
  const isoMap = {
    eng: 'en', spa: 'es', fra: 'fr', deu: 'de', cmn: 'zh',
    arb: 'ar', pes: 'fa', urd: 'ur', heb: 'he', hin: 'hi',
    ita: 'it', jpn: 'ja', kor: 'ko', nld: 'nl', pol: 'pl',
    por: 'pt', rus: 'ru', tur: 'tr', ukr: 'uk', vie: 'vi',
    ben: 'bn', ind: 'id'
  };
  function detectLanguage(text) {
    try {
      const code3 = (window.__franc && window.__franc.min(text)) || 'eng';
      return isoMap[code3] || 'en';
    } catch {
      return 'en';
    }
  }

  // RTL support
  const rtlLangs = ['ar', 'he', 'fa', 'ur', 'ps'];
  function applyTextDirection(lang) {
    const isRTL = rtlLangs.includes(lang);
    [inputTextarea, outputTextarea].forEach(el => {
      el.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      el.style.textAlign = isRTL ? 'right' : 'left';
    });
  }

  langSelect.addEventListener('change', () => {
    const val = langSelect.value;
    const label = val === 'auto'
      ? 'Will auto-detect input language'
      : `Will use ${langSelect.options[langSelect.selectedIndex].text}`;
    showToast(label, 'info');
    applyTextDirection(val);
  });

  // Safer HTML escaping for diff view
  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Compute diff HTML (XSS-safe)
  function generateDiffHTML(original, rewritten) {
    const DMP = window.diff_match_patch || (typeof diff_match_patch !== 'undefined' ? diff_match_patch : null);
    if (!DMP) return escapeHTML(rewritten); // fallback: no diff if lib isn't ready
    const dmp = new DMP();
    const o = escapeHTML(original);
    const r = escapeHTML(rewritten);
    let diffs = dmp.diff_main(o, r);
    dmp.diff_cleanupSemantic(diffs);
    const DI = (typeof window.DIFF_INSERT !== 'undefined')
      ? window.DIFF_INSERT
      : (typeof DIFF_INSERT !== 'undefined' ? DIFF_INSERT : 1);
    const DD = (typeof window.DIFF_DELETE !== 'undefined')
      ? window.DIFF_DELETE
      : (typeof DIFF_DELETE !== 'undefined' ? DIFF_DELETE : -1);
    return diffs.map(([op, text]) => {
      switch (op) {
        case DI: return `<span class="diff-added">${text}</span>`;
        case DD: return `<span class="diff-deleted">${text}</span>`;
        default: return `<span class="diff-equal">${text}</span>`;
      }
    }).join('');
  }

  // Toggle highlights on/off
  let showingHighlights = false;
  toggleBtn.addEventListener('click', () => {
    if (!outputTextarea.value.trim()) {
      showToast('Nothing to highlight yet!', 'error');
      return;
    }
    showingHighlights = !showingHighlights;
    if (showingHighlights) {
      const diffHTML = generateDiffHTML(inputTextarea.value, outputTextarea.value);
      highlightContainer.innerHTML = diffHTML;
      highlightContainer.classList.remove('hidden');
      outputTextarea.classList.add('hidden');
      toggleBtn.textContent = 'Show Clean';
    } else {
      highlightContainer.classList.add('hidden');
      outputTextarea.classList.remove('hidden');
      toggleBtn.textContent = 'Show Highlights';
    }
  });

  // Clean model text (remove meta, preserve structure)
  function formatCleanText(text) {
    return text
      .split('\n')
      .filter(line => !/^\s*(STAGE\s*\d+:|Final Polished Text:|Explanation of Changes:|.*Style Pass.*)$/i.test(line))
      .map(line => {
        if (/^\s*>/.test(line)) return line.trim(); // Keep blockquotes
        line = line.replace(/^#{1,6}\s*/, '').replace(/#/g, ''); // Strip headings
        line = line
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1'); // Unwrap bold/italic
        const t = line.trim();
        const n = t.match(/^(\d+)\.\s+(.*)/);               // Numbered list
        if (n) return '  ' + n[1] + '. ' + n[2].trim();
        const b = t.match(/^([*+\-])\s+(.*)/);              // Bullet list
        if (b) return '  ' + b[1] + ' ' + b[2].trim();
        if (/^[-–]\s+/.test(t)) return t;                   // Preserve em-dash starts
        return t;
      })
      .join('\n')
      .trim();
  }

  // === Tabs: allow selecting Mode + Style + Tone together ===
  let selectedMode  = 'standard';
  let selectedStyle = 'default';
  let selectedTone  = 'default';

  function activateExclusive(groupSelector, clicked) {
    document.querySelectorAll(groupSelector).forEach(t => t.classList.remove('active'));
    clicked.classList.add('active');
  }

  document.querySelectorAll('.qb-tab-mode').forEach(tab => {
    tab.addEventListener('click', () => {
      activateExclusive('.qb-tab-mode', tab);
      selectedMode = tab.getAttribute('data-mode');
    });
  });
  document.querySelectorAll('.qb-tab-style').forEach(tab => {
    tab.addEventListener('click', () => {
      activateExclusive('.qb-tab-style', tab);
      selectedStyle = tab.getAttribute('data-style');
    });
  });
  document.querySelectorAll('.qb-tab-tone').forEach(tab => {
    tab.addEventListener('click', () => {
      activateExclusive('.qb-tab-tone', tab);
      selectedTone = tab.getAttribute('data-tone');
    });
  });

  // === Counters ===
  function estimateTokens(text) {
    const words = (text.trim().match(/\S+/g) || []).length;
    const chars = text.length;
    return Math.max(Math.ceil(words * 1.3), Math.ceil(chars / 4));
  }
  function updateCount() {
    const text = inputTextarea.value || '';
    const words = (text.trim().match(/\S+/g) || []).length;
    const approxTokens = estimateTokens(text);
    countDisplay.textContent = `Words: ${words} | Approx. Tokens: ${approxTokens}`;
  }

  const MAX_WORDS = 5000;

  inputTextarea.addEventListener('input', () => {
    const wordsArray = (inputTextarea.value.trim().match(/\S+/g) || []);
    if (wordsArray.length > MAX_WORDS) {
      inputTextarea.value = wordsArray.slice(0, MAX_WORDS).join(' ') + ' ';
      showToast('🚫 Max 5000 words allowed!', 'error');
    }
    updateCount();
  });

  inputTextarea.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
    const currentWords = (inputTextarea.value.trim().match(/\S+/g) || []);
    const pasteWords = (paste.trim().match(/\S+/g) || []);
    const total = currentWords.length + pasteWords.length;
    if (total > MAX_WORDS) {
      const allowed = MAX_WORDS - currentWords.length;
      if (allowed > 0) {
        inputTextarea.value = (inputTextarea.value + ' ' + pasteWords.slice(0, allowed).join(' ')).trim() + ' ';
        showToast('🚫 Max 5000 words allowed! Paste trimmed.', 'error');
      } else {
        showToast('🚫 Max 5000 words reached! Paste blocked.', 'error');
      }
    } else {
      inputTextarea.value += paste;
    }
    updateCount();
    inputTextarea.dispatchEvent(new Event('input'));
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    inputTextarea.value = '';
    outputTextarea.value = '';
    highlightContainer.classList.add('hidden');
    outputTextarea.classList.remove('hidden');
    toggleBtn.textContent = 'Show Highlights';
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
    updateCount();
    showToast('Cleared text fields.', 'info');
  });

  // === File Upload (.txt/.docx -> raw text) ===
uploadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const name = file.name;
  const lower = name.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf('.'));
  let text = '';

  try {
    switch (ext) {
      case '.txt':
        text = await file.text();
        break;

      case '.docx':
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await window.mammoth.extractRawText({ arrayBuffer });
        text = value || '';
        break;

      case '.pdf':
        const pdfArrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        break;

      case '.csv':
        text = await file.text();
        // Optional: add a CSV-to-plain-text parser (strip commas, etc.)
        break;

      case '.md':
        text = await file.text();
        break;

      default:
        showToast('Unsupported file type. Try .txt, .docx, .pdf, .csv, .md', 'error');
        return;
    }

    inputTextarea.value = text.trim();
    inputTextarea.dispatchEvent(new Event('input'));
    showToast('File uploaded successfully!', 'success');
    if (fileInfo) {
      fileInfo.textContent = `Loaded: ${name}`;
      fileInfo.classList.remove('hidden');
    }
  } catch (err) {
    console.error('File read error:', err);
    showToast('File read failed. Try another one.', 'error');
  } finally {
    uploadInput.value = '';
  }
});


  // === Chunking (sentence-aware with fallback) ===
  function splitIntoSentences(text) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: 'sentence' });
      return Array.from(seg.segment(text)).map(s => s.segment.trim()).filter(Boolean);
    } catch {
      return text.split(/(?<=[.?!۔۔!؟]|।)\s+/).map(s => s.trim()).filter(Boolean);
    }
  }
  function chunkByBudget(text, maxChars = 1200) {
    const sents = splitIntoSentences(text);
    a: if (!sents.length) break a;
    const chunks = [];
    let buf = '';
    for (const s of sents) {
      if ((buf + ' ' + s).trim().length > maxChars) {
        if (buf) chunks.push(buf.trim());
        buf = s;
      } else {
        buf = buf ? `${buf} ${s}` : s;
      }
    }
    if (buf) chunks.push(buf.trim());
    return chunks.length ? chunks : [text.trim()];
  }

  // Protected words chips
  const protectedWords = [];
  function addChip(term){
    const t=(term||'').trim().replace(/^"|"$/g,'');
    if(!t) return;
    if(protectedWords.length>=50) return showToast('Max 50 protected terms.','error');
    if(protectedWords.some(x=>x.toLowerCase()===t.toLowerCase())) return;
    protectedWords.push(t);
    const chip=document.createElement('span');
    chip.className='qb-chip';
    chip.innerHTML=`<span>${t}</span><span class="qb-chip-remove" title="Remove">&times;</span>`;
    chip.querySelector('.qb-chip-remove').addEventListener('click',()=>{
      const idx=protectedWords.findIndex(x=>x.toLowerCase()===t.toLowerCase());
      if(idx>-1) protectedWords.splice(idx,1);
      chip.remove();
    });
    chipsWrap.appendChild(chip);
  }
  chipEntry?.addEventListener('keydown',(e)=>{
    if(e.key==='Enter' || e.key===','){
      e.preventDefault();
      const raw = chipEntry.value;
      chipEntry.value='';
      raw.split(',').forEach(x=>addChip(x));
    }
    if(e.key==='Backspace' && chipEntry.value.trim()==='' && protectedWords.length){
      const last = chipsWrap.lastElementChild;
      if(last){ last.querySelector('.qb-chip-remove')?.click(); }
    }
  });
  chipEntry?.addEventListener('blur',()=>{
    const raw = chipEntry.value.trim();
    if(raw){ chipEntry.value=''; raw.split(',').forEach(x=>addChip(x)); }
  });

  // Rewrite Strength slider
  strength?.addEventListener('input',()=>{
    strengthVal.textContent = String(strength.value);
    strength.style.setProperty('--percent', strength.value + '%');
  });
  if (strength && strengthVal){
    strengthVal.textContent = String(strength.value || 50);
    strength.style.setProperty('--percent', (strength.value || 50) + '%'); // init
  }

  // Quality mapping → candidates & rerank
  function qualityToParams(val){
    if(val==='best') return { candidates: 3, useRerank: true };
    if(val==='balanced') return { candidates: 2, useRerank: true };
    return { candidates: 1, useRerank: false }; // fast
  }

  // === Networking: retry/backoff + abort + progress ===
  let currentAbort = null;

  function setBusy(busy, progressText = '') {
    [submitBtn, clearBtn].forEach(b => b.disabled = busy);
    loader.classList.toggle('hidden', !busy);
    if (progressSpan) progressSpan.textContent = busy ? ` ${progressText}` : '';
  }

  async function fetchWithRetry(url, options, retries = 2) {
    let attempt = 0, delay = 600;
    while (true) {
      try {
        const res = await fetch(url, options);
        if (res.status === 401) {
          showToast('Session expired. Redirecting to login…', 'error', { position: 'tr' });
          localStorage.removeItem('token');
          window.location.href = '/login.html';
          return Promise.reject(new Error('Unauthorized'));
        }
        if (!res.ok) {
          if ((res.status === 429 || res.status >= 500) && attempt < retries) {
            attempt++;
            await new Promise(r => setTimeout(r, delay + Math.random() * 300));
            delay *= 1.6;
            continue;
          }
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res;
      } catch (e) {
        if (options.signal && options.signal.aborted) throw e;
        if (attempt < retries) {
          attempt++;
          await new Promise(r => setTimeout(r, delay + Math.random() * 300));
          delay *= 1.6;
          continue;
        }
        throw e;
      }
    }
  }

  async function paraphraseChunk(body, signal) {
    const res = await fetchWithRetry(`${BACKEND_URL}/api/cohere/paraphrase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal
    });
    const data = await res.json();
    const { paraphrased = '', model } = data || {};
    // Update model badge if backend tells us
    if (model && modelEl) {
      modelEl.textContent = model;
      try { localStorage.setItem(MODEL_STORAGE_KEY, model); } catch(_) {}
    }
    return formatCleanText(paraphrased);
  }

async function runParaphrase() {
  const userText = inputTextarea.value.trim();
  if (!userText) {
    errorMsg.textContent = 'Please enter some text to paraphrase.';
    errorMsg.classList.remove('hidden');
    showToast('You need to type something first.', 'error', { position: 'tr' });
    return null;
  }

  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  const languageToSend = langSelect.value === 'auto' ? detectLanguage(userText) : langSelect.value;
  applyTextDirection(languageToSend);

  // Split work into manageable pieces
  const chunks = chunkByBudget(userText, 1200);
  const total = chunks.length;

  const { candidates, useRerank } = qualityToParams(qualitySel?.value || 'fast');

  const bodies = chunks.map(c => ({
    text: c,
    language: languageToSend,
    mode:  selectedMode,
    style: selectedStyle,
    tone:  selectedTone,
    protectedWords,
    rewriteStrength: strength ? Number(strength.value) : 50,
    candidates,
    useRerank
  }));

  // Results array prefilled with placeholders to preserve order/height
  const PLACEHOLDER = '⏳ Paraphrasing...';
  const results = Array(total).fill(PLACEHOLDER);

  // Throttled renderer so we don’t spam the DOM on every resolve
  let renderQueued = false;
  const renderNow = () => {
    outputTextarea.value = results.join('\n\n');
    renderQueued = false;
  };
  const scheduleRender = () => {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(renderNow);
  };

  // Prepare UI
  highlightContainer.classList.add('hidden');
  outputTextarea.classList.remove('hidden');
  outputTextarea.value = results.join('\n\n'); // show placeholders immediately
  errorMsg.classList.add('hidden');
  setBusy(true, `0%`);

  const queue = bodies.map((body, index) => ({ body, index }));
  const CONCURRENCY = Math.min(3, total);
  let inFlight = 0, i = 0, completed = 0;

  return new Promise((resolve) => {
    const next = () => {
      // All done?
      if (i >= queue.length && inFlight === 0) {
        setBusy(false);
        // Final paint (in case last update was throttled)
        outputTextarea.value = results.join('\n\n');
        resolve(outputTextarea.value);
        return;
      }

      // Start more work while we have capacity
      while (inFlight < CONCURRENCY && i < queue.length) {
        const { body, index } = queue[i++];
        inFlight++;

        showToast(`Paraphrasing part ${index + 1} of ${total}…`, 'info', { duration: 1800, position: 'tr' });

        paraphraseChunk(body, currentAbort.signal)
          .then(text => {
            // Insert chunk in its correct place
            results[index] = text || '';
            completed++;
            const pct = Math.round((completed / total) * 100);
            setBusy(true, `${pct}%`);
            scheduleRender();
          })
          .catch(err => {
            if (currentAbort.signal.aborted) return;
            console.error('Paraphrase error:', err);
            results[index] = body.text || ''; // graceful fallback: keep original text
            errorMsg.textContent = 'Sorry, something went wrong. Please try again later.';
            errorMsg.classList.remove('hidden');
            showToast('Failed to paraphrase a chunk. Using original text for that part.', 'warning', { position: 'tr' });
            scheduleRender();
          })
          .finally(() => {
            inFlight--;
            next();
          });
      }
    };

    next();
  });
}


  // Submit handler
  submitBtn.addEventListener('click', async () => {
    try {
      outputTextarea.value = '';
      highlightContainer.classList.add('hidden');
      outputTextarea.classList.remove('hidden');
      toggleBtn.textContent = 'Show Highlights';

      const finalText = await runParaphrase();
      if (finalText !== null) {
        outputTextarea.value = finalText;
        showToast('Paraphrase complete!', 'success', { position: 'tr' });
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error(e);
    } finally {
      setBusy(false);
      if (progressSpan) progressSpan.textContent = '';
    }
  });

  // Paste/Copy
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { showToast('Clipboard is empty.', 'error', { position: 'tr' }); return; }
      inputTextarea.value = text;
      updateCount();
      showToast('Pasted text from clipboard!', 'success', { position: 'tr' });
    } catch (err) {
      console.error('Paste failed:', err);
      showToast('Failed to read clipboard. Allow permission?', 'error', { position: 'tr' });
    }
  });

  copyBtn.addEventListener('click', async () => {
    const outputText = outputTextarea.value.trim();
    if (!outputText) { showToast('Nothing to copy yet!', 'error', { position: 'tr' }); return; }
    try {
      await navigator.clipboard.writeText(outputText);
      showToast('Copied paraphrased text!', 'success', { position: 'tr' });
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Failed to copy text.', 'error', { position: 'tr' });
    }
  });

  // ======= EXPORT HELPERS (TXT, DOCX, PDF) =======
  function getExportText() {
    const out = (outputTextarea?.value || '').trim();
    const inp = (inputTextarea?.value || '').trim();
    if (out) return out;
    if (inp) {
      showToast({ title:'Heads up', message:'No paraphrased text yet - exporting original input.', type:'info' });
      return inp;
    }
    showToast({ title:'Nothing to export', message:'Add some text first.', type:'error' });
    return '';
  }

  function suggestBaseName() {
    const source = (outputTextarea?.value || inputTextarea?.value || 'sniptext_paraphrase').trim();
    const first = source.split(/\s+/).slice(0, 8).join(' ');
    const slug = first
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s+/g, '_')
      .slice(0, 48) || 'sniptext_paraphrase';
    const ts = new Date().toISOString().slice(0,10); // YYYY-MM-DD
    return `${slug}_${ts}`;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  // Export: TXT
  document.getElementById('qb-export-txt')?.addEventListener('click', () => {
    const text = getExportText(); if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${suggestBaseName()}.txt`);
    showToast({ title:'Exported', message:'Saved .txt file', type:'success' });
  });

  // Export: DOCX (docx UMD)
  document.getElementById('qb-export-docx')?.addEventListener('click', async () => {
    const text = getExportText(); if (!text) return;

    if (!window.docx) {
      showToast({ title:'DOCX unavailable', message:'The DOCX module did not load. Try again in a moment.', type:'error' });
      return;
    }
    try {
      const { Document, Packer, Paragraph } = window.docx;
      const paras = text.split(/\n{2,}/).map(block => new Paragraph({ text: block }));
      const doc = new Document({
        sections: [{ properties: {}, children: paras.length ? paras : [new Paragraph(text)] }]
      });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${suggestBaseName()}.docx`);
      showToast({ title:'Exported', message:'Saved .docx file', type:'success' });
    } catch (err) {
      console.error('DOCX export error:', err);
      showToast({ title:'DOCX failed', message:'Couldn’t create the .docx file.', type:'error' });
    }
  });

  // Export: PDF (jsPDF UMD)
  document.getElementById('qb-export-pdf')?.addEventListener('click', () => {
    const text = getExportText(); if (!text) return;

    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) {
      showToast({ title:'PDF unavailable', message:'The PDF module did not load. Try again in a moment.', type:'error' });
      return;
    }
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 56;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW  = pageW - margin * 2;

      doc.setFont('times', 'normal'); // built-in safe font
      doc.setFontSize(12);

      const lines = doc.splitTextToSize(text, maxW);
      let y = margin;

      lines.forEach(line => {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 16; // line height
      });

      doc.save(`${suggestBaseName()}.pdf`);
      showToast({ title:'Exported', message:'Saved .pdf file', type:'success' });
    } catch (err) {
      console.error('PDF export error:', err);
      showToast({ title:'PDF failed', message:'Couldn’t create the .pdf file.', type:'error' });
    }
  });

  // Reveal Animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.fade-in-box').forEach((box) => observer.observe(box));

  // Init counts
  updateCount();
});
