import type { ReviewLog } from '@/lib/quiz/types';
import { XP_VALUES } from './types';

/**
 * Compute total XP from all-time review logs and kaavya completions.
 * Quiz XP = count of correct answers (rating >= 3) * quizCorrect XP value
 * Kaavya XP = completed kaavyas * kaavyaComplete XP value
 */
export function computeTotalXP(reviewLogs: ReviewLog[], completedKaavyas: number): number {
  const correctCount = reviewLogs.filter((log) => log.rating >= 3).length;
  const quizXP = correctCount * XP_VALUES.quizCorrect;
  const kaavyaXP = completedKaavyas * XP_VALUES.kaavyaComplete;
  return quizXP + kaavyaXP;
}

/**
 * Compute XP earned in a single quiz session.
 */
export function computeQuizSessionXP(correctCount: number): number {
  return correctCount * XP_VALUES.quizCorrect;
}
