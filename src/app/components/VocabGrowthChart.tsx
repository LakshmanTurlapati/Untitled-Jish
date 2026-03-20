"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GrowthDataPoint } from "@/lib/gamification/types";

interface VocabGrowthChartProps {
  data: GrowthDataPoint[];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VocabGrowthChart({ data }: VocabGrowthChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-ink-600 text-center py-8">
        Add vocabulary from a kaavya to see growth trends.
      </p>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="date" tickFormatter={formatDateLabel} />
          <YAxis />
          <Tooltip
            labelFormatter={(label) => formatDateLabel(String(label))}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                mastered: "Mastered",
                learning: "Learning",
                newCount: "New",
              };
              return [value, labels[String(name)] || String(name)];
            }}
          />
          <Area
            type="monotone"
            dataKey="mastered"
            stackId="1"
            fill="#22c55e"
            fillOpacity={0.6}
            stroke="#22c55e"
          />
          <Area
            type="monotone"
            dataKey="learning"
            stackId="1"
            fill="#f59e0b"
            fillOpacity={0.6}
            stroke="#f59e0b"
          />
          <Area
            type="monotone"
            dataKey="newCount"
            stackId="1"
            fill="var(--color-ink-400, #78716c)"
            fillOpacity={0.6}
            stroke="var(--color-ink-400, #78716c)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
