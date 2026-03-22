/**
 * POST /api/quiz/populate
 * Analyzes kaavya text and returns EnrichedWord[] for client-side vocabulary population.
 *
 * Request body: { text: string, kaavyaId: number }
 * Response: { words: EnrichedWord[], kaavyaId: number }
 *
 * The client receives EnrichedWord[] and calls populateVocabulary() locally
 * since IndexedDB is client-side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeText } from '@/lib/analysis/pipeline';
import { enrichWithMeanings } from '@/lib/analysis/meanings';

const PopulateSchema = z.object({
  text: z.string().min(1),
  kaavyaId: z.number().int().positive(),
});

const MAX_WORDS_PER_CALL = 50;

/**
 * Split text into chunks by double newlines or shloka boundaries.
 * Returns an array of non-empty text segments.
 */
function chunkText(text: string): string[] {
  // Split by double newlines (shloka/paragraph boundaries)
  const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 0);
  // If no splits found, return as single chunk
  return chunks.length > 0 ? chunks : [text];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, kaavyaId } = PopulateSchema.parse(body);

    // For large texts, chunk and analyze each segment
    const chunks = chunkText(text);
    const allEnrichedWords = [];

    let failedCount = 0;

    for (const chunk of chunks) {
      try {
        const analysisResult = await analyzeText(chunk);

        for (const word of analysisResult.words) {
          try {
            const enriched = enrichWithMeanings(word);
            allEnrichedWords.push(enriched);
          } catch (wordErr) {
            failedCount++;
            console.error('Word enrichment failed:', {
              word: word.original || 'unknown',
              error: wordErr instanceof Error ? wordErr.message : String(wordErr),
            });
          }
        }
      } catch (chunkErr) {
        failedCount++;
        console.error('Chunk analysis failed:', {
          chunkLength: chunk.length,
          error: chunkErr instanceof Error ? chunkErr.message : String(chunkErr),
        });
      }

      // Cap total words to avoid timeouts
      if (allEnrichedWords.length >= MAX_WORDS_PER_CALL) {
        break;
      }
    }

    // Trim to cap
    const capped = allEnrichedWords.slice(0, MAX_WORDS_PER_CALL);

    return NextResponse.json({ words: capped, kaavyaId, failedCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error("Quiz populate API error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Analysis failed', detail: message },
      { status: 500 }
    );
  }
}
