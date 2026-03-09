"use client";

import { useState, useMemo } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const vocabulary = useMemo(() => extractVocabulary(words), [words]);

  if (vocabulary.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 rounded-lg border border-parchment-200 bg-parchment-50 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-parchment-100"
      >
        <span className="text-xs">{isExpanded ? "\u25BC" : "\u25B6"}</span>
        View Vocabulary ({vocabulary.length} words)
      </button>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {vocabulary.map((word, index) => (
            <div
              key={index}
              className="rounded-lg border border-parchment-200 bg-parchment-50 p-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-sanskrit text-lg">{word.original}</span>
                <span className="text-sm italic text-ink-600">{word.iast}</span>
                <span className="inline-flex rounded-full bg-parchment-200 px-2 py-0.5 text-xs text-ink-600">
                  {wordTypeTag(word)}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-900">
                {word.contextualMeaning}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
