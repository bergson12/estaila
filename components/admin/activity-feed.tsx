"use client";

import {
  UserPlus,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

type Entry = {
  id: string;
  kind: "signup" | "billing" | "gen_fail" | "admin";
  at: string; // ISO date
  title: string;
  sub: string;
  severity?: "neutral" | "positive" | "warning" | "danger";
};

const KIND_ICON = {
  signup: UserPlus,
  billing: DollarSign,
  gen_fail: AlertTriangle,
  admin: ShieldCheck,
};

const SEVERITY_BG = {
  neutral: "bg-muted text-muted-foreground",
  positive: "bg-emerald-500/15 text-emerald-600",
  warning: "bg-amber-500/15 text-amber-600",
  danger: "bg-rose-500/15 text-rose-600",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export function ActivityFeed({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aún no hay actividad reciente
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {entries.map((e) => {
        const Icon = KIND_ICON[e.kind];
        const colors = SEVERITY_BG[e.severity ?? "neutral"];
        return (
          <li
            key={e.id}
            className="flex items-center gap-2.5 rounded-md border bg-card/30 p-2.5 transition-colors hover:bg-card"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colors}`}>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.title}</p>
              <p className="truncate text-xs text-muted-foreground">{e.sub}</p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {timeAgo(e.at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
