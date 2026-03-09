"use client";

import { useMemo } from "react";
import type { EnrichedWord } from "@/lib/analysis/types";
import type { VocabularyWord } from "@/lib/study/types";
import { extractVocabulary } from "@/lib/study/vocabulary";

/** Map linga values to abbreviations */
function lingaAbbrev(linga: VocabularyWord["linga"]): string | null {
  switch (linga) {
    case "pullinga":
      return "m.";
    case "strilinga":
      return "f.";
    case "napumsakalinga":
      return "n.";
    default:
      return null;
  }
}

/** Format word type tag: [noun, m.] or [verb] */
function wordTypeTag(word: VocabularyWord): string {
  const abbr = lingaAbbrev(word.linga);
  if (abbr) {
    return `[${word.wordType}, ${abbr}]`;
  }
  return `[${word.wordType}]`;
}

interface VocabularyListProps {
  words: EnrichedWord[];
}

export function VocabularyList({ words }: VocabularyListProps) {
  const vocabulary = useMemo(() => extractVocabulary(words), [words]);

  if (vocabulary.length === 0) {
    return (
      <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6 text-center text-sm text-ink-600">
        No vocabulary words found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocabulary.map((word, index) => (
        <div
          key={index}
          className="rounded-2xl border border-parchment-200 bg-parchment-50 p-4"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-sanskrit text-lg">{word.original}</span>
            <span className="text-sm italic text-ink-600">{word.iast}</span>
            <span className="rounded-full bg-parchment-200 px-2 py-0.5 text-xs font-medium text-ink-700">
              {wordTypeTag(word)}
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-800">
            {word.contextualMeaning}
          </p>
        </div>
      ))}
    </div>
  );
}
