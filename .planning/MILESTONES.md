# Milestones

## v1.2 Bug Fixes & Stability (Shipped: 2026-03-22)

**Phases completed:** 4 phases, 7 plans, 13 tasks

**Key accomplishments:**

- Fixed Tesseract.js v7 worker init with correct "san" language code, added 30s AbortController timeout via Promise.race, and eliminated Object URL memory leaks with ref-based cleanup
- Cascade delete for kaavya child records (vocabItems/reviewLogs) and defensive date coercion in LibraryCard relativeTime
- Typed PdfExtractionError with 4 classified failure modes and user-visible error feedback for library delete and PDF upload
- Lowercase stem normalization, distractor-correctAnswer exclusion, and safe SRS null-date deserialization
- Quiz error surfacing with quizError state for load failures, context-rich SRS rating logging, and per-word partial failure handling in populate API
- requireEnv utility for missing-var validation, structured error logging in all API catch blocks, await streamText for proper error capture, and actionable LLM schema-mismatch messages
- Replaced all 8 array-index React keys with stable content-derived keys across 5 components to prevent reconciliation bugs

---

## v1.1 Sanskrit Learning Platform (Shipped: 2026-03-20)

**Phases completed:** 3 phases, 10 plans, 22 tasks

**Key accomplishments:**

- Dexie IndexedDB schema with kaavya/readingState/interpretation tables, CRUD stores, PDF text extractor via pdfjs-dist, and reactive library hook
- Library grid with card view, PDF drag-and-drop uploader with text paste, and top-level Analyze/Library tab navigation
- Kindle-like paginated reader with Shobhika font rendering, keyboard navigation, page dot indicators, and IndexedDB reading state persistence
- Shloka text selection with floating "Interpret This" button, interpretation input, and streaming AI hints backed by pramaana using grok-3-mini
- FSRS spaced repetition wrapper with ts-fsrs v5, Dexie v2 schema for vocab/review tables, and vocabulary population pipeline with dictionary-only meanings
- Quiz engine with daily/kaavya dual modes, dictionary-only MCQ generation with grammar facts, and POST /api/quiz/populate endpoint for server-side text analysis
- Complete quiz UI with mode selector, SRS rating bar, grammar facts pills, mastery dashboard, vocabulary population button, and Quiz tab navigation
- TDD-driven gamification engines: XP computation, 6-tier dual-axis rank system, FSRS-based forgetting curves, vocabulary growth tracking, and comprehension metrics as pure functions with 23 tests
- Recharts-powered metrics dashboard with rank badge, forgetting curve, vocab growth charts, and smart quiz prompt banner
- CompactRankBadge + SmartQuizPrompt + MetricsDashboard wired into Quiz tab with XP persistence, floating XP animation, and rank-up celebration

---

## v1.0 — Sanskrit Text Analyzer (completed 2026-03-09)

**Goal:** End-to-end Sanskrit text analysis — image/text input → OCR → sandhi/samasa/morphology → dictionary+AI meanings → vocabulary quiz.

**Phases:** 7 (all complete, 16 plans total)

| Phase | Name | What shipped |
|-------|------|-------------|
| 1 | Foundation & Text Input | Next.js scaffold, Shobhika font, transliteration, CDSL dictionary import (286K MW + 34K AP90), 1.9M stem index |
| 2 | Core Analysis Pipeline | LLM analysis (Grok), Zod schemas, INRIA validation, meanings enrichment, analyze API + UI |
| 3 | Image Input & OCR | Tesseract.js OCR, text input with IAST preview, ImageUpload with drag-drop |
| 4 | Study Features | Vocabulary quiz with distractor generation |
| 5 | Quiz Fallback Distractors | Connect QuizView to /api/distractors for short passages |
| 6 | Duolingo-Style UI Overhaul | Gamified UX, card layouts, progress indicators |
| 7 | UI Navigation & Polish | Tabbed sections, camera capture, checkmark alignment |

**Last phase number:** 7
