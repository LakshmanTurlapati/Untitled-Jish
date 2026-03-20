import { RANK_TIERS, type RankTier } from './types';

/**
 * Get the current rank tier based on mastered word count and kaavyas read.
 * Both criteria must be met for a tier to qualify.
 * Iterates from highest to lowest, returns first match.
 */
export function getCurrentRank(masteredCount: number, kaavyasRead: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    const tier = RANK_TIERS[i];
    if (masteredCount >= tier.minMastered && kaavyasRead >= tier.minKaavyas) {
      return tier;
    }
  }
  return RANK_TIERS[0];
}

/**
 * Get the next rank tier after the given one, or null if at max.
 */
export function getNextRank(currentRank: RankTier): RankTier | null {
  const index = RANK_TIERS.findIndex((t) => t.name === currentRank.name);
  if (index < 0 || index >= RANK_TIERS.length - 1) {
    return null;
  }
  return RANK_TIERS[index + 1];
}

/**
 * Get rank progress including percentage toward next tier.
 * Progress is the minimum of mastered progress and kaavya progress.
 */
export function getRankProgress(
  masteredCount: number,
  kaavyasRead: number,
): { current: RankTier; next: RankTier | null; progressPercent: number } {
  const current = getCurrentRank(masteredCount, kaavyasRead);
  const next = getNextRank(current);

  if (!next) {
    return { current, next, progressPercent: 100 };
  }

  const masteredRange = next.minMastered - current.minMastered;
  const kaavyaRange = next.minKaavyas - current.minKaavyas;

  const masteredProgress = masteredRange > 0
    ? Math.min(((masteredCount - current.minMastered) / masteredRange) * 100, 100)
    : 100;

  const kaavyaProgress = kaavyaRange > 0
    ? Math.min(((kaavyasRead - current.minKaavyas) / kaavyaRange) * 100, 100)
    : 100;

  const progressPercent = Math.round(Math.min(masteredProgress, kaavyaProgress));

  return { current, next, progressPercent };
}

export { RANK_TIERS } from './types';
