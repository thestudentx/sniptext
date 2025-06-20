// File: server/routes/quillbot2Routes.js

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
    // 🌍 Grab language from body, default to 'en'
    const { text, mode, style, language = 'en' } = req.body;

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
• Do not add any new adjectives, similes, or metaphors unless strictly needed to smooth an awkward phrase; if added, they must be neutral and not introduce new connotations.
• Ensure transitions between sentences are smooth using varied transitional phrases.
• Maintain consistent register with the chosen Style block to avoid tonal mismatches.
• Vary sentence openings to enhance readability and engagement.`;
        break;

      case 'creative':
        modeInstruction = `
Mode: “Creative”
• Rewrite using vivid, imaginative language—select evocative adjectives, use varied sentence lengths, and add descriptive flair.
• Expand metaphorical or sensory detail where appropriate, but do not invent new plot elements, events, or characters.
• Maintain exactly all facts, narrative events, names, dates, and sequence from the original.
• When restructuring sentences, ensure that each sentence’s informational content remains unaltered.
• Use rhetorical devices (e.g., alliteration, parallel structure) sparingly and only to enhance imagery; do not compromise factual accuracy.
• Preserve original paragraph breaks unless combining very short sentences to improve flow; if combining, do not eliminate distinct ideas.
• Employ dynamic pacing to heighten reader engagement without altering meaning.
• Select precise sensory verbs and adjectives to bring scenes to life.
• Introduce subtle figurative language (e.g., mild metaphor or simile) only to underscore key points.
• Adjust sentence rhythm with deliberate variation in length and structure.`;
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
• Ensure consistency in tense usage throughout the document.`;
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
• Verify consistency of terminology and register throughout.`;
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
• Keep sentence length under 20 words when possible.`;
        break;

      case 'expand':
        modeInstruction = `
Mode: “Expand”
• Elaborate on every idea, concept, or example in the original text by adding relevant details, clarifying background information, or providing brief illustrative examples.
• Ensure that any added sentences or clauses directly relate to and deepen understanding of the original content; do not introduce unrelated anecdotes or tangential topics.
• Preserve the original paragraph structure—if you add sentences, place them immediately after the sentence they elaborate on.
• Maintain all original facts, narrative order, names, dates, and events; do not invent new characters or outcomes.
• Use transitional phrases (e.g., “for example,” “in other words,” “furthermore”) to connect additional details smoothly.
• Ensure added content is consistent with the tone implied by the chosen Style block (apply Style only after completing expansion).
• Provide succinct context or definitions for specialized terms or acronyms.
• Illustrate abstract ideas with concise, relevant examples drawn from real-world scenarios.
• Introduce comparative nuances to clarify distinctions between related concepts.
• Emphasize cause-and-effect relationships to enrich comprehension.`;
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
• Do not introduce ellipses (…)—output must be continuous prose, not truncated fragments.
• Prioritize eliminating redundant qualifiers and adverbial phrases.
• Retain key terminology to ensure conceptual integrity.`;
        break;

      case 'grammar':
        modeInstruction = `
Mode: “Grammar”
• Correct all spelling, punctuation, and grammatical errors in the text.
• Maintain original vocabulary, sentence structure, and tone exactly as they are, except for necessary corrections.
• Keep proper nouns, numbers, dates, and original phrasing if grammatically acceptable.
• Fix subject–verb agreement, punctuation (commas, periods, semicolons), and capitalization errors.
• Do not remove or add any words beyond what is required to fix errors—no stylistic changes.
• Preserve paragraph breaks.
• Ensure consistency in variant spellings (e.g., American vs. British conventions).
• Normalize spacing around punctuation marks to standard conventions.`;
        break;

      default: // “standard”
        modeInstruction = `
Mode: “Standard”
• Paraphrase the input clearly and concisely in a thesis‐ready, academically acceptable style.
• Use neutral vocabulary, no slang.
• Maintain narrative flow, factual details, names, dates, and events exactly.
• Ensure paragraphs remain intact and cohesive.
• Do not add extra commentary, examples, or tangents.
• Balance brevity with clarity—avoid overly verbose constructions.
• Retain essential terminology to preserve precise meaning.
• Maintain consistent academic register throughout.`;
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
• Maintain a neutral, impersonal perspective unless original perspective is first person.
• Adhere to corporate style guides for punctuation, capitalization, and formatting.`;
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
• Maintain original meaning, but speak directly (“I guess,” “You know what I mean?”) where appropriate.
• Incorporate rhetorical questions and interjections for engagement.`;
          break;

        case 'professional':
          styleInstruction = `
Style: “Professional”
• Use polished, business‐like language—respectful, direct, and clear.
• Avoid slang or overly academic jargon; choose words that a business audience would find appropriate.
• Use terminology common in professional settings (e.g., “collaborate,” “optimize,” “implement”).
• Do not use contractions if they reduce perceived professionalism (optional: allow “it’s” or “don’t” sparingly only if context demands a lighter tone).
• Maintain a balanced tone—neither too casual nor excessively formal.
• Include clear calls to action or next-step suggestions when relevant.
• Ensure consistency with industry or company style standards.`;
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
• Maintain formal academic register—avoid contractions, slang, or idioms.
• Use hedging language (e.g., “suggests,” “indicates”) to qualify statements appropriately.`;
          break;

        default:
          styleInstruction = `
Style: “Default”
• Apply no additional tone modification beyond the Mode’s instructions.
• Maintain the neutral register provided by the Mode block.`;
          break;
      }
    }

    // Inject Mode & Style blocks
    let finalPrompt = systemPrompt
  .replace('%MODE_INSTRUCTION%', modeInstruction.trim())
  .replace('%STYLE_INSTRUCTION%', styleInstruction.trim());

finalPrompt = `Language: ${language}\n` + finalPrompt; // ✅


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
      return res.status(400).json({ error: 'Invalid input: text required.' });
    }

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

        // 4) Detect & pull user goals
const {
  audience  = 'default',
  formality = 'default',
  intent    = 'default',
  tone      = 'default',
  domain    = 'default'
} = goals || {};

// 5) Build styleSection only if needed
const styleDescriptor = [formality, intent, tone]
  .filter(v => v !== 'default')
  .join(', ');

const styleSection = stylePrompt(
  styleDescriptor,
  audience !== 'default' ? audience : '',
  domain
);

// 6) Assemble finalPrompt
const promptParts = [
  systemPrompt,
  modeInstruction,
  styleSection,
  `--- TEST CHECKS ---\n${testPrompts}`,
  `Now refine this text:\n\n${text}`
].filter(Boolean);

const finalPrompt = promptParts.join('\n\n');

// 7) Log debug info
console.log('User goals:', goals);
console.log('Injected STYLE section:', Boolean(styleSection));
console.log('Final prompt:', finalPrompt);

// 8) Send to Cohere
const messages = [
  { role: 'system', content: finalPrompt },
  { role: 'user',   content: text }
];
const response = await cohere.chat({
  model:       'command-a-03-2025',
  messages,
  temperature: 0.7  
});

// 9) Extract and return
const correctedText = response.message.content[0].text.trim();
return res.json({ corrected_text: correctedText });


  } catch (err) {
    console.error('Grammar-check error:', err);
    return res.status(500).json({ error: 'Grammar check failed.', details: err.message });
  }
});

module.exports = router;