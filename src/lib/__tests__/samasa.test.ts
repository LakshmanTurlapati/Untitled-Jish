import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("samasa schema validation", () => {
  let FullAnalysisSchema: z.ZodType;

  beforeAll(async () => {
    const mod = await import("@/lib/analysis/schemas");
    FullAnalysisSchema = mod.FullAnalysisSchema;
  });

  it("accepts a compound word with samasa info", () => {
    const data = {
      input_text: "धर्मक्षेत्र",
      words: [
        {
          original: "धर्मक्षेत्र",
          iast: "dharmakṣetra",
          sandhi_type: "none",
          is_compound: true,
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
          morphology: {
            stem: "dharmakṣetra",
            word_type: "noun",
            vibhakti: "prathamā",
            vacana: "ekavacana",
            linga: "napumsakalinga",
          },
          contextual_meaning: "the field of dharma",
        },
      ],
    };

    const result = FullAnalysisSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts a non-compound word without samasa info", () => {
    const data = {
      input_text: "धर्म",
      words: [
        {
          original: "धर्म",
          iast: "dharma",
          sandhi_type: "none",
          is_compound: false,
          morphology: {
            stem: "dharma",
            word_type: "noun",
          },
          contextual_meaning: "righteousness",
        },
      ],
    };

    const result = FullAnalysisSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid samasa_type", () => {
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
            samasa_type: "invalid_type",
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
    expect(result.success).toBe(false);
  });
});
