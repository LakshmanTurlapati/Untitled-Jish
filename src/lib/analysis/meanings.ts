/**
 * Meanings enrichment module.
 * Combines dictionary definitions (MW + Apte) with LLM contextual meanings,
 * tracking the source of each meaning via the meaning_source field.
 */

import {
  lookupByStem,
  lookupByHeadword,
} from "@/lib/dictionary/lookup";
import type { DictionaryEntry } from "@/lib/dictionary/schema";
import type { AnalyzedWord, EnrichedWord, MeaningSource } from "./types";

/**
 * Enrich an analyzed word with dictionary definitions from MW and Apte.
 *
 * Lookup strategy:
 * 1. Try lookupByStem using the morphology stem in IAST
 * 2. If no entries found, fall back to lookupByHeadword with the stem
 *
 * The meaning_source field indicates provenance:
 * - 'both': dictionary definitions exist (alongside LLM contextual_meaning)
 * - 'ai': no dictionary definitions found, only LLM contextual_meaning
 *
 * @param word - An analyzed word from the pipeline
 * @returns EnrichedWord with dictionary definitions and source tracking
 */
export function enrichWithMeanings(word: AnalyzedWord): EnrichedWord {
  const stem = word.morphology.stem;

  // Step 1: Try stem-based lookup
  let { entries } = lookupByStem(stem, "iast");

  // Step 2: Fall back to headword lookup if stem lookup returned nothing
  if (entries.length === 0) {
    entries = lookupByHeadword(stem, "iast");
  }

  // Extract MW and Apte definitions separately
  const mwDefinitions = entries
    .filter((e: DictionaryEntry) => e.dictionary === "mw")
    .map((e: DictionaryEntry) => e.definition);

  const apteDefinitions = entries
    .filter((e: DictionaryEntry) => e.dictionary === "ap90")
    .map((e: DictionaryEntry) => e.definition);

  // Determine meaning source:
  // 'both' when any dictionary definitions exist (since contextual_meaning from LLM is always present)
  // 'ai' when no dictionary definitions found
  const hasDictionaryDefs = mwDefinitions.length > 0 || apteDefinitions.length > 0;
  const meaningSource: MeaningSource = hasDictionaryDefs ? "both" : "ai";

  return {
    ...word,
    mw_definitions: mwDefinitions,
    apte_definitions: apteDefinitions,
    meaning_source: meaningSource,
  };
}
