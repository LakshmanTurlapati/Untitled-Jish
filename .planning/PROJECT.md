# Sanskrit Text Analyzer (Name TBD)

## What This Is

A Sanskrit learning platform with three pillars: (1) a Kindle-like Kaavya Reader for uploaded texts with AI-assisted comprehension hints, (2) a spaced-repetition Quiz Engine with daily mixed vocabulary and kaavya-specific word mastery modes, and (3) a Metrics & Trends dashboard tracking forgetting curves, mastery progress, and personal rank. All meanings sourced from authoritative dictionaries (MW/Apte) or verified internet sources -- never generated. Built for scholars and learners who want to deeply internalize Sanskrit vocabulary and grammar.

## Core Value

Enable users to master Sanskrit vocabulary and comprehend kaavyas independently through quiz-driven spaced repetition, with all meanings backed by pramaana (dictionary/verified sources) -- never conjured.

## Current State

Shipped v1.2 Bug Fixes & Stability (2026-03-22). All critical bugs from comprehensive 46-issue audit resolved across 4 phases (7 plans, 13 tasks). Platform now works end-to-end without crashes, hangs, or silent failures.

**What's live:**
- Kaavya Reader: PDF upload/paste, Kindle-like pagination, AI comprehension hints with pramaana
- Quiz Engine: daily mixed + kaavya-specific modes, FSRS spaced repetition, dictionary-only MCQ
- Gamification: XP/rank system with 6 Sanskrit-themed tiers, forgetting curve charts, vocabulary growth trends
- Foundation: Tesseract.js OCR (v7, 30s timeout), sandhi/samasa/morphology analysis, MW/Apte dictionary (320K entries)
- Stability: env validation, structured error logging, cascade deletes, safe date handling, stable React keys

**Known remaining issues:**
- Kaavya completion detection off-by-one bug (currentPage 0-indexed vs totalPages 1-indexed)
- VocabPopulateButton does not display failedCount from partial batch failures
- HintPanel.tsx retains array index keys (pre-existing, out of v1.2 scope)

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

- OCR reliability with timeout and error feedback -- v1.2
- Library data integrity (cascade deletes, safe dates, error handling) -- v1.2
- Quiz reliability (stem normalization, distractor validation, error surfacing) -- v1.2
- API stability (env validation, error logging, streaming error handling) -- v1.2
- React rendering stability (stable keys across 5 components) -- v1.2
- SRS null date safety and Dexie transaction completeness -- v1.2

### Active

(None -- next milestone requirements TBD via /gsd:new-milestone)

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
| requireEnv utility for API keys | Early env validation prevents cryptic runtime 500s | Good (Phase 14) |
| PdfExtractionError typed errors | Classified PDF failure kinds give actionable user messages | Good (Phase 12) |
| Lowercase stem normalization | Prevents duplicate vocab entries from case variations | Good (Phase 13) |

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
*Last updated: 2026-03-22 after v1.2 milestone complete*
