const express = require('express');
const router = express.Router();
const axios = require('axios');

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

if (!RECAPTCHA_SECRET) {
  console.error("⚠️ Missing RECAPTCHA_SECRET in environment variables.");
}

// Verify reCAPTCHA token
router.post('/verify-recaptcha', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, msg: 'Missing token' });
  }

  try {
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify`;

    const response = await axios.post(verifyURL, null, {
      params: {
        secret: RECAPTCHA_SECRET,
        response: token
      }
    });

    const data = response.data;

    if (!data.success || data.score < 0.5) {
      return res.status(403).json({ success: false, msg: 'Failed CAPTCHA verification' });
    }

    res.status(200).json({ success: true, score: data.score });
  } catch (error) {
    console.error('🚨 CAPTCHA verification error:', error.message || error);
    res.status(500).json({ success: false, msg: 'CAPTCHA verification failed', error: error.message });
  }
});

module.exports = router;
