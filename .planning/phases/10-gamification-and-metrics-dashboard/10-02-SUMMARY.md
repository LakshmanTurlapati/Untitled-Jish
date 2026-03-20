---
phase: 10-gamification-and-metrics-dashboard
plan: 02
subsystem: ui
tags: [recharts, react, tailwind, charts, gamification, metrics]

requires:
  - phase: 10-gamification-and-metrics-dashboard/01
    provides: "Gamification engines (types, xpEngine, rankSystem, metricsEngine)"
provides:
  - "RankProgressCard component with rank badge, XP, and progress bar"
  - "ForgettingCurveChart component with Recharts AreaChart"
  - "VocabGrowthChart component with stacked areas"
  - "TimeRangePills component for 7/14/30 day toggle"
  - "SmartQuizPrompt banner for at-risk vocabulary"
  - "MetricsDashboard container orchestrating all metrics sections"
  - "xp-float CSS keyframe animation"
affects: [10-gamification-and-metrics-dashboard/03]

tech-stack:
  added: [recharts]
  patterns: [expandable-stat-cards, accordion-chart-display, useLiveQuery-reactive-metrics]

key-files:
  created:
    - src/app/components/RankProgressCard.tsx
    - src/app/components/ForgettingCurveChart.tsx
    - src/app/components/VocabGrowthChart.tsx
    - src/app/components/TimeRangePills.tsx
    - src/app/components/SmartQuizPrompt.tsx
    - src/app/components/MetricsDashboard.tsx
  modified:
    - package.json
    - src/app/globals.css

key-decisions:
  - "Recharts AreaChart for forgetting curve and vocab growth visualizations"
  - "Accordion pattern for stat card chart expansion (one chart visible at a time)"
  - "Average stability-based forgetting curve (not per-word) for dashboard summary view"

patterns-established:
  - "Expandable stat cards: 2x2 grid with accordion-style chart reveal below"
  - "Tier badge color mapping: replace text- prefix with bg- from RankTier.color"
  - "Chart empty states: centered text-sm message with py-8 padding"

requirements-completed: [GAME-01, GAME-04, METR-01, METR-03, METR-04, METR-05]

duration: 3min
completed: 2026-03-20
---

# Phase 10 Plan 02: UI Components Summary

**Recharts-powered metrics dashboard with rank badge, forgetting curve, vocab growth charts, and smart quiz prompt banner**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T22:38:48Z
- **Completed:** 2026-03-20T22:41:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Installed Recharts and created ForgettingCurveChart (accent stroke, parchment fill) and VocabGrowthChart (stacked mastered/learning/new areas)
- RankProgressCard displays tier badge with Sanskrit initial, XP total, and dual-axis progress bar
- SmartQuizPrompt shows dismissible banner when 5+ words at risk of forgetting
- MetricsDashboard orchestrates all sections with expandable stat cards and live IndexedDB data via useLiveQuery

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Recharts, add xp-float animation, create chart and pill components** - `6d416de` (feat)
2. **Task 2: RankProgressCard, SmartQuizPrompt, and MetricsDashboard container** - `c7d7bef` (feat)

## Files Created/Modified
- `package.json` - Added recharts dependency
- `src/app/globals.css` - Added xp-float keyframe animation
- `src/app/components/TimeRangePills.tsx` - 7d/14d/30d pill toggle buttons
- `src/app/components/ForgettingCurveChart.tsx` - Recharts AreaChart for forgetting curves
- `src/app/components/VocabGrowthChart.tsx` - Recharts stacked AreaChart for vocab growth
- `src/app/components/RankProgressCard.tsx` - Rank badge + XP + progress bar component
- `src/app/components/SmartQuizPrompt.tsx` - At-risk words review banner
- `src/app/components/MetricsDashboard.tsx` - Container orchestrating all metrics sections

## Decisions Made
- Used average stability across all reviewed items for the summary forgetting curve (per-word curves available via metricsEngine but too granular for dashboard)
- Accordion pattern for stat card expansion (only one chart visible at a time) to keep vertical space manageable
- Tier badge letter uses first character of sanskritName; Shishya tier gets parchment-50 letter color, all others white

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing app-shell.test.ts failure (unrelated to this plan's changes, confirmed by running test before any modifications)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 6 UI components ready for integration into QuizView (Plan 03)
- MetricsDashboard exports as a single component for easy embedding
- SmartQuizPrompt requires atRiskCount prop and onReviewNow callback from parent

---
*Phase: 10-gamification-and-metrics-dashboard*
*Completed: 2026-03-20*
