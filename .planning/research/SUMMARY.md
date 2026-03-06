# Project Research Summary

**Project:** Sanskrit Text Analyzer
**Domain:** Sanskrit NLP web application (OCR, morphological analysis, dictionary lookup)
**Researched:** 2026-03-06
**Confidence:** MEDIUM-HIGH

## Executive Summary

The Sanskrit Text Analyzer is an end-to-end web pipeline that takes printed Devanagari text (via image or direct input), performs deep linguistic analysis (sandhi splitting, compound decomposition, morphological tagging, dictionary lookup with contextual meanings), and optionally generates vocabulary quizzes. No existing tool covers this full pipeline in a single modern interface -- scholars currently chain 3-4 separate tools manually. The recommended approach is a pipeline-oriented Next.js monolith using Grok (xAI) as the LLM backbone for OCR and linguistic analysis, with embedded SQLite dictionaries (Monier-Williams, Apte) providing ground-truth meaning verification. The all-TypeScript stack avoids a Python sidecar entirely, since the available Python Sanskrit NLP libraries are stale and unreliable.

The core technical risk is LLM accuracy on Sanskrit-specific tasks. Sanskrit is a low-resource language in LLM training data, sitting in a dangerous zone where models sound authoritative but produce incorrect grammatical analyses. The mitigation strategy is a hybrid architecture: LLM proposes analyses, dictionary and rule-based checks verify them, and the UI clearly distinguishes "dictionary-verified" from "AI-interpreted" results. Sandhi splitting is the single hardest problem and the critical bottleneck -- it must support multiple candidate decompositions from day one, because retrofitting ambiguity handling later requires a full pipeline rewrite.

The second major risk is OCR accuracy on Sanskrit Devanagari specifically (not Hindi). Grok Vision has no published Sanskrit benchmarks, and its language prior may "correct" valid Sanskrit forms to more common Hindi words. A post-OCR validation step with dictionary checking and user review is mandatory. Build the text-input analysis pipeline first to validate the core value proposition without OCR complexity, then layer image input on top.

## Key Findings

### Recommended Stack

The stack is a pure TypeScript/Node.js monolith on Next.js 16 with App Router. No Python backend needed. See [STACK.md](./STACK.md) for full details.

**Core technologies:**
- **Next.js 16 + React 19:** Full-stack framework with Server Components for dictionary lookups and Server Actions for the analysis pipeline. Standalone output for Fly.io Docker deployment.
- **Vercel AI SDK 6 + @ai-sdk/xai:** LLM integration with structured output (generateObject with Zod schemas), streaming, and provider-agnostic design. Swap to Anthropic or Google with one import change if Grok underperforms.
- **better-sqlite3:** Embedded SQLite for Monier-Williams and Apte dictionary data. Zero-latency lookups, no external dependency. Pre-load from Cologne Digital Sanskrit Lexicon XML at build time.
- **@indic-transliteration/sanscript:** IAST/Devanagari transliteration. Pure JS, runs client or server, handles all major encoding schemes.
- **shadcn/ui + Tailwind CSS v4:** Accessible UI components with clean typography for Devanagari rendering.
- **Zod:** Schema validation for LLM structured output, dictionary entries, and the central AnalysisResult data structure.

**Critical version note:** Tailwind v4 uses CSS-first config (no tailwind.config.js). Use `tw-animate-css` instead of deprecated `tailwindcss-animate`.

**Cost estimate:** ~$0.04 per full text analysis at current Grok pricing. 1000 daily analyses = ~$40/month.

### Expected Features

See [FEATURES.md](./FEATURES.md) for full analysis and competitive landscape.

**Must have (table stakes):**
- Devanagari text input (paste/type)
- IAST transliteration (scholarly standard)
- Sandhi splitting (fundamental to reading Sanskrit)
- Morphological analysis (vibhakti, vacana identification)
- Dictionary lookup (Monier-Williams is non-negotiable for scholar trust)
- Clean, structured output layout

**Should have (differentiators):**
- Image-to-analysis pipeline (OCR + full analysis in one flow) -- THE primary differentiator, no existing tool does this
- Samasa decomposition with type classification -- rare in existing tools, genuinely valuable
- Hybrid meanings (dictionary + LLM contextual interpretation) -- unique combination
- Dhatu extraction with gana classification
- Vocabulary MCQ quiz from analyzed text

**Defer (v2+):**
- Handwritten/manuscript OCR (entirely different problem)
- Full syntactic/semantic parsing (active research problem, risky to promise)
- Spaced repetition / progress tracking (different product category)
- Audio pronunciation, verse meter analysis, collaborative annotation

