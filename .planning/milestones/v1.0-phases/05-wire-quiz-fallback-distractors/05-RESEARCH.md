# Phase 5: Wire Quiz Fallback Distractors - Research

**Researched:** 2026-03-09
**Domain:** React component wiring, Next.js API fetch, quiz logic integration
**Confidence:** HIGH

## Summary

This phase closes a small but complete integration gap: QuizView.tsx never calls GET /api/distractors, so short passages (< 4 unique vocabulary words) show "Need at least 4 words" instead of generating a quiz. All three pieces already exist and are individually tested: (1) the `/api/distractors` endpoint returns random MW dictionary meanings, (2) `generateQuiz()` accepts an optional `fallbackMeanings` parameter, and (3) QuizView renders quiz UI. The only missing piece is the fetch call and the wiring between them.

The fix is narrow: when `vocabulary.length < 4`, fetch fallback meanings from `/api/distractors?count=N` (where N fills the gap to reach 4 unique meanings), then pass them to `generateQuiz(vocabulary, fallbackMeanings)`. The early-return guard at line 54 of QuizView.tsx must also be restructured so short-vocabulary cases can still proceed after fetching fallbacks.

**Primary recommendation:** Add a `useEffect` + `useState` pair in QuizView to fetch fallback meanings when vocabulary is small, restructure the early-return guard to show a loading state instead of an immediate rejection, and pass fetched meanings to `generateQuiz()`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STDY-02 | App generates word-to-meaning MCQ quiz from extracted vocabulary with plausible distractors | QuizView must wire to /api/distractors for fallback distractors when vocabulary < 4 unique meanings; generateQuiz already supports this via fallbackMeanings param |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Next.js) | 15.x | Component framework | Already in use |
| fetch API | built-in | HTTP request to /api/distractors | Browser native, no extra deps |

### Supporting
No new libraries needed. This is pure wiring of existing code.

## Architecture Patterns

### Current Architecture (What Exists)

```
QuizView.tsx                         /api/distractors/route.ts
  extractVocabulary(words)              GET ?count=N
  generateQuiz(vocabulary)     [X]     returns { meanings: string[] }
                               ^
                          NOT CONNECTED
```

### Target Architecture

```
QuizView.tsx
  extractVocabulary(words)
  if vocab.length < 4:
    fetch("/api/distractors?count=N")  -->  /api/distractors/route.ts
    generateQuiz(vocabulary, fallbackMeanings)
  else:
    generateQuiz(vocabulary)  // existing path unchanged
```

### Pattern: Conditional Fetch with Loading State

**What:** Fetch fallback data only when vocabulary is insufficient, using React state to track loading/data.
**When to use:** When a component needs supplementary data only under specific conditions.

```typescript
// Proven pattern in this codebase: useEffect + useState for conditional async data
const [fallbackMeanings, setFallbackMeanings] = useState<string[] | null>(null);
const [loading, setLoading] = useState(false);

const needsFallback = vocabulary.length < 4;

useEffect(() => {
  if (!needsFallback) return;
  setLoading(true);
  const needed = Math.max(0, 4 - vocabulary.length);
  // Request extra to account for deduplication with vocab meanings
  const count = needed + 3;
  fetch(`/api/distractors?count=${count}`)
    .then(res => res.json())
    .then(data => setFallbackMeanings(data.meanings))
    .catch(() => setFallbackMeanings([]))
    .finally(() => setLoading(false));
}, [needsFallback, vocabulary.length]);
```

### Key Implementation Detail: Guard Restructuring

The current guard at line 54 of QuizView.tsx:
```typescript
if (vocabulary.length < 4) {
  return <p>Need at least 4 words for quiz.</p>;
}
```

Must be restructured to:
1. If `vocabulary.length >= 4`: proceed as today (no change to happy path)
2. If `vocabulary.length < 4` AND loading: show "Loading quiz..." or spinner
3. If `vocabulary.length < 4` AND fallback loaded AND total unique meanings >= 4: show Start Quiz
4. If `vocabulary.length < 4` AND fallback loaded AND total unique meanings < 4: show "Need at least 4 words" (true edge case -- extremely unlikely with 286K MW entries)

### Anti-Patterns to Avoid
- **Fetching on every render:** Use `needsFallback` guard in useEffect deps to avoid unnecessary API calls for normal (>= 4 word) passages
- **Breaking the happy path:** The >= 4 vocabulary path must remain completely unchanged -- zero behavioral difference for normal passages

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random distractor meanings | Custom dictionary sampling logic on the client | GET /api/distractors (already exists) | Server-side SQLite RANDOM() is efficient and already truncates definitions |
| Deduplication of fallback vs vocab meanings | Manual set intersection | generateQuiz() already handles this via `new Set([...vocabMeanings, ...fallbackMeanings])` on line 55 of quiz.ts | Already tested and working |

## Common Pitfalls

