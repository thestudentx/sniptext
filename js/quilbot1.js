let liveMode = false;
let debounceTimer;

// Utility: Debounce function
function debounce(func, delay) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Split full text into sentences (simple regex, keeps punctuation)
function splitIntoSentences(text) {
  // Regex splits at ., !, ?, or newline but keeps the delimiter
  const regex = /([^.!?\n]+[.!?]?)+/g;
  const matches = text.match(regex);
  if (!matches) return [];
  return matches.map(s => s.trim()).filter(s => s.length > 0);
}

// Render sentence blocks in output container
function renderSentences(sentenceResults) {
  const container = document.getElementById('output-container');
  container.innerHTML = '';
  sentenceResults.forEach((sr, idx) => {
    const block = document.createElement('div');
    block.classList.add('sentence-block');
    block.dataset.index = idx;

    // Sentence text paragraph
    const p = document.createElement('p');
    p.classList.add('sentence-text');
    // Insert words and wrap each in span for clickable synonyms
    sr.paraphrased.split(/(\s+)/).forEach(token => {
      if (/\s+/.test(token)) {
        p.appendChild(document.createTextNode(token));
      } else {
        const span = document.createElement('span');
        span.textContent = token;
        span.classList.add('output-word');
        span.addEventListener('click', (e) => showSynonyms(e, idx, token));
        p.appendChild(span);
      }
    });

    // Actions: Paraphrase Sentence & Freeze
    const actions = document.createElement('div');
    actions.classList.add('sentence-actions');

    const paraBtn = document.createElement('button');
    paraBtn.textContent = 'Paraphrase Sentence';
    paraBtn.addEventListener('click', () => paraphraseSingleSentence(idx));

    const freezeBtn = document.createElement('button');
    freezeBtn.textContent = 'Freeze';
    freezeBtn.addEventListener('click', () => freezeSentence(idx));

    actions.appendChild(paraBtn);
    actions.appendChild(freezeBtn);

    block.appendChild(p);
    block.appendChild(actions);
    container.appendChild(block);
  });
}

// Perform full paraphrase call (all sentences)
async function paraphraseAllSentences() {
  const rawText = document.getElementById('input-text').value;
  if (!rawText.trim()) return;

  const sentences = splitIntoSentences(rawText);
  if (sentences.length === 0) return;

  const style = document.getElementById('paraphrase-style').value;
  const token = localStorage.getItem('token') || '';

  // Show loading state
  document.getElementById('output-container').innerHTML = '<p>Loading...</p>';

  const BACKEND_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://sniptext.onrender.com';

  try {
    const res = await fetch(`${BACKEND_URL}/api/paraphrase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.sentenceResults) {
      window.currentResults = data.sentenceResults;
      renderSentences(data.sentenceResults);
    } else {
      document.getElementById('output-container').innerHTML = '<p>Error parsing response.</p>';
    }
  } catch (err) {
    document.getElementById('output-container').innerHTML = '<p>API error.</p>';
    console.error(err);
  }
}

// Live paraphrasing handler (debounced)
const liveParaphrase = debounce(() => {
  if (!liveMode) return;
  paraphraseAllSentences();
}, 800);

// Paraphrase Now button click
document.getElementById('paraphrase-btn').addEventListener('click', paraphraseAllSentences);

// Live Mode toggle
document.getElementById('live-toggle').addEventListener('click', () => {
  liveMode = !liveMode;
  document.getElementById('live-toggle').textContent = liveMode
    ? '🔄 Live Mode: ON' : '🔄 Live Mode: OFF';
  if (liveMode) paraphraseAllSentences();
});

// Listen to typing in input for live paraphrase
document.getElementById('input-text').addEventListener('input', liveParaphrase);

// Swap input and one big paragraph from output (join sentences)
function swapTexts() {
  const inputEl = document.getElementById('input-text');
  const outputEl = document.getElementById('output-container');
  // Join paraphrased sentences into one string
  const paraphrasedText = window.currentResults
    ? window.currentResults.map(sr => sr.paraphrased).join(' ') : '';
  // Swap
  inputEl.value = paraphrasedText;
  outputEl.innerHTML = '';
  window.currentResults = null;
}

document.getElementById('swap-btn').addEventListener('click', swapTexts);

// Copy full paraphrased output to clipboard
function copyOutput() {
  const paraphrasedText = window.currentResults
    ? window.currentResults.map(sr => sr.paraphrased).join(' ') : '';
  if (!paraphrasedText) return;
  navigator.clipboard.writeText(paraphrasedText)
    .then(() => alert('Copied to clipboard!'))
    .catch(err => console.error('Copy failed:', err));
}

document.getElementById('copy-btn').addEventListener('click', copyOutput);

// Paraphrase a single sentence (by index)
async function paraphraseSingleSentence(index) {
  if (!window.currentResults) return;
  const original = window.currentResults[index].original;
  const style = document.getElementById('paraphrase-style').value;
  const token = localStorage.getItem('token') || '';

  try {
    const response = await fetch('https://your-backend-url/api/paraphrase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ sentences: [original], style })
    });
    const data = await response.json();
    if (data.sentenceResults && data.sentenceResults.length > 0) {
      window.currentResults[index].paraphrased = data.sentenceResults[0].paraphrased;
      renderSentences(window.currentResults);
    }
  } catch (err) {
    console.error(err);
  }
}

// Freeze a sentence (do not allow paraphrase next time)
function freezeSentence(index) {
  if (!window.currentResults) return;
  window.currentResults[index].frozen = true;
  // Gray out the block or disable its paraphrase button
  const block = document.querySelector(`.sentence-block[data-index='${index}']`);
  if (block) {
    block.style.opacity = '0.6';
    const btn = block.querySelector('button');
    if (btn) btn.disabled = true;
  }
}

// Show synonyms using Datamuse API on word click
async function showSynonyms(event, sentenceIndex, word) {
  event.stopPropagation();
  const popupId = 'synonym-popup';
  let popup = document.getElementById(popupId);
  if (!popup) {
    popup = document.createElement('div');
    popup.id = popupId;
    document.body.appendChild(popup);
  }

  // Fetch synonyms from Datamuse
  const url = `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=5`;
  const res = await fetch(url);
  const suggestions = await res.json();

  if (!suggestions.length) return;

  // Build list
  popup.innerHTML = '<ul>' + suggestions.map(s => `<li data-word="${s.word}">${s.word}</li>`).join('') + '</ul>';

  // Position popup near mouse
  popup.style.top = event.pageY + 'px';
  popup.style.left = event.pageX + 'px';
  popup.style.display = 'block';

  // Clicking a suggestion replaces the word in that sentence
  popup.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const newWord = li.dataset.word;
      replaceWordInSentence(sentenceIndex, word, newWord);
      popup.style.display = 'none';
    });
  });
}

// Replace a word in the paraphrased sentence stored in window.currentResults
function replaceWordInSentence(sentenceIndex, oldWord, newWord) {
  const sr = window.currentResults[sentenceIndex];
  if (!sr) return;
  const regex = new RegExp(`\\b${oldWord}\\b`, 'g');
  sr.paraphrased = sr.paraphrased.replace(regex, newWord);
  renderSentences(window.currentResults);
}

// Hide synonym popup if clicking elsewhere
window.addEventListener('click', (e) => {
  const popup = document.getElementById('synonym-popup');
  if (popup) popup.style.display = 'none';
});