### Architecture Approach

A pipeline-oriented monolith within Next.js App Router. The app is a strictly linear processing pipeline (image -> text -> sandhi split -> samasa decompose -> morphological analysis -> dictionary + contextual meaning -> display -> quiz) with no persistent user state. All analysis runs server-side via Server Actions. See [ARCHITECTURE.md](./ARCHITECTURE.md) for component boundaries, data flow diagrams, and the central AnalysisResult TypeScript interface.

**Major components:**
1. **Image Input + OCR Service** -- capture/upload image, extract Devanagari via Grok Vision, normalize Unicode (NFC)
2. **Analysis Pipeline Orchestrator** -- coordinates sequential stages: sandhi splitting, samasa decomposition, morphological analysis
3. **Sandhi Splitter** -- LLM-based with multi-candidate output, dictionary-verified ranking
4. **Samasa Decomposer** -- recursive compound decomposition with type classification (tatpurusha, dvandva, bahuvrihi, etc.)
5. **Morphological Analyzer** -- vibhakti, vacana, linga, dhatu, gana identification per word
6. **Dictionary Lookup** -- embedded SQLite (MW + Apte), stem-form resolution from inflected forms
7. **Contextual Meaning Generator** -- LLM contextual interpretation, clearly labeled as AI-interpreted
8. **Results Display** -- progressive disclosure UI (sentence overview -> word card -> expanded morphology)
9. **Quiz Generator + UI** -- MCQ from analyzed vocabulary with semantically plausible distractors

**Key patterns:** LLM-as-analyst with structured output, progressive streaming UI (10-30s pipeline needs incremental results), pipeline stage caching via in-memory LRU.

### Critical Pitfalls

See [PITFALLS.md](./PITFALLS.md) for full analysis with recovery strategies.

1. **Sandhi splitting ambiguity** -- Sanskrit sandhi is many-to-one; reverse splitting is one-to-many. Must generate ALL valid splits and rank them. Build multi-candidate architecture from day one -- retrofitting costs a full pipeline rewrite.
2. **LLM hallucination of Sanskrit grammar** -- Grok will confidently assign wrong vibhaktis, fabricate dhatu roots, and generate plausible but incorrect meanings. Always ground in dictionary first, use LLM second. Implement confidence indicators in UI.
3. **Unicode normalization (NFC/NFD)** -- Same Devanagari text can have different byte representations. Normalize to NFC at ingestion, before any processing. Dictionary data must match. Failure causes silent lookup misses.
4. **Samasa recursion** -- Compounds nest arbitrarily deep. Build recursive tree decomposition from the start, not flat two-part splitting. Use dictionary lookup as termination condition.
5. **Grok OCR Hindi bias** -- Vision model may "correct" valid Sanskrit to Hindi forms. Explicitly prompt "Sanskrit, not Hindi." Implement post-OCR dictionary validation and user review step.
6. **Vedic Sanskrit** -- Classical Sanskrit pipeline will produce garbage on Vedic texts. Detect Vedic accent markers (U+1CD0-U+1CFF) and show a clear warning. Scope to Classical only in v1.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Project Foundation and Text Input Pipeline

**Rationale:** Every downstream feature depends on the core project scaffolding, text input, transliteration, and dictionary infrastructure. These have zero external dependencies on each other and can be built in parallel within the phase. The embedded SQLite dictionary is the verification backbone for all later LLM output -- it must exist before any LLM analysis is integrated.

**Delivers:** Working Next.js app with Devanagari text input, IAST transliteration, and dictionary lookup by stem form. The foundational data structures (AnalysisResult, WordAnalysis, etc.) are defined.

**Addresses features:** Devanagari text input, IAST transliteration, dictionary lookup (MW + Apte), clean UI scaffold

**Avoids pitfalls:** Unicode normalization (establish NFC at ingestion from the start), dictionary stem-form resolution (solve inflected-form-to-headword mapping early)

### Phase 2: Core NLP Analysis Pipeline

**Rationale:** Sandhi splitting is the critical bottleneck -- everything downstream depends on it. This phase builds the LLM-based analysis pipeline with the multi-candidate architecture that PITFALLS.md identifies as mandatory-from-day-one. Dictionary verification from Phase 1 is used to rank sandhi candidates and catch LLM hallucinations.

**Delivers:** Text in -> sandhi split (multi-candidate, ranked) -> morphological analysis (vibhakti, vacana, dhatu, gana) -> hybrid meanings (dictionary + contextual LLM). Streaming results display.

