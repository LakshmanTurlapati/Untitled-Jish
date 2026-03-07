---
phase: 01-foundation-and-text-input
plan: 01
subsystem: ui, infra, testing
tags: [next.js, tailwind-v4, vitest, shobhika, iast, transliteration, sanscript, devanagari]

requires:
  - phase: none
    provides: greenfield project
provides:
  - Next.js 16 project scaffold with TypeScript and App Router
  - Vitest test framework with path alias support
  - Shobhika font (Regular + Bold) for Sanskrit typography
  - Tailwind v4 design tokens (parchment/ink academic palette)
  - Bidirectional Devanagari/IAST/SLP1 transliteration utility
  - App shell landing page with sample Devanagari verse
affects: [01-02, 02-core-analysis, 03-image-ocr, 04-study-features]

tech-stack:
  added: [next.js 16, react 19, tailwind v4, vitest, @indic-transliteration/sanscript, better-sqlite3]
  patterns: [next/font/local for custom fonts, Tailwind v4 @theme CSS-first config, TDD red-green for utility modules]

key-files:
  created:
    - vitest.config.ts
    - src/lib/fonts.ts
    - src/lib/transliteration.ts
    - src/lib/__tests__/transliteration.test.ts
    - src/__tests__/app-shell.test.ts
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - public/fonts/shobhika/Shobhika-Regular.otf
    - public/fonts/shobhika/Shobhika-Bold.otf
  modified: []

key-decisions:
  - "Used OTF font files directly instead of WOFF2 conversion -- next/font/local handles OTF natively"
  - "Warm academic palette with parchment/ink tokens for scholar-friendly aesthetic"
  - "SLP1 converters included for CDSL dictionary compatibility in Phase 1 Plan 2"

patterns-established:
  - "Vitest with @vitejs/plugin-react and path aliases matching tsconfig"
  - "Tailwind v4 CSS-first @theme block for design tokens"
  - "next/font/local with CSS variable for font injection"
  - "Transliteration utility as thin wrapper around sanscript library"

requirements-completed: [INPUT-01, ANAL-05, UI-01, UI-03]

duration: 8min
completed: 2026-03-07
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 16 scaffold with Shobhika Devanagari typography, Tailwind v4 academic design tokens, bidirectional IAST/SLP1 transliteration utility (19 tests), and app shell**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-07T20:28:36Z
- **Completed:** 2026-03-07T20:37:02Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Next.js 16 project with TypeScript, Tailwind v4, ESLint, and Vitest fully configured
- Shobhika font (IIT Bombay) loaded for high-quality Sanskrit ligature rendering
- Warm academic design system with parchment/ink color palette and Sanskrit line-height spacing
- Transliteration module with 4 exported functions: devanagariToIast, iastToDevanagari, slp1ToDevanagari, slp1ToIast
- App shell displaying BG 1.1 sample verse with no authentication gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with test infra and visual foundation** - `9d3912a` (feat)
2. **Task 2 RED: Failing transliteration tests** - `c50714b` (test)
3. **Task 2 RED: Failing app shell tests** - `0b3bb47` (test)
4. **Task 2 GREEN: Transliteration utility and app shell implementation** - `ff2f0f3` (feat)

## Files Created/Modified
- `package.json` - Project manifest with all Phase 1 dependencies
- `tsconfig.json` - TypeScript config with @ path alias
- `vitest.config.ts` - Test framework with React plugin and path aliases
- `next.config.ts` - Next.js configuration
- `src/lib/fonts.ts` - Shobhika font loaded via next/font/local with CSS variable
- `src/app/globals.css` - Tailwind v4 @theme block with parchment/ink design tokens
- `src/app/layout.tsx` - Root layout applying Shobhika font variable
- `src/app/page.tsx` - App shell with title, subtitle, BG 1.1 verse, placeholder area
- `src/lib/transliteration.ts` - Bidirectional Devanagari/IAST/SLP1 conversion utility
- `src/lib/__tests__/transliteration.test.ts` - 15 transliteration tests
- `src/__tests__/app-shell.test.ts` - 4 app shell smoke tests
- `public/fonts/shobhika/Shobhika-Regular.otf` - Shobhika Regular 400
- `public/fonts/shobhika/Shobhika-Bold.otf` - Shobhika Bold 700

## Decisions Made
- Used OTF font files directly instead of converting to WOFF2 -- next/font/local handles OTF natively, avoiding a fragile conversion step
- Chose warm academic aesthetic with parchment backgrounds and ink text colors for scholar-friendly feel
- Included SLP1 converters alongside IAST from the start, since CDSL dictionaries use SLP1 internally

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Shobhika font release is packaged as a zip file (not individual font downloads) -- resolved by downloading and extracting the zip
- Font files referenced as .woff2 in plan file paths but OTF used instead since next/font/local supports OTF natively

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Transliteration utility ready for use across all subsequent phases
- Design tokens and typography foundation established for all UI work
- Test infrastructure ready for TDD in Plan 02 (dictionary infrastructure)
- better-sqlite3 already installed, ready for dictionary SQLite work

## Self-Check: PASSED

All 10 key files verified present. All 4 task commits verified in git log.

---
*Phase: 01-foundation-and-text-input*
*Completed: 2026-03-07*
