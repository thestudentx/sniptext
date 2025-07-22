const express = require('express');
const router = express.Router();

// Using the same reliable URL
const API_URL = 'https://api-inference.huggingface.co/models/roberta-base-openai-detector';
const API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

router.post('/detect', async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required.' });
    }
    if (!API_TOKEN) {
        console.error('HUGGINGFACE_API_TOKEN is not configured on the server.');
        return res.status(500).json({ error: 'AI detection service is not configured.' });
    }

    try {
        // ✅ Making the request using node-fetch instead of axios
        const apiResponse = await fetch(
            API_URL,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: text }),
            }
        );

        const result = await apiResponse.json();

        // Check for Hugging Face API errors (like model loading)
        if (!apiResponse.ok) {
            let errorMessage = result.error || 'The AI detection model is currently unavailable.';
            if (errorMessage.includes("is currently loading")) {
                 errorMessage = "The AI model is waking up. Please try again in 20-30 seconds.";
            }
            throw new Error(errorMessage);
        }
        
        const scores = result[0];
        let aiScore = 0;

        // Find the score for the "Fake" label (AI-generated)
        const fakeLabel = scores.find(s => s.label === 'Fake');
        if (fakeLabel) {
            aiScore = Math.round(fakeLabel.score * 100);
        }

        res.json({
            aiPercent: aiScore,
            verdict: aiScore > 80 ? '⚠️ Likely AI-Generated' : (aiScore > 50 ? '🤔 Possibly AI-Assisted' : '✅ Likely Human-Written'),
        });

    } catch (error) {
        console.error('Hugging Face API Error:', error.message);
        res.status(500).json({ error: error.message || 'An unknown error occurred.' });
    }
});

module.exports = router;
