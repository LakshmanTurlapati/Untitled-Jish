import { describe, it, expect } from 'vitest';
import { getCurrentRank, getNextRank, getRankProgress } from '@/lib/gamification/rankSystem';
import { RANK_TIERS } from '@/lib/gamification/types';

describe('getCurrentRank', () => {
  it('returns Shishya tier for (0, 0)', () => {
    const rank = getCurrentRank(0, 0);
    expect(rank.sanskritName).toBe('Shishya');
  });

  it('returns Adhyayin tier for (10, 0)', () => {
    const rank = getCurrentRank(10, 0);
    expect(rank.sanskritName).toBe('Adhyayin');
  });

  it('returns Vidvan tier for (50, 1)', () => {
    const rank = getCurrentRank(50, 1);
    expect(rank.sanskritName).toBe('Vidvan');
  });

  it('returns Adhyayin when mastered=50 but kaavyas=0 (both criteria must be met)', () => {
    const rank = getCurrentRank(50, 0);
    expect(rank.sanskritName).toBe('Adhyayin');
  });

  it('returns Mahavidvan tier for (500, 5)', () => {
    const rank = getCurrentRank(500, 5);
    expect(rank.sanskritName).toBe('Mahavidvan');
  });
});

describe('getNextRank', () => {
  it('returns Adhyayin for Shishya', () => {
    const next = getNextRank(RANK_TIERS[0]);
    expect(next).not.toBeNull();
    expect(next!.sanskritName).toBe('Adhyayin');
  });

  it('returns null for Mahavidvan (max tier)', () => {
    const next = getNextRank(RANK_TIERS[RANK_TIERS.length - 1]);
    expect(next).toBeNull();
  });
});

describe('getRankProgress', () => {
  it('returns percentage toward next tier', () => {
    const progress = getRankProgress(5, 0);
    expect(progress.current.sanskritName).toBe('Shishya');
    expect(progress.next).not.toBeNull();
    expect(progress.next!.sanskritName).toBe('Adhyayin');
    expect(progress.progressPercent).toBe(50); // 5/10 mastered = 50%
  });

  it('returns 100% for max tier', () => {
    const progress = getRankProgress(500, 5);
    expect(progress.progressPercent).toBe(100);
  });
});
