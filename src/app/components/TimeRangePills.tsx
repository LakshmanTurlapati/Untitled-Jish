"use client";

interface TimeRangePillsProps {
  value: number;
  onChange: (days: number) => void;
}

const OPTIONS = [7, 14, 30] as const;

export function TimeRangePills({ value, onChange }: TimeRangePillsProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onChange(days)}
          className={
            value === days
              ? "bg-accent-600 text-white rounded-full px-3 py-1 text-sm font-bold"
              : "bg-parchment-100 text-ink-700 rounded-full px-3 py-1 text-sm font-normal hover:bg-parchment-200"
          }
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
