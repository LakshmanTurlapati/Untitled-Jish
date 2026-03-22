/**
 * Main analysis pipeline orchestrator.
 * Coordinates LLM analysis via Grok, then enriches results
 * with INRIA stem index validation.
 */

import { generateText, Output } from "ai";
import { xai } from "@ai-sdk/xai";
import { FullAnalysisSchema } from "./schemas";
import { buildAnalysisPrompt } from "./prompts";
import { parseSandhiFromLLM } from "./sandhi";
import { parseSamasaFromLLM } from "./samasa";
import { enrichWithStemIndex } from "./morphology";
import { requireEnv } from "@/lib/api/env";
import type { AnalysisResult, AnalyzedWord } from "./types";

/**
 * Analyze a Sanskrit text passage.
 *
 * Pipeline:
 * 1. Send text to Grok with structured output schema for sandhi, samasa,
 *    morphology, and meaning analysis
 * 2. Parse and type each word's sandhi and samasa information
 * 3. Validate each word against the INRIA stem index
 * 4. Return typed AnalysisResult with all enriched words
 *
 * @param text - Sanskrit text in Devanagari script
 * @returns Typed analysis result with INRIA-validated morphology
 * @throws Error if LLM returns null/undefined output
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  // Validate API key before making any LLM calls
  requireEnv("XAI_API_KEY");

  // Step 1: LLM analysis with structured output
  const { output } = await generateText({
    model: xai("grok-4-1-fast-non-reasoning"),
    output: Output.object({ schema: FullAnalysisSchema }),
    prompt: buildAnalysisPrompt(text),
  });

  if (!output) {
    throw new Error(
      "LLM analysis failed: structured output was null. The model may have returned content that did not match the expected schema (FullAnalysisSchema). Check the prompt and schema compatibility."
    );
  }

  // Step 2: Enrich each word with sandhi/samasa parsing and INRIA validation
  const words: AnalyzedWord[] = output.words.map((llmWord) => {
    const sandhi = parseSandhiFromLLM(llmWord);
    const samasa = parseSamasaFromLLM(llmWord);
    const inria = enrichWithStemIndex(llmWord.iast);

    return {
      original: llmWord.original,
      iast: llmWord.iast,
      sandhi,
      morphology: llmWord.morphology,
      samasa,
      contextual_meaning: llmWord.contextual_meaning,
      inria_validated: inria.inria_validated,
      inria_grammar: inria.inria_grammar,
    };
  });

  return {
    input_text: text,
    words,
    raw_llm_output: output,
  };
}
