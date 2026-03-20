# Phase 9: Quiz Engine and Spaced Repetition - Research

**Researched:** 2026-03-19
**Domain:** Spaced repetition scheduling, vocabulary management, quiz engine architecture
**Confidence:** HIGH

## Summary

Phase 9 transforms the existing single-session quiz (v1.0, Phase 4-5) into a persistent, multi-mode vocabulary learning system with spaced repetition scheduling. The current quiz generates MCQs from in-memory `EnrichedWord[]` data with no persistence -- it is discarded when the user navigates away. Phase 9 must: (1) extract vocabulary from kaavya documents and persist it in IndexedDB, (2) create two quiz modes (daily mixed and kaavya-specific), (3) integrate grammar facts into quiz questions, (4) add FSRS-based spaced repetition scheduling, and (5) track mastery with timeline estimates.

The existing codebase provides strong foundations: Dexie IndexedDB with `KaavyaDB` schema (version 1), dictionary lookups via SQLite (MW/Apte), vocabulary extraction from `EnrichedWord[]`, and a Duolingo-style quiz UI with hearts/XP/streaks. The key new capability is `ts-fsrs` (v5.2.3) for scientifically-validated spaced repetition scheduling that replaces the need to hand-roll forgetting curves.

**Primary recommendation:** Use `ts-fsrs` for spaced repetition scheduling, extend the existing Dexie schema to version 2 with new tables for vocabulary items and review history, and refactor the QuizView component to support both quiz modes while keeping the established Duolingo-style UI patterns.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUIZ-01 | User can provide a document/shlokas to populate quiz vocabulary | Vocabulary extraction pipeline exists (`extractVocabulary`); needs persistence layer in IndexedDB and a "populate from kaavya" flow |
| QUIZ-02 | Quiz shows all meanings of a word sourced from MW/Apte | Dictionary lookup module (`lookupByHeadword`, `lookupByStem`) provides MW/Apte entries; vocabulary items must store all dictionary definitions |
| QUIZ-03 | Quiz includes grammar facts (word breakdown, vibhakti, dhatu) alongside meaning MCQs | `EnrichedWord` already has `morphology` with vibhakti/dhatu/gana/stem; quiz question type must be extended to include grammar display |
| QUIZ-04 | Daily mixed vocabulary review mode drawing from all words | ts-fsrs scheduling selects due cards; quiz engine filters all vocabulary regardless of source kaavya |
| QUIZ-05 | Kaavya-specific quiz mode for words from a particular text | Vocabulary items link to kaavyaId; quiz engine filters by kaavya for focused review |
| QUIZ-06 | Spaced repetition scheduling based on forgetting curves | ts-fsrs implements FSRS algorithm with stability/difficulty/due-date tracking per card |
| QUIZ-07 | Mastery timeline estimate shown after sufficient quiz data | Derivable from ts-fsrs card stability values and review count; show only after N reviews |
| QUIZ-08 | Track vocabulary mastery -- words learned, remaining, new from new shlokas | IndexedDB queries on vocabulary table: count by state (New/Learning/Review) per kaavya and globally |
| QUIZ-09 | All quiz meanings sourced from dictionaries, never conjured | Dictionary lookup at vocabulary population time; store MW/Apte definitions directly on vocabulary record |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ts-fsrs | 5.2.3 | Spaced repetition scheduling (FSRS algorithm) | Official TypeScript FSRS implementation; browser-compatible; actively maintained; replaces SM-2 |
| dexie | 4.3.0 | IndexedDB persistence for vocabulary and review history | Already in project; schema versioning for migration |
| dexie-react-hooks | 4.2.0 | Reactive queries for vocabulary counts and due cards | Already in project; `useLiveQuery` for real-time UI updates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-sqlite3 | 12.6.2 | Dictionary lookups (MW/Apte) at vocabulary population time | Already in project; server-side only |
| zod | 4.3.6 | Schema validation for quiz API payloads | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ts-fsrs | SM-2 (hand-rolled) | SM-2 is simpler but FSRS has better retention curves; ts-fsrs is only ~15KB |
| ts-fsrs | femto-fsrs | More minimal but less maintained; ts-fsrs is the official implementation |

**Installation:**
```bash
npm install ts-fsrs
```

