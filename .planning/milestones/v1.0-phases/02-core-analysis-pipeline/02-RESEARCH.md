# Phase 2: Core Analysis Pipeline - Research

**Researched:** 2026-03-08
**Domain:** Sanskrit NLP (sandhi, samasa, morphology) + LLM-powered analysis + dictionary integration
**Confidence:** MEDIUM

## Summary

Phase 2 is the core intellectual challenge of this project: building a Sanskrit text analysis pipeline that performs sandhi splitting, samasa (compound) decomposition, morphological analysis, and hybrid dictionary+LLM meaning generation. No production-quality JavaScript/TypeScript libraries exist for Sanskrit NLP -- this domain is dominated by Python tools and academic web services. The practical approach is an **LLM-first architecture**: use Grok models via the Vercel AI SDK to perform sandhi splitting, compound decomposition, and morphological tagging via carefully engineered prompts with structured output, then **validate and enrich** results against the existing INRIA stem index and MW/Apte dictionary infrastructure built in Phase 1.

The INRIA stem index (1.9M entries with grammar_info like "nom.sg.m") already provides vibhakti/vacana/linga data for known inflected forms. The dictionary infrastructure provides MW and Apte definitions. The LLM fills the gaps: sandhi junction identification, compound decomposition with type classification, dhatu/gana extraction, and contextual meaning generation. Dictionary-sourced vs LLM-generated meanings must be visually distinguished per MEAN-04.

**Primary recommendation:** Use Grok via `@ai-sdk/xai` with `generateText` + `Output.object()` for structured Sanskrit analysis, validate against INRIA stem index and dictionaries, and build a word-by-word breakdown React component displaying all analysis properties.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANAL-01 | Sandhi splitting (vowel, consonant, visarga) | LLM-based splitting with sandhi rule validation; structured output schema defines split points |
| ANAL-02 | Vibhakti, vacana, linga identification | INRIA stem index provides grammar_info (e.g. "nom.sg.m"); LLM fills gaps for unindexed forms |
| ANAL-03 | Samasa decomposition with type classification | LLM analysis with structured output specifying compound type enum |
| ANAL-04 | Dhatu extraction with gana classification | LLM analysis; no existing local data for dhatu/gana -- LLM is primary source |
| MEAN-01 | Monier-Williams dictionary definitions | Already built in Phase 1 -- `lookupByHeadword` and `lookupByStem` |
| MEAN-02 | Apte dictionary definitions | Already built in Phase 1 -- same lookup functions, AP90 dictionary |
| MEAN-03 | LLM-contextual meaning for polysemous words | Grok generates contextual meaning given passage context |
| MEAN-04 | Distinguish dictionary vs AI meanings | UI labeling pattern -- "Dictionary" badge vs "AI Interpretation" badge |
| UI-02 | Word-by-word breakdown view | React component displaying all analysis properties per word |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.x | Vercel AI SDK core -- `generateText`, `Output.object()` | De facto standard for LLM integration in Next.js; unified structured output API |
| `@ai-sdk/xai` | ^3.x | xAI Grok provider for AI SDK | Official provider; OpenAI-compatible API; structured output support |
| `zod` | ^3.x | Schema validation for structured LLM output | Required by AI SDK for `Output.object()` schema definition |

### Already Available (from Phase 1)
| Library | Purpose | How Phase 2 Uses It |
|---------|---------|---------------------|
| `better-sqlite3` | SQLite dictionary access | Stem index lookups for morphological validation |
| `@indic-transliteration/sanscript` | Script conversion | SLP1/IAST/Devanagari conversion for dictionary matching |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LLM-based sandhi splitting | Rule-based engine (hand-coded) | Rule-based is more deterministic but requires implementing ~50+ sandhi rules, handling exceptions, and building a tokenizer -- massive effort for marginal accuracy gain over a well-prompted LLM |
| LLM-based samasa decomposition | Sanskrit Heritage INRIA web API | External dependency, latency, rate limits, no offline capability; LLM provides comparable results with structured output |
| `openai` npm package directly | `@ai-sdk/xai` via AI SDK | xAI API is OpenAI-compatible, but AI SDK provides better Next.js integration, streaming, and unified structured output |

