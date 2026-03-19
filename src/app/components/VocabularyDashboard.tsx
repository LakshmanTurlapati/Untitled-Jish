"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getMasteryStats } from "@/lib/quiz/quizEngine";
import { db } from "@/lib/kaavya/db/schema";

interface VocabularyDashboardProps {
  kaavyaId?: number;
}

export function VocabularyDashboard({ kaavyaId }: VocabularyDashboardProps) {
  const stats = useLiveQuery(
    () => getMasteryStats(kaavyaId),
    [kaavyaId]
  );

  const totalReps = useLiveQuery(async () => {
    const items = await db.vocabItems.toArray();
    return items.reduce((sum, item) => sum + item.reps, 0);
  });

  const avgStability = useLiveQuery(async () => {
    const items = await db.vocabItems.toArray();
    if (items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.stability, 0) / items.length;
  });

  if (!stats) return null;

  const estimatedDays =
    totalReps !== undefined && totalReps >= 5 && avgStability !== undefined
      ? Math.ceil(avgStability * 2)
      : null;

  return (
    <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-ink-800">{stats.total}</p>
          <p className="text-sm text-ink-600">Total Words</p>
        </div>
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${
              stats.dueNow > 0 ? "text-red-500" : "text-ink-600"
            }`}
          >
            {stats.dueNow}
          </p>
          <p className="text-sm text-ink-600">Due Now</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-ink-800">{stats.learning}</p>
          <p className="text-sm text-ink-600">Learning</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">{stats.mastered}</p>
          <p className="text-sm text-ink-600">Mastered</p>
        </div>
      </div>

      {estimatedDays !== null && (
        <p className="text-sm text-ink-600 mt-4 text-center">
          Estimated mastery: ~{estimatedDays} days at current pace
        </p>
      )}
    </div>
  );
}
