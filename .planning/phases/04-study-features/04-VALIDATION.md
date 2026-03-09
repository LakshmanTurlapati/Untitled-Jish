---
phase: 4
slug: study-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | STDY-01 | unit | `npx vitest run src/lib/__tests__/vocabulary.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 0 | STDY-02 | unit | `npx vitest run src/lib/__tests__/quiz.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | STDY-01 | unit | `npx vitest run src/lib/__tests__/vocabulary.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | STDY-02 | unit | `npx vitest run src/lib/__tests__/quiz.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 2 | STDY-01 | unit (jsdom) | `npx vitest run src/__tests__/vocabulary-list.test.tsx` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 2 | STDY-02 | unit (jsdom) | `npx vitest run src/__tests__/quiz-view.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/vocabulary.test.ts` — stubs for STDY-01 extraction logic
- [ ] `src/lib/__tests__/quiz.test.ts` — stubs for STDY-02 generation logic
- [ ] `src/__tests__/vocabulary-list.test.tsx` — stubs for STDY-01 UI rendering
- [ ] `src/__tests__/quiz-view.test.tsx` — stubs for STDY-02 quiz interaction UI

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Duolingo-style progress bar visual feel | STDY-02 | Visual/animation quality is subjective | Verify progress bar fills smoothly, colors match design tokens |
| Encouraging feedback messages feel natural | STDY-02 | Tone is subjective | Verify "Correct!" and "Not quite" messages display appropriately |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
