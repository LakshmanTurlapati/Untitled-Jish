---
phase: 6
slug: duolingo-ui-overhaul
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

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
| 06-01-01 | 01 | 1 | UI-01 | unit | `npx vitest run src/__tests__/app-shell.test.ts -x` | Needs update | ⬜ pending |
| 06-01-02 | 01 | 1 | UI-01 | unit | `npx vitest run src/__tests__/text-input.test.tsx -x` | Needs update | ⬜ pending |
| 06-01-03 | 01 | 1 | UI-01 | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file | ⬜ pending |
| 06-02-01 | 02 | 1 | UI-02 | unit | `npx vitest run src/__tests__/word-breakdown.test.tsx -x` | Needs update | ⬜ pending |
| 06-02-02 | 02 | 1 | UI-02 | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file | ⬜ pending |
| 06-03-01 | 03 | 2 | UI-01 | unit | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Needs update | ⬜ pending |
| 06-03-02 | 03 | 2 | UI-01 | unit | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Needs update | ⬜ pending |
| 06-03-03 | 03 | 2 | UI-01 | unit | `npx vitest run src/__tests__/quiz-view.test.tsx -x` | Needs update | ⬜ pending |
| 06-04-01 | 04 | 2 | UI-01 | unit | `npx vitest run src/__tests__/analysis-view.test.tsx -x` | New file | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/analysis-view.test.tsx` — stubs for tab navigation, sticky bar, progress steps, 3D buttons
- [ ] `src/__tests__/quiz-view.test.tsx` — update stubs for hearts/XP/streaks/Check button/celebration screen
- [ ] `src/__tests__/word-breakdown.test.tsx` — update stubs for pill badges and stacked meanings
- [ ] `src/__tests__/app-shell.test.ts` — update stubs for minimal header (no subtitle, no sample verse)
- [ ] `vitest.config.ts` — add `analysis-view.test.tsx` to jsdom environment globs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS confetti animation renders on quiz completion | UI-01 | Visual animation quality requires human eye | Complete a quiz, verify confetti/sparkle CSS animation plays |
| 3D button press effect feels natural | UI-01 | Tactile feedback quality is subjective | Click primary buttons, verify border-b shrink + translate-y shift looks like Duolingo |
| Sanskrit encouragement messages display at right moments | UI-01 | Timing and contextual feel is subjective | Answer quiz questions, verify correct/incorrect/streak messages appear |
| Overall Duolingo-inspired feel | UI-01, UI-02 | Holistic UX judgment | Navigate full flow: input → analyze → browse words → take quiz |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
