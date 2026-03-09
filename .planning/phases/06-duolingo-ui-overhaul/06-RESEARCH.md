# Phase 6: Duolingo-Style UI Overhaul - Research

**Researched:** 2026-03-09
**Domain:** Frontend UI/UX redesign (Tailwind CSS, React state, CSS animations)
**Confidence:** HIGH

## Summary

This phase is a pure frontend restyling and UX enhancement. No new libraries are needed -- everything is achievable with the existing stack (Tailwind v4, React 19, Next.js 16). The work breaks down into three distinct concerns: (1) restructuring the page layout and component hierarchy (hero input card, tabbed sections, sticky bottom bar), (2) restyling existing components with Duolingo-inspired visual patterns (big rounded cards, 3D buttons, pill badges, stacked meaning sections), and (3) adding gamification state and animations to the quiz (hearts, XP, streaks, celebration screen with CSS confetti).

The most complex work is the QuizView rewrite, which needs significant new state (hearts, XP, streak counter) and the celebration screen. The page.tsx and AnalysisView restructuring is medium complexity -- moving from a linear scroll layout to a tabbed single-column layout with sticky bottom bar. The component restyling (WordBreakdown, MeaningBadge, VocabularyList) is straightforward CSS work.

**Primary recommendation:** No new dependencies. Use Tailwind v4 custom CSS variables and `@keyframes` in globals.css for all animations. Keep quiz gamification state local to QuizView (no global state management needed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Big rounded Duolingo-style cards (16-20px border-radius, generous padding, chunky feel)
- Centered single column layout (~640px max-width), not multi-column grid
- Pill-shaped morphology badges (rounded-full, parchment-200 bg, ink-700 text)
- Meaning sources displayed as stacked sections with colored dots (green=MW, blue=Apte, amber=AI) -- not inline badges
- Minimal header: just "Sanskrit Analyzer" title, no subtitle, no sample verse -- jump straight to input
- Input area is a big hero card containing textarea, IAST preview, and image upload together
- Full Duolingo treatment: hearts, XP, streaks, celebration animations
- 3 hearts (lives) -- decorative motivation, quiz continues even at 0 hearts (not a hard gate)
- XP-style score tracking (+points per correct answer)
- Streak counter for consecutive correct answers (3x, 5x messages)
- Tap-to-select + "Check" button confirmation (not instant feedback on tap)
- Celebration screen on quiz completion: score, XP earned, hearts remaining, CSS confetti/sparkle animation
- "Practice Again" and "Back to Text" buttons on completion screen
- Step-by-step analysis progress: "Splitting sandhi..." -> "Analyzing morphology..." -> "Looking up meanings..." with progress bar and checkmarks
- Sanskrit-themed encouragement messages (Sadhu!, Ati uttamam!, etc.)
- 3D pressed buttons (border-b-4, active:border-b-2, active:translate-y-[2px])
- Sticky bottom action bar for primary action (Analyze / Check / Continue) -- always visible
- Tabbed sections after analysis: "Words" | "Vocabulary" | "Quiz"
- Pill-style tabs: active tab = filled pill (accent-600 bg, white text), inactive = text-only

### Claude's Discretion
- Exact CSS confetti/sparkle implementation for celebration screen
- Animation timing and easing curves
- Exact spacing values within the new card layouts
- How to handle transition animations between tabs (fade, slide, or instant)
- Loading skeleton design for initial page load
- Error state card styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Clean, scholar-friendly interface with proper Devanagari typography | Card-based layout redesign preserves existing Shobhika font and parchment/ink color scheme while adding Duolingo-inspired visual hierarchy |
| UI-02 | Word-by-word breakdown view showing all analysis properties | WordBreakdown restyling with big rounded cards, pill morphology badges, stacked meaning sections with colored dots |
</phase_requirements>

## Standard Stack

### Core (already installed, no changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4 | Utility-first CSS | Already in use, all styling done via utilities |
| react | 19.2.3 | UI framework | Already in use, hooks for gamification state |
| next | 16.1.6 | App framework | Already in use, page structure |

### Supporting (already installed, no changes)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | ^16.3.2 | Component testing | Testing restyled components |
| vitest | ^4.0.18 | Test runner | Running component tests |

### No New Dependencies Needed
| Problem | Why No Library |
|---------|---------------|
| CSS Confetti | Pure CSS @keyframes with small particle divs -- lightweight, no bundle cost |
| Tab Navigation | Simple React useState -- no routing library needed |
| Animations | CSS transitions + @keyframes -- no framer-motion needed for these effects |
| 3D Buttons | Tailwind utilities (border-b-4, active:translate-y) -- pure CSS |
| Progress Bar | Tailwind width transitions -- already proven in existing QuizView |

## Architecture Patterns

### Component Hierarchy Changes

```
page.tsx (simplified)
  |-- Header (minimal: title only)
  |-- HeroInputCard (new wrapper)
  |     |-- textarea + IAST preview
  |     |-- ImageUpload (moved inside)
  |-- StickyBottomBar (new)
  |     |-- Primary action button (Analyze/Check/Continue)
  |-- AnalysisView (restructured)
        |-- AnalysisProgress (new: step indicators during loading)
        |-- TabBar (new: Words | Vocabulary | Quiz)
        |-- WordsTab (WordBreakdown cards in single column)
        |-- VocabularyTab (restyled VocabularyList)
        |-- QuizTab (heavily reworked QuizView)
              |-- QuizHeader (hearts, progress bar, XP)
              |-- QuizQuestion (tap-to-select options)
              |-- QuizFeedback (Sanskrit encouragement)
              |-- CelebrationScreen (score, confetti, buttons)
```

### Pattern 1: Duolingo 3D Button

**What:** Thick bottom border that compresses on click for tactile feel
**When to use:** All primary action buttons (Analyze, Check, Continue, Practice Again)

```tsx
// 3D pressed button pattern
<button className={`
  rounded-xl bg-accent-600 text-white font-bold
  px-8 py-3
  border-b-4 border-accent-800
  active:border-b-2 active:translate-y-[2px]
  transition-all duration-75
  disabled:opacity-50 disabled:active:translate-y-0
`}>
  Check
</button>
```

### Pattern 2: Pill Tab Navigation

**What:** Tab bar with filled pill for active state, text-only for inactive
**When to use:** Switching between Words / Vocabulary / Quiz views

```tsx
const [activeTab, setActiveTab] = useState<'words' | 'vocabulary' | 'quiz'>('words');

<div className="flex gap-2 justify-center">
  {(['words', 'vocabulary', 'quiz'] as const).map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`
        rounded-full px-5 py-2 text-sm font-semibold transition-colors
        ${activeTab === tab
          ? 'bg-accent-600 text-white'
          : 'text-ink-700 hover:bg-parchment-200'
        }
      `}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ))}
</div>
```

### Pattern 3: Sticky Bottom Action Bar

**What:** Fixed bottom bar holding the primary CTA, always visible
**When to use:** Analyze button (input phase), Check button (quiz active), Continue/Next button (quiz answered)

```tsx
<div className="fixed bottom-0 left-0 right-0 bg-parchment-50/95 backdrop-blur-sm border-t border-parchment-200 p-4">
  <div className="mx-auto max-w-[640px]">
    <button className="w-full rounded-xl bg-accent-600 text-white font-bold px-8 py-3 border-b-4 border-accent-800 active:border-b-2 active:translate-y-[2px] transition-all duration-75">
      {actionLabel}
    </button>
  </div>
</div>
```

Note: Add `pb-24` to the main content container to prevent content from being hidden behind the sticky bar.

### Pattern 4: Step-by-Step Analysis Progress

**What:** Fake multi-step progress display during API call
**When to use:** While `/api/analyze` is loading

```tsx
const steps = [
  { label: "Splitting sandhi...", delay: 0 },
  { label: "Analyzing morphology...", delay: 1200 },
  { label: "Looking up meanings...", delay: 2800 },
];

// Use setTimeout or intervals to reveal steps progressively
// Each completed step gets a checkmark, current step has a spinner
```

Implementation note: The `/api/analyze` endpoint is a single call. The steps are cosmetic -- use timed intervals to simulate progress, then show all complete when the response arrives.

### Pattern 5: CSS Confetti Animation (Claude's discretion)

**What:** Lightweight CSS-only confetti for celebration screen
**When to use:** Quiz completion screen

```css
/* globals.css */
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes confetti-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

Generate 20-30 small colored divs (4x4px, various accent/parchment colors) with randomized animation-delay and animation-duration using inline styles. No external library needed.

### Pattern 6: Meaning Source Dots (replacing MeaningBadge)

**What:** Small colored circle + label instead of colored badge
**When to use:** Word meaning sections in WordBreakdown

```tsx
<div className="flex items-start gap-2">
  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
  <div>
    <span className="text-xs font-medium text-ink-600">Monier-Williams</span>
    <p className="text-sm text-ink-700">{definition}</p>
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Multi-column grids for word cards:** Decision locks single-column ~640px layout. Do not use `grid-cols-2` or `grid-cols-3`.
- **Instant feedback on quiz tap:** Decision requires tap-to-select + Check button. Do not auto-evaluate on option click.
- **Hearts as hard gates:** Hearts are decorative. Never block quiz progression when hearts reach 0.
- **Route-based tabs:** Use React state for tab switching, not Next.js routing. All tabs render in one page view.
- **Image/icon assets:** CSS/SVG only. Do not import PNG/JPG icons. Hearts and other icons must be inline SVG or Unicode.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab state management | Custom context/reducer | Simple `useState<'words'\|'vocabulary'\|'quiz'>` | Only 3 tabs, no complex state |
| Confetti library | npm package (canvas-confetti etc.) | CSS @keyframes + positioned divs | Zero bundle cost, simpler, decision says CSS-only |
| Heart/XP icons | Icon library (lucide, heroicons) | Inline SVG or Unicode (e.g., heart: SVG path, or Unicode U+2764) | Decision says no new image assets |
| Animation library | framer-motion | CSS transitions + @keyframes | All animations are simple transforms/opacity -- CSS handles this |

## Common Pitfalls

### Pitfall 1: Sticky Bottom Bar Covering Content
**What goes wrong:** Content at the bottom of the page gets hidden behind the fixed position bar.
**Why it happens:** Fixed positioning removes the element from document flow.
**How to avoid:** Add `pb-24` (or appropriate padding) to the main scrollable container.
**Warning signs:** Last word card or quiz option partially hidden.

### Pitfall 2: Quiz State Explosion
**What goes wrong:** Hearts, XP, streaks, phase, selected answer, current index -- too many useState calls become hard to manage.
**Why it happens:** Gamification adds several new state variables to an already stateful component.
**How to avoid:** Group related state into a single `useReducer` with a `QuizGameState` type. Actions: `SELECT_OPTION`, `CHECK_ANSWER`, `NEXT_QUESTION`, `COMPLETE_QUIZ`, `RESTART`.
**Warning signs:** More than 8 individual useState calls in one component.

### Pitfall 3: Test Fragility After Restyling
**What goes wrong:** Existing tests break because they query by text content or roles that change.
**Why it happens:** Restructuring components changes DOM structure, text labels change (e.g., "Correct!" -> "Sadhu! (Well done!)").
**How to avoid:** Update tests alongside components. Use data-testid for structural queries. Check all 14+ existing test files for breakage.
**Warning signs:** Test suite red after restyling a component but before updating its tests.

### Pitfall 4: Tab Transition Janky on Re-render
**What goes wrong:** Switching tabs causes layout shift or flash of unstyled content.
**Why it happens:** Heavy components (word cards, quiz) re-render on mount.
**How to avoid:** Keep all tab content mounted but hidden with `hidden` class or conditional `display: none`, OR accept re-mount with a brief fade transition. Recommendation: simple conditional render (unmount/remount) is fine for this app size -- no need for persistent tab state.

### Pitfall 5: Confetti Performance
**What goes wrong:** Too many animated particles cause jank on low-end devices.
**Why it happens:** CSS animations on 50+ positioned elements.
**How to avoid:** Limit to 20-30 confetti particles. Use `will-change: transform` sparingly. Set `animation-fill-mode: forwards` so particles don't loop.
**Warning signs:** Celebration screen feels sluggish.

### Pitfall 6: Analysis Progress Steps vs Actual API
**What goes wrong:** Steps finish too early or too late relative to the actual API response.
**Why it happens:** Fake progress steps run on timers while the real API takes variable time.
**How to avoid:** Run step timers independently but when API response arrives, immediately mark all steps complete. If the API is faster than expected, skip remaining step timers and show all checkmarks.

### Pitfall 7: 3D Button on Mobile Touch
**What goes wrong:** `:active` pseudo-class behaves differently on touch devices; press effect may not show.
**Why it happens:** Mobile browsers handle touch events differently from mouse clicks.
**How to avoid:** The effect still works on most modern mobile browsers with `:active`. Test on mobile. If needed, add `touch-action: manipulation` to buttons.

## Code Examples

### QuizView Gamification State (useReducer pattern)

```typescript
interface QuizGameState {
  questions: QuizQuestion[];
  currentIndex: number;
  phase: 'ready' | 'selecting' | 'checked' | 'complete';
  selectedOption: string | null;
  score: number;
  xp: number;
  hearts: number;
  streak: number;
  maxStreak: number;
}

type QuizAction =
  | { type: 'START'; questions: QuizQuestion[] }
  | { type: 'SELECT'; option: string }
  | { type: 'CHECK' }
  | { type: 'NEXT' }
  | { type: 'RESTART'; questions: QuizQuestion[] };

function quizReducer(state: QuizGameState, action: QuizAction): QuizGameState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        questions: action.questions,
        currentIndex: 0,
        phase: 'selecting',
        selectedOption: null,
        score: 0,
        xp: 0,
        hearts: 3,
        streak: 0,
        maxStreak: 0,
      };
    case 'SELECT':
      if (state.phase !== 'selecting') return state;
      return { ...state, selectedOption: action.option };
    case 'CHECK': {
      if (state.phase !== 'selecting' || !state.selectedOption) return state;
      const correct = state.selectedOption === state.questions[state.currentIndex].correctAnswer;
      const newStreak = correct ? state.streak + 1 : 0;
      return {
        ...state,
        phase: 'checked',
        score: correct ? state.score + 1 : state.score,
        xp: state.xp + (correct ? 10 : 0),
        hearts: correct ? state.hearts : Math.max(0, state.hearts - 1),
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
      };
    }
    case 'NEXT': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: 'complete' };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        phase: 'selecting',
        selectedOption: null,
      };
    }
    case 'RESTART':
      return quizReducer(state, { type: 'START', questions: action.questions });
    default:
      return state;
  }
}
```

### Heart Display (inline SVG, no image assets)

```tsx
function Hearts({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-6 w-6 ${i < count ? 'text-red-500' : 'text-parchment-200'}`} fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ))}
    </div>
  );
}
```

### Encouragement Messages

```typescript
const CORRECT_MESSAGES = [
  "Sadhu! (Well done!)",
  "Ati uttamam! (Excellent!)",
  "Bahu sundaram!",
  "Samicinam! (Correct!)",
];

