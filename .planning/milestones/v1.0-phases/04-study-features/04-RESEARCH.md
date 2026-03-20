# Phase 4: Study Features - Research

**Researched:** 2026-03-09
**Domain:** Client-side vocabulary extraction, quiz generation, React UI
**Confidence:** HIGH

## Summary

Phase 4 is a purely client-side feature layer that operates on the existing `EnrichedWord[]` analysis result. No new API routes, no new dependencies, no persistent state. The two features -- vocabulary list and MCQ quiz -- are built from data already present in the analysis pipeline output.

The vocabulary extraction is a straightforward filter-and-deduplicate operation on the `EnrichedWord[]` array. The quiz generator selects words, uses `contextual_meaning` as the correct answer, and draws distractors from other words' meanings (with a dictionary API fallback for small texts). All UI renders inline below the existing analysis grid in `AnalysisView.tsx`.

**Primary recommendation:** Build this entirely client-side with React state management. Two new components (VocabularyList, QuizView) plus a utility module for vocabulary extraction and quiz generation logic. The only server-side touch point is a potential API route for dictionary-based fallback distractors when the analyzed text has fewer than 4 unique words.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Word list appears below analysis results as a collapsible section
- Each word shows: Devanagari + IAST + primary meaning + word type tag (e.g., dharma (dharma) [noun, m.] -- righteousness, duty)
- Words listed in order of appearance in the text
- Hardcoded particle filter list (ca, tu, hi, eva, api, iti, atha, tatha, yatha, etc.) -- no user customization
- One question at a time with progress indicator (e.g., 3/10)
- Instant feedback: green highlight for correct, red for wrong + show correct answer, then "Next" button
- 4 answer options per question (1 correct + 3 distractors)
- Duolingo-style progress bar that fills as user advances through questions
- Encouraging feedback on correct/incorrect (brief text like "Correct!" or "Not quite")
- Retake anytime -- "Retake Quiz" button after completion, questions reshuffled
- Distractor primary source: meanings of other words from the same analyzed text
- Fallback: random MW dictionary definitions when text has fewer than 4 unique words
- Correct answer = contextual_meaning from LLM analysis (passage-specific meaning)
- Options shuffled in random order each attempt
- "View Vocabulary" and "Start Quiz" buttons appear below analysis results only after successful analysis
- Word list and quiz render inline below analysis (same page, no tabs or modals)
- User can scroll up to reference analysis while in quiz
- Linear flow: Analysis -> Vocabulary -> Quiz (all on same page)

### Claude's Discretion
- Exact Duolingo-style progress bar design and animation
- Quiz completion summary layout
- Word list section collapse/expand behavior
- Specific encouraging feedback messages
- How many quiz questions to generate (all unique words or capped)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STDY-01 | App extracts unique words from analyzed text, filtering common particles (ca, tu, hi, eva, api, etc.) | Vocabulary extraction utility filters `EnrichedWord[]` by removing particles via hardcoded set, deduplicating by stem, preserving appearance order |
| STDY-02 | App generates word-to-meaning MCQ quiz from extracted vocabulary with plausible distractors | Quiz generator creates questions from vocabulary list, uses `contextual_meaning` as correct answer, draws distractors from sibling words or MW dictionary fallback |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI components and state | Already in project |
| Next.js | 16.1.6 | App framework | Already in project |
| Tailwind CSS | v4 | Styling | Already in project, design tokens established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-sqlite3 | 12.6.2 | Dictionary fallback distractors | Only when analyzed text has < 4 unique words |

### Alternatives Considered
None. This phase requires zero new dependencies. All functionality is built with React state + existing project infrastructure.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    study/
      vocabulary.ts        # extractVocabulary() - filter, dedupe, order
      quiz.ts              # generateQuiz() - question/answer generation
      particles.ts         # COMMON_PARTICLES set
      types.ts             # VocabularyWord, QuizQuestion, QuizState types
  app/
    components/
      VocabularyList.tsx   # Collapsible word list below analysis
      QuizView.tsx         # MCQ quiz with progress bar and feedback
    api/
      distractors/
        route.ts           # GET endpoint for MW fallback distractors (optional)
```

### Pattern 1: Vocabulary Extraction Pipeline
**What:** Pure function that transforms `EnrichedWord[]` into a filtered, deduplicated vocabulary list.
**When to use:** After analysis completes, before rendering vocabulary or generating quiz.
**Example:**
```typescript
// src/lib/study/vocabulary.ts
import { COMMON_PARTICLES } from "./particles";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { VocabularyWord } from "./types";

