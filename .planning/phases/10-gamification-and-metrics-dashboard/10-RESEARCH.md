# Phase 10: Gamification and Metrics Dashboard - Research

**Researched:** 2026-03-19
**Domain:** Gamification systems, data visualization, spaced repetition analytics
**Confidence:** HIGH

## Summary

Phase 10 adds an XP/rank progression system and a metrics dashboard with forgetting curve visualizations, vocabulary growth trends, and kaavya comprehension tracking. The project already has foundational gamification elements (hearts, XP counter, streaks, confetti in QuizView) and a VocabularyDashboard with mastery stats. The existing ts-fsrs library provides built-in `forgetting_curve()` and `get_retrievability()` functions that directly enable forgetting curve visualization without custom math. Recharts is the standard React charting library for this use case -- SVG-based, composable, and React-native.

The core technical challenge is twofold: (1) designing a clean data layer that computes XP totals, rank tiers, and time-series metrics from existing IndexedDB tables (vocabItems, reviewLogs, kaavyas, interpretations) without new API endpoints, and (2) building chart visualizations using Recharts that render forgetting curves and growth trends from this data. The existing Dexie schema and review log data already contain everything needed -- no new tables are strictly required, though a lightweight gamification state table (for persisted XP/rank) is recommended.

**Primary recommendation:** Add Recharts for charts, create a gamification service layer (`src/lib/gamification/`) that computes XP/rank from existing data, extend the Dexie schema to v3 with a `userStats` table for persisted XP/rank state, and build a MetricsDashboard component as a new top-level tab.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-01 | Personal rank/tier progression system (unlockable levels) | Rank tier definitions, mastery count + kaavyas read as progression axes, Dexie userStats table |
| GAME-02 | XP system -- words give less XP than kaavyas completed | XP computation from reviewLogs (per-answer XP) + kaavya reading completion tracking, differential XP values |
| GAME-03 | Rank updates based on word mastery count and kaavyas/puranas read | Dual-axis rank formula using getMasteryStats().mastered + kaavyas with ReadingState at last page |
| GAME-04 | Game-like feel with dopamine-driven engagement (progress, achievements, streaks) | Existing streak/hearts/confetti patterns in QuizView, XP animation, rank-up celebration, achievement badges |
| METR-01 | Forgetting curve visualization -- track how quickly user forgets words over time | ts-fsrs forgetting_curve() generates curve data points, Recharts LineChart renders them |
| METR-02 | Smart quiz prompting -- only notify when analysis shows user is likely to forget | ts-fsrs get_retrievability() on each card, threshold-based notification banner (not push notification -- no service worker in v1.1) |
| METR-03 | Kaavya comprehension tracking -- how well user understands texts (via AI agent feedback) | ShlokaInterpretation count per kaavya + hint count ratio as proxy metric |
| METR-04 | Rank progress and XP needed for next tier | Progress bar showing current XP vs next tier threshold, tier badge display |
| METR-05 | Vocabulary growth trends -- words over time, mastery rate | Time-series from vocabItems.addedAt, mastery transitions from reviewLogs, Recharts AreaChart |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 | React charting (line, area, bar charts) | React-native SVG, composable, 3.6M+ weekly downloads, declarative API |
| ts-fsrs | 5.3.0 (installed) | Forgetting curve math, retrievability | Already in project; has forgetting_curve() and get_retrievability() built-in |
| dexie | 4.3.0 (installed) | IndexedDB persistence | Already in project; schema v3 for userStats table |
| dexie-react-hooks | 4.2.0 (installed) | Reactive queries for dashboard | Already in project; useLiveQuery for real-time stats |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-icons | 5.6.0 (installed) | Icons for rank badges, achievement indicators | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js + react-chartjs-2 | Canvas-based, less React-native, worse for SVG composability |
| recharts | visx (Airbnb) | Lower-level, more control but more code for simple charts |
| recharts | CSS-only charts | No library dependency but limited to simple bar/progress charts |

**Installation:**
```bash
npm install recharts
```

