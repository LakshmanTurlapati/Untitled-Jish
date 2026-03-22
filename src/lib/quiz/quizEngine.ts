import type { VocabItem, QuizQuestion, MasteryStats } from '@/lib/quiz/types';
import { isDue, State } from '@/lib/quiz/srs';
import { db } from '@/lib/kaavya/db/schema';
import { pickRandom } from '@/lib/study/quiz';

const MAX_QUESTIONS = 10;

/**
 * Get due vocabulary cards for quiz session.
 * - 'daily' mode: returns due items from ALL kaavyas (includes New cards always)
 * - 'kaavya' mode: returns due items from ONE specific kaavya
 */
export async function getDueCards(
  mode: 'daily' | 'kaavya',
  kaavyaId?: number
): Promise<VocabItem[]> {
  if (mode === 'kaavya' && kaavyaId !== undefined) {
    const items = await db.vocabItems
      .where('kaavyaId')
      .equals(kaavyaId)
      .toArray();
    return items.filter(item => isDue(item.due) || item.state === State.New);
  }

  // Daily mode: all items across all kaavyas
  const allItems = await db.vocabItems.toArray();
  return allItems.filter(item => isDue(item.due) || item.state === State.New);
}

/**
 * Generate quiz questions from due items.
 * - Caps at 10 questions per session
 * - Correct answer from mwDefinitions[0] or apteDefinitions[0] (never contextual)
 * - Distractors drawn from other vocabItems' dictionary definitions
 * - Includes grammarFacts from VocabItem morphology data
 */
export function generateQuizQuestions(
  dueItems: VocabItem[],
  allVocab: VocabItem[]
): QuizQuestion[] {
  // Shuffle and cap
  const shuffled = [...dueItems];
  shuffleArray(shuffled);
  const selected = shuffled.slice(0, MAX_QUESTIONS);

  const questions: QuizQuestion[] = [];

  for (const item of selected) {
    const correctAnswer =
      item.mwDefinitions[0] || item.apteDefinitions[0] || item.stem;

    // Deduplicated allMeanings
    const allMeanings = [
      ...new Set([...item.mwDefinitions, ...item.apteDefinitions]),
    ];

    const grammarFacts = {
      wordType: item.wordType,
      vibhakti: item.vibhakti,
      dhatu: item.dhatu,
      gana: item.gana,
      linga: item.linga,
    };

    // Build distractor pool from other vocabItems' ALL dictionary definitions
    const distractorPool = allVocab
      .filter(v => v.stem !== item.stem)
      .flatMap(v => [...v.mwDefinitions, ...v.apteDefinitions])
      .filter((d): d is string => !!d && d !== correctAnswer);

    // Remove duplicates from distractor pool
    const uniqueDistractors = [...new Set(distractorPool)];

    let distractors = pickRandom(uniqueDistractors, 3);

    // Pad if not enough distractors
    if (distractors.length < 3) {
      const remainingMeanings = allMeanings.filter(
        m => m !== correctAnswer && !distractors.includes(m)
      );
      distractors = [
        ...distractors,
        ...remainingMeanings.slice(0, 3 - distractors.length),
      ];
    }
    if (distractors.length < 3) {
      // Last resort: pad with stem (guard against stem === correctAnswer)
      while (distractors.length < 3) {
        distractors.push(item.stem !== correctAnswer ? item.stem : `(${item.iast})`);
      }
    }

    const options = [correctAnswer, ...distractors];
    // Safety: remove any distractor that somehow matches correctAnswer
    const safeOptions = options.filter((opt, idx) => idx === 0 || opt !== correctAnswer);
    // Re-pad if filtering removed options
    while (safeOptions.length < 4) {
      safeOptions.push(item.stem !== correctAnswer ? item.stem : `(${item.iast})`);
    }
    shuffleArray(safeOptions);

    questions.push({
      vocabItemId: item.id!,
      word: { original: item.original, iast: item.iast },
      grammarFacts,
      correctAnswer,
      options: safeOptions,
      allMeanings,
    });
  }

  return questions;
}

/**
 * Get mastery statistics across vocabulary.
 * - Optionally filter by kaavyaId
 * - mastered = state===Review AND stability > 30
 */
export async function getMasteryStats(
  kaavyaId?: number
): Promise<MasteryStats> {
  let items: VocabItem[];

  if (kaavyaId !== undefined) {
    items = await db.vocabItems
      .where('kaavyaId')
      .equals(kaavyaId)
      .toArray();
  } else {
    items = await db.vocabItems.toArray();
  }

  const now = new Date().toISOString();

  return {
    total: items.length,
    newCount: items.filter(i => i.state === State.New).length,
    learning: items.filter(
      i => i.state === State.Learning || i.state === State.Relearning
    ).length,
    review: items.filter(i => i.state === State.Review).length,
    mastered: items.filter(
      i => i.state === State.Review && i.stability > 30
    ).length,
    dueNow: items.filter(i => isDue(i.due)).length,
  };
}

/** Fisher-Yates shuffle in-place */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
