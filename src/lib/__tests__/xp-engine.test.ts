import { describe, it, expect } from 'vitest';
import { computeTotalXP, computeQuizSessionXP } from '@/lib/gamification/xpEngine';
import type { ReviewLog } from '@/lib/quiz/types';
import { State } from 'ts-fsrs';

function makeLog(rating: number): ReviewLog {
  return {
    vocabItemId: 1,
    rating,
    state: State.Review,
    reviewedAt: new Date().toISOString(),
  };
}

describe('computeTotalXP', () => {
  it('returns 0 with 0 review logs and 0 kaavyas', () => {
    expect(computeTotalXP([], 0)).toBe(0);
  });

  it('returns 50 with 5 correct answers (rating >= 3)', () => {
    const logs = [
      makeLog(3), makeLog(4), makeLog(3), makeLog(3), makeLog(4),
    ];
    expect(computeTotalXP(logs, 0)).toBe(50);
  });

  it('returns 30 with 3 correct + 2 wrong (rating < 3)', () => {
    const logs = [
      makeLog(3), makeLog(1), makeLog(4), makeLog(2), makeLog(3),
    ];
    expect(computeTotalXP(logs, 0)).toBe(30);
  });

  it('returns 200 with 2 completed kaavyas', () => {
    expect(computeTotalXP([], 2)).toBe(200);
  });

  it('returns 250 with 5 correct answers + 2 kaavyas', () => {
    const logs = [
      makeLog(3), makeLog(4), makeLog(3), makeLog(3), makeLog(4),
    ];
    expect(computeTotalXP(logs, 2)).toBe(250);
  });
});

describe('computeQuizSessionXP', () => {
  it('returns 70 when score=7', () => {
    expect(computeQuizSessionXP(7)).toBe(70);
  });
});
