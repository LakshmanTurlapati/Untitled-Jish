---
phase: 03
slug: image-input-and-ocr
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | `vitest.config.ts` (exists from Phase 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds (excluding LLM API calls with mocks) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | INPUT-01 | unit+component | `npx vitest run src/__tests__/text-input.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | INPUT-02 | component | `npx vitest run src/__tests__/image-upload.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | INPUT-03 | unit (mocked) | `npx vitest run src/lib/__tests__/ocr.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | INPUT-03 | unit (mocked) | `npx vitest run src/__tests__/ocr-api.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/text-input.test.tsx` — stubs for INPUT-01 (IAST preview display)
- [ ] `src/__tests__/image-upload.test.tsx` — stubs for INPUT-02 (file upload component)
- [ ] `src/lib/__tests__/ocr.test.ts` — stubs for INPUT-03 (OCR extraction with mocked Grok)
- [ ] `src/__tests__/ocr-api.test.ts` — stubs for INPUT-03 (API route validation)
- [ ] Update vitest.config.ts environmentMatchGlobs for .tsx test files

*Existing infrastructure covers test framework (Vitest) and analysis fixtures (Phase 2).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OCR accuracy on real Sanskrit images | INPUT-03 | Vision model quality needs human judgment | Upload a photo of printed Sanskrit text, verify extracted text is correct |
| IAST display correctness | INPUT-01 | Visual rendering of diacritics needs human eye | Type Devanagari, verify IAST shows correct diacritics |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