**Installation:**
```bash
npm install ai @ai-sdk/xai zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    analysis/
      pipeline.ts          # Main analysis orchestrator
      schemas.ts           # Zod schemas for LLM structured output
      sandhi.ts            # Sandhi splitting logic + validation
      morphology.ts        # Morphological analysis (INRIA + LLM)
      samasa.ts            # Compound decomposition
      meanings.ts          # Hybrid dictionary + LLM meanings
      prompts.ts           # LLM prompt templates
      types.ts             # Shared TypeScript types for analysis results
    dictionary/            # (existing from Phase 1)
      db.ts
      lookup.ts
      schema.ts
  app/
    api/
      analyze/
        route.ts           # POST /api/analyze -- main analysis endpoint
    components/
      WordBreakdown.tsx    # Word-by-word analysis display
      AnalysisView.tsx     # Full analysis results container
      MeaningBadge.tsx     # Dictionary vs AI meaning distinction
```

### Pattern 1: LLM-First Analysis Pipeline
**What:** Send Sanskrit text to Grok with a structured output schema, then validate/enrich results with local data (INRIA stem index, dictionaries).
**When to use:** All analysis requests.
**Why:** No local Sanskrit NLP engine exists in JS/TS. LLMs have strong Sanskrit knowledge from training data. Structured output guarantees parseable results. Local validation catches hallucinations.

```typescript
// src/lib/analysis/schemas.ts
import { z } from 'zod';

export const SandhiSplitSchema = z.object({
  original: z.string().describe('Original sandhi-joined text'),
  words: z.array(z.object({
    word: z.string().describe('Individual word after sandhi splitting, in Devanagari'),
    iast: z.string().describe('IAST transliteration of the word'),
    sandhi_type: z.enum(['vowel', 'consonant', 'visarga', 'none'])
      .describe('Type of sandhi that joined this word to the next'),
    sandhi_rule: z.string().optional()
      .describe('Specific sandhi rule applied, e.g. "a + i -> e"'),
  })),
});

export const SamasaSchema = z.object({
  compound: z.string(),
  is_compound: z.boolean(),
  samasa_type: z.enum([
    'tatpurusha', 'dvandva', 'bahuvrihi',
    'avyayibhava', 'karmadharaya', 'dvigu', 'none'
  ]).optional(),
  components: z.array(z.object({
    word: z.string(),
    iast: z.string(),
    meaning: z.string(),
    role: z.string().describe('Role in compound, e.g. "qualifier", "qualified"'),
  })).optional(),
});

export const MorphologySchema = z.object({
  word: z.string(),
  iast: z.string(),
  stem: z.string().describe('Base stem/pratipadika'),
  word_type: z.enum(['noun', 'verb', 'adjective', 'indeclinable', 'participle', 'pronoun']),
  vibhakti: z.string().optional().describe('Case: prathama, dvitiya, etc.'),
  vacana: z.enum(['ekavacana', 'dvivacana', 'bahuvacana']).optional(),
  linga: z.enum(['pullinga', 'strilinga', 'napumsakalinga']).optional(),
  dhatu: z.string().optional().describe('Verbal root for verb forms'),
  gana: z.number().min(1).max(10).optional().describe('Verb class 1-10'),
  lakara: z.string().optional().describe('Tense/mood for verb forms'),
  purusha: z.string().optional().describe('Person for verb forms'),
});

export const FullAnalysisSchema = z.object({
  input_text: z.string(),
  words: z.array(z.object({
    original: z.string(),
    iast: z.string(),
    sandhi_type: z.enum(['vowel', 'consonant', 'visarga', 'none']),
    is_compound: z.boolean(),
    samasa: SamasaSchema.optional(),
    morphology: MorphologySchema,
    contextual_meaning: z.string()
      .describe('Meaning of this word in context of the full passage'),
  })),
});
```

### Pattern 2: Validate-and-Enrich with Local Data
**What:** After LLM analysis, cross-reference each word against the INRIA stem index and dictionary to validate morphological claims and add dictionary definitions.
**When to use:** Post-LLM-analysis enrichment step.

