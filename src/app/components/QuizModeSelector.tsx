"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { FaRandom, FaBook } from "react-icons/fa";
import { db } from "@/lib/kaavya/db/schema";
import { isDue } from "@/lib/quiz/srs";
import { State } from "ts-fsrs";
import { DueCountBadge } from "./DueCountBadge";

interface QuizModeSelectorProps {
  onSelectMode: (mode: "daily" | "kaavya", kaavyaId?: number) => void;
}

export function QuizModeSelector({ onSelectMode }: QuizModeSelectorProps) {
  const [showKaavyaList, setShowKaavyaList] = useState(false);

  const vocabItems = useLiveQuery(() => db.vocabItems.toArray());
  const kaavyas = useLiveQuery(() => db.kaavyas.toArray());

  const globalDueCount =
    vocabItems?.filter(
      (item) => isDue(item.due) || item.state === State.New
    ).length ?? 0;

  const totalVocab = vocabItems?.length ?? 0;

  // Compute next due date for "all caught up" state
  const nextDueDate = vocabItems
    ?.filter((item) => item.state !== State.New)
    .map((item) => new Date(item.due).getTime())
    .sort((a, b) => a - b)
    .find((t) => t > Date.now());

  const nextDueText = nextDueDate
    ? formatTimeTo(nextDueDate)
    : undefined;

  // Per-kaavya due counts
  const kaavyaDueCounts = new Map<number, number>();
  if (vocabItems && kaavyas) {
    for (const kaavya of kaavyas) {
      const count = vocabItems.filter(
        (item) =>
          item.kaavyaId === kaavya.id &&
          (isDue(item.due) || item.state === State.New)
      ).length;
      kaavyaDueCounts.set(kaavya.id!, count);
    }
  }

  if (totalVocab === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-xl font-semibold text-ink-800">
          No vocabulary yet
        </h3>
        <p className="mt-2 max-w-sm text-ink-700">
          Open a kaavya and tap &apos;Add Words to Quiz&apos; to start building
          your vocabulary.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {/* Daily Review card */}
        <button
          onClick={() => onSelectMode("daily")}
          className={`rounded-xl p-4 text-left transition-colors duration-150 ${
            globalDueCount > 0
              ? "border-2 border-parchment-200 bg-parchment-100 cursor-pointer hover:border-accent-400"
              : "border-2 border-dashed border-parchment-200 bg-parchment-100"
          }`}
        >
          <div className="flex items-start justify-between">
            <FaRandom className="text-xl text-accent-600 mt-1" />
            <DueCountBadge count={globalDueCount} />
          </div>
          <h3 className="mt-2 text-sm font-bold text-ink-800">Daily Review</h3>
          <p className="text-xs text-ink-600 mt-1">
            Mixed words from all kaavyas
          </p>
          {globalDueCount === 0 && nextDueText && (
            <p className="text-xs text-ink-600 mt-2">
              All caught up! Next review in {nextDueText}.
            </p>
          )}
        </button>

        {/* Kaavya Focus card */}
        <button
          onClick={() => setShowKaavyaList(!showKaavyaList)}
          className="rounded-xl border-2 border-parchment-200 bg-parchment-100 p-4 text-left cursor-pointer hover:border-accent-400 transition-colors duration-150"
        >
          <div className="flex items-start justify-between">
            <FaBook className="text-xl text-accent-600 mt-1" />
          </div>
          <h3 className="mt-2 text-sm font-bold text-ink-800">Kaavya Focus</h3>
          <p className="text-xs text-ink-600 mt-1">
            Words from a specific text
          </p>
        </button>
      </div>

      {/* Kaavya list dropdown */}
      {showKaavyaList && kaavyas && kaavyas.length > 0 && (
        <div className="mt-4 rounded-xl border border-parchment-200 bg-parchment-50 divide-y divide-parchment-200">
          {kaavyas.map((kaavya) => {
            const dueCount = kaavyaDueCounts.get(kaavya.id!) ?? 0;
            return (
              <button
                key={kaavya.id}
                onClick={() => onSelectMode("kaavya", kaavya.id!)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-parchment-100 transition-colors text-left"
              >
                <span className="text-sm font-medium text-ink-800">
                  {kaavya.title}
                </span>
                <DueCountBadge count={dueCount} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeTo(timestamp: number): string {
  const diffMs = timestamp - Date.now();
  if (diffMs <= 0) return "now";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}