const WRONG_MESSAGES = [
  "Punah prayatnah (Try again)",
  "Not quite -- keep learning!",
];

const STREAK_MESSAGES: Record<number, string> = {
  3: "On fire!",
  5: "Unstoppable!",
};

function getEncouragement(correct: boolean, streak: number): string {
  if (correct) {
    if (STREAK_MESSAGES[streak]) return STREAK_MESSAGES[streak];
    return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
  }
  return WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
}
```

### New CSS Variables Needed (globals.css additions)

```css
@theme {
  /* Existing tokens preserved */
  --color-accent-800: #78350f; /* Darker shade for 3D button border */
}

/* Confetti keyframes */
@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

/* Checkmark appear animation */
@keyframes check-appear {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* Fade in for tab content */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 6) | Impact |
|------------------------|----------------------|--------|
| Multi-column word grid | Single column ~640px card stack | More readable, Duolingo-like focus |
| Inline MeaningBadge pills | Stacked sections with colored dots | Clearer source distinction |
| Instant quiz answer feedback | Select + Check two-step flow | More deliberate, gamified feel |
| Simple score display | Hearts + XP + Streaks | Motivational gamification |
| Linear scroll layout | Tabbed sections | Cleaner navigation, less scrolling |
| Standard flat buttons | 3D pressed buttons | Tactile Duolingo signature feel |
| Generic "Correct!/Not quite" | Sanskrit-themed encouragement | Scholarly personality |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Minimal header renders title only | unit | `npx vitest run src/__tests__/app-shell.test.ts -t "title" -x` | Needs update |
| UI-01 | Hero input card contains textarea + ImageUpload | unit | `npx vitest run src/__tests__/text-input.test.tsx -x` | Needs update |
| UI-01 | 3D button styling present on primary actions | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file |
| UI-02 | Word cards render with pill badges and stacked meanings | unit | `npx vitest run src/__tests__/word-breakdown.test.tsx -x` | Needs update |
| UI-02 | Tab navigation switches between Words/Vocabulary/Quiz | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file |
| UI-01 | Quiz shows hearts, XP, streak counter | unit | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Needs update |
| UI-01 | Quiz tap-to-select + Check flow works | unit | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Needs update |
| UI-01 | Celebration screen shows score, XP, hearts, buttons | unit | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Needs update |
| UI-01 | Sticky bottom bar renders primary action | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file |
| UI-01 | Analysis progress steps display during loading | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/analysis-view.test.tsx` -- covers tab navigation, sticky bar, progress steps (new file needed)
- [ ] `src/__tests__/quiz-view.test.tsx` -- needs update for hearts/XP/streaks/Check button/celebration screen
- [ ] `src/__tests__/word-breakdown.test.tsx` -- needs update for pill badges and stacked meanings
- [ ] `src/__tests__/app-shell.test.ts` -- needs update for minimal header (no subtitle, no sample verse)
- [ ] `vitest.config.ts` -- needs `analysis-view.test.tsx` added to jsdom environment globs

## Open Questions

1. **accent-800 color token**
   - What we know: Existing theme only has accent-500 and accent-600. The 3D button needs a darker border shade.
   - What's unclear: Exact hex value for accent-800.
   - Recommendation: Derive from accent-600 (#92400e) -- use #78350f or similar darker amber. Add to @theme block.

2. **Tab content persistence vs remount**
   - What we know: Three tabs (Words, Vocabulary, Quiz). Quiz has complex state.
   - What's unclear: Should quiz state persist when switching away and back?
   - Recommendation: Remount is fine. Quiz starts from "ready" state each time. Vocabulary tab is stateless. This avoids complexity and matches Duolingo's pattern.

3. **AnalysisView refactor scope**
   - What we know: AnalysisView currently owns the form, API call, results, and renders all sub-components linearly.
   - What's unclear: Whether to extract the input card and sticky bar to page.tsx or keep in AnalysisView.
   - Recommendation: Keep AnalysisView as the main orchestrator. Extract the input section into an internal component but keep state management centralized. page.tsx stays minimal.

## Sources

### Primary (HIGH confidence)
- Existing codebase inspection -- all 6 component files, globals.css, page.tsx, layout.tsx, vitest.config.ts, package.json
- Tailwind v4 @theme syntax -- verified in existing globals.css

### Secondary (MEDIUM confidence)
- Duolingo UI patterns -- well-documented public design language (3D buttons, hearts, streaks, single-column layout)
- CSS @keyframes confetti techniques -- widely established pure-CSS pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything is in-place already
- Architecture: HIGH -- component restructuring is well-scoped, all current code reviewed
- Pitfalls: HIGH -- based on direct codebase inspection and known CSS/React patterns

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no moving dependencies)