```typescript
// src/lib/analysis/morphology.ts
import { lookupByStem } from '@/lib/dictionary/lookup';
import type { StemIndexEntry } from '@/lib/dictionary/schema';

interface EnrichedWord {
  // From LLM
  llm_morphology: { vibhakti?: string; vacana?: string; linga?: string; };
  // From INRIA stem index (validated)
  inria_grammar: string | null;       // e.g. "nom.sg.m"
  inria_validated: boolean;
  // From dictionaries
  mw_definitions: string[];
  apte_definitions: string[];
  // Contextual (from LLM)
  contextual_meaning: string;
  meaning_source: 'dictionary' | 'ai' | 'both';
}

export function enrichWithLocalData(
  word: string,
  llmResult: Record<string, unknown>
): EnrichedWord {
  // 1. Look up in INRIA stem index
  const stemResult = lookupByStem(word, 'iast');
  const inriaMatch = stemResult.stems.length > 0;

  // 2. Extract dictionary definitions
  const mwDefs = stemResult.entries
    .filter(e => e.dictionary === 'mw')
    .map(e => e.definition);
  const apteDefs = stemResult.entries
    .filter(e => e.dictionary === 'ap90')
    .map(e => e.definition);

  // 3. Determine meaning source
  const hasDictDef = mwDefs.length > 0 || apteDefs.length > 0;

  return {
    llm_morphology: llmResult as any,
    inria_grammar: inriaMatch ? stemResult.stems[0].grammar_info : null,
    inria_validated: inriaMatch,
    mw_definitions: mwDefs,
    apte_definitions: apteDefs,
    contextual_meaning: (llmResult as any).contextual_meaning || '',
    meaning_source: hasDictDef ? 'both' : 'ai',
  };
}
```

### Pattern 3: API Route with Streaming Analysis
**What:** POST endpoint that receives Sanskrit text and returns structured analysis.
**When to use:** Main analysis endpoint.

```typescript
// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { xai } from '@ai-sdk/xai';
import { FullAnalysisSchema } from '@/lib/analysis/schemas';

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const { output } = await generateText({
    model: xai('grok-3-mini'),  // Cost-effective for analysis
    output: Output.object({ schema: FullAnalysisSchema }),
    prompt: buildAnalysisPrompt(text),
  });

  // Enrich with local data...
  // Return combined result
}
```

### Anti-Patterns to Avoid
- **Separate LLM calls per word:** Batch the entire passage in one call. Multiple calls multiply latency and cost. Use a single structured output schema that returns all words at once.
- **Trusting LLM morphology without validation:** Always cross-reference against INRIA stem index. LLMs can hallucinate vibhakti/linga assignments. If INRIA disagrees, prefer INRIA for known forms.
- **Mixing dictionary and AI meanings without labeling:** MEAN-04 requires clear visual distinction. Never blend them into a single text field.
- **Client-side LLM calls:** Always use server-side API routes (Next.js Route Handlers) to keep API keys secure and enable caching.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured LLM output parsing | Custom JSON extraction from free text | `Output.object()` with Zod schema | Guaranteed schema compliance, no regex parsing |
| Sanskrit script conversion | Custom transliteration maps | `@indic-transliteration/sanscript` (already installed) | Handles all edge cases, battle-tested |
| Sandhi rule engine | 50+ hand-coded sandhi rules | LLM with structured output + validation | Rules have many exceptions; LLM handles context better |
| Inflection-to-stem resolution | Custom morphological analyzer | INRIA stem index in SQLite (already built) | 1.9M pre-computed mappings cover vast majority of forms |

**Key insight:** Sanskrit NLP is an active research area with no single correct solution. An LLM-first approach with local validation gives the best accuracy-to-effort ratio for a web application, while academic tools aim for exhaustive linguistic correctness at the cost of complexity.

## Common Pitfalls

### Pitfall 1: LLM Sandhi Splitting Inconsistency
**What goes wrong:** LLM may split the same compound differently across calls, or miss rare sandhi junctions.
**Why it happens:** LLMs are probabilistic; Sanskrit sandhi has ambiguous cases (e.g., "naro" could be "naraH + u" or "naraH + o").
**How to avoid:** Use low temperature (0.1-0.2) for deterministic output. Provide sandhi rule examples in the prompt. Validate splits against INRIA stem index -- if a proposed word doesn't appear as a known inflected form, flag it.
**Warning signs:** Words that don't resolve in the stem index after splitting.

### Pitfall 2: Compound Type Misclassification
**What goes wrong:** LLM labels a bahuvrihi as tatpurusha or vice versa.
**Why it happens:** Compound type determination often requires semantic understanding of context. Even human scholars disagree.
**How to avoid:** Include clear definitions and examples of each samasa type in the prompt. Accept that some classifications will be approximate. Display compound type as informational, not authoritative.
**Warning signs:** All compounds classified as the same type (usually tatpurusha, the most common).

