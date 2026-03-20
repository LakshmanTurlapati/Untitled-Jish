---
phase: 02
slug: core-analysis-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
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
| 02-01-01 | 01 | 1 | ANAL-01 | integration | `npx vitest run src/lib/__tests__/sandhi.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ANAL-02 | integration | `npx vitest run src/lib/__tests__/morphology.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | ANAL-03 | integration | `npx vitest run src/lib/__tests__/samasa.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | ANAL-04 | integration | `npx vitest run src/lib/__tests__/morphology.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | MEAN-01 | integration | `npx vitest run src/lib/__tests__/meanings.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | MEAN-02 | integration | `npx vitest run src/lib/__tests__/meanings.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | MEAN-03 | integration | `npx vitest run src/lib/__tests__/meanings.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | MEAN-04 | unit | `npx vitest run src/__tests__/word-breakdown.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | UI-02 | unit | `npx vitest run src/__tests__/word-breakdown.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/sandhi.test.ts` — stubs for ANAL-01
- [ ] `src/lib/__tests__/morphology.test.ts` — stubs for ANAL-02, ANAL-04
- [ ] `src/lib/__tests__/samasa.test.ts` — stubs for ANAL-03
- [ ] `src/lib/__tests__/meanings.test.ts` — stubs for MEAN-01, MEAN-02, MEAN-03
- [ ] `src/__tests__/word-breakdown.test.ts` — stubs for MEAN-04, UI-02
- [ ] LLM mock strategy: mock `generateText` responses for deterministic testing
- [ ] Test fixture: known BG 1.1 analysis result as golden reference

*Existing infrastructure covers test framework (Vitest) and dictionary fixtures (Phase 1).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LLM analysis quality on real Sanskrit | ANAL-01-04 | LLM output quality requires human judgment on correctness | Run analysis on BG 1.1, manually verify sandhi splits and morphological analysis against known reference |
| Visual distinction of meaning sources | MEAN-04 | Visual badge styling needs human review | Inspect word breakdown component — verify MW, Apte, and AI badges are visually distinct |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
