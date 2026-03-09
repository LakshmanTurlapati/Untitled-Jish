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
 * Clean up Apte definition text for display.
 * Removes CDSL markup artifacts that survived the import-time cleaning.
 */
function formatApteDefinition(raw: string): string {
  let text = raw;

  // Remove {%...%} abbreviation markers, keep inner text
  text = text.replace(/\{%([^%]*)%\}/g, "$1");
  // Remove {cNc} verb class markers (e.g., {c10c})
  text = text.replace(/\{c\d+c\}/g, "");
  // Remove [PageNNNN-x+ NN] page references
  text = text.replace(/\[Page\d+[a-z]?\+?\s*\d*\]/g, "");
  // Remove [Page line-break info]
  text = text.replace(/\[Page\d+-[a-z]\+\s*\d+\]/g, "");

  // Truncate at compound section (--Comp.) to keep core definition
  const compIdx = text.indexOf("--Comp.");
  if (compIdx > 0) text = text.substring(0, compIdx);

  // Convert "--N " numbered senses to "N. " for readability
  text = text.replace(/\s*--(\d+)\s+/g, " $1. ");
  // Convert leading "--word" subsense markers to "; word"
  text = text.replace(/\s*--(\w)/g, "; $1");

  // Clean up double spaces and trim
  text = text.replace(/\s+/g, " ").trim();

  // Truncate very long definitions to ~500 chars at a sentence boundary
  if (text.length > 500) {
    const cutoff = text.lastIndexOf(".", 500);
    if (cutoff > 200) {
      text = text.substring(0, cutoff + 1);
    } else {
      text = text.substring(0, 500).trimEnd() + "...";
    }
  }

  return text;
}

/**
 * Clean up MW definition text for display.
 * MW definitions are cleaner but can still be very long.
 */
function formatMwDefinition(raw: string): string {
  let text = raw;

  // Truncate very long definitions to ~500 chars at a natural break
  if (text.length > 500) {
    const cutoff = text.lastIndexOf(",", 500);
    if (cutoff > 200) {
      text = text.substring(0, cutoff);
    } else {
      text = text.substring(0, 500).trimEnd();
    }
    text += "...";
  }

  return text;
}

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

  // Extract MW and Apte definitions separately, with formatting
  const mwDefinitions = entries
    .filter((e: DictionaryEntry) => e.dictionary === "mw")
    .map((e: DictionaryEntry) => formatMwDefinition(e.definition));

  const apteDefinitions = entries
    .filter((e: DictionaryEntry) => e.dictionary === "ap90")
    .map((e: DictionaryEntry) => formatApteDefinition(e.definition));

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
