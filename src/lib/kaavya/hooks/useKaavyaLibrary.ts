import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { Kaavya } from '../types';

export function useKaavyaLibrary() {
  const kaavyas = useLiveQuery(
    () => db.kaavyas.orderBy('updatedAt').reverse().toArray()
  );
  return { kaavyas: kaavyas ?? [], isLoading: kaavyas === undefined };
}
