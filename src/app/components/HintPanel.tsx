"use client";

interface HintPanelProps {
  hints: string;
  isLoading: boolean;
  error: string | null;
}

export function HintPanel({ hints, isLoading, error }: HintPanelProps) {
  if (error) {
    return (
      <div className="mt-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading && !hints) {
    return (
      <div className="mt-4">
        <p className="text-sm text-ink-700 mb-3">Searching pramaana sources...</p>
        <div className="space-y-3">
          <div className="h-4 bg-parchment-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-parchment-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-parchment-200 rounded animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (!hints) return null;

  const lines = hints.split("\n").filter((l) => l.trim() !== "");

  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-ink-800 mb-3">
        Hints from Pramaana
      </h3>
      <div className="space-y-1">
        {lines.map((line, idx) => {
          if (line.trim().startsWith(">")) {
            const text = line.trim().replace(/^>\s*/, "");
            return (
              <div
                key={idx}
                className="pl-4 border-l-4 border-accent-500 py-2 mb-3 animate-[fade-in_300ms_ease]"
              >
                <p className="text-ink-800 text-sm leading-relaxed">{text}</p>
              </div>
            );
          }
          return (
            <p key={idx} className="text-sm text-ink-700 mb-2">
              {line}
            </p>
          );
        })}
      </div>
      {isLoading && (
        <div className="h-4 bg-parchment-200 rounded animate-pulse w-2/3 mt-2" />
      )}
    </div>
  );
}
