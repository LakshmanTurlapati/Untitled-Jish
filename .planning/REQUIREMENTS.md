# Requirements: Sanskrit Learning Platform

**Defined:** 2026-03-18
**Core Value:** Enable users to master Sanskrit vocabulary and comprehend kaavyas independently through quiz-driven spaced repetition, with all meanings backed by pramaana.

## v1.0 Requirements (Complete)

All v1.0 requirements shipped and verified.

### Image & Input

- [x] **INPUT-01**: User can paste or type Devanagari text directly into the app
- [x] **INPUT-02**: User can upload an image of printed Devanagari text
- [x] **INPUT-03**: App extracts Sanskrit text from uploaded image via OCR with high accuracy

### Sanskrit Analysis

- [x] **ANAL-01**: App splits sandhi junctions (vowel, consonant, visarga) into individual words
- [x] **ANAL-02**: App identifies vibhakti (case), vacana (number), and linga (gender) for each word
- [x] **ANAL-03**: App decomposes samasa compounds with type classification
- [x] **ANAL-04**: App extracts dhatu (verbal root) with gana classification for verb forms
- [x] **ANAL-05**: App generates IAST transliteration for each word

### Meanings & Dictionary

- [x] **MEAN-01**: App provides Monier-Williams dictionary definitions for each word
- [x] **MEAN-02**: App provides Apte dictionary definitions as secondary source
- [x] **MEAN-03**: App provides LLM-generated contextual meaning for polysemous words
- [x] **MEAN-04**: App clearly distinguishes dictionary-verified meanings from AI-interpreted meanings

### Study Features

- [x] **STDY-01**: App extracts unique words from analyzed text, filtering common particles
- [x] **STDY-02**: App generates word → meaning MCQ quiz with plausible distractors

### UI & Experience

- [x] **UI-01**: Clean, scholar-friendly interface with proper Devanagari typography
- [x] **UI-02**: Word-by-word breakdown view showing all analysis properties
- [x] **UI-03**: App works without login or user accounts

## v1.1 Requirements

Requirements for milestone v1.1 — Sanskrit Learning Platform. Each maps to roadmap phases.

### Kaavya Reader

- [x] **READ-01**: User can upload a PDF of a Sanskrit kaavya/purana for reading
- [x] **READ-02**: User can paste Sanskrit text as a kaavya document
- [ ] **READ-03**: User can read uploaded texts in a Kindle-like page-by-page UI (easy on the eyes)
- [ ] **READ-04**: User can select a shloka and submit their interpretation for AI validation
- [ ] **READ-05**: AI searches internet for pramaana and gives hints/nudges about user's interpretation — never the direct answer
- [ ] **READ-06**: User can browse their library of uploaded kaavyas

### Quiz Engine

- [ ] **QUIZ-01**: User can provide a document/shlokas to populate quiz vocabulary (e.g., Ramayana first kaanda)
- [ ] **QUIZ-02**: Quiz shows all meanings of a word (when a word has multiple meanings in context), sourced from MW/Apte dictionaries
- [ ] **QUIZ-03**: Quiz includes grammar facts (word breakdown, vibhakti, dhatu) in the question — meaning is always MCQ
- [ ] **QUIZ-04**: Daily mixed vocabulary review mode — words from all vocabulary seen so far
- [ ] **QUIZ-05**: Kaavya-specific quiz mode — words specific to a particular kaavya/purana
- [ ] **QUIZ-06**: Spaced repetition scheduling based on forgetting curves — quiz only when user is likely to forget
- [ ] **QUIZ-07**: Mastery timeline estimate shown after sufficient quiz data (not from the start)
- [ ] **QUIZ-08**: Track vocabulary mastery — words learned, words remaining, new words added from new shlokas
- [ ] **QUIZ-09**: All quiz meanings sourced from dictionaries (MW/Apte) or verified internet sources — one/two-word meanings, never conjured

### Gamification

- [ ] **GAME-01**: Personal rank/tier progression system (unlockable levels)
- [ ] **GAME-02**: XP system — words give less XP than kaavyas completed
- [ ] **GAME-03**: Rank updates based on word mastery count and kaavyas/puranas read
- [ ] **GAME-04**: Game-like feel with dopamine-driven engagement (progress, achievements, streaks)

### Metrics & Trends

- [ ] **METR-01**: Forgetting curve visualization — track how quickly user forgets words over different time frames
- [ ] **METR-02**: Smart quiz prompting — only notify when analysis shows user is likely to forget
- [ ] **METR-03**: Kaavya comprehension tracking — how well user understands texts (via AI agent feedback)
- [ ] **METR-04**: Rank progress and XP needed for next tier
- [ ] **METR-05**: Vocabulary growth trends — words over time, mastery rate

### Storage

- [x] **STOR-01**: Persistent local storage (IndexedDB) for quiz history, vocabulary state, forgetting curves, XP/rank
- [x] **STOR-02**: Uploaded kaavya library persisted locally

## Future Requirements

### v2 Candidates

- **NOTF-01**: Push notifications for quiz reminders (requires service worker)
- **SOCIAL-01**: Competitive leaderboard with other users
- **AUDIO-01**: Audio pronunciation of Sanskrit words
- **EXPORT-01**: Export vocabulary lists and progress data

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication/accounts | Local browser storage sufficient for single-user learning |
| Competitive leaderboard | No backend, personal progression only |
| Handwritten/manuscript OCR | Printed Devanagari only |
| Audio pronunciation | IAST transliteration text only |
| Mobile native app | Web only |
| AI giving direct shloka answers | Hints/nudges only — user learns independently |
| Generated/conjured meanings | All meanings must have pramaana from dictionaries or verified sources |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| READ-01 | Phase 8 | Complete |
| READ-02 | Phase 8 | Complete |
| READ-03 | Phase 8 | Pending |
| READ-04 | Phase 8 | Pending |
| READ-05 | Phase 8 | Pending |
| READ-06 | Phase 8 | Pending |
| STOR-01 | Phase 8 | Complete |
| STOR-02 | Phase 8 | Complete |
| QUIZ-01 | Phase 9 | Pending |
| QUIZ-02 | Phase 9 | Pending |
| QUIZ-03 | Phase 9 | Pending |
| QUIZ-04 | Phase 9 | Pending |
| QUIZ-05 | Phase 9 | Pending |
| QUIZ-06 | Phase 9 | Pending |
| QUIZ-07 | Phase 9 | Pending |
| QUIZ-08 | Phase 9 | Pending |
| QUIZ-09 | Phase 9 | Pending |
| GAME-01 | Phase 10 | Pending |
| GAME-02 | Phase 10 | Pending |
| GAME-03 | Phase 10 | Pending |
| GAME-04 | Phase 10 | Pending |
| METR-01 | Phase 10 | Pending |
| METR-02 | Phase 10 | Pending |
| METR-03 | Phase 10 | Pending |
| METR-04 | Phase 10 | Pending |
| METR-05 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
