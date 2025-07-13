// File: server/routes/turnitin1Routes.js

const express = require('express');
const router = express.Router(); // ✅ THIS LINE WAS MISSING

// POST: /api/turnitin1/check
router.post('/check', async (req, res) => {
  const { text, type } = req.body;

  if (!text || type !== 'ai') {
    return res.status(400).json({ error: 'Invalid request type or missing text.' });
  }

  try {
    // For now: Simulate AI detection
    const fakeScore = Math.random();
    const confidence = (fakeScore * 100).toFixed(2);
    const result = fakeScore > 0.7
      ? `⚠️ Likely AI-generated. Confidence: ${confidence}%`
      : `✅ Likely human-written. Confidence: ${confidence}%`;

    return res.json({ result });
  } catch (err) {
    console.error('AI Check Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; // ✅ Export it to be used in server.js
