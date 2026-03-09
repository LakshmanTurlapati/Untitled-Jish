# Phase 7: UI Navigation & Polish - Research

**Researched:** 2026-03-09
**Domain:** React client-side navigation, HTML5 camera capture, Tailwind CSS theming
**Confidence:** HIGH

## Summary

Phase 7 reorganizes the existing single-page AnalysisView into distinct tabbed sections at the page level, gates the "Analyze" button so it only appears on the input/analysis page (not on vocabulary/quiz pages), adds direct camera capture for mobile users, and fixes the progress checkmark colors to use the app's accent palette instead of raw `bg-green-500`.

The app is currently a single-page Next.js app with all functionality inside `AnalysisView.tsx`. The existing tab navigation (words/vocabulary/quiz) lives inside AnalysisView and only appears after analysis results exist. Phase 7 elevates navigation to the page level so users can switch between an "Analyze" section (input + results) and "Study" section (vocabulary + quiz) via top-level tabs, with the sticky bottom "Analyze" button only visible on the Analyze tab.

**Primary recommendation:** Keep client-side state-driven tabs (no routing changes needed). Refactor AnalysisView into a parent page component with top-level tab state, and use the HTML `<input capture="environment">` attribute for camera capture (simplest approach, no getUserMedia complexity needed for a photo-capture use case).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Clean, scholar-friendly interface with proper Devanagari typography | Checkmark color alignment (accent palette instead of green), top-level tab navigation for cleaner UX |
| UI-02 | Word-by-word breakdown view showing all analysis properties | Analysis results gated to Analyze tab, existing WordBreakdown components preserved |
| INPUT-02 | User can upload an image of printed Devanagari text | Camera capture via `<input capture="environment">` added to ImageUpload component |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI framework | Already in project |
| Next.js | 16.1.6 | App framework | Already in project |
| Tailwind CSS | v4 | Styling | Already in project, @theme tokens defined |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.2 | Component testing | Test tab switching, camera button |
| vitest | 4.0.18 | Test runner | Existing test infra |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side tabs (useState) | Next.js parallel routes / file-based routing | Over-engineered for 2 tabs on a single-page app; would require lifting shared state (analysisResult) into layout or context |
| `<input capture>` attribute | getUserMedia API with canvas snapshot | getUserMedia adds complexity (permissions, stream management, video element rendering) -- overkill when the user just needs to snap a photo |

**Installation:**
```bash
# No new packages needed -- all functionality uses existing dependencies
```

## Architecture Patterns

### Current Structure (Before Phase 7)
```
src/app/
  page.tsx                    # Renders <AnalysisView />
  layout.tsx                  # Root layout with Shobhika font
  globals.css                 # @theme tokens, keyframe animations
  components/
    AnalysisView.tsx          # Monolithic: input + tabs + results + sticky bar
    WordBreakdown.tsx          # Word card component
    MeaningBadge.tsx           # Source-colored meaning display
    VocabularyList.tsx         # Vocabulary word list
    QuizView.tsx               # Gamified quiz with hearts/XP
    ImageUpload.tsx            # File upload + drag-drop
```

### Recommended Changes (Phase 7)

The restructuring is primarily within existing files, not new file creation:

1. **Top-level tab navigation** -- Add page-level tabs ("Analyze" / "Study") above the current content in `page.tsx` or `AnalysisView.tsx`
2. **Gate the sticky bottom bar** -- Only render the "Analyze" button when the user is on the Analyze tab
3. **Camera capture button** -- Add a camera-specific button/input to `ImageUpload.tsx`
4. **Checkmark color fix** -- Replace `bg-green-500` with `bg-accent-600` (or appropriate accent token) in progress step checkmarks

### Pattern 1: Top-Level Tab Navigation

**What:** Elevate navigation from post-results-only to always-visible page-level tabs. The current words/vocabulary/quiz tabs only appear after analysis. Phase 7 adds a higher-level "Analyze" vs "Study" tab that is always visible, where "Study" contains vocabulary and quiz sub-views.

**When to use:** When the user should be able to navigate between sections before and after analysis.

