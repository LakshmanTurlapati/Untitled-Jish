"use client";

import type { EnrichedWord } from "@/lib/analysis/types";
import { MeaningBadge } from "./MeaningBadge";

interface WordBreakdownProps {
  word: EnrichedWord;
}

export function WordBreakdown({ word }: WordBreakdownProps) {
  const { morphology, samasa } = word;
  const isVerb = morphology.word_type === "verb";

  return (
    <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6">
      {/* Header: Devanagari + IAST */}
      <div className="mb-4">
        <span className="font-sanskrit text-2xl text-ink-900">
          {word.original}
        </span>
        <span className="ml-2 text-sm italic text-ink-600">{word.iast}</span>
        {word.inria_validated && (
          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            Verified
          </span>
        )}
      </div>

      {/* Morphology badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
          {morphology.word_type}
        </span>
        <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
          {morphology.stem}
        </span>
        {morphology.vibhakti && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.vibhakti}
          </span>
        )}
        {morphology.vacana && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.vacana}
          </span>
        )}
        {morphology.linga && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.linga}
          </span>
        )}
        {isVerb && morphology.dhatu && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.dhatu}
          </span>
        )}
        {isVerb && morphology.gana !== undefined && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.gana}
          </span>
        )}
        {isVerb && morphology.lakara && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.lakara}
          </span>
        )}
        {isVerb && morphology.purusha && (
          <span className="rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-ink-700">
            {morphology.purusha}
          </span>
        )}
      </div>

      {/* Samasa section */}
      {samasa?.is_compound && (
        <div className="mb-4 rounded-xl border border-parchment-200 bg-parchment-100 p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
            {samasa.samasa_type}
          </span>
          {samasa.components && samasa.components.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-ink-700">
              {samasa.components.map((comp, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span className="font-medium">{comp.iast}</span>
                  <span className="text-xs text-ink-600">({comp.meaning})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meanings section with source dots */}
      <div className="space-y-2">
        {word.mw_definitions.length > 0 && (
          <MeaningBadge source="mw">{word.mw_definitions[0]}</MeaningBadge>
        )}
        {word.apte_definitions.length > 0 && (
          <MeaningBadge source="apte">{word.apte_definitions[0]}</MeaningBadge>
        )}
        <MeaningBadge source="ai">{word.contextual_meaning}</MeaningBadge>
      </div>
    </div>
  );
}
