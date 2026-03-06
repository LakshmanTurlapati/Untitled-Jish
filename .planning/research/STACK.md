# Technology Stack

**Project:** Sanskrit Text Analyzer
**Researched:** 2026-03-06

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.x (latest stable) | Full-stack React framework | Project constraint. v16 is current stable with Turbopack, React 19 support. Use App Router exclusively -- no Pages Router. `output: "standalone"` for Fly.io Docker deployment. | HIGH |
| React | 19.x | UI library | Ships with Next.js 16. Server Components are critical for dictionary lookups and server-side Sanskrit processing without exposing logic to client. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for a project with complex data structures (morphological analysis results, dictionary entries, grammar types). Catches errors in Sanskrit data pipeline early. | HIGH |

### AI / LLM Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel AI SDK | 6.x | LLM integration framework | `@ai-sdk/xai` provider gives first-class xAI/Grok support with streaming, vision/image input, structured output (object generation). Handles the OpenAI-compatible API abstraction so you never write raw fetch calls. Works natively with Next.js App Router and Server Actions. | HIGH |
| `@ai-sdk/xai` | latest | xAI Grok provider | Official Vercel AI SDK provider for Grok. Supports `grok-2-vision-1212` for OCR and `grok-2-1212` for text analysis. Vision model accepts image URLs and base64 -- perfect for the camera/upload flow. | HIGH |
| Grok `grok-2-vision-1212` | -- | OCR / image-to-text | Primary vision model for extracting Devanagari text from images. Pricing: $2/1M input, $10/1M output tokens. Adequate for printed Devanagari OCR (80-85% accuracy per benchmarks). For scholar-grade accuracy, implement a verification step where extracted text is shown for user correction before analysis. | MEDIUM |
| Grok `grok-2-1212` | -- | Sanskrit analysis | Text model for sandhi splitting, samasa decomposition, vibhakti identification, dhatu extraction, and contextual meanings. Pricing: $2/1M input, $10/1M output tokens. Use structured output (JSON mode) via AI SDK's `generateObject()` to get typed morphological results. | MEDIUM |

**Why AI SDK over raw OpenAI SDK:** The AI SDK provides `generateObject()` with Zod schema validation, streaming with `streamText()`, and provider-agnostic architecture. If Grok underperforms on Sanskrit analysis, swapping to `@ai-sdk/anthropic` or `@ai-sdk/google` requires changing one import, not rewriting API calls.