export function extractVocabulary(words: EnrichedWord[]): VocabularyWord[] {
  const seen = new Set<string>();
  const result: VocabularyWord[] = [];

  for (const word of words) {
    const stem = word.morphology.stem.toLowerCase();
    const iast = word.iast.toLowerCase();

    // Filter common particles by IAST form
    if (COMMON_PARTICLES.has(iast)) continue;

    // Deduplicate by stem
    if (seen.has(stem)) continue;
    seen.add(stem);

    result.push({
      original: word.original,
      iast: word.iast,
      stem: word.morphology.stem,
      wordType: word.morphology.word_type,
      linga: word.morphology.linga,
      contextualMeaning: word.contextual_meaning,
      mwDefinition: word.mw_definitions[0] ?? null,
    });
  }

  return result; // Preserves appearance order
}
```

### Pattern 2: Quiz Question Generation
**What:** Generate MCQ questions from vocabulary list with distractor selection.
**When to use:** When user clicks "Start Quiz".
**Example:**
```typescript
// src/lib/study/quiz.ts
import type { VocabularyWord, QuizQuestion } from "./types";

export function generateQuiz(
  vocabulary: VocabularyWord[],
  fallbackMeanings?: string[]
): QuizQuestion[] {
  // Shuffle vocabulary for question order
  const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);

  return shuffled.map((word) => {
    const correctAnswer = word.contextualMeaning;

    // Draw distractors from other words' meanings
    const otherMeanings = vocabulary
      .filter((w) => w.stem !== word.stem)
      .map((w) => w.contextualMeaning);

    let distractors: string[];
    if (otherMeanings.length >= 3) {
      distractors = pickRandom(otherMeanings, 3);
    } else {
      // Fallback: pad with MW dictionary definitions
      const needed = 3 - otherMeanings.length;
      const fallback = (fallbackMeanings ?? []).slice(0, needed);
      distractors = [...otherMeanings, ...fallback];
    }

    // Shuffle options
    const options = [correctAnswer, ...distractors]
      .sort(() => Math.random() - 0.5);

    return {
      word: { original: word.original, iast: word.iast },
      correctAnswer,
      options,
    };
  });
}
```

### Pattern 3: Quiz State Machine (React useState)
**What:** Client-side quiz state using React hooks, no external state library needed.
**When to use:** In QuizView component.
**Example:**
```typescript
// Inside QuizView.tsx
type QuizPhase = "ready" | "active" | "answered" | "complete";

