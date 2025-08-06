document.addEventListener('DOMContentLoaded', () => {
  // Global reference to the jsPDF library
  const { jsPDF } = window.jspdf;

  // --- Element References ---
  const inputText = document.getElementById('inputText');
  const fileUpload = document.getElementById('fileUpload');
  const fileInfo = document.getElementById('fileInfo');
  const wordCount = document.getElementById('wordCount');
  const tokenCount = document.getElementById('tokenCount');
  const aiBtn = document.getElementById('checkAIBtn');
  const loading = document.getElementById('loadingIndicator');
  const errorMsg = document.getElementById('errorMsg');
  const metricsPanel = document.getElementById('resultMetrics');
  const reportBtn = document.getElementById('generateReportBtn');
  const toastContainer = document.getElementById('toast-container');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Paste from clipboard into textarea
pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      showToast('Clipboard is empty.', 'warning');
      return;
    }
    inputText.value = text;
    resetUI();
    updateCounts();
    showToast('Pasted from clipboard!', 'success');
  } catch (err) {
    console.error('Clipboard error:', err);
    showToast('Failed to access clipboard.', 'error');
  }
});

// Clear textarea content
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  fileUpload.value = '';
  fileInfo.textContent = 'No file chosen';
  resetUI();
  updateCounts();
  showToast('Input cleared.', 'success');
});



  // --- State Variable ---
  // This variable will hold the latest detection result for report generation
  let latestDetectionResult = null;

  // --- Helper Functions ---
  const BACKEND_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://sniptext.onrender.com';

  const normalizeInput = (text) => text.replace(/\s+/g, ' ').replace(/\r\n|\r/g, '\n').trim();
  const updateCounts = () => {
    const text = inputText.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${words} words`;
    tokenCount.textContent = `${Math.ceil(words * 1.3)} tokens`;
  };
  const showLoading = () => loading.classList.remove('hidden');
  const hideLoading = () => loading.classList.add('hidden');
  const showError = (msg) => {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  };
  const hideError = () => errorMsg.classList.add('hidden');
  
  const resetUI = () => {
      hideError();
      metricsPanel.classList.add('hidden');
      reportBtn.classList.add('hidden');
      reportBtn.disabled = true;
      latestDetectionResult = null; // Clear previous results
  };

  // --- Initial UI State ---
  resetUI();
  updateCounts();

  // --- Event Listeners ---
  inputText.addEventListener('input', () => {
    resetUI();
    updateCounts();
  });

  // File upload handling
fileUpload.addEventListener('change', async (e) => {
  resetUI();
  const file = e.target.files[0];
  if (!file) {
    fileInfo.textContent = 'No file chosen';
    showToast('No file selected.', 'warning'); // ✅ Added
    return;
  }
  fileInfo.textContent = file.name;
  try {
    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({ arrayBuffer });
      inputText.value = text;
    } else {
      inputText.value = await file.text();
    }
    updateCounts();
    showToast('File uploaded successfully!', 'success'); // ✅ Added
  } catch (err) {
    console.error('File read error:', err);
    showToast('Could not read the file.', 'error'); // ✅ Already exists
  }
});


  // --- Core API Logic ---
  async function callAPI(endpoint, payload) {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
    }
    return data;
  }

  // AI Detection Button Click
aiBtn.addEventListener('click', async () => {
  const originalText = aiBtn.textContent;
  const rawText = normalizeInput(inputText.value);
  if (!rawText) {
  showToast('Please enter or upload some text first.', 'error');
  return;
}

  resetUI();
  showLoading();
  aiBtn.disabled = true;
  aiBtn.textContent = 'Checking...';

  try {
    // Call Sapling AI backend
    const data = await callAPI('/api/aidetection/sapling', { text: rawText });

    const score = data?.score ?? 0; // Default 0 if missing
    const aiPercent = +(score * 100).toFixed(2);
    const humanPercent = +(100 - aiPercent).toFixed(2);

    // Determine verdict
    const verdict =
      aiPercent >= 85
        ? 'AI Written'
        : aiPercent >= 50
        ? 'Mixed or Unclear'
        : 'Human Written';

    // Store result for report
    latestDetectionResult = {
      aiPercent,
      verdict,
      originalText: rawText.substring(0, 3000)
    };

    // Populate UI
const aiScoreValue = document.getElementById('aiScoreValue');
const aiScoreBar = document.getElementById('aiScoreBar');
const humanScoreValue = document.getElementById('humanScoreValue');
const humanScoreBar = document.getElementById('humanScoreBar');

// Reset all color classes
[aiScoreValue, aiScoreBar, humanScoreValue, humanScoreBar].forEach(el => {
  el.classList.remove('result-safe', 'result-warning', 'result-danger', 'bg-safe', 'bg-warning', 'bg-danger');
});

// Apply new values
aiScoreValue.textContent = `${aiPercent}%`;
aiScoreBar.style.width = `${aiPercent}%`;
humanScoreValue.textContent = `${humanPercent}%`;
humanScoreBar.style.width = `${humanPercent}%`;

// Apply color based on result
const aiClass = aiPercent >= 85 ? 'danger' : aiPercent >= 50 ? 'warning' : 'safe';
const humanClass = humanPercent >= 85 ? 'safe' : humanPercent >= 50 ? 'warning' : 'danger';

aiScoreValue.classList.add(`result-${aiClass}`);
aiScoreBar.classList.add(`bg-${aiClass}`);

humanScoreValue.classList.add(`result-${humanClass}`);
humanScoreBar.classList.add(`bg-${humanClass}`);


    document.getElementById('verdictText').textContent = `Verdict: ${verdict}`;

    // Show results
    metricsPanel.classList.remove('hidden'); 
    document.querySelector('.result-panel').classList.remove('hidden');
    reportBtn.classList.remove('hidden');
    reportBtn.disabled = false;

    showToast('AI detection complete!', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Detection failed.', 'error');
  } finally {
    hideLoading();
    aiBtn.disabled = false;
    aiBtn.textContent = originalText;
  }
});





  // Report Generation Button Click
reportBtn.addEventListener('click', () => {
  if (!latestDetectionResult) {
    alert('Please run a detection first before generating a report.');
    return;
  }

  // 1. Determine base title and filename
  const defaultBase = 'SnipText_AI_Detection';
  let baseTitle = defaultBase;
  // fileInfo shows the uploaded filename or "No file chosen"
  const uploadedName = fileInfo.textContent;
  if (uploadedName && uploadedName !== 'No file chosen') {
    // strip extension from uploaded filename
    const nameNoExt = uploadedName.replace(/\.[^/.]+$/, '');
    baseTitle = `${defaultBase} - ${nameNoExt}`;
  }

  // 2. Create PDF
  const doc = new jsPDF();

  // --- PDF Content ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  // Use the dynamic baseTitle centered at the top
  doc.text(baseTitle, 105, 20, { align: 'center' });

  // Generated on…
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  // Summary Box
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(14, 36, 182, 38, 3, 3, 'S');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detection Summary', 20, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('AI Generated Score:', 20, 60);
  doc.text('Overall Verdict:', 20, 70);

  doc.setFont('helvetica', 'bold');
  doc.text(`${latestDetectionResult.aiPercent}%`, 70, 60);
  doc.text(latestDetectionResult.verdict, 70, 70);

  // Analyzed Text Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Analyzed Text (Snippet)', 14, 90);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50);
  const textLines = doc.splitTextToSize(latestDetectionResult.originalText, 180);
  doc.text(textLines, 14, 100);

  // 3. Save with dynamic filename
  const filename = `${baseTitle}.pdf`;
  doc.save(filename);
});

});
