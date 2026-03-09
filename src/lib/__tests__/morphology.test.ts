import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import type { z } from "zod";
import type { FullAnalysisSchema } from "@/lib/analysis/schemas";

/**
 * BG 1.1 fixture: realistic analysis of the first words of Bhagavad Gita 1.1
 * "dharmakshetre kurukshetre samavetaa yuyutsavah"
 * Used as golden reference for deterministic LLM mock testing.
 */
const BG_1_1_FIXTURE: z.infer<typeof FullAnalysisSchema> = {
  input_text: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  words: [
    {
      original: "धर्मक्षेत्रे",
      iast: "dharmakṣetre",
      sandhi_type: "vowel",
      is_compound: true,
      samasa: {
        compound: "धर्मक्षेत्र",
        is_compound: true,
        samasa_type: "tatpurusha",
        components: [
          {
            word: "धर्म",
            iast: "dharma",
            meaning: "righteousness, duty",
            role: "qualifier",
          },
          {
            word: "क्षेत्र",
            iast: "kṣetra",
            meaning: "field",
            role: "qualified",
          },
        ],
      },
      morphology: {
        stem: "dharmakṣetra",
        word_type: "noun",
        vibhakti: "saptamī",
        vacana: "ekavacana",
        linga: "napumsakalinga",
      },
      contextual_meaning: "in the field of dharma (righteousness)",
    },
    {
      original: "कुरुक्षेत्रे",
      iast: "kurukṣetre",
      sandhi_type: "none",
      is_compound: true,
      samasa: {
        compound: "कुरुक्षेत्र",
        is_compound: true,
        samasa_type: "tatpurusha",
        components: [
          {
            word: "कुरु",
            iast: "kuru",
            meaning: "the Kuru dynasty",
            role: "qualifier",
          },
          {
            word: "क्षेत्र",
            iast: "kṣetra",
            meaning: "field",
            role: "qualified",
          },
        ],
      },
      morphology: {
        stem: "kurukṣetra",
        word_type: "noun",
        vibhakti: "saptamī",
        vacana: "ekavacana",
        linga: "napumsakalinga",
      },
      contextual_meaning: "in the field of the Kurus (Kurukshetra)",
    },
    {
      original: "समवेताः",
      iast: "samavetāḥ",
      sandhi_type: "visarga",
      is_compound: false,
      morphology: {
        stem: "samavetā",
        word_type: "participle",
        vibhakti: "prathamā",
        vacana: "bahuvacana",
        linga: "pullinga",
      },
      contextual_meaning: "assembled, gathered together",
    },
    {
      original: "युयुत्सवः",
      iast: "yuyutsavaḥ",
      sandhi_type: "none",
      is_compound: false,
      morphology: {
        stem: "yuyutsu",
        word_type: "adjective",
        vibhakti: "prathamā",
        vacana: "bahuvacana",
        linga: "pullinga",
        dhatu: "yudh",
        gana: 4,
      },
      contextual_meaning: "desirous of fighting",
    },
  ],
};

// Mock the 'ai' module to return our fixture
vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    output: BG_1_1_FIXTURE,
    text: JSON.stringify(BG_1_1_FIXTURE),
  }),
  Output: {
    object: vi.fn().mockReturnValue({ type: "object" }),
  },
}));

// Mock the xai provider
vi.mock("@ai-sdk/xai", () => ({
  xai: vi.fn().mockReturnValue({ modelId: "grok-4-1-fast-non-reasoning" }),
}));

// Mock the dictionary lookup module
vi.mock("@/lib/dictionary/lookup", () => ({
  lookupByStem: vi.fn().mockImplementation((form: string) => {
    // Simulate INRIA stem index: known forms return matches, unknown forms return empty
    const knownForms: Record<
      string,
      { stems: Array<{ grammar_info: string }>; entries: Array<unknown> }
    > = {
      dharmakṣetre: {
        stems: [{ grammar_info: "loc.sg.n" }],
        entries: [],
      },
      kurukṣetre: {
        stems: [{ grammar_info: "loc.sg.n" }],
        entries: [],
      },
      samavetāḥ: {
        stems: [{ grammar_info: "nom.pl.m" }],
        entries: [],
      },
    };

    return knownForms[form] || { stems: [], entries: [] };
  }),
}));

describe("enrichWithStemIndex", () => {
  let enrichWithStemIndex: typeof import("@/lib/analysis/morphology").enrichWithStemIndex;

  beforeAll(async () => {
    const mod = await import("@/lib/analysis/morphology");
    enrichWithStemIndex = mod.enrichWithStemIndex;
  });

  it("returns validated=true for known INRIA forms", () => {
    const result = enrichWithStemIndex("dharmakṣetre");
    expect(result.inria_validated).toBe(true);
    expect(result.inria_grammar).toBe("loc.sg.n");
  });

  it("returns validated=false for unknown forms", () => {
    const result = enrichWithStemIndex("yuyutsavaḥ");
    expect(result.inria_validated).toBe(false);
    expect(result.inria_grammar).toBeNull();
  });

  it("returns validated=true for samavetāḥ", () => {
    const result = enrichWithStemIndex("samavetāḥ");
    expect(result.inria_validated).toBe(true);
    expect(result.inria_grammar).toBe("nom.pl.m");
  });
});

describe("analyzeText pipeline", () => {
  let analyzeText: typeof import("@/lib/analysis/pipeline").analyzeText;

  beforeAll(async () => {
    const mod = await import("@/lib/analysis/pipeline");
    analyzeText = mod.analyzeText;
  });

  it("returns AnalysisResult with words array", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    expect(result).toBeDefined();
    expect(result.words).toBeInstanceOf(Array);
    expect(result.words.length).toBe(4);
  });

  it("populates INRIA validation for known forms", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    const dharmaksetre = result.words[0];
    expect(dharmaksetre.inria_validated).toBe(true);
    expect(dharmaksetre.inria_grammar).toBe("loc.sg.n");
  });

  it("marks unknown forms as not validated", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    const yuyutsavah = result.words[3];
    expect(yuyutsavah.inria_validated).toBe(false);
    expect(yuyutsavah.inria_grammar).toBeNull();
  });

  it("preserves morphology fields from LLM output", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    const dharmaksetre = result.words[0];
    expect(dharmaksetre.morphology.stem).toBe("dharmakṣetra");
    expect(dharmaksetre.morphology.word_type).toBe("noun");
    expect(dharmaksetre.morphology.vibhakti).toBe("saptamī");
    expect(dharmaksetre.morphology.vacana).toBe("ekavacana");
    expect(dharmaksetre.morphology.linga).toBe("napumsakalinga");
  });

  it("preserves verb morphology with dhatu and gana", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    const yuyutsavah = result.words[3];
    expect(yuyutsavah.morphology.dhatu).toBe("yudh");
    expect(yuyutsavah.morphology.gana).toBe(4);
  });

  it("preserves contextual meaning from LLM output", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    expect(result.words[0].contextual_meaning).toContain("field of dharma");
  });

  it("includes raw LLM output in result", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    expect(result.raw_llm_output).toBeDefined();
  });

  it("stores input_text in result", async () => {
    const result = await analyzeText("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
    expect(result.input_text).toBe("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः");
  });
});
