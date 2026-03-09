# Phase 6: Duolingo-Style UI Overhaul - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the existing interface with Duolingo-inspired UX patterns — gamified feel, clear progress indicators, card-based layouts, friendly micro-interactions — while preserving the warm academic parchment/ink color scheme. No new image assets. CSS/SVG-only visual enhancements.

</domain>

<decisions>
## Implementation Decisions

### Card & Layout Feel
- Big rounded Duolingo-style cards (16-20px border-radius, generous padding, chunky feel)
- Centered single column layout (~640px max-width), not multi-column grid
- Pill-shaped morphology badges (rounded-full, parchment-200 bg, ink-700 text)
- Meaning sources displayed as stacked sections with colored dots (green=MW, blue=Apte, amber=AI) — not inline badges
- Minimal header: just "Sanskrit Analyzer" title, no subtitle, no sample verse — jump straight to input
- Input area is a big hero card containing textarea, IAST preview, and image upload together

### Quiz Gamification
- Full Duolingo treatment: hearts, XP, streaks, celebration animations
- 3 hearts (lives) — decorative motivation, quiz continues even at 0 hearts (not a hard gate)
- XP-style score tracking (+points per correct answer)
- Streak counter for consecutive correct answers (3x, 5x messages)
- Tap-to-select + "Check" button confirmation (not instant feedback on tap)
- Celebration screen on quiz completion: score, XP earned, hearts remaining, CSS confetti/sparkle animation
- "Practice Again" and "Back to Text" buttons on completion screen

### Progress & Feedback
- Step-by-step analysis progress: "Splitting sandhi..." → "Analyzing morphology..." → "Looking up meanings..." with progress bar and checkmarks
- Sanskrit-themed encouragement messages:
  - Correct: "Sādhu! (Well done!)", "Ati uttamam! (Excellent!)", "Bahu sundaram!", "Samīcīnam! (Correct!)"
  - Wrong: "Punaḥ prayatnaḥ (Try again)", "Not quite — keep learning!"
  - Streaks: 3x "On fire!", 5x "Unstoppable!"
- 3D pressed buttons (Duolingo signature): thick bottom border in darker shade, shifts down on click (border-b-4, active:border-b-2, active:translate-y-[2px])
- Sticky bottom action bar for primary action (Analyze / Check / Continue) — always visible

### Page Flow & Sections
- Tabbed sections after analysis: "Words" | "Vocabulary" | "Quiz"
- Pill-style tabs: active tab = filled pill (accent-600 bg, white text), inactive = text-only (ink-700, hover:parchment-200)
- Each tab renders its own view (not scrollable sections)

### Claude's Discretion
- Exact CSS confetti/sparkle implementation for celebration screen
- Animation timing and easing curves
- Exact spacing values within the new card layouts
- How to handle transition animations between tabs (fade, slide, or instant)
- Loading skeleton design for initial page load
- Error state card styling

</decisions>

<specifics>
## Specific Ideas

- Duolingo's signature 3D button press effect (thick bottom border that shrinks on active) for all primary action buttons
- Sanskrit-themed encouragement blends scholarly tone with gamification ("Sādhu!" not just "Nice!")
- Hearts are motivational decoration, not punishment — quiz always lets you continue
- Tab navigation keeps everything in one page view without actual route changes

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnalysisView.tsx`: Main orchestrator — needs restructuring for tabs and sticky bottom bar
- `WordBreakdown.tsx`: Word card — needs restyling with big rounded cards, pill badges, stacked meanings
- `MeaningBadge.tsx`: Source badge — replace with stacked dot+label pattern
- `QuizView.tsx`: Quiz component — heavy rework for hearts, XP, tap-to-select, celebration screen
- `VocabularyList.tsx`: Collapsible vocab — becomes its own tab view
- `ImageUpload.tsx`: Drag-drop uploader — moves inside the hero input card

### Established Patterns
- Tailwind v4 utility-first with custom CSS variables in `@theme` block (globals.css)
- Design tokens: `--color-parchment-{50,100,200}`, `--color-ink-{700,800,900}`, `--color-accent-{500,600}`
- `font-sanskrit` class for Devanagari text (Shobhika font)
- `transition-colors` and `transition-all duration-300` for existing animations
- `animate-pulse` for loading states
- Responsive: `md:` and `lg:` breakpoints (less relevant with single-column layout)

### Integration Points
- `page.tsx`: Hero section + AnalysisView integration — needs restructuring
- `globals.css`: May need new CSS variables for 3D button shadows, confetti keyframes
- `generateQuiz()` in `src/lib/quiz.ts`: Quiz logic unchanged, UI-only changes in QuizView
- `/api/analyze` and `/api/distractors`: Backend unchanged, only frontend restyled

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-duolingo-ui-overhaul*
*Context gathered: 2026-03-09*
