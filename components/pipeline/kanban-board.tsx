"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Activity,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  EyeOff,
  Flame,
  KanbanSquare,
  LayoutList,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { LeadCard } from "./lead-card";
import { NewLeadDialog } from "./new-lead-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { updateCardStage } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import type { Dict, Locale } from "@/lib/i18n/dictionary";
import {
  ACTIVE_STAGES,
  STAGE_ORDER,
  metaFor,
  type StageKey,
} from "./pipeline-meta";

export type PipelineCardData = {
  id: string;
  contactId: string;
  contactName: string;
  propertyId: string | null;
  propertyTitle: string | null;
  stage: string;
  value: number | null;
  notes: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export function KanbanBoard({
  initialCards,
  contacts,
  properties,
}: {
  initialCards: PipelineCardData[];
  contacts: { id: string; name: string }[];
  properties: { id: string; title: string }[];
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [, startTransition] = useTransition();
  const [cards, setCards] = useState(initialCards);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<string>("NUEVO");
  const [hideTerminal, setHideTerminal] = useState(false);
  type ViewMode = "kanban" | "list" | "forecast" | "stats";
  const [view, setView] = useState<ViewMode>("kanban");

  // Persist view choice
  useEffect(() => {
    try {
      const v = localStorage.getItem("pipeline:view");
      if (v === "kanban" || v === "list" || v === "forecast" || v === "stats") {
        setView(v);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("pipeline:view", view);
    } catch {}
  }, [view]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // ---------- Metrics ----------
  const metrics = useMemo(() => {
    const activeCards = cards.filter((c) => ACTIVE_STAGES.includes(c.stage as StageKey));
    const closed = cards.filter((c) => c.stage === "CERRADO");
    const lost = cards.filter((c) => c.stage === "PERDIDO");
    const totalActive = activeCards.reduce(
      (s, c) => s + (Number(c.value) || 0),
      0
    );
    const totalClosed = closed.reduce(
      (s, c) => s + (Number(c.value) || 0),
      0
    );
    const decided = closed.length + lost.length;
    const winRate = decided ? Math.round((closed.length / decided) * 100) : 0;

    // hot leads: nextAction overdue or due today
    const now = Date.now();
    const hot = cards.filter((c) => {
      if (!c.nextActionDate) return false;
      if (!ACTIVE_STAGES.includes(c.stage as StageKey)) return false;
      const t = new Date(c.nextActionDate).getTime();
      return t <= now + 24 * 60 * 60 * 1000;
    });

    return {
      activeCount: activeCards.length,
      totalActive,
      totalClosed,
      winRate,
      hot: hot.length,
      maxValue: Math.max(...STAGE_ORDER.map((s) =>
        cards
          .filter((c) => c.stage === s)
          .reduce((sum, c) => sum + (Number(c.value) || 0), 0)
      ), 0),
    };
  }, [cards]);

  const cardsByStage = STAGE_ORDER.reduce(
    (acc, s) => {
      acc[s] = cards.filter((c) => c.stage === s);
      return acc;
    },
    {} as Record<StageKey, PipelineCardData[]>
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;

    const cardId = String(e.active.id);
    const overId = String(e.over.id);

    const stageMatch = STAGE_ORDER.find((s) => s === overId);
    const newStage = stageMatch
      ? stageMatch
      : cards.find((c) => c.id === overId)?.stage;

    if (!newStage) return;
    moveCard(cardId, newStage);
  }

  function moveCard(cardId: string, newStage: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stage === newStage) return;

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, stage: newStage } : c))
    );

    startTransition(async () => {
      try {
        await updateCardStage(cardId, newStage);
        toast.success(`${t.pipeline.toastMovedTo} "${labelFor(PIPELINE_STAGES, newStage, locale)}"`);
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, stage: card.stage } : c))
        );
      }
    });
  }

  function openNewLead(stage: string) {
    setDefaultStage(stage);
    setDialogOpen(true);
  }

  const activeCard = cards.find((c) => c.id === activeId);
  const visibleStages = hideTerminal
    ? ACTIVE_STAGES
    : STAGE_ORDER;

  return (
    <>
      {/* HERO HEADER */}
      <div className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t.pipeline.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {view === "kanban" && `${t.pipeline.subtitleKanban} · ${cards.length} ${t.pipeline.totalSuffix}`}
              {view === "list" && `${cards.length} ${t.pipeline.subtitleList}`}
              {view === "forecast" && t.pipeline.subtitleForecast}
              {view === "stats" && t.pipeline.subtitleStats}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle pill */}
            <div className="inline-flex items-center rounded-full border border-border bg-card/60 p-1 text-xs shadow-sm">
              <ViewTab
                icon={KanbanSquare}
                label={t.pipeline.viewKanban}
                active={view === "kanban"}
                onClick={() => setView("kanban")}
              />
              <ViewTab
                icon={LayoutList}
                label={t.pipeline.viewList}
                active={view === "list"}
                onClick={() => setView("list")}
              />
              <ViewTab
                icon={CalendarRange}
                label={t.pipeline.viewForecast}
                active={view === "forecast"}
                onClick={() => setView("forecast")}
              />
              <ViewTab
                icon={BarChart3}
                label={t.pipeline.viewStats}
                active={view === "stats"}
                onClick={() => setView("stats")}
              />
            </div>

            {view === "kanban" && (
              <Button
                variant={hideTerminal ? "default" : "outline"}
                size="sm"
                onClick={() => setHideTerminal((v) => !v)}
              >
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                {hideTerminal ? t.pipeline.showClosed : t.pipeline.onlyActive}
              </Button>
            )}
            <Button size="sm" onClick={() => openNewLead("NUEVO")}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t.pipeline.newLead}
            </Button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            icon={Activity}
            label={t.pipeline.kpiActiveLeads}
            value={metrics.activeCount}
            tone="primary"
          />
          <KpiCard
            icon={Wallet}
            label={t.pipeline.kpiActivePipeline}
            value={formatCurrency(metrics.totalActive)}
            tone="sky"
          />
          <KpiCard
            icon={CheckCircle2}
            label={t.pipeline.kpiClosed}
            value={formatCurrency(metrics.totalClosed)}
            tone="emerald"
            sub={`${metrics.winRate}% ${t.pipeline.conversionSuffix}`}
          />
          <KpiCard
            icon={Flame}
            label={t.pipeline.kpiAttentionToday}
            value={metrics.hot}
            tone={metrics.hot > 0 ? "amber" : "muted"}
            sub={metrics.hot > 0 ? t.pipeline.pendingTasks : t.pipeline.allCaughtUp}
          />
        </div>
      </div>

      {view === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div
            className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-2 overflow-x-auto pb-4"
            style={{ scrollSnapType: "x proximity" }}
          >
            {visibleStages.map((stageKey, i) => (
              <motion.div
                key={stageKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                style={{ scrollSnapAlign: "start" }}
              >
                <KanbanColumn
                  stage={stageKey}
                  cards={cardsByStage[stageKey] ?? []}
                  maxValue={metrics.maxValue}
                  onAddCard={() => openNewLead(stageKey)}
                />
              </motion.div>
            ))}
          </div>

          <DragOverlay>
            {activeCard ? <LeadCard card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {view === "list" && (
        <ListView
          cards={cards}
          onMove={(id, stage) => moveCard(id, stage)}
          t={t}
          locale={locale}
        />
      )}

      {view === "forecast" && <ForecastView cards={cards} t={t} locale={locale} />}

      {view === "stats" && (
        <StatsView cards={cards} metrics={metrics} t={t} locale={locale} />
      )}

      <NewLeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStage={defaultStage}
        contacts={contacts}
        properties={properties}
      />
    </>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  tone: "primary" | "sky" | "emerald" | "amber" | "muted";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky-500/10 text-sky-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-4 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", toneClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tabular-nums leading-none">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
      )}
      {/* subtle radial glow on hover */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-foreground/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}

// ============================================================
// VIEW TAB (pill style)
// ============================================================

function ViewTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof KanbanSquare;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ============================================================
// LIST VIEW — sortable table
// ============================================================

function ListView({
  cards,
  onMove,
  t,
  locale,
}: {
  cards: PipelineCardData[];
  onMove: (cardId: string, newStage: string) => void;
  t: Dict;
  locale: Locale;
}) {
  const [sortKey, setSortKey] = useState<"contact" | "value" | "stage" | "updated">(
    "updated"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStage, setFilterStage] = useState<string>("ALL");

  const sorted = useMemo(() => {
    let arr = [...cards];
    if (filterStage !== "ALL") arr = arr.filter((c) => c.stage === filterStage);
    arr.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "contact") {
        av = a.contactName;
        bv = b.contactName;
      } else if (sortKey === "value") {
        av = Number(a.value ?? 0);
        bv = Number(b.value ?? 0);
      } else if (sortKey === "stage") {
        av = STAGE_ORDER.indexOf(a.stage as StageKey);
        bv = STAGE_ORDER.indexOf(b.stage as StageKey);
      } else {
        av = new Date(a.updatedAt).getTime();
        bv = new Date(b.updatedAt).getTime();
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [cards, sortKey, sortDir, filterStage]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function daysIn(card: PipelineCardData) {
    return Math.floor(
      (Date.now() - new Date(card.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFilterStage("ALL")}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
            filterStage === "ALL"
              ? "bg-foreground text-background"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {t.pipeline.filterAll} · {cards.length}
        </button>
        {STAGE_ORDER.map((s) => {
          const n = cards.filter((c) => c.stage === s).length;
          if (n === 0) return null;
          const meta = metaFor(s);
          const active = filterStage === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStage(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-all",
                active ? meta.chip : "bg-card border-transparent text-muted-foreground hover:text-foreground"
              )}
              style={active ? undefined : { borderColor: "transparent" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.hex }} />
              {labelFor(PIPELINE_STAGES, s, locale)}
              <span className="font-mono opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/60">
                <th
                  onClick={() => toggleSort("contact")}
                  className="cursor-pointer px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {t.pipeline.colLead} {sortKey === "contact" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => toggleSort("stage")}
                  className="cursor-pointer px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {t.pipeline.colStage}
                </th>
                <th
                  onClick={() => toggleSort("value")}
                  className="cursor-pointer px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {t.pipeline.colValue} {sortKey === "value" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.pipeline.colNextStep}
                </th>
                <th
                  onClick={() => toggleSort("updated")}
                  className="cursor-pointer px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {t.pipeline.colUpdated}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {t.pipeline.emptyFilter}
                  </td>
                </tr>
              ) : (
                sorted.map((c, i) => {
                  const meta = metaFor(c.stage);
                  const Icon = meta.icon;
                  const overdue =
                    c.nextActionDate &&
                    new Date(c.nextActionDate).getTime() < Date.now() - 24 * 60 * 60 * 1000;
                  const isToday =
                    c.nextActionDate &&
                    new Date(c.nextActionDate).toDateString() === new Date().toDateString();
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.02 }}
                      className="group border-b border-border last:border-0 transition-colors hover:bg-card/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                            {c.contactName
                              .split(" ")
                              .slice(0, 2)
                              .map((p) => p[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{c.contactName}</p>
                            {c.propertyTitle && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {c.propertyTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={c.stage}
                          onChange={(e) => onMove(c.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 cursor-pointer",
                            meta.chip
                          )}
                        >
                          {STAGE_ORDER.map((s) => (
                            <option key={s} value={s} className="bg-background text-foreground">
                              {labelFor(PIPELINE_STAGES, s, locale)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-semibold tabular-nums">
                        {c.value != null && Number(c.value) > 0
                          ? formatCurrency(Number(c.value))
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {c.nextAction ? (
                          <div>
                            <p className="line-clamp-1 text-sm">{c.nextAction}</p>
                            {c.nextActionDate && (
                              <p
                                className={cn(
                                  "mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium",
                                  overdue
                                    ? "text-rose-500"
                                    : isToday
                                      ? "text-amber-500"
                                      : "text-muted-foreground"
                                )}
                              >
                                {overdue ? t.pipeline.overdue : isToday ? t.pipeline.today : new Date(c.nextActionDate).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] text-muted-foreground">
                        <p className="font-mono tabular-nums">{daysIn(c)}d</p>
                        <p className="text-[10px]">{t.pipeline.inPipeline}</p>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// FORECAST VIEW — group by month of next action date
// ============================================================

function ForecastView({
  cards,
  t,
  locale,
}: {
  cards: PipelineCardData[];
  t: Dict;
  locale: Locale;
}) {
  // Group by YYYY-MM of nextActionDate (or "Sin fecha")
  const groups = useMemo(() => {
    const map = new Map<string, PipelineCardData[]>();
    for (const c of cards) {
      if (["CERRADO", "PERDIDO"].includes(c.stage)) continue;
      const key = c.nextActionDate
        ? new Date(c.nextActionDate).toISOString().slice(0, 7)
        : "no-date";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "no-date") return 1;
      if (b[0] === "no-date") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [cards]);

  if (groups.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CalendarRange className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t.pipeline.forecastEmpty}</p>
      </Card>
    );
  }

  function monthLabel(key: string): string {
    if (key === "no-date") return t.pipeline.noDate;
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {groups.map(([key, items]) => {
        const total = items.reduce((s, c) => s + (Number(c.value) || 0), 0);
        const isOverdue = key !== "no-date" && key < new Date().toISOString().slice(0, 7);
        return (
          <Card key={key} className="overflow-hidden p-0">
            <div
              className={cn(
                "flex items-center justify-between border-b border-border px-5 py-3",
                isOverdue ? "bg-rose-500/5" : "bg-card/60"
              )}
            >
              <div className="flex items-baseline gap-3">
                <h3 className="text-sm font-semibold capitalize">{monthLabel(key)}</h3>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {items.length} {items.length === 1 ? t.pipeline.leadSingular : t.pipeline.leadPlural}
                </span>
                {isOverdue && (
                  <Badge variant="outline" className="border-rose-500/40 text-[9px] text-rose-500">
                    {t.pipeline.overdue}
                  </Badge>
                )}
              </div>
              <p className="font-mono text-base font-bold tabular-nums">
                {formatCurrency(total)}
              </p>
            </div>
            <ul className="divide-y divide-border">
              {items.map((c) => {
                const meta = metaFor(c.stage);
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-card/40"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.contactName}</p>
                      {c.propertyTitle && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {c.propertyTitle}
                        </p>
                      )}
                    </div>
                    {c.nextAction && (
                      <p className="hidden truncate text-xs text-muted-foreground sm:block sm:max-w-[200px]">
                        {c.nextAction}
                      </p>
                    )}
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1",
                        meta.chip
                      )}
                    >
                      {labelFor(PIPELINE_STAGES, c.stage, locale)}
                    </span>
                    {c.value != null && Number(c.value) > 0 && (
                      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(c.value))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================
// STATS VIEW — funnel + per-stage breakdown
// ============================================================

function StatsView({
  cards,
  metrics,
  t,
  locale,
}: {
  cards: PipelineCardData[];
  metrics: { activeCount: number; totalActive: number; totalClosed: number; winRate: number; hot: number; maxValue: number };
  t: Dict;
  locale: Locale;
}) {
  // Per-stage stats
  const byStage = STAGE_ORDER.map((s) => {
    const items = cards.filter((c) => c.stage === s);
    const value = items.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    const meta = metaFor(s);
    return { stage: s, meta, count: items.length, value };
  });

  const maxCount = Math.max(...byStage.map((b) => b.count), 1);
  const totalCount = cards.length;

  // Conversion: each stage → next stage (count moving forward)
  const funnelStages: StageKey[] = ["NUEVO", "CONTACTADO", "VISITA", "NEGOCIACION", "CERRADO"];
  const funnel = funnelStages.map((s, i) => {
    // Cumulative count: card at this stage OR deeper
    const deeperIdx = STAGE_ORDER.indexOf(s);
    const count = cards.filter((c) => {
      const idx = STAGE_ORDER.indexOf(c.stage as StageKey);
      return idx >= deeperIdx && c.stage !== "PERDIDO";
    }).length;
    return { stage: s, meta: metaFor(s), count, rate: i === 0 ? 100 : 0 };
  });
  for (let i = 1; i < funnel.length; i++) {
    funnel[i].rate =
      funnel[0].count > 0 ? Math.round((funnel[i].count / funnel[0].count) * 100) : 0;
  }

  return (
    <div className="space-y-6">
      {/* Bar chart per stage */}
      <Card className="p-6">
        <h3 className="mb-5 text-sm font-semibold">{t.pipeline.statsDistribution}</h3>
        <div className="space-y-3">
          {byStage.map((b) => {
            const pct = (b.count / maxCount) * 100;
            return (
              <div key={b.stage} className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: b.meta.hex }}
                  />
                  {labelFor(PIPELINE_STAGES, b.stage, locale)}
                </span>
                <div className="relative h-7 overflow-hidden rounded-md bg-foreground/[0.04]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${b.meta.hex}88, ${b.meta.hex}cc)`,
                    }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center font-mono text-xs tabular-nums">
                    {b.count}
                  </span>
                </div>
                <span className="text-right font-mono text-xs text-muted-foreground tabular-nums w-28">
                  {b.value > 0 ? formatCurrency(b.value) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Conversion funnel */}
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t.pipeline.statsFunnel}</h3>
          <span className="text-[11px] text-muted-foreground">
            {t.pipeline.statsVsFirstStage}
          </span>
        </div>
        <div className="space-y-2">
          {funnel.map((f, i) => {
            const width = f.rate;
            return (
              <div key={f.stage} className="relative">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{labelFor(PIPELINE_STAGES, f.stage, locale)}</span>
                  <span className="font-mono tabular-nums">
                    {f.count} <span className="text-muted-foreground">·</span> {f.rate}%
                  </span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
                  className="mt-1 h-2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${f.meta.hex}, ${f.meta.hex}aa)`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.pipeline.statWinRate}</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">
              {metrics.winRate}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.pipeline.statTotalLeads}</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">
              {totalCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.pipeline.statAverage}</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">
              {formatCurrency(
                metrics.activeCount > 0 ? metrics.totalActive / metrics.activeCount : 0
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
