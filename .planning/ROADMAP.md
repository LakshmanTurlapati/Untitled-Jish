# Roadmap: Sanskrit Text Analyzer

## Milestones

- [x] **v1.0 MVP** - Phases 1-7 (shipped 2026-03-09)
- [x] **v1.1 Sanskrit Learning Platform** - Phases 8-10 (shipped 2026-03-20)
- [ ] **v1.2 Bug Fixes & Stability** - Phases 11-14 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-7) - SHIPPED 2026-03-09</summary>

See .planning/archive/ for completed phase details.

</details>

<details>
<summary>v1.1 Sanskrit Learning Platform (Phases 8-10) - SHIPPED 2026-03-20</summary>

See .planning/archive/ for completed phase details.

</details>

### v1.2 Bug Fixes & Stability (In Progress)

**Milestone Goal:** Fix all critical bugs across OCR, Library, Quiz, and API layers -- make the app work end-to-end without crashes, hangs, or silent failures.

- [x] **Phase 11: OCR & Resource Cleanup** - Fix Tesseract.js worker init, add timeout/cancellation, clean up memory leaks (completed 2026-03-22)
- [x] **Phase 12: Library & Data Integrity** - Fix data orphaning, date crashes, error handling, and transaction safety (completed 2026-03-22)
- [ ] **Phase 13: Quiz Reliability** - Fix stem dedup, error surfacing, distractor generation, and SRS type safety
- [ ] **Phase 14: API & Rendering Stability** - Fix env validation, error logging, streaming format, and React key anti-patterns

## Phase Details

### Phase 11: OCR & Resource Cleanup
**Goal**: Users can extract text from images reliably -- OCR either succeeds or fails gracefully with feedback, never hangs or leaks memory
**Depends on**: Nothing (independent bug-fix phase)
**Requirements**: OCR-01, OCR-02, OCR-03
**Success Criteria** (what must be TRUE):
  1. User can upload an image and get extracted Devanagari text without the app hanging indefinitely
  2. If OCR takes too long, user sees a timeout message within 30 seconds and can retry
  3. Navigating away from OCR and returning does not degrade browser performance (no Object URL leaks)
**Plans**: 1 plan

Plans:
- [x] 11-01-PLAN.md -- Fix Tesseract.js v7 worker init, add 30s timeout, clean up Object URL leaks

### Phase 12: Library & Data Integrity
**Goal**: Users can manage their kaavya library without crashes or data corruption -- delete, browse, and handle errors safely
**Depends on**: Nothing (independent bug-fix phase)
**Requirements**: LIB-01, LIB-02, LIB-03, LIB-04, STAB-03
**Success Criteria** (what must be TRUE):
  1. Deleting a kaavya removes it and all associated vocabulary/review data -- no orphaned records remain
  2. Library page loads and renders all kaavya cards without crashing on date fields
  3. When a library operation fails, user sees a specific error message instead of a blank screen or silent failure
  4. PDF extraction failures show actionable messages telling the user what went wrong
  5. Database operations that touch multiple stores either fully succeed or fully roll back
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md -- Fix deleteKaavya cascade to vocabItems/reviewLogs, fix date serialization crash in LibraryCard
- [x] 12-02-PLAN.md -- Add error handling to library delete, add typed PDF extraction errors with specific messages

### Phase 13: Quiz Reliability
**Goal**: Users can take quizzes that populate correctly, show meaningful errors, and never present broken answer choices
**Depends on**: Nothing (independent bug-fix phase)
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, STAB-02
**Success Criteria** (what must be TRUE):
  1. Quiz populates vocabulary items without duplicates caused by stem casing differences (e.g., "Deva" vs "deva")
  2. When quiz loading or SRS rating fails, user sees an error message instead of a spinner or silent failure
  3. MCQ distractors never include the correct answer as one of the wrong choices
  4. Processing a batch of words where some fail still returns results for the words that succeeded
  5. SRS card scheduling works correctly even when review date fields are null or missing
**Plans**: TBD

Plans:
- [ ] 13-01: TBD

### Phase 14: API & Rendering Stability
**Goal**: API routes return meaningful responses instead of 500 errors, and the UI renders without React warnings or visual glitches
**Depends on**: Nothing (independent bug-fix phase)
**Requirements**: API-01, API-02, API-03, API-04, STAB-01
**Success Criteria** (what must be TRUE):
  1. Starting the app without XAI_API_KEY shows a clear startup error instead of runtime 500s
  2. When an API route fails, the error is logged with request context and the response includes actionable detail
  3. The /api/hints streaming endpoint returns proper SSE format even when errors occur mid-stream
  4. LLM output that fails validation produces error messages identifying what was wrong with the response
  5. React lists (vocabulary items, kaavya cards, quiz options) use stable unique keys -- no console warnings
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

## Progress

**Execution Order:**
Phases 11-14 are independent and can execute in any order.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. OCR & Resource Cleanup | v1.2 | 1/1 | Complete    | 2026-03-22 |
| 12. Library & Data Integrity | v1.2 | 2/2 | Complete    | 2026-03-22 |
| 13. Quiz Reliability | v1.2 | 0/? | Not started | - |
| 14. API & Rendering Stability | v1.2 | 0/? | Not started | - |
