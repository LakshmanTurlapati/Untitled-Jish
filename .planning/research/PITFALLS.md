# Pitfalls Research

**Domain:** Sanskrit text analysis web application (OCR, NLP, morphological analysis)
**Researched:** 2026-03-06
**Confidence:** HIGH (core linguistic pitfalls), MEDIUM (LLM-specific and integration pitfalls)

## Critical Pitfalls

### Pitfall 1: Sandhi Splitting Produces Multiple Valid Decompositions

**What goes wrong:**
A single sandhi-joined string can be split in multiple syntactically correct ways. For example, the same compound word can yield 2-5+ valid decompositions because Sanskrit sandhi transformations are many-to-one mappings. Sanskrit has 48 phonemes producing over 2,000 possible pairwise combinations, and the reverse mapping (splitting) is inherently ambiguous. The system confidently returns one split when several are valid, or worse, returns the wrong one.

**Why it happens:**
Developers treat sandhi splitting as a deterministic function (one input = one output). In reality, sandhi rules produce a many-one mapping from component words to fused forms, so the reverse operation is one-to-many. Without sentential context or dictionary validation, there is no way to choose the correct split mechanically.

**How to avoid:**
- Generate ALL valid splits, then rank them. Use dictionary lookup to verify that each proposed component is a real Sanskrit word.
- Present the top-ranked split to users but allow them to see alternatives. Scholars expect ambiguity -- hiding it destroys trust.
- Use the LLM (Grok) as a contextual disambiguator after rule-based splitting generates candidates, not as the sole splitter.
- Consider the ByT5-Sanskrit model approach: a neural model trained specifically for Sanskrit NLP tasks that handles context-dependent splitting.

**Warning signs:**
- Test with known ambiguous forms early (e.g., "tapovanam" can split as "tapo + vanam" or "tapa + avanam"). If the system only returns one result, the pipeline is hiding ambiguity.
- Scholar users report "incorrect" splits -- this usually means the system picked one valid split but not the contextually correct one.

**Phase to address:**
Core NLP pipeline phase. This is foundational -- build the multi-candidate architecture from day one. Retrofitting ambiguity support into a single-result pipeline requires rewriting the entire downstream chain.

---

### Pitfall 2: LLM Hallucination of Sanskrit Meanings and Grammar

**What goes wrong:**
The LLM (Grok or any model) confidently generates plausible-sounding but incorrect Sanskrit word meanings, incorrect vibhakti identifications, or fabricated dhatu roots. Sanskrit is a low-resource language in LLM training data. LLMs are documented to produce more hallucinations for mid-resource languages than even low-resource ones, and Sanskrit falls in a particularly dangerous zone: enough training data for the model to sound authoritative, not enough for it to be reliable.

**Why it happens:**
Developers trust LLM output because it "sounds right." Sanskrit grammatical terminology is precise (specific vibhakti, vacana, gana), and LLMs will generate terms from the correct vocabulary even when the analysis is wrong. A model might assign "dvitiya vibhakti" to a word that is actually "chaturthi" -- the output looks professional but is incorrect.

**How to avoid:**
- The hybrid meaning system (dictionary base + LLM context) described in PROJECT.md is the correct architecture. Never use LLM as sole source for word meanings -- always ground in Monier-Williams/Apte first.
- For morphological analysis (vibhakti, vacana, dhatu), use rule-based or lookup-table verification. Paninian grammar is fully formalized -- rules exist for every inflection. The LLM should propose, the rule engine should verify.
- Implement a confidence indicator in the UI: "dictionary-verified" vs "AI-interpreted" so scholars can calibrate trust.
- Build a test suite of 50+ known words with verified morphological analyses. Run it against every LLM prompt change.

**Warning signs:**
- The LLM returns dhatu roots that do not appear in the Dhatupatha (the canonical list of ~2,000 verbal roots).
- The LLM assigns vibhaktis that are morphologically impossible for a given word ending.
- Meanings returned for common words differ from Monier-Williams entries.

**Phase to address:**
Must be addressed when building the meaning/analysis pipeline. The dictionary integration phase and the LLM integration phase should be sequential -- dictionary first, LLM second, never the other way around.

---

### Pitfall 3: Unicode Normalization Breaks Devanagari Text Processing