**No other new packages needed** -- everything else is already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    quiz/                     # NEW: Quiz engine module
      types.ts                # QuizVocabItem, QuizSession, SRSCard types
      srs.ts                  # ts-fsrs wrapper: schedule, rate, due-cards query
      quizEngine.ts           # Quiz generation: daily mixed, kaavya-specific
      vocabularyPopulator.ts  # Extract + persist vocabulary from kaavya/analysis
    kaavya/
      db/
        schema.ts             # MODIFY: bump to version 2, add quiz tables
  app/
    api/
      quiz/
        populate/route.ts     # POST: analyze kaavya text, extract vocab, persist
        route.ts              # GET: fetch due quiz questions for a mode
    components/
      QuizView.tsx            # MODIFY: support dual modes, grammar display, SRS rating
      QuizModeSelector.tsx    # NEW: choose daily mixed vs kaavya-specific
      VocabularyDashboard.tsx  # NEW: mastery tracking, word counts, timeline
```

### Pattern 1: Dexie Schema Migration (Version 2)
**What:** Extend existing KaavyaDB with vocabulary and review tables
**When to use:** Adding new IndexedDB tables to existing database
**Example:**
```typescript
// Extend schema.ts -- keep version(1) as-is, add version(2)
db.version(1).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
});

db.version(2).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
  // NEW tables for Phase 9
  vocabItems: '++id, stem, kaavyaId, state, due',
  reviewLogs: '++id, vocabItemId, rating, reviewedAt',
});
```

### Pattern 2: ts-fsrs Card Lifecycle
**What:** Map vocabulary items to FSRS cards for scheduling
**When to use:** Every quiz answer triggers a card state update
**Example:**
```typescript
import { createEmptyCard, FSRS, Rating, State } from 'ts-fsrs';

// When user adds vocabulary from a kaavya
function createVocabCard(): FSRSCardData {
  const card = createEmptyCard();
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state, // State.New
    last_review: card.last_review,
  };
}

// When user answers a quiz question
function rateCard(card: FSRSCardData, rating: Rating): FSRSCardData {
  const f = new FSRS();
  const result = f.repeat(card, new Date());
  return result[rating].card;
}
```

### Pattern 3: Vocabulary Population Pipeline
**What:** Extract vocabulary from kaavya text via analysis API, enrich with dictionary definitions, persist to IndexedDB
**When to use:** When user chooses "Add to quiz" from a kaavya
**Example:**
```typescript
// 1. Send kaavya text (or shloka range) to /api/analyze
// 2. Extract vocabulary using existing extractVocabulary()
// 3. For each word, call lookupByHeadword/lookupByStem for MW/Apte definitions
// 4. Create VocabItem records with FSRS card data
// 5. Persist to IndexedDB vocabItems table
// 6. Deduplicate by stem (don't add same word twice)
```

### Pattern 4: Quiz Mode Selection
**What:** Two quiz entry points with shared quiz UI
**When to use:** Always -- the two modes are the core feature

- **Daily Mixed**: Query all vocabItems where `due <= now`, regardless of kaavyaId. Shuffle and cap at 10-20 questions.
- **Kaavya-Specific**: Query vocabItems where `kaavyaId = X AND due <= now`. Shows focused review for one text.

### Anti-Patterns to Avoid
- **Generating meanings at quiz time:** All meanings MUST come from MW/Apte dictionaries stored at vocabulary population time. Never use LLM to generate quiz answers.
- **Storing FSRS card data separately from vocab items:** Keep card scheduling fields directly on the VocabItem record to avoid joins.
- **Re-running analysis for every quiz session:** Analyze once at population time, store the results. Quiz reads from IndexedDB only.
- **Building custom SRS from scratch:** ts-fsrs handles the math. Do not implement Ebbinghaus curves manually.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spaced repetition scheduling | Custom forgetting curve math | ts-fsrs | FSRS is research-backed, handles edge cases (lapses, relearning), parameters are optimized |
| Card state machine | Custom New/Learning/Review/Relearning transitions | ts-fsrs State enum | Four states with complex transition rules; ts-fsrs handles this correctly |
| Optimal interval calculation | Custom interval doubling/halving | ts-fsrs `repeat()` | Stability and difficulty factor calculations are non-trivial |
| IndexedDB reactivity | Custom event emitters for data changes | dexie-react-hooks `useLiveQuery` | Already in project, handles subscription cleanup |

**Key insight:** The FSRS algorithm involves 19 optimized parameters derived from millions of Anki review records. Hand-rolling this would produce inferior scheduling. Use ts-fsrs and focus engineering effort on the vocabulary pipeline and quiz UX.

## Common Pitfalls

### Pitfall 1: Conjured Meanings in Quiz Options
**What goes wrong:** Quiz distractors or correct answers come from LLM contextual meanings instead of dictionary sources
**Why it happens:** The existing v1.0 quiz uses `contextualMeaning` (which may be AI-generated) as the correct answer
**How to avoid:** At vocabulary population time, store MW/Apte definitions as the canonical meanings. Quiz correct answers MUST come from `mw_definitions` or `apte_definitions`. If no dictionary definition exists for a word, either exclude it from quiz or mark it clearly.
**Warning signs:** Quiz answers that are long phrases or contextually specific rather than dictionary-style definitions

### Pitfall 2: Dexie Version Migration Breaking Existing Data
**What goes wrong:** Existing kaavya library data lost when upgrading schema
**Why it happens:** Incorrect version migration that drops/recreates tables
**How to avoid:** Only ADD new tables in version(2). Keep version(1) stores declaration identical. Dexie handles additive changes automatically -- no upgrade function needed for new tables.
**Warning signs:** Library page showing empty after code update

### Pitfall 3: FSRS Card Serialization in IndexedDB
**What goes wrong:** Date objects stored as strings lose type information
**Why it happens:** IndexedDB serializes Date objects but ts-fsrs expects Date instances
**How to avoid:** Store `due` and `last_review` as ISO strings or timestamps, convert back to Date when reading for ts-fsrs operations
**Warning signs:** "Invalid Date" errors or cards never becoming due

### Pitfall 4: Over-fetching Vocabulary for Quiz
**What goes wrong:** Loading all vocabulary into memory for quiz generation
**Why it happens:** No index on `due` field for efficient querying
**How to avoid:** Index `due` field in Dexie schema. Query `vocabItems.where('due').belowOrEqual(new Date())` for due cards only.
**Warning signs:** Slow quiz startup as vocabulary grows

### Pitfall 5: Mastery Timeline Shown Too Early
**What goes wrong:** Showing "estimated mastery in X days" with 2 reviews -- meaningless
**Why it happens:** FSRS stability is unreliable with few data points
**How to avoid:** Only show mastery timeline after a minimum review count (e.g., 5+ reviews for a word). Use `card.reps` to gate display.
**Warning signs:** Wildly varying timeline estimates that confuse users

## Code Examples

### Vocabulary Item Type Contract
```typescript
// src/lib/quiz/types.ts
import type { State } from 'ts-fsrs';

