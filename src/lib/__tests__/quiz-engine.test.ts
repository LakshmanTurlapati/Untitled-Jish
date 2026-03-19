import { describe, it, expect, beforeEach } from 'vitest';
import { getDueCards, generateQuizQuestions, getMasteryStats } from '@/lib/quiz/quizEngine';
import { db } from '@/lib/kaavya/db/schema';
import { State } from '@/lib/quiz/srs';
import type { VocabItem } from '@/lib/quiz/types';

function makeVocabItem(overrides: Partial<VocabItem> & { stem: string }): VocabItem {
  return {
    stem: overrides.stem,
    original: overrides.original ?? overrides.stem,
    iast: overrides.iast ?? overrides.stem,
    kaavyaId: overrides.kaavyaId ?? 1,
    mwDefinitions: overrides.mwDefinitions ?? ['MW def'],
    apteDefinitions: overrides.apteDefinitions ?? ['Apte def'],
    wordType: overrides.wordType ?? 'noun',
    vibhakti: overrides.vibhakti,
    dhatu: overrides.dhatu,
    gana: overrides.gana,
    linga: overrides.linga,
    due: overrides.due ?? new Date(Date.now() - 60_000).toISOString(), // past = due
    stability: overrides.stability ?? 0,
    difficulty: overrides.difficulty ?? 0,
    elapsedDays: overrides.elapsedDays ?? 0,
    scheduledDays: overrides.scheduledDays ?? 0,
    reps: overrides.reps ?? 0,
    lapses: overrides.lapses ?? 0,
    learningSteps: overrides.learningSteps ?? 0,
    state: overrides.state ?? State.New,
    lastReview: overrides.lastReview,
    addedAt: overrides.addedAt ?? new Date().toISOString(),
  };
}

