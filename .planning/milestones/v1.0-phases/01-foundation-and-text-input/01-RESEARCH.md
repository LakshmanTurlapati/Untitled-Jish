# Phase 1: Foundation and Text Input - Research

**Researched:** 2026-03-07
**Domain:** Next.js scaffold, Sanskrit dictionary infrastructure (CDSL/SQLite), IAST transliteration, Devanagari typography
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield scaffold delivering four foundational pillars: (1) a Next.js 16 App Router project with Tailwind CSS v4 and Shobhika Devanagari font, (2) a CDSL-to-SQLite dictionary import pipeline for Monier-Williams and Apte dictionaries, (3) a bidirectional Devanagari/IAST transliteration utility built on `@indic-transliteration/sanscript`, and (4) a reverse inflection-to-stem index for dictionary lookups on inflected forms. There is no text input UI in this phase -- manual text entry is deferred to Phase 3.

The dictionary infrastructure is the most complex deliverable. The Cologne Digital Sanskrit Lexicon (CDSL) stores dictionaries as custom-markup text files with XML-like tags (H1/H2/H3/H4 hierarchy, `<s>` for Sanskrit in SLP1, `<body>` for definitions, `<lex>` for grammatical info). These must be parsed and loaded into SQLite with full entry content. The INRIA Sanskrit Heritage morphological database provides pre-computed inflected form data (approximately 6 million nominal forms) that can bootstrap the stem index.

**Primary recommendation:** Use `create-next-app@latest` with defaults (Next.js 16, TypeScript, Tailwind v4, App Router, Turbopack). Use `better-sqlite3` for dictionary storage, accessed exclusively through server components and API routes. Use `@indic-transliteration/sanscript` for transliteration. Build the dictionary import as a standalone Node.js script that runs at build time.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No text input UI in Phase 1 -- deferred to Phase 3 with image upload
- Phase 1 delivers: scaffold, dictionary infra, transliteration engine, basic app shell
- The primary user flow is image capture/upload, not manual typing
- Source: Cologne Digital Sanskrit Dictionaries (CDSL) XML data for both MW and Apte
- Storage: Parsed into embedded SQLite database
- Entry depth: Full entries including etymology, usage examples, and cross-references
- Deployment: SQLite database bundled with the app (included in deployment artifact)
- Display priority: Monier-Williams primary, Apte secondary (toggle/expand)
- Stem resolution: Build reverse index from common inflected forms to stems during dictionary import
- Bidirectional conversion: Devanagari to IAST and IAST to Devanagari
- IAST only -- no Harvard-Kyoto, SLP1, or Velthuis schemes
- Built as a reusable utility module (no UI in this phase)
- Devanagari font: Shobhika (IIT Bombay, designed for Sanskrit typesetting)
- CSS framework: Tailwind CSS
- Design tokens and color palette set up in scaffold

### Claude's Discretion
- Overall aesthetic direction (minimal academic, warm traditional, modern dark, or hybrid)
- App shell layout structure
- Design token values (colors, spacing, typography scale)
- SQLite schema design for dictionary entries
- Stem index generation strategy and coverage

