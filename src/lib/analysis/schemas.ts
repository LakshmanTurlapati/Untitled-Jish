/**
 * Zod schemas for structured LLM output.
 * These schemas are passed to Output.object() for validated structured generation.
 * They mirror the TypeScript types in types.ts.
 */

import { z } from "zod";

/** Schema for morphological analysis of a single word */
export const MorphologySchema = z.object({
  stem: z.string().describe("Base stem/pratipadika for nominals, dhatu for verbs"),
  word_type: z
    .enum(["noun", "verb", "adjective", "indeclinable", "participle", "pronoun"])
    .describe("Grammatical category of the word"),
  vibhakti: z
    .string()
    .optional()
    .describe("Case (vibhakti) for nominals: prathamā, dvitīyā, etc."),
  vacana: z
    .enum(["ekavacana", "dvivacana", "bahuvacana"])
    .optional()
    .describe("Number: singular, dual, or plural"),
  linga: z
    .enum(["pullinga", "strilinga", "napumsakalinga"])
    .optional()
    .describe("Gender: masculine, feminine, or neuter"),
  dhatu: z
    .string()
    .optional()
    .describe("Verbal root for verb forms"),
  gana: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe("Verb class 1-10"),
  lakara: z
    .string()
    .optional()
    .describe("Tense/mood (lakāra) for verb forms"),
  purusha: z
    .string()
    .optional()
    .describe("Person for verb forms: prathama, madhyama, uttama"),
});

/** Schema for compound (samasa) decomposition */
export const SamasaSchema = z.object({
  compound: z.string().describe("The compound word in Devanagari"),
  is_compound: z.boolean().describe("Whether this word is a compound"),
  samasa_type: z
    .enum([
      "tatpurusha",
      "dvandva",
      "bahuvrihi",
      "avyayibhava",
      "karmadharaya",
      "dvigu",
      "none",
    ])
    .optional()
    .describe("Classification of the compound type"),
  components: z
    .array(
      z.object({
        word: z.string().describe("Component word in Devanagari"),
        iast: z.string().describe("IAST transliteration of the component"),
        meaning: z.string().describe("Meaning of this component"),
        role: z
          .string()
          .describe('Role in compound, e.g. "qualifier", "qualified"'),
      })
    )
    .optional()
    .describe("Constituent words of the compound"),
});

/** Schema for a single analyzed word in the LLM output */
export const WordSchema = z.object({
  original: z.string().describe("The word in Devanagari script"),
  iast: z.string().describe("IAST transliteration of the word"),
  sandhi_type: z
    .enum(["vowel", "consonant", "visarga", "none"])
    .describe("Type of sandhi joining this word to adjacent words"),
  is_compound: z
    .boolean()
    .describe("Whether this word is a compound (samasa)"),
  samasa: SamasaSchema.optional().describe(
    "Compound decomposition, present only if is_compound is true"
  ),
  morphology: MorphologySchema.describe("Morphological analysis of the word"),
  contextual_meaning: z
    .string()
    .describe("Meaning of this word in the context of the passage"),
});

/** Full analysis schema for structured LLM output */
export const FullAnalysisSchema = z.object({
  input_text: z.string().describe("The original input text"),
  words: z
    .array(WordSchema)
    .describe("Array of analyzed words after sandhi splitting"),
});
