"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/kaavya/db/schema";
import { getCurrentRank } from "@/lib/gamification/rankSystem";
import { computeTotalXP } from "@/lib/gamification/xpEngine";

export function CompactRankBadge() {
  const data = useLiveQuery(async () => {
    const vocabItems = await db.vocabItems.toArray();
    const readingStates = await db.readingStates.toArray();
    const reviewLogs = await db.reviewLogs.toArray();
    const userStats = await db.userStats.toCollection().first();

    // Mastered: state=2 (Review) AND stability > 30
    const masteredCount = vocabItems.filter(
      (item) => item.state === 2 && item.stability > 30
    ).length;

    // Kaavyas read = reading states where currentPage === totalPages
    const kaavyasRead = readingStates.filter(
      (rs) => rs.currentPage === rs.totalPages
    ).length;

    const currentRank = getCurrentRank(masteredCount, kaavyasRead);

    // Use userStats totalXP if available, otherwise compute from logs
    const totalXP = userStats?.totalXP ?? computeTotalXP(reviewLogs, kaavyasRead);

    return { currentRank, totalXP };
  });

  if (!data) return null;

  const { currentRank, totalXP } = data;

  // Derive bg color from tier's text color class (e.g. "text-blue-500" -> "bg-blue-500")
  const bgColorClass = currentRank.color.replace("text-", "bg-");

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-parchment-100 border border-parchment-200">
      <div
        className={`w-6 h-6 rounded-full ${bgColorClass} flex items-center justify-center`}
      >
        <span className="text-white text-xs font-bold">
          {currentRank.sanskritName.charAt(0)}
        </span>
      </div>
      <span className={`text-xs font-medium ${currentRank.color}`}>
        {currentRank.sanskritName}
      </span>
      <span className="text-ink-300">|</span>
      <span className="text-xs font-bold text-accent-600">{totalXP} XP</span>
    </div>
  );
}
