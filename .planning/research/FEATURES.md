# Feature Landscape

**Domain:** Sanskrit text analysis web application for scholars/researchers
**Researched:** 2026-03-06

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy to scholars.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **IAST transliteration** | Standard academic romanization; every serious Sanskrit tool supports it. Scholars read IAST fluently and expect it alongside Devanagari. | Low | Well-understood mapping. Sanscript.js or similar handles this trivially. Multiple encoding schemes exist (IAST, HK, SLP1, ITRANS) but IAST is the scholarly default. |
| **Dictionary lookup (Monier-Williams)** | Monier-Williams is THE reference dictionary for Sanskrit-English. Scholars will not trust meanings without MW grounding. Cologne Digital Sanskrit Dictionaries provides the standard digital dataset. | Medium | Cologne project data is freely available. Apte is a strong secondary source. Challenge is matching inflected forms to dictionary headwords (requires lemmatization). |
| **Sandhi splitting** | Fundamental to reading Sanskrit -- words fuse together via euphonic combination. Every existing Sanskrit NLP tool (Sanskrit Heritage, Samsaadhanii, JNU splitter) provides this. Without it, the app cannot meaningfully analyze text. | High | This is the hardest core feature. Multiple valid segmentations exist for any given string. The Sanskrit Heritage segmenter by Gerard Huet is the gold standard. LLM-based approach (Grok) may work but accuracy must be validated against established tools. Vowel, consonant, and visarga sandhi rules are well-documented but ambiguity resolution is hard. |
| **Morphological analysis (vibhakti/vacana identification)** | Scholars need to know grammatical case, number, gender, tense, mood for every word. Samsaadhanii and Sanskrit Heritage both provide this. Without it, the analysis is superficial. | High | Sanskrit has ~5 million distinct inflected forms across nouns (7 cases x 3 numbers x 3 genders x multiple declension patterns) and verbs (10 lakaaras x 3 persons x 3 numbers x parasmaipada/aatmanepada). LLM may handle common forms but will struggle with rare ones. |
| **Devanagari text input** | Users must be able to paste or type Devanagari text directly, not just upload images. Many scholars already have digital text. | Low | Standard Unicode text input. |
| **Clean, readable output layout** | Scholars need structured, scannable results -- not a wall of JSON or a cluttered interface. Word-by-word breakdown with clear labels for grammatical properties. | Medium | UX design challenge more than technical. Existing tools (Samsaadhanii, Heritage Reader) have functional but dated UIs -- this is an opportunity. |

## Differentiators

