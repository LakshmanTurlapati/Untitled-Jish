# Phase 8: Kaavya Reader and Storage Foundation - Research

**Researched:** 2026-03-19
**Domain:** PDF text extraction, IndexedDB persistence, paginated reader UI, AI-assisted shloka interpretation
**Confidence:** MEDIUM-HIGH

## Summary

This phase requires four distinct technical capabilities: (1) uploading/parsing PDF files and accepting pasted Sanskrit text, (2) persistent storage of kaavyas and reading state in IndexedDB, (3) a comfortable Kindle-like paginated reader, and (4) AI-powered interpretation hints that never reveal direct answers. The storage and reader domains are well-served by mature libraries (Dexie.js, pdfjs-dist). The paginated reader for Devanagari text is best built as a custom component using CSS multi-column layout. The AI hint system requires careful prompt engineering to enforce the "pramaana-backed hints, never the direct answer" constraint.

**Primary recommendation:** Use Dexie.js 4.x for IndexedDB (reactive queries via useLiveQuery), pdfjs-dist 5.x for PDF text extraction, CSS column-based pagination for the reader, and a server-side AI endpoint with strict system prompts for shloka interpretation hints.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-01 | User can upload a PDF containing Sanskrit kaavya text | pdfjs-dist text extraction with Devanagari support; File API for upload |
| READ-02 | User can paste Sanskrit text directly | Simple textarea input; store raw text in Dexie |
| READ-03 | Kaavya displayed in Kindle-like page-by-page view | CSS multi-column layout with overflow hidden + translateX navigation |
| READ-04 | User can select a shloka and type their interpretation | Text selection handler + interpretation input panel |
| READ-05 | AI provides pramaana-backed hints, never the direct answer | Server-side AI endpoint with strict system prompt + web search for pramaana |
| READ-06 | User can browse their library of uploaded kaavyas | Dexie table listing with useLiveQuery for reactive updates |
| STOR-01 | All library data persists in browser across sessions | Dexie.js wrapping IndexedDB with schema versioning |
| STOR-02 | Reading state (current page, bookmarks) persists | Dexie table for reading progress keyed by kaavya ID |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.3.0 | IndexedDB wrapper for kaavya storage | Best React integration (useLiveQuery), schema versioning, reactive queries, ~3M weekly downloads |
| dexie-react-hooks | 4.2.0 | React hooks for Dexie | useLiveQuery auto-updates components on DB changes across tabs/workers |
| pdfjs-dist | 5.5.207 | PDF text extraction in browser | Mozilla's standard; 3M+ weekly downloads; handles Unicode/Devanagari |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-pdf | 10.4.1 | React wrapper for pdfjs-dist | If you need to render PDF pages visually (optional -- text extraction may suffice) |
| vite-plugin-static-copy | latest | Copy pdfjs-dist assets (cmaps, workers) | Required for Vite builds with pdfjs-dist |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie | idb (8.0.3) | idb is smaller (1.2kB) but lacks reactive queries, schema versioning, and React hooks -- Dexie is better for app-level storage |
| pdfjs-dist | unpdf | unpdf is lighter but pdfjs-dist has better Devanagari/Unicode handling and broader community support |
| Custom paginated reader | react-reader | react-reader is ePub-focused, not suitable for plain Sanskrit text pagination |

**Installation:**
```bash
npm install dexie dexie-react-hooks pdfjs-dist
```

**Version verification:** Verified against npm registry on 2026-03-19.

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    kaavya/
      components/
        KaavyaLibrary.tsx       # Library browse view
        KaavyaUploader.tsx      # PDF upload + text paste
        KaavyaReader.tsx        # Paginated reader container
        ReaderPage.tsx          # Single page view with CSS columns
        ShlokaSelector.tsx      # Shloka selection + interpretation input
        HintPanel.tsx           # AI hint display with streaming
      hooks/
        useKaavyaLibrary.ts     # Dexie queries for library listing
        useReader.ts            # Pagination state, page navigation
        useShlokaHints.ts       # AI hint fetching + streaming
      db/
        schema.ts               # Dexie database definition + versioning
        kaavyaStore.ts          # CRUD operations for kaavyas
        readingStateStore.ts    # Reading progress persistence
      utils/
        pdfExtractor.ts         # PDF text extraction with pdfjs-dist
        textPaginator.ts        # Text splitting logic for pages
      types.ts                  # Kaavya, Shloka, ReadingState types
```

### Pattern 1: Dexie Database Schema
**What:** Define IndexedDB schema with Dexie's declarative versioning
**When to use:** Always -- this is the foundation for all storage
**Example:**
```typescript
// db/schema.ts
import Dexie, { type EntityTable } from 'dexie';

