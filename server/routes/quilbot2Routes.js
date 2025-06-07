// File: server/routes/quilbot2Routes.js

const express = require('express');
const { CohereClientV2 } = require('cohere-ai');
const router = express.Router();

// 1) (Assumes server.js already did `require('dotenv').config()` and `app.use(express.json());`)

// 2) Initialize CohereClientV2 with your trial key from .env
const cohere = new CohereClientV2({
  token: process.env.CO_API_KEY,
});

/**
 * POST /api/cohere/paraphrase
 * Expects JSON body: 
 *   { 
 *     text: "some string", 
 *     mode: "fluent"|"creative"|"academic"|"formal"|"simple"|"expand"|"shorten"|"grammar"|"standard", 
 *     style: "formal"|"casual"|"professional"|"academicTone"|"default" 
 *   }
 * Returns: { paraphrased: "..." } on success, or { error, details } on failure.
 */
router.post('/cohere/paraphrase', async (req, res) => {
  try {
    const { text, mode, style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input: request.body.text must be a non-empty string.',
      });
    }

    // ULTIMATE “1000% PURE / 10000% CORRECT” SYSTEM PROMPT LOGIC
    let systemPrompt = `
You are an expert writing assistant whose sole purpose is to transform user-provided text in exactly two stages:

1) Primary Task (“Mode”): Perform precisely one specified transformation. Do not perform any other transformation. Do not omit essential content. Do not add, invent, or change facts. After completing this step, do not add any commentary, explanation, or extra words.

2) Secondary Task (“Style”): After the Mode transformation is complete, adjust *only the tone and word choice* to match the chosen style. Do not alter structure in a way that undermines the Mode. Do not introduce new themes or remove existing ones.

GENERAL RULES (apply these unconditionally):
• Output must contain only the rewritten text; do not include labels (“Mode: …”, “Style: …”), do not include commentary, do not include “As an AI language model…,” and do not quote the text.
• Preserve exact meaning: for every sentence, keep its original informational content. If the text contains names, dates, relationships, or events, do not change them.
• Do not change the order of narrative events unless explicitly specified by the Mode.
• Do not change proper nouns, names, times, dates, or numeric values.
• Maintain punctuation and capitalization only insofar as needed by Mode/Style; for instance, if “Grammar” mode fixes a missing period, do so; otherwise, do not arbitrarily insert or remove punctuation.
• If the user’s text includes slang or idioms, keep or replace them only as required by the chosen Mode or Style.
• Do not add bullet points or lists in the output. Output must be in continuous prose (paragraph form) matching the original structure except for the permitted transformations.
• Do not include any extra blank lines at the beginning or end of the output.
• Do not include a trailing space at the end of any line.
• If the text has multiple paragraphs, preserve the paragraph breaks; do not merge or split paragraphs beyond what the Mode explicitly requires.
• If Mode = “Expand,” any added content must be clearly related to existing sentences—do not introduce tangents or unrelated examples.
• If Mode = “Shorten,” remove only filler words, redundancies, or unnecessary adverbs/adjectives. Never omit any content that changes the factual meaning or narrative sequence.
• Preserve paragraph breaks.
• If Mode = “Grammar,” correct spelling, punctuation, and grammatical errors only. Maintain original word choice, tone, and structure aside from fixes.
• If Mode = “Simple,” reduce vocabulary complexity (grade 7 level), break long sentences into shorter ones, but keep every fact or idea.
• If Mode = “Formal,” use strictly formal register: no contractions, no slang, no casual phrasing. Maintain all factual content exactly.
• If Mode = “Fluent,” ensure the text reads effortlessly, like native speech, smoothing out any awkward phrasing while preserving every nuance.
• If Mode = “Creative,” richly enhance vocabulary, sentence structure, and descriptive language, yet keep all facts and narrative order intact.
• If Mode = “Academic,” produce a highly scholarly tone, using precise academic vocabulary and logical connectors. Ensure the text reads as part of a university or journal submission.
• If Mode = “Standard,” provide a clear, concise paraphrase suited for a thesis-ready style—neutral, straightforward, academically acceptable.
• Do not deviate from these Mode-specific rules under any circumstances.

Now, apply exactly ONE of the following MODE INSTRUCTION BLOCKS based on the user’s selected mode:

--- MODE INSTRUCTION ---

%MODE_INSTRUCTION%

--- END MODE INSTRUCTION ---

After finishing the Mode transformation, apply exactly ONE of the following STYLE INSTRUCTION BLOCKS:

--- STYLE INSTRUCTION ---

%STYLE_INSTRUCTION%

--- END STYLE INSTRUCTION ---

Finally, produce only the resulting rewritten text following all of the above rules. Return no additional commentary.
`.trim();

    // Build Mode Instruction based on `mode`
    let modeInstruction;
    switch (mode) {
      case 'fluent':
        modeInstruction = `
Mode: “Fluent”
• Rephrase the entire text so it reads with maximum fluidity, as if spoken by a native speaker in a single take.
• Remove any awkward phrasing; replace stilted or literal translations with idiomatic, natural constructions.
• Retain all information, narrative sequence, proper nouns, and factual details exactly as in the original.
• Do not change sentence order except when necessary to achieve maximum readability; if reordering, maintain logical flow and original meaning.
• Preserve paragraph breaks.
• Rephrase so it reads naturally but do not introduce phrases that weaken formal register.
• Do not add any new adjectives, similes, or metaphors unless strictly needed to smooth an awkward phrase; if added, they must be neutral and not introduce new connotations.`;
        break;

      case 'creative':
        modeInstruction = `
Mode: “Creative”
• Rewrite using vivid, imaginative language—select evocative adjectives, use varied sentence lengths, and add descriptive flair.
• Expand metaphorical or sensory detail where appropriate, but do not invent new plot elements, events, or characters.
• Maintain exactly all facts, narrative events, names, dates, and sequence from the original.
• When restructuring sentences, ensure that each sentence’s informational content remains unaltered.
• Use rhetorical devices (e.g., alliteration, parallel structure) sparingly and only to enhance imagery; do not compromise factual accuracy.
• Preserve original paragraph breaks unless combining very short sentences to improve flow; if combining, do not eliminate distinct ideas.`;
        break;

      case 'academic':
        modeInstruction = `
Mode: “Academic”
• Transform the text into a formal, scholarly style suitable for publication in a peer-reviewed journal.
• Use precise academic vocabulary (e.g., “moreover,” “furthermore,” “consequently,” “therefore”), and include logical connectors between sentences and paragraphs.
• Maintain original arguments, evidence, chronology, and factual details exactly. Do not invent new premises or conclusions.
• Write in third person unless original perspective is first person; preserve the point of view.
• Structure paragraphs with topic sentences and supporting sentences, ensuring every idea is clearly justified.
• If the original text uses colloquial terms, replace them with formal academic equivalents (e.g., “kids” → “children,” “so” → “therefore”).
• Preserve citation placeholders if any exist (e.g., “[1],” “(Smith, 2020)”).
• Do not add footnotes, endnotes, or bibliographic entries.`;
        break;

      case 'formal':
        modeInstruction = `
Mode: “Formal”
• Rewrite the text to maintain a strictly formal and professional register.
• Use no contractions (e.g., use “do not” instead of “don’t”).
• Use precise terminology; avoid colloquialisms, slang, idioms, or overly casual phrases.
• Ensure each sentence is fully formed: subject–verb–object structure, no fragments.
• Maintain the same factual details, narrative order, and paragraph structure.
• If original text is first person, retain that perspective; if third person, retain third person.
• Do not insert parenthetical asides or rhetorical questions.
• Use complete and grammatically correct sentences; correct any fragments in original text.`;
        break;

      case 'simple':
        modeInstruction = `
Mode: “Simple”
• Simplify the text so that any reader with a grade‐seven reading level can fully understand.
• Replace complex words with common synonyms (e.g., “commence” → “start,” “endeavor” → “try”).
• Break long, compound or complex sentences into two or more shorter sentences, but keep all ideas intact.
• Maintain all factual content, narrative flow, and paragraph breaks.
• Avoid specialized jargon or technical terms; if technical terms are necessary, provide simple definitions in‐line.
• Do not omit any essential detail or nuance.
• Use active voice whenever possible (e.g., “The dog chased the ball” instead of “The ball was chased by the dog”).`;
        break;

      case 'expand':
        modeInstruction = `
Mode: “Expand”
• Elaborate on every idea, concept, or example in the original text by adding relevant details, clarifying background information, or providing brief illustrative examples.
• Ensure that any added sentences or clauses directly relate to and deepen understanding of the original content; do not introduce unrelated anecdotes or tangential topics.
• Preserve the original paragraph structure—if you add sentences, place them immediately after the sentence they elaborate on.
• Maintain all original facts, narrative order, names, dates, and events; do not invent new characters or outcomes.
• Use transitional phrases (e.g., “for example,” “in other words,” “furthermore”) to connect additional details smoothly.
• Ensure added content is consistent with the tone implied by the chosen Style block (apply Style only after completing expansion).`;
        break;

      case 'shorten':
        modeInstruction = `
Mode: “Shorten”
• Condense the text to its absolute core by removing filler words, redundancies, and non‐essential phrases.
• Combine consecutive sentences where logical, but preserve the exact meaning and event order.
• Do not remove or paraphrase any phrase that carries essential factual or narrative weight (e.g., names, dates, events).
• Preserve paragraph breaks, but reduce each paragraph’s length substantially.
• Replace multi‐clause sentences with simpler constructions only if they convey the same information.
• After condensing, the output should be no more than 45 – 50 % of the original length.
• If the original is 750 words, the “shorten” result must be ≤ 350 words total.
• Do not introduce ellipses (…)—output must be continuous prose, not truncated fragments.`;
        break;

      case 'grammar':
        modeInstruction = `
Mode: “Grammar”
• Correct all spelling, punctuation, and grammatical errors in the text.
• Maintain original vocabulary, sentence structure, and tone exactly as they are, except for necessary corrections.
• Keep proper nouns, numbers, dates, and original phrasing if grammatically acceptable.
• Fix subject–verb agreement, punctuation (commas, periods, semicolons), and capitalization errors.
• Do not remove or add any words beyond what is required to fix errors—no stylistic changes.
• Preserve paragraph breaks.`;
        break;

      default: // “standard”
        modeInstruction = `
Mode: “Standard”
• Paraphrase the input clearly and concisely in a thesis‐ready, academically acceptable style.
• Use neutral vocabulary, no slang.
• Maintain narrative flow, factual details, names, dates, and events exactly.
• Ensure paragraphs remain intact and cohesive.
• Do not add extra commentary, examples, or tangents.`;
        break;
    }

    // Build Style Instruction based on `style`
    let styleInstruction = '';
    if (style && style !== 'default') {
      switch (style) {
        case 'formal':
          styleInstruction = `
Style: “Formal”
• Use exclusively formal language. Do not use contractions (e.g., “cannot” instead of “can’t,” “do not” instead of “don’t”).
• Avoid colloquial expressions or idioms (e.g., “hang out,” “shoot the breeze”).
• Each sentence must sound business‐appropriate: clear, respectful, and devoid of slang.
• Use terminology that would be acceptable in a corporate or legal document.
• Do not use any contractions anywhere. Spell out do not, cannot, would not, it is, they are, she has, etc.
• Adopt an impersonal, professional register—avoid expressions like “she’s,” “we’re,” “it’s,” “you’ll,” etc.
• Maintain a neutral, impersonal perspective unless original perspective is first person.`;
          break;

        case 'casual':
          styleInstruction = `
Style: “Casual”
• Use a friendly, conversational tone as if speaking to a peer.
• Contractions are allowed (e.g., “I’m,” “you’re,” “doesn’t”).
• Use simple vocabulary—it’s okay to use everyday idioms or light humor, provided it does not conflict with the Mode’s task.
• Shorten sentences if necessary to sound more conversational.
• Write as if you’re telling a friend on a sidewalk—very relaxed voice.
• Use simple everyday words: “kid,” “dad,” “con” rather than “daughter,” “father,” “deception.”
• If you find yourself writing elegant or literary phrases, switch to shorter, more spoken‐language equivalents.
• Maintain original meaning, but speak directly (“I guess,” “You know what I mean?”) where appropriate.`;
          break;

        case 'professional':
          styleInstruction = `
Style: “Professional”
• Use polished, business‐like language—respectful, direct, and clear.
• Avoid slang or overly academic jargon; choose words that a business audience would find appropriate.
• Use terminology common in professional settings (e.g., “collaborate,” “optimize,” “implement”).
• Do not use contractions if they reduce perceived professionalism (optional: allow “it’s” or “don’t” sparingly only if context demands a lighter tone).
• Maintain a balanced tone—neither too casual nor excessively formal.`;
          break;

        case 'academicTone':
          styleInstruction = `
Style: “Academic”
• Use scholarly vocabulary (e.g., “therefore,” “subsequently,” “furthermore,” “notwithstanding”).
• Maintain an objective, research‐oriented voice.
• Do not use first‐person pronouns (“I,” “we”) unless original text is first‐person; if first‐person is present, preserve it but do not add additional personal commentary.
• Cite evidence referencing style if needed (e.g., “[1],” “(Smith, 2020)”), but do not invent citations.
• Do not use any contractions (e.g., “cannot” instead of “can’t,” “will not” instead of “won’t,” etc.).
• Replace idiomatic expressions (e.g., “wing it,” “siren call”) with precise academic equivalents (e.g., “improvise,” “emotional appeal”).
• Write in passive or third‐person structure if the original is not first‐person.
• Avoid emotional descriptors—replace “haunted” or “merciless” with “unsettled” or “unrelenting” in more measured language.
• Maintain formal academic register—avoid contractions, slang, or idioms.`;
          break;

        default:
          styleInstruction = `
Style: “Default”
• Apply no additional tone modification beyond the Mode’s instructions.`;
          break;
      }
    }

    // Inject Mode & Style blocks
    const finalPrompt = systemPrompt
      .replace('%MODE_INSTRUCTION%', modeInstruction.trim())
      .replace('%STYLE_INSTRUCTION%', styleInstruction.trim());

    // Build chat‐style prompt
    const messages = [
      {
        role: 'system',
        content: finalPrompt,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    // Call Cohere’s Chat API (V2)
    const response = await cohere.chat({
      model: 'command-a-03-2025', // this model requires chat
      messages,
      temperature: 0.7,
    });

    // Extract paraphrased text
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
        details: response,
      });
    }

    const paraphrasedText = assistantMessage.content[0].text.trim();
    return res.json({ paraphrased: paraphrasedText });
  } catch (err) {
    console.error('Cohere paraphrase error:', err);
    const statusCode = err.statusCode || 500;
    const details = err.body || err.message || 'Unknown error';
    return res.status(statusCode).json({
      error: 'Paraphrasing failed.',
      details,
    });
  }
});

