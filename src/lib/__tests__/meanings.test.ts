/**
 * Tests for the meanings enrichment module.
 * Validates dictionary definition extraction and meaning_source tracking.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AnalyzedWord } from "@/lib/analysis/types";

// Mock the dictionary lookup module
vi.mock("@/lib/dictionary/lookup", () => ({
  lookupByStem: vi.fn(),
  lookupByHeadword: vi.fn(),
}));

import { enrichWithMeanings } from "@/lib/analysis/meanings";
import { lookupByStem, lookupByHeadword } from "@/lib/dictionary/lookup";

const mockedLookupByStem = vi.mocked(lookupByStem);
const mockedLookupByHeadword = vi.mocked(lookupByHeadword);

/** Helper to create a minimal AnalyzedWord for testing */
function makeWord(overrides: Partial<AnalyzedWord> = {}): AnalyzedWord {
  return {
    original: "धर्मः",
    iast: "dharmaḥ",
    sandhi: { sandhi_type: "none" },
    morphology: {
      stem: "dharma",
      word_type: "noun",
      vibhakti: "prathamā",
      vacana: "ekavacana",
      linga: "pullinga",
    },
    samasa: undefined,
    contextual_meaning: "duty, righteousness",
    inria_validated: true,
    inria_grammar: "nom. sg. m.",
    ...overrides,
  };
}

describe("enrichWithMeanings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no results
    mockedLookupByStem.mockReturnValue({ stems: [], entries: [] });
    mockedLookupByHeadword.mockReturnValue([]);
  });

  it("returns meaning_source='both' when MW and Apte definitions exist", () => {
    mockedLookupByStem.mockReturnValue({
      stems: [],
      entries: [
        {
          id: 1,
          dictionary: "mw",
          headword_slp1: "Darma",
          headword_deva: "धर्म",
          headword_iast: "dharma",
          homonym: 1,
          grammar: "m.",
          definition: "law, duty, righteousness",
          etymology: null,
          raw_body: null,
          page_ref: null,
          l_number: null,
        },
        {
          id: 2,
          dictionary: "ap90",
          headword_slp1: "DarmaH",
          headword_deva: "धर्मः",
          headword_iast: "dharmaḥ",
          homonym: 1,
          grammar: "m.",
          definition: "Religion; the customary observances of a caste",
          etymology: null,
          raw_body: null,
          page_ref: null,
          l_number: null,
        },
      ],
    });

    const word = makeWord();
    const result = enrichWithMeanings(word);

    expect(result.meaning_source).toBe("both");
    expect(result.mw_definitions).toHaveLength(1);
    expect(result.mw_definitions[0]).toBe("law, duty, righteousness");
    expect(result.apte_definitions).toHaveLength(1);
    expect(result.apte_definitions[0]).toBe(
      "Religion; the customary observances of a caste"
    );
  });

  it("returns meaning_source='both' when only MW definitions exist (LLM contextual always present)", () => {
    mockedLookupByStem.mockReturnValue({
      stems: [],
      entries: [
        {
          id: 1,
          dictionary: "mw",
          headword_slp1: "Darma",
          headword_deva: "धर्म",
          headword_iast: "dharma",
          homonym: 1,
          grammar: "m.",
          definition: "law, duty",
          etymology: null,
          raw_body: null,
          page_ref: null,
          l_number: null,
        },
      ],
    });

    const result = enrichWithMeanings(makeWord());

    expect(result.meaning_source).toBe("both");
    expect(result.mw_definitions).toHaveLength(1);
    expect(result.apte_definitions).toHaveLength(0);
  });

  it("returns meaning_source='both' when only Apte definitions exist", () => {
    mockedLookupByStem.mockReturnValue({
      stems: [],
      entries: [
        {
          id: 1,
          dictionary: "ap90",
          headword_slp1: "DarmaH",
          headword_deva: "धर्मः",
          headword_iast: "dharmaḥ",
          homonym: 1,
          grammar: "m.",
          definition: "Religion; the customary observances",
          etymology: null,
          raw_body: null,
          page_ref: null,
          l_number: null,
        },
      ],
    });

    const result = enrichWithMeanings(makeWord());

    expect(result.meaning_source).toBe("both");
    expect(result.mw_definitions).toHaveLength(0);
    expect(result.apte_definitions).toHaveLength(1);
  });

  it("returns meaning_source='ai' with empty definition arrays when no dictionary match", () => {
    // Default mocks return empty arrays
    const result = enrichWithMeanings(makeWord());

    expect(result.meaning_source).toBe("ai");
    expect(result.mw_definitions).toEqual([]);
    expect(result.apte_definitions).toEqual([]);
    // contextual_meaning from LLM is preserved
    expect(result.contextual_meaning).toBe("duty, righteousness");
  });

  it("preserves all original AnalyzedWord fields", () => {
    const word = makeWord();
    const result = enrichWithMeanings(word);

    expect(result.original).toBe(word.original);
    expect(result.iast).toBe(word.iast);
    expect(result.sandhi).toEqual(word.sandhi);
    expect(result.morphology).toEqual(word.morphology);
    expect(result.contextual_meaning).toBe(word.contextual_meaning);
    expect(result.inria_validated).toBe(word.inria_validated);
    expect(result.inria_grammar).toBe(word.inria_grammar);
  });

  it("falls back to lookupByHeadword when lookupByStem returns no entries", () => {
    mockedLookupByStem.mockReturnValue({ stems: [], entries: [] });
    mockedLookupByHeadword.mockReturnValue([
      {
        id: 3,
        dictionary: "mw",
        headword_slp1: "Darma",
        headword_deva: "धर्म",
        headword_iast: "dharma",
        homonym: 1,
        grammar: "m.",
        definition: "law, duty (from headword lookup)",
        etymology: null,
        raw_body: null,
        page_ref: null,
        l_number: null,
      },
    ]);

    const result = enrichWithMeanings(makeWord());

    expect(result.meaning_source).toBe("both");
    expect(result.mw_definitions).toHaveLength(1);
    expect(result.mw_definitions[0]).toContain("headword lookup");
    expect(mockedLookupByHeadword).toHaveBeenCalledWith("dharma", "iast");
  });

  it("uses morphology.stem for dictionary lookup", () => {
    enrichWithMeanings(makeWord());

    expect(mockedLookupByStem).toHaveBeenCalledWith("dharma", "iast");
  });
});
