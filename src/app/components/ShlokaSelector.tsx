"use client";

import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useShlokaHints } from "@/lib/kaavya/hooks/useShlokaHints";
import { HintPanel } from "./HintPanel";
import { db } from "@/lib/kaavya/db/schema";

interface ShlokaSelectorProps {
  kaavyaId: number;
  selectedText: string;
  onClose: () => void;
}

export function ShlokaSelector({
  kaavyaId,
  selectedText,
  onClose,
}: ShlokaSelectorProps) {
  const [userInterpretation, setUserInterpretation] = useState("");
  const { hints, isLoading, error, requestHints, reset } = useShlokaHints();
  const [saved, setSaved] = useState(false);

  // Save interpretation to IndexedDB once hints are received
  useEffect(() => {
    if (hints && !isLoading && !saved && userInterpretation) {
      const hintsArray = hints
        .split("\n")
        .filter((l) => l.trim().startsWith(">"))
        .map((l) => l.trim().replace(/^>\s*/, ""));

      if (hintsArray.length > 0) {
        db.interpretations
          .add({
            kaavyaId,
            shlokaText: selectedText,
            userInterpretation,
            hintsReceived: hintsArray,
            createdAt: new Date(),
          })
          .then(() => setSaved(true))
          .catch(() => {
            /* storage error -- non-blocking */
          });
      }
    }
  }, [hints, isLoading, saved, kaavyaId, selectedText, userInterpretation]);

  function handleSubmit() {
    if (!userInterpretation.trim()) return;
    setSaved(false);
    requestHints(selectedText, userInterpretation);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="bg-parchment-100 rounded-t-2xl border-t border-parchment-200 p-4 lg:p-6 max-h-[50vh] overflow-y-auto relative animate-[fade-in_300ms_ease]">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-ink-700 hover:text-ink-800 transition-colors p-1"
        aria-label="Close interpretation panel"
      >
        <FaTimes className="w-4 h-4" />
      </button>

      {/* Selected shloka display */}
      <div className="font-sanskrit text-base text-ink-800 bg-parchment-50/50 p-3 rounded-lg border-l-4 border-accent-500 mb-4 pr-8">
        {selectedText}
      </div>

      {/* Interpretation input */}
      <label className="text-sm font-semibold text-ink-800 mb-2 block">
        Your Interpretation
      </label>
      <textarea
        value={userInterpretation}
        onChange={(e) => setUserInterpretation(e.target.value)}
        placeholder="Type your understanding of this shloka..."
        className="min-h-[100px] w-full p-3 border border-parchment-200 rounded-lg bg-white text-ink-800 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
      />

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!userInterpretation.trim() || isLoading}
        className="bg-accent-500 hover:bg-accent-600 text-white rounded-lg px-6 py-2.5 mt-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading hints..." : "Submit Interpretation"}
      </button>

      {/* Hint panel */}
      <HintPanel hints={hints} isLoading={isLoading} error={error} />
    </div>
  );
}
