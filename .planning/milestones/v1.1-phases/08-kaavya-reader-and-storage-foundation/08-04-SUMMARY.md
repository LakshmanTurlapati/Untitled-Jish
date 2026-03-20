---
phase: 08-kaavya-reader-and-storage-foundation
plan: 04
subsystem: ui
tags: [react, ai, streaming, hints, pramaana, indexeddb, text-selection, grok]

requires:
  - phase: 08-02
    provides: "KaavyaLibrary and KaavyaUploader components, page.tsx view routing"
  - phase: 08-03
    provides: "KaavyaReader container with page navigation and useReader hook"
provides:
  - "AI-powered shloka hint system with pramaana-backed responses"
  - "ShlokaSelector component for text selection and interpretation input"
  - "HintPanel component with streaming blockquote display"
  - "/api/hints streaming endpoint using xai grok-3-mini"
  - "useShlokaHints hook for client-side streaming consumption"
  - "Full reader-to-interpretation flow wired in page.tsx"
affects: [09-quiz-srs]

tech-stack:
  added: []
  patterns: ["streamText with toTextStreamResponse for AI streaming", "dynamic imports for SSR-incompatible IndexedDB components", "text selection with floating action button pattern"]

key-files:
  created:
    - src/app/api/hints/route.ts
    - src/lib/kaavya/hooks/useShlokaHints.ts
    - src/app/components/HintPanel.tsx
    - src/app/components/ShlokaSelector.tsx
  modified:
    - src/app/components/KaavyaReader.tsx
    - src/app/page.tsx

key-decisions:
  - "Used toTextStreamResponse instead of toDataStreamResponse for AI SDK compatibility with this project's version"
  - "Dynamic imports with ssr:false for Library, Uploader, Reader to fix DOMMatrix prerender error from pdfjs-dist"
  - "Save interpretations to IndexedDB automatically after hints are received"

patterns-established:
  - "AI hint endpoint pattern: server-side system prompt enforcement, never expose prompt to client"
  - "Text selection with floating button pattern: mouseup -> getSelection -> getBoundingClientRect positioning"
  - "Dynamic import pattern for browser-only components using next/dynamic with ssr:false"

requirements-completed: [READ-04, READ-05]

duration: 18min
completed: 2026-03-19
---

# Phase 8 Plan 4: Shloka Interpretation and AI Hints Summary

**Shloka text selection with floating "Interpret This" button, interpretation input, and streaming AI hints backed by pramaana using grok-3-mini**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-19T08:52:08Z
- **Completed:** 2026-03-19T09:10:35Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Server-side AI hint endpoint with strict "never give the answer" system prompt using streamText and grok-3-mini
- Client-side streaming hook (useShlokaHints) that reads plain text stream and accumulates hints
- ShlokaSelector component with interpretation textarea and automatic IndexedDB persistence
- HintPanel with blockquote-styled hints (accent-500 left border) and skeleton loading state
- KaavyaReader enhanced with text selection detection and floating "Interpret This" button
- Full navigation flow wired: Library -> Reader -> Select text -> Interpret -> Get hints -> Back to Library

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /api/hints endpoint and useShlokaHints hook** - `668c795` (feat)
2. **Task 2: Create ShlokaSelector, HintPanel, integrate into KaavyaReader, and wire page routing** - `7a238ff` (feat)

## Files Created/Modified
- `src/app/api/hints/route.ts` - POST endpoint for streaming AI hints with pramaana system prompt
- `src/lib/kaavya/hooks/useShlokaHints.ts` - Client hook for streaming hint consumption
- `src/app/components/HintPanel.tsx` - Blockquote-styled hint display with loading skeletons
- `src/app/components/ShlokaSelector.tsx` - Bottom sheet with text display, interpretation input, and hint panel
- `src/app/components/KaavyaReader.tsx` - Added text selection handler and floating button integration
- `src/app/page.tsx` - Replaced placeholder with KaavyaReader, dynamic imports for SSR safety

## Decisions Made
- Used `toTextStreamResponse()` instead of `toDataStreamResponse()` -- the AI SDK version in this project exposes the text stream method, not the data stream method
- Applied `next/dynamic` with `ssr: false` for all IndexedDB-dependent components (KaavyaLibrary, KaavyaUploader, KaavyaReader) to fix a pre-existing DOMMatrix prerender error caused by pdfjs-dist
- Interpretations are saved to IndexedDB automatically after hints are received, with non-blocking error handling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed toDataStreamResponse API mismatch**
- **Found during:** Task 2 (build verification)
- **Issue:** AI SDK version in this project does not have `toDataStreamResponse`, only `toTextStreamResponse`
- **Fix:** Changed to `toTextStreamResponse()` in route.ts, simplified hook to read plain text stream instead of AI SDK data format
- **Files modified:** src/app/api/hints/route.ts, src/lib/kaavya/hooks/useShlokaHints.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 7a238ff (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed DOMMatrix prerender error with dynamic imports**
- **Found during:** Task 2 (build verification)
- **Issue:** `npm run build` failed with "DOMMatrix is not defined" during prerendering of `/` page, caused by pdfjs-dist imported through KaavyaUploader
- **Fix:** Changed KaavyaLibrary, KaavyaUploader, and KaavyaReader imports in page.tsx to use `next/dynamic` with `ssr: false`
- **Files modified:** src/app/page.tsx
- **Verification:** `npm run build` completes successfully
- **Committed in:** 7a238ff (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for build to succeed. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full kaavya reading and interpretation flow is complete
- IndexedDB stores kaavyas, reading progress, and interpretations
- Ready for Phase 9: Quiz and SRS system on top of stored vocabulary and interpretations

## Self-Check: PASSED

All 4 created files verified. Both task commits (668c795, 7a238ff) verified.

---
*Phase: 08-kaavya-reader-and-storage-foundation*
*Completed: 2026-03-19*
