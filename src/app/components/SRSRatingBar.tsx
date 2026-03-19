"use client";

import { Rating } from "@/lib/quiz/srs";

interface SRSRatingBarProps {
  onRate: (rating: Rating) => void;
  intervals: { again: string; hard: string; good: string; easy: string };
}

const RATING_CONFIG = [
  {
    rating: Rating.Again,
    label: "Again",
    key: "again" as const,
    bg: "bg-red-500",
    border: "border-red-700",
  },
  {
    rating: Rating.Hard,
    label: "Hard",
    key: "hard" as const,
    bg: "bg-amber-500",
    border: "border-amber-700",
  },
  {
    rating: Rating.Good,
    label: "Good",
    key: "good" as const,
    bg: "bg-green-500",
    border: "border-green-700",
  },
  {
    rating: Rating.Easy,
    label: "Easy",
    key: "easy" as const,
    bg: "bg-blue-500",
    border: "border-blue-700",
  },
];

export function SRSRatingBar({ onRate, intervals }: SRSRatingBarProps) {
  return (
    <div className="flex gap-2">
      {RATING_CONFIG.map(({ rating, label, key, bg, border }) => (
        <button
          key={label}
          onClick={() => onRate(rating)}
          className={`flex-1 min-h-[48px] rounded-xl ${bg} text-white font-bold border-b-4 ${border} active:border-b-2 active:translate-y-[2px] transition-all duration-75 flex flex-col items-center justify-center`}
        >
          <span>{label}</span>
          <span className="text-xs opacity-80">{intervals[key]}</span>
        </button>
      ))}
    </div>
  );
}
