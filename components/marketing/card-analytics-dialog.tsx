"use client";

import { Eye, MousePointerClick, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LinkLite = { id?: string; label: string; clicks: number };

/** Estadísticas de una tarjeta digital (3.3) — usa los datos ya existentes:
 * vistas + clics por link. Sin tracking nuevo. */
export function CardAnalyticsDialog({
  open,
  onOpenChange,
  title,
  views,
  links,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  title: string;
  views: number;
  links: LinkLite[];
}) {
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);
  const conv = views > 0 ? (totalClicks / views) * 100 : 0;
  const sorted = [...links].sort((a, b) => b.clicks - a.clicks);
  const max = Math.max(1, ...sorted.map((l) => l.clicks));
  const hasData = views > 0 || totalClicks > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">Estadísticas · {title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Eye} label="Vistas" value={views} accent="primary" />
          <Stat
            icon={MousePointerClick}
            label="Clics en links"
            value={totalClicks}
            accent="emerald"
          />
        </div>

        {hasData ? (
          <>
            <p className="text-xs text-muted-foreground">
              Conversión vista → clic:{" "}
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {conv.toFixed(1)}%
              </span>
            </p>
            <div className="space-y-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Clics por link
              </p>
              {sorted.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aún no tienes links en esta tarjeta.
                </p>
              ) : (
                sorted.map((l, i) => (
                  <div key={l.id ?? i}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{l.label}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {l.clicks}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max((l.clicks / max) * 100, l.clicks > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Aún sin vistas ni clics. Comparte tu tarjeta (QR o link) para empezar
            a medir.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: "primary" | "emerald";
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div
        className={
          accent === "primary"
            ? "mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary"
            : "mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500"
        }
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
