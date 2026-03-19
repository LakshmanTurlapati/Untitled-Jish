# Sanskrit Text Analyzer (Name TBD)

## What This Is

A Sanskrit learning platform with three pillars: (1) a Kindle-like Kaavya Reader for uploaded texts with AI-assisted comprehension hints, (2) a spaced-repetition Quiz Engine with daily mixed vocabulary and kaavya-specific word mastery modes, and (3) a Metrics & Trends dashboard tracking forgetting curves, mastery progress, and personal rank. All meanings sourced from authoritative dictionaries (MW/Apte) or verified internet sources — never generated. Built for scholars and learners who want to deeply internalize Sanskrit vocabulary and grammar.

## Core Value

Enable users to master Sanskrit vocabulary and comprehend kaavyas independently through quiz-driven spaced repetition, with all meanings backed by pramaana (dictionary/verified sources) — never conjured.

## Current Milestone: v1.1 Sanskrit Learning Platform

**Goal:** Transform the single-shloka analyzer into a full Sanskrit learning platform with kaavya reading, spaced-repetition quizzes, and mastery tracking.

**Target features:**
- Kaavya Reader with Kindle-like UI and AI comprehension hints
- Spaced-repetition quiz engine (daily + kaavya-specific modes)
- Forgetting curve analysis and smart quiz scheduling
- Personal rank/XP progression system
- Metrics and trends dashboard

## Requirements

### Validated

<!-- Shipped in v1.0 and confirmed valuable. -->

- ✓ Image capture/upload of printed Devanagari text — v1.0
- ✓ OCR via Tesseract.js — v1.0
- ✓ Sandhi splitting, samasa decomposition, morphological analysis — v1.0
- ✓ Hybrid word meanings (MW/Apte + LLM contextual) — v1.0
- ✓ IAST transliteration — v1.0
- ✓ Word-to-meaning MCQ quiz (single shloka) — v1.0
- ✓ Duolingo-style gamified UI — v1.0

### Active

<!-- Current scope. Building toward these for v1.1. -->

- [x] Kaavya Reader — upload PDF or paste Sanskrit texts, Kindle-like page-by-page reading — Validated in Phase 8
- [x] AI comprehension assistant — user tests their shloka interpretation, AI gives hints/nudges (never the answer), backed by internet-sourced pramaana — Validated in Phase 8
- [x] Quiz Engine — two modes: daily mixed vocabulary review + kaavya-specific word mastery — Validated in Phase 9
- [x] Spaced repetition — forgetting curve-based quiz scheduling, only prompt when likely to forget — Validated in Phase 9
- [x] Vocabulary mastery tracking — words learned, words remaining, new words from new shlokas — Validated in Phase 9
- [x] Mastery timeline estimates — shown after sufficient quiz data, not from the start — Validated in Phase 9
- [x] Grammar facts in quiz — word breakdown and grammar info in questions, meanings always as MCQ — Validated in Phase 9
- [ ] Personal rank/XP system — progression tiers, words give less XP than kaavyas completed
- [ ] Metrics & Trends dashboard — forgetting curves, quiz performance, kaavya comprehension, rank progress
- [x] All meanings from dictionaries (MW/Apte) or verified internet sources — never generated — Validated in Phase 9

### Out of Scope

- User authentication/accounts — local browser storage only, no login
- Handwritten/manuscript OCR — printed Devanagari only
- Competitive leaderboard — personal progression only
- Audio pronunciation — IAST transliteration text only
- Mobile native app — web only
- AI giving direct answers to shloka meanings — hints/nudges only

## Context

- Sanskrit grammar is deeply structured: sandhi rules, 7 vibhaktis × 3 vacanas, 10 dhatu ganas, 6+ samasa types. The analysis pipeline must respect Paninian grammar principles.
- Monier-Williams Sanskrit-English Dictionary and Apte's dictionary are the gold standards. Digital versions exist (Cologne Digital Sanskrit Dictionaries project).
- Grok (xAI) preferred as the primary LLM/vision provider for contextual analysis.
- v1.0 established: Next.js scaffold, Tesseract.js OCR, LLM analysis pipeline, dictionary infrastructure (SQLite with 286K MW + 34K AP90 entries, 1.9M stem index), Duolingo-style UI.
- Pramaana (authoritative evidence) is a hard requirement — meanings, grammar info, and comprehension hints must be traceable to dictionaries or verified sources.
- IndexedDB for persistent local storage (quiz history, vocabulary state, forgetting curves, XP/rank).

## Constraints

- **LLM Provider**: Grok (xAI) preferred — fallback options acceptable but Grok first
- **Frontend**: Next.js + React (existing)
- **Deployment**: Fly.io
- **Storage**: Local browser (IndexedDB) — no backend user state
- **Accuracy**: All meanings must have pramaana — dictionary source or verified internet reference
- **AI Behavior**: Never give direct answers in Kaavya Reader — hints and nudges only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Grok (xAI) for vision/OCR | User preference, strong vision capabilities | ✓ Good |
| Hybrid meaning system | Dictionary ground truth + LLM for context gives both accuracy and depth | ✓ Good |
| No authentication | Reduces friction, local storage sufficient for single-user learning | ✓ Good |
| IAST over IPA | Standard academic romanization, familiar to target audience | ✓ Good |
| Tesseract.js for OCR | Local JS OCR, no API dependency | ✓ Good |
| IndexedDB for persistence | Spaced repetition needs persistent state, but no backend needed for single user | ✓ Good (Phase 8) |
| AI hints not answers | User learns independently, AI validates interpretation with pramaana-backed nudges | ✓ Good (Phase 8) |
| Personal rank (not competitive) | No backend/accounts, progression is self-motivated | — Pending |

---
*Last updated: 2026-03-19 after Phase 9 complete -- Quiz Engine and Spaced Repetition shipped*