### Sanskrit-Specific Libraries

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@indic-transliteration/sanscript` | latest | IAST/Devanagari transliteration | Official JS port of the indic-transliteration project. Supports IAST, SLP1, Harvard-Kyoto, ITRANS, Devanagari, and all major Brahmic scripts. Runs client-side (no API call needed). Pure JS, no native dependencies. Use this over the deprecated `@sanskrit-coders/sanscript` or the older `sanscript` package. | HIGH |
| `better-sqlite3` | 12.x | Embedded dictionary DB | Fastest SQLite library for Node.js. Synchronous API is perfect for Server Components -- no async overhead for simple lookups. Pre-load Monier-Williams and Apte dictionary data into a local SQLite DB that ships with the app. Zero external dependency at runtime. | HIGH |

### Dictionary Data Sources

| Source | Format | Purpose | How to Use | Confidence |
|--------|--------|---------|------------|------------|
| Cologne Digital Sanskrit Lexicon (CDSL) -- Monier-Williams | XML/TXT (SLP1 encoding) | Primary dictionary | Download from `github.com/sanskrit-lexicon/MWS`. Parse XML into SQLite at build time. ~280K entries. Store headword (SLP1 + Devanagari + IAST), meanings, etymology, grammatical info. | HIGH |
| Cologne Digital Sanskrit Lexicon -- Apte | XML/TXT | Secondary dictionary | Download from `github.com/sanskrit-lexicon`. Same parse-to-SQLite pipeline. Apte is more concise, better for students; MW is more comprehensive for scholars. | HIGH |
| C-SALT REST/GraphQL API | REST/GraphQL | Fallback/supplementary | Available at `api.c-salt.uni-koeln.de/dicts/`. Do NOT use as primary -- adds network latency and external dependency. Use only if local DB lookup fails and you need a broader search. | MEDIUM |

### UI / Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | latest | Component library | Not a dependency -- copies components into your project. Tailwind v4 compatible. Provides accessible, composable primitives (Dialog, Card, Tabs, Table) that are perfect for displaying morphological analysis results. Scholar-friendly by default (clean, no visual noise). | HIGH |
| Tailwind CSS | 4.x | Utility-first CSS | Ships with Next.js 16 setup. v4 uses CSS-first configuration (no `tailwind.config.js`). `tw-animate-css` replaces deprecated `tailwindcss-animate`. | HIGH |
| `lucide-react` | latest | Icons | Ships with shadcn/ui. Consistent icon set for camera, upload, search, quiz actions. | HIGH |

### Image Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Native `<input type="file">` + Canvas API | -- | Image capture/upload | No library needed. Use `accept="image/*"` with `capture="environment"` for mobile camera. Use Canvas API for client-side resize/compression before sending to Grok vision API (reduces token cost). | HIGH |
| `sharp` | latest | Server-side image processing | If client-side compression isn't enough, use `sharp` in API routes for resize/format conversion. Already a Next.js dependency (used for `next/image` optimization). | HIGH |

### Deployment / Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Fly.io | -- | Hosting platform | Project constraint. Use `fly launch` with `output: "standalone"` for minimal Docker image. Single machine is sufficient for this app (no database server, dictionary is embedded SQLite). Start with `shared-cpu-1x` (256MB) and scale up if needed. | HIGH |
| Docker | Multi-stage | Container | Generated by `fly launch`. Multi-stage build: install deps, build Next.js, copy standalone output. Include SQLite dictionary DB file in the image. | HIGH |

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 3.x | Schema validation | Define typed schemas for morphological analysis results, dictionary entries, API responses. Use with AI SDK's `generateObject()` for structured LLM output. | HIGH |
| ESLint | 9.x | Linting | Flat config format. Next.js 16 ships with ESLint config. | HIGH |
| Prettier | 3.x | Formatting | Consistent code style. | HIGH |

## Architecture Decision: No Python Backend

**Decision:** Keep everything in TypeScript/Node.js. Do NOT add a Python FastAPI sidecar.

**Rationale:**
- The `sanskrit_parser` Python library (last meaningful update: 2021, tested on Python 3.7-3.9) is stale and produces both over-generation and under-generation of splits. It is not production-ready.
- The Sanskrit Heritage Site (INRIA) tools are research-grade web services, not deployable libraries. Using them means external API dependency with no SLA.
- University of Hyderabad's tools are similar -- web-hosted, no standalone deployment option.
- Modern LLMs (Grok, GPT-4, Claude) handle Sanskrit sandhi splitting and morphological analysis surprisingly well when given structured prompts with Paninian grammar rules. The LLM approach with dictionary-backed verification is more maintainable than a fragile Python NLP pipeline.
- A Python sidecar doubles deployment complexity on Fly.io (two processes, health checks, inter-process communication).
- IAST transliteration is fully handled by `@indic-transliteration/sanscript` in JS.
- Dictionary lookup is handled by embedded SQLite with `better-sqlite3`.

**The only thing Python would add is rule-based sandhi splitting, which the stale libraries don't do reliably anyway.** Better to use Grok with structured output + dictionary verification.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| LLM SDK | Vercel AI SDK 6 (`@ai-sdk/xai`) | Raw `openai` npm package with xAI base URL | AI SDK provides structured output, streaming, provider switching. Raw SDK means manual JSON parsing, no type safety on responses. |
| Transliteration | `@indic-transliteration/sanscript` | `sanscript` (original), `devanagari-transliterate` | `@indic-transliteration` is the maintained fork. Original `sanscript` is unmaintained. `devanagari-transliterate` has fewer supported schemes. |
| Dictionary storage | Embedded SQLite (`better-sqlite3`) | C-SALT API calls, PostgreSQL on Fly.io | SQLite is zero-latency, zero-cost, ships with the app. External API adds latency + failure mode. PostgreSQL is overkill for read-only dictionary data. |
| Dictionary data | CDSL XML download + build-time parse | PyCDSL Python library | PyCDSL is Python-only. We're avoiding Python. The raw XML/TXT data from `sanskrit-lexicon` GitHub is the same source, just consumed directly. |
| Sanskrit analysis | LLM (Grok) with structured prompts | `sanskrit_parser` Python library | Library is stale (2021), unreliable splits, Python 3.7-3.9 only. LLM approach is more accurate with good prompting and dictionary verification. |
| CSS | Tailwind CSS v4 | CSS Modules, styled-components | Tailwind is the Next.js ecosystem standard. shadcn/ui requires it. |
| Component library | shadcn/ui | Radix UI directly, MUI, Chakra | shadcn/ui gives you the source code (no black box), built on Radix, Tailwind-native. MUI and Chakra add bundle weight and fight Tailwind. |
| Deployment | Fly.io (single app) | Fly.io (multi-app: Next.js + Python) | Single app is simpler. No Python needed (see architecture decision above). |
| Vision/OCR | Grok `grok-2-vision-1212` | Google Cloud Vision, Tesseract | Project constraint (Grok preferred). Google Vision is more accurate but adds a second API provider. Tesseract is poor on Devanagari without training. |

## Installation

```bash
# Initialize Next.js 16 project
npx create-next-app@latest sanskrit-analyzer --typescript --tailwind --eslint --app --src-dir

