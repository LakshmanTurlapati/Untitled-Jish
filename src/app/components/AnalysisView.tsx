"use client";

import { useState, useEffect, useRef } from "react";
import type { EnrichedWord } from "@/lib/analysis/types";
import { WordBreakdown } from "./WordBreakdown";
import { devanagariToIast } from "@/lib/transliteration";
import { ImageUpload } from "./ImageUpload";
import { VocabularyList } from "./VocabularyList";
import { QuizView } from "./QuizView";

const PROGRESS_STEPS = [
  "Splitting sandhi...",
  "Analyzing morphology...",
  "Looking up meanings...",
];

const STEP_DELAYS = [800, 2000, 3500];

export function AnalysisView() {
  const [inputText, setInputText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<EnrichedWord[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<"analyze" | "words" | "quiz">("analyze");
  const [completedSteps, setCompletedSteps] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isLoading) {
      setCompletedSteps(0);
      timersRef.current = STEP_DELAYS.map((delay, i) =>
        setTimeout(() => setCompletedSteps(i + 1), delay)
      );
    } else {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (completedSteps > 0 && completedSteps < 3) {
        setCompletedSteps(3);
      }
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [isLoading]);

  async function handleSubmit() {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setPage("analyze");

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
  const hasResults = analysisResult && analysisResult.length > 0;

  return (
    <>
      {/* Page Content */}
      <div className="pb-40">
        {/* Analyze Page */}
        {page === "analyze" && (
          <>
            {/* Hero Input Card */}
            <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter Sanskrit text in Devanagari..."
                rows={4}
                className="w-full rounded-lg border border-parchment-200 bg-parchment-100 p-4 font-sanskrit text-lg text-ink-900 placeholder:text-ink-600/50 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
              {iastPreview && (
                <p className="mt-2 rounded bg-parchment-100 px-3 py-2 text-sm italic text-ink-600">
                  {iastPreview}
                </p>
              )}
              <div className="mt-4">
                <ImageUpload onTextExtracted={(text) => setInputText(text)} />
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Analysis Progress Steps */}
            {isLoading && (
              <div className="mt-6 rounded-2xl border border-parchment-200 bg-parchment-50 p-6">
                <div className="space-y-3">
                  {PROGRESS_STEPS.map((step, i) => {
                    const isComplete = completedSteps > i;
                    const isCurrent = completedSteps === i;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        {isComplete ? (
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-600 text-white text-xs"
                            style={{ animation: "check-appear 0.3s ease-out" }}
                          >
                            ✓
                          </span>
                        ) : isCurrent ? (
                          <span className="flex h-6 w-6 items-center justify-center">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
                          </span>
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-parchment-200 text-xs text-ink-700">
                            {i + 1}
                          </span>
                        )}
                        <span
                          className={`text-sm ${
                            isComplete
                              ? "text-ink-900 font-medium"
                              : isCurrent
                                ? "text-ink-800"
                                : "text-ink-600"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Word Results */}
            {hasResults && (
              <div className="mt-6 space-y-4">
                {analysisResult.map((word, index) => (
                  <WordBreakdown key={index} word={word} />
                ))}
              </div>
            )}

            {/* Empty Results */}
            {analysisResult && analysisResult.length === 0 && (
              <div className="mt-6 rounded-2xl border border-parchment-200 bg-parchment-50 p-6 text-center text-ink-600">
                <p>No words found in the analysis result.</p>
              </div>
            )}
          </>
        )}

        {/* Words Page */}
        {page === "words" && hasResults && (
          <VocabularyList words={analysisResult} />
        )}

        {page === "words" && !hasResults && (
          <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-8 text-center">
            <p className="text-2xl mb-2">📖</p>
            <p className="text-ink-700 font-medium">No vocabulary yet</p>
            <p className="text-ink-500 text-sm mt-1">Analyze a text first to see vocabulary here</p>
          </div>
        )}

        {/* Quiz Page */}
        {page === "quiz" && hasResults && (
          <QuizView
            words={analysisResult}
            onBackToText={() => setPage("analyze")}
          />
        )}

        {page === "quiz" && !hasResults && (
          <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-8 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-ink-700 font-medium">No quiz available</p>
            <p className="text-ink-500 text-sm mt-1">Analyze a text first to start a quiz</p>
          </div>
        )}
      </div>

      {/* Sticky Analyze Button — only on Analyze page, sits above bottom nav */}
      {page === "analyze" && (
        <div className="fixed bottom-16 left-0 right-0 bg-parchment-50/95 backdrop-blur-sm border-t border-parchment-200 p-4 z-40">
          <div className="mx-auto max-w-[640px]">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputText.trim()}
              className="w-full rounded-xl bg-accent-600 text-white font-bold px-8 py-3 border-b-4 border-accent-800 active:border-b-2 active:translate-y-[2px] transition-all duration-75 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar — Duolingo-style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-parchment-50 border-t border-parchment-200 z-50" aria-label="Main navigation">
        <div className="mx-auto max-w-[640px] flex justify-around py-2">
          {([
            { id: "analyze" as const, label: "Analyze", icon: "🔍" },
            { id: "words" as const, label: "Words", icon: "📖" },
            { id: "quiz" as const, label: "Quiz", icon: "🎯" },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 px-6 py-1 rounded-lg transition-colors ${
                page === item.id
                  ? "text-accent-700"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-semibold ${
                page === item.id ? "text-accent-700" : ""
              }`}>{item.label}</span>
              {page === item.id && (
                <span className="h-0.5 w-6 rounded-full bg-accent-600 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
