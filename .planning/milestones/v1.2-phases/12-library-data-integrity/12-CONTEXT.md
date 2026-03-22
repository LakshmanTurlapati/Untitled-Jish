# Phase 12: Library & Data Integrity - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix library data integrity bugs: deleteKaavya must cascade to vocabItems/reviewLogs, date serialization must be safe in LibraryCard, library operations need error handling with user feedback, PDF extraction errors need specific messages, and Dexie transactions must include all accessed stores.

</domain>

<decisions>
## Implementation Decisions

### Data Cascade on Delete
- deleteKaavya() must include db.vocabItems and db.reviewLogs in the transaction store list
- Delete vocabItems where kaavyaId matches, then delete reviewLogs for those vocabItemIds
- Transaction must be atomic -- all deletions succeed or all roll back

### Date Handling
- relativeTime() in LibraryCard.tsx must safely handle both Date objects and ISO string dates from IndexedDB
- Add defensive conversion: `const d = date instanceof Date ? date : new Date(date)` before calling .getTime()

### Error Handling
- handleDelete() in KaavyaLibrary.tsx needs try/catch with user-visible error state
- PDF extraction errors in KaavyaUploader.tsx should differentiate between file errors, size errors, and format errors
- Log errors with console.error before showing user-facing messages

### Claude's Discretion
- Exact error message wording for different PDF failure modes
- Whether to add toast notifications or inline error messages (current pattern is inline)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/kaavya/db/kaavyaStore.ts` -- CRUD operations for kaavyas, uses Dexie transactions
- `src/lib/kaavya/db/schema.ts` -- Dexie v3 schema with 6 tables, vocabItems has kaavyaId index
- `src/app/components/KaavyaLibrary.tsx` -- library grid with useLiveQuery, delete handler
- `src/app/components/LibraryCard.tsx` -- card with relativeTime(), delete confirmation
- `src/app/components/KaavyaUploader.tsx` -- PDF upload/paste with error display
- `src/lib/kaavya/utils/pdfExtractor.ts` -- pdfjs-dist text extraction

### Established Patterns
- Dexie transactions with explicit store lists
- useState for error state, red text p elements for error display
- window.confirm for destructive actions

### Integration Points
- KaavyaLibrary imports deleteKaavya from kaavyaStore
- LibraryCard receives onDelete callback prop
- KaavyaUploader uses extractTextFromPdf from pdfExtractor

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- straightforward bug fixes from audit findings.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>