**What goes wrong:**
The same Devanagari text can be represented in multiple ways in Unicode (NFC vs NFD forms), and conjunct consonants formed via virama (U+094D) can be stored as different code point sequences that look identical on screen. String comparison, dictionary lookup, and deduplication silently fail because two visually identical strings have different byte representations.

**Why it happens:**
JavaScript/TypeScript string operations compare code points, not visual glyphs. A word like "karma" in Devanagari might arrive from OCR in NFD form (decomposed) while the dictionary stores it in NFC form (precomposed). The lookup returns "word not found" even though both representations render identically. Additionally, nukta characters (combining class 7) and cantillation marks (combining class 1) can be reordered by normalization in unexpected ways.

**How to avoid:**
- Normalize ALL text to NFC immediately upon ingestion -- after OCR extraction, before any processing. Use a single normalization function at the entry point.
- Normalize dictionary data at load time to the same form.
- Write explicit tests comparing OCR output normalization against dictionary entry normalization.
- Be aware that some conjuncts in Devanagari do not have precomposed Unicode representations and are formed using virama sequences. These must not be split by text processing operations.

**Warning signs:**
- Dictionary lookups return "not found" for common words.
- Duplicate words appear in the "unique words" list that look identical visually.
- String length differs from expected character count (a sign of decomposed vs precomposed forms).

**Phase to address:**
OCR integration phase. Normalization must be the very first post-processing step after text extraction, before anything else touches the text.

---

### Pitfall 4: Samasa (Compound) Decomposition is Recursive and Unbounded

**What goes wrong:**
Sanskrit compounds can be nested to arbitrary depth. A single compound word might contain 3-5 levels of composition, each requiring its own decomposition and sandhi resolution. Systems that handle only one level of decomposition miss the inner structure. Worse, the relation between compound components is not encoded in the compound itself -- you need semantic knowledge to determine if a tatpurusha compound means "X of Y," "X for Y," or "X by Y."

**Why it happens:**
Developers build a flat decomposition step: take compound, split into two parts, done. But the parts themselves may be compounds. Additionally, determining the samasa type (tatpurusha vs bahuvrihi vs dvandva, etc.) requires semantic understanding that cannot be derived from morphology alone. The same compound form can be classified as different samasa types depending on intended meaning.

**How to avoid:**
- Build recursive decomposition from the start. Each decomposition result should be checked: "Is this component itself a compound?"
- Use dictionary lookup as a termination condition: if a component is a standalone dictionary word, stop decomposing.
- For samasa type classification, use the LLM with the full sentence context. This is one area where LLM contextual understanding adds genuine value over rules.
- Display the decomposition tree to users, not just the final leaves. Scholars care about the structure, not just the components.

**Warning signs:**
- Long compound words (4+ syllables) produce only two components.
- The system identifies samasa type inconsistently for the same compound in different contexts (which may actually be correct -- flag for user review rather than hiding).

**Phase to address:**
NLP pipeline phase, after sandhi splitting is working. Samasa decomposition depends on sandhi rules (compounds undergo sandhi at component boundaries), so sandhi must be solid first.

---

### Pitfall 5: Grok Vision API Returns Plausible but Incorrect Devanagari Characters

**What goes wrong:**
Vision/OCR APIs confuse visually similar Devanagari characters. Common confusions include: (sha) vs (sa), (ba) vs (va) -- a historically notorious pair even for human readers, conjunct consonants misread as separate characters or vice versa, and matra (vowel sign) misplacement or omission. The API returns valid Devanagari text that is wrong, and there is no error signal -- just silently incorrect text flowing into the analysis pipeline.

**Why it happens:**
LLM vision models are not specifically trained on Sanskrit texts. They handle Hindi well (high-resource) but Sanskrit uses the same script with different vocabulary, different compound structures, and sometimes different orthographic conventions. The model's language prior may "correct" unusual (but valid) Sanskrit word forms to more common Hindi words. There are no published benchmarks for Grok's accuracy specifically on Sanskrit Devanagari.

**How to avoid:**
- Implement a post-OCR validation step: check extracted words against a Sanskrit dictionary. Flag words with no dictionary match for user review.
- Show the original image alongside extracted text so users can spot-check OCR accuracy.
- Consider a two-pass approach: Grok vision for extraction, then a focused prompt asking the model to verify specific uncertain characters with the image region highlighted.
- Build a confusion matrix of commonly misread characters and apply targeted post-processing corrections.
- Prompt engineering matters enormously: explicitly tell the model "this is Sanskrit text in Devanagari, not Hindi" to shift its language prior.

