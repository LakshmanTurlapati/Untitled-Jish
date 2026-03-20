import { FSRS, generatorParameters } from 'ts-fsrs';
import { storableToCard } from '@/lib/quiz/srs';
import type { VocabItem } from '@/lib/quiz/types';
import type { ShlokaInterpretation, Kaavya } from '@/lib/kaavya/types';
import type { ForgettingCurvePoint, GrowthDataPoint, ComprehensionMetric } from './types';

const fsrs = new FSRS(generatorParameters());

/**
 * Generate forgetting curve data points for a given stability value.
 * Returns retrievability percentage (0-100) for each day from 0 to maxDays.
 */
export function generateForgettingCurveData(
  stability: number,
  maxDays: number = 30,
): ForgettingCurvePoint[] {
  const points: ForgettingCurvePoint[] = [];
  for (let day = 0; day <= maxDays; day++) {
    const r = fsrs.forgetting_curve(day, stability);
    points.push({
      day,
      retrievability: Math.round(r * 100),
    });
  }
  return points;
}

/**
 * Get vocabulary items that are at risk of being forgotten.
 * Excludes New items (state=0). Filters by retrievability threshold.
 */
export function getAtRiskWords(vocabItems: VocabItem[], threshold: number = 0.7): VocabItem[] {
  return vocabItems.filter((item) => {
    // Skip New items
    if (item.state === 0) return false;

    const card = storableToCard({
      due: item.due,
      stability: item.stability,
      difficulty: item.difficulty,
      elapsed_days: item.elapsedDays,
      scheduled_days: item.scheduledDays,
      reps: item.reps,
      lapses: item.lapses,
      learning_steps: item.learningSteps,
      state: item.state,
      last_review: item.lastReview,
    });

    const retrievability = fsrs.get_retrievability(card, new Date(), false);
    return (retrievability as number) < threshold;
  });
}

/**
 * Compute vocabulary growth data over time as cumulative per-state counts.
 * Each date shows a snapshot of all items added up to and including that date.
 */
export function computeGrowthData(
  vocabItems: { addedAt: string; state: number }[],
): GrowthDataPoint[] {
  if (vocabItems.length === 0) return [];

  // Sort by addedAt
  const sorted = [...vocabItems].sort((a, b) => a.addedAt.localeCompare(b.addedAt));

  // Group by date
  const dateMap = new Map<string, { addedAt: string; state: number }[]>();
  for (const item of sorted) {
    const date = item.addedAt.slice(0, 10);
    const existing = dateMap.get(date) || [];
    existing.push(item);
    dateMap.set(date, existing);
  }

  // Build cumulative counts
  const result: GrowthDataPoint[] = [];
  let cumulativeNew = 0;
  let cumulativeLearning = 0;
  let cumulativeMastered = 0;

  for (const [date, items] of dateMap) {
    for (const item of items) {
      if (item.state === 0) {
        cumulativeNew++;
      } else if (item.state === 1 || item.state === 3) {
        cumulativeLearning++;
      } else if (item.state === 2) {
        cumulativeMastered++;
      }
    }

    result.push({
      date,
      newCount: cumulativeNew,
      learning: cumulativeLearning,
      mastered: cumulativeMastered,
      total: cumulativeNew + cumulativeLearning + cumulativeMastered,
    });
  }

  return result;
}

/**
 * Compute comprehension metrics per kaavya from interpretations.
 */
export function computeComprehensionMetrics(
  interpretations: ShlokaInterpretation[],
  kaavyas: Kaavya[],
): ComprehensionMetric[] {
  // Group interpretations by kaavyaId
  const byKaavya = new Map<number, ShlokaInterpretation[]>();
  for (const interp of interpretations) {
    const existing = byKaavya.get(interp.kaavyaId) || [];
    existing.push(interp);
    byKaavya.set(interp.kaavyaId, existing);
  }

  return kaavyas
    .filter((k) => k.id !== undefined && byKaavya.has(k.id))
    .map((kaavya) => {
      const interps = byKaavya.get(kaavya.id!)!;
      const explored = interps.length;
      const totalHints = interps.reduce((sum, i) => sum + i.hintsReceived.length, 0);
      const hintRatio = explored > 0 ? totalHints / explored : 0;

      // Estimate total shlokas from raw text
      const nonEmptyLines = kaavya.rawText.split('\n').filter((l) => l.trim()).length;
      const totalShlokas = Math.max(1, Math.floor(nonEmptyLines / 2));

      return {
        kaavyaId: kaavya.id!,
        kaavyaTitle: kaavya.title,
        totalShlokas,
        explored,
        hintRatio,
      };
    });
}