const [questions, setQuestions] = useState<QuizQuestion[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [phase, setPhase] = useState<QuizPhase>("ready");
const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
const [score, setScore] = useState(0);
```

### Pattern 4: Collapsible Section
**What:** Simple disclosure pattern with CSS transition for vocabulary list.
**When to use:** Vocabulary list section.
**Example:**
```typescript
const [isExpanded, setIsExpanded] = useState(false);

<button onClick={() => setIsExpanded(!isExpanded)}>
  View Vocabulary ({vocabulary.length} words)
</button>
{isExpanded && <div className="mt-4">...</div>}
```

### Anti-Patterns to Avoid
- **Server-side quiz state:** Quiz is ephemeral -- no need to persist to server or database. useState is sufficient.
- **Over-engineering distractor selection:** Simple random pick from sibling words is fine. No need for semantic similarity or NLP-based distractor generation.
- **Using useReducer or context for quiz state:** With a single component owning the state, useState is cleaner and simpler than a reducer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Array shuffling | Custom Fisher-Yates | Simple `sort(() => Math.random() - 0.5)` | Good enough for 10-20 item quiz; not cryptographic |
| Progress bar animation | Custom CSS keyframes | Tailwind `transition-all duration-300` on width | Consistent with existing design system |
| Collapsible sections | Accordion library | Simple boolean state + conditional render | Only one collapsible section needed |

**Key insight:** This phase is simple enough that every "don't hand-roll" item is trivially implementable. No complex libraries needed.

## Common Pitfalls

### Pitfall 1: Particle Filter Too Aggressive or Too Permissive
**What goes wrong:** Filtering removes meaningful words (like "api" which can mean "also" but is also part of compound words), or leaves too many particles cluttering the vocabulary.
**Why it happens:** Sanskrit particles have overlapping forms with meaningful word stems.
**How to avoid:** Filter on the IAST form of the analyzed word (not the stem). The LLM analysis already separates particles from compounds during sandhi splitting. Keep the filter list conservative -- only the most common grammatical particles.
**Warning signs:** Vocabulary list shows common filler words, or is missing expected content words.

### Pitfall 2: Deduplication by Wrong Key
**What goes wrong:** Same word appears multiple times (different inflections) or distinct words collapse into one.
**Why it happens:** Deduplicating by `original` (Devanagari surface form) gives too many entries; deduplicating by `iast` misses case differences.
**How to avoid:** Deduplicate by `morphology.stem` (the uninflected base form). This groups inflections correctly while keeping distinct lemmas separate.
**Warning signs:** "dharmasya" and "dharmam" both appearing as separate vocabulary items.

### Pitfall 3: Quiz With Too Few Distractors
**What goes wrong:** Analyzing a short text (2-3 words) means not enough sibling meanings to fill 4 options.
**Why it happens:** MCQ requires 1 correct + 3 distractors, but text may have fewer than 4 unique non-particle words.
**How to avoid:** Implement the MW dictionary fallback. Query random definitions from the entries table via a lightweight API route or direct import (server component boundary consideration).
**Warning signs:** Quiz options array has fewer than 4 items, or duplicates appear.

### Pitfall 4: Stale Quiz State After Re-Analysis
**What goes wrong:** User analyzes new text but quiz still shows old vocabulary.
**Why it happens:** Quiz state not reset when `analysisResult` changes.
**How to avoid:** Reset vocabulary and quiz state in a `useEffect` that depends on `analysisResult`, or derive vocabulary with `useMemo`.
**Warning signs:** Quiz questions reference words not in the current analysis.

### Pitfall 5: Dictionary Fallback Requires Server Boundary
**What goes wrong:** Trying to import better-sqlite3 in a client component throws bundling errors.
**Why it happens:** better-sqlite3 is a native Node module, cannot run in browser.
**How to avoid:** If fallback distractors are needed, fetch them via a simple API route (`/api/distractors?count=3`) that queries the SQLite database server-side. Alternatively, skip the quiz entirely when fewer than 4 words are available (simpler approach).
**Warning signs:** Build errors mentioning "better-sqlite3" or "native module" in client bundle.

## Code Examples

### Particle Set Definition
```typescript
// src/lib/study/particles.ts
// Common Sanskrit grammatical particles to filter from vocabulary
// These are indeclinables (avyaya) that serve grammatical function
// but aren't useful as vocabulary study items
export const COMMON_PARTICLES = new Set([
  "ca",      // and
  "tu",      // but
  "hi",      // indeed, because
  "eva",     // only, indeed
  "api",     // also, even
  "iti",     // thus (quotative)
  "atha",    // now, then
  "tatha",   // thus, so
  "yatha",   // as, like
  "na",      // not
  "va",      // or
  "iva",     // like
  "aho",     // oh!
  "kim",     // what? (interrogative particle)
  "tat",     // that (when used as particle)
  "yat",     // which (when used as particle)
  "sma",     // (past tense particle)
  "ha",      // indeed (emphatic)
  "vai",     // indeed (emphatic)
  "khalu",   // indeed
]);
```

### Study Feature Types
```typescript
// src/lib/study/types.ts
import type { WordType, Linga } from "@/lib/analysis/types";

export interface VocabularyWord {
  original: string;        // Devanagari
  iast: string;            // IAST transliteration
  stem: string;            // Uninflected stem
  wordType: WordType;      // noun, verb, etc.
  linga: Linga | undefined;
  contextualMeaning: string;
  mwDefinition: string | null;
}

export interface QuizQuestion {
  word: { original: string; iast: string };
  correctAnswer: string;
  options: string[];       // 4 items, shuffled
}

export type QuizPhase = "ready" | "active" | "answered" | "complete";

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  phase: QuizPhase;
  selectedAnswer: string | null;
  score: number;
}
```

### Integration in AnalysisView
```typescript
// Addition to AnalysisView.tsx -- after the analysis grid
{analysisResult && analysisResult.length > 0 && (
  <>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {analysisResult.map((word, index) => (
        <WordBreakdown key={index} word={word} />
      ))}
    </div>

    {/* Study features below analysis */}
    <VocabularyList words={analysisResult} />
    <QuizView words={analysisResult} />
  </>
)}
```

### Fallback Distractor API Route
```typescript
// src/app/api/distractors/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/dictionary/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const count = Math.min(parseInt(url.searchParams.get("count") ?? "3"), 10);

  const db = getDb();
  const rows = db.prepare(`
    SELECT definition FROM entries
    WHERE dictionary = 'mw' AND definition != ''
    ORDER BY RANDOM()
    LIMIT ?
  `).all(count) as { definition: string }[];

  // Truncate long definitions to first clause
  const meanings = rows.map((r) => {
    const def = r.definition;
    const comma = def.indexOf(",");
    return comma > 0 && comma < 80 ? def.slice(0, comma) : def.slice(0, 80);
  });

  return NextResponse.json({ meanings });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class components with state | Function components with hooks | React 16.8+ (2019) | All state via useState/useMemo |