**Note:** recharts v3.8.0 is verified current as of 2026-03-19 via npm registry.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    gamification/
      types.ts          # XP, Rank, Achievement types
      xpEngine.ts       # XP calculation from quiz answers + kaavya completions
      rankSystem.ts     # Rank tier definitions, progression logic
      metricsEngine.ts  # Forgetting curve data, growth trends, comprehension metrics
  app/
    components/
      MetricsDashboard.tsx    # Main dashboard with tabs/sections
      ForgettingCurveChart.tsx # Recharts line chart for forgetting curves
      VocabGrowthChart.tsx     # Recharts area chart for vocab over time
      RankProgressCard.tsx     # Current rank, XP bar, next tier
      AchievementBadge.tsx     # Individual achievement display
      SmartQuizPrompt.tsx      # Banner when words are about to be forgotten
```

### Pattern 1: Gamification Service Layer (Pure Logic)
**What:** All XP, rank, and metrics computation in pure functions under `src/lib/gamification/`, no UI dependencies
**When to use:** Always -- keeps logic testable and separate from React components
**Example:**
```typescript
// src/lib/gamification/xpEngine.ts
export const XP_VALUES = {
  quizCorrect: 10,      // per correct quiz answer
  quizStreak3: 5,       // bonus for 3-streak
  quizStreak5: 10,      // bonus for 5-streak
  kaavyaComplete: 100,  // completing a full kaavya reading
} as const;

export function computeTotalXP(
  reviewLogs: ReviewLog[],
  completedKaavyas: number
): number {
  const quizXP = reviewLogs.filter(r => r.rating >= 3).length * XP_VALUES.quizCorrect;
  const kaavyaXP = completedKaavyas * XP_VALUES.kaavyaComplete;
  return quizXP + kaavyaXP;
}
```

### Pattern 2: Rank Tier System
**What:** Sanskrit-themed rank progression based on dual axes (mastered words + kaavyas read)
**When to use:** GAME-01, GAME-03
**Example:**
```typescript
// src/lib/gamification/rankSystem.ts
export interface RankTier {
  name: string;
  sanskritName: string;
  minMastered: number;
  minKaavyas: number;
  color: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: "Beginner",    sanskritName: "Shishya",     minMastered: 0,   minKaavyas: 0, color: "text-ink-600" },
  { name: "Learner",     sanskritName: "Adhyayin",    minMastered: 10,  minKaavyas: 0, color: "text-blue-500" },
  { name: "Scholar",     sanskritName: "Vidvan",      minMastered: 50,  minKaavyas: 1, color: "text-green-500" },
  { name: "Pandit",      sanskritName: "Pandit",      minMastered: 100, minKaavyas: 2, color: "text-accent-500" },
  { name: "Acharya",     sanskritName: "Acharya",     minMastered: 250, minKaavyas: 3, color: "text-purple-500" },
  { name: "Mahavidvan",  sanskritName: "Mahavidvan",  minMastered: 500, minKaavyas: 5, color: "text-amber-500" },
];

export function getCurrentRank(masteredCount: number, kaavyasRead: number): RankTier {
  // Highest tier where BOTH criteria are met
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (masteredCount >= RANK_TIERS[i].minMastered && kaavyasRead >= RANK_TIERS[i].minKaavyas) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}
```

### Pattern 3: Forgetting Curve Data Generation Using ts-fsrs
**What:** Use ts-fsrs's built-in forgetting_curve() to generate visualization data points
**When to use:** METR-01
**Example:**
```typescript
// src/lib/gamification/metricsEngine.ts
import { FSRS, generatorParameters } from 'ts-fsrs';

const fsrs = new FSRS(generatorParameters());

