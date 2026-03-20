# Phase 3: Image Input and OCR - Research

**Researched:** 2026-03-09
**Domain:** Image upload, OCR via Grok Vision API, text input UI, Next.js file handling
**Confidence:** MEDIUM

## Summary

Phase 3 has two distinct sub-problems: (1) building the text input UI with IAST transliteration display (INPUT-01, deferred from Phase 1), and (2) adding image upload with Grok Vision OCR for printed Devanagari extraction (INPUT-02, INPUT-03). The text input part is straightforward -- the existing `AnalysisView` component already has a textarea and submit flow; it needs enhancement with live IAST transliteration preview using the existing `devanagariToIast` utility.

The OCR part uses Grok Vision models via the AI SDK's `generateText` with image content parts. The project already has `@ai-sdk/xai` and `ai` installed. Vision-capable models include `grok-2-vision-1212` (cheaper) and `grok-4-1-fast-non-reasoning` (higher quality). Images are sent as base64-encoded strings within the message content array. The client uploads via FormData to a Next.js API route, which reads the file buffer and forwards to Grok Vision with a Sanskrit-specific OCR prompt. There are no published benchmarks for Grok Vision on Devanagari text, so this carries discovery risk -- the prompt engineering for Sanskrit (not Hindi) extraction is critical.

**Primary recommendation:** Use `grok-2-vision-1212` for OCR (cost-effective vision model), send images as base64 via the AI SDK `generateText` with `{ type: 'image', image: base64String }` content parts, and add a dedicated `/api/ocr` endpoint separate from the existing `/api/analyze` endpoint.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPUT-01 | User can paste or type Devanagari text directly into the app | Existing AnalysisView textarea + devanagariToIast utility; needs IAST preview display |
| INPUT-02 | User can upload an image of printed Devanagari text | FormData upload to Next.js API route, file-to-base64 conversion, image preview UI |
| INPUT-03 | App extracts Sanskrit text from uploaded image via Grok vision API with high accuracy | AI SDK generateText with xai vision model, Sanskrit-specific prompt engineering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai | ^6.0.116 | generateText with image content parts | Already installed, unified API for all LLM calls |
| @ai-sdk/xai | ^3.0.67 | xAI provider with vision model support | Already installed, supports grok-2-vision-1212 |
| next | 16.1.6 | API routes with FormData parsing | Already installed, native request.formData() support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @indic-transliteration/sanscript | ^1.3.3 | Live IAST transliteration preview | Already installed, for INPUT-01 transliteration display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Grok Vision OCR | Google Cloud Vision API | Google has 97% Sanskrit accuracy but adds a new dependency and API key; Grok keeps the stack unified |
| Grok Vision OCR | Tesseract.js (client-side) | Free but poor Devanagari accuracy without training; not viable for Sanskrit |
| Separate /api/ocr endpoint | Combined /api/analyze with optional image | Separation is cleaner -- OCR is a distinct step, user should see/edit extracted text before analysis |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    api/
      analyze/route.ts      # existing -- text analysis
      ocr/route.ts           # NEW -- image OCR extraction
    components/
      AnalysisView.tsx       # MODIFY -- add IAST preview, image upload, two-mode input
      ImageUpload.tsx        # NEW -- drag-drop/click file upload component
  lib/
    analysis/
      ocr.ts                 # NEW -- Grok Vision OCR extraction logic
      pipeline.ts            # existing -- no changes needed
