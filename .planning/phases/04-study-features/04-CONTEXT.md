# Phase 4: Study Features - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can study vocabulary extracted from analyzed texts through filtered word lists and interactive quizzes. This phase adds two features on top of existing analysis results: a unique word list (filtering common particles) and a word-to-meaning MCQ quiz. No persistent state, no spaced repetition, no additional quiz formats.

</domain>

<decisions>
## Implementation Decisions

### Word List Presentation
- Appears below analysis results as a collapsible section
- Each word shows: Devanagari + IAST + primary meaning + word type tag (e.g., धर्म (dharma) [noun, m.] — righteousness, duty)
- Words listed in order of appearance in the text
- Hardcoded particle filter list (ca, tu, hi, eva, api, iti, atha, tatha, yatha, etc.) — no user customization

### Quiz Flow & Interaction
- One question at a time with progress indicator (e.g., 3/10)
- Instant feedback: green highlight for correct, red for wrong + show correct answer, then "Next" button
- 4 answer options per question (1 correct + 3 distractors)
- Duolingo-style progress bar that fills as user advances through questions
- Encouraging feedback on correct/incorrect (not just color — brief text like "Correct!" or "Not quite")
- Retake anytime — "Retake Quiz" button after completion, questions reshuffled

### Distractor Generation
- Primary source: meanings of other words from the same analyzed text
- Fallback: random MW dictionary definitions when text has fewer than 4 unique words
- Correct answer = contextual_meaning from LLM analysis (passage-specific meaning)
- Options shuffled in random order each attempt

### Navigation Between Modes
- "View Vocabulary" and "Start Quiz" buttons appear below analysis results only after successful analysis
- Word list and quiz render inline below analysis (same page, no tabs or modals)
- User can scroll up to reference analysis while in quiz
- Linear flow: Analysis → Vocabulary → Quiz (all on same page)

### Claude's Discretion
- Exact Duolingo-style progress bar design and animation
- Quiz completion summary layout
- Word list section collapse/expand behavior
- Specific encouraging feedback messages
- How many quiz questions to generate (all unique words or capped)

</decisions>

<specifics>
## Specific Ideas

- "Duolingo style" quiz experience — progress bar fills, encouraging micro-feedback per question
- Quiz should feel like a study tool, not an exam — low pressure, retakeable
- Contextual meanings (from LLM) as correct answers rather than raw dictionary definitions — tests understanding of the passage

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EnrichedWord` type (`src/lib/analysis/types.ts`): Has all needed fields — original, iast, morphology (word_type, linga, vacana), mw_definitions, apte_definitions, contextual_meaning
- `WordBreakdown` component: Existing word display — vocabulary list can use a simpler variant
- `MeaningBadge` component: Source distinction (MW green, Apte blue, AI amber) — could annotate vocab items
- `devanagariToIast` utility: Already used in AnalysisView for IAST preview
- Design tokens: parchment-*, ink-*, accent-* palette established across all phases

### Established Patterns
- Client-side state in AnalysisView with useState hooks (inputText, analysisResult, isLoading, error)
- Analysis results stored as `EnrichedWord[]` — vocabulary extraction and quiz generation can operate on this array client-side
- Tailwind CSS with custom design tokens for all styling
- Grid layout for word cards (1-col mobile, 2-col md, 3-col lg)

### Integration Points
- AnalysisView component (`src/app/components/AnalysisView.tsx`): Word list and quiz sections attach below existing analysis result grid
- `analysisResult` state (EnrichedWord[]): Source data for vocabulary extraction and quiz generation
- No new API routes needed — vocabulary extraction and quiz logic can be purely client-side
- Dictionary db (`src/lib/dictionary/lookup.ts`): Fallback distractor source when text has few unique words

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-study-features*
*Context gathered: 2026-03-09*