### Deferred Ideas (OUT OF SCOPE)
- Manual text input UI -- moved to Phase 3 (alongside image upload as secondary input)
- INPUT-01 requirement (paste/type Devanagari) -- now Phase 3 scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPUT-01 | User can paste or type Devanagari text directly into the app | DEFERRED to Phase 3 per CONTEXT.md. No work in this phase. |
| ANAL-05 | App generates IAST transliteration for each word | Sanscript.js library handles Devanagari-to-IAST and reverse. Build as utility module. |
| UI-01 | Clean, scholar-friendly interface with proper Devanagari typography | Shobhika font (OTF, convert to WOFF2), Tailwind v4 design tokens, app shell layout. |
| UI-03 | App works without login or user accounts | Next.js static/SSR app with no auth. Inherent in architecture -- no user state. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x (latest stable 16.1.6) | React framework with App Router | Default choice for React SSR/SSG, Turbopack now default bundler |
| React | 19.x | UI components | Required by Next.js 16 |
| TypeScript | 5.x | Type safety | Default in create-next-app |
| Tailwind CSS | 4.x | Utility-first CSS | User decision. Zero-config content detection in v4, CSS-first configuration |
| better-sqlite3 | 12.x (12.6.2) | Embedded SQLite for dictionary | Fastest synchronous SQLite for Node.js, native addon, server-only |
| @indic-transliteration/sanscript | latest | Devanagari/IAST transliteration | De facto standard for Indic script transliteration in JS, 60+ scripts, MIT license |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/better-sqlite3 | latest | TypeScript types for SQLite | Always -- provides Database, Statement types |
| Shobhika font | 1.05 | Devanagari typography | Loaded via next/font/local as WOFF2. 1100+ conjunct characters, vedic accents |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-sqlite3 | sql.js (WASM SQLite) | sql.js runs client-side but is slower and async; better-sqlite3 is server-only but synchronous and fast. Server-only is correct for this app. |
| @indic-transliteration/sanscript | Custom transliteration | Sanscript handles edge cases (vedic marks, nukta, avagraha) that are easy to miss in hand-rolled code |
| Tailwind CSS | CSS Modules | User chose Tailwind. Tailwind v4 auto-scans, zero-config. |

**Installation:**
```bash
npx create-next-app@latest sanskrit-analyzer --yes
cd sanskrit-analyzer
npm install better-sqlite3 @types/better-sqlite3 @indic-transliteration/sanscript
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with Shobhika font, design tokens
│   ├── page.tsx            # Landing page / app shell
│   ├── globals.css         # Tailwind import + custom design tokens
│   └── api/
│       └── dictionary/
│           └── route.ts    # Dictionary lookup API endpoint
├── lib/
│   ├── transliteration.ts  # IAST/Devanagari utility wrapping sanscript
│   ├── dictionary/
│   │   ├── db.ts           # SQLite connection singleton (server-only)
│   │   ├── lookup.ts       # Dictionary query functions
│   │   └── schema.ts       # Type definitions for dictionary entries
│   └── fonts.ts            # Shobhika font configuration
├── components/
│   ├── ui/                 # Shared UI primitives
│   └── layout/             # App shell components (header, nav)
scripts/
├── import-dictionary.ts    # CDSL parser and SQLite importer
├── build-stem-index.ts     # Inflection-to-stem reverse index builder
└── convert-font.sh         # OTF to WOFF2 conversion
data/
├── cdsl/                   # Raw CDSL dictionary files (gitignored, downloaded by script)
└── sanskrit.db             # Built SQLite database (gitignored, built by script)
public/
└── fonts/
    └── shobhika/           # WOFF2 font files
```

### Pattern 1: Server-Only SQLite Access
**What:** SQLite via better-sqlite3 is only accessible in server components and API routes. Never import in client components.
**When to use:** All dictionary operations.
**Example:**
```typescript
// src/lib/dictionary/db.ts
import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'sanskrit.db');
    db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = WAL');
    db.pragma('cache_size = -64000'); // 64MB cache
  }
  return db;
}
```

### Pattern 2: Transliteration Utility Module
**What:** Thin wrapper around sanscript.js exposing only Devanagari/IAST conversion.
**When to use:** Any text conversion between scripts.
**Example:**
```typescript
// src/lib/transliteration.ts
import Sanscript from '@indic-transliteration/sanscript';

export function devanagariToIast(text: string): string {
  return Sanscript.t(text, 'devanagari', 'iast');
}

export function iastToDevanagari(text: string): string {
  return Sanscript.t(text, 'iast', 'devanagari');
}

// Internal utility: SLP1 is used in CDSL data
export function slp1ToDevanagari(text: string): string {
  return Sanscript.t(text, 'slp1', 'devanagari');
}

export function slp1ToIast(text: string): string {
  return Sanscript.t(text, 'slp1', 'iast');
}
```

### Pattern 3: Build-Time Dictionary Import
**What:** Standalone Node.js script that downloads CDSL data, parses the custom markup, and populates SQLite.
**When to use:** During initial setup and when dictionary data updates.
**Example:**
```typescript
// scripts/import-dictionary.ts
// Run with: npx tsx scripts/import-dictionary.ts
// 1. Download mw.txt and ap90.txt from CDSL GitHub
// 2. Parse H1/H2/H3/H4 tagged entries
// 3. Extract headword (key1), definition (body), grammatical info (lex)
// 4. Convert SLP1 headwords to Devanagari and IAST
// 5. Insert into SQLite with FTS5 full-text search
```

