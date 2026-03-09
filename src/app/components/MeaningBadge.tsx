"use client";

import type { ReactNode } from "react";

const sourceConfig = {
  mw: {
    label: "Monier-Williams",
    dotColor: "bg-green-500",
  },
  apte: {
    label: "Apte",
    dotColor: "bg-blue-500",
  },
  ai: {
    label: "AI Interpretation",
    dotColor: "bg-amber-500",
  },
} as const;

interface MeaningBadgeProps {
  source: "mw" | "apte" | "ai";
  children?: ReactNode;
}

export function MeaningBadge({ source, children }: MeaningBadgeProps) {
  const config = sourceConfig[source];
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${config.dotColor}`}
      />
      <div>
        <span className="text-xs font-medium text-ink-600">
          {config.label}
        </span>
        {children && <p className="text-sm text-ink-700">{children}</p>}
      </div>
    </div>
  );
}
