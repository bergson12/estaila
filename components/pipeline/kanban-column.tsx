"use client";

import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import { LeadCard } from "./lead-card";
import { metaFor, type StageKey } from "./pipeline-meta";
import type { PipelineCardData } from "./kanban-board";

export function KanbanColumn({
  stage,
  cards,
  maxValue,
  onAddCard,
}: {
  stage: StageKey;
  cards: PipelineCardData[];
  maxValue: number;
  onAddCard: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = metaFor(stage);
  const Icon = meta.icon;

  const totalValue = cards.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  const pct = maxValue > 0 ? Math.round((totalValue / maxValue) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border bg-card/40 backdrop-blur-md transition-all",
        meta.tint,
        isOver
          ? "border-foreground/30 shadow-[0_0_0_3px] shadow-foreground/10 scale-[1.005]"
          : "border-border"
      )}
    >
      {/* Top accent bar — color por etapa */}
      <div
        className={cn(
          "h-[3px] w-full bg-gradient-to-r",
          meta.accent
        )}
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
              meta.chip
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider">
              {meta.label}
            </p>
            <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {cards.length} {cards.length === 1 ? "lead" : "leads"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddCard}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:scale-105",
            "hover:bg-foreground/[0.04] hover:text-foreground"
          )}
          aria-label="Agregar lead"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Value bar */}
      {totalValue > 0 ? (
        <div className="px-3 pb-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatCurrency(totalValue)}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {pct}%
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn("h-full rounded-full bg-gradient-to-r", meta.accent)}
            />
          </div>
        </div>
      ) : (
        <div className="px-3 pb-2 h-[34px]" aria-hidden />
      )}

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-3 pt-1 min-h-[260px]">
        <AnimatePresence mode="popLayout">
          {cards.length === 0 ? (
            <motion.button
              key="empty"
              type="button"
              onClick={onAddCard}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border/50 text-[11px] text-muted-foreground transition-all hover:border-foreground/20 hover:bg-foreground/[0.02] hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="h-3 w-3" />
                Arrastra aquí o agrega
              </span>
            </motion.button>
          ) : (
            cards.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.025 }}
              >
                <LeadCard card={c} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