Features that set this product apart from existing tools. Not universally expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Image-to-analysis pipeline (OCR + full analysis)** | No existing tool combines OCR and deep linguistic analysis in a single flow. Currently scholars must: (1) OCR separately, (2) copy text, (3) paste into analysis tool. This app eliminates that friction entirely. This is THE primary differentiator. | High | Grok vision API for OCR. Existing Sanskrit OCR tools (i2ocr, SanskritOCR, Sanskrit Research Institute OCR) are standalone and do not chain into analysis. Quality of OCR on printed Devanagari is generally good with modern vision models. |
| **Samasa (compound) decomposition with type classification** | Most tools either skip compound analysis entirely or handle it superficially. Samsaadhanii has a "Samasta-pada-vyutpādikā" but it is not widely accessible or user-friendly. Automated decomposition with type labels (tatpurusha, dvandva, bahuvrihi, etc.) is genuinely rare. | Very High | This is the hardest feature in the entire app. Sanskrit compounds can be deeply nested and semantically ambiguous. Automated decomposition is an active research problem. LLM-based approach may actually outperform rule-based systems here because it can leverage semantic context, but accuracy will vary. Must flag low-confidence decompositions. |
| **Hybrid meanings (dictionary + contextual LLM interpretation)** | No existing tool combines authoritative dictionary definitions with contextual meaning interpretation. Scholars get MW/Apte definitions (trusted) plus LLM-generated contextual meaning (useful for polysemous words in specific passages). | Medium | Dictionary provides ground truth. LLM provides "in this context, this word likely means..." interpretation. Must clearly distinguish between dictionary meaning and contextual interpretation so scholars can evaluate. |
| **Dhatu (verbal root) extraction with gana classification** | Identifying the verbal root and its gana (class 1-10) for every verb form. Useful for pedagogical and research purposes. Available in some tools but not commonly surfaced in a user-friendly way. | Medium | Dhatu databases exist (e.g., Panini's Dhatupatha). Mapping inflected verb forms back to roots requires morphological analysis. The 10 ganas determine conjugation patterns. |
| **Unique word extraction with smart filtering** | Extracting vocabulary from a passage while filtering out common particles (ca, va, tu, hi, eva, api, iti, etc.) that are grammatically important but not lexically interesting for vocabulary study. | Low | Simple post-processing after word extraction. The filtering list is well-defined. |
| **Vocabulary quiz from extracted text** | No existing tool generates quizzes from user-provided text. Brainscape/Quizlet/Anki have generic Sanskrit flashcards but not contextual ones. Generating MCQ quizzes from the actual passage being studied creates a tight study loop. | Medium | Distractor generation is the challenge -- need plausible wrong answers. LLM excels at this. MCQ format (word -> meaning) is simpler than reverse or fill-in-blank. |
| **Modern, scholar-friendly UI** | Existing tools (Samsaadhanii, Heritage Reader, JNU tools) are functional but have dated, academic-tool UIs. A clean, modern interface with good typography for Devanagari is a genuine differentiator in this space. | Medium | Next.js + React enables this. Good Devanagari font rendering, responsive layout, clear visual hierarchy between original text, transliteration, and analysis. |

## Anti-Features

Features to explicitly NOT build. These either dilute focus, are out of scope per PROJECT.md, or are traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User accounts / authentication** | Adds friction, complexity, and privacy concerns. Scholars want quick analysis, not account management. No persistent state needed. | Open-use, no login. Session-based only. |
| **Handwritten/manuscript OCR** | Entirely different problem domain from printed Devanagari OCR. Manuscripts have variable scripts, degradation, abbreviations. Would require specialized training data and models. | Scope to printed Devanagari only. State this clearly in UI. |
| **Full syntactic/semantic parsing** | Automated kaaraka (semantic role) analysis and full sentence parsing is an active research problem. Samsaadhanii attempts this and it is fragile. Overpromising here would damage credibility with scholars. | Provide word-level analysis (morphology, meaning) without claiming sentence-level parsing. |
| **Spaced repetition / progress tracking** | Requires persistent user state, accounts, and a fundamentally different product architecture. Tools like Anki already serve this well. | Simple one-shot MCQ quiz from current passage. No memory between sessions. |
| **Audio pronunciation** | Requires high-quality Sanskrit audio generation or recordings. Separate challenge from text analysis. IAST transliteration already serves pronunciation needs for scholars who can read it. | IAST transliteration only. |
| **Multi-language translation** | Sanskrit-to-English meaning is in scope via dictionary. Full translation is a separate, much harder problem. | Dictionary meanings + contextual interpretation, not translation. |
| **Mobile native app** | Web-first serves the scholar audience. Native mobile adds build complexity for minimal benefit -- scholars work at desks. | Responsive web design that works acceptably on mobile browsers. |
| **Multiple quiz formats** | Reverse quizzes (meaning -> word), fill-in-the-blank, etc. add complexity without proportional value for the core use case. | Word -> meaning MCQ only. |
| **Verse meter analysis** | Interesting for poetry scholars but tangential to the core text analysis pipeline. Separate problem domain. | Out of scope. Could be a future extension. |
| **Collaborative annotation** | Would require user accounts, real-time sync, permissions. Enterprise-level feature for a different product. | Single-user, session-based analysis. |

## Feature Dependencies

```
Image Upload/Capture ──> OCR (Grok Vision) ──> Raw Devanagari Text
                                                      │
                                                      v
                                              Sandhi Splitting ──> Individual Words
                                                                        │
                                        ┌───────────────────────────────┤
                                        │               │              │
                                        v               v              v
                                 IAST Trans-      Morphological   Dictionary
                                 literation       Analysis        Lookup (MW/Apte)
                                                  (vibhakti,           │
                                                   vacana, etc.)       v
                                        │               │         Contextual
                                        │               │         Meaning (LLM)
                                        v               v              │
                                   Samasa          Dhatu              │
                                   Decomposition   Extraction         │
                                                                      │
                                        └───────────┬─────────────────┘
                                                    v
                                            Unique Word
                                            Extraction
                                                    │
                                                    v
                                            Vocabulary Quiz
                                            (MCQ Generation)
```

Key dependency chain:
- **Sandhi splitting is the critical bottleneck.** Everything downstream depends on correct word segmentation.
- **IAST transliteration is independent** -- can be applied at any stage.
- **Dictionary lookup requires lemmatization** -- must map inflected forms to headwords, which depends on morphological analysis.
- **Samasa decomposition depends on sandhi splitting** -- compounds must first be identified as single units before being decomposed.
- **Quiz generation depends on word extraction and meanings** -- needs the full pipeline to have run.

## MVP Recommendation

**Prioritize (Phase 1 -- Core Pipeline):**

1. **Devanagari text input** (paste/type) -- table stakes, low complexity, unblocks everything
2. **Sandhi splitting** -- the critical enabling feature; without it, nothing else works
3. **IAST transliteration** -- low complexity, high value, scholars expect it immediately
4. **Dictionary lookup (Monier-Williams)** -- table stakes for meaning; integrate Cologne data
5. **Basic morphological analysis** -- vibhakti and vacana at minimum

**Prioritize (Phase 2 -- Image Pipeline + Depth):**

6. **Image upload + OCR** -- the primary differentiator, but the text-input path should work first
7. **Hybrid meanings** (dictionary + LLM contextual) -- adds depth to dictionary lookup
8. **Dhatu extraction with gana** -- enriches verb analysis
9. **Samasa decomposition** -- very high complexity, may need iterative improvement

**Prioritize (Phase 3 -- Study Features):**

10. **Unique word extraction with filtering** -- simple post-processing
11. **Vocabulary MCQ quiz** -- depends on full pipeline being stable

**Defer indefinitely:**
- Handwritten OCR: entirely different problem, not the target use case
- Full syntactic parsing: active research problem, risky to promise
- Spaced repetition: different product category

**Rationale:** Build the text analysis pipeline first (input -> split -> analyze -> meanings) because it validates the core value proposition without the OCR complexity. Add image input second -- it is the differentiator but it layers on top of the same analysis pipeline. Quiz is a nice-to-have that only works well once the pipeline is reliable.

## Competitive Landscape Summary

| Tool | Strengths | Gaps This App Fills |
|------|-----------|---------------------|
| **Sanskrit Heritage (Huet)** | Gold-standard segmentation, morphological tagging | No OCR, no compound classification, dated UI, no contextual meanings |
| **Samsaadhanii (UoH)** | Comprehensive toolkit, active research backing | Fragmented tools (not unified pipeline), no OCR, academic UI |
| **Cologne Digital Sanskrit Dictionaries** | Authoritative dictionary data, multiple lexicons | Dictionary only, no analysis pipeline |
| **i2ocr / SanskritOCR** | Functional OCR for Devanagari | OCR only, no linguistic analysis |
| **Brainscape / Quizlet** | Flashcard platforms with Sanskrit content | Generic cards, not generated from user text |
| **Green Message Sanskrit Tools** | Sandhi joining, dictionary lookup | Limited scope, no morphological analysis |

**The gap this app fills:** No existing tool provides an end-to-end pipeline from image capture through OCR, sandhi splitting, morphological analysis, compound decomposition, dictionary + contextual meanings, and vocabulary quizzing in a single, modern interface. Every existing tool covers one or two of these steps and requires scholars to manually chain them together.

## Sources

- [Samsaadhanii - University of Hyderabad](https://sanskrit.uohyd.ac.in/scl/) - Comprehensive Sanskrit computational platform
- [Sanskrit Heritage Platform (Gerard Huet, Inria)](http://gallium.inria.fr/~huet/PUBLIC/Shimla_talk.pdf) - Gold-standard segmenter
- [Cologne Digital Sanskrit Dictionaries](https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/indexcaller.php) - Authoritative Monier-Williams digital edition
- [Learn Sanskrit Online - Tools](https://learnsanskrit.org/tools/) - Sanscript transliteration, OCR, Heritage Site links
- [Sanskrit Research Institute OCR](https://sri.auroville.org/projects/sanskrit-ocr/) - OCR with Google/Tesseract engines
- [Samasa-Karta (IIT Bombay)](https://aclanthology.org/2016.gwc-1.46/) - Compound word generation tool
- [Samsaadhanii Documentation](https://sanskrit.uohyd.ac.in/manual/) - Full feature list of the platform
- [i2ocr Sanskrit OCR](https://www.i2ocr.com/free-online-sanskrit-ocr) - Standalone Sanskrit OCR tool
- [SandhiKosh Benchmark Corpus](https://web.iitd.ac.in/~sumeet/LREC18.pdf) - Sandhi splitting evaluation dataset