**Addresses features:** Sandhi splitting, morphological analysis, hybrid meanings, dhatu extraction with gana

**Avoids pitfalls:** Single-split sandhi pipeline (multi-candidate from start), LLM hallucination (dictionary-first verification), synchronous blocking (streaming progressive results)

### Phase 3: Compound Analysis and Advanced NLP

**Rationale:** Samasa decomposition depends on sandhi splitting being solid and requires the recursive tree data model. This is the highest-complexity feature and the phase most likely to need iterative improvement. Vedic text detection guard also belongs here.

**Delivers:** Recursive samasa decomposition with type classification, compound tree display, Vedic text detection with graceful degradation message.

**Addresses features:** Samasa decomposition (tatpurusha, dvandva, bahuvrihi, avyayibhava, karmadharaya, dvigu)

**Avoids pitfalls:** Flat samasa decomposition (recursive tree from start), Vedic text breakage (detection guard)

### Phase 4: Image Input and OCR Pipeline

**Rationale:** OCR is the primary differentiator but layers on top of the text analysis pipeline. Building it after Phase 2-3 means the analysis pipeline is validated and stable before adding OCR complexity. OCR errors are easier to diagnose when you trust the downstream pipeline.

**Delivers:** Image capture/upload, Grok Vision OCR, post-OCR validation with dictionary checking, user correction UI, full image-to-analysis flow.

**Addresses features:** Image capture/upload, high-accuracy OCR, post-OCR validation

**Avoids pitfalls:** Grok OCR Hindi bias (explicit Sanskrit prompting + dictionary validation), silent OCR errors (user review step), Unicode normalization on OCR output

### Phase 5: Word Extraction and Vocabulary Quiz

**Rationale:** Quiz generation depends on the full pipeline being stable and producing reliable word analyses. This is a "nice-to-have" layer that only works well once the core is solid. Low risk, medium complexity.

**Delivers:** Unique word extraction with particle filtering, MCQ quiz generation with semantically plausible distractors, quiz UI with scoring.

**Addresses features:** Unique word extraction with filtering, vocabulary MCQ quiz

**Avoids pitfalls:** Trivial quiz distractors (generate from semantically related dictionary entries, not random words)

### Phase 6: Polish, Performance, and Production Hardening

**Rationale:** Caching, rate limiting, error handling, and production deployment concerns. Apply learnings from earlier phases.

**Delivers:** LRU caching for dictionary and LLM results, rate limiting on upload endpoint, API key security, Fly.io deployment optimization, batched LLM calls for performance.

**Avoids pitfalls:** Per-word LLM API calls (batch), API key exposure (server-side only), rate limiting abuse

### Phase Ordering Rationale

- **Foundation before analysis:** Dictionary infrastructure must exist before LLM integration because dictionary verification is the hallucination mitigation strategy. Building LLM analysis first without dictionary grounding will produce unverifiable results.
- **Text input before OCR:** Validating the analysis pipeline on clean text input isolates NLP issues from OCR issues. When OCR is added, any failures can be attributed to OCR rather than pipeline bugs.
- **Sandhi before samasa:** Samasa decomposition depends on sandhi rules (compounds undergo sandhi at component boundaries). The sandhi splitter must be reliable before compound analysis can work.
- **Multi-candidate sandhi from day one:** PITFALLS.md rates retrofitting single-split to multi-candidate as HIGH recovery cost. The data model, ranking logic, UI display, and all downstream consumers would need rewriting.
- **Quiz last:** Depends on the entire pipeline being stable. Can be developed with mock data in parallel but should not be prioritized over core analysis quality.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core NLP Pipeline):** Sandhi splitting prompt engineering is critical and under-documented for LLM-based approaches. Need to validate Grok's accuracy on Sanskrit morphological analysis with a test suite. The multi-candidate ranking algorithm needs design work.
- **Phase 3 (Compound Analysis):** Samasa decomposition is an active research problem. LLM accuracy on compound type classification is unknown. May need iterative prompt refinement.
- **Phase 4 (OCR Pipeline):** No published benchmarks for Grok Vision on Sanskrit Devanagari. Need to build a character-level accuracy baseline early. Post-OCR validation workflow needs UX design.

