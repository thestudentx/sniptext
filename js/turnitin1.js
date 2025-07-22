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

  fileUpload.addEventListener('change', async (e) => {
    resetUI();
    const file = e.target.files[0];
    if (!file) {
      fileInfo.textContent = 'No file chosen';
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
    } catch (err) {
        showError('Could not read the file.');
        console.error('File read error:', err);
    }
    updateCounts();
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
      return showError('Please enter or upload some text first.');
    }

    resetUI();
    showLoading();
    aiBtn.disabled = true;
    aiBtn.textContent = 'Checking...';

    try {
      const data = await callAPI('/api/turnitin1/detect', { text: rawText });

      // Store the result for the report generator
      latestDetectionResult = {
        aiPercent: data.aiPercent,
        verdict: data.verdict,
        originalText: rawText.substring(0, 3000) // Store a snippet for the report
      };

      // Populate UI with results
      document.getElementById('aiScoreValue').textContent = `${data.aiPercent}%`;
      document.getElementById('aiScoreBar').style.width = `${data.aiPercent}%`;
      const humanPercent = 100 - data.aiPercent;
      document.getElementById('humanScoreValue').textContent = `${humanPercent}%`;
      document.getElementById('humanScoreBar').style.width = `${humanPercent}%`;
      document.getElementById('verdictText').textContent = data.verdict;

      metricsPanel.classList.remove('hidden');
      reportBtn.classList.remove('hidden');
      reportBtn.disabled = false;

    } catch (err) {
      showError(err.message);
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

    const doc = new jsPDF();
    
    // --- PDF Content ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AI Content Detection Report', 105, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    // Summary Box
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(14, 45, 182, 38, 3, 3, 'S');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detection Summary', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`AI Generated Score:`, 20, 65);
    doc.text(`Overall Verdict:`, 20, 75);

    doc.setFont('helvetica', 'bold');
    doc.text(`${latestDetectionResult.aiPercent}%`, 70, 65);
    doc.text(latestDetectionResult.verdict, 70, 75);

    // Analyzed Text Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Analyzed Text (Snippet)', 14, 95);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50);
    const textLines = doc.splitTextToSize(latestDetectionResult.originalText, 180);
    doc.text(textLines, 14, 105);

    // Save the PDF
    doc.save('AI-Detection-Report.pdf');
  });
});
