# Requirements: Sanskrit Text Analyzer

**Defined:** 2026-03-21
**Core Value:** Enable users to master Sanskrit vocabulary and comprehend kaavyas independently through quiz-driven spaced repetition, with all meanings backed by pramaana.

## v1.2 Requirements

Requirements for bug-fix milestone. Each maps to roadmap phases.

### OCR

- [x] **OCR-01**: User can extract text from images without infinite hangs (fix Tesseract.js worker init)
- [x] **OCR-02**: OCR extraction completes or times out within 30 seconds with user feedback
- [x] **OCR-03**: Object URLs are cleaned up to prevent memory leaks

### Library

- [x] **LIB-01**: Deleting a kaavya removes all associated vocabItems and reviewLogs
- [x] **LIB-02**: Library cards render without date serialization crashes
- [x] **LIB-03**: Library operations show error feedback instead of crashing silently
- [x] **LIB-04**: PDF extraction errors display specific, actionable messages

### Quiz

- [ ] **QUIZ-01**: Vocabulary population deduplicates stems correctly (case-normalized)
- [ ] **QUIZ-02**: Quiz loading and rating errors are logged and surfaced to users
- [ ] **QUIZ-03**: Distractor generation never uses the correct answer as a distractor
- [ ] **QUIZ-04**: Batch word processing handles partial failures without losing all results

### API

- [ ] **API-01**: Missing environment variables (XAI_API_KEY) detected at startup with clear error
- [ ] **API-02**: All API routes log errors with context before returning 500s
- [ ] **API-03**: Streaming endpoint (/api/hints) returns correct SSE format on errors
- [ ] **API-04**: LLM output validation provides actionable error details

### Stability

- [ ] **STAB-01**: React lists use stable unique keys instead of array indices
- [ ] **STAB-02**: SRS card type casting handles null dates safely
- [x] **STAB-03**: Dexie transactions include all accessed stores

## Future Requirements

None -- this is a bug-fix milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features or enhancements | Bug-fix milestone only -- stability first |
| Architecture refactoring | Fix bugs in-place, refactor in future milestone |
| Test suite creation | Fix functional bugs first, add tests later |
| Performance optimization beyond fixes | Address only perf issues that cause crashes/hangs |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OCR-01 | Phase 11 | Complete |
| OCR-02 | Phase 11 | Complete |
| OCR-03 | Phase 11 | Complete |
| LIB-01 | Phase 12 | Complete |
| LIB-02 | Phase 12 | Complete |
| LIB-03 | Phase 12 | Complete |
| LIB-04 | Phase 12 | Complete |
| STAB-03 | Phase 12 | Complete |
| QUIZ-01 | Phase 13 | Pending |
| QUIZ-02 | Phase 13 | Pending |
| QUIZ-03 | Phase 13 | Pending |
| QUIZ-04 | Phase 13 | Pending |
| STAB-02 | Phase 13 | Pending |
| API-01 | Phase 14 | Pending |
| API-02 | Phase 14 | Pending |
| API-03 | Phase 14 | Pending |
| API-04 | Phase 14 | Pending |
| STAB-01 | Phase 14 | Pending |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