# Core AI dependencies
npm install ai @ai-sdk/xai zod

# Sanskrit transliteration
npm install @indic-transliteration/sanscript

# Dictionary database
npm install better-sqlite3
npm install -D @types/better-sqlite3

# UI components (shadcn/ui -- run init, then add components as needed)
npx shadcn@latest init
npx shadcn@latest add button card dialog input tabs table badge separator skeleton

# Image processing (likely already present via Next.js)
npm install sharp
```

## Key Configuration

```typescript
// next.config.ts
const nextConfig = {
  output: "standalone", // Required for Fly.io Docker deployment
  serverExternalPackages: ["better-sqlite3"], // Native module needs external bundling
};
```

```typescript
// AI SDK setup example
import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";

const model = xai("grok-2-1212"); // text analysis
const visionModel = xai("grok-2-vision-1212"); // OCR
```

## Cost Estimation

| Operation | Model | Est. Tokens | Cost per Request |
|-----------|-------|-------------|-----------------|
| OCR (image to text) | grok-2-vision-1212 | ~2K in, ~500 out | ~$0.009 |
| Morphological analysis | grok-2-1212 | ~1K in, ~2K out | ~$0.022 |
| Contextual meanings | grok-2-1212 | ~500 in, ~1K out | ~$0.011 |
| **Total per analysis** | -- | -- | **~$0.04** |

At $0.04/analysis, 1000 daily analyses = ~$40/month in API costs. Manageable for a scholar tool.

## Sources

- [xAI API Documentation](https://docs.x.ai/overview) - Models, pricing, vision capabilities
- [xAI Models and Pricing](https://docs.x.ai/developers/models) - Grok-2-vision-1212 pricing details
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - AI SDK 6 features, xAI provider
- [AI SDK xAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/xai) - @ai-sdk/xai setup and usage
- [Next.js Releases](https://github.com/vercel/next.js/releases) - v16.x current stable
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) - Tailwind v4 compatibility
- [Fly.io Next.js Guide](https://fly.io/docs/js/frameworks/nextjs/) - Deployment with standalone output
- [sanskrit-lexicon/MWS GitHub](https://github.com/sanskrit-lexicon/MWS) - Monier-Williams dictionary data
- [C-SALT APIs](https://cceh.github.io/c-salt_sanskrit_data/) - REST/GraphQL dictionary APIs
- [@indic-transliteration/sanscript npm](https://www.npmjs.com/package/@indic-transliteration/sanscript) - Transliteration library
- [better-sqlite3 npm](https://www.npmjs.com/package/better-sqlite3) - SQLite for Node.js
- [PyCDSL GitHub](https://github.com/hrishikeshrt/PyCDSL) - Python CDSL interface (evaluated, not recommended)
- [sanskrit_parser GitHub](https://github.com/kmadathil/sanskrit_parser) - Python Sanskrit parser (evaluated, not recommended)
- [Sanskrit Heritage Site](https://sanskrit.inria.fr/) - INRIA Sanskrit tools (evaluated as reference only)
