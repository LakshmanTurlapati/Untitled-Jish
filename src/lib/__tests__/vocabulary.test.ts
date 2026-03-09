import { describe, it, expect } from "vitest";
import { extractVocabulary } from "@/lib/study/vocabulary";
import { COMMON_PARTICLES } from "@/lib/study/particles";
import type { EnrichedWord } from "@/lib/analysis/types";

/** Helper to create a mock EnrichedWord with sensible defaults */
function mockWord(overrides: Partial<EnrichedWord> & { iast: string; stem: string }): EnrichedWord {
  return {
    original: overrides.original ?? overrides.iast,
    iast: overrides.iast,
    sandhi: { sandhi_type: "none" },
    morphology: {
      stem: overrides.stem,
      word_type: overrides.morphology?.word_type ?? "noun",
      linga: overrides.morphology?.linga ?? "pullinga",
      ...(overrides.morphology ?? {}),
    },
    contextual_meaning: overrides.contextual_meaning ?? `meaning of ${overrides.iast}`,
    inria_validated: false,
    inria_grammar: null,
    mw_definitions: overrides.mw_definitions ?? [`MW def of ${overrides.iast}`],
    apte_definitions: overrides.apte_definitions ?? [],
    meaning_source: overrides.meaning_source ?? "dictionary",
    ...overrides,
    // Re-apply morphology to not lose the spread
    morphology: {
      stem: overrides.stem,
      word_type: overrides.morphology?.word_type ?? "noun",
      linga: overrides.morphology?.linga ?? "pullinga",
      ...(overrides.morphology ?? {}),
    },
  };
}

describe("COMMON_PARTICLES", () => {
  it("contains expected Sanskrit particles", () => {
    const expected = ["ca", "tu", "hi", "eva", "api", "iti", "atha", "tatha", "yatha", "na", "va"];
    for (const p of expected) {
      expect(COMMON_PARTICLES.has(p)).toBe(true);
    }
  });
});

describe("extractVocabulary", () => {
  it("returns empty array for empty input", () => {
    expect(extractVocabulary([])).toEqual([]);
  });

  it("filters out common particles", () => {
    const words = [
      mockWord({ iast: "ca", stem: "ca" }),
      mockWord({ iast: "tu", stem: "tu" }),
      mockWord({ iast: "hi", stem: "hi" }),
      mockWord({ iast: "eva", stem: "eva" }),
      mockWord({ iast: "api", stem: "api" }),
      mockWord({ iast: "dharma", stem: "dharma" }),
    ];
    const result = extractVocabulary(words);
    expect(result).toHaveLength(1);
    expect(result[0].iast).toBe("dharma");
  });

  it("deduplicates by stem (keeps first occurrence)", () => {
    const words = [
      mockWord({ iast: "dharmasya", stem: "dharma", contextual_meaning: "of dharma" }),
      mockWord({ iast: "dharmam", stem: "dharma", contextual_meaning: "dharma (acc.)" }),
    ];
    const result = extractVocabulary(words);
    expect(result).toHaveLength(1);
    expect(result[0].iast).toBe("dharmasya");
    expect(result[0].contextualMeaning).toBe("of dharma");
  });

  it("preserves appearance order", () => {
    const words = [
      mockWord({ iast: "yoga", stem: "yoga" }),
      mockWord({ iast: "dharma", stem: "dharma" }),
      mockWord({ iast: "karma", stem: "karma" }),
    ];
    const result = extractVocabulary(words);
    expect(result.map((w) => w.iast)).toEqual(["yoga", "dharma", "karma"]);
  });

  it("maps all VocabularyWord fields correctly", () => {
    const words = [
      mockWord({
        original: "धर्मः",
        iast: "dharmaḥ",
        stem: "dharma",
        morphology: { stem: "dharma", word_type: "noun", linga: "pullinga" },
        contextual_meaning: "righteousness",
        mw_definitions: ["law, duty, righteousness"],
      }),
    ];
    const result = extractVocabulary(words);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      original: "धर्मः",
      iast: "dharmaḥ",
      stem: "dharma",
      wordType: "noun",
      linga: "pullinga",
      contextualMeaning: "righteousness",
      mwDefinition: "law, duty, righteousness",
    });
  });

  it("sets mwDefinition to null when no MW definitions exist", () => {
    const words = [
      mockWord({ iast: "test", stem: "test", mw_definitions: [] }),
    ];
    const result = extractVocabulary(words);
    expect(result[0].mwDefinition).toBeNull();
  });
});
