---
phase: 12-library-data-integrity
plan: 02
subsystem: ui
tags: [error-handling, pdf, dexie, react, typescript]

requires:
  - phase: none
    provides: n/a
provides:
  - PdfExtractionError typed class with 4 classified error kinds
  - Delete error handling with user-visible feedback in KaavyaLibrary
  - Differentiated PDF error messages in KaavyaUploader
affects: [library, uploader, pdf-extraction]

tech-stack:
  added: []
  patterns: [typed-error-classes, error-kind-discrimination, instanceof-error-routing]

key-files:
  created: []
  modified:
    - src/lib/kaavya/utils/pdfExtractor.ts
    - src/app/components/KaavyaLibrary.tsx
    - src/app/components/KaavyaUploader.tsx

key-decisions:
  - "Used PdfExtractionError class with kind discriminator rather than error code strings for type-safe catch handling"
  - "Set 50MB PDF size limit as a pre-extraction guard rather than letting extraction attempt and fail on large files"

patterns-established:
  - "Typed error classes: domain errors extend Error with a kind field for instanceof discrimination"
  - "Console-first error logging: console.error before setting user-visible error state"

requirements-completed: [LIB-03, LIB-04]

duration: 2min
completed: 2026-03-22
---

# Phase 12 Plan 02: Error Handling Summary

**Typed PdfExtractionError with 4 classified failure modes and user-visible error feedback for library delete and PDF upload**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T08:38:55Z
- **Completed:** 2026-03-22T08:40:29Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added PdfExtractionError class with password-protected, corrupt, no-text, too-large, and unknown error kinds
- Added 50MB file size pre-check before PDF extraction begins
- Wrapped getDocument call to detect password-protected and corrupt PDFs specifically
- Added empty text detection for scanned/image-only PDFs
- Added try/catch to handleDelete in KaavyaLibrary with deleteError state and red error display
- Updated KaavyaUploader to use instanceof PdfExtractionError for specific user messages
- Added console.error logging before all user-visible error states

## Task Commits

Each task was committed atomically:

1. **Task 1: Add typed PDF extraction errors** - `9f6dd4a` (feat) [co-committed with parallel 12-01 agent]
2. **Task 2: Add error handling to KaavyaLibrary delete and KaavyaUploader PDF errors** - `8f0b20c` (feat)

## Files Created/Modified
- `src/lib/kaavya/utils/pdfExtractor.ts` - Added PdfExtractionError class, PdfErrorKind type, file size check, getDocument error wrapping, empty text detection
- `src/app/components/KaavyaLibrary.tsx` - Added useState import, deleteError state, try/catch in handleDelete, error display element
- `src/app/components/KaavyaUploader.tsx` - Added PdfExtractionError import, instanceof-based error routing in catch block, console.error logging

## Decisions Made
- Used a custom PdfExtractionError class with a `kind` discriminator field rather than error code strings, enabling type-safe instanceof checks in consuming components
- Set 50MB as the PDF size limit -- guards before extraction rather than failing mid-process on large files

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Library error handling complete; users now see specific messages for all failure modes
- All error paths log to console for debugging before showing user-facing messages
- Pre-existing TypeScript errors in vocabulary.test.ts are unrelated (duplicate property names in test fixture)

## Self-Check: PASSED

- All 3 modified files exist on disk
- Commit 9f6dd4a exists (Task 1 pdfExtractor changes, co-committed with parallel agent)
- Commit 8f0b20c exists (Task 2 KaavyaLibrary + KaavyaUploader changes)
- PdfExtractionError class has all 4 error kinds verified via grep
- deleteError state, console.error, and error display all present in KaavyaLibrary
- PdfExtractionError import and instanceof check present in KaavyaUploader

---
*Phase: 12-library-data-integrity*
*Completed: 2026-03-22*
