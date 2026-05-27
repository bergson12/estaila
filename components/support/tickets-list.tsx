import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TicketSummary } from "@/lib/actions/support";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-amber-500/15 text-amber-600",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600",
  RESOLVED: "bg-emerald-500/15 text-emerald-600",
  CLOSED: "bg-muted text-muted-foreground",
};

const CATEGORY_LABEL: Record<string, string> = {
  BUG: "🐛 Error",
  QUESTION: "❓ Pregunta",
  BILLING: "💳 Billing",
  FEATURE: "💡 Sugerencia",
  OTHER: "✉️ Otro",
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-muted-foreground/30",
  NORMAL: "bg-muted-foreground/60",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
};

export function TicketsList({
  tickets,
  basePath,
  showUser,
}: {
  tickets: (TicketSummary & { user?: { name: string; email: string } })[];
  basePath: string;
  showUser?: boolean;
}) {
  return (
    <div className="space-y-2">
      {tickets.map((t) => (
        <Link
          key={t.id}
          href={`${basePath}/${t.id}`}
          className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span
                className={cn(
                  "mt-2 h-2 w-2 shrink-0 rounded-full",
                  PRIORITY_DOT[t.priority]
                )}
                title={`Prioridad: ${t.priority}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {t.subject}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      STATUS_COLOR[t.status]
                    )}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                {showUser && t.user && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t.user.name} · {t.user.email}
                  </p>
                )}
                {t.preview && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {t.preview}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{CATEGORY_LABEL[t.category]}</span>
                  <span>·</span>
                  <span>{relativeTime(t.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day}d`;
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}