### Pitfall 3: Dhatu/Gana Hallucination
**What goes wrong:** LLM invents a dhatu that doesn't exist or assigns wrong gana.
**Why it happens:** Verbal root identification requires deep grammatical knowledge. LLMs may confuse similar-sounding roots.
**How to avoid:** Cross-reference dhatu claims against dictionary entries where possible. Consider a lightweight dhatu reference table (the ~2000 Sanskrit verbal roots are finite and enumerable).
**Warning signs:** Unusual gana assignments (e.g., gana 8 or 10 for common verbs that are clearly gana 1).

### Pitfall 4: API Key Exposure
**What goes wrong:** xAI API key leaks to client bundle.
**Why it happens:** Importing LLM code in client components.
**How to avoid:** All LLM calls in Route Handlers only. Use `XAI_API_KEY` environment variable. Never import `ai` or `@ai-sdk/xai` in files under `'use client'`.
**Warning signs:** API key visible in browser network tab or bundle.

### Pitfall 5: Token Cost Explosion
**What goes wrong:** Sending entire texts with verbose prompts multiplies API costs.
**Why it happens:** Long system prompts with extensive examples + long Sanskrit passages.
**How to avoid:** Use `grok-3-mini` ($0.30/$0.50 per million tokens) for analysis tasks -- it's 10x cheaper than `grok-3`. Keep prompts concise. Cache results for identical input text.
**Warning signs:** API bills growing faster than expected.

### Pitfall 6: AI SDK Version Confusion
**What goes wrong:** Using deprecated `generateObject` from AI SDK 5.x patterns.
**Why it happens:** Most tutorials and examples online still show the old API.
**How to avoid:** Use AI SDK 6.x patterns: `generateText` with `Output.object()`. The `generateObject` function still works but is deprecated and will be removed.
**Warning signs:** Import warnings about deprecated functions.

## Code Examples

### LLM Analysis Prompt Template
```typescript
// src/lib/analysis/prompts.ts

export function buildAnalysisPrompt(text: string): string {
  return `You are an expert Sanskrit grammarian (vaiyakarana). Analyze the following Sanskrit text.

INPUT TEXT (Devanagari): ${text}

Perform these analyses:

1. SANDHI SPLITTING: Split all sandhi junctions. Identify the type (vowel/consonant/visarga) and the specific rule applied.
   - Vowel sandhi: a+i=e, a+u=o, a+a=aa, i+vowel=y+vowel, etc.
   - Consonant sandhi: final stop + initial consonant transformations
   - Visarga sandhi: aH before vowels/voiced consonants/sibilants

2. SAMASA DECOMPOSITION: For each compound word, decompose it and classify:
   - tatpurusha (determinative), dvandva (copulative), bahuvrihi (possessive)
   - avyayibhava (adverbial), karmadharaya (descriptive), dvigu (numerical)

3. MORPHOLOGICAL ANALYSIS: For each word provide:
   - stem (pratipadika for nominals, dhatu for verbs)
   - For nominals: vibhakti (case), vacana (number), linga (gender)
   - For verbs: dhatu, gana (1-10), lakara (tense/mood), purusha, vacana

4. CONTEXTUAL MEANING: Provide the meaning of each word as used in THIS specific passage context.

Use standard Sanskrit grammatical terminology. Provide IAST transliteration for all Sanskrit terms.`;
}
```

### Structured Analysis Call
```typescript
// src/lib/analysis/pipeline.ts
import { generateText, Output } from 'ai';
import { xai } from '@ai-sdk/xai';
import { FullAnalysisSchema } from './schemas';
import { buildAnalysisPrompt } from './prompts';
import { lookupByStem } from '@/lib/dictionary/lookup';

export interface AnalysisResult {
  words: EnrichedWord[];
  raw_llm_output: z.infer<typeof FullAnalysisSchema>;
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  // Step 1: LLM analysis with structured output
  const { output } = await generateText({
    model: xai('grok-3-mini'),
    output: Output.object({ schema: FullAnalysisSchema }),
    prompt: buildAnalysisPrompt(text),
    providerOptions: {
      xai: { reasoningEffort: 'high' },
    },
  });

  if (!output) {
    throw new Error('Failed to generate analysis');
  }

  // Step 2: Enrich each word with local data
  const enrichedWords = output.words.map(word => {
    const stemResult = lookupByStem(word.iast, 'iast');

    const mwDefs = stemResult.entries
      .filter(e => e.dictionary === 'mw')
      .map(e => e.definition);
    const apteDefs = stemResult.entries
      .filter(e => e.dictionary === 'ap90')
      .map(e => e.definition);

    return {
      ...word,
      inria_grammar: stemResult.stems[0]?.grammar_info || null,
      inria_validated: stemResult.stems.length > 0,
      mw_definitions: mwDefs,
      apte_definitions: apteDefs,
      meaning_source: (mwDefs.length > 0 || apteDefs.length > 0) ? 'both' : 'ai',
    };
  });

  return { words: enrichedWords, raw_llm_output: output };
}
```

