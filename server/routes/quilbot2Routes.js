// server/routes/quilbot2Routes.js

const express = require('express');
const { CohereClientV2 } = require('cohere-ai');
const router = express.Router();

// 1) (Assumes server.js already did `require('dotenv').config()` and `app.use(express.json());`)

// 2) Initialize CohereClientV2 with your trial key from .env
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY
});

/**
 * POST /api/cohere/paraphrase
 * Expects JSON body: { text: "some string" }
 * Returns: { paraphrased: "..." } on success, or { error, details } on failure.
 */
router.post('/cohere/paraphrase', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input: request.body.text must be a non-empty string.'
      });
    }

    // 3) Build a chat-style prompt for paraphrasing
    const messages = [
      {
        role: 'system',
        content: 'You are an academic writing assistant. Rewrite the user text in a clear, thesis-ready style.',
      },
      {
        role: 'user',
        content: text,
      }
    ];

    // 4) Call Cohere’s Chat API (V2)
    const response = await cohere.chat({
      model: 'command-a-03-2025', // this model requires chat
      messages,
      temperature: 0.7,
    });

    // 5) Extract the paraphrased text from the V2 response
    //    response has shape:
    //    {
    //      id: '…',
    //      message: {
    //        role: 'assistant',
    //        content: [
    //          { type: 'text', text: 'Paraphrased version…' }
    //        ]
    //      },
    //      finishReason: 'COMPLETE',
    //      usage: { … }
    //    }
    const assistantMessage = response.message;
    if (
      !assistantMessage ||
      !Array.isArray(assistantMessage.content) ||
      !assistantMessage.content[0] ||
      typeof assistantMessage.content[0].text !== 'string'
    ) {
      console.error('Cohere returned no paraphrased text:', response);
      return res.status(500).json({
        error: 'Cohere returned an unexpected response format.',
        details: response
      });
    }

    const paraphrasedText = assistantMessage.content[0].text.trim();
    return res.json({ paraphrased: paraphrasedText });
  } catch (err) {
    console.error('Cohere paraphrase error:', err);
    // If CohereClientV2 throws a CohereError, it often has err.statusCode and err.body
    const statusCode = err.statusCode || 500;
    const details = err.body || err.message || 'Unknown error';
    return res.status(statusCode).json({
      error: 'Paraphrasing failed.',
      details
    });
  }
});

module.exports = router;
