"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type Row = { day: string; subs: number; packs: number; total: number };

type ChartLabels = { day: string; subscriptions: string; packs: string };

export function RevenueChart({
  data,
  labels,
}: {
  data: Row[];
  labels: ChartLabels;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tickFormatter={(d) => d.slice(5)}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval={9}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(l) => `${labels.day}: ${l}`}
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value);
              return [
                `$${v.toFixed(2)}`,
                name === "subs" ? labels.subscriptions : labels.packs,
              ];
            }}
          />
          <Legend wrapperStyle={{ display: "none" }} />
          <Bar
            dataKey="subs"
            stackId="r"
            fill="#10b981"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="packs"
            stackId="r"
            fill="#8b5cf6"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
