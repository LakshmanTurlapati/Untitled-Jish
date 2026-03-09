import { describe, it, expect, beforeAll } from "vitest";
import { z } from "zod";
import type { SamasaInfo } from "@/lib/analysis/types";

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

describe("parseSamasaFromLLM", () => {
  let parseSamasaFromLLM: typeof import("@/lib/analysis/samasa").parseSamasaFromLLM;

  beforeAll(async () => {
    const mod = await import("@/lib/analysis/samasa");
    parseSamasaFromLLM = mod.parseSamasaFromLLM;
  });

  it("returns SamasaInfo for compound words", () => {
    const llmWord = {
      original: "धर्मक्षेत्र",
      iast: "dharmakṣetra",
      sandhi_type: "none" as const,
      is_compound: true,
      samasa: {
        compound: "धर्मक्षेत्र",
        is_compound: true,
        samasa_type: "tatpurusha" as const,
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
      morphology: { stem: "dharmakṣetra", word_type: "noun" as const },
      contextual_meaning: "the field of dharma",
    };

    const result: SamasaInfo | undefined = parseSamasaFromLLM(llmWord);
    expect(result).toBeDefined();
    expect(result!.is_compound).toBe(true);
    expect(result!.samasa_type).toBe("tatpurusha");
    expect(result!.components).toHaveLength(2);
  });

  it("returns undefined for non-compound words", () => {
    const llmWord = {
      original: "धर्म",
      iast: "dharma",
      sandhi_type: "none" as const,
      is_compound: false,
      morphology: { stem: "dharma", word_type: "noun" as const },
      contextual_meaning: "righteousness",
    };

    const result = parseSamasaFromLLM(llmWord);
    expect(result).toBeUndefined();
  });

  it("extracts compound components with meanings and roles", () => {
    const llmWord = {
      original: "कुरुक्षेत्र",
      iast: "kurukṣetra",
      sandhi_type: "none" as const,
      is_compound: true,
      samasa: {
        compound: "कुरुक्षेत्र",
        is_compound: true,
        samasa_type: "tatpurusha" as const,
        components: [
          {
            word: "कुरु",
            iast: "kuru",
            meaning: "Kuru dynasty",
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
      morphology: { stem: "kurukṣetra", word_type: "noun" as const },
      contextual_meaning: "field of the Kurus",
    };

    const result = parseSamasaFromLLM(llmWord);
    expect(result).toBeDefined();
    expect(result!.components![0].iast).toBe("kuru");
    expect(result!.components![1].meaning).toBe("field");
  });
});
