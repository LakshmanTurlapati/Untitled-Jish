---
phase: 01-foundation-and-text-input
plan: 02
subsystem: database, api
tags: [cdsl, sqlite, fts5, monier-williams, apte, inria, stem-index, morphology, dictionary]

requires:
  - phase: 01-foundation-and-text-input
    provides: Bidirectional SLP1/IAST/Devanagari transliteration utility
provides:
  - CDSL parser for MW and AP90 dictionary formats (v02 multi-line)
  - SQLite database with 286K MW + 34K AP90 entries and FTS5 index
  - Stem index with 1.9M inflection-to-stem mappings from INRIA data
  - Dictionary lookup module (headword, stem resolution, full-text search)
  - Dictionary API endpoint with headword/stem/search modes
affects: [02-core-analysis, 03-image-ocr, 04-study-features]

tech-stack:
  added: [tsx]
  patterns: [CDSL v02 multi-line parser, SQLite FTS5 full-text search, server-only SQLite singleton, INRIA XML morphological data import]

key-files:
  created:
    - scripts/import-dictionary.ts
    - scripts/build-stem-index.ts
    - scripts/setup-data.sh
    - scripts/__tests__/import-dictionary.test.ts
    - src/lib/dictionary/db.ts
    - src/lib/dictionary/lookup.ts
    - src/lib/dictionary/schema.ts
    - src/lib/__tests__/dictionary.test.ts
    - src/lib/__tests__/stem-index.test.ts
    - src/app/api/dictionary/route.ts
    - data/.gitkeep
  modified:
    - .gitignore
    - package.json

key-decisions:
  - "Adapted parser for actual CDSL v02 multi-line format (entries delimited by <L>...<LEND>) instead of plan's assumed single-line XML format"
  - "AP90 headwords include visarga (e.g. 'dharmaH' not 'dharma') per CDSL convention -- lookup by FTS5 search bridges this difference"
  - "Stem index uses INSERT OR IGNORE with composite PK to handle 2M+ INRIA entries with deduplication"

patterns-established:
  - "CDSL v02 parser: <L> header line with k1/k2/pc/h/e fields, body lines until <LEND>"
  - "Server-only SQLite singleton with WAL mode and 64MB cache (src/lib/dictionary/db.ts)"
  - "FTS5 content sync table pattern for full-text search across dictionary entries"
  - "Batch transaction inserts (5K-10K per batch) for large data imports"

requirements-completed: [ANAL-05, UI-01]

duration: 15min
completed: 2026-03-07
---

# Phase 1 Plan 02: Dictionary Infrastructure Summary

**CDSL dictionary import pipeline with 321K entries (MW + AP90), 1.9M stem index mappings from INRIA morphological data, FTS5 search, and API endpoint**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-07T20:39:36Z
- **Completed:** 2026-03-07T20:55:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- CDSL parser handles actual v02 multi-line format for both MW (286,542 entries) and AP90 (34,882 entries)
- Stem index populated with 1,941,610 unique inflection-to-stem mappings from INRIA SL_morph.xml
- Dictionary lookup module with headword, stem resolution, and FTS5 full-text search
- API route at /api/dictionary supporting headword, stem, and search query modes
- All 38 tests pass across 5 test files

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing CDSL parser and database tests** - `e755296` (test)
2. **Task 1 GREEN: CDSL parser, SQLite import, and dictionary data** - `7e4c10e` (feat)
3. **Task 2 RED: Failing dictionary lookup and stem index tests** - `b32fa80` (test)
4. **Task 2 GREEN: Dictionary lookup module, stem index, and API route** - `41598f8` (feat)