// Generate forgetting curve data points for a given stability value
export function generateForgettingCurveData(
  stability: number,
  maxDays: number = 30
): { day: number; retrievability: number }[] {
  const points: { day: number; retrievability: number }[] = [];
  for (let day = 0; day <= maxDays; day++) {
    const r = fsrs.forgetting_curve(day, stability);
    points.push({ day, retrievability: Math.round(r * 100) });
  }
  return points;
}
```

### Pattern 4: Dexie Schema v3 for Gamification State
**What:** Extend existing Dexie schema with a userStats singleton table
**When to use:** Persisting XP total, current rank, achievement unlocks across sessions
**Example:**
```typescript
// In schema.ts -- add version 3
db.version(3).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
  vocabItems: '++id, stem, kaavyaId, state, due',
  reviewLogs: '++id, vocabItemId, rating, reviewedAt',
  userStats: '++id',  // Singleton row for persisted gamification state
});
```

### Pattern 5: Smart Quiz Prompting (In-App Banner, Not Push)
**What:** Check retrievability of all cards, show banner when enough words are at risk
**When to use:** METR-02 -- note that push notifications (NOTF-01) are explicitly v2/future scope
**Example:**
```typescript
export function getAtRiskWords(vocabItems: VocabItem[], threshold: number = 0.7): VocabItem[] {
  const fsrs = new FSRS(generatorParameters());
  return vocabItems.filter(item => {
    if (item.state === 0) return false; // New items don't have a curve
    const card = storableToCard(item);
    const retrievability = fsrs.get_retrievability(card, new Date(), false);
    return retrievability < threshold;
  });
}
```

### Anti-Patterns to Avoid
- **Recomputing XP from scratch on every render:** Cache the total in userStats, update incrementally after each quiz answer
- **Storing chart data in IndexedDB:** Compute chart data on-the-fly from reviewLogs and vocabItems -- it's fast enough for local data
- **Adding a new top-level tab for metrics only:** Instead, integrate metrics into the existing Quiz tab below the VocabularyDashboard, or add a "Metrics" sub-view within Quiz
- **Push notifications in v1.1:** NOTF-01 is explicitly v2 scope. Smart prompting should be in-app banners only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Forgetting curve math | Custom exponential/power decay formula | ts-fsrs `forgetting_curve()` and `get_retrievability()` | FSRS uses research-backed power law; already installed |
| Line/area charts | SVG path generation, canvas drawing | Recharts `<LineChart>`, `<AreaChart>` | Responsive, tooltips, animations, accessibility built-in |
| Reactive data queries | Manual IndexedDB polling, useEffect + state | Dexie `useLiveQuery` | Auto-updates when data changes, already used in project |
| Time-series bucketing | Manual date grouping | Simple reduce over addedAt/reviewedAt dates | Data is small enough (local only) that a simple reduce suffices |

**Key insight:** The entire forgetting curve visualization chain is already available: ts-fsrs computes retrievability, Recharts renders it. The only new code is the glue between data and chart components.

## Common Pitfalls

### Pitfall 1: XP State Inconsistency
**What goes wrong:** XP shown in QuizView header (currently +10 per correct) doesn't match persisted XP total
**Why it happens:** QuizView currently computes XP locally in reducer state but never persists it
**How to avoid:** After quiz completion, write the earned XP to the userStats table. The QuizView reducer XP is session-display-only; the persisted total is source of truth
**Warning signs:** XP resets to 0 when user refreshes the page

### Pitfall 2: Recharts Bundle Size
**What goes wrong:** Recharts adds ~200KB to bundle (gzipped ~60KB)
**Why it happens:** It includes D3 submodules
**How to avoid:** Dynamic import the MetricsDashboard component (already the project pattern -- see page.tsx dynamic imports with ssr: false)
**Warning signs:** Build size warnings from Next.js

### Pitfall 3: Kaavya "Completion" Definition
**What goes wrong:** No clear definition of when a kaavya is "complete" for XP purposes
**Why it happens:** ReadingState tracks currentPage/totalPages but there is no "completed" flag
**How to avoid:** Define completion as `readingState.currentPage === readingState.totalPages`. Compute from existing data, no schema change needed
**Warning signs:** Users getting kaavya XP before finishing

### Pitfall 4: Forgetting Curve for New Cards
**What goes wrong:** Attempting to render forgetting curves for cards with state=New (no stability data)
**Why it happens:** New cards have stability=0 and no review history
**How to avoid:** Filter to state !== State.New before computing curves. Show "Not enough data" for words with < 2 reviews
**Warning signs:** Division by zero or flat lines in charts

### Pitfall 5: Comprehension Tracking Proxy
**What goes wrong:** METR-03 asks for "kaavya comprehension tracking via AI agent feedback" but there's no direct comprehension score
**Why it happens:** ShlokaInterpretation stores hints received but not a score
**How to avoid:** Use proxy metrics: interpretations attempted per kaavya, average hints needed (fewer = better comprehension), ratio of shlokas interpreted to total shlokas
**Warning signs:** Overpromising a "comprehension score" when data only supports activity metrics

### Pitfall 6: Overcomplicating Rank Persistence
**What goes wrong:** Trying to store rank history, rank-up events, etc.
**Why it happens:** Over-engineering for v1.1
**How to avoid:** Rank is a derived value from mastered count + kaavyas read. Only persist the last-seen rank in userStats to detect rank-ups (show celebration when rank changes)
**Warning signs:** Complex migration scripts for rank history tables

## Code Examples

### Recharts Forgetting Curve Chart
```typescript
// Source: Recharts official docs + ts-fsrs API
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ForgettingCurveChartProps {
  data: { day: number; retrievability: number }[];
  stability: number;
}

