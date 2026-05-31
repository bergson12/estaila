"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Building2,
  Calendar,
  Flame,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency, initials, formatDate } from "@/lib/utils";
import { deletePipelineCard } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import { metaFor } from "./pipeline-meta";
import type { PipelineCardData } from "./kanban-board";

export function LeadCard({
  card,
  isOverlay,
}: {
  card: PipelineCardData;
  isOverlay?: boolean;
}) {
  const [, startTransition] = useTransition();
  const { t, locale } = useT();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id, disabled: isOverlay });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const meta = metaFor(card.stage);

  // Hot lead: nextActionDate today or overdue
  const now = Date.now();
  const due = card.nextActionDate ? new Date(card.nextActionDate).getTime() : null;
  const isOverdue = due !== null && due < now - 24 * 60 * 60 * 1000;
  const isToday =
    due !== null &&
    new Date(card.nextActionDate!).toDateString() === new Date().toDateString();
  const isHot = isOverdue || isToday;

  // Days since created
  const daysSinceCreated = Math.floor(
    (now - new Date(card.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  function handleDelete() {
    if (!confirm(`${t.pipeline.confirmDeletePrefix} "${card.contactName}"?`)) return;
    startTransition(async () => {
      try {
        await deletePipelineCard(card.id);
        toast.success(t.pipeline.toastLeadDeleted);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all",
        isDragging && "opacity-30",
        isOverlay
          ? "cursor-grabbing border-foreground/30 shadow-2xl shadow-black/40 scale-[1.02] rotate-[1deg]"
          : "cursor-grab border-border hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
      )}
    >
      {/* Left accent stripe — stage color */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b",
          meta.accent
        )}
        aria-hidden
      />

      {/* Hot indicator badge */}
      {isHot && (
        <div className="absolute right-2 top-2 z-10">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1",
              isOverdue
                ? "bg-rose-500/15 text-rose-500 ring-rose-500/30"
                : "bg-amber-500/15 text-amber-500 ring-amber-500/30"
            )}
            title={isOverdue ? t.pipeline.overdue : t.pipeline.today}
          >
            <Flame className="h-2.5 w-2.5" />
            {isOverdue ? t.pipeline.overdue : t.pipeline.today}
          </span>
        </div>
      )}

      <div className="relative p-3 pl-4">
        {/* Top: avatar + name + actions menu */}
        <div className="mb-2 flex items-start gap-2 pr-12">
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            <AvatarFallback className="bg-muted text-[10px] font-semibold">
              {initials(card.contactName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {card.contactName}
            </p>
            {card.propertyTitle && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{card.propertyTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions menu — top-right */}
        {!isHot && (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-all hover:bg-foreground/[0.06] group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label={t.pipeline.actions}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t.pipeline.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Value (prominent) */}
        {card.value != null && Number(card.value) > 0 && (
          <p className="font-mono text-base font-bold tabular-nums tracking-tight">
            {formatCurrency(Number(card.value))}
          </p>
        )}

        {/* Next action */}
        {card.nextAction && (
          <div
            className={cn(
              "mt-2 rounded-md border px-2 py-1.5 text-[11px] leading-relaxed",
              isHot
                ? isOverdue
                  ? "border-rose-500/20 bg-rose-500/[0.04]"
                  : "border-amber-500/20 bg-amber-500/[0.04]"
                : "border-border/60 bg-foreground/[0.02]"
            )}
          >
            <p className="line-clamp-2 text-foreground">{card.nextAction}</p>
            {card.nextActionDate && (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 font-medium",
                  isOverdue
                    ? "text-rose-500"
                    : isToday
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(new Date(card.nextActionDate))}
              </p>
            )}
          </div>
        )}

        {/* Footer chip — days in pipeline (only for active stages, after a few days) */}
        {!["CERRADO", "PERDIDO"].includes(card.stage) && daysSinceCreated >= 1 && (
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-mono tabular-nums">
              {daysSinceCreated}{t.pipeline.daysInPipeline}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1",
                meta.chip
              )}
            >
              {labelFor(PIPELINE_STAGES, card.stage, locale)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
