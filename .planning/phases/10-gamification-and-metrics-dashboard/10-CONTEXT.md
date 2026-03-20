# Phase 10: Gamification and Metrics Dashboard - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Add XP/rank progression system and metrics dashboard to the existing Quiz tab. Users earn XP from quiz answers and kaavya completions, progress through Sanskrit-themed rank tiers, view forgetting curve and vocabulary growth charts, and receive smart prompts when words are at risk of being forgotten. All metrics computed from existing IndexedDB data (reviewLogs, vocabItems, kaavyas, interpretations).

</domain>

<decisions>
## Implementation Decisions

### Dashboard Placement and Navigation
- Metrics dashboard lives as a sub-view within the Quiz tab, integrated below VocabularyDashboard
- Detailed charts accessible via expandable sections -- tap a stat card to expand inline chart (keeps single-column flow)
- XP/rank display persists in Quiz tab header -- compact rank badge + XP counter extends existing hearts/XP bar
- Smart quiz prompt banner appears at top of Quiz tab when words are at risk, with "Review Now" action

### XP and Rank Visual Design
- Rank badges use Sanskrit letter in colored circle -- first letter of Sanskrit rank name in tier-colored circle, matches parchment/ink theme
- Rank-up triggers confetti + rank-up card -- reuses existing confetti animation, shows "Rank Up!" card with new title and Sanskrit name
- XP animation on quiz answer: floating "+10 XP" text that rises and fades from the XP counter (CSS-only)
- Rank tier thresholds shown as progress bar to next tier with tier name, matches Duolingo progress feel

### Chart Visualization Style
- Forgetting curve: Recharts AreaChart with shaded area, parchment fill with accent-500 stroke
- Time range: 30-day default with 7/14/30 day toggle via pill buttons
- Vocabulary growth: stacked area chart showing New/Learning/Mastered states over time
- Chart colors: accent-500 (bronze) primary, green-500 mastered, amber-500 learning, ink-400 new, parchment-100 background

### Smart Quiz Prompting UX
- Banner appears on Quiz tab load when 5+ words have retrievability < 0.7
- Banner text: "X words fading -- review now" with accent-colored "Review Now" button starting a due-words quiz session
- Banner is dismissible per session (X button hides until next app load, state-only)
- Kaavya comprehension tracked as interpretation attempts per kaavya -- ShlokaInterpretation count + hint ratio as proxy metric, shown as "X/Y shlokas explored"

### Claude's Discretion
- Exact Recharts configuration and responsive breakpoints for charts
- Animation timing for floating XP text and rank-up celebration
- Exact spacing and padding within metrics cards
- How to handle empty states (no data yet) for charts and metrics
- Whether to show rank tier list or just current + next tier
- Chart tooltip formatting and interaction behavior

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- QuizView.tsx: Hearts component (lines 42-58), Confetti animation (lines 62-94), XP tracking (line 166), streak system (lines 27-38)
- VocabularyDashboard.tsx: Stat card layout, useLiveQuery pattern, getMasteryStats() integration
- quizEngine.ts: getMasteryStats() returns {total, newCount, learning, review, mastered, dueNow}
- srs.ts: storableToCard/cardToStorable converters, ts-fsrs integration with forgetting_curve() and get_retrievability()
- globals.css: confetti-fall, check-appear, fade-in animations; parchment/ink/accent color system

### Established Patterns
- Dexie + useLiveQuery for reactive IndexedDB queries
- Single-column centered layout (~640px max-width) with big rounded cards
- Pill-style tabs for sub-views (active = filled pill with accent-600 bg)
- 3D pressed buttons (border-b-4, active:border-b-2, active:translate-y-[2px])
- Sanskrit-themed text for feedback and labels

### Integration Points
- page.tsx: Quiz tab view state ("quiz") renders QuizView -- metrics integrates here
- schema.ts: Dexie v2 schema needs v3 extension for userStats table
- QuizView.tsx: Existing XP counter needs to read from persisted userStats instead of per-session state
- Tab navigation in page.tsx: 3 tabs (Analyze, Library, Quiz) -- no new tab needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches based on research recommendations.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>
