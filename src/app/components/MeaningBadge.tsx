"use client";

const sourceConfig = {
  mw: {
    label: "MW Dictionary",
    className: "bg-green-100 text-green-800",
  },
  apte: {
    label: "Apte Dictionary",
    className: "bg-blue-100 text-blue-800",
  },
  ai: {
    label: "AI Interpretation",
    className: "bg-amber-100 text-amber-800",
  },
} as const;

interface MeaningBadgeProps {
  source: "mw" | "apte" | "ai";
}

export function MeaningBadge({ source }: MeaningBadgeProps) {
  const config = sourceConfig[source];
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