### Pitfall 1: Forgetting to Deduplicate Meanings
**What goes wrong:** Fetched fallback meanings might duplicate existing vocabulary meanings, leaving fewer than 4 unique options.
**Why it happens:** MW dictionary could return a meaning identical to one already in the vocabulary.
**How to avoid:** `generateQuiz()` already deduplicates via `new Set()`. Request extra fallbacks (e.g., count=6 when needing 3) to compensate for potential overlaps.
**Warning signs:** Quiz still returns 0 questions despite fetching fallbacks.

### Pitfall 2: Stale Closure in startQuiz Callback
**What goes wrong:** `startQuiz` callback captures `fallbackMeanings` from an earlier render, passing `null` even after fetch completes.
**Why it happens:** `useCallback` dependency array doesn't include `fallbackMeanings`.
**How to avoid:** Add `fallbackMeanings` to the `useCallback` dependency array for `startQuiz`.
**Warning signs:** First click on "Start Quiz" after fallback loads produces 0 questions.

### Pitfall 3: Race Condition on Component Remount
**What goes wrong:** Component unmounts before fetch completes, causing a setState-on-unmounted warning.
**Why it happens:** User navigates away while fallbacks are loading.
**How to avoid:** Use an AbortController in the useEffect cleanup, or simply let React 18+ handle this gracefully (setState on unmounted is a no-op in React 18).
**Warning signs:** Console warning about setting state on unmounted component.

### Pitfall 4: Breaking Existing Tests
**What goes wrong:** Existing quiz-view tests fail because they don't mock `fetch`.
**Why it happens:** Tests use vocabulary >= 4, so the fetch path isn't triggered, but any structural changes to the component could break test assertions.
**How to avoid:** Keep the >= 4 path identical. Only add fetch logic for the < 4 path. Add new tests specifically for the fallback path with `global.fetch` mocked.
**Warning signs:** Existing test suite failures after modification.

## Code Examples

### Current generateQuiz Call (line 23 of QuizView.tsx)
```typescript
const q = generateQuiz(vocabulary);
```

### Target generateQuiz Call
```typescript
const q = generateQuiz(vocabulary, needsFallback ? (fallbackMeanings ?? undefined) : undefined);
```

### API Response Shape (from route.ts)
```typescript
// GET /api/distractors?count=6
// Response: { meanings: ["law, duty", "a river", "fire", "king", "wisdom", "battle"] }
```

### Existing generateQuiz Fallback Support (quiz.ts lines 49-56)
```typescript
export function generateQuiz(
  vocabulary: VocabularyWord[],
  fallbackMeanings?: string[]  // <-- already supported
): QuizQuestion[] {
  const vocabMeanings = vocabulary.map((w) => w.contextualMeaning);
  const allMeanings = [...new Set([...vocabMeanings, ...(fallbackMeanings ?? [])])];
  // needs allMeanings.length >= 4
```

## State of the Art

No technology changes needed. All libraries and patterns are current.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | N/A | N/A | No changes -- this is pure wiring of existing code |

## Open Questions

1. **How many fallback meanings to request?**
   - What we know: Need at least `4 - vocabulary.length` additional unique meanings. Duplicates are possible.
   - What's unclear: Exact overlap probability (likely very low given 286K MW entries).
   - Recommendation: Request `count=6` as a safe buffer. The API caps at 10, and generateQuiz deduplicates.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/__tests__/quiz-view.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STDY-02 | QuizView fetches fallback distractors when vocab < 4 | unit (component) | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Exists, needs new test cases |
| STDY-02 | generateQuiz receives fallbackMeanings from fetched data | unit (component) | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Exists, needs new test cases |
| STDY-02 | Short passages produce quiz questions | unit (component) | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Exists, needs new test cases |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/quiz-view.test.tsx src/lib/__tests__/quiz.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases in `src/__tests__/quiz-view.test.tsx` -- covers fallback fetch path (vocab < 4 with mocked fetch returning meanings, verify generateQuiz called with fallbackMeanings)
- [ ] New test case for loading state while fallbacks are being fetched
- [ ] Mock `global.fetch` in test setup for fallback fetch tests

## Sources

### Primary (HIGH confidence)
- Source code inspection: `src/app/components/QuizView.tsx` -- current implementation without fallback wiring
- Source code inspection: `src/app/api/distractors/route.ts` -- existing endpoint returning `{ meanings: string[] }`
- Source code inspection: `src/lib/study/quiz.ts` -- `generateQuiz()` already accepts `fallbackMeanings?: string[]`
- Source code inspection: `src/__tests__/quiz-view.test.tsx` -- existing test patterns
- Source code inspection: `src/lib/__tests__/quiz.test.ts` -- fallback param already tested at unit level
- v1.0 Milestone Audit: `.planning/v1.0-MILESTONE-AUDIT.md` -- gap identification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, pure wiring of existing code
- Architecture: HIGH - all three components exist and are tested individually; only the connection is missing
- Pitfalls: HIGH - based on direct code inspection of actual codebase

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no external dependencies changing)
