# Phase 13: Quiz Reliability - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix quiz system bugs: stem case normalization for dedup, error surfacing in QuizView, distractor validation in quizEngine, partial failure handling in quiz/populate API, and safe null date handling in SRS.

</domain>

<decisions>
## Implementation Decisions

### Stem Deduplication
- Store stems in lowercase in the VocabItem: `stem: word.morphology.stem.toLowerCase()` at insert time in vocabularyPopulator.ts
- This aligns storage with the dedup comparison that already uses `.toLowerCase()`

### Error Surfacing
- Add console.error with context to catch blocks in QuizView.tsx loadSRSQuestions() and handleSRSRate()
- Surface errors to the user via a quizError state variable rendered in the UI
- Do NOT silently set srsEmpty=true on error -- distinguish "empty" from "error"

### Distractor Validation
- After building options array in generateQuizQuestions(), filter out any distractor that equals correctAnswer
- Use all definitions from each vocab item (not just [0]) to expand the distractor pool
- When padding with stem as last resort, ensure stem !== correctAnswer

### Batch Processing
- In /api/quiz/populate route.ts, wrap individual word enrichment in try/catch
- Collect failures separately, return partial results with both enrichedWords and failedCount
- Log each failure with console.error

### SRS Type Safety
- Fix storableToCard() in srs.ts: remove `undefined as unknown as Date` cast
- Use proper conditional: `last_review: data.last_review ? new Date(data.last_review) : undefined`
- Update the Card return type to reflect that last_review can be undefined

### Claude's Discretion
- Exact error message format for quiz loading failures
- Whether to show failed word count to user after partial populate

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/quiz/vocabularyPopulator.ts` -- populateVocabulary with dedup logic
- `src/lib/quiz/quizEngine.ts` -- getDueCards, generateQuizQuestions, getMasteryStats
- `src/lib/quiz/srs.ts` -- FSRS wrapper with storableToCard/cardToStorable
- `src/app/components/QuizView.tsx` -- full quiz UI with SRS mode
- `src/app/api/quiz/populate/route.ts` -- server-side text analysis and enrichment

### Established Patterns
- useState for error state in components
- try/catch with console.error logging
- Dexie useLiveQuery for reactive data

### Integration Points
- QuizView calls getDueCards/generateQuizQuestions from quizEngine
- QuizView calls scheduleReview/storableToCard from srs
- VocabPopulateButton calls /api/quiz/populate then populateVocabulary

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- straightforward bug fixes from audit findings.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>
