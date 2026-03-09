<p align="center">
  <strong><em>Sanskrit Analyzer</em></strong>
</p>

<p align="center">
  Deep grammatical analysis of Sanskrit text — sandhi splitting, compound decomposition, morphological breakdown, and dictionary lookups — with a Duolingo-inspired study experience.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/SQLite-591MB_Dictionary-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tests-148_passing-brightgreen?logo=vitest" alt="148 Tests" />
  <img src="https://img.shields.io/badge/OCR-Tesseract.js_7-FF6F00" alt="Tesseract.js" />
  <img src="https://img.shields.io/badge/LLM-Grok_(AI_SDK)-8B5CF6" alt="Grok via AI SDK" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License" />
</p>

---

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Data Pipeline](#data-pipeline)
- [Core Analysis Pipeline](#core-analysis-pipeline)
- [Dictionary System](#dictionary-system)
- [OCR Engine](#ocr-engine)
- [Study Features](#study-features)
- [UI & Design System](#ui--design-system)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)

---

## What It Does

Sanskrit Analyzer takes any Sanskrit text — typed, pasted, or photographed — and produces a complete grammatical breakdown:

1. **Sandhi Splitting** — Resolves vowel, consonant, and visarga sandhi junctions into individual words
2. **Samasa Decomposition** — Identifies compound types (tatpurusha, dvandva, bahuvrihi, avyayibhava, karmadharaya, dvigu) and breaks them into components
3. **Morphological Analysis** — Tags each word with vibhakti (case), vacana (number), linga (gender), dhatu (root), gana (verb class), lakara (tense), and purusha (person)
4. **Dictionary Definitions** — Looks up meanings from Monier-Williams (286K entries) and Apte (34K entries), cross-referenced with AI contextual interpretation
5. **INRIA Validation** — Verifies each word's morphological analysis against a 1.9M stem index from the INRIA Sanskrit Heritage database
6. **OCR** — Extracts Devanagari text from photos of printed manuscripts using Tesseract.js
7. **Study Mode** — Vocabulary extraction with particle filtering and gamified MCQ quizzes with hearts, XP, streaks, and confetti

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React 19)                    │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌────────┐│
│  │ TextInput │  │ ImageUpload  │  │ VocabList  │  │QuizView││
│  │ + IAST    │  │ (drag-drop)  │  │ (filtered) │  │(gamify)││
│  └─────┬─────┘  └──────┬───────┘  └────────────┘  └────────┘│
│        │               │                                     │
│  ┌─────┴───────────────┴──────────────────────────────────┐  │
│  │              AnalysisView (Tab Controller)              │  │
│  │         Words | Vocabulary | Quiz  +  Sticky Bar        │  │
│  └─────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────────┘
                         │ HTTP
┌────────────────────────┼─────────────────────────────────────┐
│                   Next.js API Routes                         │
│                                                              │
│  POST /api/analyze     POST /api/ocr     GET /api/dictionary │
│  GET /api/distractors                                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                 Analysis Pipeline                      │   │
│  │                                                        │   │
│  │  Text ──► Grok LLM ──► Sandhi/Samasa/Morphology      │   │
│  │              │                    │                     │   │
│  │              ▼                    ▼                     │   │
│  │       Zod Validation      INRIA Stem Index             │   │
│  │              │                    │                     │   │
│  │              └────────┬───────────┘                     │   │
│  │                       ▼                                 │   │
│  │              MW + Apte Lookup ──► EnrichedWord[]       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │          SQLite Database (591MB, readonly)              │   │
│  │  320K dictionary entries  ·  1.9M stem mappings        │   │
│  │  FTS5 full-text search    ·  WAL mode, 64MB cache      │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- A [Grok API key](https://console.x.ai/) (for the LLM analysis pipeline)

### Installation

```bash
# Clone the repository
git clone https://github.com/LakshmanTurlapati/Untitled-Jish.git
cd Untitled-Jish

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
XAI_API_KEY=your_grok_api_key_here
```

### Dictionary Data Setup

The dictionary database (`data/sanskrit.db`, ~591MB) needs to be built from source files before first use:

```bash
# Download CDSL sources and build the SQLite database
# This imports Monier-Williams, Apte, and INRIA morphology data
npm run setup-data
```

This runs three steps:
1. **Dictionary import** — Parses MW and AP90 from CDSL XML into SQLite entries
2. **Stem index build** — Processes INRIA's `SL_morph.xml` into 1.9M inflection-to-stem mappings
3. **FTS index** — Builds full-text search over all dictionary entries

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No login or account required — start analyzing immediately.

---

## Core Analysis Pipeline

The analysis pipeline lives in `src/lib/analysis/` and orchestrates a multi-stage NLP process.

### Flow

```
Input Text
    │
    ▼
┌─────────────────────────────────┐
│  1. LLM Analysis (Grok)        │
│     - Sandhi junction detection │
│     - Compound decomposition    │
│     - Morphological tagging     │
│     - Contextual meanings       │
│                                 │
│  Uses: @ai-sdk/xai             │
│  Output: Zod-validated schema   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  2. Sandhi Extraction           │
│     Vowel, consonant, visarga   │
│     sandhi type classification  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  3. Samasa Extraction           │
│     Compound type + components  │
│     tatpurusha, dvandva, etc.   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  4. INRIA Stem Validation       │
│     Query 1.9M inflection index │
│     Verify morphological forms  │
│     Mark words as "verified"    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  5. Dictionary Enrichment       │
│     MW + Apte headword lookup   │
│     Source tracking per meaning │
│     "dictionary" / "ai" / "both"│
└────────────┬────────────────────┘
             │
             ▼
       EnrichedWord[]
```

### Type System

The analysis pipeline is fully typed with TypeScript interfaces and validated at runtime with Zod schemas:

```typescript
// Core word analysis result
interface EnrichedWord {
  original: string;          // Original Devanagari text
  iast: string;              // IAST transliteration
  sandhi: {
    type: SandhiType;        // "vowel" | "consonant" | "visarga" | "none"
    original_junction: string;
  };
  morphology: {
    stem: string;            // Dictionary stem form
    word_type: WordType;     // "noun" | "verb" | "adjective" | ...
    vibhakti?: string;       // Case (prathama, dvitiya, etc.)
    vacana?: Vacana;         // Number (eka, dvi, bahu)
    linga?: Linga;           // Gender (pum, stri, napumsaka)
    dhatu?: string;          // Verbal root
    gana?: string;           // Verb class (1-10)
    lakara?: string;         // Tense/mood
    purusha?: string;        // Person
  };
  samasa: {
    type: SamasaType;        // Compound classification
    components: string[];    // Decomposed parts
  };
  meanings: string[];
  mw_definition?: string;    // Monier-Williams definition
  apte_definition?: string;  // Apte definition
  meaning_source: "dictionary" | "ai" | "both";
  verified: boolean;         // INRIA validation status
}
```

### LLM Integration

Analysis uses the **Vercel AI SDK** with **Grok** (`@ai-sdk/xai`):

- **Structured output** via `Output.object()` with Zod schemas — no prompt-based JSON parsing
- **Reasoning effort** set to "high" for complex grammatical analysis
- **Prompt engineering** includes detailed examples of Paninian grammar terminology, sandhi rules, and compound classification

---

## Dictionary System

### Data Sources

| Dictionary | Entries | Source |
|-----------|---------|--------|
| **Monier-Williams** (MW) | ~286,000 | Cologne Digital Sanskrit Lexicon (CDSL) |
| **Apte** (AP90) | ~34,000 | CDSL |
| **INRIA Stem Index** | ~1,900,000 | INRIA Sanskrit Heritage morphological database |

### SQLite Schema

The compiled database (`data/sanskrit.db`, 591MB) has three tables:

**`entries`** — Dictionary headwords with definitions
```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  dictionary TEXT,           -- "MW" or "AP90"
  headword_slp1 TEXT,        -- SLP1 encoding
  headword_deva TEXT,        -- Devanagari
  headword_iast TEXT,        -- IAST
  grammar TEXT,              -- Part of speech
  definition TEXT,           -- English definition
  raw_body TEXT              -- Full XML entry
);
```

**`stem_index`** — Maps inflected forms to dictionary stems
```sql
CREATE TABLE stem_index (
  inflected_form_slp1 TEXT,
  inflected_form_deva TEXT,
  inflected_form_iast TEXT,
  stem_slp1 TEXT,
  stem_deva TEXT,
  stem_iast TEXT,
  grammar_info TEXT          -- Morphological tags
);
```

**`entries_fts`** — FTS5 full-text search index over headwords and definitions

### Lookup Strategy

1. **Exact headword match** — Direct lookup by headword in any script (IAST/Devanagari/SLP1)
2. **Stem resolution** — Inflected form → stem_index → stem → headword lookup (handles declined/conjugated forms)
3. **Full-text search** — FTS5 query with LIKE fallback for partial matches

Connection uses a singleton pattern with 64MB cache and WAL mode for fast concurrent reads.

---

## OCR Engine

Sanskrit Analyzer uses **Tesseract.js v7** for local, privacy-preserving OCR:

- **Script**: Devanagari-specific trained data (`script/Devanagari`)
- **Processing**: Runs entirely in the browser/server — no external API calls
- **Input**: JPEG or PNG images up to 20MB
- **Output**: Extracted Devanagari text fed directly into the analysis pipeline

### Why Tesseract.js (not Vision API)?

- **Privacy** — No images sent to third-party services
- **Cost** — Zero per-request cost after initial load
- **Offline** — Works without internet once traineddata is cached
- **Devanagari-optimized** — Uses script-specific training data, not general multilingual models

---

## Study Features

### Vocabulary Extraction

After analysis, words are extracted into a study-ready vocabulary list:

- **Particle filtering** — Common Sanskrit particles (ca, tu, hi, eva, api, iti, na, va, etc.) are automatically removed
- **Deduplication** — Words with the same stem appear only once
- **Preserved order** — Words appear in the order they occur in the text

### Quiz System

Gamified MCQ quizzes generated from extracted vocabulary:

| Feature | Description |
|---------|-------------|
| **Hearts** | 3 decorative lives (quiz continues at 0 — motivational, not punitive) |
| **XP** | +10 points per correct answer |
| **Streaks** | Consecutive correct counter with milestone messages at 3x and 5x |
| **Flow** | Tap-to-select + "Check" button (no instant feedback on tap) |
| **Questions** | Up to 10 word-to-meaning MCQs with 4 options each |
| **Distractors** | Sourced from other vocabulary, padded with random MW definitions via `/api/distractors` |
| **Celebration** | Completion screen with score, XP, hearts, CSS confetti animation |
| **Encouragement** | Sanskrit-themed messages: "Sadhu!" (correct), "Punah prayatnah" (incorrect) |

Quiz state is managed with `useReducer` for predictable state transitions through phases: `ready` → `selecting` → `checked` → `complete`.

---

## UI & Design System

### Duolingo-Inspired Design

The interface uses Duolingo-inspired UX patterns while preserving a warm, scholarly aesthetic:

- **Centered single-column layout** — 640px max-width for focused reading
- **Big rounded cards** — 16-20px border-radius with generous padding
- **Pill-shaped badges** — Morphology properties displayed as rounded-full pills
- **3D pressed buttons** — Thick bottom border that shrinks on click (`border-b-4 active:border-b-2 active:translate-y-[2px]`)
- **Sticky bottom bar** — Primary action always visible
- **Tabbed navigation** — Words | Vocabulary | Quiz pills with active state fill
- **Progress steps** — "Splitting sandhi..." → "Analyzing morphology..." → "Looking up meanings..." with animated checkmarks

### Design Tokens

CSS custom properties in `globals.css`:

```css
--color-parchment-50:  #fefdf8;   /* Lightest background */
--color-parchment-100: #fdf6e3;   /* Card backgrounds */
--color-parchment-200: #f5e6c8;   /* Hover/badge backgrounds */
--color-ink-700:       #44403c;   /* Secondary text */
--color-ink-800:       #292524;   /* Primary text */
--color-ink-900:       #1c1917;   /* Headings */
--color-accent-500:    #f59e0b;   /* Amber highlight */
--color-accent-600:    #d97706;   /* Amber buttons */
--color-accent-800:    #78350f;   /* 3D button shadow */
```

### Typography

- **Shobhika** — Primary Devanagari font loaded via `next/font/local` from `public/fonts/shobhika/`
- **Sanskrit line-height** — Custom `--spacing-sanskrit: 1.8` for proper Devanagari vertical rhythm
- **Noto Sans Devanagari** — System fallback for Devanagari rendering

### Meaning Source Indicators

Dictionary sources are displayed as stacked sections with colored dots:

- **Green dot** — Monier-Williams
- **Blue dot** — Apte
- **Amber dot** — AI Interpretation

### Animations

```css
@keyframes confetti-fall   /* 2-3s fall with 720deg rotation */
@keyframes check-appear    /* Scale bounce: 0 → 1.2 → 1 */
@keyframes fade-in         /* Opacity + translateY entrance */
```

---

## API Reference

### `POST /api/analyze`

Full Sanskrit text analysis.

**Request:**
```json
{ "text": "धर्मक्षेत्रे कुरुक्षेत्रे" }
```

**Response:**
```json
{
  "input_text": "धर्मक्षेत्रे कुरुक्षेत्रे",
  "words": [
    {
      "original": "धर्मक्षेत्रे",
      "iast": "dharmakṣetre",
      "morphology": {
        "stem": "dharmakṣetra",
        "word_type": "noun",
        "vibhakti": "saptamī",
        "vacana": "ekavacana",
        "linga": "napumsakalinga"
      },
      "samasa": {
        "type": "tatpurusha",
        "components": ["dharma", "kṣetra"]
      },
      "meanings": ["the field of dharma"],
      "mw_definition": "...",
      "meaning_source": "both",
      "verified": true
    }
  ],
  "timestamp": "2026-03-09T..."
}
```

### `POST /api/ocr`

Extract text from Devanagari images.

**Request:** `multipart/form-data` with `image` field (JPEG/PNG, max 20MB)

**Response:**
```json
{ "text": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः" }
```

### `GET /api/dictionary`

Dictionary lookup with multiple modes.

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `q` | Yes | Search query |
| `script` | No | `iast` (default), `deva`, `slp1` |
| `mode` | No | `headword` (default), `stem`, `search` |
| `limit` | No | Max results (default 10) |

**Response:** Array of dictionary entries with headword, grammar, definition, and source dictionary.

### `GET /api/distractors`

Random dictionary meanings for quiz distractor generation.

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `count` | No | Number of meanings (1-10, default 3) |

**Response:**
```json
{ "meanings": ["a king", "water", "the sun"] }
```

---

## Testing

148 tests across 18 test files using **Vitest** with `@testing-library/react`:

```bash
# Run all tests
npm test

# Run with verbose output
npx vitest run --reporter=verbose

# Run a specific test file
npx vitest run src/__tests__/quiz-view.test.tsx
```

### Test Coverage

| Area | Files | Tests |
|------|-------|-------|
| **Transliteration** | `transliteration.test.ts` | IAST/Devanagari/SLP1 conversion |
| **Sandhi** | `sandhi.test.ts` | Sandhi type extraction |
| **Samasa** | `samasa.test.ts` | Compound decomposition |
| **Morphology** | `morphology.test.ts` | INRIA stem validation |
| **Dictionary** | `dictionary.test.ts`, `stem-index.test.ts` | Headword/stem lookup |
| **Meanings** | `meanings.test.ts` | MW/Apte enrichment |
| **OCR** | `ocr.test.ts`, `ocr-api.test.ts` | Tesseract.js extraction |
| **Vocabulary** | `vocabulary.test.ts` | Particle filtering, dedup |
| **Quiz** | `quiz.test.ts` | Question generation, distractors |
| **Components** | `quiz-view.test.tsx`, `word-breakdown.test.tsx`, `vocabulary-list.test.tsx`, `text-input.test.tsx`, `image-upload.test.tsx` | UI interactions, gamification |
| **App Shell** | `app-shell.test.ts` | Layout, header, metadata |

---

## Project Structure

```
sanskrit-analyzer/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── AnalysisView.tsx      # Main orchestrator (tabs, sticky bar, progress)
│   │   │   ├── WordBreakdown.tsx      # Word card (morphology, sandhi, meanings)
│   │   │   ├── MeaningBadge.tsx       # Colored dot source indicator
│   │   │   ├── QuizView.tsx           # Gamified quiz (hearts, XP, confetti)
│   │   │   ├── VocabularyList.tsx     # Filtered vocabulary cards
│   │   │   └── ImageUpload.tsx        # Drag-drop OCR upload
│   │   ├── api/
│   │   │   ├── analyze/route.ts       # POST — full analysis pipeline
│   │   │   ├── ocr/route.ts           # POST — Tesseract.js extraction
│   │   │   ├── dictionary/route.ts    # GET — dictionary lookup
│   │   │   └── distractors/route.ts   # GET — random quiz distractors
│   │   ├── layout.tsx                 # Root layout, Shobhika font
│   │   ├── page.tsx                   # Home page (minimal header + AnalysisView)
│   │   └── globals.css                # Design tokens, animations
│   ├── lib/
│   │   ├── analysis/
│   │   │   ├── pipeline.ts            # LLM orchestration (Grok + AI SDK)
│   │   │   ├── prompts.ts             # Sanskrit analysis system prompt
│   │   │   ├── schemas.ts             # Zod validation schemas
│   │   │   ├── types.ts               # TypeScript interfaces
│   │   │   ├── sandhi.ts              # Sandhi type extraction
│   │   │   ├── samasa.ts              # Compound decomposition
│   │   │   ├── morphology.ts          # INRIA stem validation
│   │   │   └── meanings.ts            # MW + Apte enrichment
│   │   ├── dictionary/
│   │   │   ├── db.ts                  # SQLite connection (singleton, WAL, 64MB cache)
│   │   │   ├── lookup.ts             # Headword, stem, FTS search
│   │   │   └── schema.ts             # Table definitions
│   │   ├── study/
│   │   │   ├── vocabulary.ts          # Vocabulary extraction + particle filter
│   │   │   ├── quiz.ts               # MCQ generation + distractor logic
│   │   │   ├── particles.ts          # Common avyaya word list
│   │   │   └── types.ts              # VocabularyWord, QuizQuestion types
│   │   ├── transliteration.ts        # IAST/Devanagari/SLP1 conversion
│   │   └── fonts.ts                  # Shobhika font loader
│   └── __tests__/                    # 18 test files, 148 tests
├── data/
│   ├── cdsl/                         # Source XML (MW, AP90, INRIA morph)
│   └── sanskrit.db                   # Compiled SQLite (591MB)
├── public/fonts/shobhika/            # Shobhika OTF (Regular, Bold)
├── scripts/                          # Data import & build scripts
├── next.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Server/client components, API routes |
| **UI** | React 19 | Component rendering |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with custom theme |
| **Language** | TypeScript 5.8 | Type safety throughout |
| **LLM** | Grok via `@ai-sdk/xai` | Sanskrit grammatical analysis |
| **AI SDK** | Vercel AI SDK 6 | Structured output with Zod schemas |
| **Database** | SQLite via `better-sqlite3` | Dictionary & stem index (591MB) |
| **OCR** | Tesseract.js 7 | Local Devanagari text extraction |
| **Transliteration** | `@indic-transliteration/sanscript` | IAST/Devanagari/SLP1 conversion |
| **Validation** | Zod 4 | Runtime schema validation for LLM output |
| **Testing** | Vitest 4 + Testing Library | 148 tests across 18 files |
| **Font** | Shobhika | Academic Devanagari typography |

---

<p align="center">
  <sub>Built for Sanskrit scholars, students, and anyone curious about the language of the ancients.</sub>
</p>