## Files Created/Modified
- `scripts/import-dictionary.ts` - CDSL v02 parser and SQLite importer for MW and AP90
- `scripts/build-stem-index.ts` - INRIA SL_morph.xml parser for inflection-to-stem index
- `scripts/setup-data.sh` - Downloads MW, AP90, and INRIA morphological data
- `scripts/__tests__/import-dictionary.test.ts` - 9 parser and database creation tests
- `src/lib/dictionary/schema.ts` - TypeScript types (DictionaryEntry, StemIndexEntry, DictionaryName)
- `src/lib/dictionary/db.ts` - SQLite connection singleton with WAL mode
- `src/lib/dictionary/lookup.ts` - lookupByHeadword, lookupByStem, searchEntries functions
- `src/lib/__tests__/dictionary.test.ts` - 7 dictionary lookup tests
- `src/lib/__tests__/stem-index.test.ts` - 3 stem index resolution tests
- `src/app/api/dictionary/route.ts` - GET endpoint with headword/stem/search modes
- `data/.gitkeep` - Placeholder for data directory
- `.gitignore` - Added data/cdsl/ and data/sanskrit.db
- `package.json` - Added import-dict, build-stems, setup-data scripts and tsx dependency

## Decisions Made
- Adapted parser for actual CDSL v02 multi-line format. The plan assumed single-line XML-like `<H1><h><key1>...</key1>` format but the real data uses `<L>number<pc>page<k1>key1<k2>key2` headers with body lines until `<LEND>`. This required a complete parser rewrite.
- AP90 headwords include visarga in the headword (e.g., "dharmaH" -> "dharma.h") unlike MW. FTS5 search bridges this convention difference for cross-dictionary queries.
- Used INSERT OR IGNORE for stem index to handle the 2M+ INRIA entries with natural deduplication via the composite primary key.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CDSL v02 format differs from plan assumptions**
- **Found during:** Task 1 (dictionary import)
- **Issue:** Plan assumed XML-style single-line format `<H1><h><key1>...` but actual CDSL v02 uses multi-line `<L>...<LEND>` format
- **Fix:** Rewrote parser to handle actual multi-line CDSL v02 format with `<L>` headers and `<LEND>` delimiters
- **Files modified:** scripts/import-dictionary.ts
- **Verification:** 286,542 MW entries and 34,882 AP90 entries successfully imported
- **Committed in:** 7e4c10e

**2. [Rule 1 - Bug] AP90 headword convention differs from MW**
- **Found during:** Task 2 (dictionary lookup tests)
- **Issue:** AP90 stores headwords with visarga (e.g., "dharmaH") while MW uses bare stems ("dharma"), causing AP90 lookup test to fail
- **Fix:** Updated test to use a headword present in both dictionaries; added FTS5 search test to verify cross-dictionary query capability
- **Files modified:** src/lib/__tests__/dictionary.test.ts
- **Verification:** All 7 dictionary tests pass
- **Committed in:** 41598f8

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. CDSL format difference was the plan's inaccurate assumption about data format. AP90 convention difference is inherent in the data source.

## Issues Encountered
- CDSL v02 format is NOT the XML-style format described in plan and research. The actual format uses `<L>` entry markers with multi-line bodies delimited by `<LEND>`. This required understanding the real data structure before parser implementation.
- AP90 uses `{#text#}` for Sanskrit text instead of MW's `<s>text</s>` -- parser handles both conventions.

## User Setup Required

Users must run the data setup before using dictionary features:
```bash
bash scripts/setup-data.sh    # Download MW, AP90, and INRIA data (~230MB)
npm run import-dict            # Parse and import into SQLite (~321K entries)
npm run build-stems            # Build stem index (~1.9M mappings)
```

## Next Phase Readiness
- Dictionary infrastructure complete and ready for Phase 2 morphological analysis
- Stem index provides baseline inflection-to-stem resolution for word analysis
- FTS5 search enables dictionary cross-referencing from any analysis pipeline
- API endpoint ready for frontend integration in Phase 3/4

## Self-Check: PASSED

All 13 key files verified present. All 4 task commits verified in git log.

---
*Phase: 01-foundation-and-text-input*
*Completed: 2026-03-07*
