import { db } from './schema';
import type { ReadingState } from '../types';

export async function saveReadingState(
  kaavyaId: number,
  currentPage: number,
  totalPages: number
): Promise<void> {
  const existing = await db.readingStates.where('kaavyaId').equals(kaavyaId).first();
  if (existing) {
    await db.readingStates.update(existing.id!, {
      currentPage, totalPages, lastReadAt: new Date(),
    });
  } else {
    await db.readingStates.add({
      kaavyaId, currentPage, totalPages, lastReadAt: new Date(),
    });
  }
}

export async function getReadingState(kaavyaId: number): Promise<ReadingState | undefined> {
  return db.readingStates.where('kaavyaId').equals(kaavyaId).first();
}
