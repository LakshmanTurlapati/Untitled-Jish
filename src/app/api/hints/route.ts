/**
 * POST /api/hints
 * Returns streaming AI-powered pramaana-backed hints for shloka interpretation.
 * Never provides the direct answer -- only nudges and guiding questions.
 *
 * Request body: { shlokaText: string, userInterpretation: string }
 * Response: Streaming text (AI SDK data stream format)
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";
import { requireEnv } from "@/lib/api/env";

const SHLOKA_HINT_SYSTEM_PROMPT = `You are a Sanskrit kaavya study companion.
Your role is to help students develop their own understanding of shlokas.

CRITICAL RULES:
1. NEVER provide the direct translation or interpretation of a shloka
2. ALWAYS respond with hints, nudges, and guiding questions
3. Reference pramaana (authoritative sources) -- cite commentaries like
   Mallinatha, Sridhara, or relevant shastra references
4. Point to word roots (dhatu), grammar (vyakarana), and context clues
5. If the student's interpretation is on the right track, encourage them
6. If the student's interpretation is off, gently redirect with a hint
7. Search the internet for relevant pramaana before responding

FORMAT: Respond with 2-3 short hints/nudges, each on a new line starting with ">".
Each hint should cite a pramaana where possible.
Keep each hint to 1-2 sentences.`;

export async function POST(request: NextRequest) {
  try {
    requireEnv("XAI_API_KEY");

    const body = await request.json();
    const { shlokaText, userInterpretation } = body;

    if (
      !shlokaText ||
      typeof shlokaText !== "string" ||
      shlokaText.trim() === ""
    ) {
      return NextResponse.json(
        { error: "shlokaText is required" },
        { status: 400 }
      );
    }

    if (
      !userInterpretation ||
      typeof userInterpretation !== "string" ||
      userInterpretation.trim() === ""
    ) {
      return NextResponse.json(
        { error: "userInterpretation is required" },
        { status: 400 }
      );
    }

    const result = await streamText({
      model: xai("grok-3-mini"),
      system: SHLOKA_HINT_SYSTEM_PROMPT,
      prompt: `Shloka:\n${shlokaText}\n\nMy interpretation:\n${userInterpretation}\n\nPlease provide hints based on pramaana.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Hints API error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          "Could not load hints right now. Check your connection and try again.",
      },
      { status: 500 }
    );
  }
}