**Warning signs:**
- High percentage of extracted words not found in Sanskrit dictionaries.
- Users report specific character substitution patterns repeatedly.
- Hindi-like forms appearing where Sanskrit forms are expected (e.g., short vowels where Sanskrit would use long vowels).

**Phase to address:**
OCR/image processing phase. This is the first phase and must include validation infrastructure from the start, since every downstream analysis depends on correct text extraction.

---

### Pitfall 6: Vedic Sanskrit Texts Break the Classical Sanskrit Pipeline

**What goes wrong:**
A user uploads a Vedic text (Rigveda, Yajurveda, etc.) and the system either crashes, produces garbage analysis, or silently applies Classical Sanskrit rules that are incorrect for Vedic forms. Vedic Sanskrit has pitch accent markers (udatta, anudatta, svarita) rendered as additional diacritics in Devanagari, different grammatical forms (subjunctive mood, more verb tenses), and different sandhi rules in some cases.

**Why it happens:**
The project scopes "printed Devanagari text" without distinguishing Vedic from Classical. Developers build and test against Classical Sanskrit examples, then Vedic texts arrive with accent markers that the OCR misreads, the parser cannot handle, and the morphological analyzer does not recognize.

**How to avoid:**
- Make an explicit decision: support Classical Sanskrit only in v1, and detect/reject Vedic texts with a clear message, OR plan Vedic support as a separate phase.
- Implement Vedic text detection: look for accent markers (specific Unicode code points for Vedic tone marks in the Devanagari Extended block, U+1CD0-U+1CFF). If detected, route to a Vedic-specific pipeline or display a "Vedic text detected -- limited analysis available" message.
- Do not silently apply Classical rules to Vedic text. Wrong analysis is worse than no analysis for the scholar audience.

**Warning signs:**
- OCR output contains unusual combining marks or characters outside the standard Devanagari range (U+0900-U+097F).
- Morphological analysis fails systematically on certain texts (likely Vedic forms).
- Users report verb forms the system cannot parse (Vedic subjunctive, injunctive moods).