```

### Pattern 1: Two-Phase Input Flow (OCR then Analysis)
**What:** Image upload extracts text via OCR into the text input area, then user reviews and submits for analysis. Text input and image upload are two paths to the same text -> analysis flow.
**When to use:** Always. Users must be able to review/edit OCR output before analysis.
**Example:**
```typescript
// src/lib/analysis/ocr.ts
import { generateText } from "ai";
import { xai } from "@ai-sdk/xai";

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const { text } = await generateText({
    model: xai("grok-2-vision-1212"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all Sanskrit text written in Devanagari script from this image.
Return ONLY the extracted Devanagari text, preserving line breaks.
This is Sanskrit (not Hindi). Preserve all Sanskrit-specific characters
including visarga (ः), anusvara (ं), and conjunct consonants.
Do not translate or transliterate -- return the original Devanagari script exactly.`,
          },
          {
            type: "image",
            image: imageBase64,
          },
        ],
      },
    ],
  });
  return text;
}
```

### Pattern 2: FormData File Upload API Route
**What:** Next.js API route receives image via FormData, converts to base64, sends to Grok Vision
**When to use:** For the /api/ocr endpoint
**Example:**
```typescript
// src/app/api/ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/analysis/ocr";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  // Validate file type (Grok accepts jpg/jpeg and png only)
  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG and PNG images are supported" },
      { status: 400 }
    );
  }

  // Max 20MB per xAI docs
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image must be under 20MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const extractedText = await extractTextFromImage(base64);

  return NextResponse.json({ text: extractedText });
}
```

### Pattern 3: Client-Side Image Upload with Preview
**What:** File input with drag-drop, image preview, and upload to /api/ocr
**When to use:** For the ImageUpload component
**Example:**
```typescript
// Client-side upload pattern
const formData = new FormData();
formData.append("image", file);

const response = await fetch("/api/ocr", {
  method: "POST",
  body: formData, // No Content-Type header -- browser sets multipart boundary
});
const { text } = await response.json();
// Populate text input with extracted text
```

### Pattern 4: Live IAST Transliteration Preview
**What:** As user types Devanagari, show IAST transliteration below the input
**When to use:** For INPUT-01 requirement
**Example:**
```typescript
// In AnalysisView or TextInput component
import { devanagariToIast } from "@/lib/transliteration";

const iastPreview = inputText ? devanagariToIast(inputText) : "";

// Render below textarea:
// <p className="font-serif text-sm text-ink-600 italic">{iastPreview}</p>
```

### Anti-Patterns to Avoid
- **Combining OCR and analysis in one API call:** Keep them separate. Users need to verify OCR output before committing to analysis. The extracted text should populate the text input.
- **Storing uploaded images on disk:** Not needed. Convert to base64 in memory, send to Grok, discard. No filesystem writes.
- **Using grok-3-mini for vision:** Text-only model. Must use a vision-capable model (grok-2-vision-1212 or grok-4-1-fast variants).
- **Setting Content-Type header for FormData:** Browser auto-sets the multipart boundary. Manually setting it breaks the upload.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image-to-text OCR | Custom Tesseract pipeline | Grok Vision API via AI SDK | Sanskrit/Devanagari requires specialized model; Grok handles complex scripts |
| File upload parsing | Custom multipart parser | `request.formData()` native API | Built into Next.js/Web API, handles all edge cases |
| Transliteration | Custom Devanagari-IAST mapping | `@indic-transliteration/sanscript` | Already installed, handles all edge cases including conjuncts |
| Image validation | Manual header parsing | File.type + File.size checks | Web API provides MIME type detection |

## Common Pitfalls

### Pitfall 1: Grok Vision Returns Hindi Instead of Sanskrit
**What goes wrong:** Vision model defaults to Hindi interpretation of Devanagari script, applying Hindi-specific corrections (e.g., dropping visarga, changing anusvara placement)
**Why it happens:** Hindi is far more common in training data than Sanskrit
**How to avoid:** Explicitly state "This is Sanskrit (not Hindi)" in the prompt. Instruct to preserve visarga, anusvara, and conjunct consonants. Ask for raw Devanagari without translation or transliteration.
**Warning signs:** Missing visarga (H) at end of words, incorrect anusvara placement

### Pitfall 2: Base64 Encoding Format Mismatch
**What goes wrong:** Sending base64 with data URI prefix when API expects raw base64, or vice versa
**Why it happens:** AI SDK accepts both raw base64 strings and data URIs, but mixing formats causes errors
**How to avoid:** Use raw base64 string (from `buffer.toString('base64')`). The AI SDK handles the format internally.
**Warning signs:** "Invalid image" or empty responses from the API

### Pitfall 3: Missing Content-Type on FormData Upload
**What goes wrong:** Developer manually sets `Content-Type: multipart/form-data` header
**Why it happens:** Habit from JSON APIs
**How to avoid:** Never set Content-Type header when sending FormData via fetch. The browser automatically sets it with the correct boundary string.
**Warning signs:** 400 errors, "Unexpected end of input" errors on the server

### Pitfall 4: Large Image Files Causing Timeouts
**What goes wrong:** High-resolution scanned images (10MB+) cause slow uploads and API timeouts
**Why it happens:** Users may upload raw scans without compression
**How to avoid:** Validate file size (max 20MB per xAI docs, but recommend 5MB client-side warning). Consider client-side image resizing if needed in v0.2.
**Warning signs:** Requests timing out, slow OCR responses

### Pitfall 5: Not Preserving Line Breaks in OCR Output
**What goes wrong:** Extracted text loses verse structure (shloka line breaks)
**Why it happens:** LLM may flatten text into a single line
**How to avoid:** Prompt explicitly asks to "preserve line breaks"
**Warning signs:** Verse text appearing as a single run-on line

## Code Examples

### Complete OCR Flow (Server)
```typescript
// Source: xAI docs + AI SDK docs
import { generateText } from "ai";
import { xai } from "@ai-sdk/xai";

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const { text } = await generateText({
    model: xai("grok-2-vision-1212"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a Sanskrit OCR specialist. Extract all Devanagari text from this image.

Rules:
- Return ONLY the Devanagari text as it appears in the image
- This is Sanskrit text, NOT Hindi -- preserve all Sanskrit orthography
- Keep visarga (ः), anusvara (ं), chandrabindu (ँ), and all conjunct consonants exactly as written
- Preserve line breaks and verse structure (do not merge lines)
- Do not translate, transliterate, or add any commentary
- If you cannot read a character clearly, use the closest Devanagari character`,
          },
          {
            type: "image",
            image: imageBase64,
          },
        ],
      },
    ],
  });
  return text.trim();
}
```

### Client Image Upload Component Pattern
```typescript
// Source: Next.js FormData pattern + React file input
"use client";
import { useState, useCallback } from "react";

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
}