### Pattern 4: Shobhika Font via next/font/local
**What:** Load Shobhika OTF (converted to WOFF2) using Next.js built-in font optimization.
**When to use:** Root layout.
**Example:**
```typescript
// src/lib/fonts.ts
import localFont from 'next/font/local';

export const shobhika = localFont({
  src: [
    {
      path: '../../public/fonts/shobhika/Shobhika-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/shobhika/Shobhika-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-shobhika',
  display: 'swap',
});
```

### Anti-Patterns to Avoid
- **Importing better-sqlite3 in client components:** Native Node.js addon, will crash the browser bundle. Use `"use server"` or API routes exclusively.
- **Storing dictionary data in JSON files:** MW has 280,000+ entries. JSON parsing at startup is catastrophically slow. SQLite with indexes is the correct approach.
- **Rolling custom transliteration tables:** Sanskrit has complex rules (virama handling, nukta, conjuncts, avagraha). Sanscript.js handles these correctly.
- **Parsing CDSL data at request time:** Parse once at build time, serve from SQLite. The MW text file is large and parsing is non-trivial.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Devanagari/IAST transliteration | Custom character mapping tables | @indic-transliteration/sanscript | 60+ scripts, handles vedic marks, nukta, avagraha, conjuncts. Years of edge cases fixed. |
| SQLite database access | Raw node:sqlite or WASM | better-sqlite3 | Synchronous API (simpler), pre-built binaries, WAL mode, prepared statements, fastest Node.js SQLite |
| Font optimization | Manual @font-face CSS | next/font/local | Automatic subsetting, preloading, zero layout shift, WOFF2 serving |
| Full-text dictionary search | LIKE queries | SQLite FTS5 extension | FTS5 handles tokenization, ranking, prefix search. LIKE on 280K entries is unacceptably slow. |
| SLP1 to Devanagari/IAST conversion | Custom SLP1 tables | Sanscript.js (supports SLP1 scheme) | CDSL uses SLP1 internally. Sanscript handles SLP1 as a first-class scheme. |

**Key insight:** The CDSL dictionary markup format is the hardest part of this phase. The parsing logic is bespoke (not standard XML, not standard anything). This is the one place where custom code is required. Everything else should use established libraries.

## Common Pitfalls

### Pitfall 1: CDSL Encoding is SLP1, Not Devanagari or IAST
**What goes wrong:** Developers assume Sanskrit headwords in CDSL are in Devanagari or IAST. They are in SLP1 (Sanskrit Library Phonetic) encoding.
**Why it happens:** SLP1 looks like ASCII romanization but is NOT IAST. For example, SLP1 `S` = IAST `s` (retroflex), SLP1 `s` = IAST `s` (dental).
**How to avoid:** Always convert SLP1 to target encoding during import. Use sanscript.js with `'slp1'` as the source scheme.
**Warning signs:** Incorrect diacritics in displayed text, `S` appearing where `s` should.

### Pitfall 2: CDSL Markup is Not Well-Formed XML
**What goes wrong:** Using an XML parser on the raw .txt files fails with parse errors.
**Why it happens:** CDSL files use XML-like tags but are not valid XML. They lack a root element, some tags are unclosed, and entity handling differs.
**How to avoid:** Parse line-by-line with regex or a custom state-machine parser. Each entry starts with `<H1>`, `<H1A>`, etc. and contains `<h>`, `<body>`, `<tail>` sections.
**Warning signs:** XML parser throws errors on the first few lines.

### Pitfall 3: better-sqlite3 Fails to Build on Some Platforms
**What goes wrong:** `npm install` fails because native C++ addon cannot compile.
**Why it happens:** Missing build tools (python, C++ compiler) or incompatible Node.js version.
**How to avoid:** Use Node.js 20.x or 22.x LTS. On Windows, install windows-build-tools or use WSL. Pre-built binaries are available for most LTS versions.
**Warning signs:** `gyp ERR!` during npm install.

