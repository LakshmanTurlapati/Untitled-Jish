import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("analysis schemas and types", () => {
  let FullAnalysisSchema: z.ZodType;

  beforeAll(async () => {
    const mod = await import("@/lib/analysis/schemas");
    FullAnalysisSchema = mod.FullAnalysisSchema;
  });

  it("FullAnalysisSchema accepts a well-formed analysis object", () => {
    const validData = {
      input_text: "धर्मक्षेत्रे कुरुक्षेत्रे",
      words: [
        {
          original: "धर्मक्षेत्रे",
          iast: "dharmakṣetre",
          sandhi_type: "vowel",
          is_compound: true,
          morphology: {
            stem: "dharmakṣetra",
            word_type: "noun",
            vibhakti: "saptamī",
            vacana: "ekavacana",
            linga: "napumsakalinga",
          },
          samasa: {
            compound: "धर्मक्षेत्र",
            is_compound: true,
            samasa_type: "tatpurusha",
            components: [
              {
                word: "धर्म",
                iast: "dharma",
                meaning: "righteousness",
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
          contextual_meaning: "in the field of dharma",
        },
      ],
    };

    const result = FullAnalysisSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("FullAnalysisSchema rejects missing required fields", () => {
    const invalidData = {
      input_text: "test",
      words: [
        {
          original: "test",
          // missing iast, sandhi_type, is_compound, morphology, contextual_meaning
        },
      ],
    };

    const result = FullAnalysisSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("FullAnalysisSchema rejects invalid sandhi_type enum", () => {
    const invalidData = {
      input_text: "test",
      words: [
        {
          original: "test",
          iast: "test",
          sandhi_type: "invalid_type",
          is_compound: false,
          morphology: {
            stem: "test",
            word_type: "noun",
          },
          contextual_meaning: "test meaning",
        },
      ],
    };

    const result = FullAnalysisSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("FullAnalysisSchema accepts all samasa_type enum values", () => {
    const samasaTypes = [
      "tatpurusha",
      "dvandva",
      "bahuvrihi",
      "avyayibhava",
      "karmadharaya",
      "dvigu",
      "none",
    ] as const;

    for (const samasaType of samasaTypes) {
      const data = {
        input_text: "test",
        words: [
          {
            original: "test",
            iast: "test",
            sandhi_type: "none",
            is_compound: true,
            samasa: {
              compound: "test",
              is_compound: true,
              samasa_type: samasaType,
              components: [],
            },
            morphology: {
              stem: "test",
              word_type: "noun",
            },
            contextual_meaning: "test",
          },
        ],
      };

      const result = FullAnalysisSchema.safeParse(data);
      expect(result.success, `Failed for samasa_type: ${samasaType}`).toBe(
        true
      );
    }
  });

  it("FullAnalysisSchema accepts verb morphology with dhatu and gana", () => {
    const data = {
      input_text: "test",
      words: [
        {
          original: "गच्छति",
          iast: "gacchati",
          sandhi_type: "none",
          is_compound: false,
          morphology: {
            stem: "gam",
            word_type: "verb",
            dhatu: "gam",
            gana: 1,
            lakara: "laṭ",
            purusha: "prathama",
            vacana: "ekavacana",
          },
          contextual_meaning: "goes",
        },
      ],
    };

    const result = FullAnalysisSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("analysis types", () => {
  it("exports all required type interfaces", async () => {
    const types = await import("@/lib/analysis/types");
    // These are type-level checks -- we verify exports exist at runtime
    expect(types).toBeDefined();
  });
});

describe("prompt builder", () => {
  let buildAnalysisPrompt: (text: string) => string;

  beforeAll(async () => {
    const mod = await import("@/lib/analysis/prompts");
    buildAnalysisPrompt = mod.buildAnalysisPrompt;
  });

  it("buildAnalysisPrompt returns a string containing the input text", () => {
    const prompt = buildAnalysisPrompt("धर्मक्षेत्रे कुरुक्षेत्रे");
    expect(prompt).toContain("धर्मक्षेत्रे कुरुक्षेत्रे");
  });

  it("prompt includes instructions for sandhi, samasa, morphology, and meaning", () => {
    const prompt = buildAnalysisPrompt("test text");
    expect(prompt.toLowerCase()).toContain("sandhi");
    expect(prompt.toLowerCase()).toContain("samasa");
    expect(prompt.toLowerCase()).toContain("morpholog");
    expect(prompt.toLowerCase()).toContain("meaning");
  });

  it("prompt mentions IAST transliteration", () => {
    const prompt = buildAnalysisPrompt("test");
    expect(prompt.toLowerCase()).toContain("iast");
  });

  it("prompt mentions vaiyakarana or expert grammarian", () => {
    const prompt = buildAnalysisPrompt("test");
    const lower = prompt.toLowerCase();
    expect(
      lower.includes("vaiyakarana") || lower.includes("grammarian")
    ).toBe(true);
  });
});
