// /js/turnitin1.js

// ——— ADMIN_CONFIG ———
let ADMIN_CONFIG = {
  token: "",
  endpoints: {
    contentDetection: "",
    imageDetection: ""
  }
};

const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const BACKEND_URL = isLocal
  ? "http://localhost:3000"
  : "https://sniptext.onrender.com";

// ——— Load Winston Config ———
async function loadConfig() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/config/winston`);
    if (!res.ok) throw new Error("Failed to fetch Winston config");
    const data = await res.json();
    ADMIN_CONFIG.token = data.token;
    ADMIN_CONFIG.endpoints = data.endpoints;
    console.log("Loaded ADMIN_CONFIG:", ADMIN_CONFIG);
  } catch (err) {
    console.error("Error loading Winston config:", err);
    showToast("error", "Cannot load API configuration.");
  }
}

// ——— DOM ELEMENTS ———
const elements = {
  toastContainer:   document.getElementById("toast-container"),
  scanForm:         document.getElementById("plagiarismForm"),
  textInputGroup:   document.querySelector('[data-component="textInputGroup"]'),
  textInput:        document.getElementById("textInput"),
  fileInput:        document.getElementById("fileInput"),
  scanBtn:          document.getElementById("scanBtn"),
  resultsSection:   document.getElementById("resultsSection"),
  contentResults:   document.getElementById("contentResults"),
  imageResults:     document.getElementById("imageResults"),
  docResults:       document.getElementById("docResults"),
  humanScore:       document.querySelector('[data-component="humanScore"]'),
  readabilityScore: document.querySelector('[data-component="readabilityScore"]'),
  sentenceBreakdown:document.getElementById("sentenceBreakdown"),
  deepfakeScore:    document.querySelector('[data-component="deepfakeScore"]'),
  extractedText:    document.getElementById("extractedText"),
  tryAgainBtn:      document.getElementById("tryAgainBtn"),
  scanTypeInputs:   document.querySelectorAll('[data-component="scanTypeInput"]'),
};

// ——— UTILS ———
function showToast(type = "info", message = "Notification") {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  let icon;
  switch (type) {
    case "success": icon = "✅"; break;
    case "error":   icon = "❌"; break;
    default:        icon = "ℹ️"; break;
  }
  toast.innerHTML = `<i>${icon}</i><span>${message}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function resetPage() {
  elements.scanForm.reset();
  elements.resultsSection.hidden = true;
  clearResults();
}

function clearResults() {
  elements.contentResults.hidden = true;
  elements.imageResults.hidden = true;
  elements.docResults.hidden = true;
  elements.humanScore.innerText = "--";
  elements.readabilityScore.innerText = "--";
  elements.sentenceBreakdown.innerHTML = "";
  elements.deepfakeScore.innerText = "--";
  elements.extractedText.innerText = "";
}

