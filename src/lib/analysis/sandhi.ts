/**
 * Sandhi splitting logic and type extraction from LLM output.
 * Re-exports sandhi-related types for module cohesion.
 */

import type { z } from "zod";
import type { SandhiInfo } from "./types";
import type { WordSchema } from "./schemas";

export type { SandhiInfo } from "./types";

/**
 * Extract sandhi information from an LLM-analyzed word.
 * Maps the LLM structured output to the typed SandhiInfo interface.
 */
export function parseSandhiFromLLM(
  llmWord: z.infer<typeof WordSchema>
): SandhiInfo {
  return {
    sandhi_type: llmWord.sandhi_type,
  };
}
