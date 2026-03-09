/**
 * Quiz generation from vocabulary words.
 * Creates MCQ questions with contextual meanings as answers
 * and sibling word meanings as distractors.
 */

import type { VocabularyWord } from "@/lib/study/types";
import type { QuizQuestion } from "@/lib/study/types";

const MAX_QUESTIONS = 10;
const OPTIONS_PER_QUESTION = 4;

/**
 * Pick n unique random items from an array.
 * Returns up to arr.length items if n > arr.length.
 */
export function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

/**
 * Shuffle an array in place (Fisher-Yates) and return it.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate quiz questions from vocabulary words.
 *
 * Each question has 4 options: the correct contextualMeaning + 3 distractors.
 * Distractors are drawn from other vocabulary words' meanings first,
 * then padded with fallbackMeanings if needed.
 *
 * Returns empty array if there aren't enough total meanings for 4 options.
 */
export function generateQuiz(
  vocabulary: VocabularyWord[],
  fallbackMeanings?: string[]
): QuizQuestion[] {
  // Collect all unique meanings available for distractors
  const vocabMeanings = vocabulary.map((w) => w.contextualMeaning);
  const allMeanings = [...new Set([...vocabMeanings, ...(fallbackMeanings ?? [])])];

  // Need at least 4 unique meanings total (1 correct + 3 distractors)
  if (allMeanings.length < OPTIONS_PER_QUESTION) {
    return [];
  }

  // Shuffle and cap at max questions
  const shuffled = shuffle([...vocabulary]);
  const selected = shuffled.slice(0, MAX_QUESTIONS);

  const questions: QuizQuestion[] = [];

  for (const word of selected) {
    const correctAnswer = word.contextualMeaning;

    // Gather distractor pool: all meanings except the correct one
    const distractorPool = allMeanings.filter((m) => m !== correctAnswer);

    // Pick 3 distractors
    const distractors = pickRandom(distractorPool, OPTIONS_PER_QUESTION - 1);

    // Build and shuffle options
    const options = shuffle([correctAnswer, ...distractors]);

    questions.push({
      word: { original: word.original, iast: word.iast },
      correctAnswer,
      options,
    });
  }

  return questions;
}
