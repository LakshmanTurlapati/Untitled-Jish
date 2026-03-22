# Phase 14: API & Rendering Stability - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix API error handling across all routes (env validation, error logging, streaming format), fix LLM output validation errors, and replace all React array index keys with stable unique keys across 6 components.

</domain>

<decisions>
## Implementation Decisions

### Environment Validation
- Create a shared env validation utility that checks for XAI_API_KEY
- Call it at the top of API routes that use xai() -- pipeline.ts and hints/route.ts
- Throw descriptive error: "XAI_API_KEY environment variable is not set"

### Error Logging
- Add console.error with request context to ALL API route catch blocks
- Include the original error message, stack trace where available
- Return structured error responses: { error: "user message", detail: "technical detail" }

### Streaming Error Handling
- In /api/hints, the streamText() call must be awaited and errors caught BEFORE calling toTextStreamResponse()
- If streamText fails, return proper JSON error (not SSE) since the stream hasn't started yet
- The current code correctly returns JSON on outer catch -- the issue is missing await on streamText()

### React Keys
- Replace key={i} and key={index} in these files:
  - VocabularyList.tsx: use word.stem or word.original
  - QuizView.tsx (hearts): static content, use string like `heart-${i}`
  - QuizView.tsx (confetti): static animation, use string like `confetti-${i}`
  - WordBreakdown.tsx: use component text content
  - AnalysisView.tsx (steps): static content, use step label
  - AnalysisView.tsx (words): use word.original + index for uniqueness
  - KaavyaLibrary.tsx (skeletons): static placeholders, use `skeleton-${i}`

### Claude's Discretion
- Exact wording of API error detail messages
- Whether to add a runtime env check utility or inline the check

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/api/analyze/route.ts` -- POST endpoint, calls analyzeText + enrichWithMeanings
- `src/app/api/hints/route.ts` -- POST streaming endpoint, uses xai("grok-3-mini")
- `src/lib/analysis/pipeline.ts` -- analyzeText using xai("grok-4-1-fast-non-reasoning")
- 6 component files with array index keys

### Established Patterns
- NextResponse.json for error responses with status codes
- try/catch with error instanceof Error check
- AI SDK streamText + toTextStreamResponse pattern

### Integration Points
- pipeline.ts called by /api/analyze and /api/quiz/populate
- All routes independent -- can fix in parallel
- React key fixes are purely local to each component

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- straightforward bug fixes from audit findings.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>