interface Kaavya {
  id?: number;
  title: string;
  author?: string;
  sourceType: 'pdf' | 'pasted';
  rawText: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReadingState {
  id?: number;
  kaavyaId: number;
  currentPage: number;
  totalPages: number;
  lastReadAt: Date;
}

interface ShlokaInterpretation {
  id?: number;
  kaavyaId: number;
  shlokaText: string;
  userInterpretation: string;
  hintsReceived: string[];
  createdAt: Date;
}

const db = new Dexie('KaavyaDB') as Dexie & {
  kaavyas: EntityTable<Kaavya, 'id'>;
  readingStates: EntityTable<ReadingState, 'id'>;
  interpretations: EntityTable<ShlokaInterpretation, 'id'>;
};

db.version(1).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
});

export { db };
export type { Kaavya, ReadingState, ShlokaInterpretation };
```

### Pattern 2: useLiveQuery for Reactive Library
**What:** React components auto-update when IndexedDB data changes
**When to use:** Library listing, reading state display
**Example:**
```typescript
// hooks/useKaavyaLibrary.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export function useKaavyaLibrary() {
  const kaavyas = useLiveQuery(
    () => db.kaavyas.orderBy('updatedAt').reverse().toArray()
  );
  return { kaavyas: kaavyas ?? [], isLoading: kaavyas === undefined };
}
```

### Pattern 3: CSS Multi-Column Pagination
**What:** Use CSS columns with fixed height to create automatic page breaks, then navigate by scrolling horizontally
**When to use:** The paginated reader view
**Example:**
```typescript
// components/ReaderPage.tsx -- core pagination concept
const readerStyles: React.CSSProperties = {
  columnWidth: '100%',    // one column per "page"
  columnFill: 'auto',
  height: '100%',         // fixed height container
  overflow: 'hidden',     // hide overflow columns
};

// Navigation: translate the inner content by -(pageIndex * containerWidth)
// Use scrollWidth / containerWidth to calculate total page count
```

### Pattern 4: PDF Text Extraction
**What:** Extract text from uploaded PDF using pdfjs-dist in browser
**When to use:** When user uploads a PDF file
**Example:**
```typescript
// utils/pdfExtractor.ts
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}
```

### Pattern 5: AI Hint System Prompt Architecture
**What:** Strict system prompt that enforces "hints only, never the answer"
**When to use:** Server-side AI endpoint for shloka interpretation
**Example:**
```typescript
// Server-side system prompt (NOT client-side -- keep prompt secure)
const SHLOKA_HINT_SYSTEM_PROMPT = `You are a Sanskrit kaavya study companion.
Your role is to help students develop their own understanding of shlokas.

CRITICAL RULES:
1. NEVER provide the direct translation or interpretation of a shloka
2. ALWAYS respond with hints, nudges, and guiding questions
3. Reference pramaana (authoritative sources) -- cite commentaries like
   Mallinatha, Sridhara, or relevant shastra references
4. Point to word roots (dhatu), grammar (vyakarana), and context clues
5. If the student's interpretation is on the right track, encourage them
6. If the student's interpretation is off, gently redirect with a hint

FORMAT: Respond with 2-3 short hints/nudges, each citing a pramaana where possible.`;
```

### Anti-Patterns to Avoid
- **Storing entire PDFs in IndexedDB:** Store extracted text only. Raw PDF binary bloats the DB and serves no purpose after extraction.
- **Client-side AI system prompts:** The "never give the answer" constraint must be enforced server-side. Client-side prompts can be inspected and bypassed.
- **Rendering PDF pages for reading:** For a text reader, extract text and render as HTML. PDF page rendering (canvas-based) is slow and doesn't support comfortable text reflow.
- **Using localStorage for kaavya storage:** localStorage has a 5-10MB limit and is synchronous. IndexedDB via Dexie handles large text collections properly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD | Raw IndexedDB API with transactions | Dexie.js | IndexedDB API is callback-based, error-prone, requires manual versioning |
| PDF text extraction | Custom PDF parser | pdfjs-dist | PDF format is extremely complex; Unicode/Devanagari ligature handling is non-trivial |
| Reactive DB queries | Manual event listeners on DB changes | useLiveQuery (dexie-react-hooks) | Cross-tab reactivity, automatic dependency tracking, cleanup handled |
| Schema migrations | Manual version checking code | Dexie.version() | Dexie handles upgrade paths, index changes, data migration automatically |

**Key insight:** IndexedDB's raw API is notoriously verbose and callback-heavy. Dexie eliminates entire categories of bugs around transactions, versioning, and reactivity.

## Common Pitfalls

### Pitfall 1: pdfjs-dist Worker Version Mismatch
**What goes wrong:** PDF parsing fails silently or throws cryptic errors
**Why it happens:** The worker script version must exactly match the pdfjs-dist package version
**How to avoid:** Use `import.meta.url` to resolve the worker from the installed package (see code example above). Never hardcode a CDN URL with a version number.
**Warning signs:** "Setting up fake worker" console warning, slow PDF parsing

### Pitfall 2: Devanagari Text Extraction Garbling
**What goes wrong:** Extracted Sanskrit text has mangled vowel markers (maatra), anusvara, visarga positions
**Why it happens:** PDF text content ordering may not match visual order for complex scripts with above-base/below-base characters
**How to avoid:** Test with real Sanskrit PDFs early. If extraction quality is poor, consider: (a) providing a text paste alternative prominently, (b) post-processing extracted text to reorder combining characters
**Warning signs:** Vowel signs appearing before/after wrong consonants, missing chandrabindu

### Pitfall 3: CSS Column Pagination Height Sensitivity
**What goes wrong:** Page count varies on resize, text gets cut off mid-line
**Why it happens:** CSS column pagination depends on exact container height; different font sizes or line heights change page breaks
**How to avoid:** Use a fixed reader container with explicit height, recalculate page count on resize (debounced), use `line-height` that divides evenly into container height
**Warning signs:** Partial lines at page bottom, page count flickering on resize

### Pitfall 4: Dexie Schema Version Conflicts
**What goes wrong:** Database upgrade fails, data lost
**Why it happens:** Changing stores definition without incrementing version number, or removing version declarations
**How to avoid:** Never modify existing version declarations. Always add a new version() call for schema changes. Keep all version declarations in code (Dexie needs the full upgrade path).
**Warning signs:** "UpgradeError" in console, blank library after code update

### Pitfall 5: Large Text Storage Performance
**What goes wrong:** Library listing becomes slow when many kaavyas stored
**Why it happens:** Loading full rawText for all kaavyas just to display titles
**How to avoid:** Index on title/createdAt, use `.toArray()` with projection or load metadata separately from full text
**Warning signs:** Library view takes >500ms to render

### Pitfall 6: AI Hints Leaking Direct Answers
**What goes wrong:** AI provides complete translations despite instructions
**Why it happens:** System prompts can be overridden by clever user input; model may "help too much"
**How to avoid:** Server-side enforcement only. Add output validation layer that checks for translation patterns. Use a follow-up prompt to verify the response contains hints not answers.
**Warning signs:** Responses that start with "This shloka means..." or contain full verse translations

## Code Examples

### File Upload with Drag-and-Drop
```typescript
// components/KaavyaUploader.tsx
function KaavyaUploader({ onUpload }: { onUpload: (text: string, title: string) => void }) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      const text = await extractTextFromPdf(file);
      onUpload(text, file.name.replace('.pdf', ''));
    }
  };

  const handlePaste = (title: string, text: string) => {
    onUpload(text, title);
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      {/* Also provide textarea for pasting */}
    </div>
  );
}
```

### Saving a Kaavya to Dexie
```typescript
// db/kaavyaStore.ts
import { db, type Kaavya } from './schema';