export interface VocabItem {
  id?: number;
  stem: string;           // Deduplicate key
  original: string;       // Devanagari form
  iast: string;           // IAST transliteration
  kaavyaId: number;       // Source kaavya
  // Dictionary meanings (QUIZ-09: never conjured)
  mwDefinitions: string[];
  apteDefinitions: string[];
  // Grammar facts (QUIZ-03)
  wordType: string;
  vibhakti?: string;
  dhatu?: string;
  gana?: number;
  linga?: string;
  // FSRS card state (QUIZ-06)
  due: string;            // ISO date string
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: State;           // New=0, Learning=1, Review=2, Relearning=3
  lastReview?: string;    // ISO date string
  // Timestamps
  addedAt: string;
}

export interface ReviewLog {
  id?: number;
  vocabItemId: number;
  rating: number;         // Rating enum: Again=1, Hard=2, Good=3, Easy=4
  state: State;           // State before review
  reviewedAt: string;
}
```

### FSRS Wrapper Module
```typescript
// src/lib/quiz/srs.ts
import { createEmptyCard, FSRS, Rating, type Card } from 'ts-fsrs';

const fsrs = new FSRS();

export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

export function scheduleReview(card: Card, rating: Rating): Card {
  const result = fsrs.repeat(card, new Date());
  return result[rating].card;
}

export function isDue(card: Card): boolean {
  return new Date(card.due) <= new Date();
}

