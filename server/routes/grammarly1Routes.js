// File: server/routes/grammarly1Routes.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Make sure you have SAPLING_API_KEY in your .env
const SAPLING_API_KEY = process.env.SAPLING_API_KEY;




/**
 * POST /api/grammar-check
 * Body: { text: string, goals: { … } }
 * Returns: { corrected_text: string }
 */
router.post('/grammar-check', async (req, res) => {
  try {
    const { text, goals = {} } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid input: text required.' });
    }

    // Now you can safely use `goals` even if the client never sent it
    // const processed = await yourGrammarFunction(text, goals);

  //   return res.json({ corrected_text: processed });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({
  //     error: 'Grammar check failed.',
  //     details: err.message
  //   });
  // }
// });

   // 0) ENHANCED PROMPT COMPONENTS (always applied)

// Meta-Prompting
const metaPrompt = `
Whenever you receive instructions:
1. Analyze for clarity and completeness.
2. Refine & simplify—they go under "Refined Instruction:".
3. Execute—they go under "Execution:".
`.trim();

// Context-Layering
const contextTemplate = `
ROLE: Expert English proofreader & style coach
TASK: 1) Grammar & typography pass  
      2) Optional in-place style pass  
CONTEXT: Any English prose (emails, essays, blogs, posts)  
CONSTRAINTS:
  • Preserve all original sentences & paragraph breaks.
  • Do NOT add, remove, split, merge, or reorder sentences.
  • Normalize curly quotes (“…”), ellipses (… with space after), em dashes (—), commas, spacing.
`.trim();

// Focused Test-style Prompts
const testPrompts = [
  "• Check subject–verb agreement; use 'were' for hypotheticals (e.g. “If I were”).",
  "• Identify & fix comma splices and run-ons.",
  "• Ensure consistent tense throughout.",
  "• Verify pronoun clarity and agreement .",
  "• Normalize curly quotes (“…” and ‘…’).",
  "• Normalize ellipses (…) to a single character, with a space after if mid-sentence.",
  "• Convert hyphens-in-text to em dashes (—) for breaks.",
  "• Remove duplicate spaces, stray tabs, trailing whitespace.",
  "• Do NOT split or merge sentences: preserve original sentence count exactly.",
  "• Replace any straight quotes (\") with curly quotes (“” / ‘’).",
  "• Do not introduce or remove sentences or paragraphs.",
  "• Highlight overly wordy or redundant phrasing.",
  "• Format numbers per style: spell out <100 for Formal/Academic; keep digits otherwise."
].join("\n");

// Chain-of-Thought (hidden)
const reasoningPrompt = `
Think step-by-step (internally):
1. Apply each test-check to every sentence.
2. Perform grammar & typography corrections.
3. If style goals exist, apply in-place style rules (no new sentences).
4. Adjust numbers per style rules.
5. Output only the final polished text.
`.trim();

// STYLE generator: in-place only, with domain rules
function stylePrompt(userStyle, userAudience, domain) {
  if (!userStyle || userStyle === 'default') return '';

  const domainRule = {
    academic:   "• Spell out numbers below 100 in words; use neutral academic tone.",
    business:   "• Be concise—eliminate redundancies; keep bullet-style brevity.",
    creative:   "• Add vivid adjectives or imagery in place (e.g. “dreary”→“mournful”).",
    casual:     "• Allow light colloquialisms but keep sentences intact.",
    technical:  "• Use precise technical terminology where relevant."
  }[domain] || "";

  return `
STYLE GOAL: ${userStyle}${userAudience ? `; Audience: ${userAudience}` : ''}
${domainRule}
Example (in-place):
  “Let me know if you can attend.” → “Please confirm your attendance.”
Rules:
  • Replace words/phrases within each sentence only.
  • Do NOT add/remove/split/merge sentences or paragraphs.
  • Convert straight quotes to curly quotes.
  • Normalize ellipses (…) and em dashes (—) with correct spacing.
  • Do not alter sentence count or structure beyond word swaps.
`.trim();
}  // <— only one closing brace here


// 1) SUPER-CHARGED SYSTEM PROMPT
const systemPrompt = `
${metaPrompt}

${contextTemplate}

You will execute TWO STAGES exactly:

STAGE 1: MODE = “Grammar”
• Fix ONLY spelling, punctuation, capitalization, grammar, typography.
• Preserve all original sentences & paragraph breaks.
• Normalize curly quotes, ellipses (… with space), em dashes (—), commas, spacing.
• Do NOT add/remove/split/merge/reorder sentences or paragraphs.

STAGE 2: STYLE = “Writing Goals”
• Only if style goals ≠ default.
• Apply ONLY in-place word/tone adjustments per style rules.
• Do NOT alter sentence count, order, or add new content.

${reasoningPrompt}
`.trim();

// 2) MODE BLOCK (strict rules with enhanced examples)
const modeInstruction = `
--- MODE INSTRUCTION ---
Mode: “Grammar”
• Spelling & grammar:
  e.g. “teh quick brown fox” → “the quick brown fox”
• Typography normalization:
  Ellipses “…”, em dashes “—”; no multiple periods or hyphens.
• Agreement & consistency:
  e.g. “She go”→“She goes”, “they was”→“they were”
• Whitespace cleanup:
  e.g. “Hello  world ”→“Hello world”
• Quotation & punctuation:
  e.g. He said, “Hello.” not He said, “Hello”
• Comma rules:
  Use Oxford comma in lists; no comma splices.
• Preserve original structure, tone, vocabulary, paragraphs.
• Do NOT add or remove facts, paraphrase, or comment.
--- END MODE INSTRUCTION ---
`.trim();

// 2) MODE BLOCK (enhanced with examples & strict rules)



    // 3) STYLE BLOCKS with MUST directives on key lines
    const audienceBlocks = {
      general: `
--- GOAL: Audience ---
• MUST use plain language so any reader can understand.
• Avoid specialized jargon or acronyms; define briefly if necessary.
• Keep sentences to 10–20 words each.
• Prefer common everyday words over rare or technical terms.
• Break any especially long sentence into two simpler ones.
• Provide brief context for any unusual term (in parentheses).
• Eliminate unnecessary synonyms—choose the clearest option.
• Use active voice unless passive is required for clarity.
• Avoid idiomatic expressions that aren’t universally understood.
• Ensure each sentence stands alone as a complete thought.
--- END GOAL: Audience ---
`,
      knowledgeable: `
--- GOAL: Audience ---
• MUST assume the reader has background in the topic.
• Use domain terminology freely without definitions.
• Mix multi-clause and simple sentences for depth.
• Introduce one example or analogy per paragraph for clarity.
• Use precise metrics or data points when available.
• Cite any implied sources (e.g., “according to studies”).
• Retain technical nuance (do not oversimplify critical terms).
• Employ varied sentence openings to maintain engagement.
• Use parenthetical notes sparingly for advanced digressions.
• Avoid over-explaining concepts the audience already knows.
--- END GOAL: Audience ---
`,
      expert: `
--- GOAL: Audience ---
• MUST write for specialists—precise technical terms, no explanations.
• Employ advanced vocabulary and complex sentence structures.
• Keep tone formal and authoritative.
• Include at least one domain-specific abbreviation or acronym.
• Use discipline-standard notation (e.g., SI units, LaTeX-style variables).
• Reference known benchmarks or classic studies by name.
• Assume familiarity with field conventions and theories.
• Use nominalizations to condense processes into terms (e.g., “optimization”).
• Deploy at least one compound-complex sentence per paragraph.
• Avoid colloquialisms or any conversational tone.
--- END GOAL: Audience ---
`
    };

    const formalityBlocks = {
      informal: `
--- GOAL: Formality ---
• MUST use a relaxed, conversational style.
• Contractions are fine (“don’t,” “it’s”).
• Short sentences and colloquial phrasing are allowed.
• Include at least one rhetorical question (“Isn’t it great?”).
• Use interjections (“wow,” “hey”) sparingly for emphasis.
• Address reader as “you” when appropriate.
• Include at least one idiom or simple metaphor.
• Maintain a light, approachable voice.
• Avoid overly technical or archaic words.
• End one sentence with an exclamation point.
--- END GOAL: Formality ---
`,
      neutral: `
--- GOAL: Formality ---
• MUST maintain a balanced register—no contractions but not stiff.
• Use standard grammar without colloquialisms.
• Keep sentence length moderate—avoid extremes.
• Avoid slang, idioms, and rhetorical flourishes.
• Use second person (“you”) only when necessary.
• Maintain consistent tense throughout.
• Use straightforward connectors (“and,” “but,” “so”).
• Avoid parentheses; use commas instead.
• Keep paragraphs uniform in structure.
• Use only one exclamation point per passage at most.
--- END GOAL: Formality ---
`,
      formal: `
--- GOAL: Formality ---
• MUST use no contractions (e.g., “cannot,” “do not”).
• Use precise, polite phrasing suitable for professional contexts.
• Avoid colloquialisms or idioms.
• Use fully spelled-out dates and numbers (e.g., “twenty twenty-five”).
• Replace casual verbs with formal equivalents (“procure” vs. “get”).
• Use third person unless first person is required.
• Incorporate at least one passive-voice construction for objectivity.
• Limit sentence openings to formal adverbs or conjunctive phrases.
• Avoid rhetorical questions entirely.
• Ensure consistent use of American or British spelling.
--- END GOAL: Formality ---
`
    };

    const intentBlocks = {
      inform: `
--- GOAL: Intent ---
• MUST keep explanations clear, objective, and straightforward.
• Present information factually with neutral tone.
• Use bullet-style transitions (“First, …; Next, …; Finally, …”).
• Include one data point or statistic if relevant.
• Use precise definitions for key terms inline.
• Avoid persuasive language or emotional appeals.
• Use “the study shows,” “research indicates” phrasing.
• Limit use of adjectives to those strictly needed.
• Maintain chronological or logical order.
• Close with a concise summary sentence.
--- END GOAL: Intent ---
`,
      describe: `
--- GOAL: Intent ---
• MUST use vivid sensory adjectives (bright, cold, rhythmic).
• Include spatial or tactile details.
• Vary sentence lengths for rhythm: one long, one short.
• Introduce at least one sensory metaphor (“like glittering beads”).
• Use active verbs to depict movement or change.
• Avoid abstract nouns—focus on concrete imagery.
• Place descriptive clause at clause-end for emphasis.
• Use precise color, texture, or sound descriptors.
• Include a simile or two for illustration.
• End paragraph with an evocative image.
--- END GOAL: Intent ---
`,
      convince: `
--- GOAL: Intent ---
• MUST employ persuasive language and strong assertions.
• Use at least one rhetorical question and one emphatic statement.
• Include at least one benefit-oriented phrase (“so you can…”).
• Use “therefore,” “consequently,” or “hence” for logical flow.
• Offer a brief, compelling call to action at end.
• Avoid hedging—replace “might” with “will” or “must.”
• Use second-person (“you”) to directly engage.
• Include one comparative statement (“better than…”).
• Cite an authority if possible (“experts agree…”).
• End with a confident, forward-looking sentence.
--- END GOAL: Intent ---
`,
      story: `
--- GOAL: Intent ---
• MUST use narrative pacing: build to a small climax.
• Include at least one piece of dialogue or direct quote.
• Employ descriptive scene-setting at start.
• Use temporal connectors (“Then,” “After,” “Meanwhile”).
• Maintain tension by varying sentence length.
• Show, don’t tell—use action verbs over state verbs.
• Introduce a brief conflict or challenge.
• Resolve with a satisfying conclusion.
• Use third person or first person consistently.
• End on a reflective or thought-provoking note.
--- END GOAL: Intent ---
`
    };

    const toneBlocks = {
      neutral: `
--- GOAL: Tone ---
• MUST maintain an impartial, objective tone.
• No emotional or subjective phrasing.
• Use simple declarative sentences.
• Avoid exclamation points and interjections.
• Maintain a flat prosody (no peaks/troughs in style).
• Use minimal adjectives and adverbs.
• Keep personal references to a minimum.
• Avoid rhetorical questions.
• Do not address the reader directly.
• End sentences with a period only.
--- END GOAL: Tone ---
`,
      confident: `
--- GOAL: Tone ---
• MUST use assertive modals (“will,” “must,” “cannot”).
• Avoid qualifiers (“maybe,” “perhaps”).
• Use active voice exclusively.
• Include one emphatic adverb (“undoubtedly,” “clearly”).
• Begin one sentence with a strong adverb (“Indeed,” “Certainly”).
• State benefits as certainties.
• Avoid question formats—use statements.
• Use “I am confident” or “It is clear” phrases.
• Limit subordinate clauses.
• End with a decisive closing statement.
--- END GOAL: Tone ---
`,
      joyful: `
--- GOAL: Tone ---
• MUST use at least two positive interjections (“What fun!”, “How delightful!”).
• Sprinkle upbeat adjectives (cheerful, vibrant).
• Include one exclamation at the end of a joyful sentence.
• Use playful verbs (“dance,” “sparkle,” “bloom”).
• Incorporate one rhetorical flourish (“imagine that!”).
• Avoid negative or neutral terms.
• Use “we” or “us” to foster camaraderie.
• End one paragraph with a smile-inducing image.
• Use alternating sentence lengths for bounce.
• Keep overall cadence light and lively.
--- END GOAL: Tone ---
`,
      friendly: `
--- GOAL: Tone ---
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
--- END GOAL: Tone ---
`
    };

        // 3.5 Domain
    const domainBlocks = {
      academic: `
--- GOAL: Domain ---
• MUST use scholarly vocabulary (“furthermore,” “notwithstanding”).
• Library citations style phrasing (“Smith (2020) reports…”).
• Insert logical connectors between all major ideas.
• Avoid contractions and idioms entirely.
• Use passive voice where objectivity is needed.
• Reference theories or frameworks by name.
• Include one parenthetical citation placeholder.
• Use nominalizations (“evaluation,” “analysis”).
• Maintain formal paragraph structure (topic + support).
• End with a concluding “therefore” statement.
--- END GOAL: Domain ---
`,
      business: `
--- GOAL: Domain ---
• MUST use professional terms (“leverage,” “optimize”).
• Keep sentences concise and outcome-oriented.
• Include one KPI or metric reference (“ROI,” “growth rate”).
• Use bullet-style transition words (“First,” “Next,” “Finally”).
• Frame benefits in cost/savings terms.
• Avoid academic buzzwords.
• Use second person (“you can achieve…”).
• Incorporate corporate action verbs (“execute,” “implement”).
• End with a clear next-step call to action.
• Maintain a confident, solution-focused tone.
--- END GOAL: Domain ---
`,
      technical: `
--- GOAL: Domain ---
• MUST use precise technical terminology without definitions.
• Structure sentences for procedural clarity (steps, sequences).
• Include one example of parameter or variable notation.
• Use active voice for instructions (“Initialize the module”).
• Avoid analogies—stick to literal descriptions.
• Include at least one code-style snippet reference.
• Use consistent units of measure.
• Keep terminology consistent across sentences.
• Reference relevant protocols or standards by acronym.
• End with a verification step suggestion.
--- END GOAL: Domain ---
`,
      creative: `
--- GOAL: Domain ---
• MUST allow stylistic flourishes sparingly.
• Use metaphor or simile only for emphasis.
• Include one vivid sensory metaphor.
• Vary sentence openings for rhythm.
• Break one sentence into a playful fragment.
• Use alliteration or parallel structure once.
• Avoid technical jargon.
• Sprinkle one rhetorical question.
• Maintain imagery without drifting off-topic.
• End with a poetic flourish.
--- END GOAL: Domain ---
`,
      casual: `
--- GOAL: Domain ---
• MUST use everyday language and simple constructions.
• Contractions and colloquialisms are fine.
• Include one light humor phrase (“just saying”).
• Use short, punchy sentences.
• Add a playful emoji description if desired.
• Address reader directly (“hey you!”).
• Avoid formal transitions—use “then,” “so,” “but.”
• End with a question or friendly prompt.
• Keep tone chatty, not scripted.
• Use at least one idiom (“spill the tea”).
--- END GOAL: Domain ---
`
    };

        // Goals extraction
    const {
      audience  = 'default',
      formality = 'default',
      intent    = 'default',
      tone      = 'default',
      domain    = 'default'
    } = goals || {};

    const styleDescriptor = [formality, intent, tone]
      .filter(v => v !== 'default')
      .join(', ');

    const styleSection = stylePrompt(
      styleDescriptor,
      audience !== 'default' ? audience : '',
      domain
    );

    // Sapling API call
    const payload = {
      key: SAPLING_API_KEY,
      text,
      session_id: `grammar_${Date.now()}`,
      auto_apply: true,
      neural_spellcheck: true,
    };

    const { data } = await axios.post(
      'https://api.sapling.ai/api/v1/edits',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const correctedText = data.applied_text || '';
    return res.json({ corrected_text: correctedText });

  } catch (err) {
    console.error('Grammar-check error:', err.response?.data || err.message);
    return res
      .status(500)
      .json({ error: 'Grammar check failed.', details: err.response?.data || err.message });
  }
});

module.exports = router;
