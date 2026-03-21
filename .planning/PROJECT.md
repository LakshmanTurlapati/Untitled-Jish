# Sanskrit Text Analyzer (Name TBD)

## What This Is

A Sanskrit learning platform with three pillars: (1) a Kindle-like Kaavya Reader for uploaded texts with AI-assisted comprehension hints, (2) a spaced-repetition Quiz Engine with daily mixed vocabulary and kaavya-specific word mastery modes, and (3) a Metrics & Trends dashboard tracking forgetting curves, mastery progress, and personal rank. All meanings sourced from authoritative dictionaries (MW/Apte) or verified internet sources -- never generated. Built for scholars and learners who want to deeply internalize Sanskrit vocabulary and grammar.

## Core Value

Enable users to master Sanskrit vocabulary and comprehend kaavyas independently through quiz-driven spaced repetition, with all meanings backed by pramaana (dictionary/verified sources) -- never conjured.

## Current Milestone: v1.2 Bug Fixes & Stability

**Goal:** Fix all critical bugs across OCR, Library, Quiz, and API layers discovered in comprehensive audit -- make the app actually work end-to-end.

**Target fixes:**
- OCR: worker initialization, Tesseract.js API, timeout/cancellation
- Library: data orphaning on delete, date serialization crashes, error handling
- Quiz: stem deduplication, silent error swallowing, distractor quality
- API: environment validation, error logging, stream response handling
- General: memory leaks, React key anti-patterns, race conditions

## Current State

Shipped v1.1 Sanskrit Learning Platform (2026-03-20). Full learning platform operational with 9,201 LOC TypeScript across 93 files. Comprehensive bug audit revealed 46 issues (8 critical, 12 high, 16 medium, 10 low).

**What's live:**
- Kaavya Reader: PDF upload/paste, Kindle-like pagination, AI comprehension hints with pramaana
- Quiz Engine: daily mixed + kaavya-specific modes, FSRS spaced repetition, dictionary-only MCQ
- Gamification: XP/rank system with 6 Sanskrit-themed tiers, forgetting curve charts, vocabulary growth trends
- Foundation: Tesseract.js OCR, sandhi/samasa/morphology analysis, MW/Apte dictionary (320K entries)

**Known issues (v1.2 audit):**
- OCR hangs forever (broken Tesseract.js worker init, wrong API for v7)
- Library page crashes (date serialization, orphaned data on delete)
- Quiz never populates (stem case mismatch, silent errors)
- API routes return 500s (missing env validation, no error logging)
- Memory leaks (Object URLs never revoked, no OCR timeout)
- Kaavya completion detection off-by-one bug

## Requirements

### Validated

- Image capture/upload of printed Devanagari text -- v1.0
- OCR via Tesseract.js -- v1.0
- Sandhi splitting, samasa decomposition, morphological analysis -- v1.0
- Hybrid word meanings (MW/Apte + LLM contextual) -- v1.0
- IAST transliteration -- v1.0
- Word-to-meaning MCQ quiz (single shloka) -- v1.0
- Duolingo-style gamified UI -- v1.0
- Kaavya Reader with Kindle-like UI and AI comprehension hints -- v1.1
- AI comprehension assistant with pramaana-backed hints -- v1.1
- Quiz Engine with daily mixed + kaavya-specific word mastery modes -- v1.1
- Spaced repetition with FSRS scheduling -- v1.1
- Vocabulary mastery tracking -- v1.1
- Grammar facts in quiz questions -- v1.1
- Personal rank/XP system with 6 tiers -- v1.1
- Metrics & Trends dashboard with forgetting curves and vocab growth -- v1.1
- All meanings from dictionaries or verified sources -- v1.1

### Active

- [ ] Fix OCR infinite extraction (broken Tesseract.js worker initialization and API usage)
- [ ] Fix library page crashes (orphaned data, date serialization, missing error handling)
- [ ] Fix quiz population failures (stem deduplication, silent errors, distractor generation)
- [ ] Fix API server errors (missing env validation, broken error handling, stream format issues)
- [ ] Fix memory leaks and resource cleanup (Object URLs, worker lifecycle)
- [ ] Fix React rendering issues (array index keys, race conditions)

### Out of Scope

- User authentication/accounts -- local browser storage only, no login
- Handwritten/manuscript OCR -- printed Devanagari only
- Competitive leaderboard -- personal progression only
- Audio pronunciation -- IAST transliteration text only
- Mobile native app -- web only
- AI giving direct answers to shloka meanings -- hints/nudges only
- Push notifications -- in-app banners only for v1.1

## Context

- Sanskrit grammar is deeply structured: sandhi rules, 7 vibhaktis x 3 vacanas, 10 dhatu ganas, 6+ samasa types. The analysis pipeline respects Paninian grammar principles.
- Monier-Williams Sanskrit-English Dictionary and Apte's dictionary are the gold standards. Digital versions from Cologne Digital Sanskrit Dictionaries project.
- Grok (xAI) as the primary LLM/vision provider for contextual analysis and comprehension hints.
- IndexedDB (Dexie v3) for all persistent local storage: kaavyas, reading states, interpretations, vocabulary items, review logs, user stats (XP/rank).
- Pramaana (authoritative evidence) is a hard requirement -- all meanings traceable to dictionaries or verified sources.
- Recharts for data visualization (forgetting curves, vocab growth).
- ts-fsrs for spaced repetition scheduling.

## Constraints

- **LLM Provider**: Grok (xAI) preferred -- fallback options acceptable but Grok first
- **Frontend**: Next.js + React (existing)
- **Deployment**: Fly.io
- **Storage**: Local browser (IndexedDB) -- no backend user state
- **Accuracy**: All meanings must have pramaana -- dictionary source or verified internet reference
- **AI Behavior**: Never give direct answers in Kaavya Reader -- hints and nudges only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Grok (xAI) for vision/OCR | User preference, strong vision capabilities | Good |
| Hybrid meaning system | Dictionary ground truth + LLM for context gives both accuracy and depth | Good |
| No authentication | Reduces friction, local storage sufficient for single-user learning | Good |
| IAST over IPA | Standard academic romanization, familiar to target audience | Good |
| Tesseract.js for OCR | Local JS OCR, no API dependency | Good |
| IndexedDB for persistence | Spaced repetition needs persistent state, but no backend needed for single user | Good (Phase 8) |
| AI hints not answers | User learns independently, AI validates interpretation with pramaana-backed nudges | Good (Phase 8) |
| Personal rank (not competitive) | No backend/accounts, progression is self-motivated | Good (Phase 10) |
| FSRS for spaced repetition | Industry-standard algorithm, ts-fsrs library has built-in forgetting curve math | Good (Phase 9) |
| Recharts for visualization | React-native SVG charts, composable API, no Canvas dependency | Good (Phase 10) |
| Dictionary-only MCQ meanings | Pramaana requirement -- quiz answers sourced only from MW/Apte, never LLM-generated | Good (Phase 9) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -- Move to Out of Scope with reason
2. Requirements validated? -- Move to Validated with phase reference
3. New requirements emerged? -- Add to Active
4. Decisions to log? -- Add to Key Decisions
5. "What This Is" still accurate? -- Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-21 after v1.2 milestone started*
