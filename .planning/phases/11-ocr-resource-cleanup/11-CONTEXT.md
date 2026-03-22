# Phase 11: OCR & Resource Cleanup - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix Tesseract.js OCR to work correctly with v7 API, add timeout/cancellation for long-running extractions, and clean up Object URL memory leaks in ImageUpload. Scope limited to ocr.ts, ImageUpload.tsx, and api/ocr/route.ts.

</domain>

<decisions>
## Implementation Decisions

### OCR Worker Lifecycle
- Use `createWorker("san")` with correct Tesseract.js v7 language code for Sanskrit/Devanagari
- Add AbortController with 30s timeout wrapping `worker.recognize()` in server-side `extractTextFromImage()`
- Always call `worker.terminate()` in finally block, add AbortController abort in timeout path

### Memory & UX
- Use `useEffect` cleanup that revokes previous Object URL when new one is set, plus revoke on unmount
- Keep existing "Extracting text..." pulse animation, add elapsed time counter
- Timeout error message: "OCR timed out after 30 seconds. Try a clearer image or paste text directly."

### Claude's Discretion
- Error logging details in the API route catch block
- Whether to add console.error for worker initialization failures

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/analysis/ocr.ts` -- single function `extractTextFromImage(buffer)`, uses `createWorker("script/Devanagari")` (incorrect for v7)
- `src/app/components/ImageUpload.tsx` -- handles file input, drag-drop, camera capture, preview display
- `src/app/api/ocr/route.ts` -- POST endpoint, validates file type/size, calls extractTextFromImage

### Established Patterns
- API routes use NextResponse.json for responses
- Components use useState for loading/error state
- Error display via red text p element

### Integration Points
- ImageUpload calls `/api/ocr` via fetch POST with FormData
- OCR route imports extractTextFromImage from `@/lib/analysis/ocr`
- ImageUpload receives `onTextExtracted` callback prop

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- straightforward bug fixes from audit findings. Tesseract.js v7.0.0 is installed.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>
