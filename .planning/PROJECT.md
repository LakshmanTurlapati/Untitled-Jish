# Sanskrit Text Analyzer (Name TBD)

## What This Is

A web application that lets users photograph printed Sanskrit (Devanagari) text, extracts it with high accuracy using AI vision, and performs deep linguistic analysis — sandhi splitting, samasa decomposition, full morphological breakdown, dictionary + contextual meanings, and IAST transliteration. Includes an optional vocabulary quiz. Built for scholars and researchers who need rigorous Sanskrit text analysis.

## Core Value

Accurate extraction and deep grammatical analysis of Sanskrit text from images — sandhi splitting, samasa decomposition, and morphological breakdown must be linguistically correct.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Image capture/upload of printed Devanagari text
- [ ] High-accuracy OCR via Grok (xAI) vision API
- [ ] Sandhi splitting (vowel, consonant, visarga sandhi)
- [ ] Samasa decomposition (tatpurusha, dvandva, bahuvrihi, avyayibhava, karmadharaya, dvigu)
- [ ] Vibhakti (case) and vacana (number) identification
- [ ] Dhatu (verbal root) extraction with gana classification
- [ ] Unique word extraction with filtering of common sentence framers (particles, conjunctions)
- [ ] Hybrid word meanings — Monier-Williams/Apte dictionary base + LLM contextual interpretation
- [ ] IAST transliteration for each word
- [ ] Word-to-meaning MCQ quiz from extracted vocabulary
- [ ] Clean, scholar-friendly UI

### Out of Scope

- User authentication/accounts — open-use, no login
- Handwritten/manuscript OCR — printed Devanagari only
- Spaced repetition or long-term progress tracking — no persistent user state
- Multi-format quiz types (reverse, fill-in-blank) — word → meaning MCQ only
- Audio pronunciation — IAST transliteration text only
- Mobile native app — web only

## Context

- Sanskrit grammar is deeply structured: sandhi rules, 7 vibhaktis × 3 vacanas, 10 dhatu ganas, 6+ samasa types. The analysis pipeline must respect Paninian grammar principles.
- Monier-Williams Sanskrit-English Dictionary and Apte's dictionary are the gold standards. Digital versions exist (Cologne Digital Sanskrit Dictionaries project).
- Grok (xAI) preferred as the primary LLM/vision provider for OCR and contextual analysis.
- Sanskrit compound words (samasas) can be deeply nested — a single compound may contain multiple levels of composition that need recursive decomposition.
- "General sentence framers" to filter include: ca, va, tu, hi, eva, api, iti, atha, tatha, yatha, etc.

## Constraints

- **LLM Provider**: Grok (xAI) preferred — fallback options acceptable but Grok first
- **Frontend**: Next.js + React
- **Deployment**: Fly.io
- **No Auth**: App must work without any user accounts or login
- **Accuracy**: Grammatical analysis must be linguistically defensible for scholar audience

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Grok (xAI) for vision/OCR | User preference, strong vision capabilities | — Pending |
| Hybrid meaning system | Dictionary ground truth + LLM for context gives both accuracy and depth | — Pending |
| No authentication | Reduces friction, scholars want quick analysis not account management | — Pending |
| IAST over IPA | Standard academic romanization, familiar to target audience | — Pending |
| Printed Devanagari only | Narrows OCR challenge, handwritten is a different problem entirely | — Pending |

---
*Last updated: 2026-03-06 after initialization*
