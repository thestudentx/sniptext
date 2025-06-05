// server/routes/paraphrase.js
const express = require('express');
const router = express.Router();
const { paraphraseSentence } = require('../services/paraphraser');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * POST /api/paraphrase
 * Expects JSON: { sentences: [string], style: string }
 * Returns: { sentenceResults: [ { original, paraphrased } ] }
 */
router.post('/paraphrase', authMiddleware, async (req, res) => {
  try {
    const { sentences, style } = req.body;
    if (!Array.isArray(sentences) || sentences.length === 0) {
      return res.status(400).json({ error: 'Sentences array required' });
    }

    // Limit number of sentences per request (e.g., max 20)
    if (sentences.length > 50) {
      return res.status(400).json({ error: 'Too many sentences (max 50)' });
    }

    const sentenceResults = [];
    for (let s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) {
        sentenceResults.push({ original: s, paraphrased: '' });
      } else {
        const paraphrased = await paraphraseSentence(trimmed, style);
        sentenceResults.push({ original: s, paraphrased });
      }
    }

    return res.json({ sentenceResults });
  } catch (err) {
    console.error('Paraphrase error:', err.message || err);
    return res.status(500).json({ error: 'Paraphrasing failed' });
  }
});

module.exports = router;