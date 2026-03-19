import { describe, it, expect, beforeEach } from 'vitest';
import { populateVocabulary } from '@/lib/quiz/vocabularyPopulator';
import { db } from '@/lib/kaavya/db/schema';
import { State } from '@/lib/quiz/srs';
import type { EnrichedWord } from '@/lib/analysis/types';

function makeWord(overrides: Partial<EnrichedWord> & { stem: string; iast: string }): EnrichedWord {
  return {
    original: overrides.original ?? overrides.iast,
    iast: overrides.iast,
    sandhi: { sandhi_type: 'none' },
    morphology: {
      stem: overrides.stem,
      word_type: overrides.morphology?.word_type ?? 'noun',
      vibhakti: overrides.morphology?.vibhakti,
      dhatu: overrides.morphology?.dhatu,
      gana: overrides.morphology?.gana,
      linga: overrides.morphology?.linga,
      ...(overrides.morphology ?? {}),
    },
    contextual_meaning: overrides.contextual_meaning ?? 'some AI meaning',
    inria_validated: false,
    inria_grammar: null,
    mw_definitions: overrides.mw_definitions ?? ['MW definition'],
    apte_definitions: overrides.apte_definitions ?? ['Apte definition'],
    meaning_source: overrides.meaning_source ?? 'dictionary',
  } as EnrichedWord;
}

describe('populateVocabulary', () => {
  beforeEach(async () => {
    await db.vocabItems.clear();
  });

  it('extracts words from EnrichedWord[] and returns count of added items', async () => {
    const words = [
      makeWord({ stem: 'rama', iast: 'raama' }),
      makeWord({ stem: 'sita', iast: 'siitaa' }),
    ];
    const result = await populateVocabulary(words, 1);
    expect(result.added).toBe(2);
    const stored = await db.vocabItems.toArray();
    expect(stored).toHaveLength(2);
  });

  it('filters out common particles (ca, tu, hi)', async () => {
    const words = [
      makeWord({ stem: 'ca', iast: 'ca' }),
      makeWord({ stem: 'tu', iast: 'tu' }),
      makeWord({ stem: 'hi', iast: 'hi' }),
      makeWord({ stem: 'rama', iast: 'raama' }),
    ];
    const result = await populateVocabulary(words, 1);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(3);
  });

  it('deduplicates stems within same kaavyaId (only first occurrence stored)', async () => {
    const words = [
      makeWord({ stem: 'rama', iast: 'raamah', mw_definitions: ['first'] }),
      makeWord({ stem: 'Rama', iast: 'raamam', mw_definitions: ['second'] }),
    ];
    const result = await populateVocabulary(words, 1);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    const stored = await db.vocabItems.toArray();
    expect(stored[0].mwDefinitions).toEqual(['first']);
  });

  it('mwDefinitions come from EnrichedWord.mw_definitions, not from contextual_meaning', async () => {
    const words = [
      makeWord({
        stem: 'dharma',
        iast: 'dharmah',
        mw_definitions: ['righteousness', 'duty'],
        contextual_meaning: 'DO NOT USE THIS',
      }),
    ];
    await populateVocabulary(words, 1);
    const stored = await db.vocabItems.toArray();
    expect(stored[0].mwDefinitions).toEqual(['righteousness', 'duty']);
  });

  it('apteDefinitions come from EnrichedWord.apte_definitions', async () => {
    const words = [
      makeWord({
        stem: 'artha',
        iast: 'arthah',
        apte_definitions: ['meaning', 'purpose', 'wealth'],
      }),
    ];
    await populateVocabulary(words, 1);
    const stored = await db.vocabItems.toArray();
    expect(stored[0].apteDefinitions).toEqual(['meaning', 'purpose', 'wealth']);
  });

  it('words with zero dictionary definitions are still included with empty arrays', async () => {
    const words = [
      makeWord({
        stem: 'unknown',
        iast: 'unknown',
        mw_definitions: [],
        apte_definitions: [],
      }),
    ];
    const result = await populateVocabulary(words, 1);
    expect(result.added).toBe(1);
    const stored = await db.vocabItems.toArray();
    expect(stored[0].mwDefinitions).toEqual([]);
    expect(stored[0].apteDefinitions).toEqual([]);
  });

  it('each VocabItem gets FSRS card data with state=New', async () => {
    const words = [makeWord({ stem: 'vidya', iast: 'vidyaa' })];
    await populateVocabulary(words, 1);
    const stored = await db.vocabItems.toArray();
    expect(stored[0].state).toBe(State.New);
    expect(stored[0].reps).toBe(0);
    expect(stored[0].lapses).toBe(0);
    expect(typeof stored[0].due).toBe('string');
    expect(typeof stored[0].stability).toBe('number');
    expect(typeof stored[0].difficulty).toBe('number');
  });

  it('grammar facts (wordType, vibhakti, dhatu, gana, linga) are extracted from morphology', async () => {
    const words = [
      makeWord({
        stem: 'gam',
        iast: 'gacchati',
        morphology: {
          stem: 'gam',
          word_type: 'verb',
          dhatu: 'gam',
          gana: 1,
          vibhakti: undefined,
          linga: undefined,
        },
      }),
      makeWord({
        stem: 'nadi',
        iast: 'nadii',
        morphology: {
          stem: 'nadi',
          word_type: 'noun',
          vibhakti: 'prathamaa',
          linga: 'strilinga',
          dhatu: undefined,
          gana: undefined,
        },
      }),
    ];
    await populateVocabulary(words, 1);
    const stored = await db.vocabItems.toArray();
    const verb = stored.find(v => v.stem === 'gam')!;
    expect(verb.wordType).toBe('verb');
    expect(verb.dhatu).toBe('gam');
    expect(verb.gana).toBe(1);

    const noun = stored.find(v => v.stem === 'nadi')!;
    expect(noun.wordType).toBe('noun');
    expect(noun.vibhakti).toBe('prathamaa');
    expect(noun.linga).toBe('strilinga');
  });

  it('does not re-add stems already in the database for the same kaavya', async () => {
    const words1 = [makeWord({ stem: 'rama', iast: 'raama' })];
    await populateVocabulary(words1, 1);

    const words2 = [
      makeWord({ stem: 'rama', iast: 'raamam' }),
      makeWord({ stem: 'sita', iast: 'siitaa' }),
    ];
    const result = await populateVocabulary(words2, 1);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    const stored = await db.vocabItems.toArray();
    expect(stored).toHaveLength(2);
  });
});
