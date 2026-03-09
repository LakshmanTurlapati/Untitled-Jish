"use client";

import { useState } from "react";
import type { EnrichedWord } from "@/lib/analysis/types";
import { WordBreakdown } from "./WordBreakdown";
import { devanagariToIast } from "@/lib/transliteration";
import { ImageUpload } from "./ImageUpload";
import { VocabularyList } from "./VocabularyList";
import { QuizView } from "./QuizView";

export function AnalysisView() {
  const [inputText, setInputText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<EnrichedWord[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Analysis failed (${response.status})`);
      }

      const data = await response.json();
      setAnalysisResult(data.words);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const iastPreview = inputText ? devanagariToIast(inputText) : "";

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-600">
          Upload Image
        </p>
        <ImageUpload onTextExtracted={(text) => setInputText(text)} />
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter Sanskrit text in Devanagari..."
          rows={4}
          className="w-full rounded-lg border border-parchment-200 bg-parchment-100 p-4 font-sanskrit text-lg text-ink-900 placeholder:text-ink-600/50 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        {iastPreview && (
          <p className="mt-2 rounded bg-parchment-50 px-3 py-2 text-sm italic text-ink-600">
            {iastPreview}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="mt-3 rounded-lg bg-ink-800 px-6 py-2.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-6 text-center text-ink-600">
          <p className="text-sm">Analyzing Sanskrit text...</p>
        </div>
      )}

      {analysisResult && analysisResult.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysisResult.map((word, index) => (
              <WordBreakdown key={index} word={word} />
            ))}
          </div>
          <div className="mt-8 space-y-6">
            <VocabularyList words={analysisResult} />
            <QuizView words={analysisResult} />
          </div>
        </>
      )}

      {analysisResult && analysisResult.length === 0 && (
        <div className="rounded-lg border border-parchment-200 bg-parchment-50 p-6 text-center text-ink-600">
          <p>No words found in the analysis result.</p>
        </div>
      )}
    </div>
  );
}