### Pitfall 4: SQLite Database Size with Full Entries
**What goes wrong:** Database grows large (100MB+) when storing full dictionary entry markup/HTML.
**Why it happens:** MW has 280,081 entries with rich markup (etymology, cross-references, quotations).
**How to avoid:** Store structured data (headword, definition, grammar, etymology as separate columns). Consider storing the raw body markup plus a cleaned plaintext column for display.
**Warning signs:** Database exceeding 200MB, slow startup.

### Pitfall 5: Shobhika Font File Size
**What goes wrong:** Page load is slow due to large font file.
**Why it happens:** Shobhika has 1100+ conjunct characters. The full OTF is substantial.
**How to avoid:** Convert to WOFF2 (typically 30-50% smaller than OTF). Use `font-display: swap` to prevent FOIT. Use `next/font/local` for automatic optimization.
**Warning signs:** LCP (Largest Contentful Paint) degraded by font loading.

### Pitfall 6: Stem Index Coverage Gaps
**What goes wrong:** Many inflected forms cannot be resolved to stems, making dictionary lookup fail.
**Why it happens:** Sanskrit has massive inflectional morphology (~6M nominal forms from ~70K stems). Building a complete index is infeasible without a proper morphological engine.
**How to avoid:** Use the INRIA Sanskrit Heritage morphological database (SL_morph.xml.gz) as a pre-computed inflection-to-stem mapping. This covers classical Sanskrit nouns, adjectives, and verb forms. Supplement with common paradigm generation for high-frequency stems.
**Warning signs:** Lookup success rate below 60% on standard texts.

## Code Examples

### Dictionary SQLite Schema
```sql
-- Core dictionary entries
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  dictionary TEXT NOT NULL,       -- 'mw' or 'ap90'
  headword_slp1 TEXT NOT NULL,    -- Original SLP1 headword
  headword_deva TEXT NOT NULL,    -- Devanagari headword
  headword_iast TEXT NOT NULL,    -- IAST headword
  homonym INTEGER DEFAULT 0,     -- Homonym number (from <hom>)
  grammar TEXT,                   -- Grammatical info (from <lex>)
  definition TEXT NOT NULL,       -- Cleaned definition text
  etymology TEXT,                 -- Etymology (from <etym>)
  raw_body TEXT,                  -- Original markup for advanced display
  page_ref TEXT,                  -- Page/column reference (from <pc>)
  l_number TEXT                   -- CDSL L-number identifier
);

CREATE INDEX idx_entries_headword_iast ON entries(headword_iast);
CREATE INDEX idx_entries_headword_deva ON entries(headword_deva);
CREATE INDEX idx_entries_dictionary ON entries(dictionary);

-- Full-text search index
CREATE VIRTUAL TABLE entries_fts USING fts5(
  headword_iast,
  headword_deva,
  definition,
  content=entries,
  content_rowid=id
);

-- Inflection-to-stem reverse index
CREATE TABLE stem_index (
  inflected_form_slp1 TEXT NOT NULL,
  inflected_form_iast TEXT NOT NULL,
  inflected_form_deva TEXT NOT NULL,
  stem_slp1 TEXT NOT NULL,
  stem_iast TEXT NOT NULL,
  stem_deva TEXT NOT NULL,
  grammar_info TEXT,              -- e.g., "nom.sg.m", "acc.pl.f"
  PRIMARY KEY (inflected_form_slp1, stem_slp1, grammar_info)
);

CREATE INDEX idx_stem_iast ON stem_index(inflected_form_iast);
CREATE INDEX idx_stem_deva ON stem_index(inflected_form_deva);
```