export async function saveKaavya(title: string, rawText: string, sourceType: 'pdf' | 'pasted'): Promise<number> {
  const now = new Date();
  return db.kaavyas.add({
    title,
    rawText,
    sourceType,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getKaavya(id: number): Promise<Kaavya | undefined> {
  return db.kaavyas.get(id);
}

export async function deleteKaavya(id: number): Promise<void> {
  await db.transaction('rw', [db.kaavyas, db.readingStates, db.interpretations], async () => {
    await db.kaavyas.delete(id);
    await db.readingStates.where('kaavyaId').equals(id).delete();
    await db.interpretations.where('kaavyaId').equals(id).delete();
  });
}
```

### Reading State Persistence
```typescript
// db/readingStateStore.ts
import { db } from './schema';

export async function saveReadingState(kaavyaId: number, currentPage: number, totalPages: number) {
  const existing = await db.readingStates.where('kaavyaId').equals(kaavyaId).first();
  if (existing) {
    await db.readingStates.update(existing.id!, {
      currentPage,
      totalPages,
      lastReadAt: new Date(),
    });
  } else {
    await db.readingStates.add({
      kaavyaId,
      currentPage,
      totalPages,
      lastReadAt: new Date(),
    });
  }
}
```

### CSS Column-Based Pagination
```css
/* Reader container */
.reader-viewport {
  width: 100%;
  height: 70vh;          /* Fixed height for consistent pagination */
  overflow: hidden;
  position: relative;
}

.reader-content {
  column-width: 100%;
  column-fill: auto;
  height: 100%;
  font-family: 'Noto Sans Devanagari', 'Noto Serif Devanagari', serif;
  font-size: 1.25rem;
  line-height: 2;        /* Generous line height for Sanskrit readability */
  transition: transform 0.3s ease;
  /* Navigate pages: transform: translateX(-{pageIndex * 100}%) */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage for app data | IndexedDB via Dexie | Ongoing | Supports large text storage, structured queries, cross-tab sync |
| pdf-parse (unmaintained) | pdfjs-dist 5.x or unpdf | 2024-2025 | Better maintenance, WASM support, modern module format |
| Canvas-based PDF rendering | Text extraction + HTML rendering | N/A | Better reflow, accessibility, and reading comfort for text-focused apps |
| Dexie 3 | Dexie 4 | 2024 | React Suspense hooks, improved TypeScript, EntityTable types |

**Deprecated/outdated:**
- pdf-parse: Last published 2019, unmaintained. Use pdfjs-dist or unpdf instead.
- localForage: While still functional, Dexie provides better React integration and querying.

## Open Questions

1. **Devanagari PDF extraction quality**
   - What we know: pdfjs-dist handles Unicode but complex scripts can have character reordering issues
   - What's unclear: Quality of extraction for typical Sanskrit kaavya PDFs (scanned vs. digital-native)
   - Recommendation: Prioritize the "paste text" flow as the reliable path. Treat PDF upload as best-effort with a preview/edit step before saving.

2. **AI API choice for shloka hints**
   - What we know: Phase depends on Phase 7 (likely establishes the AI integration pattern)
   - What's unclear: Which AI API is being used (OpenAI, Anthropic, etc.) and whether web search for pramaana is via the AI's built-in tools or a separate search step
   - Recommendation: Design the hint API endpoint abstractly; the system prompt pattern works across providers. The pramaana sourcing may need a web search tool call or retrieval augmentation.

3. **Shloka boundary detection**
   - What we know: Shlokas typically end with double danda (||) and may have verse numbers
   - What's unclear: Whether automatic shloka boundary detection from raw text is in scope, or users manually select text
   - Recommendation: Start with manual text selection. Optionally add auto-detection using || (double danda) as a delimiter for a better UX.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | To be determined (depends on project setup from earlier phases) |
| Config file | TBD -- see Wave 0 |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| READ-01 | PDF upload extracts text and stores kaavya | unit + integration | Test pdfExtractor.ts with sample PDF buffer | Wave 0 |
| READ-02 | Pasted text stored as kaavya | unit | Test kaavyaStore.ts saveKaavya with pasted text | Wave 0 |
| READ-03 | Paginated reader calculates pages and navigates | unit | Test textPaginator.ts + useReader hook | Wave 0 |
| READ-04 | Shloka selection and interpretation input | integration | Component test for ShlokaSelector | Wave 0 |
| READ-05 | AI returns hints not answers | integration | Test hint API endpoint with mock AI responses | Wave 0 |
| READ-06 | Library browsing shows all kaavyas | unit | Test useKaavyaLibrary hook with Dexie | Wave 0 |
| STOR-01 | Data persists in IndexedDB | integration | Test Dexie CRUD with fake-indexeddb | Wave 0 |
| STOR-02 | Reading state persists | unit | Test readingStateStore with fake-indexeddb | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** Full test suite
- **Phase gate:** All tests green

### Wave 0 Gaps
- [ ] Install `fake-indexeddb` for testing Dexie operations in Node/test environment
- [ ] Create test fixtures: sample PDF buffer, sample Sanskrit text
- [ ] Set up Dexie test helpers (create/teardown test DB per test)

## Sources

### Primary (HIGH confidence)
- [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist) - version 5.5.207 verified
- [Dexie.js docs](https://dexie.org/docs/Dexie.js) - schema versioning, useLiveQuery API
- [dexie-react-hooks](https://www.npmjs.com/package/dexie-react-hooks) - version 4.2.0 verified
- [MDN CSS Columns](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Columns/Handling_Overflow_in_Multicol) - overflow handling in multi-column layout

### Secondary (MEDIUM confidence)
- [CSS Multi-Column Book Layout](https://www.w3tutorials.net/blog/css-multi-column-multi-page-layout-like-an-open-book/) - open book pagination technique
- [Ebook pagination blog](https://blog.cacoveanu.com/2020/2020.08.14.pagination_in_ebooks.html) - column-based pagination approach
- [Sanskrit Coders - PDF extraction](https://sanskrit-coders.github.io/content/misc/pdf-text-extraction/) - Devanagari extraction challenges
- [pdfjs-dist Vite worker issue](https://github.com/mozilla/pdf.js/discussions/19520) - worker configuration for Vite

### Tertiary (LOW confidence)
- AI hint system prompt design - based on general prompt engineering knowledge, needs validation with actual AI provider
- Shloka boundary detection via double danda - based on Sanskrit text conventions, untested in code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified on npm, well-established
- Architecture: MEDIUM-HIGH - CSS column pagination is proven but needs tuning for Devanagari
- Pitfalls: MEDIUM - Devanagari-specific issues based on community reports, not firsthand testing
- AI hint system: MEDIUM - prompt pattern is sound but enforcement needs testing

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, 30-day validity)