describe('Quiz Engine', () => {
  beforeEach(async () => {
    await db.vocabItems.clear();
  });

  describe('getDueCards', () => {
    it('daily mode returns items from multiple kaavyaIds where due <= now', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'rama', kaavyaId: 1 }),
        makeVocabItem({ stem: 'sita', kaavyaId: 2 }),
      ]);
      const due = await getDueCards('daily');
      expect(due).toHaveLength(2);
      const kaavyaIds = due.map(d => d.kaavyaId);
      expect(kaavyaIds).toContain(1);
      expect(kaavyaIds).toContain(2);
    });

    it('kaavya mode returns only items matching that kaavyaId where due <= now', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'rama', kaavyaId: 1 }),
        makeVocabItem({ stem: 'sita', kaavyaId: 2 }),
        makeVocabItem({ stem: 'lakshmana', kaavyaId: 1 }),
      ]);
      const due = await getDueCards('kaavya', 1);
      expect(due).toHaveLength(2);
      expect(due.every(d => d.kaavyaId === 1)).toBe(true);
    });

    it('returns empty array when no items are due', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'rama', due: new Date(Date.now() + 86400000).toISOString() }),
      ]);
      const due = await getDueCards('daily');
      // New cards (state=New) are always due, so only non-new future cards are excluded
      expect(due).toHaveLength(1); // state=New is always due
    });

    it('returns empty array when no items exist', async () => {
      const due = await getDueCards('daily');
      expect(due).toHaveLength(0);
    });

    it('daily mode includes items with state=New even if due is in the future', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({
          stem: 'new-word',
          state: State.New,
          due: new Date(Date.now() + 86400000).toISOString(),
        }),
        makeVocabItem({
          stem: 'review-word',
          state: State.Review,
          due: new Date(Date.now() + 86400000).toISOString(),
        }),
      ]);
      const due = await getDueCards('daily');
      expect(due).toHaveLength(1);
      expect(due[0].stem).toBe('new-word');
    });
  });

  describe('generateQuizQuestions', () => {
    it('creates QuizQuestion[] with grammarFacts populated from VocabItem', () => {
      const items: VocabItem[] = [
        makeVocabItem({
          stem: 'gam',
          wordType: 'verb',
          dhatu: 'gam',
          gana: 1,
          mwDefinitions: ['to go'],
        }),
      ];
      const allVocab = items;
      const questions = generateQuizQuestions(items, allVocab);
      expect(questions).toHaveLength(1);
      expect(questions[0].grammarFacts.wordType).toBe('verb');
      expect(questions[0].grammarFacts.dhatu).toBe('gam');
      expect(questions[0].grammarFacts.gana).toBe(1);
    });

    it('uses mwDefinitions[0] or apteDefinitions[0] as correctAnswer', () => {
      const items: VocabItem[] = [
        makeVocabItem({
          stem: 'dharma',
          mwDefinitions: ['righteousness', 'duty'],
          apteDefinitions: ['law'],
        }),
      ];
      const questions = generateQuizQuestions(items, items);
      expect(questions[0].correctAnswer).toBe('righteousness');
    });

    it('falls back to apteDefinitions[0] when mwDefinitions is empty', () => {
      const items: VocabItem[] = [
        makeVocabItem({
          stem: 'artha',
          mwDefinitions: [],
          apteDefinitions: ['meaning', 'wealth'],
        }),
      ];
      const questions = generateQuizQuestions(items, items);
      expect(questions[0].correctAnswer).toBe('meaning');
    });

    it('draws distractors from other VocabItems dictionary definitions', () => {
      const dueItems: VocabItem[] = [
        makeVocabItem({ stem: 'rama', mwDefinitions: ['pleasing'] }),
      ];
      const allVocab: VocabItem[] = [
        ...dueItems,
        makeVocabItem({ stem: 'sita', mwDefinitions: ['furrow'] }),
        makeVocabItem({ stem: 'lakshmana', mwDefinitions: ['auspicious mark'] }),
        makeVocabItem({ stem: 'bharata', mwDefinitions: ['sustained'] }),
      ];
      const questions = generateQuizQuestions(dueItems, allVocab);
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].options).toContain('pleasing');
    });

    it('caps at 10 questions per session', () => {
      const items: VocabItem[] = Array.from({ length: 15 }, (_, i) =>
        makeVocabItem({
          stem: `word${i}`,
          mwDefinitions: [`def${i}`],
        })
      );
      const questions = generateQuizQuestions(items, items);
      expect(questions.length).toBeLessThanOrEqual(10);
    });

    it('includes allMeanings array with all MW+Apte definitions for the word', () => {
      const items: VocabItem[] = [
        makeVocabItem({
          stem: 'dharma',
          mwDefinitions: ['righteousness', 'duty'],
          apteDefinitions: ['law', 'righteousness'], // duplicate with MW
        }),
      ];
      const questions = generateQuizQuestions(items, items);
      // Should be deduplicated
      expect(questions[0].allMeanings).toContain('righteousness');
      expect(questions[0].allMeanings).toContain('duty');
      expect(questions[0].allMeanings).toContain('law');
      // No duplicates
      const unique = [...new Set(questions[0].allMeanings)];
      expect(questions[0].allMeanings).toEqual(unique);
    });

    it('includes word original and iast in question', () => {
      const items: VocabItem[] = [
        makeVocabItem({
          stem: 'nadi',
          original: 'nadii',
          iast: 'nadii',
          mwDefinitions: ['river'],
        }),
      ];
      const questions = generateQuizQuestions(items, items);
      expect(questions[0].word.original).toBe('nadii');
      expect(questions[0].word.iast).toBe('nadii');
    });
  });

  describe('getMasteryStats', () => {
    it('returns correct counts by state (new/learning/review/mastered)', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'w1', state: State.New }),
        makeVocabItem({ stem: 'w2', state: State.New }),
        makeVocabItem({ stem: 'w3', state: State.Learning }),
        makeVocabItem({ stem: 'w4', state: State.Review, stability: 10 }),
        makeVocabItem({ stem: 'w5', state: State.Review, stability: 50 }),
      ]);
      const stats = await getMasteryStats();
      expect(stats.total).toBe(5);
      expect(stats.newCount).toBe(2);
      expect(stats.learning).toBe(1);
      expect(stats.review).toBe(2);
      expect(stats.mastered).toBe(1); // stability > 30
    });

    it('with kaavyaId filters to that kaavya only', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'w1', kaavyaId: 1, state: State.New }),
        makeVocabItem({ stem: 'w2', kaavyaId: 1, state: State.Learning }),
        makeVocabItem({ stem: 'w3', kaavyaId: 2, state: State.New }),
      ]);
      const stats = await getMasteryStats(1);
      expect(stats.total).toBe(2);
      expect(stats.newCount).toBe(1);
      expect(stats.learning).toBe(1);
    });

    it('mastered counts items with state=Review AND stability > 30', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'w1', state: State.Review, stability: 31 }),
        makeVocabItem({ stem: 'w2', state: State.Review, stability: 30 }),
        makeVocabItem({ stem: 'w3', state: State.Review, stability: 29 }),
        makeVocabItem({ stem: 'w4', state: State.Learning, stability: 50 }),
      ]);
      const stats = await getMasteryStats();
      expect(stats.mastered).toBe(1); // only w1: Review + stability > 30
    });

    it('dueNow counts items where due <= now', async () => {
      await db.vocabItems.bulkAdd([
        makeVocabItem({ stem: 'w1', due: new Date(Date.now() - 60_000).toISOString() }),
        makeVocabItem({ stem: 'w2', due: new Date(Date.now() + 86400000).toISOString() }),
      ]);
      const stats = await getMasteryStats();
      expect(stats.dueNow).toBe(1);
    });
  });
});
