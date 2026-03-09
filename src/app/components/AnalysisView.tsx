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
  const [activeTab, setActiveTab] = useState<"words" | "vocabulary" | "quiz">(
    "words"
  );
  const [completedSteps, setCompletedSteps] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isLoading) {
      setCompletedSteps(0);
      timersRef.current = STEP_DELAYS.map((delay, i) =>
        setTimeout(() => setCompletedSteps(i + 1), delay)
      );
    } else {
      // Clear any pending timers
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      // If we were loading, mark all steps complete
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
    setActiveTab("words");

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
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs"
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

      {/* Tab Navigation + Results */}
      {analysisResult && analysisResult.length > 0 && (
        <div className="mt-6">
          <div className="flex gap-2 justify-center mb-6">
            {(["words", "vocabulary", "quiz"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-accent-600 text-white"
                    : "text-ink-700 hover:bg-parchment-200"
                }`}
              >
                {tab === "words"
                  ? "Words"
                  : tab === "vocabulary"
                    ? "Vocabulary"
                    : "Quiz"}
              </button>
            ))}
          </div>

          {activeTab === "words" && (
            <div className="space-y-4">
              {analysisResult.map((word, index) => (
                <WordBreakdown key={index} word={word} />
              ))}
            </div>
          )}

          {activeTab === "vocabulary" && (
            <VocabularyList words={analysisResult} />
          )}

          {activeTab === "quiz" && (
                <QuizView
                  words={analysisResult}
                  onBackToText={() => setActiveTab("words")}
                />
              )}
        </div>
      )}

      {/* Empty Results */}
      {analysisResult && analysisResult.length === 0 && (
        <div className="mt-6 rounded-2xl border border-parchment-200 bg-parchment-50 p-6 text-center text-ink-600">
          <p>No words found in the analysis result.</p>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-parchment-50/95 backdrop-blur-sm border-t border-parchment-200 p-4 z-50">
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
    </>
  );
}
