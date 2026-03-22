/**
 * POST /api/analyze
 * Accepts Sanskrit text and returns enriched analysis with dictionary definitions.
 *
 * Request body: { text: string }
 * Response: { input_text, words: EnrichedWord[], timestamp }
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/analysis/pipeline";
import { enrichWithMeanings } from "@/lib/analysis/meanings";

export async function POST(request: NextRequest) {
  let text: unknown;
  try {
    const body = await request.json();
    text = body.text;

    // Validate input
    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Run analysis pipeline (LLM + INRIA validation)
    const analysisResult = await analyzeText(text);

    // Enrich each word with dictionary definitions
    const enrichedWords = analysisResult.words.map((word) =>
      enrichWithMeanings(word)
    );

    return NextResponse.json({
      input_text: analysisResult.input_text,
      words: enrichedWords,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Analyze API error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      textLength: typeof text === "string" ? text.length : "invalid",
    });
    return NextResponse.json(
      { error: "Analysis failed", detail: message },
      { status: 500 }
    );
  }
}
