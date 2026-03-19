import type { EnrichedWord } from '@/lib/analysis/types';
import type { VocabItem } from '@/lib/quiz/types';
import { createNewCard, cardToStorable } from '@/lib/quiz/srs';
import { COMMON_PARTICLES } from '@/lib/study/particles';
import { db } from '@/lib/kaavya/db/schema';

/**
 * Extract vocabulary from analyzed words and persist to IndexedDB.
 * - Filters common particles
 * - Deduplicates by stem within the same kaavya
 * - Stores MW/Apte definitions directly (QUIZ-09: never conjured)
 * - Initializes FSRS card data for spaced repetition
 */
export async function populateVocabulary(
  words: EnrichedWord[],
  kaavyaId: number
): Promise<{ added: number; skipped: number }> {
  // Get existing stems for this kaavya to avoid duplicates
  const existing = await db.vocabItems
    .where('kaavyaId').equals(kaavyaId)
    .toArray();
  const existingStems = new Set(existing.map(v => v.stem.toLowerCase()));

  const seenStems = new Set<string>();
  const toAdd: VocabItem[] = [];
  let skipped = 0;

  for (const word of words) {
    // Filter particles
    if (COMMON_PARTICLES.has(word.iast.toLowerCase())) {
      skipped++;
      continue;
    }

    // Deduplicate by stem
    const stemKey = word.morphology.stem.toLowerCase();
    if (seenStems.has(stemKey) || existingStems.has(stemKey)) {
      skipped++;
      continue;
    }
    seenStems.add(stemKey);

    // Initialize FSRS card
    const card = createNewCard();
    const storable = cardToStorable(card);

    toAdd.push({
      stem: word.morphology.stem,
      original: word.original,
      iast: word.iast,
      kaavyaId,
      // Dictionary meanings only (QUIZ-09)
      mwDefinitions: word.mw_definitions,
      apteDefinitions: word.apte_definitions,
      // Grammar facts (QUIZ-03)
      wordType: word.morphology.word_type,
      vibhakti: word.morphology.vibhakti,
      dhatu: word.morphology.dhatu,
      gana: word.morphology.gana,
      linga: word.morphology.linga,
      // FSRS card state
      due: storable.due,
      stability: storable.stability,
      difficulty: storable.difficulty,
      elapsedDays: storable.elapsed_days,
      scheduledDays: storable.scheduled_days,
      reps: storable.reps,
      lapses: storable.lapses,
      learningSteps: storable.learning_steps,
      state: storable.state,
      lastReview: storable.last_review,
      // Timestamp
      addedAt: new Date().toISOString(),
    });
  }

  // Bulk add to IndexedDB
  if (toAdd.length > 0) {
    await db.vocabItems.bulkAdd(toAdd);
  }

  return { added: toAdd.length, skipped };
}
