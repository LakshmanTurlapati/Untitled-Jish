# Phase 1: Foundation and Text Input - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold (Next.js + React), embedded dictionary infrastructure (Monier-Williams and Apte via SQLite), IAST transliteration engine, and basic app shell. No text input UI — manual text entry is deferred to Phase 3 alongside image upload, since the primary input flow is image-based OCR.

</domain>

<decisions>
## Implementation Decisions

### Scope Adjustment
- No text input UI in Phase 1 — deferred to Phase 3 with image upload
- Phase 1 delivers: scaffold, dictionary infra, transliteration engine, basic app shell
- The primary user flow is image capture/upload, not manual typing

### Dictionary Infrastructure
- Source: Cologne Digital Sanskrit Dictionaries (CDSL) XML data for both MW and Apte
- Storage: Parsed into embedded SQLite database
- Entry depth: Full entries including etymology, usage examples, and cross-references
- Deployment: SQLite database bundled with the app (included in deployment artifact)
- Display priority: Monier-Williams primary, Apte secondary (toggle/expand)
- Stem resolution: Build reverse index from common inflected forms to stems during dictionary import — enables lookups before Phase 2 morphological analysis

### IAST Transliteration
- Bidirectional conversion: Devanagari to IAST and IAST to Devanagari
- IAST only — no Harvard-Kyoto, SLP1, or Velthuis schemes
- Built as a reusable utility module (no UI in this phase)

### Visual Foundation
- Devanagari font: Shobhika (IIT Bombay, designed for Sanskrit typesetting)
- CSS framework: Tailwind CSS
- Design tokens and color palette set up in scaffold

### Claude's Discretion
- Overall aesthetic direction (minimal academic, warm traditional, modern dark, or hybrid)
- App shell layout structure
- Design token values (colors, spacing, typography scale)
- SQLite schema design for dictionary entries
- Stem index generation strategy and coverage

</decisions>

<specifics>
## Specific Ideas

- Shobhika font specifically chosen for its high-quality Sanskrit ligature rendering
- Primary input is image-based — the app's identity centers on photographing printed Sanskrit, not typing it
- Full dictionary entries matter for scholar audience — they expect the complete picture, not summaries

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes all patterns

### Integration Points
- Dictionary SQLite database will be consumed by Phase 2 analysis pipeline
- IAST transliteration utility will be used across all subsequent phases
- App shell layout will receive content from Phases 2-4
- Stem index will be extended/refined by Phase 2 morphological analysis

</code_context>

<deferred>
## Deferred Ideas

- Manual text input UI — moved to Phase 3 (alongside image upload as secondary input)
- INPUT-01 requirement (paste/type Devanagari) — now Phase 3 scope

</deferred>

---

*Phase: 01-foundation-and-text-input*
*Context gathered: 2026-03-07*
