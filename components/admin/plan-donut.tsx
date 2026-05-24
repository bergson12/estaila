"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const COLORS: Record<string, string> = {
  FREE: "hsl(var(--muted-foreground))",
  PRO: "#3b82f6",
  TEAM: "#8b5cf6",
};

export function PlanDonut({
  data,
}: {
  data: { plan: string; count: number }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="relative h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="65%"
            outerRadius="95%"
            paddingAngle={2}
            dataKey="count"
            nameKey="plan"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.plan} fill={COLORS[d.plan] ?? "#64748b"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value);
              return [
                `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`,
                String(name),
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tabular-nums">
          {total}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Usuarios
        </span>
      </div>
    </div>
  );
}
