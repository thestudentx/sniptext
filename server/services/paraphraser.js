// server/services/paraphraser.js
const axios = require('axios');
const HF_TOKEN = process.env.HF_API_TOKEN; // Set this in Render's ENV vars

/**
 * Paraphrases a single sentence using HuggingFace inference API.
 * @param {string} sentence
 * @param {string} style - One of: "standard", "fluent", "academic", "concise", "creative"
 * @returns {Promise<string>} paraphrased sentence
 */
async function paraphraseSentence(sentence, style = 'standard') {
  const prompt = stylePrompt(sentence, style);

  const response = await axios.post(
    'https://api-inference.huggingface.co/models/tuner007/pegasus_paraphrase',
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60s timeout in case model is slow
    }
  );

  // The HuggingFace response returns an array of { generated_text }
  const output = response.data[0]?.generated_text || '';
  return output;
}

function stylePrompt(text, style) {
  switch (style) {
    case 'fluent':
      return `Paraphrase fluently: ${text}`;
    case 'academic':
      return `Paraphrase in academic tone: ${text}`;
    case 'concise':
      return `Paraphrase concisely: ${text}`;
    case 'creative':
      return `Paraphrase creatively: ${text}`;
    default:
      return `Paraphrase: ${text}`; // standard
  }
}

module.exports = { paraphraseSentence };