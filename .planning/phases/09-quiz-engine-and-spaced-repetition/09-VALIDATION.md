---
phase: 9
slug: quiz-engine-and-spaced-repetition
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 9 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | QUIZ-01 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-02 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-03 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-04 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-05 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-06 | integration | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-07 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-08 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | QUIZ-09 | unit | `npx vitest run` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for FSRS scheduling logic (QUIZ-05)
- [ ] Test stubs for vocabulary population pipeline (QUIZ-01, QUIZ-09)
- [ ] Test stubs for quiz generation with grammar facts (QUIZ-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mastery timeline display | QUIZ-08 | Requires multi-session quiz data | Take quizzes over multiple sessions, verify timeline estimates appear |
| Quiz UX flow | QUIZ-02, QUIZ-03 | Subjective interaction quality | Navigate daily and kaavya quiz modes, verify smooth transitions |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
