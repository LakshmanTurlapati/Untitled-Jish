---
phase: 1
slug: foundation-and-text-input
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (latest, pairs with Next.js 16) |
| **Config file** | vitest.config.ts — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | UI-03 | smoke | `npx vitest run src/__tests__/app-shell.test.ts -t "no auth"` | Wave 0 | pending |
| 01-01-02 | 01 | 1 | UI-01 | manual | Visual inspection — Shobhika font loads, Devanagari renders | -- | pending |
| 01-02-01 | 02 | 1 | ANAL-05 | unit | `npx vitest run src/lib/__tests__/transliteration.test.ts -t "transliteration"` | Wave 0 | pending |
| 01-02-02 | 02 | 1 | -- | unit | `npx vitest run src/lib/__tests__/transliteration.test.ts -t "slp1"` | Wave 0 | pending |
| 01-02-03 | 02 | 1 | -- | unit | `npx vitest run scripts/__tests__/import-dictionary.test.ts -t "parser"` | Wave 0 | pending |
| 01-02-04 | 02 | 1 | -- | unit | `npx vitest run src/lib/__tests__/dictionary.test.ts -t "lookup"` | Wave 0 | pending |
| 01-02-05 | 02 | 1 | -- | unit | `npx vitest run src/lib/__tests__/stem-index.test.ts -t "stem"` | Wave 0 | pending |
| 01-01-03 | 01 | 1 | INPUT-01 | -- | DEFERRED — no text input UI in Phase 1 | -- | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration for Next.js 16
- [ ] `npm install -D vitest @vitejs/plugin-react` — framework install
- [ ] `src/lib/__tests__/transliteration.test.ts` — covers ANAL-05 and SLP1 conversion
- [ ] `src/lib/__tests__/dictionary.test.ts` — covers dictionary lookup
- [ ] `src/lib/__tests__/stem-index.test.ts` — covers stem resolution
- [ ] `scripts/__tests__/import-dictionary.test.ts` — covers CDSL parser
- [ ] `src/__tests__/app-shell.test.ts` — covers UI-03 (smoke test)

*Existing infrastructure covers: nothing — greenfield project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shobhika font loads with proper ligatures | UI-01 | Visual rendering quality requires human eye | Open app, paste Devanagari text with conjuncts, verify ligatures render correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
