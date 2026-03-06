# Architecture Patterns

**Domain:** Sanskrit text analysis web application
**Researched:** 2026-03-06

## Recommended Architecture

A **pipeline-oriented monolith** within Next.js App Router. The app is a linear processing pipeline (image -> text -> analysis -> display -> quiz) with no persistent user state, making it ideal for a single Next.js deployment with Server Actions handling each pipeline stage. No separate backend service needed.

```
+------------------+     +------------------+     +-------------------------+
|   Next.js Client |     |  Next.js Server  |     |    External Services    |
|                  |     |  (Server Actions) |     |                         |
|  Image Capture/  |---->|  Upload Handler   |---->|  xAI Grok Vision API    |
|  Upload UI       |     |                  |     |  (OCR)                  |
|                  |     |  Analysis         |---->|  xAI Grok Chat API      |
|  Results Display |<----|  Pipeline         |     |  (morphological/context)|
|                  |     |  Orchestrator     |---->|  C-SALT REST API        |
|  Quiz UI         |<----|                  |     |  (Monier-Williams/Apte) |
|                  |     |  Quiz Generator   |     |                         |
+------------------+     +------------------+     +-------------------------+
                                |
                          +-----+------+
                          | In-Process |
                          | Libraries  |
                          |            |
                          | sanscript  |
                          | (IAST)     |
                          +------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Runs On |
|-----------|---------------|-------------------|---------|
| **Image Input UI** | Camera capture, file upload, image preview, crop | Upload Handler (via Server Action) | Client |
| **Upload Handler** | Validate image (format, size), convert to base64 | Grok Vision API | Server |
| **OCR Service** | Send image to Grok Vision, extract Devanagari text, post-process | xAI API, Text Normalizer | Server |
| **Text Normalizer** | Clean OCR output, normalize Unicode, handle Devanagari ligatures | Analysis Pipeline | Server |
| **Analysis Pipeline Orchestrator** | Coordinate sandhi splitting, samasa decomposition, morphological analysis in sequence | All analysis sub-components | Server |
| **Sandhi Splitter** | Split compound words at sandhi junctions (vowel, consonant, visarga) | Grok Chat API (with structured prompts) | Server |
| **Samasa Decomposer** | Decompose compounds, classify type (tatpurusha, dvandva, etc.) | Grok Chat API | Server |
| **Morphological Analyzer** | Identify vibhakti, vacana, dhatu, gana for each word | Grok Chat API | Server |
| **Dictionary Lookup** | Fetch MW/Apte definitions for each unique word | C-SALT REST API | Server |
| **Contextual Meaning** | Generate context-aware meanings using LLM | Grok Chat API | Server |
| **Transliterator** | Convert Devanagari to IAST | sanscript library (in-process) | Server/Client |
| **Word Extractor** | Deduplicate words, filter sentence framers (ca, va, tu, etc.) | Analysis results | Server |
| **Results Display** | Render analyzed text with expandable word cards | Analysis data (props/state) | Client |
| **Quiz Generator** | Create MCQ options from analyzed vocabulary | Word analysis results | Server |
| **Quiz UI** | Interactive quiz with scoring | Quiz data (props/state) | Client |

### Data Flow

The system is a strictly linear pipeline with one branching point (dictionary + contextual meaning in parallel):

```
1. IMAGE INPUT
   User uploads/captures image (JPEG/PNG, max 20MB for Grok API)
        |
        v
2. OCR EXTRACTION
   Image -> base64 -> Grok Vision API -> raw Devanagari text
   Post-process: normalize Unicode, fix common OCR errors
        |
        v
3. TEXT NORMALIZATION
   Raw text -> sentence segmentation -> Unicode normalization (NFC)
   Remove artifacts, normalize visarga/anusvara variants
        |
        v
4. SANDHI SPLITTING (sequential, must happen before morphology)
   Normalized text -> Grok with Paninian sandhi rules prompt
   Output: array of split word tokens
   Example: "narapatih" -> ["nara", "patih"]
        |
        v
5. SAMASA DECOMPOSITION (sequential, after sandhi)
   Each token -> check if compound -> recursive decomposition
   Output: compound tree with type labels
   Example: "narapatih" -> {type: "tatpurusha", parts: ["nara", "pati"]}
        |
        v
