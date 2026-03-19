import Dexie, { type EntityTable } from 'dexie';
import type { Kaavya, ReadingState, ShlokaInterpretation } from '../types';
import type { VocabItem, ReviewLog } from '@/lib/quiz/types';

const db = new Dexie('KaavyaDB') as Dexie & {
  kaavyas: EntityTable<Kaavya, 'id'>;
  readingStates: EntityTable<ReadingState, 'id'>;
  interpretations: EntityTable<ShlokaInterpretation, 'id'>;
  vocabItems: EntityTable<VocabItem, 'id'>;
  reviewLogs: EntityTable<ReviewLog, 'id'>;
};

db.version(1).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
});

db.version(2).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
  vocabItems: '++id, stem, kaavyaId, state, due',
  reviewLogs: '++id, vocabItemId, rating, reviewedAt',
});

export { db };