**Example:**
```typescript
// In page.tsx or AnalysisView.tsx
const [pageTab, setPageTab] = useState<"analyze" | "study">("analyze");

return (
  <>
    {/* Top navigation - always visible */}
    <nav className="flex gap-2 justify-center mb-6">
      <button
        onClick={() => setPageTab("analyze")}
        className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
          pageTab === "analyze"
            ? "bg-accent-600 text-white"
            : "text-ink-700 hover:bg-parchment-200"
        }`}
      >
        Analyze
      </button>
      <button
        onClick={() => setPageTab("study")}
        disabled={!analysisResult}
        className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
          pageTab === "study"
            ? "bg-accent-600 text-white"
            : "text-ink-700 hover:bg-parchment-200"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        Study
      </button>
    </nav>

    {/* Conditional content */}
    {pageTab === "analyze" && (
      <>
        {/* Hero Input Card, progress steps, word results */}
      </>
    )}

    {pageTab === "study" && analysisResult && (
      <>
        {/* Vocabulary / Quiz sub-tabs or direct views */}
      </>
    )}

    {/* Sticky bottom bar -- ONLY on analyze tab */}
    {pageTab === "analyze" && (
      <div className="fixed bottom-0 ...">
        <button onClick={handleSubmit} ...>Analyze</button>
      </div>
    )}
  </>
);
```

### Pattern 2: Camera Capture via HTML Input Attribute

**What:** Add `capture="environment"` to a file input to open the device camera directly on mobile.

**When to use:** When users need to photograph printed text (the primary Sanskrit text capture use case on mobile).

**Example:**
```typescript
// In ImageUpload.tsx -- add a separate camera input
<input
  ref={cameraInputRef}
  type="file"
  accept="image/jpeg,image/png"
  capture="environment"   // Opens rear camera on mobile
  onChange={handleInputChange}
  className="hidden"
/>

<button
  onClick={() => cameraInputRef.current?.click()}
  className="..."
>
  Take Photo
</button>
```

**Key behavior:**
- On mobile: Opens the device camera directly (rear-facing with "environment")
- On desktop: Falls back to file picker (capture attribute is ignored on desktop browsers)
- No permissions API needed -- the browser handles camera access natively
- Same `handleFile` logic processes the captured image

### Pattern 3: Checkmark Color Alignment

**What:** Replace hardcoded `bg-green-500` on progress step checkmarks with the app's accent color tokens.

**Current (wrong):**
```tsx
<span className="... bg-green-500 text-white">✓</span>
```

**Fixed:**
```tsx
<span className="... bg-accent-600 text-white">✓</span>
```

This aligns the checkmarks with the warm academic color scheme (amber/brown tones) defined in `globals.css`.

### Anti-Patterns to Avoid
- **File-based routing for tabs:** Do not create `/analyze` and `/study` routes -- the shared state (inputText, analysisResult) would need to be lifted to context/URL, adding complexity for no benefit
- **getUserMedia for photo capture:** Do not build a camera viewfinder component with live video stream just to take a photo -- the HTML `capture` attribute does this natively
- **New color tokens for checkmarks:** Do not add new theme colors -- use the existing accent-500/600 tokens

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera capture | getUserMedia + canvas + video element | `<input capture="environment">` | Browser handles permissions, UI, and photo taking natively |
| Tab navigation | Custom router or URL-based tabs | useState + conditional rendering | App is single-page, shared state is local |
| Color theming | New CSS variables for checkmarks | Existing `--color-accent-*` tokens | Consistency with established design system |

**Key insight:** This phase is polish, not new infrastructure. Every change reuses existing patterns and design tokens.

## Common Pitfalls

### Pitfall 1: Breaking Analysis State When Switching Tabs
**What goes wrong:** Switching to "Study" tab loses the text input or analysis results.
**Why it happens:** If tab switching unmounts the input section, React state is lost.
**How to avoid:** Keep `inputText` and `analysisResult` state in the parent component, only conditionally render child views. State lives above the tab switch.
**Warning signs:** User switches to Study, switches back, and sees empty input.

### Pitfall 2: Camera Capture Attribute Ignored on Desktop
**What goes wrong:** Developer expects `capture="environment"` to open camera on desktop, but it just opens file picker.
**Why it happens:** The `capture` attribute is only meaningful on mobile browsers.
**How to avoid:** This is expected behavior. Keep the existing file upload as the primary interaction, add camera as an additional option. The camera button should have text/icon that makes sense on both platforms (e.g., "Take Photo" on mobile still opens file picker on desktop gracefully).
**Warning signs:** None -- this is correct cross-platform behavior.

### Pitfall 3: Sticky Bar Visible During Quiz/Study
**What goes wrong:** The "Analyze" button sits at the bottom of the screen even when the user is taking a quiz, creating visual clutter.
**Why it happens:** The sticky bar is currently always rendered regardless of context.
**How to avoid:** Conditionally render the sticky bar only when `pageTab === "analyze"`.
**Warning signs:** Quiz answer buttons overlap with or sit above the Analyze button.

### Pitfall 4: Checkmark Colors Not Matching Quiz Feedback
**What goes wrong:** Progress step checkmarks use accent color but quiz correct/wrong feedback uses green/red.
**Why it happens:** Confusing "UI consistency" with "semantic meaning." Green/red for quiz answers is semantically correct (right/wrong feedback).
**How to avoid:** Only change progress step checkmarks to accent. Keep quiz feedback green/red -- those carry semantic meaning.
**Warning signs:** Quiz correct answers not visually distinguishable from wrong ones.

## Code Examples

### Camera Input Addition to ImageUpload
```typescript
// Source: MDN <input capture> docs + existing ImageUpload.tsx pattern
const cameraInputRef = useRef<HTMLInputElement>(null);

