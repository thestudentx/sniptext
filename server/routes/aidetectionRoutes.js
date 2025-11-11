// server/routes/aidetectionRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const SAPLING_API_KEY = process.env.SAPLING_API_KEY;

router.post('/sapling', async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Text is required' });
    if (!SAPLING_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing SAPLING_API_KEY' });

    const saplingRes = await axios.post(
      'https://api.sapling.ai/api/v1/aidetect',
      { key: SAPLING_API_KEY, text, sent_scores: false, score_string: false }, // <-- key here
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000, validateStatus: () => true }
    );

    const payload = saplingRes.data;
    if (saplingRes.status < 200 || saplingRes.status >= 300) {
      return res.status(502).json({ error: payload?.error || `Sapling error ${saplingRes.status}: ${saplingRes.statusText}` });
    }

    if (typeof payload?.score !== 'number') {
      return res.status(500).json({ error: 'Invalid response from Sapling', raw: payload });
    }

    res.json({ score: payload.score });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('Sapling API Error:', status, data || err.message);
    res.status(500).json({ error: 'AI detection failed. Please try again later.', details: data || err.message });
  }
});

module.exports = router;
