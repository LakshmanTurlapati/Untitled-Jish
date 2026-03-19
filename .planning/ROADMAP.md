# Roadmap: Sanskrit Text Analyzer

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-03-09)
- 🚧 **v1.1 Sanskrit Learning Platform** - Phases 8-10 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 MVP (Phases 1-7) - SHIPPED 2026-03-09</summary>

- [x] **Phase 1: Foundation and Text Input** - Project scaffold, dictionary infrastructure, Devanagari text input with IAST transliteration
- [x] **Phase 2: Core Analysis Pipeline** - Sandhi splitting, samasa decomposition, morphological analysis, and hybrid meanings with word breakdown UI
- [x] **Phase 3: Image Input and OCR** - Image upload with Tesseract.js OCR feeding into the analysis pipeline
- [x] **Phase 4: Study Features** - Vocabulary extraction with filtering and word-to-meaning MCQ quiz
- [x] **Phase 5: Wire Quiz Fallback Distractors** - Connect QuizView to /api/distractors so short passages get quiz questions
- [x] **Phase 6: Duolingo-Style UI Overhaul** - Redesign interface with Duolingo-inspired UX patterns
- [x] **Phase 7: UI Navigation & Polish** - Tabbed sections, analysis button gated to page, camera capture, checkmark color alignment

### Phase 1: Foundation and Text Input
**Goal**: Project scaffold with Shobhika typography, bidirectional IAST transliteration engine, and embedded dictionary infrastructure (MW + Apte via CDSL/SQLite) in a clean, scholar-friendly app shell
**Depends on**: Nothing (first phase)
**Requirements**: ANAL-05, UI-01, UI-03
**Plans**: 3/3 complete

Plans:
- [x] 01-01-PLAN.md — Project scaffold, test infra, Shobhika font, design tokens, transliteration utility, app shell
- [x] 01-02-PLAN.md — CDSL dictionary parser, SQLite import pipeline, stem index, lookup module, API route
- [x] 01-03-PLAN.md — Gap closure: update ROADMAP and REQUIREMENTS to reflect INPUT-01 deferral to Phase 3

### Phase 2: Core Analysis Pipeline
**Goal**: Users get deep grammatical analysis of any Sanskrit text -- sandhi splitting, compound decomposition, morphological breakdown, and hybrid meanings -- displayed in a structured word-by-word view
**Depends on**: Phase 1
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04, MEAN-01, MEAN-02, MEAN-03, MEAN-04, UI-02
**Plans**: 3/3 complete

Plans:
- [x] 02-01-PLAN.md — Core analysis pipeline: type contracts, Zod schemas, LLM prompts, sandhi/samasa/morphology with INRIA validation
- [x] 02-02-PLAN.md — Meanings enrichment: dictionary lookups (MW + Apte), source tracking, POST /api/analyze endpoint
- [x] 02-03-PLAN.md — Word breakdown UI: WordBreakdown/MeaningBadge components, AnalysisView with text input, page integration

### Phase 3: Image Input and OCR
**Goal**: Users can photograph or upload printed Devanagari text and get the full analysis pipeline applied automatically
**Depends on**: Phase 2
**Requirements**: INPUT-01, INPUT-02, INPUT-03
**Plans**: 2/2 complete

Plans:
- [x] 03-01-PLAN.md — OCR backend: Tesseract.js extraction function and /api/ocr API route with FormData handling
- [x] 03-02-PLAN.md — Text input IAST preview, ImageUpload component, OCR-to-analysis pipeline integration

### Phase 4: Study Features
**Goal**: Users can study vocabulary extracted from analyzed texts through filtered word lists and interactive quizzes
**Depends on**: Phase 2
**Requirements**: STDY-01, STDY-02
**Plans**: 2/2 complete

Plans:
- [x] 04-01-PLAN.md — Study feature logic: type contracts, vocabulary extraction, quiz generation, fallback distractor API
- [x] 04-02-PLAN.md — Study feature UI: VocabularyList and QuizView components, AnalysisView integration

### Phase 5: Wire Quiz Fallback Distractors
**Goal**: QuizView fetches fallback distractors from /api/distractors so short passages (< 4 unique words) can still generate quiz questions
**Depends on**: Phase 4
**Requirements**: STDY-02
**Plans**: 1/1 complete

Plans:
- [x] 05-01-PLAN.md — Wire QuizView to /api/distractors for fallback distractor fetching

### Phase 6: Duolingo-Style UI Overhaul
**Goal**: Redesign the interface with Duolingo-inspired UX patterns -- gamified feel, clear progress indicators, card-based layouts, friendly micro-interactions -- while keeping the existing warm academic color scheme
**Depends on**: Phase 5
**Requirements**: UI-01, UI-02
**Plans**: 3/3 complete

Plans:
- [x] 06-01-PLAN.md — Page layout restructure: minimal header, hero input card, tabs, sticky bottom bar, analysis progress steps
- [x] 06-02-PLAN.md — Component restyling: WordBreakdown/MeaningBadge with big cards, pill badges, stacked meaning dots
- [x] 06-03-PLAN.md — Quiz gamification: hearts, XP, streaks, tap-to-select+Check, celebration screen with confetti

### Phase 7: UI Navigation & Polish
**Goal**: Reorganize the app into tabbed sections, gate the analysis button to its page, add direct camera capture, and align checkmark colors with the app's color scheme
**Depends on**: Phase 6
**Requirements**: UI-01, UI-02, INPUT-02
**Plans**: 2/2 complete