// In the return JSX, alongside existing file upload:
<div className="flex gap-2">
  <button
    onClick={() => fileInputRef.current?.click()}
    className="flex-1 cursor-pointer rounded-lg border-2 border-dashed border-parchment-200 p-4 text-center transition-colors hover:border-accent-500"
  >
    <p className="text-sm text-ink-600">Upload Image</p>
  </button>
  <button
    onClick={() => cameraInputRef.current?.click()}
    className="cursor-pointer rounded-lg border-2 border-dashed border-parchment-200 p-4 text-center transition-colors hover:border-accent-500"
  >
    <p className="text-sm text-ink-600">Camera</p>
  </button>
</div>
<input
  ref={cameraInputRef}
  type="file"
  accept="image/jpeg,image/png"
  capture="environment"
  onChange={handleInputChange}
  className="hidden"
/>
```

### Conditional Sticky Bar Rendering
```typescript
// Source: existing AnalysisView.tsx pattern
{pageTab === "analyze" && (
  <div className="fixed bottom-0 left-0 right-0 bg-parchment-50/95 backdrop-blur-sm border-t border-parchment-200 p-4 z-50">
    <div className="mx-auto max-w-[640px]">
      <button
        onClick={handleSubmit}
        disabled={isLoading || !inputText.trim()}
        className="w-full rounded-xl bg-accent-600 text-white font-bold px-8 py-3 border-b-4 border-accent-800 active:border-b-2 active:translate-y-[2px] transition-all duration-75 disabled:opacity-50"
      >
        {isLoading ? "Analyzing..." : "Analyze"}
      </button>
    </div>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `navigator.getUserMedia()` | `navigator.mediaDevices.getUserMedia()` | Years ago | Legacy API deprecated; but we use `<input capture>` instead of either |
| Separate route per tab | Client-side tab state | N/A (design choice) | Simpler for single-page apps with shared state |

**Deprecated/outdated:**
- `navigator.getUserMedia()`: Use `navigator.mediaDevices.getUserMedia()` if you ever need stream-based capture (not needed for this phase)

## Open Questions

1. **Tab organization: 2-level or flat?**
   - What we know: Currently there are 3 tabs (words/vocabulary/quiz) that appear after analysis. Phase 7 description says "tabbed sections" and "gate analysis button to its page."
   - What's unclear: Should it be 2 top-level tabs (Analyze / Study) with Study containing sub-tabs for vocabulary and quiz? Or should it be 3-4 flat tabs?
   - Recommendation: Use 2 top-level tabs ("Analyze" and "Study"). The Analyze tab shows input + word results. The Study tab shows vocabulary and quiz (with sub-tabs or stacked). This cleanly gates the Analyze button to its section.

2. **Camera button placement**
   - What we know: The ImageUpload component currently has a single drop zone for file upload.
   - What's unclear: Should camera be a separate button alongside upload, or integrated into the same drop zone with two actions?
   - Recommendation: Two side-by-side buttons ("Upload Image" and "Take Photo") replacing the single drop zone. Both trigger the same handleFile pipeline.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Checkmark uses accent color, not green | unit | `npx vitest run src/__tests__/analysis-view-nav.test.tsx -t "checkmark" -x` | No - Wave 0 |
| UI-02 | Word breakdown visible on Analyze tab | unit | `npx vitest run src/__tests__/analysis-view-nav.test.tsx -t "words" -x` | No - Wave 0 |
| INPUT-02 | Camera input has capture="environment" attribute | unit | `npx vitest run src/__tests__/image-upload.test.tsx -t "camera" -x` | Partial - file exists, test case needed |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/analysis-view-nav.test.tsx` -- covers tab navigation, sticky bar gating, checkmark colors
- [ ] Update `vitest.config.ts` environmentMatchGlobs to include new test file with jsdom
- [ ] Add test cases to existing `src/__tests__/image-upload.test.tsx` for camera capture input

## Sources

### Primary (HIGH confidence)
- Project source code: `src/app/components/AnalysisView.tsx`, `ImageUpload.tsx`, `globals.css` -- direct inspection
- Project `package.json` -- version verification

### Secondary (MEDIUM confidence)
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) - camera API reference
- [MDN: Taking still photos](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos) - photo capture patterns
- [HTML Media Capture syntax](https://blog.addpipe.com/correct-syntax-html-media-capture/) - `<input capture>` attribute details
- [Next.js App Router docs](https://nextjs.org/docs/app/getting-started/linking-and-navigating) - navigation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, everything already in project
- Architecture: HIGH - direct source code inspection, straightforward refactoring
- Pitfalls: HIGH - well-understood React patterns, HTML5 camera capture is mature
- Camera capture: HIGH - `<input capture>` is a simple HTML attribute, widely supported on mobile

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable technologies, no moving targets)
