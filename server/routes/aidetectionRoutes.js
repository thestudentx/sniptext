
const express = require('express');
const router = express.Router();
const axios = require('axios');

const SAPLING_API_KEY = process.env.SAPLING_API_KEY;


router.post('/sapling', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await axios.post(
      'https://api.sapling.ai/api/v1/aidetect',
      {
        key: SAPLING_API_KEY,
        text,
        sent_scores: false,      // Optional: true if you want sentence-level scores later
        score_string: false      // We just want raw float score (0 to 1)
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const result = response.data;

    if (typeof result.score !== 'number') {
      return res.status(500).json({ error: 'Invalid response from Sapling', raw: result });
    }

    return res.json({
      score: result.score  // float from 0 to 1
    });

  } catch (err) {
    console.error('Sapling API Error:', err?.response?.data || err.message);
    return res.status(500).json({
      error: 'AI detection failed. Please try again later.',
      details: err?.response?.data || err.message
    });
  }
});

module.exports = router;