6. MORPHOLOGICAL ANALYSIS (per word, parallelizable across words)
   Each base word ->
     - vibhakti (case): prathamA, dvitIyA, etc.
     - vacana (number): ekavacana, dvivacana, bahuvacana
     - dhatu (root): with gana classification
   Output: morphological tag per word
        |
        +---> 7a. DICTIONARY LOOKUP (parallel with 7b)
        |     Each unique word -> C-SALT REST API (MW + Apte)
        |     Fallback: search by dhatu root if inflected form not found
        |
        +---> 7b. CONTEXTUAL MEANING (parallel with 7a)
        |     Full sentence + individual word -> Grok Chat API
        |     Prompt: "Given this Sanskrit sentence, what does [word] mean in context?"
        |
        v
8. WORD EXTRACTION & FILTERING
   Merge dictionary + contextual meanings
   Filter common framers: ca, va, tu, hi, eva, api, iti, atha, tatha, yatha
   Deduplicate
        |
        v
9. IAST TRANSLITERATION (pure transformation, no API call)
   Each Devanagari word -> IAST using sanscript library
   Runs in-process, no external dependency
        |
        v
10. RESULTS ASSEMBLY
    Combine: original text + split words + morphology + meanings + IAST
    Structure as JSON for client rendering
        |
        +---> 11a. RESULTS DISPLAY (immediate)
        |     Render word cards with expandable details
        |
        +---> 11b. QUIZ GENERATION (on demand)
              Select N words -> generate 4 MCQ options each
              Distractors from: other words in text + dictionary neighbors
```

### Central Data Structure

All components read/write to a shared analysis result object. This is the contract between pipeline stages:

```typescript
interface AnalysisResult {
  originalText: string;                    // Raw Devanagari from OCR
  normalizedText: string;                  // After Unicode normalization
  sentences: SentenceAnalysis[];
}

interface SentenceAnalysis {
  devanagari: string;                      // Original sentence
  iast: string;                            // Full sentence in IAST
  words: WordAnalysis[];
}

interface WordAnalysis {
  devanagari: string;                      // Word in Devanagari
  iast: string;                            // IAST transliteration
  isFramer: boolean;                       // true for ca, va, tu, etc.

  // Sandhi & Samasa
  sandhiComponents?: string[];             // If split from sandhi
  samasa?: SamasaAnalysis;                 // If compound word

  // Morphology
  morphology: {
    vibhakti?: string;                     // Case (prathamA through saptamI)
    vacana?: string;                       // Number
    linga?: string;                        // Gender
    dhatu?: string;                        // Verbal root
    gana?: number;                         // Dhatu gana (1-10)
    prayoga?: string;                      // Voice (kartari, karmani)
    lakara?: string;                       // Tense/mood
    purusha?: string;                      // Person
    pada?: string;                         // Word class (subanta/tiganta)
  };

  // Meanings
  dictionary: {
    monierWilliams?: string;
    apte?: string;
  };
  contextualMeaning?: string;              // LLM-generated contextual meaning
}

interface SamasaAnalysis {
  type: string;                            // tatpurusha, dvandva, etc.
  components: (string | SamasaAnalysis)[]; // Recursive for nested compounds
}