export { Rating, State } from 'ts-fsrs';
```

### Quiz Question with Grammar Facts
```typescript
// Extended quiz question for Phase 9
export interface QuizQuestion {
  vocabItemId: number;
  word: { original: string; iast: string };
  // Grammar facts displayed alongside question (QUIZ-03)
  grammarFacts: {
    wordType: string;
    vibhakti?: string;
    dhatu?: string;
    gana?: number;
    linga?: string;
  };
  // MCQ for meaning (QUIZ-02)
  correctAnswer: string;   // From MW/Apte
  options: string[];        // 4 options total
  allMeanings: string[];    // All MW/Apte meanings shown after answer
}
```

### Mastery Statistics Query
```typescript
// QUIZ-08: Track vocabulary mastery
export async function getMasteryStats(kaavyaId?: number) {
  const query = kaavyaId
    ? db.vocabItems.where('kaavyaId').equals(kaavyaId)
    : db.vocabItems.toCollection();

  const items = await query.toArray();

  return {
    total: items.length,
    new: items.filter(i => i.state === State.New).length,
    learning: items.filter(i => i.state === State.Learning).length,
    review: items.filter(i => i.state === State.Review).length,
    mastered: items.filter(i => i.state === State.Review && i.stability > 30).length,
    dueNow: items.filter(i => new Date(i.due) <= new Date()).length,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SM-2 algorithm | FSRS v6 (via ts-fsrs) | 2023-2024 | Better retention, fewer reviews needed, proven on millions of Anki users |
| Fixed intervals | Stability-based scheduling | FSRS v4+ | Cards scheduled based on memory stability, not arbitrary multipliers |
| Hand-rolled SRS | ts-fsrs library | 2024+ | Production-ready TypeScript implementation, browser-compatible |

**Deprecated/outdated:**
- SM-2 (SuperMemo 2): Still functional but FSRS produces 20-30% fewer reviews for same retention
- Leitner box system: Too simplistic for vocabulary learning at scale

## Open Questions

1. **Vocabulary population UX flow**
   - What we know: User needs to select shlokas/pages from a kaavya to add to quiz
   - What's unclear: Should it be "add entire kaavya" or "select specific shlokas"? Both?
   - Recommendation: Support both -- "Add all words" button on kaavya + "Add this shloka" in reader. Start with full-kaavya population as it is simpler.

2. **Analysis at population time**
   - What we know: Text needs to go through /api/analyze to get EnrichedWord data for grammar + dictionary
   - What's unclear: For large kaavyas, this could be slow (full LLM analysis)
   - Recommendation: Batch analyze in chunks. Show progress indicator. Cache analysis results per kaavya.

3. **Distractor generation for quiz options**
   - What we know: v1.0 uses sibling word meanings as distractors, with /api/distractors fallback
   - What's unclear: With persistent vocabulary, distractor pool is much larger
   - Recommendation: Draw distractors from the full vocabItems table (other words' MW definitions). No need for fallback API once vocabulary reaches 10+ words.

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
| QUIZ-01 | Vocabulary population from kaavya text | unit | `npx vitest run src/lib/__tests__/vocab-populator.test.ts -x` | No -- Wave 0 |
| QUIZ-02 | All MW/Apte meanings stored and shown | unit | `npx vitest run src/lib/__tests__/quiz-engine.test.ts -x` | No -- Wave 0 |
| QUIZ-03 | Grammar facts included in quiz question | unit | `npx vitest run src/lib/__tests__/quiz-engine.test.ts -x` | No -- Wave 0 |
| QUIZ-04 | Daily mixed mode selects due cards from all kaavyas | unit | `npx vitest run src/lib/__tests__/quiz-engine.test.ts -x` | No -- Wave 0 |
| QUIZ-05 | Kaavya-specific mode filters by kaavyaId | unit | `npx vitest run src/lib/__tests__/quiz-engine.test.ts -x` | No -- Wave 0 |
| QUIZ-06 | FSRS scheduling updates card after rating | unit | `npx vitest run src/lib/__tests__/srs.test.ts -x` | No -- Wave 0 |
| QUIZ-07 | Mastery timeline only shown after sufficient reviews | unit | `npx vitest run src/lib/__tests__/quiz-engine.test.ts -x` | No -- Wave 0 |
| QUIZ-08 | Mastery stats: learned/remaining/new counts | unit | `npx vitest run src/lib/__tests__/quiz-engine.test.ts -x` | No -- Wave 0 |
| QUIZ-09 | No conjured meanings -- all from MW/Apte | unit | `npx vitest run src/lib/__tests__/vocab-populator.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/srs.test.ts` -- covers QUIZ-06 (FSRS wrapper)
- [ ] `src/lib/__tests__/quiz-engine.test.ts` -- covers QUIZ-02 through QUIZ-08
- [ ] `src/lib/__tests__/vocab-populator.test.ts` -- covers QUIZ-01, QUIZ-09
- [ ] fake-indexeddb already configured in vitest setup -- no additional framework needed

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/study/` (existing quiz system), `src/lib/kaavya/db/` (Dexie schema), `src/lib/dictionary/lookup.ts` (MW/Apte lookups)
- [ts-fsrs GitHub](https://github.com/open-spaced-repetition/ts-fsrs) -- official TypeScript FSRS implementation, API patterns
- [ts-fsrs npm](https://www.npmjs.com/package/ts-fsrs) -- version 5.2.3 verified via `npm view`

### Secondary (MEDIUM confidence)
- [Dexie.js schema versioning docs](https://dexie.org/docs/Version/Version.upgrade()) -- migration patterns
- [FSRS algorithm overview](https://github.com/open-spaced-repetition) -- scheduling research basis

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- ts-fsrs verified on npm, Dexie already in project
- Architecture: HIGH -- extends existing patterns (Dexie schema, study module, QuizView)
- Pitfalls: HIGH -- derived from direct codebase analysis (current quiz uses contextualMeaning, schema migration is version-based)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, ts-fsrs is mature)