### Word Breakdown Component Pattern
```tsx
// src/app/components/WordBreakdown.tsx
'use client';

interface WordData {
  original: string;
  iast: string;
  sandhi_type: string;
  morphology: {
    stem: string;
    vibhakti?: string;
    vacana?: string;
    linga?: string;
    dhatu?: string;
    gana?: number;
  };
  mw_definitions: string[];
  apte_definitions: string[];
  contextual_meaning: string;
  meaning_source: 'dictionary' | 'ai' | 'both';
  is_compound: boolean;
  samasa?: {
    samasa_type: string;
    components: { word: string; meaning: string }[];
  };
}

export function WordBreakdown({ word }: { word: WordData }) {
  return (
    <div className="rounded-lg border border-parchment-200 bg-parchment-50 p-4">
      {/* Word header */}
      <div className="flex items-baseline gap-3">
        <span className="font-sanskrit text-2xl text-ink-900">{word.original}</span>
        <span className="text-sm italic text-ink-600">{word.iast}</span>
      </div>

      {/* Morphology */}
      <div className="mt-3 flex flex-wrap gap-2">
        {word.morphology.vibhakti && (
          <span className="rounded bg-accent-100 px-2 py-0.5 text-xs text-accent-800">
            {word.morphology.vibhakti}
          </span>
        )}
        {/* ... vacana, linga, dhatu badges ... */}
      </div>

      {/* Meanings with source distinction (MEAN-04) */}
      <div className="mt-3 space-y-2">
        {word.mw_definitions.length > 0 && (
          <div>
            <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
              MW Dictionary
            </span>
            <p className="mt-1 text-sm text-ink-700">{word.mw_definitions[0]}</p>
          </div>
        )}
        {word.apte_definitions.length > 0 && (
          <div>
            <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
              Apte Dictionary
            </span>
            <p className="mt-1 text-sm text-ink-700">{word.apte_definitions[0]}</p>
          </div>
        )}
        <div>
          <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            AI Interpretation
          </span>
          <p className="mt-1 text-sm text-ink-700">{word.contextual_meaning}</p>
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject()` standalone | `generateText()` + `Output.object()` | AI SDK 6.0 (late 2025) | Must use new unified API; old still works but deprecated |
| Rule-based Sanskrit NLP only | LLM + rule validation hybrid | 2024-2025 | LLMs handle ambiguity better; rules catch hallucinations |
| OpenAI SDK for xAI | `@ai-sdk/xai` provider | 2025 | Better Next.js integration, structured output, streaming |

**Deprecated/outdated:**
- `generateObject` / `streamObject`: Deprecated in AI SDK 6.x, use `generateText` with `output` parameter
- Direct `openai` npm package for xAI: Works but `@ai-sdk/xai` is preferred for Next.js projects

## Grok Model Selection

| Model | Cost (input/output per 1M tokens) | Context Window | Best For |
|-------|-----|----------------|----------|
| `grok-3-mini` | $0.30 / $0.50 | 131K | Primary analysis -- best cost/quality ratio for structured tasks |
| `grok-3` | $3.00 / $15.00 | 131K | Complex passages where mini struggles |
| `grok-4-1-fast-non-reasoning` | $0.20 / $0.50 | - | Fast structured output; cheapest option if quality sufficient |

**Recommendation:** Start with `grok-3-mini` for all analysis. It supports structured output and reasoning. Only upgrade to `grok-3` if analysis quality is insufficient on complex texts.

## Open Questions

1. **LLM accuracy on Sanskrit sandhi splitting**
   - What we know: LLMs have Sanskrit in training data; structured output guarantees format
   - What's unclear: Actual accuracy rate on real verses; whether grok-3-mini is sufficient or grok-3 needed
   - Recommendation: Build pipeline with grok-3-mini first, test on known verses (BG 1.1 is a good benchmark), upgrade model if needed