Plans:
- [x] 07-01-PLAN.md — Top-level Analyze/Study tab navigation, sticky bar gating, checkmark color fix
- [x] 07-02-PLAN.md — Camera capture button in ImageUpload with capture=environment attribute

</details>

### 🚧 v1.1 Sanskrit Learning Platform (In Progress)

**Milestone Goal:** Transform the single-shloka analyzer into a full Sanskrit learning platform with kaavya reading, spaced-repetition quizzes, and mastery tracking.

- [ ] **Phase 8: Kaavya Reader and Storage Foundation** - Upload/paste Sanskrit texts, Kindle-like reading UI, AI comprehension hints, IndexedDB persistence layer
- [ ] **Phase 9: Quiz Engine and Spaced Repetition** - Daily and kaavya-specific quiz modes, forgetting curve scheduling, vocabulary mastery tracking
- [ ] **Phase 10: Gamification and Metrics Dashboard** - XP/rank progression, forgetting curve visualization, performance trends, mastery timeline

## Phase Details

### Phase 8: Kaavya Reader and Storage Foundation
**Goal**: Users can upload or paste Sanskrit kaavyas, read them in a comfortable page-by-page interface, test their shloka interpretations with AI-powered pramaana-backed hints, and have their library persist across sessions
**Depends on**: Phase 7
**Requirements**: READ-01, READ-02, READ-03, READ-04, READ-05, READ-06, STOR-01, STOR-02
**Success Criteria** (what must be TRUE):
  1. User can upload a PDF or paste Sanskrit text and see it stored as a kaavya in their personal library
  2. User can read any saved kaavya in a Kindle-like page-by-page view that is comfortable for extended reading
  3. User can select a shloka, type their interpretation, and receive AI hints/nudges backed by internet-sourced pramaana -- never the direct answer
  4. User can browse their library of uploaded kaavyas and return to any previously uploaded text
  5. All library data and reading state persists in the browser across sessions (IndexedDB)
**Plans**: 4 plans

Plans:
- [ ] 08-01-PLAN.md — Storage foundation: Dexie IndexedDB schema, type contracts, CRUD stores, PDF extractor, text paginator, reactive library hook
- [ ] 08-02-PLAN.md — Library UI and uploader: KaavyaLibrary grid, LibraryCard, KaavyaUploader with PDF drag-and-drop and text paste, page routing
- [ ] 08-03-PLAN.md — Paginated reader: KaavyaReader with Kindle-like page navigation, ReaderPage with Shobhika font, useReader hook with reading state persistence
- [ ] 08-04-PLAN.md — Shloka interpretation and AI hints: ShlokaSelector, HintPanel, /api/hints endpoint with pramaana-backed system prompt, reader integration

### Phase 9: Quiz Engine and Spaced Repetition
**Goal**: Users can build vocabulary through two quiz modes -- daily mixed review across all texts and kaavya-specific word mastery -- with spaced repetition scheduling that quizzes only when they are likely to forget
**Depends on**: Phase 8
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05, QUIZ-06, QUIZ-07, QUIZ-08, QUIZ-09
**Success Criteria** (what must be TRUE):
  1. User can populate quiz vocabulary from a specific document or set of shlokas and see all dictionary-sourced meanings (MW/Apte) for each word -- never generated meanings
  2. User can take daily mixed vocabulary quizzes drawing from all words seen across all kaavyas
  3. User can take kaavya-specific quizzes focusing on words from a particular text
  4. Quiz questions include grammar facts (word breakdown, vibhakti, dhatu) alongside meaning MCQs
  5. Spaced repetition schedules quizzes based on forgetting curves, and mastery timeline estimates appear after sufficient quiz data
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD

### Phase 10: Gamification and Metrics Dashboard
**Goal**: Users feel motivated through XP/rank progression and can track their learning with forgetting curve analysis, vocabulary growth trends, and kaavya comprehension metrics
**Depends on**: Phase 9
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, METR-01, METR-02, METR-03, METR-04, METR-05
**Success Criteria** (what must be TRUE):
  1. User earns XP for quiz answers and kaavya completions, with kaavyas worth more than individual words
  2. User progresses through unlockable rank tiers based on word mastery count and kaavyas read
  3. User can view forgetting curve visualizations showing how quickly they forget words over different time frames
  4. User sees a metrics dashboard with vocabulary growth trends, quiz performance, kaavya comprehension tracking, and rank progress
  5. App provides smart quiz prompting -- notifying only when analysis shows the user is likely to forget
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Text Input | v1.0 | 3/3 | Complete | 2026-03-07 |
| 2. Core Analysis Pipeline | v1.0 | 3/3 | Complete | 2026-03-09 |
| 3. Image Input and OCR | v1.0 | 2/2 | Complete | 2026-03-09 |
| 4. Study Features | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Wire Quiz Fallback Distractors | v1.0 | 1/1 | Complete | 2026-03-09 |
| 6. Duolingo-Style UI Overhaul | v1.0 | 3/3 | Complete | 2026-03-09 |
| 7. UI Navigation & Polish | v1.0 | 2/2 | Complete | 2026-03-09 |
| 8. Kaavya Reader and Storage Foundation | 3/4 | In Progress|  | - |
| 9. Quiz Engine and Spaced Repetition | v1.1 | 0/? | Not started | - |
| 10. Gamification and Metrics Dashboard | v1.1 | 0/? | Not started | - |