### CDSL Entry Parser (Conceptual)
```typescript
// scripts/import-dictionary.ts
interface CdslEntry {
  hType: string;          // H1, H1A, H2, etc.
  key1: string;           // SLP1 headword
  key2: string;           // Enhanced headword
  homonym: number | null;
  body: string;           // Raw body markup
  lexInfo: string[];      // Grammatical designations
  etymology: string[];    // Non-Sanskrit etymological references
  lNumber: string;        // Unique L-number
  pageRef: string;        // Page/column ref
}

function parseEntryLine(line: string): CdslEntry | null {
  // Match H-type root element
  const hMatch = line.match(/^<(H[1-4][AB]?|HPW)>/);
  if (!hMatch) return null;

  const hType = hMatch[1];

  // Extract <h> section
  const key1Match = line.match(/<key1>([^<]+)<\/key1>/);
  const key2Match = line.match(/<key2>([^<]+)<\/key2>/);
  const homMatch = line.match(/<hom>(\d+)<\/hom>/);

  // Extract <body> section
  const bodyMatch = line.match(/<body>(.*?)<\/body>/);

  // Extract grammatical info from <lex> tags within body
  const lexMatches = [...(bodyMatch?.[1] || '').matchAll(/<lex>([^<]+)<\/lex>/g)];

  // Extract <tail> section
  const lMatch = line.match(/<L>([^<]+)<\/L>/);
  const pcMatch = line.match(/<pc>([^<]+)<\/pc>/);

  return {
    hType,
    key1: key1Match?.[1] || '',
    key2: key2Match?.[1] || '',
    homonym: homMatch ? parseInt(homMatch[1]) : null,
    body: bodyMatch?.[1] || '',
    lexInfo: lexMatches.map(m => m[1]),
    etymology: [],
    lNumber: lMatch?.[1] || '',
    pageRef: pcMatch?.[1] || '',
  };
}
```