**Phase to address:**
Should be scoped in the project planning phase and explicitly noted as out-of-scope or deferred. Detection logic should go into the OCR phase as a guard.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| LLM-only sandhi splitting (no rule engine) | Faster to build, no grammar encoding needed | Unreliable results, no explainability, impossible to debug specific failures | Never for a scholar-facing tool |
| Hardcoded dictionary data (JSON dump vs API/DB) | Simpler initial setup | Cannot update dictionary, no cross-referencing between MW and Apte, memory bloat | MVP only, migrate to indexed DB before launch |
| Single OCR pass without validation | Simpler pipeline, fewer API calls | Silent errors propagate through entire analysis chain | Never -- always validate OCR output |
| Storing analysis results as flat text instead of structured AST | Easier to render in UI | Cannot support recursive samasa display, tree views, or re-analysis | Early prototype only |
| Skipping Unicode normalization | "It works in my tests" | Breaks in production with real-world OCR output, different text sources | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Grok Vision API | Sending full-page images and expecting perfect extraction | Crop to text regions first; use high-resolution images; specify Sanskrit in the prompt; implement chunking for large texts |
| Cologne Digital Sanskrit Lexicon (CDSL) | Assuming a clean REST API exists with full coverage | CDSL APIs are academic projects, not production services. Use PyCDSL or download the XML/JSON data dumps locally. The API may have rate limits, downtime, or format changes. Self-host the dictionary data. |
| IAST Transliteration | Using a simple character mapping table | IAST requires handling of inherent 'a' vowel in consonants, proper virama handling, correct representation of conjuncts, and case sensitivity for proper nouns. Use an established library (sanscript.js, indic-transliteration) rather than rolling your own. |
| Monier-Williams Dictionary | Looking up inflected forms directly | MW entries use stem forms (pratipadika). You must reduce inflected forms to stems before lookup. This requires morphological analysis before dictionary access -- creating a dependency ordering constraint. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Generating all possible sandhi splits exhaustively | Exponential blowup for long compounds; 10+ second response times | Limit split depth, prune impossible splits via dictionary validation early, cache common splits | Compounds longer than 4-5 components (common in philosophical texts) |
| Loading full Monier-Williams dictionary into memory | 500MB+ memory usage, slow cold start | Use an indexed database (SQLite) or trie structure for prefix-based lookup. Load lazily. | Immediately in serverless/edge environments; at scale with multiple concurrent users |
| Per-word LLM API calls for meaning/analysis | API rate limits hit, 30+ second page analysis times, high cost | Batch words into single LLM calls. Send full context (sentence/verse) with all words at once rather than word-by-word. Cache LLM responses for repeated words. | More than 20 words per text (a single verse is typically 10-30 words) |
| Rendering complex analysis trees in the browser | DOM explosion with deeply nested samasa decomposition, slow re-renders | Virtualize or collapse deep trees by default. Use efficient rendering (no deep React nesting). | Texts with 50+ unique words, compounds nested 3+ levels deep |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passing unsanitized OCR output to LLM prompts | Prompt injection via crafted images -- an image could contain text that manipulates the LLM prompt | Sanitize OCR output before including in LLM prompts. Treat OCR text as untrusted user input. Use structured prompt templates with clear delimiters. |
| Exposing Grok API key in client-side code | API key theft, unauthorized usage billed to your account | All LLM/API calls must go through your server-side API route (Next.js API routes). Never expose the key to the browser. |
| No rate limiting on image upload endpoint | Abuse via large image uploads, API cost amplification (each upload triggers OCR + LLM calls) | Implement rate limiting per IP, file size limits, and request throttling on the upload endpoint. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing only one sandhi split without alternatives | Scholars distrust the tool because they know multiple splits exist | Show primary split with "N alternatives" expandable. Scholars want to see the tool is aware of ambiguity. |
| Displaying IAST without Devanagari (or vice versa) | Forces context-switching; scholars work in both scripts | Show both side by side. Let users toggle primary display but always make both accessible. |
| Flat word list without grammatical grouping | Scholars must mentally reconstruct sentence structure | Group analysis by sentence/verse unit. Show words in context, not as an isolated alphabetical list. |
| Blocking UI during long analysis | Users think the app crashed on large texts | Stream results progressively. Show OCR output first, then add analysis incrementally. Provide clear progress indication. |
| Quiz using LLM-generated wrong options that are implausible | Quiz becomes trivially easy because wrong answers are obviously wrong | Generate distractors from semantically related dictionary entries (same semantic field, similar vibhakti forms) rather than random words. |

## "Looks Done But Isn't" Checklist

- [ ] **Sandhi splitting:** Often missing visarga sandhi rules (the rarest type) -- verify with visarga-heavy texts (Bhagavad Gita ch1)
- [ ] **IAST transliteration:** Often missing chandrabindu/anusvara distinction -- verify with nasal-heavy words
- [ ] **Dictionary lookup:** Often missing sandhi between prefix (upasarga) and dhatu -- verify "prakaroti" resolves to pra + karoti, not searched as a single stem
- [ ] **Samasa classification:** Often returns "tatpurusha" as default for everything -- verify with known bahuvrihi and dvandva examples
- [ ] **Vibhakti identification:** Often correct for singular but fails for dual number (dvivacana) -- verify with dual forms
- [ ] **OCR accuracy:** Often "works" on clean typed text but fails on scanned book pages with yellowed paper, tight margins, or small fonts -- verify with actual book scans
- [ ] **Unique word extraction:** Often counts inflected forms as different words -- verify that "ramasya" and "ramam" both map to "rama"
- [ ] **Common word filtering:** Often removes legitimate uses of particles -- verify that "ca" as a meaningful conjunction in a verse is not silently dropped when it matters for analysis

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong Unicode normalization deployed | LOW | Add normalization at ingestion point, re-process any cached/stored text. No data loss since original images are preserved. |
| LLM hallucinations discovered in production | MEDIUM | Add dictionary-verification layer, flag unverified analyses in UI, rebuild affected cached results. Requires auditing existing outputs. |
| Flat samasa decomposition (no recursion) | HIGH | Requires restructuring the data model from flat list to tree, rewriting analysis pipeline and UI components. Build recursive from day one. |
| No OCR validation layer | MEDIUM | Add post-OCR dictionary check, but must also add UI for user correction and re-analysis trigger. Downstream cached analyses may need invalidation. |
| Single-split sandhi pipeline | HIGH | Rewrite to multi-candidate architecture affects data model, ranking logic, UI display, and all downstream consumers. This is effectively a rewrite of the core pipeline. |
| Dictionary loaded in-memory (OOM in production) | MEDIUM | Migrate to SQLite or similar indexed store. Requires changing all lookup interfaces. Can be done incrementally. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Sandhi split ambiguity | Core NLP pipeline (build multi-candidate from start) | Test suite with 20+ known ambiguous forms, verify multiple results returned |
| LLM hallucination | Meaning/analysis pipeline (dictionary first, LLM second) | Compare LLM output against MW for 50+ common words, measure agreement rate |
| Unicode normalization | OCR integration (normalize at ingestion) | Unit tests comparing OCR output bytes with dictionary entry bytes for 100+ words |
| Samasa recursion | NLP pipeline (tree data model from start) | Test with known 3+ level compounds, verify full decomposition tree |
| Grok OCR accuracy | OCR phase (validation + user review) | Character-level accuracy measurement on 10+ scanned pages, per-character confusion tracking |
| Vedic text handling | Project scoping / OCR phase (detection guard) | Upload Vedic text samples, verify graceful handling (rejection or warning) |
| Dictionary lookup of inflected forms | Morphological analysis phase (stem reduction before lookup) | Test lookup of 50+ inflected forms, verify stem resolution |
| Performance with batched LLM calls | API integration phase | Measure end-to-end time for full verse analysis, target under 5 seconds |