| External state libs for simple UI | React state for local UI | React 18+ patterns | No Redux/Zustand needed for ephemeral quiz state |
| CSS Modules for animations | Tailwind transition utilities | Tailwind v3+ | `transition-all duration-300` for progress bar |

**Deprecated/outdated:**
- None relevant -- this phase uses only established, stable React patterns.

## Open Questions

1. **Quiz question cap**
   - What we know: User left this to Claude's discretion
   - What's unclear: Optimal number of questions for engagement
   - Recommendation: Cap at 10 questions maximum. If vocabulary has more than 10 words, randomly select 10. This keeps quizzes short and retakeable. If fewer than 4 words remain after filtering, show vocabulary list but disable quiz with a message like "Need at least 4 words for quiz."

2. **Fallback distractor complexity**
   - What we know: MW dictionary has 286K entries with definitions
   - What's unclear: Whether raw MW definitions are good distractors (they can be verbose/archaic)
   - Recommendation: Truncate MW definitions to first clause (before first comma or semicolon, max ~80 chars). This makes them comparable in length to contextual_meaning strings. If this is still awkward, the simpler approach is to just require 4+ vocabulary words and skip the quiz otherwise.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STDY-01 | extractVocabulary filters particles and deduplicates | unit | `npx vitest run src/lib/__tests__/vocabulary.test.ts -t "filters particles"` | No - Wave 0 |
| STDY-01 | extractVocabulary preserves appearance order | unit | `npx vitest run src/lib/__tests__/vocabulary.test.ts -t "appearance order"` | No - Wave 0 |
| STDY-01 | VocabularyList renders word cards with Devanagari + IAST + meaning + type | unit (jsdom) | `npx vitest run src/__tests__/vocabulary-list.test.tsx` | No - Wave 0 |
| STDY-02 | generateQuiz creates 4-option MCQ with correct answer from contextual_meaning | unit | `npx vitest run src/lib/__tests__/quiz.test.ts -t "generates questions"` | No - Wave 0 |
| STDY-02 | generateQuiz uses sibling word meanings as distractors | unit | `npx vitest run src/lib/__tests__/quiz.test.ts -t "distractors"` | No - Wave 0 |
| STDY-02 | QuizView renders question, options, progress bar, and feedback | unit (jsdom) | `npx vitest run src/__tests__/quiz-view.test.tsx` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before verify-work

### Wave 0 Gaps
- [ ] `src/lib/__tests__/vocabulary.test.ts` -- covers STDY-01 extraction logic
- [ ] `src/lib/__tests__/quiz.test.ts` -- covers STDY-02 generation logic
- [ ] `src/__tests__/vocabulary-list.test.tsx` -- covers STDY-01 UI rendering
- [ ] `src/__tests__/quiz-view.test.tsx` -- covers STDY-02 quiz interaction UI
- [ ] `vitest.config.ts` update -- add jsdom environment for new .tsx test files

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/analysis/types.ts` -- EnrichedWord type definition
- Project codebase: `src/app/components/AnalysisView.tsx` -- integration point
- Project codebase: `src/lib/dictionary/lookup.ts` -- fallback distractor source
- Project codebase: `src/app/components/WordBreakdown.tsx` -- existing word display patterns
- Project codebase: `vitest.config.ts` -- test configuration
- Project codebase: `package.json` -- dependency versions

### Secondary (MEDIUM confidence)
- React 19 docs -- useState, useMemo patterns (stable, well-established)

### Tertiary (LOW confidence)
- None -- this phase uses only existing project patterns and standard React

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all existing project libraries
- Architecture: HIGH -- straightforward client-side feature on existing data types
- Pitfalls: HIGH -- pitfalls are concrete and based on project codebase analysis (server/client boundary, dedup keys, state lifecycle)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no fast-moving dependencies)