### Design Tokens (Tailwind v4 CSS-first)
```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-sanskrit: var(--font-shobhika), 'Noto Sans Devanagari', sans-serif;

  /* Color palette: warm academic aesthetic */
  --color-parchment-50: #fdf8f0;
  --color-parchment-100: #f9edd8;
  --color-parchment-200: #f3dbb1;
  --color-ink-700: #3d2e1f;
  --color-ink-800: #2a1f14;
  --color-ink-900: #1a1209;
  --color-accent-500: #b45309;
  --color-accent-600: #92400e;

  /* Spacing scale */
  --spacing-sanskrit: 1.8;  /* Line height for Devanagari text */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js 15 + Pages Router | Next.js 16 + App Router (default) | Feb 2026 | Turbopack default, simplified create-next-app |
| tailwind.config.js | Tailwind v4 CSS-first config | Jan 2025 | No JS config needed, auto content detection |
| node-sqlite3 (async) | better-sqlite3 (sync) | 2019+ | Simpler API, 2-5x faster for read-heavy workloads |
| Manual @font-face | next/font/local | Next.js 13+ | Zero layout shift, automatic optimization |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Still works in v4 but CSS-first `@theme` is the new default
- Pages Router: Still supported but App Router is the recommended path for new projects
- `node-sqlite3`: Async callback-based API, slower than better-sqlite3 for synchronous workloads

## Open Questions

1. **CDSL AP90 dictionary data format**
   - What we know: AP90 is in the same csl-orig repository, likely similar markup to MW
   - What's unclear: Whether AP90 uses identical H1/H2/H3/H4 markup or has format differences
   - Recommendation: Download both and check. Build parser to handle both; likely minor variations.

2. **INRIA morphological data completeness**
   - What we know: SL_morph.xml.gz covers classical Sanskrit nouns, adjectives, and verb forms (~6M forms). Licensed under LGPLLR.
   - What's unclear: Exact coverage percentage for typical Sanskrit texts. Whether the data is sufficient without a full morphological engine.
   - Recommendation: Import INRIA data as baseline stem index. Track lookup miss rate. Phase 2 will add proper morphological analysis.

3. **SQLite database bundling for deployment**
   - What we know: The SQLite file should be included in the deployment artifact (user decision).
   - What's unclear: Exact deployment target (Vercel, self-hosted, etc.) and whether Vercel serverless functions support better-sqlite3 native addons.
   - Recommendation: Design for self-hosted or Node.js runtime. If Vercel, may need `@vercel/nft` inclusion or standalone output mode. Address in deployment phase.

4. **Shobhika WOFF2 availability**
   - What we know: Shobhika ships as OTF. No official WOFF2 distribution.
   - What's unclear: Whether the OTF license (SIL OFL 1.1) permits format conversion (it does -- OFL explicitly allows this).
   - Recommendation: Convert OTF to WOFF2 using a tool like `woff2_compress` or Transfonter during setup. Include converted files in the repo.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest, pairs well with Next.js 16) |
| Config file | vitest.config.ts -- Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INPUT-01 | DEFERRED -- no tests needed | -- | -- | -- |
| ANAL-05 | Devanagari-to-IAST and IAST-to-Devanagari transliteration | unit | `npx vitest run src/lib/__tests__/transliteration.test.ts -t "transliteration"` | Wave 0 |
| UI-01 | Shobhika font loads, Devanagari renders correctly | manual | Visual inspection in browser | -- |
| UI-03 | No auth required, app loads without login | smoke | `npx vitest run src/__tests__/app-shell.test.ts -t "no auth"` | Wave 0 |
| -- | Dictionary lookup returns correct entries for MW headwords | unit | `npx vitest run src/lib/__tests__/dictionary.test.ts -t "lookup"` | Wave 0 |
| -- | Stem index resolves inflected forms to correct stems | unit | `npx vitest run src/lib/__tests__/stem-index.test.ts -t "stem"` | Wave 0 |
| -- | CDSL parser extracts entries correctly from MW format | unit | `npx vitest run scripts/__tests__/import-dictionary.test.ts -t "parser"` | Wave 0 |
| -- | SLP1-to-IAST conversion handles edge cases | unit | `npx vitest run src/lib/__tests__/transliteration.test.ts -t "slp1"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration for Next.js 16
- [ ] `src/lib/__tests__/transliteration.test.ts` -- covers ANAL-05 and SLP1 conversion
- [ ] `src/lib/__tests__/dictionary.test.ts` -- covers dictionary lookup
- [ ] `src/lib/__tests__/stem-index.test.ts` -- covers stem resolution
- [ ] `scripts/__tests__/import-dictionary.test.ts` -- covers CDSL parser
- [ ] `src/__tests__/app-shell.test.ts` -- covers UI-03 (smoke test)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react`

## Sources

### Primary (HIGH confidence)
- [Cologne CDSL MW Markup Documentation](https://www.sanskrit-lexicon.uni-koeln.de/talkMay2008/mwtags.html) -- Complete MW entry structure, 280,081 records, 13 root element types, SLP1 encoding
- [sanskrit-lexicon/csl-orig GitHub](https://github.com/sanskrit-lexicon/csl-orig) -- Dictionary data repository, txt format with git-based corrections
- [indic-transliteration/sanscript.js GitHub](https://github.com/indic-transliteration/sanscript.js) -- 60+ scripts including Devanagari, IAST, SLP1. API: `Sanscript.t(input, from, to)`
- [Sandhi-IITBombay/Shobhika GitHub](https://github.com/Sandhi-IITBombay/Shobhika) -- v1.05, OTF, 1100+ conjuncts, SIL OFL 1.1
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation) -- Next.js 16, create-next-app defaults
- [Tailwind CSS v4 Next.js Guide](https://tailwindcss.com/docs/guides/nextjs) -- CSS-first config, `@tailwindcss/postcss`
- [better-sqlite3 npm](https://www.npmjs.com/package/better-sqlite3) -- v12.6.2, synchronous, native addon

### Secondary (MEDIUM confidence)
- [INRIA Sanskrit Heritage XML Resources](https://sanskrit.inria.fr/xml.html) -- SL_morph.xml.gz inflected forms database, LGPLLR license, ~6M nominal forms
- [INRIA MW dictionary header](https://sanskrit.inria.fr/MW/MWHeader.html) -- MW digitization background

### Tertiary (LOW confidence)
- [PyCDSL](https://github.com/hrishikeshrt/PyCDSL) -- Python reference for CDSL data access patterns (useful as reference, not direct dependency)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are well-established, versions verified against current releases
- Architecture: HIGH -- Next.js App Router + server-only SQLite is a proven pattern
- Dictionary parsing: MEDIUM -- MW markup is well-documented but AP90 format unverified, parser is custom
- Stem index: MEDIUM -- INRIA data exists but coverage for typical texts unverified
- Pitfalls: HIGH -- based on documented format issues and known library constraints

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, 30-day validity)
