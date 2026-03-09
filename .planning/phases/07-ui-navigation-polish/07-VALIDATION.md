---
phase: 7
slug: ui-navigation-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 + @testing-library/react 16.3.2 |
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
| 07-01-01 | 01 | 1 | UI-01 | unit | `npx vitest run src/__tests__/analysis-view-nav.test.tsx -t "checkmark" -x` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | UI-02 | unit | `npx vitest run src/__tests__/analysis-view-nav.test.tsx -t "words" -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | INPUT-02 | unit | `npx vitest run src/__tests__/image-upload.test.tsx -t "camera" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/analysis-view-nav.test.tsx` — stubs for tab navigation, sticky bar gating, checkmark colors
- [ ] Add test cases to existing `src/__tests__/image-upload.test.tsx` for camera capture input

*Existing infrastructure covers test framework — no new installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Camera opens on mobile | INPUT-02 | Requires physical mobile device | Open app on phone, tap "Take Photo", verify camera opens |
| Tab switching preserves state | UI-01 | Integration behavior across tabs | Switch Analyze→Study→Analyze, verify text input and results persist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
