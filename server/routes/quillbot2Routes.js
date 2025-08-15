// File: server/routes/quillbot2Routes.js

const express = require('express');
const { CohereClientV2 } = require('cohere-ai');
const router = express.Router();

// Assumes server.js already did dotenv + express.json()
const cohere = new CohereClientV2({
  token: process.env.CO_API_KEY,
});

// ─── BASE SYSTEM PROMPT (unchanged) ──────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `
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
• If Mode = “Expand,” any added content must be clearly related to existing sentences-do not introduce tangents or unrelated examples.
• If Mode = “Shorten,” remove only filler words, redundancies, or unnecessary adverbs/adjectives. Never omit any content that changes the factual meaning or narrative sequence.
• Preserve paragraph breaks.
• If Mode = “Grammar,” correct spelling, punctuation, and grammatical errors only. Maintain original word choice, tone, and structure aside from fixes.
• If Mode = “Simple,” reduce vocabulary complexity (grade 7 level), break long sentences into shorter ones, but keep every fact or idea.
• If Mode = “Formal,” use strictly formal register: no contractions, no slang, no casual phrasing. Maintain all factual content exactly.
• If Mode = “Fluent,” ensure the text reads effortlessly, like native speech, smoothing out any awkward phrasing while preserving every nuance.
• If Mode = “Creative,” richly enhance vocabulary, sentence structure, and descriptive language, yet keep all facts and narrative order intact.
* If Mode = “Academic,” produce a highly scholarly tone, using precise academic vocabulary and logical connectors. Ensure the text reads as part of a university or journal submission.
* If Mode = “Standard,” provide a clear, concise paraphrase suited for a thesis-ready style-neutral, straightforward, academically acceptable.
* Do not deviate from these Mode-specific rules under any circumstances.

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