interface QuizQuestion {
  word: WordAnalysis;
  correctMeaning: string;
  distractors: string[];
}
```

## Patterns to Follow

### Pattern 1: LLM-as-Analyst with Structured Output

**What:** Use Grok Chat API with carefully engineered prompts and JSON mode for all linguistic analysis (sandhi, samasa, morphology). The LLM replaces what would traditionally be rule-based engines or trained ML models.

**When:** For all morphological analysis tasks. Sanskrit's complexity makes rule-based systems extremely hard to build from scratch, and existing tools (Sanskrit Heritage, Samsaadhanii) are research projects not designed as APIs. Grok with strong prompts is the pragmatic choice.

**Why this over dedicated NLP tools:** The Sanskrit Heritage Engine (Inria) and Samsaadhanii (Hyderabad) exist but are web-scraped interfaces, not stable APIs. They have no SLAs, may go down, and would add fragile HTTP scraping as a dependency. A well-prompted LLM with Paninian grammar context will be more reliable for a production app, and can handle all analysis tasks uniformly.

**Example:**
```typescript
// Server Action: sandhi splitting
async function splitSandhi(text: string): Promise<SandhiResult> {
  const response = await grokChat({
    model: "grok-4-1-fast-reasoning",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a Sanskrit grammar expert following Paninian rules.
Split the given Sanskrit text at sandhi junctions.
Rules: vowel sandhi (a+i=e), consonant sandhi, visarga sandhi.
Return JSON: { "splits": [{ "original": "...", "parts": ["...", "..."], "rule": "..." }] }`
      },
      { role: "user", content: text }
    ]
  });
  return JSON.parse(response.content);
}
```

### Pattern 2: Progressive Disclosure UI

**What:** Show results in layers -- sentence overview first, click to expand word details, click further for full morphological breakdown.

**When:** Always for the results display. Sanskrit analysis produces dense data per word (5-10 fields). Showing everything at once overwhelms.

**Structure:**
```
Level 0: Full text with highlighted words
Level 1: Word card (Devanagari | IAST | primary meaning)
Level 2: Expanded card (morphology table, compound tree, all meanings)
```

### Pattern 3: Pipeline Stage Caching

**What:** Cache intermediate results by content hash so re-analyzing similar text reuses work. Use a simple in-memory LRU cache (no database needed since there is no persistence requirement).

**When:** OCR results, dictionary lookups, and transliteration are deterministic or near-deterministic. Cache them.

**Example:**
```typescript
import { LRUCache } from "lru-cache";

const dictionaryCache = new LRUCache<string, DictEntry>({
  max: 5000,           // 5000 unique words
  ttl: 1000 * 60 * 60, // 1 hour
});

async function lookupWord(word: string): Promise<DictEntry> {
  const cached = dictionaryCache.get(word);
  if (cached) return cached;

  const entry = await fetchFromCSALT(word);
  dictionaryCache.set(word, entry);
  return entry;
}
```

### Pattern 4: Server Action Pipeline with Streaming

**What:** Use Next.js Server Actions for the analysis pipeline. Stream partial results back to the client as each stage completes rather than waiting for the full pipeline.

**When:** The full pipeline (OCR -> analysis -> dictionary -> meaning) may take 10-30 seconds. Users should see progress.

**Implementation:** Use React Server Components with Suspense boundaries around each pipeline stage. The OCR result appears first, then word splits stream in, then morphology, then meanings.

```typescript
// Streaming approach with experimental streamUI or progressive loading
// Each stage updates client state as it completes
export async function analyzeText(formData: FormData) {
  "use server";

  const image = formData.get("image") as File;
  const ocrResult = await extractText(image);      // Stage 1: appears immediately
  const splits = await splitSandhi(ocrResult);      // Stage 2: updates UI
  const morphology = await analyzeMorphology(splits); // Stage 3: updates UI
  const [dict, context] = await Promise.all([       // Stage 4: parallel
    lookupDictionary(morphology),
    getContextualMeanings(morphology, ocrResult),
  ]);
  return assembleResults(ocrResult, splits, morphology, dict, context);
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Building a Rule-Based Sandhi Engine from Scratch

**What:** Attempting to implement all Paninian sandhi rules as code.

**Why bad:** Sanskrit has hundreds of sandhi rules with exceptions, optional applications, and context-dependent variants. This is a multi-year academic project (the Sanskrit Heritage Engine took decades). You will never reach the accuracy of a well-prompted modern LLM within a reasonable timeframe.

**Instead:** Use Grok with structured prompts and JSON output. Validate results against known examples. Supplement with the sanscript library for pure transliteration (which IS deterministic and rule-based).

### Anti-Pattern 2: Synchronous Full-Pipeline Blocking

**What:** Making the user wait for the entire analysis pipeline (potentially 15-30 seconds) before showing any results.

**Why bad:** Users will think the app is broken. OCR alone takes 3-5 seconds, then analysis adds more.

**Instead:** Stream results progressively. Show OCR text immediately, then populate analysis as it completes. Use loading skeletons for pending sections.

### Anti-Pattern 3: Separate Backend Service

**What:** Building a separate Express/FastAPI backend for the analysis pipeline.

**Why bad:** Unnecessary complexity for this app. There is no persistent state, no authentication, no need for a separate service. Next.js Server Actions and Route Handlers can do everything. Adding a separate backend means two deployments, two Fly.io machines, CORS configuration, and doubled operational complexity.

**Instead:** Keep everything in Next.js. Server Actions for mutations (upload, analyze), Route Handlers for any REST-like endpoints (if needed for quiz API). Deploy as a single Fly.io app.

### Anti-Pattern 4: Storing Images Permanently

**What:** Uploading images to S3/cloud storage for later retrieval.

**Why bad:** The app has no user accounts and no persistent state. Images are processed once and discarded. Storing them adds cost, privacy concerns, and infrastructure.

**Instead:** Process images in memory. Accept the upload, base64-encode for Grok API, discard after OCR completes.

## Component Dependency Graph and Build Order

This defines what must be built before what:

```
Phase 1: Foundation (no external dependencies between these)
  [Image Input UI] -- standalone, needs no other component
  [Transliterator]  -- standalone, sanscript library wrapping
  [Text Normalizer] -- standalone utility

Phase 2: OCR Pipeline (requires Phase 1)
  [Upload Handler] -- depends on Image Input UI
  [OCR Service]    -- depends on Upload Handler + Grok API setup
  * At this point you have: image -> extracted text

Phase 3: Core Analysis (requires Phase 2 for input, but components are independent of each other)
  [Sandhi Splitter]       -- depends on OCR output
  [Samasa Decomposer]     -- depends on Sandhi Splitter output (sequential)
  [Morphological Analyzer]-- depends on Samasa Decomposer output (sequential)
  * These three are sequential within the pipeline but can be developed in parallel

Phase 4: Meaning Layer (requires Phase 3 for word list)
  [Dictionary Lookup]   -- depends on word list, calls C-SALT API
  [Contextual Meaning]  -- depends on word list + sentence context, calls Grok
  [Word Extractor]      -- depends on all analysis results
  * Dictionary and Contextual can be developed/called in parallel

Phase 5: Display & Polish (requires Phase 4 for data)
  [Results Display] -- depends on full analysis data structure
  [Results Assembly]-- depends on all prior stages

Phase 6: Quiz (requires Phase 5, but could start earlier with mock data)
  [Quiz Generator] -- depends on word analysis results
  [Quiz UI]        -- depends on Quiz Generator
```

**Key dependency chain:** Image Input -> OCR -> Sandhi -> Samasa -> Morphology -> Dictionary+Context -> Display -> Quiz

**Parallelism opportunities:**
- Dictionary Lookup and Contextual Meaning run in parallel (Promise.all)
- Multiple word analyses can run concurrently (Promise.all per word)
- Transliteration is a pure function, can run at any point
- Quiz development can proceed with mock word data before analysis pipeline is complete

## Scalability Considerations

| Concern | At 10 users/day | At 1K users/day | At 10K users/day |
|---------|-----------------|-----------------|-------------------|
| **Grok API cost** | Negligible (~$0.50/day) | ~$50/day, monitor usage | Rate limiting needed, consider caching common texts |
| **C-SALT API load** | No issue | Cache aggressively, batch requests | May need local MW dictionary copy |
| **Server memory** | Single Fly.io machine | Single machine still fine | Multiple machines, but still stateless |
| **Response time** | 10-20s acceptable | Same, streaming helps | Pre-process common texts, edge caching |
| **Image processing** | In-memory fine | In-memory fine | Consider queue if Grok API rate-limits |

**Critical note on C-SALT API:** This is a university-hosted research API with no SLA. At any meaningful scale, download the Monier-Williams dictionary data (available from the [Sanskrit Lexicon GitHub](https://github.com/sanskrit-lexicon)) and serve it locally. The data is open-access XML. This eliminates the external dependency for dictionary lookup entirely.

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| LLM for all morphological analysis | Building rule-based Sanskrit NLP is a multi-year effort; Grok with structured prompts is pragmatic and sufficiently accurate for v1 |
| Single Next.js deployment | No persistent state, no auth, no reason for microservices |
| In-memory processing only | No database needed; images processed and discarded |
| C-SALT API for dictionary with local fallback plan | Start with API, plan to bundle MW data locally if API becomes unreliable |
| sanscript library for transliteration | IAST conversion is deterministic and well-solved; no LLM needed |
| OpenAI SDK for Grok | xAI API is OpenAI-compatible; use the established `openai` npm package with custom base URL |
| Progressive streaming UI | Pipeline takes 10-30s; must show incremental results |

## Sources

- [xAI Image Understanding Docs](https://docs.x.ai/docs/guides/image-understanding) - Grok Vision API format, limits, OpenAI compatibility
- [xAI API Overview](https://docs.x.ai/overview) - Models, pricing, capabilities
- [C-SALT Sanskrit Dictionary APIs](https://cceh.github.io/c-salt_sanskrit_data/) - REST/GraphQL endpoints for MW and Apte
- [Sanskrit Heritage Engine](https://sanskrit.inria.fr/) - Reference for Sanskrit NLP tools (not used as dependency, but informs analysis approach)
- [@indic-transliteration/sanscript](https://www.npmjs.com/package/@indic-transliteration/sanscript) - IAST transliteration library
- [Sanskrit Lexicon GitHub](https://github.com/sanskrit-lexicon) - Open-access dictionary data for local bundling
- [ByT5-Sanskrit](https://arxiv.org/html/2409.13920v1) - State of the art in Sanskrit NLP (context for what is possible)
- [ACM Survey on Sanskrit Computational Linguistics](https://dl.acm.org/doi/pdf/10.1145/3729530) - Comprehensive survey of the field
