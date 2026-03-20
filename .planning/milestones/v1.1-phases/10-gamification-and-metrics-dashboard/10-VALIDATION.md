---
phase: 10
slug: gamification-and-metrics-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 10 -- Validation Strategy

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
| TBD | TBD | TBD | GAME-01 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | GAME-02 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | METR-01 | unit | `npx vitest run` | W0 | pending |
| TBD | TBD | TBD | METR-02 | unit | `npx vitest run` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for XP calculation and rank progression (GAME-01, GAME-02)
- [ ] Test stubs for forgetting curve computation (METR-01)
- [ ] Test stubs for metrics aggregation (METR-02, METR-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Forgetting curve chart rendering | METR-01 | Visual SVG output | Open metrics dashboard, verify curve shape with real quiz data |
| Smart quiz notification timing | METR-05 | Requires multi-session use | Use app over time, verify notifications appear at right intervals |
| Rank tier unlock animations | GAME-03 | Visual transitions | Earn enough XP to rank up, verify visual feedback |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