## Sources

- [Review on Sanskrit Sandhi Splitting using Deep Learning](https://irojournals.com/itdw/article/pdf/6/2/3) -- sandhi ambiguity and splitting challenges
- [ByT5-Sanskrit: A Unified Model for Sanskrit NLP Tasks](https://arxiv.org/html/2409.13920v1) -- neural approaches to Sanskrit NLP
- [Why Extracting Hindi Text from PDFs Is Harder Than English](https://digitalorientalist.com/2025/12/02/why-extracting-hindi-text-from-pdfs-is-so-much-harder-than-english-and-how-you-can-do-it/) -- Devanagari OCR challenges
- [Tesseract Devanagari Accuracy Issues](https://github.com/tesseract-ocr/tesseract/issues/716) -- OCR-specific problems
- [UAST: Unicode Aware Sanskrit Transliteration](https://arxiv.org/html/2203.14277) -- transliteration edge cases
- [Unicode Normalization and Grapheme Parsing of Indic Scripts](https://aclanthology.org/2024.lrec-main.1479.pdf) -- NFC/NFD issues with Devanagari
- [Issues in Devanagari Cluster Validation (Unicode Consortium)](https://www.unicode.org/L2/L2021/21112-deva-cluster-valid.pdf) -- virama and conjunct problems
- [Towards Accent-Aware Vedic Sanskrit OCR](https://aclanthology.org/2025.wsc-csdh.5.pdf) -- Vedic vs Classical OCR challenges
- [Vibhakti Identification Techniques for Sanskrit](https://www.ijert.org/research/vibhakti-identification-techniques-for-sanskrit-IJERTCONV3IS01045.pdf) -- morphological analysis challenges
- [A Survey on Sanskrit Computational Linguistics and Digital Resources](https://dl.acm.org/doi/pdf/10.1145/3729530) -- comprehensive survey of the field
- [C-SALT APIs for Sanskrit Dictionaries](https://cceh.github.io/c-salt_sanskrit_data/) -- CDSL API documentation
- [PyCDSL: Python Interface to CDSL](https://github.com/hrishikeshrt/PyCDSL) -- dictionary integration approach
- [LLM Translation Hallucination Index 2026](https://www.analyticsinsight.net/llm/llm-translation-hallucination-index-2026-which-models-add-drop-or-rewrite-meaning-most-ranked) -- LLM hallucination rates for translation tasks
- [Hallucinations in Large Multilingual Translation Models](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00615/118716/Hallucinations-in-Large-Multilingual-Translation) -- hallucination patterns in low-resource languages

---
*Pitfalls research for: Sanskrit text analysis web application*
*Researched: 2026-03-06*