Phases with standard patterns (skip deep research):
- **Phase 1 (Foundation):** Next.js setup, SQLite integration, transliteration library wrapping -- all well-documented, established patterns.
- **Phase 5 (Quiz):** MCQ generation is straightforward. Distractor generation from dictionary neighbors is a solved problem.
- **Phase 6 (Polish):** Standard production hardening patterns for Next.js on Fly.io.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are well-documented, actively maintained, and appropriate for the use case. The all-TypeScript decision is well-justified. Version requirements are current. |
| Features | HIGH | Feature landscape is thoroughly mapped against competitive tools. Table stakes vs differentiators are clearly distinguished. Anti-features are well-reasoned. |
| Architecture | MEDIUM-HIGH | Pipeline pattern is sound and appropriate. Data structures are well-designed. The reliance on LLM for all morphological analysis is the main uncertainty -- accuracy is unproven for Sanskrit specifically. |
| Pitfalls | HIGH | Comprehensive coverage of linguistic, technical, and UX pitfalls. Recovery costs are honestly assessed. The "build multi-candidate sandhi from day one" recommendation is critical and well-argued. |

**Overall confidence:** MEDIUM-HIGH

The stack, features, and architecture are solid. The primary uncertainty is LLM accuracy on Sanskrit-specific NLP tasks (sandhi splitting, morphological analysis, samasa decomposition). This is an inherent risk of the LLM-based approach but is mitigated by dictionary verification and user-facing confidence indicators.

### Gaps to Address

- **Grok Sanskrit accuracy baseline:** No published benchmarks exist. Must build a test suite of 50+ known Sanskrit analyses and measure Grok's accuracy before committing to prompt strategies. Do this in Phase 2 planning.
- **Dictionary data pipeline:** The exact format and parsing approach for Cologne Digital Sanskrit Lexicon XML into SQLite needs prototyping. The data is ~280K entries in SLP1 encoding. Validate the build-time parse pipeline early in Phase 1.
- **Inflected-form-to-stem resolution:** Dictionary lookup requires reducing inflected forms to stems (pratipadika) before searching. This is a chicken-and-egg problem with morphological analysis. Need a strategy -- potentially a suffix-stripping heuristic or a separate LLM call for lemmatization.
- **C-SALT API reliability:** Architecture uses embedded SQLite (correct decision) but ARCHITECTURE.md also references C-SALT REST API as a fallback. Clarify: is C-SALT needed at all if dictionary data is bundled locally? Recommendation: bundle locally, drop C-SALT dependency entirely.
- **Streaming UX for 10-30s pipeline:** The progressive streaming pattern is recommended but the exact implementation (Suspense boundaries, Server-Sent Events, or React Server Components streaming) needs prototyping during Phase 2.

## Sources

### Primary (HIGH confidence)
- [xAI API Documentation](https://docs.x.ai/overview) -- models, pricing, vision capabilities
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) -- AI SDK 6 features, xAI provider
- [Next.js Releases](https://github.com/vercel/next.js/releases) -- v16 stable features
- [sanskrit-lexicon/MWS GitHub](https://github.com/sanskrit-lexicon/MWS) -- Monier-Williams dictionary data
- [@indic-transliteration/sanscript npm](https://www.npmjs.com/package/@indic-transliteration/sanscript) -- transliteration library
- [better-sqlite3 npm](https://www.npmjs.com/package/better-sqlite3) -- SQLite for Node.js
- [Cologne Digital Sanskrit Dictionaries](https://www.sanskrit-lexicon.uni-koeln.de/) -- authoritative dictionary data

### Secondary (MEDIUM confidence)
- [ACM Survey on Sanskrit Computational Linguistics](https://dl.acm.org/doi/pdf/10.1145/3729530) -- comprehensive field survey
- [ByT5-Sanskrit](https://arxiv.org/html/2409.13920v1) -- neural Sanskrit NLP approaches
- [Sanskrit Heritage Platform (Inria)](https://sanskrit.inria.fr/) -- gold-standard segmenter (reference, not dependency)
- [Samsaadhanii (University of Hyderabad)](https://sanskrit.uohyd.ac.in/scl/) -- comprehensive Sanskrit tools (reference)
- [Unicode Normalization for Indic Scripts](https://aclanthology.org/2024.lrec-main.1479.pdf) -- NFC/NFD issues
- [LLM Hallucination in Multilingual Translation](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00615/118716/) -- hallucination patterns

### Tertiary (LOW confidence)
- Grok accuracy on Sanskrit Devanagari OCR -- no published benchmarks, needs empirical validation
- LLM-based sandhi splitting accuracy -- no academic evaluation of this approach, needs test suite validation
- Samasa decomposition via LLM -- active research area, accuracy unknown

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*
