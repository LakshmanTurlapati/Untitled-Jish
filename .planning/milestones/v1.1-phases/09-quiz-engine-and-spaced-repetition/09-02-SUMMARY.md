---
phase: 09-quiz-engine-and-spaced-repetition
plan: 02
subsystem: quiz
tags: [quiz-engine, spaced-repetition, mcq, grammar-facts, vocabulary-population]

# Dependency graph
requires:
  - phase: 09-quiz-engine-and-spaced-repetition
    provides: VocabItem/QuizQuestion/MasteryStats types, FSRS srs.ts wrapper, Dexie v2 schema, vocabularyPopulator
provides:
  - Quiz engine with getDueCards (daily/kaavya modes), generateQuizQuestions, getMasteryStats
  - POST /api/quiz/populate endpoint for server-side text analysis returning EnrichedWord[]
affects: [09-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-mode card querying, dictionary-only MCQ generation, text chunking for large analysis]

key-files:
  created:
    - src/lib/quiz/quizEngine.ts
    - src/lib/__tests__/quiz-engine.test.ts
    - src/app/api/quiz/populate/route.ts
  modified: []

key-decisions:
  - "Quiz correct answers sourced from mwDefinitions[0] then apteDefinitions[0], never contextual meaning"
  - "Mastered threshold: state=Review AND stability > 30 (FSRS stability metric)"
  - "Daily mode includes all New cards regardless of due date"
  - "Populate endpoint chunks text by paragraph boundaries, caps at 50 words per call"

patterns-established:
  - "Dual-mode querying: daily (all kaavyas) vs kaavya-specific with same isDue filter"
  - "Distractor generation: pick from other vocabItems' first dictionary definition"
  - "Text chunking: split by double newlines for large text analysis"

requirements-completed: [QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 09 Plan 02: Quiz Engine and Vocabulary Population Summary

**Quiz engine with daily/kaavya dual modes, dictionary-only MCQ generation with grammar facts, and POST /api/quiz/populate endpoint for server-side text analysis**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T10:58:34Z
- **Completed:** 2026-03-19T11:02:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Quiz engine supports daily mixed mode (all kaavyas) and kaavya-specific mode with FSRS due-date filtering
- MCQ generation uses MW/Apte definitions as correct answers with grammar facts (wordType, vibhakti, dhatu, gana, linga)
- Mastery statistics computed by FSRS state with mastered threshold (stability > 30)
- POST /api/quiz/populate endpoint analyzes text via same pipeline as /api/analyze, returns EnrichedWord[] for client-side population
- 16 unit tests covering both modes, distractor generation, and stat computation

## Task Commits

Each task was committed atomically:

1. **Task 1: Quiz engine with dual modes, grammar facts, and mastery stats** - `f38a228` (feat)
2. **Task 2: POST /api/quiz/populate endpoint** - `b82e926` (feat)

## Files Created/Modified
- `src/lib/quiz/quizEngine.ts` - getDueCards, generateQuizQuestions, getMasteryStats functions
- `src/lib/__tests__/quiz-engine.test.ts` - 16 tests for quiz engine covering all behaviors
- `src/app/api/quiz/populate/route.ts` - POST endpoint with Zod validation, text chunking, analyzeText + enrichWithMeanings pipeline

## Decisions Made
- Quiz correct answers always from mwDefinitions[0] then apteDefinitions[0] fallback (QUIZ-09 compliance)
- Mastered threshold set at stability > 30 (represents roughly 30 days of stable recall)
- Daily mode includes New cards always (they should appear in quiz even if due date is technically future)
- Populate endpoint caps at 50 words per call with paragraph-based text chunking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ZodError.errors to ZodError.issues**
- **Found during:** Task 2 (build verification)
- **Issue:** ZodError in newer Zod versions uses `.issues` not `.errors` property
- **Fix:** Changed `error.errors` to `error.issues` in error response
- **Files modified:** src/app/api/quiz/populate/route.ts
- **Verification:** Build passes
- **Committed in:** b82e926 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type fix for Zod API. No scope creep.

## Issues Encountered
None beyond the Zod type fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Quiz engine complete with both modes, question generation, and mastery stats
- Populate endpoint ready for client-side integration
- Ready for Plan 03: quiz UI components and review flow

---
*Phase: 09-quiz-engine-and-spaced-repetition*
*Completed: 2026-03-19*
