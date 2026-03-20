"use client";

import { useState } from "react";

interface SmartQuizPromptProps {
  atRiskCount: number;
  onReviewNow: () => void;
}

export function SmartQuizPrompt({
  atRiskCount,
  onReviewNow,
}: SmartQuizPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (atRiskCount < 5 || dismissed) {
    return null;
  }

  return (
    <div className="rounded-xl bg-accent-500/10 border border-accent-500/30 p-4 flex items-center justify-between">
      <p className="text-sm text-ink-800">
        {atRiskCount} words fading -- review now
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReviewNow}
          className="bg-accent-600 text-white rounded-lg px-4 py-2 text-sm font-bold"
        >
          Review Now
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-ink-700 hover:text-ink-900"
          aria-label="Dismiss review reminder"
        >
          X
        </button>
      </div>
    </div>
  );
}
