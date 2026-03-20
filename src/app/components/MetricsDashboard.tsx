"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/kaavya/db/schema";
import { getRankProgress } from "@/lib/gamification/rankSystem";
import { computeTotalXP } from "@/lib/gamification/xpEngine";
import {
  generateForgettingCurveData,
  computeGrowthData,
  computeComprehensionMetrics,
} from "@/lib/gamification/metricsEngine";
import { RankProgressCard } from "./RankProgressCard";
import { ForgettingCurveChart } from "./ForgettingCurveChart";
import { VocabGrowthChart } from "./VocabGrowthChart";
import { TimeRangePills } from "./TimeRangePills";
import type { ComprehensionMetric } from "@/lib/gamification/types";

type ExpandedSection = "forgetting" | "growth" | "comprehension" | null;

export function MetricsDashboard() {
  const [timeRange, setTimeRange] = useState(30);
  const [expandedSection, setExpandedSection] =
    useState<ExpandedSection>(null);

  const metricsData = useLiveQuery(async () => {
    const vocabItems = await db.vocabItems.toArray();
    const reviewLogs = await db.reviewLogs.toArray();
    const kaavyas = await db.kaavyas.toArray();
    const readingStates = await db.readingStates.toArray();
    const interpretations = await db.interpretations.toArray();

    // Mastered: state=2 (Review) AND stability > 30
    const masteredCount = vocabItems.filter(
      (item) => item.state === 2 && item.stability > 30
    ).length;

    // Kaavyas read = reading states where currentPage === totalPages
    const kaavyasRead = readingStates.filter(
      (rs) => rs.currentPage === rs.totalPages
    ).length;

    // Total XP
    const totalXP = computeTotalXP(reviewLogs, kaavyasRead);

    // Average stability (exclude New items, state=0)
    const reviewedItems = vocabItems.filter((item) => item.state !== 0);
    const avgStability =
      reviewedItems.length > 0
        ? reviewedItems.reduce((sum, item) => sum + item.stability, 0) /
          reviewedItems.length
        : 0;

    // Growth data
    const growthData = computeGrowthData(
      vocabItems.map((v) => ({ addedAt: v.addedAt, state: v.state }))
    );

    // Comprehension metrics
    const comprehensionMetrics = computeComprehensionMetrics(
      interpretations,
      kaavyas
    );

    // Due now count
    const now = new Date().toISOString();
    const dueNow = vocabItems.filter((item) => item.due <= now).length;

    return {
      vocabItems,
      masteredCount,
      kaavyasRead,
      totalXP,
      avgStability,
      growthData,
      comprehensionMetrics,
      dueNow,
      totalWords: vocabItems.length,
      kaavyasExplored: comprehensionMetrics.length,
    };
  });

  if (!metricsData) return null;

  const {
    vocabItems,
    masteredCount,
    kaavyasRead,
    totalXP,
    avgStability,
    growthData,
    comprehensionMetrics,
    dueNow,
    totalWords,
    kaavyasExplored,
  } = metricsData;

  // Empty state
  if (vocabItems.length === 0) {
    return (
      <div className="rounded-2xl border border-parchment-200 bg-parchment-50 p-6 text-center">
        <p className="text-xl font-bold text-ink-800">No progress yet</p>
        <p className="text-sm text-ink-600 mt-2">
          Complete your first quiz or read a kaavya to start tracking your
          learning journey.
        </p>
      </div>
    );
  }

  // Forgetting curve from avg stability
  const forgettingData =
    avgStability > 0 ? generateForgettingCurveData(avgStability, timeRange) : [];

  // Average recall % (retrievability at day 1 as summary stat)
  const avgRecall =
    forgettingData.length > 1 ? forgettingData[1].retrievability : 0;

  function toggleSection(section: ExpandedSection) {
    setExpandedSection((prev) => (prev === section ? null : section));
  }

  const statCards: {
    key: ExpandedSection;
    label: string;
    value: string | number;
    color?: string;
  }[] = [
    {
      key: "forgetting",
      label: "Avg Recall",
      value: `${avgRecall}%`,
    },
    {
      key: "growth",
      label: "Total Words",
      value: totalWords,
    },
    {
      key: "comprehension",
      label: "Kaavyas Explored",
      value: kaavyasExplored,
    },
    {
      key: null,
      label: "Due for Review",
      value: dueNow,
      color: dueNow > 0 ? "text-red-500" : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Rank Progress - Primary Visual Anchor */}
      <RankProgressCard
        totalXP={totalXP}
        masteredCount={masteredCount}
        kaavyasRead={kaavyasRead}
      />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => card.key && toggleSection(card.key)}
            className={`text-center cursor-pointer hover:bg-parchment-100 rounded-xl p-4 transition border border-parchment-200 bg-parchment-50 ${
              expandedSection === card.key
                ? "ring-2 ring-accent-500/30"
                : ""
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                card.color || "text-ink-800"
              }`}
            >
              {card.value}
            </p>
            <p className="text-sm text-ink-600">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Expanded Chart Sections */}
      {expandedSection === "forgetting" && (
        <div className="rounded-xl border border-parchment-200 p-4 animate-[fade-in_200ms_ease-out]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xl font-bold text-ink-800">Forgetting Curve</p>
            <TimeRangePills value={timeRange} onChange={setTimeRange} />
          </div>
          <ForgettingCurveChart data={forgettingData} />
        </div>
      )}

      {expandedSection === "growth" && (
        <div className="rounded-xl border border-parchment-200 p-4 animate-[fade-in_200ms_ease-out]">
          <p className="text-xl font-bold text-ink-800 mb-3">
            Vocabulary Growth
          </p>
          <VocabGrowthChart data={growthData} />
        </div>
      )}

      {expandedSection === "comprehension" && (
        <ComprehensionSection metrics={comprehensionMetrics} />
      )}
    </div>
  );
}

function ComprehensionSection({
  metrics,
}: {
  metrics: ComprehensionMetric[];
}) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-xl border border-parchment-200 p-4 animate-[fade-in_200ms_ease-out]">
        <p className="text-xl font-bold text-ink-800 mb-3">Comprehension</p>
        <p className="text-sm text-ink-600 text-center py-4">
          Explore shlokas in a kaavya to track comprehension.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-parchment-200 p-4 animate-[fade-in_200ms_ease-out]">
      <p className="text-xl font-bold text-ink-800 mb-3">Comprehension</p>
      <div className="space-y-3">
        {metrics.map((m) => {
          const percent =
            m.totalShlokas > 0
              ? Math.round((m.explored / m.totalShlokas) * 100)
              : 0;
          return (
            <div key={m.kaavyaId} className="flex items-center gap-3">
              <p className="text-sm font-bold text-ink-800 truncate flex-1">
                {m.kaavyaTitle}
              </p>
              <p className="text-sm text-ink-700 shrink-0">
                {m.explored}/{m.totalShlokas}
              </p>
              <div className="w-20 h-2 rounded-full bg-parchment-200 overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
