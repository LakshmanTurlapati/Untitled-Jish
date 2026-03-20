import { describe, it, expect } from 'vitest';
import {
  generateForgettingCurveData,
  getAtRiskWords,
  computeGrowthData,
  computeComprehensionMetrics,
} from '@/lib/gamification/metricsEngine';
import { State } from 'ts-fsrs';
import type { VocabItem } from '@/lib/quiz/types';
import type { ShlokaInterpretation, Kaavya } from '@/lib/kaavya/types';

function makeVocabItem(overrides: Partial<VocabItem>): VocabItem {
  return {
    stem: 'test',
    original: 'test',
    iast: 'test',
    kaavyaId: 1,
    mwDefinitions: ['def'],
    apteDefinitions: [],
    wordType: 'noun' as VocabItem['wordType'],
    due: new Date().toISOString(),
    stability: 5,
    difficulty: 0.3,
    elapsedDays: 0,
    scheduledDays: 1,
    reps: 1,
    lapses: 0,
    learningSteps: 0,
    state: State.Review,
    addedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('generateForgettingCurveData', () => {
  it('returns 31 points for maxDays=30', () => {
    const points = generateForgettingCurveData(10, 30);
    expect(points).toHaveLength(31);
  });

  it('day 0 has retrievability 100', () => {
    const points = generateForgettingCurveData(10, 30);
    expect(points[0].day).toBe(0);
    expect(points[0].retrievability).toBe(100);
  });

  it('retrievability decreases over days', () => {
    const points = generateForgettingCurveData(10, 30);
    expect(points[10].retrievability).toBeLessThan(points[0].retrievability);
    expect(points[20].retrievability).toBeLessThan(points[10].retrievability);
  });
});

describe('getAtRiskWords', () => {
  it('filters items with retrievability < threshold', () => {
    // Items with very low stability reviewed long ago should be at risk
    const items = [
      makeVocabItem({
        state: State.Review,
        stability: 0.5,
        reps: 3,
        elapsedDays: 30,
        scheduledDays: 1,
        due: new Date(Date.now() - 86400000 * 30).toISOString(),
        lastReview: new Date(Date.now() - 86400000 * 30).toISOString(),
      }),
      makeVocabItem({
        state: State.Review,
        stability: 100,
        reps: 10,
        elapsedDays: 1,
        scheduledDays: 100,
        due: new Date(Date.now() + 86400000 * 100).toISOString(),
        lastReview: new Date().toISOString(),
      }),
    ];
    const atRisk = getAtRiskWords(items, 0.7);
    // At least the low-stability item should be at risk
    expect(atRisk.length).toBeGreaterThanOrEqual(1);
  });

  it('excludes state=New items', () => {
    const items = [
      makeVocabItem({ state: State.New, stability: 0 }),
    ];
    const atRisk = getAtRiskWords(items, 0.7);
    expect(atRisk).toHaveLength(0);
  });
});

describe('computeGrowthData', () => {
  it('returns cumulative per-state word counts by date', () => {
    const items = [
      { addedAt: '2024-01-01T00:00:00Z', state: State.New },
      { addedAt: '2024-01-01T00:00:00Z', state: State.Learning },
      { addedAt: '2024-01-02T00:00:00Z', state: State.Review },
      { addedAt: '2024-01-02T00:00:00Z', state: State.New },
    ];
    const growth = computeGrowthData(items);
    expect(growth).toHaveLength(2);
    // Day 1: 1 new, 1 learning, 0 mastered, 2 total
    expect(growth[0]).toEqual({
      date: '2024-01-01',
      newCount: 1,
      learning: 1,
      mastered: 0,
      total: 2,
    });
    // Day 2: cumulative 2 new, 1 learning, 1 mastered, 4 total
    expect(growth[1]).toEqual({
      date: '2024-01-02',
      newCount: 2,
      learning: 1,
      mastered: 1,
      total: 4,
    });
  });

  it('returns empty array for empty input', () => {
    expect(computeGrowthData([])).toEqual([]);
  });
});

describe('computeComprehensionMetrics', () => {
  it('returns per-kaavya shloka explored counts', () => {
    const kaavyas: Kaavya[] = [
      {
        id: 1,
        title: 'Test Kaavya',
        sourceType: 'pasted',
        rawText: 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const interpretations: ShlokaInterpretation[] = [
      {
        kaavyaId: 1,
        shlokaText: 'shloka1',
        userInterpretation: 'meaning',
        hintsReceived: ['hint1', 'hint2'],
        createdAt: new Date(),
      },
      {
        kaavyaId: 1,
        shlokaText: 'shloka2',
        userInterpretation: 'meaning2',
        hintsReceived: [],
        createdAt: new Date(),
      },
    ];
    const metrics = computeComprehensionMetrics(interpretations, kaavyas);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].kaavyaId).toBe(1);
    expect(metrics[0].explored).toBe(2);
    expect(metrics[0].hintRatio).toBe(1); // (2 + 0) / 2 = 1
    expect(metrics[0].totalShlokas).toBeGreaterThan(0);
  });
});
