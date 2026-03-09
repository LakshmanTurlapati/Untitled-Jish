/**
 * Vocabulary extraction from enriched analysis results.
 * Filters common particles, deduplicates by stem, and maps
 * to the VocabularyWord type for study features.
 */

import type { EnrichedWord } from "@/lib/analysis/types";
import type { VocabularyWord } from "@/lib/study/types";
import { COMMON_PARTICLES } from "@/lib/study/particles";

/**
 * Extract unique vocabulary words from an analysis result.
 * - Filters out common Sanskrit particles (ca, tu, hi, etc.)
 * - Deduplicates by stem (keeps first occurrence)
 * - Preserves appearance order from the original text
 */
export function extractVocabulary(words: EnrichedWord[]): VocabularyWord[] {
  const seenStems = new Set<string>();
  const result: VocabularyWord[] = [];

  for (const word of words) {
    // Filter particles
    if (COMMON_PARTICLES.has(word.iast.toLowerCase())) {
      continue;
    }

    // Deduplicate by stem
    const stemKey = word.morphology.stem.toLowerCase();
    if (seenStems.has(stemKey)) {
      continue;
    }
    seenStems.add(stemKey);

    result.push({
      original: word.original,
      iast: word.iast,
      stem: word.morphology.stem,
      wordType: word.morphology.word_type,
      linga: word.morphology.linga,
      contextualMeaning: word.contextual_meaning,
      mwDefinition: word.mw_definitions[0] ?? null,
    });
  }

  return result;
}