export function ForgettingCurveChart({ data, stability }: ForgettingCurveChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3dbb1" />
          <XAxis dataKey="day" label={{ value: "Days", position: "bottom" }} />
          <YAxis domain={[0, 100]} label={{ value: "Recall %", angle: -90 }} />
          <Tooltip />
          <Line type="monotone" dataKey="retrievability" stroke="#92400e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Vocabulary Growth Area Chart
```typescript
// Time-series from vocabItems.addedAt
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Compute cumulative word count by date
function computeGrowthData(vocabItems: VocabItem[]): { date: string; total: number }[] {
  const sorted = [...vocabItems].sort(
    (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
  );
  const byDate = new Map<string, number>();
  let cumulative = 0;
  for (const item of sorted) {
    const date = item.addedAt.slice(0, 10); // YYYY-MM-DD
    cumulative++;
    byDate.set(date, cumulative);
  }
  return Array.from(byDate, ([date, total]) => ({ date, total }));
}
```

### XP Persistence After Quiz Completion
```typescript
// In QuizView completion handler or a wrapper
async function persistQuizXP(earnedXP: number): Promise<void> {
  const stats = await db.userStats.toCollection().first();
  if (stats) {
    await db.userStats.update(stats.id!, { totalXP: (stats.totalXP ?? 0) + earnedXP });
  } else {
    await db.userStats.add({ totalXP: earnedXP });
  }
}
```

### Smart Quiz Prompt Banner
```typescript
// Check on Quiz tab mount -- show banner if words at risk
export function useAtRiskCount(threshold = 0.7): number {
  const count = useLiveQuery(async () => {
    const items = await db.vocabItems.toArray();
    const fsrs = new FSRS(generatorParameters());
    return items.filter(item => {
      if (item.state === 0) return false;
      const card = storableToCard(item);
      return fsrs.get_retrievability(card, new Date(), false) < threshold;
    }).length;
  });
  return count ?? 0;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SM-2 forgetting curves (exponential) | FSRS power-law curves | FSRS v4+ (2023) | Better fit to real memory data |
| Chart.js with react-chartjs-2 wrapper | Recharts (React-native) | Recharts v2+ (2022) | Declarative, composable, no ref management |
| Push notifications for review reminders | In-app banners + at-risk detection | Current best practice for web apps without SW | No service worker dependency |

**Deprecated/outdated:**
- SM-2 algorithm: Replaced by FSRS in this project (Phase 9 decision)
- recharts v2.x: v3.x is current, uses React 18+ features

## Open Questions

1. **Metrics Tab vs Quiz Tab Integration**
   - What we know: Currently 3 tabs (Analyze, Library, Quiz). Quiz tab has VocabularyDashboard + QuizModeSelector
   - What's unclear: Should Metrics be a 4th top-level tab, or integrated into the Quiz tab?
   - Recommendation: Add as a 4th "Progress" tab -- keeps Quiz tab focused on quiz action, Progress tab for reflection/analytics. This matches the Duolingo pattern (separate "Profile" section for stats).

2. **Kaavya Completion Detection**
   - What we know: ReadingState has currentPage/totalPages
   - What's unclear: Should we mark kaavyas as "completed" permanently or allow re-reading for more XP?
   - Recommendation: First completion awards XP; re-reading does not award additional completion XP (but re-quizzing still earns per-answer XP)

3. **Achievement System Scope**
   - What we know: GAME-04 asks for "achievements, streaks" -- streaks already exist in QuizView
   - What's unclear: How many achievements to define for v1.1?
   - Recommendation: Keep it minimal -- 5-8 milestone achievements (first quiz, first mastered word, 10 mastered, first kaavya read, etc.). Can expand in v2.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | Rank tier computation from mastery + kaavyas | unit | `npx vitest run src/lib/__tests__/rank-system.test.ts -x` | No - Wave 0 |
| GAME-02 | XP calculation: quiz answers vs kaavya completion | unit | `npx vitest run src/lib/__tests__/xp-engine.test.ts -x` | No - Wave 0 |
| GAME-03 | Rank updates on mastery count change | unit | `npx vitest run src/lib/__tests__/rank-system.test.ts -x` | No - Wave 0 |
| GAME-04 | Streak messages, XP animation triggers | manual-only | Manual visual verification | N/A |
| METR-01 | Forgetting curve data generation | unit | `npx vitest run src/lib/__tests__/metrics-engine.test.ts -x` | No - Wave 0 |
| METR-02 | At-risk word detection with retrievability threshold | unit | `npx vitest run src/lib/__tests__/metrics-engine.test.ts -x` | No - Wave 0 |
| METR-03 | Comprehension proxy metric computation | unit | `npx vitest run src/lib/__tests__/metrics-engine.test.ts -x` | No - Wave 0 |
| METR-04 | Rank progress display data | unit | `npx vitest run src/lib/__tests__/rank-system.test.ts -x` | No - Wave 0 |
| METR-05 | Vocabulary growth time-series computation | unit | `npx vitest run src/lib/__tests__/metrics-engine.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/lib/__tests__/xp-engine.test.ts` -- covers GAME-02
- [ ] `src/lib/__tests__/rank-system.test.ts` -- covers GAME-01, GAME-03, METR-04
- [ ] `src/lib/__tests__/metrics-engine.test.ts` -- covers METR-01, METR-02, METR-03, METR-05
- [ ] vitest.config.ts -- no changes needed, fake-indexeddb already in setupFiles

## Sources

### Primary (HIGH confidence)
- ts-fsrs npm package (v5.3.0 installed) - forgetting_curve(), get_retrievability() verified in node_modules type definitions
- Recharts npm registry - v3.8.0 verified current via `npm view recharts version`
- Existing codebase: QuizView.tsx, VocabularyDashboard.tsx, schema.ts, quizEngine.ts, srs.ts, types.ts

### Secondary (MEDIUM confidence)
- [FSRS Algorithm Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) - forgetting curve formula R(t,S) = (1 + FACTOR * t/(9*S))^DECAY
- [Expertium FSRS explanation](https://expertium.github.io/Algorithm.html) - three-component model (difficulty, stability, retrievability)
- [Recharts vs Chart.js comparison](https://stackshare.io/stackups/js-chart-vs-recharts) - React-native SVG vs Canvas

### Tertiary (LOW confidence)
- Achievement system design patterns - based on common gamification practices, not verified against specific research

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - recharts verified via npm, ts-fsrs already installed and API confirmed in type defs
- Architecture: HIGH - follows existing project patterns (service layer + components, Dexie schemas, dynamic imports)
- Pitfalls: HIGH - identified from direct code analysis of existing QuizView XP handling, schema structure, and reading state
- Gamification design: MEDIUM - rank tiers and XP values are subjective design decisions, can be tuned

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, no fast-moving dependencies)