2. **Dhatu/gana validation data source**
   - What we know: ~2000 Sanskrit verbal roots exist; LLM can identify them; no local dhatu database exists
   - What's unclear: Whether hallucination rate is acceptable without local validation
   - Recommendation: Accept LLM output for dhatu/gana initially. Consider adding a dhatu reference table in a future iteration if error rate is high.

3. **Analysis latency for user experience**
   - What we know: LLM API calls typically take 1-5 seconds for structured output
   - What's unclear: Whether users will accept this delay; whether streaming partial results is feasible
   - Recommendation: Show a loading state during analysis. Consider streaming the word-by-word breakdown as it becomes available using `streamText` + `Output.object()`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANAL-01 | Sandhi splitting produces correct word boundaries | integration | `npx vitest run src/lib/__tests__/sandhi.test.ts -x` | No -- Wave 0 |
| ANAL-02 | Vibhakti/vacana/linga extracted and validated against INRIA | integration | `npx vitest run src/lib/__tests__/morphology.test.ts -x` | No -- Wave 0 |
| ANAL-03 | Samasa decomposition with correct type classification | integration | `npx vitest run src/lib/__tests__/samasa.test.ts -x` | No -- Wave 0 |
| ANAL-04 | Dhatu/gana identification for verb forms | integration | `npx vitest run src/lib/__tests__/morphology.test.ts -x` | No -- Wave 0 |
| MEAN-01 | MW definitions returned for analyzed words | integration | `npx vitest run src/lib/__tests__/meanings.test.ts -x` | No -- Wave 0 |
| MEAN-02 | Apte definitions returned for analyzed words | integration | `npx vitest run src/lib/__tests__/meanings.test.ts -x` | No -- Wave 0 |
| MEAN-03 | LLM contextual meanings generated | integration | `npx vitest run src/lib/__tests__/meanings.test.ts -x` | No -- Wave 0 |
| MEAN-04 | Dictionary vs AI meanings visually distinguished | unit | `npx vitest run src/__tests__/word-breakdown.test.ts -x` | No -- Wave 0 |
| UI-02 | Word-by-word breakdown renders all properties | unit | `npx vitest run src/__tests__/word-breakdown.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/sandhi.test.ts` -- covers ANAL-01
- [ ] `src/lib/__tests__/morphology.test.ts` -- covers ANAL-02, ANAL-04
- [ ] `src/lib/__tests__/samasa.test.ts` -- covers ANAL-03
- [ ] `src/lib/__tests__/meanings.test.ts` -- covers MEAN-01, MEAN-02, MEAN-03
- [ ] `src/__tests__/word-breakdown.test.ts` -- covers MEAN-04, UI-02
- [ ] LLM tests need mocking strategy: mock `generateText` responses for deterministic testing
- [ ] Test fixture: known BG 1.1 analysis result as golden reference

## Sources

### Primary (HIGH confidence)
- [AI SDK xAI Provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/xai) - Installation, model IDs, structured output API
- [xAI Structured Outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) - Zod schema support, model compatibility
- [xAI Models and Pricing](https://docs.x.ai/developers/models) - Model costs, context windows

### Secondary (MEDIUM confidence)
- [AI SDK v6 migration](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) - generateObject deprecation, Output API
- [UBC Sanskrit Sandhi Charts](https://ubcsanskrit.ca/lesson3/sandhicharts.html) - Complete sandhi rule tables
- [Sanskrit Heritage INRIA](https://sanskrit.inria.fr/) - Reference Sanskrit NLP tools, segmentation approach
- [SanskritShala](https://aclanthology.org/2023.acl-demo.10/) - Neural Sanskrit NLP toolkit (academic reference)

### Tertiary (LOW confidence)
- LLM accuracy on Sanskrit-specific tasks -- no published benchmarks found for Grok models on Sanskrit; empirical testing required
- Dhatu/gana accuracy without local validation table -- untested assumption that LLM knowledge is sufficient

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - AI SDK + xAI provider is well-documented, actively maintained, official Vercel partnership
- Architecture: MEDIUM - LLM-first pipeline is sound but Sanskrit-specific accuracy is unproven; INRIA validation provides safety net
- Pitfalls: HIGH - Common LLM integration pitfalls well-understood; Sanskrit-specific pitfalls based on domain knowledge
- LLM Sanskrit accuracy: LOW - No benchmarks; needs empirical validation during implementation

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (30 days -- AI SDK moves fast but core patterns stable)
