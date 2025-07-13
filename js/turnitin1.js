const BACKEND_URL =
  ['localhost','127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:3000'
    : 'https://sniptext.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const inputText    = document.getElementById('inputText');
  const fileUpload   = document.getElementById('fileUpload');
  const fileInfo     = document.getElementById('fileInfo');
  const wordCount    = document.getElementById('wordCount');
  const tokenCount   = document.getElementById('tokenCount');
  const aiBtn        = document.getElementById('checkAIBtn');
  const loading      = document.getElementById('loadingIndicator');
  const errorMsg     = document.getElementById('errorMsg');
  const reportBtn    = document.getElementById('generateReportBtn');

  const metricsPanel = document.getElementById('resultMetrics');

  // Helpers
  const updateCounts = () => {
    const text = inputText.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const tokens = Math.ceil(words * 1.3);
    wordCount.textContent = `Words: ${words}`;
    tokenCount.textContent = `Tokens: ${tokens}`;
  };
  const showLoading = () => loading.classList.remove('hidden');
  const hideLoading = () => loading.classList.add('hidden');
  const showError = msg => {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  };
  const hideError = () => errorMsg.classList.add('hidden');

  // INITIAL STATE: hide loader, error & metrics
  hideLoading();
  hideError();
  metricsPanel && metricsPanel.classList.add('hidden');

  // Clear any error/loading when user interacts
  inputText.addEventListener('input', () => {
    hideError();
    hideLoading();
    updateCounts();
  });
// File upload handling
fileUpload.addEventListener('change', async e => {
  console.log('File selected:', e.target.files[0]);
  const file = e.target.files[0];
  if (!file) return;
  fileInfo.textContent = file.name;

  if (file.name.endsWith('.docx')) {
    // mammoth must be loaded
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    inputText.value = tmp.innerText.trim();
  } else {
    inputText.value = await file.text();
  }

  updateCounts();
});


  // File upload handling
  fileUpload.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    fileInfo.textContent = file.name;
    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      inputText.value = tmp.innerText.trim();
    } else {
      inputText.value = await file.text();
    }
    updateCounts();
  });

  // AI Detection
  aiBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) return showError('Please enter or upload some text first.');

    hideError();
    hideLoading();      // just in case
    metricsPanel && metricsPanel.classList.add('hidden');
    reportBtn.classList.add('hidden');
    showLoading();
    aiBtn.querySelector('.qb-btn-label').textContent = 'Checking…';
    aiBtn.querySelector('.qb-btn-spinner').classList.remove('hidden');

    try {
      const res = await fetch(`${BACKEND_URL}/api/turnitin1/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ai', text })
      });
      const data = await res.json();

      // Restore button state
      hideLoading();
      aiBtn.querySelector('.qb-btn-label').textContent = 'Check AI Content';
      aiBtn.querySelector('.qb-btn-spinner').classList.add('hidden');

      if (data.error) return showError(data.error);

      // Parse & show metrics
      const aiScore = Math.round(data.aiScore);
      const humanScore = 100 - aiScore;

      document.getElementById('aiScoreValue').textContent    = aiScore + '%';
      document.getElementById('humanScoreValue').textContent = humanScore + '%';
      document.getElementById('aiScoreBar').style.width    = aiScore + '%';
      document.getElementById('humanScoreBar').style.width = humanScore + '%';

      metricsPanel.classList.remove('hidden');
      reportBtn.classList.remove('hidden');
      reportBtn.disabled = false;

    } catch (err) {
      hideLoading();
      aiBtn.querySelector('.qb-btn-label').textContent = 'Check AI Content';
      aiBtn.querySelector('.qb-btn-spinner').classList.add('hidden');
      showError('Something went wrong. Try again.');
    }
  });
});
