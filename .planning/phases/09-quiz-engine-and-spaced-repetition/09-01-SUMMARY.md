---
phase: 09-quiz-engine-and-spaced-repetition
plan: 01
subsystem: quiz
tags: [ts-fsrs, spaced-repetition, dexie, indexeddb, vocabulary]

# Dependency graph
requires:
  - phase: 08-reader-and-persistent-storage
    provides: Dexie v1 schema with KaavyaDB, EnrichedWord types, study/vocabulary extraction
provides:
  - VocabItem, ReviewLog, QuizQuestion, MasteryStats type contracts
  - Dexie v2 schema with vocabItems and reviewLogs tables
  - FSRS spaced repetition wrapper (createNewCard, scheduleReview, isDue, serialization)
  - Vocabulary population pipeline (extract, deduplicate, persist with dictionary meanings)
affects: [09-02, 09-03]

# Tech tracking
tech-stack:
  added: [ts-fsrs v5.2.3]
  patterns: [FSRS card serialization for IndexedDB, stem-based deduplication]

key-files:
  created:
    - src/lib/quiz/types.ts
    - src/lib/quiz/srs.ts
    - src/lib/quiz/vocabularyPopulator.ts
    - src/lib/__tests__/srs.test.ts
    - src/lib/__tests__/vocab-populator.test.ts
  modified:
    - src/lib/kaavya/db/schema.ts
    - package.json

key-decisions:
  - "Used ts-fsrs v5 with generatorParameters() constructor for default FSRS parameters"
  - "Card serialization converts Date to ISO strings for IndexedDB storage"
  - "Vocabulary populator uses MW/Apte definitions only, never contextual_meaning (QUIZ-09)"

patterns-established:
  - "FSRS card serialization: cardToStorable/storableToCard for IndexedDB round-tripping"
  - "Stem-based deduplication: case-insensitive stem comparison within kaavya scope"
  - "Dexie schema versioning: v1 preserved exactly, v2 adds new tables only"

requirements-completed: [QUIZ-01, QUIZ-06, QUIZ-09]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 09 Plan 01: Quiz Data Foundation Summary

**FSRS spaced repetition wrapper with ts-fsrs v5, Dexie v2 schema for vocab/review tables, and vocabulary population pipeline with dictionary-only meanings**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T10:51:33Z
- **Completed:** 2026-03-19T10:56:18Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- VocabItem, ReviewLog, QuizQuestion, MasteryStats type contracts for quiz data layer
- Dexie schema upgraded to v2 with vocabItems and reviewLogs tables (v1 preserved)
- FSRS wrapper with card creation, scheduling, due checking, and IndexedDB serialization
- Vocabulary populator extracts from EnrichedWord[], filters particles, deduplicates by stem, persists with MW/Apte definitions only
- 21 unit tests passing (12 SRS + 9 vocabulary populator)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ts-fsrs, create type contracts, extend Dexie schema to v2, and create SRS wrapper** - `928e3ee` (feat)
2. **Task 2: Create vocabulary population pipeline with dictionary lookups and tests** - `9619a9c` (feat)

## Files Created/Modified
- `src/lib/quiz/types.ts` - VocabItem, ReviewLog, QuizQuestion, MasteryStats interfaces
- `src/lib/quiz/srs.ts` - FSRS wrapper with card creation, scheduling, serialization
- `src/lib/quiz/vocabularyPopulator.ts` - Vocabulary extraction and persistence pipeline
- `src/lib/kaavya/db/schema.ts` - Dexie v2 with vocabItems and reviewLogs tables
- `src/lib/__tests__/srs.test.ts` - 12 tests for SRS wrapper functions
- `src/lib/__tests__/vocab-populator.test.ts` - 9 tests for vocabulary populator
- `package.json` - Added ts-fsrs dependency

## Decisions Made
- Used ts-fsrs v5 with generatorParameters() constructor (v5 requires explicit params, unlike v4)
- Added learning_steps field to Card serialization (new in ts-fsrs v5)
- Card serialization uses ISO strings for Date fields to support IndexedDB storage
- Vocabulary populator sources meanings exclusively from mw_definitions/apte_definitions (QUIZ-09 compliance)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed FSRS constructor for ts-fsrs v5 API**
- **Found during:** Task 1 (build verification)
- **Issue:** `new FSRS()` requires parameters in ts-fsrs v5, unlike v4
- **Fix:** Changed to `new FSRS(generatorParameters())` using default FSRS parameters
- **Files modified:** src/lib/quiz/srs.ts
- **Verification:** Build passes, all tests pass
- **Committed in:** 9619a9c (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Card type missing learning_steps field**
- **Found during:** Task 1 (build verification)
- **Issue:** ts-fsrs v5 Card type requires learning_steps field, not present in plan's code
- **Fix:** Added learning_steps to StorableCard interface, cardToStorable, storableToCard, and VocabItem type
- **Files modified:** src/lib/quiz/srs.ts, src/lib/quiz/types.ts, src/lib/quiz/vocabularyPopulator.ts
- **Verification:** Build passes, all tests pass
- **Committed in:** 9619a9c (Task 2 commit)

**3. [Rule 1 - Bug] Fixed IPreview type indexing for repeat() result**
- **Found during:** Task 1 (build verification)
- **Issue:** ts-fsrs v5 IPreview type doesn't include Rating.Manual key, causing type error on bracket access
- **Fix:** Cast through unknown to Record<number, { card: Card }> for numeric rating access
- **Files modified:** src/lib/quiz/srs.ts
- **Verification:** Build passes, all tests pass
- **Committed in:** 9619a9c (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs from ts-fsrs v5 API changes vs plan assumptions)
**Impact on plan:** All fixes necessary for build compatibility with ts-fsrs v5. No scope creep.

## Issues Encountered
None beyond the ts-fsrs v5 API deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Quiz data layer complete with types, schema, SRS, and vocabulary populator
- Ready for Plan 02: quiz question generation and review UI components
- FSRS wrapper provides all scheduling functions needed for quiz flow

---
*Phase: 09-quiz-engine-and-spaced-repetition*
*Completed: 2026-03-19*
