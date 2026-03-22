import { db } from './schema';
import type { Kaavya } from '../types';

export async function saveKaavya(
  title: string,
  rawText: string,
  sourceType: 'pdf' | 'pasted',
  author?: string
): Promise<number> {
  const now = new Date();
  const id = await db.kaavyas.add({ title, rawText, sourceType, author, createdAt: now, updatedAt: now });
  return id as number;
}

export async function getKaavya(id: number): Promise<Kaavya | undefined> {
  return db.kaavyas.get(id);
}

export async function getAllKaavyas(): Promise<Kaavya[]> {
  return db.kaavyas.orderBy('updatedAt').reverse().toArray();
}

export async function deleteKaavya(id: number): Promise<void> {
  await db.transaction('rw', [db.kaavyas, db.readingStates, db.interpretations, db.vocabItems, db.reviewLogs], async () => {
    // Get vocabItem IDs before deleting them (needed for reviewLog cascade)
    const rawIds = await db.vocabItems.where('kaavyaId').equals(id).primaryKeys();
    const vocabIds = rawIds.filter((k): k is number => k !== undefined);

    await db.kaavyas.delete(id);
    await db.readingStates.where('kaavyaId').equals(id).delete();
    await db.interpretations.where('kaavyaId').equals(id).delete();
    await db.vocabItems.where('kaavyaId').equals(id).delete();

    if (vocabIds.length > 0) {
      await db.reviewLogs.where('vocabItemId').anyOf(vocabIds).delete();
    }
  });
}
