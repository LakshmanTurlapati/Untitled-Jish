"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useKaavyaLibrary } from "@/lib/kaavya/hooks/useKaavyaLibrary";
import { deleteKaavya } from "@/lib/kaavya/db/kaavyaStore";
import { db } from "@/lib/kaavya/db/schema";
import { LibraryCard } from "./LibraryCard";
import type { ReadingState } from "@/lib/kaavya/types";

interface KaavyaLibraryProps {
  onOpenKaavya: (id: number) => void;
  onAddKaavya: () => void;
}

export function KaavyaLibrary({ onOpenKaavya, onAddKaavya }: KaavyaLibraryProps) {
  const { kaavyas, isLoading } = useKaavyaLibrary();

  const readingStates = useLiveQuery(
    () => db.readingStates.toArray()
  );

  const readingStateMap = new Map<number, ReadingState>();
  if (readingStates) {
    for (const rs of readingStates) {
      readingStateMap.set(rs.kaavyaId, rs);
    }
  }

  async function handleDelete(id: number) {
    await deleteKaavya(id);
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-ink-800">Library</h2>
          <button
            disabled
            className="rounded-lg bg-accent-500 px-4 py-2 text-white opacity-50"
          >
            Add Kaavya
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg bg-parchment-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (kaavyas.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-ink-800">Library</h2>
          <button
            onClick={onAddKaavya}
            className="rounded-lg bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 transition-colors"
          >
            Add Kaavya
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-xl font-semibold text-ink-800">
            Your library is empty
          </h3>
          <p className="mt-2 max-w-sm text-ink-700">
            Upload a PDF or paste Sanskrit text to start reading. Your kaavyas
            are stored locally and persist across sessions.
          </p>
          <button
            onClick={onAddKaavya}
            className="mt-6 rounded-lg bg-accent-500 px-6 py-3 text-white hover:bg-accent-600 transition-colors"
          >
            Add Kaavya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ink-800">Library</h2>
        <button
          onClick={onAddKaavya}
          className="rounded-lg bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 transition-colors"
        >
          Add Kaavya
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kaavyas.map((kaavya) => (
          <LibraryCard
            key={kaavya.id}
            kaavya={kaavya}
            readingState={readingStateMap.get(kaavya.id!)}
            onOpen={onOpenKaavya}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
