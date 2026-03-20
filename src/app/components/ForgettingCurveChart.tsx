"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ForgettingCurvePoint } from "@/lib/gamification/types";

interface ForgettingCurveChartProps {
  data: ForgettingCurvePoint[];
}

export function ForgettingCurveChart({ data }: ForgettingCurveChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-ink-600 text-center py-8">
        Complete a few reviews to see your forgetting curve.
      </p>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3dbb1" />
          <XAxis
            dataKey="day"
            label={{ value: "Days", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            domain={[0, 100]}
            label={{
              value: "Recall %",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value) => [`${value}%`, "Recall"]}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Area
            type="monotone"
            dataKey="retrievability"
            stroke="#92400e"
            strokeWidth={2}
            fill="#f9edd8"
            fillOpacity={0.8}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
