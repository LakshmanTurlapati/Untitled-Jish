/**
 * Compound (samasa) decomposition logic and type extraction from LLM output.
 */

import type { z } from "zod";
import type { SamasaInfo } from "./types";
import type { WordSchema } from "./schemas";

export type { SamasaInfo } from "./types";

/**
 * Extract samasa (compound) information from an LLM-analyzed word.
 * Returns undefined for non-compound words.
 */
export function parseSamasaFromLLM(
  llmWord: z.infer<typeof WordSchema>
): SamasaInfo | undefined {
  if (!llmWord.is_compound || !llmWord.samasa) {
    return undefined;
  }

  return {
    compound: llmWord.samasa.compound,
    is_compound: llmWord.samasa.is_compound,
    samasa_type: llmWord.samasa.samasa_type,
    components: llmWord.samasa.components,
  };
}