// Helper to pick temperature per option (unchanged)
function getTemperature({ mode, style, tone }) {
  if (mode) {
    switch (mode) {
      case 'creative': return 0.9;
      case 'fluent':   return 0.6;
      case 'expand':   return 0.7;
      case 'shorten':  return 0.4;
      case 'academic':
      case 'grammar':  return 0.3;
      default:         return 0.5; // standard, simple, formal
    }
  }
  if (style) {
    if (style === 'casual') return 0.7;
    if (['academicTone','formal','professional'].includes(style)) return 0.3;
    return 0.5;
  }
  if (tone) {
    switch (tone) {
      case 'confident': return 0.8;
      case 'friendly':  return 0.7;
      case 'apologetic':
      case 'formal':    return 0.4;
      default:          return 0.5;
    }
  }
  return 0.5;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Protected-terms handling (placeholder strategy)
 * • Replaces each protected term with unique placeholder §§P{n}§§ using
 *   Unicode-aware "word-ish" boundaries (no partial inside-word matches).
 * • Restores originals after the model responds.
 * ──────────────────────────────────────────────────────────────────────────────
 */
function escapeRegex(s = '') {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function makeBoundaryRegex(term) {
  // Allow multi-word terms; normalize spaces to \s+
  const inner = term
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .join('\\s+');
  // (^|[^letter/number/_]) (term) (?=$|[^letter/number/_]) with Unicode flag
  return new RegExp(`(^|[^\\p{L}\\p{N}_])(${inner})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
}
function protectTerms(text, terms = []) {
  let out = text;
  const restore = [];
  for (const t of (terms || []).filter(Boolean)) {
    const rx = makeBoundaryRegex(t);
    out = out.replace(rx, (m, pre, match) => {
      const ph = `§§P${restore.length}§§`;
      restore.push(match); // keep exact original spelling/case that was matched
      return `${pre}${ph}`;
    });
  }
  return { text: out, restore };
}
function restoreTerms(text, restore = []) {
  let out = text;
  restore.forEach((orig, i) => {
    const ph = new RegExp(`§§P${i}§§`, 'g');
    out = out.replace(ph, orig);
  });
  return out;
}

router.post('/cohere/paraphrase', async (req, res) => {
  try {
    // Accept combined controls; keep defaults if missing
    let {
      text,
      mode,
      style,
      tone,
      language = 'en',
      protectedWords = [],
      rewriteStrength, // currently not altering model params; reserved
      candidates,      // reserved for future rerank workflows
      useRerank        // reserved
    } = req.body || {};

    // Validate text
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Invalid input: text must be a non-empty string.' });
    }

    // Normalize style alias from UI
    if (style === 'business') style = 'professional';

    // ── Apply protection placeholders BEFORE sending to the model
    const { text: protectedText, restore } = protectTerms(text, protectedWords);

    // Build Mode Instruction (kept intact)
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
• Do not add any new adjectives, similes, or metaphors unless strictly needed to smooth an awkward phrase; if added, they must be neutral and not introduce new connotations.
• Ensure transitions between sentences are smooth using varied transitional phrases.
• Maintain consistent register with the chosen Style block to avoid tonal mismatches.
• Vary sentence openings to enhance readability and engagement.
        `.trim();
        break;
      case 'creative':
        modeInstruction = `
Mode: “Creative”
• Rewrite using vivid, imaginative language-select evocative adjectives, use varied sentence lengths, and add descriptive flair.
• Expand metaphorical or sensory detail where appropriate, but do not invent new plot elements, events, or characters.
• Maintain exactly all facts, narrative events, names, dates, and sequence from the original.
• When restructuring sentences, ensure that each sentence’s informational content remains unaltered.
• Use rhetorical devices (e.g., alliteration, parallel structure) sparingly and only to enhance imagery; do not compromise factual accuracy.
• Preserve original paragraph breaks unless combining very short sentences to improve flow; if combining, do not eliminate distinct ideas.
• Employ dynamic pacing to heighten reader engagement without altering meaning.
• Select precise sensory verbs and adjectives to bring scenes to life.
• Introduce subtle figurative language (e.g., mild metaphor or simile) only to underscore key points.
• Adjust sentence rhythm with deliberate variation in length and structure.
        `.trim();
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
• Do not add footnotes, endnotes, or bibliographic entries.
• Define specialized terminology succinctly or assume known audience expertise.
• Use passive voice judiciously to emphasize objectivity and formality.
• Ensure consistency in tense usage throughout the document.
        `.trim();
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
• Use complete and grammatically correct sentences; correct any fragments in original text.
• Adhere to standard corporate style guidelines for punctuation and formatting.
• Incorporate appropriate domain-specific terminology to reinforce authority.
• Verify consistency of terminology and register throughout.
        `.trim();
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
• Use active voice whenever possible (e.g., “The dog chased the ball” instead of “The ball was chased by the dog”).
• Prefer high-frequency everyday vocabulary to maximize comprehension.
• Use clear pronoun references to reduce ambiguity.
• Keep sentence length under 20 words when possible.
        `.trim();
        break;
      case 'expand':
        modeInstruction = `
Mode: “Expand”
… (your existing Expand block)
        `.trim();
        break;
      case 'shorten':
        modeInstruction = `
Mode: “Shorten”
… (your existing Shorten block)
        `.trim();
        break;
      case 'grammar':
        modeInstruction = `
Mode: “Grammar”
… (your existing Grammar block)
        `.trim();
        break;
      default:
        modeInstruction = `
Mode: “Standard”
… (your existing Standard block)
        `.trim();
    }

    // Build Style + Tone Instruction (concatenate if both provided; keep each block intact)
    let styleBlocks = [];

    if (style && style !== 'default') {
      switch (style) {
        case 'formal':
          styleBlocks.push(`… (your existing Style: Formal block)`);
          break;
        case 'casual':
          styleBlocks.push(`… (your existing Style: Casual block)`);
          break;
        case 'professional':
          styleBlocks.push(`… (your existing Style: Professional block)`);
          break;
        case 'academicTone':
          styleBlocks.push(`… (your existing Style: Academic block)`);
          break;
        default:
          styleBlocks.push(`
Style: “Default”
• Apply no additional tone modification.
          `.trim());
      }
    }

    if (tone && tone !== 'default') {
      switch (tone) {
        case 'formal':
          styleBlocks.push(`
Style: “Formal”
• Use exclusively formal language. Do not use contractions (e.g., “cannot” instead of “can’t,” “do not” instead of “don’t”).
• Avoid colloquial expressions or idioms (e.g., “hang out,” “shoot the breeze”).
• Each sentence must sound business‐appropriate: clear, respectful, and devoid of slang.
• Use terminology that would be acceptable in a corporate or legal document.
• Do not use any contractions anywhere. Spell out do not, cannot, would not, it is, they are, she has, etc.
• Adopt an impersonal, professional register-avoid expressions like “she’s,” “we’re,” “it’s,” “you’ll,” etc.
• Maintain a neutral, impersonal perspective unless original perspective is first person.
• Adhere to corporate style guides for punctuation, capitalization, and formatting.
          `.trim());
          break;
        case 'confident':
          styleBlocks.push(`
Style: “Confident”
• MUST use assertive modals (“will,” “must,” “cannot”).
• Avoid qualifiers (“maybe,” “perhaps”).
• Use active voice exclusively.
• Include one emphatic adverb (“undoubtedly,” “clearly”).
• Begin one sentence with a strong adverb (“Indeed,” “Certainly”).
• State benefits as certainties.
• Avoid question formats-use statements.
• Use “I am confident” or “It is clear” phrases.
• Limit subordinate clauses.
• End with a decisive closing statement.
          `.trim());
          break;
        case 'friendly':
          styleBlocks.push(`
Style: “Friendly”
• MUST use warm, approachable phrasing.
• Address the reader directly (“you”).
• Use simple contractions (“you’re,” “we’re”).
• Include one casual colloquialism (“no worries”).
• Add a brief parenthetical aside for humor.
• Use second-person examples (“imagine you…”).
• Avoid overly technical or formal words.
• End with a friendly sign-off phrase.
• Keep paragraphs short for easy reading.
• Use emotive adjectives (“lovely,” “cozy”).
          `.trim());
          break;
        case 'apologetic':
          styleBlocks.push(`
Style: “Apologetic”
• MUST use soft, humble language.
• Acknowledge concerns gently.
• Favor passive voice and politeness markers (“please,” “if possible”).
• Use wording like “we regret,” “we’re sorry,” “thank you for your patience.”
          `.trim());
          break;
        default:
          styleBlocks.push(`
Style: “Default”
• Apply no additional tone modification beyond the Mode’s instructions.
• Maintain the neutral register provided by the Mode block.
          `.trim());
      }
    }

    if (styleBlocks.length === 0) {
      styleBlocks.push(`
Style: “Default”
• Apply no additional tone modification beyond the Mode’s instructions.
• Maintain the neutral register provided by the Mode block.
      `.trim());
    }

    // Assemble final prompt (keep your structure; include language directive as before)
    let finalPrompt = BASE_SYSTEM_PROMPT
      .replace('%MODE_INSTRUCTION%', modeInstruction)
      .replace('%STYLE_INSTRUCTION%', styleBlocks.join('\n\n'));

    finalPrompt = `Language: ${language}\n` + finalPrompt;

    // Extra safety: tell the model to keep placeholders verbatim (does not modify your base prompt)
    const placeholderGuard = 'If the user text contains placeholders like §§P0§§, §§P1§§, etc., return them exactly as-is, without translation or alteration.';

    const messages = [
      { role: 'system', content: placeholderGuard },
      { role: 'system', content: finalPrompt },
      { role: 'user',   content: protectedText }
    ];

    // Call Cohere with dynamic temperature (unchanged API surface)
    const response = await cohere.chat({
      model: 'command-a-03-2025',
      messages,
      temperature: getTemperature({ mode, style, tone }),
    });

    // Robust extraction: join any text parts if present
    const parts = response?.message?.content;
    let paraphrased = '';
    if (Array.isArray(parts)) {
      paraphrased = parts
        .filter(p => p && p.type === 'text' && typeof p.text === 'string')
        .map(p => p.text.trim())
        .join(' ')
        .trim();
    } else {
      paraphrased = response?.message?.content?.[0]?.text?.trim();
    }

    if (!paraphrased) {
      return res.status(500).json({ error: 'Cohere returned invalid response.', details: response });
    }

    // ── Restore protected terms AFTER model response
    paraphrased = restoreTerms(paraphrased, restore);

    return res.json({ paraphrased });
  } catch (err) {
    console.error('Cohere paraphrase error:', err);
    const statusCode = err.statusCode || 500;
    const details    = err.body       || err.message || 'Unknown error';
    return res.status(statusCode).json({ error: 'Paraphrasing failed.', details });
  }
});

module.exports = router;
