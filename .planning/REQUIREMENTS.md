# Requirements: Sanskrit Text Analyzer

**Defined:** 2026-03-06
**Core Value:** Accurate extraction and deep grammatical analysis of Sanskrit text from images — sandhi splitting, samasa decomposition, and morphological breakdown must be linguistically correct.

## v0.1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Image & Input

- [ ] **INPUT-01**: User can paste or type Devanagari text directly into the app
- [ ] **INPUT-02**: User can upload an image of printed Devanagari text
- [ ] **INPUT-03**: App extracts Sanskrit text from uploaded image via Grok vision API with high accuracy

### Sanskrit Analysis

- [ ] **ANAL-01**: App splits sandhi junctions (vowel, consonant, visarga) into individual words
- [ ] **ANAL-02**: App identifies vibhakti (case), vacana (number), and linga (gender) for each word
- [ ] **ANAL-03**: App decomposes samasa compounds with type classification (tatpurusha, dvandva, bahuvrihi, avyayibhava, karmadharaya, dvigu)
- [ ] **ANAL-04**: App extracts dhatu (verbal root) with gana (class 1-10) classification for verb forms
- [ ] **ANAL-05**: App generates IAST transliteration for each word

### Meanings & Dictionary

- [ ] **MEAN-01**: App provides Monier-Williams dictionary definitions for each word
- [ ] **MEAN-02**: App provides Apte dictionary definitions as secondary source
- [ ] **MEAN-03**: App provides LLM-generated contextual meaning for polysemous words in passage context
- [ ] **MEAN-04**: App clearly distinguishes dictionary-verified meanings from AI-interpreted meanings

### Study Features

- [ ] **STDY-01**: App extracts unique words from analyzed text, filtering common particles (ca, tu, hi, eva, api, etc.)
- [ ] **STDY-02**: App generates word → meaning MCQ quiz from extracted vocabulary with plausible distractors

### UI & Experience

- [ ] **UI-01**: Clean, scholar-friendly interface with proper Devanagari typography
- [ ] **UI-02**: Word-by-word breakdown view showing all analysis properties
- [ ] **UI-03**: App works without login or user accounts

## v0.2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Input

- **INPUT-04**: User can capture image directly from device camera
- **INPUT-05**: Post-OCR correction interface for user to fix extraction errors

### Enhanced Analysis

- **ANAL-06**: Multi-candidate sandhi splitting with user choice among alternatives
- **ANAL-07**: Vedic Sanskrit detection guard with user warning

### Enhanced Study

- **STDY-03**: Export vocabulary list as CSV/JSON
- **STDY-04**: Reverse quiz format (English meaning → Sanskrit word)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication/accounts | Adds friction, no persistent state needed |
| Handwritten/manuscript OCR | Entirely different problem domain from printed Devanagari |
| Full syntactic/semantic parsing (kaaraka analysis) | Active research problem, overpromising damages scholar credibility |
| Spaced repetition / progress tracking | Requires persistent user state, different product category |
| Audio pronunciation | Separate challenge, IAST serves pronunciation needs for scholars |
| Multi-language translation | Dictionary meanings + contextual interpretation, not full translation |
| Mobile native app | Web-first serves scholar audience, responsive web suffices |
| Multiple quiz formats (fill-in-blank, etc.) | Word → meaning MCQ only for v0.1 |
| Verse meter analysis | Tangential to core text analysis pipeline |
| Collaborative annotation | Requires accounts, real-time sync — different product |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | — | Pending |
| INPUT-02 | — | Pending |
| INPUT-03 | — | Pending |
| ANAL-01 | — | Pending |
| ANAL-02 | — | Pending |
| ANAL-03 | — | Pending |
| ANAL-04 | — | Pending |
| ANAL-05 | — | Pending |
| MEAN-01 | — | Pending |
| MEAN-02 | — | Pending |
| MEAN-03 | — | Pending |
| MEAN-04 | — | Pending |
| STDY-01 | — | Pending |
| STDY-02 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |

**Coverage:**
- v0.1 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17 ⚠️

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after initial definition*