function getSelectedScanType() {
  for (const input of elements.scanTypeInputs) {
    if (input.checked) return input.value;
  }
  return "content";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ——— Cloudinary Upload ———
// Replace <your_cloud_name> with your Cloudinary cloud name.
// Make sure "winston_unsigned" matches your unsigned upload preset name.
async function uploadToCloud(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "winston_unsigned");

  const cloudName = "<your_cloud_name>";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      body: formData
    });
    if (!resp.ok) {
      throw new Error(`Cloudinary upload failed: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    return data.secure_url;
  } catch (err) {
    console.error("uploadToCloud error:", err);
    throw err;
  }
}

// ——— API CALLS to Winston ———
async function callContentDetection({ text = "", fileBase64 = "" }) {
  // We no longer need to check ADMIN_CONFIG.endpoints.contentDetection here,
  // because we're calling our own proxy.
  const body = {
    text:      text || "",
    file:      fileBase64 || "",
    // website:   "checkai.pro",
    version:   "v2",
    sentences: true,
    language:  "en"
  };

  // Call your proxy endpoint instead of Winston directly
  const response = await fetch(`${BACKEND_URL}/api/winston/content-detect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

async function callImageDetection(imageUrl) {
  const body = {
    url:     imageUrl,
    version: "v2"
  };

  // Call your proxy endpoint instead of Winston directly
  const response = await fetch(`${BACKEND_URL}/api/winston/image-detect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

// ——— DISPLAY RESULTS ———
function displayContentResults(data) {
  elements.contentResults.hidden = false;
  const humanScoreValue = data.human_score ?? data.score ?? 0;
  elements.humanScore.innerText = humanScoreValue;
  const readability = data.readability_score ?? "--";
  elements.readabilityScore.innerText = readability;

  if (Array.isArray(data.sentences)) {
    elements.sentenceBreakdown.innerHTML = "";
    data.sentences.forEach((item, idx) => {
      const div = document.createElement("div");
      div.classList.add("sentence-entry");
      div.innerHTML = `
        <p><strong>Sentence ${idx + 1}:</strong> ${item.text}</p>
        <p><strong>Score:</strong> ${item.score}%</p>
      `;
      elements.sentenceBreakdown.appendChild(div);
    });
  }

  if (data.input && !data.sentences) {
    elements.docResults.hidden = false;
    elements.extractedText.innerText = data.input;
  }
}

function displayImageResults(data) {
  elements.imageResults.hidden = false;
  const deepfakeValue = data.deepfake_score ?? data.score ?? 0;
  elements.deepfakeScore.innerText = deepfakeValue;
}

// ——— EVENT HANDLERS ———
async function onFormSubmit(event) {
  event.preventDefault();
  const scanType = getSelectedScanType();
  const textValue = elements.textInput.value.trim();
  const fileObj = elements.fileInput.files[0];

  if (scanType === "content" && !textValue && !fileObj) {
    showToast("error", "Please provide text or upload a file.");
    return;
  }
  if ((scanType === "image" || scanType === "document") && !fileObj) {
    showToast("error", "Please upload a file for this scan type.");
    return;
  }

  showLoader();                  // Show global loader + “Analyzing…”
  clearResults();
  elements.resultsSection.hidden = true;

  try {
    let resultData;

    // CONTENT DETECTION or DOCUMENT/OCR
    if (scanType === "content" || scanType === "document") {
      let payload = { text: "", fileBase64: "" };

      if (textValue && scanType === "content") {
        payload.text = textValue;
      }
      if (fileObj) {
        payload.fileBase64 = await readFileAsBase64(fileObj);
      }

      resultData = await callContentDetection(payload);
      displayContentResults(resultData);

      const scoreVal = resultData.human_score ?? resultData.score ?? 0;
      if (scoreVal >= 50) {
        showToast("success", "Likely human-written content.");
      } else {
        showToast("info", "Content appears AI-generated.");
      }
    }

    // IMAGE/DEEPFAKE DETECTION
    if (scanType === "image") {
      // 1) Upload to Cloudinary and get a public URL
      const imageUrl = await uploadToCloud(fileObj);
      // 2) Call Winston with that URL
      resultData = await callImageDetection(imageUrl);
      displayImageResults(resultData);

      const dfScore = resultData.deepfake_score ?? resultData.score ?? 0;
      if (dfScore >= 50) {
        showToast("error", "Deepfake detected!");
      } else {
        showToast("success", "Image appears authentic.");
      }
    }

    elements.resultsSection.hidden = false;
  } catch (err) {
    console.error("Scan error:", err);
    showToast("error", "Scan failed. Check console for details.");
  } finally {
    hideLoader();               // Always hide the global loader
  }
}

function onTryAgain() {
  resetPage();
}

function updateFormVisibility() {
  const scanType = getSelectedScanType();
  if (scanType === "content") {
    elements.textInputGroup.hidden = false;
    elements.fileInput.accept = ".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg";
  } else if (scanType === "image") {
    elements.textInputGroup.hidden = true;
    elements.fileInput.accept = ".png,.jpg,.jpeg";
  } else if (scanType === "document") {
    elements.textInputGroup.hidden = true;
    elements.fileInput.accept = ".doc,.docx,.pdf,.png,.jpg,.jpeg";
  }
}

// ——— INITIALIZATION ———
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  updateFormVisibility();
  elements.scanForm.addEventListener("submit", onFormSubmit);
  elements.tryAgainBtn.addEventListener("click", onTryAgain);
  elements.scanTypeInputs.forEach((input) =>
    input.addEventListener("change", updateFormVisibility)
  );
});
