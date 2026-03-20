---
phase: 10-gamification-and-metrics-dashboard
plan: 01
subsystem: gamification
tags: [xp, rank, fsrs, forgetting-curve, metrics, dexie, tdd, vitest]

requires:
  - phase: 09-quiz-engine-and-srs
    provides: "VocabItem, ReviewLog types, ts-fsrs integration, storableToCard helper"
  - phase: 08-kaavya-reader-and-storage
    provides: "Kaavya, ShlokaInterpretation types, Dexie v2 schema"
provides:
  - "Type contracts for XP, Rank, UserStats, ForgettingCurvePoint, GrowthDataPoint, ComprehensionMetric"
  - "XP engine: computeTotalXP, computeQuizSessionXP"
  - "Rank system: getCurrentRank, getNextRank, getRankProgress with 6-tier dual-axis progression"
  - "Metrics engine: forgetting curve data, at-risk word detection, vocabulary growth data, comprehension metrics"
  - "Dexie schema v3 with userStats table"
affects: [10-02-PLAN, 10-03-PLAN]

tech-stack:
  added: []
  patterns: [pure-function-engines, tdd-red-green, dual-axis-rank-progression]

key-files:
  created:
    - src/lib/gamification/types.ts
    - src/lib/gamification/xpEngine.ts
    - src/lib/gamification/rankSystem.ts
    - src/lib/gamification/metricsEngine.ts
    - src/lib/__tests__/xp-engine.test.ts
    - src/lib/__tests__/rank-system.test.ts
    - src/lib/__tests__/metrics-engine.test.ts
  modified:
    - src/lib/kaavya/db/schema.ts

key-decisions:
  - "Dual-axis rank progression: both mastered words AND kaavyas read required for tier advancement"
  - "XP from correct quiz answers (rating >= 3) plus kaavya completions, kaavyas worth 10x"
  - "Forgetting curve uses FSRS forgetting_curve() for accurate retrievability over time"
  - "At-risk detection via FSRS get_retrievability() with configurable threshold"
  - "Growth data computed as cumulative per-state counts, ready for stacked area charts"

patterns-established:
  - "Pure function engines: all gamification logic is stateless, testable, and independent of UI/DB"
  - "TDD workflow: RED phase (failing tests first) then GREEN phase (implementation)"

requirements-completed: [GAME-01, GAME-02, GAME-03, METR-01, METR-02, METR-03, METR-04, METR-05]

duration: 3min
completed: 2026-03-20
---

# Phase 10 Plan 01: Gamification Data Layer Summary

**TDD-driven gamification engines: XP computation, 6-tier dual-axis rank system, FSRS-based forgetting curves, vocabulary growth tracking, and comprehension metrics as pure functions with 23 tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T17:32:39Z
- **Completed:** 2026-03-20T17:35:48Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created type contracts (XP_VALUES, RANK_TIERS, UserStats, metric interfaces) used by all gamification modules
- Implemented XP engine computing quiz and kaavya XP from review logs
- Built 6-tier rank system (Shishya to Mahavidvan) with dual-axis progression requiring both mastered words and kaavyas read
- Implemented metrics engine with FSRS forgetting curves, at-risk word detection, cumulative vocabulary growth data, and per-kaavya comprehension metrics
- Extended Dexie schema to v3 with userStats table
- All 23 tests pass with full TDD workflow (RED then GREEN)

## Task Commits

Each task was committed atomically:

1. **Task 1: Type contracts and TDD test scaffolds** - `970490c` (test)
2. **Task 2: Implement gamification engines and extend Dexie schema to v3** - `51ed3a2` (feat)

## Files Created/Modified
- `src/lib/gamification/types.ts` - XP_VALUES, RANK_TIERS (6 tiers), UserStats, ForgettingCurvePoint, GrowthDataPoint, ComprehensionMetric
- `src/lib/gamification/xpEngine.ts` - computeTotalXP (quiz + kaavya XP), computeQuizSessionXP
- `src/lib/gamification/rankSystem.ts` - getCurrentRank, getNextRank, getRankProgress with dual-axis tier logic
- `src/lib/gamification/metricsEngine.ts` - generateForgettingCurveData, getAtRiskWords, computeGrowthData, computeComprehensionMetrics
- `src/lib/kaavya/db/schema.ts` - Added version(3) with userStats table
- `src/lib/__tests__/xp-engine.test.ts` - 6 tests for XP computation
- `src/lib/__tests__/rank-system.test.ts` - 9 tests for rank progression
- `src/lib/__tests__/metrics-engine.test.ts` - 8 tests for metrics engine

## Decisions Made
- Dual-axis rank progression: both mastered words AND kaavyas read required for tier advancement (prevents gaming by only doing quizzes)
- XP from correct answers only (rating >= 3 = Good/Easy), wrong answers give nothing
- Forgetting curve uses FSRS forgetting_curve() directly for accurate retrievability percentages
- At-risk word detection converts VocabItem to FSRS Card via storableToCard for accurate retrievability
- Growth data returns cumulative per-state counts (newCount, learning, mastered, total) ready for stacked area charts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All gamification pure functions ready for Plan 02 (UI components: XP display, rank badge, charts)
- GrowthDataPoint fields (newCount, learning, mastered) align with Plan 02 VocabGrowthChart stacked Area components
- Dexie v3 schema ready for Plan 03 (integration wiring: persisting UserStats)

## Self-Check: PASSED

- All 8 files verified present on disk
- Both task commits (970490c, 51ed3a2) verified in git log
- 23/23 tests passing

---
*Phase: 10-gamification-and-metrics-dashboard*
*Completed: 2026-03-20*
