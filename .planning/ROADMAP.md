# Roadmap: Sanskrit Text Analyzer

## Overview

This roadmap delivers an end-to-end Sanskrit text analysis web application in four phases. Phase 1 establishes the foundation: project scaffolding, embedded dictionary infrastructure, text input, and IAST transliteration. Phase 2 builds the core NLP analysis pipeline: sandhi splitting, samasa decomposition, morphological analysis, and hybrid dictionary+LLM meanings. Phase 3 layers image upload and Grok Vision OCR on top of the validated text pipeline. Phase 4 adds study features: vocabulary extraction and MCQ quiz generation. Each phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Text Input** - Project scaffold, dictionary infrastructure, Devanagari text input with IAST transliteration
- [x] **Phase 2: Core Analysis Pipeline** - Sandhi splitting, samasa decomposition, morphological analysis, and hybrid meanings with word breakdown UI (completed 2026-03-09)
- [ ] **Phase 3: Image Input and OCR** - Image upload with Grok Vision OCR feeding into the analysis pipeline
- [ ] **Phase 4: Study Features** - Vocabulary extraction with filtering and word-to-meaning MCQ quiz

## Phase Details

### Phase 1: Foundation and Text Input
**Goal**: Project scaffold with Shobhika typography, bidirectional IAST transliteration engine, and embedded dictionary infrastructure (MW + Apte via CDSL/SQLite) in a clean, scholar-friendly app shell
**Depends on**: Nothing (first phase)
**Requirements**: ANAL-05, UI-01, UI-03
**Success Criteria** (what must be TRUE):
  1. Bidirectional IAST transliteration engine converts Devanagari text accurately (tested programmatically)
  2. App shell renders with Shobhika Devanagari typography and warm academic design tokens
  3. App works immediately without any login or account creation
  4. Dictionary definitions (Monier-Williams and Apte) are retrievable for Sanskrit stem forms
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, test infra, Shobhika font, design tokens, transliteration utility, app shell
- [x] 01-02-PLAN.md — CDSL dictionary parser, SQLite import pipeline, stem index, lookup module, API route
- [x] 01-03-PLAN.md — Gap closure: update ROADMAP and REQUIREMENTS to reflect INPUT-01 deferral to Phase 3

### Phase 2: Core Analysis Pipeline
**Goal**: Users get deep grammatical analysis of any Sanskrit text -- sandhi splitting, compound decomposition, morphological breakdown, and hybrid meanings -- displayed in a structured word-by-word view
**Depends on**: Phase 1
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04, MEAN-01, MEAN-02, MEAN-03, MEAN-04, UI-02
**Success Criteria** (what must be TRUE):
  1. User sees sandhi junctions split into individual words with vowel, consonant, and visarga sandhi handled
  2. User sees samasa compounds decomposed with type classification (tatpurusha, dvandva, bahuvrihi, avyayibhava, karmadharaya, dvigu)
  3. User sees vibhakti, vacana, linga, and dhatu/gana identification for each word in a structured breakdown view
  4. User sees both dictionary-sourced definitions and LLM-contextual meanings, clearly distinguished from each other
  5. Word-by-word breakdown view shows all analysis properties for each word
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Core analysis pipeline: type contracts, Zod schemas, LLM prompts, sandhi/samasa/morphology with INRIA validation
- [x] 02-02-PLAN.md — Meanings enrichment: dictionary lookups (MW + Apte), source tracking, POST /api/analyze endpoint
- [x] 02-03-PLAN.md — Word breakdown UI: WordBreakdown/MeaningBadge components, AnalysisView with text input, page integration

### Phase 3: Image Input and OCR
**Goal**: Users can photograph or upload printed Devanagari text and get the full analysis pipeline applied automatically
**Depends on**: Phase 2
**Requirements**: INPUT-01, INPUT-02, INPUT-03
**Success Criteria** (what must be TRUE):
  1. User can paste or type Devanagari text into the app and see it rendered with proper typography, with IAST transliteration displayed
  2. User can upload an image of printed Devanagari text and see extracted Sanskrit text appear
  3. Extracted text feeds directly into the analysis pipeline, producing the same results as manual text input
  4. OCR extraction handles standard printed Devanagari with high accuracy (Sanskrit, not Hindi correction)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Study Features
**Goal**: Users can study vocabulary extracted from analyzed texts through filtered word lists and interactive quizzes
**Depends on**: Phase 2
**Requirements**: STDY-01, STDY-02
**Success Criteria** (what must be TRUE):
  1. User sees a list of unique words extracted from analyzed text with common particles (ca, tu, hi, eva, api, etc.) filtered out
  2. User can take a word-to-meaning MCQ quiz generated from extracted vocabulary with plausible distractors
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4
(Note: Phases 3 and 4 both depend on Phase 2 and could execute in either order)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Text Input | 3/3 | Complete | 2026-03-07 |
| 2. Core Analysis Pipeline | 3/3 | Complete   | 2026-03-09 |
| 3. Image Input and OCR | 0/1 | Not started | - |
| 4. Study Features | 0/1 | Not started | - |
