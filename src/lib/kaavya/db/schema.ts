import Dexie, { type EntityTable } from 'dexie';
import type { Kaavya, ReadingState, ShlokaInterpretation } from '../types';

const db = new Dexie('KaavyaDB') as Dexie & {
  kaavyas: EntityTable<Kaavya, 'id'>;
  readingStates: EntityTable<ReadingState, 'id'>;
  interpretations: EntityTable<ShlokaInterpretation, 'id'>;
};

db.version(1).stores({
  kaavyas: '++id, title, createdAt',
  readingStates: '++id, kaavyaId, lastReadAt',
  interpretations: '++id, kaavyaId, createdAt',
});

export { db };