export function ImageUpload({ onTextExtracted }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG images are supported");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB");
      return;
    }

    // Preview
    setPreview(URL.createObjectURL(file));
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "OCR failed");
      const { text } = await res.json();
      onTextExtracted(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [onTextExtracted]);

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {preview && <img src={preview} alt="Upload preview" className="max-h-48 rounded" />}
      {isUploading && <p>Extracting text...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tesseract OCR for Devanagari | Vision LLM APIs (GPT-4V, Grok Vision, Gemini) | 2024 | Much higher accuracy for complex scripts without custom training |
| Separate OCR service (Google Cloud Vision) | Unified LLM provider for both OCR and analysis | 2025 | Simpler architecture, single API key, consistent provider |
| generateObject for structured LLM output | generateText with Output.object() (AI SDK 6.x) | 2025 | Already using the current pattern in pipeline.ts |

**Deprecated/outdated:**
- Tesseract.js for Devanagari: Accuracy is poor without custom training data; vision LLMs are superior
- grok-vision-beta: Replaced by grok-2-vision-1212 and grok-4 vision variants

## Open Questions

1. **Grok Vision accuracy on printed Sanskrit Devanagari**
   - What we know: No published benchmarks exist for Grok Vision on Sanskrit. Google Cloud Vision reportedly achieves ~97% accuracy on Sanskrit.
   - What's unclear: Grok 2 Vision vs Grok 4 fast quality difference for Devanagari OCR
   - Recommendation: Start with grok-2-vision-1212 (cheaper at $0.20/1k input). If accuracy is insufficient, upgrade to grok-4-1-fast-non-reasoning. Test with BG 1.1 sample image as baseline.

2. **Optimal image resolution for OCR**
   - What we know: xAI accepts up to 20MB, supports "high" detail mode
   - What's unclear: Whether downscaling large images improves latency without hurting accuracy
   - Recommendation: Accept as-is for v0.1; client-side resize is a v0.2 optimization (INPUT-05 territory)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INPUT-01 | Text input with IAST transliteration display | unit + component | `npx vitest run src/__tests__/text-input.test.tsx -x` | No - Wave 0 |
| INPUT-02 | Image upload and preview | component | `npx vitest run src/__tests__/image-upload.test.tsx -x` | No - Wave 0 |
| INPUT-03 | OCR text extraction via Grok Vision | unit (mocked) | `npx vitest run src/lib/__tests__/ocr.test.ts -x` | No - Wave 0 |
| INPUT-03 | /api/ocr endpoint validation | unit (mocked) | `npx vitest run src/__tests__/ocr-api.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/text-input.test.tsx` -- covers INPUT-01 (IAST preview display)
- [ ] `src/__tests__/image-upload.test.tsx` -- covers INPUT-02 (file upload component)
- [ ] `src/lib/__tests__/ocr.test.ts` -- covers INPUT-03 (OCR extraction with mocked Grok)
- [ ] `src/__tests__/ocr-api.test.ts` -- covers INPUT-03 (API route validation, file type/size checks)
- [ ] Update vitest.config.ts environmentMatchGlobs to include new .tsx test files for jsdom

## Sources

### Primary (HIGH confidence)
- [xAI Image Understanding docs](https://docs.x.ai/docs/guides/image-understanding) - API format, supported formats (JPEG/PNG), 20MB limit, base64 and URL input methods
- [xAI Models and Pricing](https://docs.x.ai/developers/models) - Vision-capable models: grok-2-vision-1212, grok-4-1-fast-reasoning/non-reasoning with pricing
- [AI SDK xAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/xai) - Code pattern for generateText with image content parts using xai() provider
- [AI SDK Generate Text with Image Prompt](https://ai-sdk.dev/cookbook/node/generate-text-with-image-prompt) - Base64 and URL image input patterns

### Secondary (MEDIUM confidence)
- [Sanskrit OCR Options](https://www.tylerneill.info/blog-kalpataru-diaries/ocr-options) - Community perspective on Sanskrit OCR tooling landscape
- [Google OCR for Sanskrit](http://www.prakrit.info/blog/google-ocr-for-sanskrit/) - Google Cloud Vision ~97% accuracy baseline for Sanskrit

### Tertiary (LOW confidence)
- Grok Vision Devanagari accuracy: No benchmarks found. Discovery risk acknowledged in STATE.md. Needs empirical testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, API patterns verified via official docs
- Architecture: HIGH - two-phase flow (OCR -> text input -> analysis) is a clear, well-understood pattern
- OCR accuracy: LOW - no Devanagari benchmarks for Grok Vision; prompt engineering is the main lever
- Pitfalls: MEDIUM - based on general vision API experience and Sanskrit-specific concerns

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable stack, but vision model landscape moves fast)
