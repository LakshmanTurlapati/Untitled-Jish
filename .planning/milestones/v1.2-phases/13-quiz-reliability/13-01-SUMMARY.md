---
phase: 13-quiz-reliability
plan: 01
subsystem: quiz
tags: [fsrs, ts-fsrs, indexeddb, mcq, srs, deduplication, type-safety]

# Dependency graph
requires: []
provides:
  - Lowercase stem storage for consistent vocabulary deduplication
  - Distractor validation ensuring correctAnswer never appears as wrong choice
  - Safe SRS card deserialization handling null/undefined last_review
affects: [13-quiz-reliability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Boundary cast pattern: use 'as Card' on return object instead of double-casting individual fields"
    - "Distractor safety net: filter + re-pad after building options array"

key-files:
  created: []
  modified:
    - src/lib/quiz/vocabularyPopulator.ts
    - src/lib/quiz/quizEngine.ts
    - src/lib/quiz/srs.ts

key-decisions:
  - "Used flatMap over all MW/Apte definitions for richer distractor pool instead of only first definition"
  - "Applied boundary 'as Card' cast on return object rather than per-field unsafe double-cast"
  - "Added IAST fallback '(item.iast)' when stem equals correctAnswer for padding"

patterns-established:
  - "Distractor safety: always filter correctAnswer from options after assembly, then re-pad"
  - "Boundary cast: single 'as Card' at function return boundary for ts-fsrs interop"

requirements-completed: [QUIZ-01, QUIZ-03, STAB-02]

# Metrics
duration: 1min
completed: 2026-03-22
---

# Phase 13 Plan 01: Quiz Data Layer Bug Fixes Summary

**Lowercase stem normalization, distractor-correctAnswer exclusion, and safe SRS null-date deserialization**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-22T08:51:00Z
- **Completed:** 2026-03-22T08:52:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Vocabulary stems now stored lowercase at insert time, matching the dedup comparison that already used toLowerCase(), preventing case-variant duplicates
- MCQ distractor pool expanded from first-definition-only to all MW/Apte definitions via flatMap, with safety filter removing any distractor matching correctAnswer
- Unsafe `undefined as unknown as Date` double-cast in SRS deserialization replaced with safe conditional and single boundary `as Card` cast

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix stem case normalization and distractor validation** - `ed1e516` (fix)
2. **Task 2: Fix SRS storableToCard null date handling** - `1908df0` (fix)

## Files Created/Modified
- `src/lib/quiz/vocabularyPopulator.ts` - Lowercase stem at line 48 for storage consistency
- `src/lib/quiz/quizEngine.ts` - flatMap distractor pool, stem fallback guard, safeOptions filter
- `src/lib/quiz/srs.ts` - Safe conditional + boundary cast for last_review deserialization

## Decisions Made
- Used flatMap over all MW/Apte definitions for richer distractor pool instead of only first definition per vocab item
- Applied boundary `as Card` cast on return object rather than per-field unsafe double-cast, since ts-fsrs internally handles undefined last_review for new cards
- Added IAST transliteration fallback `(item.iast)` when stem equals correctAnswer during padding, avoiding a distractor that matches the answer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in `src/lib/__tests__/vocabulary.test.ts` (duplicate `iast` property) -- confirmed present on main branch before changes, not introduced by this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Quiz data layer bugs fixed, ready for plan 13-02 (error handling improvements)
- Vocabulary deduplication now reliable across case variants
- MCQ answer choices guaranteed correct

## Self-Check: PASSED

All files verified present. All commit hashes found in git log.

---
*Phase: 13-quiz-reliability*
*Completed: 2026-03-22*
