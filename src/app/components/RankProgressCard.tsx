"use client";

import { getRankProgress } from "@/lib/gamification/rankSystem";

interface RankProgressCardProps {
  totalXP: number;
  masteredCount: number;
  kaavyasRead: number;
}

/** Map tier color class (text-X) to badge background class (bg-X) */
function tierBgClass(color: string): string {
  return color.replace("text-", "bg-");
}

/** For Shishya tier (ink-600 bg), use parchment-50 letter; all others use white */
function tierLetterClass(color: string): string {
  return color === "text-ink-600" ? "text-parchment-50" : "text-white";
}

export function RankProgressCard({
  totalXP,
  masteredCount,
  kaavyasRead,
}: RankProgressCardProps) {
  const { current, next, progressPercent } = getRankProgress(
    masteredCount,
    kaavyasRead
  );

  const badgeLetter = current.sanskritName.charAt(0);

  return (
    <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${tierBgClass(
            current.color
          )}`}
        >
          <span
            className={`text-lg font-bold ${tierLetterClass(current.color)}`}
          >
            {badgeLetter}
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-ink-800">{totalXP} XP</p>
          <p className="text-sm text-ink-600">{current.name} ({current.sanskritName})</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-3 rounded-full bg-parchment-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-ink-600 mt-1">
          {next
            ? `${current.name} -- ${progressPercent}% to ${next.name}`
            : "Max rank achieved!"}
        </p>
      </div>
    </div>
  );
}
