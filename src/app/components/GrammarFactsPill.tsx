"use client";

import type { WordType, Linga } from "@/lib/analysis/types";

interface GrammarFactsPillProps {
  wordType: WordType;
  vibhakti?: string;
  dhatu?: string;
  gana?: number;
  linga?: Linga;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function GrammarFactsPill({
  wordType,
  vibhakti,
  dhatu,
  gana,
  linga,
}: GrammarFactsPillProps) {
  const facts: string[] = [capitalize(wordType)];

  if (vibhakti) facts.push(capitalize(vibhakti));
  if (dhatu) facts.push(capitalize(dhatu));
  if (gana !== undefined) facts.push(`Gana ${gana}`);
  if (linga) facts.push(capitalize(linga));

  return (
    <div className="flex flex-wrap gap-1 justify-center mb-2">
      {facts.map((fact) => (
        <span
          key={fact}
          className="rounded-full bg-parchment-100 text-sm font-bold text-ink-700 px-2 py-0.5"
        >
          {fact}
        </span>
      ))}
    </div>
  );
}
