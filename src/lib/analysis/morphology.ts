/**
 * INRIA stem index validation for morphological analysis.
 * Cross-references LLM morphological claims against the INRIA stem index
 * (1.9M inflection-to-stem mappings) built in Phase 1.
 */

import { lookupByStem } from "@/lib/dictionary/lookup";

/**
 * Validate a word's morphology against the INRIA stem index.
 * Queries the stem index for the given IAST form and returns
 * whether a match was found along with the grammar info.
 *
 * @param iast - Word in IAST transliteration
 * @returns Validation result with INRIA grammar info
 */
export function enrichWithStemIndex(iast: string): {
  inria_validated: boolean;
  inria_grammar: string | null;
} {
  const result = lookupByStem(iast, "iast");

  if (result.stems.length > 0) {
    return {
      inria_validated: true,
      inria_grammar: result.stems[0].grammar_info,
    };
  }

  return {
    inria_validated: false,
    inria_grammar: null,
  };
}