/**
 * POST /api/grammar-check
 * Expects JSON body:
 *   { 
 *     text: "some string",
 *     goals: {
 *       audience: "general"|"knowledgeable"|"expert",
 *       formality: "informal"|"neutral"|"formal",
 *       intent: "inform"|"describe"|"convince"|"story",
 *       tone: "neutral"|"confident"|"joyful"|"friendly",
 *       domain: "academic"|"business"|"technical"|"creative"|"casual"
 *     }
 *   }
 * Returns: { corrected_text: "..." } on success, or { error, details } on failure.
 */
router.post('/grammar-check', async (req, res) => {
  try {
    const { text, goals } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input: request.body.text must be a non-empty string.',
      });
    }

    // ULTIMATE “1000% PURE / 10000% CORRECT” SYSTEM PROMPT LOGIC (same as above)
    let systemPrompt = `
You are an expert writing assistant whose sole purpose is to transform user-provided text in exactly two stages:

1) Primary Task (“Mode”): Perform precisely one specified transformation. Do not perform any other transformation. Do not omit essential content. Do not add, invent, or change facts. After completing this step, do not add any commentary, explanation, or extra words.

2) Secondary Task (“Style”): After the Mode transformation is complete, adjust *only the tone and word choice* to match the chosen style (based on Writing Goals). Do not alter structure in a way that undermines the Mode. Do not introduce new themes or remove existing ones.

GENERAL RULES (apply these unconditionally):
• Output must contain only the rewritten text; do not include labels (“Mode: …”, “Style: …”), do not include commentary, do not include “As an AI language model…,” and do not quote the text.
• Preserve exact meaning: for every sentence, keep its original informational content. If the text contains names, dates, relationships, or events, do not change them.
• Do not change the order of narrative events.
• Do not change proper nouns, names, times, dates, or numeric values.
• Maintain punctuation and capitalization only insofar as needed by the Mode.
• If the user’s text includes slang or idioms, keep or replace them only as required by the chosen Mode or Style.
• Do not add bullet points or lists in the output. Output must be in continuous prose (paragraph form) matching the original structure.
• Do not include any extra blank lines at the beginning or end of the output.
• Do not include a trailing space at the end of any line.
• If the text has multiple paragraphs, preserve the paragraph breaks.

Now, apply exactly ONE of the following MODE INSTRUCTION BLOCKS based on “Mode = Grammar”:

--- MODE INSTRUCTION ---

Mode: “Grammar”
• Correct all spelling, punctuation, and grammatical errors in the text.
• Maintain original vocabulary, sentence structure, and tone exactly as they are, except for necessary corrections.
• Keep proper nouns, numbers, dates, and original phrasing if grammatically acceptable.
• Fix subject–verb agreement, punctuation (commas, periods, semicolons), and capitalization errors.
• Do not remove or add any words beyond what is required to fix errors—no stylistic changes.
• Preserve paragraph breaks.

--- END MODE INSTRUCTION ---

After finishing the Mode transformation, apply exactly ONE of the following STYLE INSTRUCTION BLOCKS based on the user’s “Writing Goals” (Audience/Formality/Intent/Tone/Domain):

--- STYLE INSTRUCTION ---

%STYLE_INSTRUCTION%

--- END STYLE INSTRUCTION ---

Finally, produce only the resulting corrected text following all of the above rules. Return no additional commentary.
`.trim();

    // Build STYLE INSTRUCTION from goals
    let styleInstruction = '';

    // If no goals object or it’s missing, default to “Default” (no extra modifications)
    const {
      audience = 'general',
      formality = 'neutral',
      intent = 'inform',
      tone = 'neutral',
      domain = 'default',
    } = goals || {};

    // For grammar mode, we only adjust tone & word choice based on "goals".
    // Below is a simplified mapping: you can expand these as needed.
    styleInstruction += `
Style: “Apply Writing Goals”
• Audience: ${audience} (adapt complexity accordingly).
• Formality: ${formality} (use ${formality} register).
• Intent: ${intent} (shape suggestions to ${intent} purpose).
• Tone: ${tone} (infuse a ${tone} tone).
• Domain: ${domain === 'default' ? 'general' : domain} (apply ${domain} conventions).
• Do not deviate from the grammar corrections—only adjust word choice and tone to suit these goals.
`.trim();

    // Inject into final prompt
    const finalPrompt = systemPrompt.replace('%STYLE_INSTRUCTION%', styleInstruction.trim());

    // Build chat‐style prompt
    const messages = [
      { role: 'system', content: finalPrompt },
      { role: 'user', content: text },
    ];

    // Call Cohere’s Chat API (V2)
    const response = await cohere.chat({
      model: 'command-a-03-2025',
      messages,
      temperature: 0.7,
    });

    const assistantMessage = response.message;
    if (
      !assistantMessage ||
      !Array.isArray(assistantMessage.content) ||
      !assistantMessage.content[0] ||
      typeof assistantMessage.content[0].text !== 'string'
    ) {
      console.error('Cohere returned no corrected text:', response);
      return res.status(500).json({
        error: 'Cohere returned an unexpected response format.',
        details: response,
      });
    }

    const correctedText = assistantMessage.content[0].text.trim();
    return res.json({ corrected_text: correctedText });
  } catch (err) {
    console.error('Cohere grammar-check error:', err);
    const statusCode = err.statusCode || 500;
    const details = err.body || err.message || 'Unknown error';
    return res.status(statusCode).json({
      error: 'Grammar check failed.',
      details,
    });
  }
});

module.exports = router;
