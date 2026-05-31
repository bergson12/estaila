"use client";

import {
  Bell,
  Building2,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  KanbanSquare,
  LayoutList,
  Loader2,
  MapPin,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCcw,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  addDays,
  addMonths,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isPast,
  isSameDay,
  isSameMonth,
  isThisWeek,
  isToday,
  isTomorrow,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
  updateAppointmentStatus,
} from "@/lib/actions/appointment";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { useT } from "@/lib/i18n/provider";

type Appointment = {
  id: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string | null;
  status: string;
  location: string | null;
  attendees: string | null;
  notes: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
};

type View = "day" | "week" | "month" | "year" | "list" | "kanban";

const STATUS_META: Record<
  string,
  { label: string; bg: string; border: string; dot: string; icon: LucideIcon }
> = {
  PENDIENTE: {
    label: "Pendiente",
    bg: "bg-blue-500/15 text-blue-500",
    border: "border-blue-500/40",
    dot: "bg-blue-500",
    icon: Clock,
  },
  EN_CURSO: {
    label: "En curso",
    bg: "bg-amber-500/15 text-amber-500",
    border: "border-amber-500/40",
    dot: "bg-amber-500",
    icon: Play,
  },
  COMPLETADO: {
    label: "Completado",
    bg: "bg-emerald-500/15 text-emerald-500",
    border: "border-emerald-500/40",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  CANCELADO: {
    label: "Cancelado",
    bg: "bg-destructive/15 text-destructive",
    border: "border-destructive/40",
    dot: "bg-destructive",
    icon: X,
  },
};

/** Etiqueta i18n del estado de la cita (los `label` de STATUS_META quedan como fallback). */
function statusLabel(
  t: ReturnType<typeof useT>["t"],
  status: string
): string {
  const map: Record<string, string> = {
    PENDIENTE: t.agenda.statusPending,
    EN_CURSO: t.agenda.statusInProgress,
    COMPLETADO: t.agenda.statusCompleted,
    CANCELADO: t.agenda.statusCancelled,
  };
  return map[status] ?? STATUS_META[status]?.label ?? status;
}

export function AgendaClient({
  appointments,
  properties,
}: {
  appointments: Appointment[];
  properties: { id: string; title: string }[];
}) {
  const { t } = useT();
  const [view, setView] = useState<View>("week");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [detailAppointment, setDetailAppointment] =
    useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([
    "PENDIENTE",
    "EN_CURSO",
  ]);
  const [filterProperty, setFilterProperty] = useState<string>("ALL");

  // Normalize appointments to Date objects
  const items = useMemo<Appointment[]>(
    () =>
      appointments.map((a) => ({
        ...a,
        startAt: new Date(a.startAt),
        endAt: a.endAt ? new Date(a.endAt) : null,
      })),
    [appointments]
  );

  const filtered = useMemo(
    () =>
      items.filter((a) => {
        if (filterStatus.length > 0 && !filterStatus.includes(a.status))
          return false;
        if (filterProperty !== "ALL" && a.propertyId !== filterProperty)
          return false;
        return true;
      }),
    [items, filterStatus, filterProperty]
  );

  // Sidebar stats
  const stats = useMemo(() => {
    const today = items.filter(
      (a) => isToday(new Date(a.startAt)) && a.status !== "CANCELADO"
    ).length;
    const pending = items.filter((a) => a.status === "PENDIENTE").length;
    const inProgress = items.filter((a) => a.status === "EN_CURSO").length;
    const thisWeek = items.filter(
      (a) =>
        isThisWeek(new Date(a.startAt), { weekStartsOn: 1 }) &&
        a.status !== "CANCELADO"
    ).length;
    return { today, pending, inProgress, thisWeek };
  }, [items]);

  function openNew(date?: Date) {
    setEditingAppointment(null);
    setDialogDate(date ?? new Date());
    setDialogOpen(true);
  }

  function openDetail(a: Appointment) {
    setDetailAppointment(a);
  }

  function openEdit(a: Appointment) {
    setDetailAppointment(null);
    setEditingAppointment(a);
    setDialogDate(null);
    setDialogOpen(true);
  }

  function toggleFilterStatus(s: string) {
    setFilterStatus((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
      {/* === SIDEBAR === */}
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] space-y-4 lg:overflow-y-auto hide-scrollbar lg:pb-6">
        {/* Stats row */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t.agenda.summary}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums">
              {stats.today}
            </p>
            <p className="text-xs text-muted-foreground">{t.agenda.appointmentsToday}</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            <StatCell label={t.agenda.statPending} value={stats.pending} color="blue" />
            <StatCell label={t.agenda.statInProgress} value={stats.inProgress} color="amber" />
            <StatCell label={t.agenda.statWeek} value={stats.thisWeek} color="emerald" />
          </div>
        </Card>

        {/* Mini calendar */}
        <Card className="p-4">
          <MiniCalendar
            month={currentMonth}
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setCurrentMonth(d);
            }}
            onNavigate={setCurrentMonth}
            events={items}
          />
          <Button
            size="sm"
            className="mt-3 w-full bg-gradient-to-r from-primary to-primary/85"
            onClick={() => openNew(selectedDate ?? new Date())}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t.agenda.newAppointment}
          </Button>
        </Card>

        {/* Filters */}
        <Card className="p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Filter className="h-3 w-3" />
            {t.agenda.filters}
          </p>

          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.agenda.statusLabel}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["PENDIENTE", "EN_CURSO", "COMPLETADO", "CANCELADO"] as const).map(
                  (s) => {
                    const meta = STATUS_META[s];
                    const active = filterStatus.includes(s);
                    const Icon = meta.icon;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleFilterStatus(s)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-all",
                          active
                            ? cn(meta.bg, meta.border)
                            : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{statusLabel(t, s)}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.agenda.propertyLabel}
              </p>
              <Select value={filterProperty} onValueChange={setFilterProperty}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t.agenda.allProperties}</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterStatus.length < 4 || filterProperty !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-[11px] text-muted-foreground"
                onClick={() => {
                  setFilterStatus(["PENDIENTE", "EN_CURSO", "COMPLETADO", "CANCELADO"]);
                  setFilterProperty("ALL");
                }}
              >
                <RefreshCcw className="mr-1 h-3 w-3" />
                {t.agenda.clearFilters}
              </Button>
            )}
          </div>
        </Card>

        {/* Pending list (selected day or upcoming) */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-card/40 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold">
              <Bell className="h-3 w-3 text-primary" />
              {selectedDate && isSameMonth(selectedDate, currentMonth)
                ? format(selectedDate, "EEEE d 'de' MMM", { locale: es })
                : t.agenda.upcoming}
            </p>
          </div>
          <PendingSidebarList
            items={filtered}
            selectedDate={selectedDate}
            onCreate={() => openNew(selectedDate ?? new Date())}
          />
        </Card>
      </aside>

      {/* === MAIN === */}
      <main className="space-y-4">
        {/* View tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Primary: timeline pill */}
            <div className="inline-flex items-center rounded-full border border-border bg-card/60 p-1 text-xs shadow-sm">
              <TimelineTab
                label={t.agenda.viewDay}
                active={view === "day"}
                onClick={() => setView("day")}
              />
              <TimelineTab
                label={t.agenda.viewWeek}
                active={view === "week"}
                onClick={() => setView("week")}
              />
              <TimelineTab
                label={t.agenda.viewMonth}
                active={view === "month"}
                onClick={() => setView("month")}
              />
              <TimelineTab
                label={t.agenda.viewYear}
                active={view === "year"}
                onClick={() => setView("year")}
              />
            </div>

            {/* Secondary: list-style */}
            <div className="hidden items-center gap-1 rounded-lg border border-border bg-card/50 p-1 sm:flex">
              <ViewTab
                icon={LayoutList}
                label={t.agenda.viewList}
                active={view === "list"}
                onClick={() => setView("list")}
              />
              <ViewTab
                icon={KanbanSquare}
                label={t.agenda.viewKanban}
                active={view === "kanban"}
                onClick={() => setView("kanban")}
              />
            </div>
          </div>

          <Button
            onClick={() => openNew(selectedDate ?? new Date())}
            className="bg-gradient-to-r from-primary to-primary/85"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t.agenda.newAppointment}
          </Button>
        </div>

        {/* View content */}
        <AnimatePresence mode="wait">
          {view === "day" && (
            <motion.div
              key="day"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DayView
                date={selectedDate ?? new Date()}
                onNavigate={setSelectedDate}
                items={filtered}
                onCreate={openNew}
                onItemClick={openDetail}
              />
            </motion.div>
          )}
          {view === "week" && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WeekView
                anchor={selectedDate ?? new Date()}
                onNavigate={setSelectedDate}
                items={filtered}
                onCreate={openNew}
                onItemClick={openDetail}
                onDayClick={(d) => {
                  setSelectedDate(d);
                  setView("day");
                }}
              />
            </motion.div>
          )}
          {view === "month" && (
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MonthView
                month={currentMonth}
                selected={selectedDate}
                onSelect={setSelectedDate}
                onNavigate={setCurrentMonth}
                items={filtered}
                onCreate={openNew}
              />
            </motion.div>
          )}
          {view === "year" && (
            <motion.div
              key="year"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <YearView
                year={(selectedDate ?? new Date()).getFullYear()}
                items={filtered}
                onMonthClick={(m) => {
                  const d = new Date(
                    (selectedDate ?? new Date()).getFullYear(),
                    m,
                    1
                  );
                  setCurrentMonth(d);
                  setSelectedDate(d);
                  setView("month");
                }}
                onDayClick={(d) => {
                  setSelectedDate(d);
                  setView("day");
                }}
              />
            </motion.div>
          )}
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ListView
                items={filtered}
                onCreate={() => openNew()}
                onItemClick={openDetail}
              />
            </motion.div>
          )}
          {view === "kanban" && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <KanbanView items={filtered} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <NewAppointmentDialog
        open={dialogOpen}
        onOpenChange={(b) => {
          setDialogOpen(b);
          if (!b) setEditingAppointment(null);
        }}
        properties={properties}
        initialDate={dialogDate}
        editing={editingAppointment}
      />

      <AppointmentDetailDialog
        open={!!detailAppointment}
        onOpenChange={(b) => !b && setDetailAppointment(null)}
        appointment={detailAppointment}
        onEdit={() => detailAppointment && openEdit(detailAppointment)}
      />
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "amber" | "emerald";
}) {
  const colorClass = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
  }[color];
  return (
    <div className="p-3 text-center">
      <p className={cn("font-mono text-lg font-bold tabular-nums", colorClass)}>
        {value}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ViewTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
      {active && (
        <motion.span
          layoutId="agenda-view-bg"
          className="absolute inset-0 -z-10 rounded-md bg-card shadow-sm"
        />
      )}
    </button>
  );
}

// ============================================================
// MINI CALENDAR (sidebar)
// ============================================================

function MiniCalendar({
  month,
  selected,
  onSelect,
  onNavigate,
  events,
}: {
  month: Date;
  selected: Date | null;
  onSelect: (d: Date) => void;
  onNavigate: (d: Date) => void;
  events: Appointment[];
}) {
  const { t } = useT();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const weekdayInitials = [
    t.agenda.weekdayInitialMon,
    t.agenda.weekdayInitialTue,
    t.agenda.weekdayInitialWed,
    t.agenda.weekdayInitialThu,
    t.agenda.weekdayInitialFri,
    t.agenda.weekdayInitialSat,
    t.agenda.weekdayInitialSun,
  ];

  const dayEvents = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startAt), day));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: es })}
        </p>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNavigate(subMonths(month, 1))}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNavigate(addMonths(month, 1))}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weekdayInitials.map((dow, i) => (
          <div
            key={i}
            className="py-1 text-center text-[9px] uppercase tracking-wider text-muted-foreground"
          >
            {dow}
          </div>
        ))}
        {days.map((day, i) => {
          const evs = dayEvents(day);
          const inMonth = isSameMonth(day, month);
          const isSelected = selected && isSameDay(day, selected);
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onSelect(day)}
              className={cn(
                "relative aspect-square rounded-md text-[11px] font-medium transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && !today && "hover:bg-muted",
                today && !isSelected && "text-primary",
                isSelected && "bg-primary text-primary-foreground"
              )}
            >
              <span className="font-mono tabular-nums">{format(day, "d")}</span>
              {evs.length > 0 && !isSelected && (
                <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {evs.slice(0, 3).map((e, j) => (
                    <span
                      key={j}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        STATUS_META[e.status]?.dot ?? "bg-foreground"
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MONTH VIEW (main)
// ============================================================

function MonthView({
  month,
  selected,
  onSelect,
  onNavigate,
  items,
  onCreate,
}: {
  month: Date;
  selected: Date | null;
  onSelect: (d: Date) => void;
  onNavigate: (d: Date) => void;
  items: Appointment[];
  onCreate: (date?: Date) => void;
}) {
  const { t } = useT();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const weekdayNames = [
    t.agenda.weekdayMon,
    t.agenda.weekdayTue,
    t.agenda.weekdayWed,
    t.agenda.weekdayThu,
    t.agenda.weekdayFri,
    t.agenda.weekdaySat,
    t.agenda.weekdaySun,
  ];

  const dayEvents = (day: Date) =>
    items
      .filter((e) => isSameDay(new Date(e.startAt), day))
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );

  return (
    <Card className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t.agenda.viewMonth}
          </p>
          <h2 className="text-xl font-bold capitalize">
            {format(month, "MMMM yyyy", { locale: es })}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate(new Date())}
          >
            {t.agenda.today}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate(subMonths(month, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate(addMonths(month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekdayNames.map((dow) => (
          <div
            key={dow}
            className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <span className="hidden sm:inline">{dow}</span>
            <span className="sm:hidden">{dow.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const evs = dayEvents(day);
          const inMonth = isSameMonth(day, month);
          const isSelected = selected && isSameDay(day, selected);
          const today = isToday(day);
          return (
            <div
              key={i}
              onClick={() => onSelect(day)}
              className={cn(
                "group relative min-h-[110px] cursor-pointer border-b border-r border-border p-2 transition-colors last:border-r-0",
                !inMonth && "bg-muted/10 text-muted-foreground/40",
                inMonth && "hover:bg-card/50",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center font-mono text-sm tabular-nums",
                    today && "rounded-full bg-primary font-bold text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {evs.length > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary tabular-nums">
                    {evs.length}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="mt-1 space-y-0.5">
                {evs.slice(0, 3).map((e) => (
                  <EventChip key={e.id} event={e} />
                ))}
                {evs.length > 3 && (
                  <p className="px-1 text-[9px] text-muted-foreground">
                    +{evs.length - 3} {t.agenda.more}
                  </p>
                )}
              </div>

              {/* Quick create on hover */}
              {inMonth && evs.length === 0 && (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onCreate(day);
                  }}
                  className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-primary/15 group-hover:opacity-100"
                  title={t.agenda.createAppointment}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EventChip({ event }: { event: Appointment }) {
  const meta = STATUS_META[event.status];
  return (
    <div
      className={cn(
        "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
        meta?.bg
      )}
      title={`${format(new Date(event.startAt), "h:mm a", { locale: es })} · ${event.title}`}
    >
      <span className="font-mono tabular-nums">
        {format(new Date(event.startAt), "HH:mm")}
      </span>{" "}
      {event.title}
    </div>
  );
}

// ============================================================
// LIST VIEW
// ============================================================

function ListView({
  items,
  onCreate,
  onItemClick,
}: {
  items: Appointment[];
  onCreate: () => void;
  onItemClick?: (a: Appointment) => void;
}) {
  const { t } = useT();
  // Group by buckets
  const groups: { label: string; items: Appointment[] }[] = [
    { label: t.agenda.groupToday, items: [] },
    { label: t.agenda.groupTomorrow, items: [] },
    { label: t.agenda.groupThisWeek, items: [] },
    { label: t.agenda.groupUpcoming, items: [] },
    { label: t.agenda.groupPast, items: [] },
  ];

  for (const a of items) {
    const d = new Date(a.startAt);
    if (isToday(d)) groups[0].items.push(a);
    else if (isTomorrow(d)) groups[1].items.push(a);
    else if (isPast(d) && !isToday(d)) groups[4].items.push(a);
    else if (isThisWeek(d, { weekStartsOn: 1 })) groups[2].items.push(a);
    else groups[3].items.push(a);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t.agenda.emptyTitle}
        description={t.agenda.emptyFilteredDescription}
        action={
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t.agenda.newAppointment}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.label}>
            <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
              <span className="font-mono text-foreground tabular-nums">
                {g.items.length}
              </span>
            </h2>
            <div className="space-y-2">
              {g.items.map((a) => (
                <AppointmentCard
                  key={a.id}
                  a={a}
                  onClick={onItemClick ? () => onItemClick(a) : undefined}
                />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}

// ============================================================
// KANBAN VIEW
// ============================================================

function KanbanView({ items }: { items: Appointment[] }) {
  const { t } = useT();
  const columns = [
    { key: "PENDIENTE" },
    { key: "EN_CURSO" },
    { key: "COMPLETADO" },
    { key: "CANCELADO" },
  ];

  const byStatus: Record<string, Appointment[]> = {};
  for (const c of columns) byStatus[c.key] = [];
  for (const a of items) {
    if (byStatus[a.status]) byStatus[a.status].push(a);
  }

  return (
    <div className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
      {columns.map((col) => {
        const meta = STATUS_META[col.key];
        const colItems = byStatus[col.key];
        const Icon = meta.icon;
        return (
          <div
            key={col.key}
            className="flex flex-col rounded-xl border border-border bg-card/40"
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    meta.bg
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {statusLabel(t, col.key)}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {colItems.length}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2 min-h-[200px]">
              {colItems.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
                  {t.agenda.empty}
                </div>
              ) : (
                colItems.map((a) => <AppointmentCard key={a.id} a={a} compact />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// PENDING SIDEBAR LIST
// ============================================================

function PendingSidebarList({
  items,
  selectedDate,
  onCreate,
}: {
  items: Appointment[];
  selectedDate: Date | null;
  onCreate: () => void;
}) {
  const { t } = useT();
  // If a date is selected, show ONLY that day's appointments; otherwise upcoming.
  const list = useMemo(() => {
    if (selectedDate) {
      return items
        .filter((a) => isSameDay(new Date(a.startAt), selectedDate))
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );
    }
    // upcoming next 5 non-cancelled non-completed
    return items
      .filter((a) => {
        const d = new Date(a.startAt);
        return (
          d >= startOfDay(new Date()) &&
          a.status !== "COMPLETADO" &&
          a.status !== "CANCELADO"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
      .slice(0, 5);
  }, [items, selectedDate]);

  if (list.length === 0) {
    return (
      <div className="space-y-3 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          {selectedDate
            ? t.agenda.noAppointmentsThisDay
            : t.agenda.noUpcomingAppointments}
        </p>
        <Button size="sm" variant="outline" onClick={onCreate}>
          <Plus className="mr-1.5 h-3 w-3" />
          {t.agenda.createNow}
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {list.map((a) => {
        const meta = STATUS_META[a.status];
        return (
          <li key={a.id} className="p-3 transition-colors hover:bg-card/60">
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full",
                  meta.dot
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium leading-snug">
                  {a.title}
                </p>
                <p className="mt-1 flex items-center gap-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {format(new Date(a.startAt), "h:mm a", { locale: es })}
                  {a.location && (
                    <>
                      <span className="mx-0.5">·</span>
                      <MapPin className="h-2.5 w-2.5" />
                      <span className="truncate">{a.location}</span>
                    </>
                  )}
                </p>
                {a.propertyTitle && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                    <Building2 className="h-2.5 w-2.5" />
                    {a.propertyTitle}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================
// APPOINTMENT CARD
// ============================================================

function AppointmentCard({
  a,
  compact,
  onClick,
}: {
  a: Appointment;
  compact?: boolean;
  onClick?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const [, startTransition] = useTransition();
  const meta = STATUS_META[a.status];

  function changeStatus(newStatus: string) {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(a.id, newStatus);
        toast.success(t.agenda.toastStatusUpdated);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(t.agenda.deleteConfirmGeneric)) return;
    startTransition(async () => {
      try {
        await deleteAppointment(a.id);
        toast.success(t.agenda.toastDeleted);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  if (compact) {
    return (
      <Card
        onClick={onClick}
        className="cursor-pointer p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30"
      >
        <p className="line-clamp-2 text-xs font-semibold leading-tight">
          {a.title}
        </p>
        <p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] tabular-nums text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {format(new Date(a.startAt), "EEE d, h:mm a", { locale: es })}
        </p>
        {a.propertyTitle && (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            🏠 {a.propertyTitle}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 transition-colors hover:bg-card/80",
        onClick && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
          meta.bg
        )}
      >
        <meta.icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{a.title}</p>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              meta.bg
            )}
          >
            {statusLabel(t, a.status)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-mono tabular-nums">
            <Clock className="h-3 w-3" />
            {format(new Date(a.startAt), "EEE d MMM, h:mm a", { locale: es })}
          </span>
          {a.propertyTitle && (
            <span className="truncate">🏠 {a.propertyTitle}</span>
          )}
          {a.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {a.location}
            </span>
          )}
        </div>
        {a.attendees && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <Users className="-mt-0.5 mr-1 inline h-3 w-3" />
            {a.attendees}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {a.status === "PENDIENTE" && (
            <DropdownMenuItem onClick={() => changeStatus("EN_CURSO")}>
              <Play className="mr-2 h-4 w-4" />
              {t.agenda.markInProgress}
            </DropdownMenuItem>
          )}
          {a.status !== "COMPLETADO" && a.status !== "CANCELADO" && (
            <DropdownMenuItem onClick={() => changeStatus("COMPLETADO")}>
              <Check className="mr-2 h-4 w-4" />
              {t.agenda.markCompletedItem}
            </DropdownMenuItem>
          )}
          {a.status !== "CANCELADO" && (
            <DropdownMenuItem onClick={() => changeStatus("CANCELADO")}>
              <X className="mr-2 h-4 w-4" />
              {t.agenda.cancelAppointment}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t.agenda.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}

// ============================================================
// NEW APPOINTMENT DIALOG
// ============================================================

function NewAppointmentDialog({
  open,
  onOpenChange,
  properties,
  initialDate,
  editing,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  properties: { id: string; title: string }[];
  initialDate: Date | null;
  /** When present, dialog runs in edit mode for this appointment */
  editing?: Appointment | null;
}) {
  const router = useRouter();
  const { t } = useT();
  const isEdit = !!editing;
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [startDate, setStartDate] = useState(() =>
    initialDate
      ? format(initialDate, "yyyy-MM-dd'T'10:00")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState<string>("NONE");

  // Prefill when opening with editing data; reset when create with date
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title ?? "");
      setPropertyId(editing.propertyId ?? "");
      setStartDate(format(new Date(editing.startAt), "yyyy-MM-dd'T'HH:mm"));
      setEndDate(
        editing.endAt
          ? format(new Date(editing.endAt), "yyyy-MM-dd'T'HH:mm")
          : ""
      );
      setLocation(editing.location ?? "");
      setAttendees(editing.attendees ?? "");
      setNotes(editing.notes ?? "");
      // Detect reminder from notes if present (best-effort)
      const m = (editing.notes ?? "").match(/🔔 Recordatorio:\s*([^\n]+)/);
      setReminder(m ? m[1].trim() : "NONE");
    } else if (initialDate) {
      setTitle("");
      setPropertyId("");
      setStartDate(format(initialDate, "yyyy-MM-dd'T'10:00"));
      setEndDate("");
      setLocation("");
      setAttendees("");
      setNotes("");
      setReminder("NONE");
    }
  }, [open, editing, initialDate]);

  async function onSubmit() {
    if (!title.trim()) {
      toast.error(t.agenda.titleRequired);
      return;
    }
    setSubmitting(true);
    try {
      // Strip the auto-injected reminder line so editing doesn't duplicate it
      const cleanedNotes = notes.replace(/\n*🔔 Recordatorio:[^\n]*/g, "").trim();
      const composedNotes = cleanedNotes
        ? `${cleanedNotes}${reminder !== "NONE" ? `\n\n🔔 Recordatorio: ${reminder}` : ""}`
        : reminder !== "NONE"
          ? `🔔 Recordatorio: ${reminder}`
          : undefined;

      if (isEdit && editing) {
        await updateAppointment(editing.id, {
          title,
          propertyId: propertyId || undefined,
          startAt: new Date(startDate),
          endAt: endDate ? new Date(endDate) : undefined,
          location: location || undefined,
          attendees: attendees || undefined,
          notes: composedNotes,
        });
        toast.success(t.agenda.toastUpdated);
      } else {
        await createAppointment({
          title,
          propertyId: propertyId || undefined,
          startAt: new Date(startDate),
          endAt: endDate ? new Date(endDate) : undefined,
          location: location || undefined,
          attendees: attendees || undefined,
          notes: composedNotes,
        });
        toast.success(t.agenda.toastCreated, {
          description: `${t.agenda.reminder}: ${reminder === "NONE" ? t.agenda.noReminder : reminder}`,
        });
      }
      onOpenChange(false);
      if (!isEdit) {
        setTitle("");
        setPropertyId("");
        setLocation("");
        setAttendees("");
        setNotes("");
        setEndDate("");
        setReminder("NONE");
      }
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {isEdit ? t.agenda.editAppointment : t.agenda.newAppointment}
            {initialDate && !isEdit && (
              <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {format(initialDate, "EEE d MMM", { locale: es })}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label={t.agenda.fieldTitle}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.agenda.titlePlaceholder}
            />
          </Field>

          <Field label={t.agenda.property}>
            <Select
              value={propertyId || "__none"}
              onValueChange={(v) => setPropertyId(v === "__none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.agenda.noProperty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">{t.agenda.noProperty}</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.agenda.fieldStart}>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label={t.agenda.endLabel}>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label={`🔔 ${t.agenda.reminder}`}>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">{t.agenda.noReminder}</SelectItem>
                <SelectItem value="15 min antes">{t.agenda.reminder15min}</SelectItem>
                <SelectItem value="1 hora antes">{t.agenda.reminder1hour}</SelectItem>
                <SelectItem value="1 día antes">{t.agenda.reminder1day}</SelectItem>
                <SelectItem value="1 semana antes">{t.agenda.reminder1week}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t.agenda.location}>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.agenda.locationPlaceholder}
            />
          </Field>

          <Field label={t.agenda.attendees}>
            <Input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder={t.agenda.attendeesPlaceholder}
            />
          </Field>

          <Field label={t.agenda.notes}>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.agenda.notesPlaceholder}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t.agenda.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t.agenda.saveChanges : t.agenda.createAppointment}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ============================================================
// TIMELINE TAB (pill style — Day/Week/Month/Year)
// ============================================================

function TimelineTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-full px-4 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

// ============================================================
// WEEK VIEW — timeline grid (Mon-Sun x hourly)
// ============================================================

const HOUR_START = 7;
const HOUR_END = 22;
const HOUR_HEIGHT = 64;

function WeekView({
  anchor,
  onNavigate,
  items,
  onCreate,
  onItemClick,
  onDayClick,
}: {
  anchor: Date;
  onNavigate: (d: Date) => void;
  items: Appointment[];
  onCreate: (d?: Date) => void;
  onItemClick: (a: Appointment) => void;
  onDayClick: (d: Date) => void;
}) {
  const { t } = useT();
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i
  );

  const now = new Date();
  const showNowLine = days.some((d) => isSameDay(d, now));
  const nowTop =
    ((now.getHours() - HOUR_START) * 60 + now.getMinutes()) *
    (HOUR_HEIGHT / 60);

  function eventsForDay(d: Date) {
    return items.filter((it) => isSameDay(new Date(it.startAt), d));
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onNavigate(addDays(start, -7))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => onNavigate(new Date())}
            className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-card/80"
          >
            {t.agenda.today}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onNavigate(addDays(start, 7))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <p className="ml-2 text-sm font-semibold tracking-tight">
            {format(start, "MMM d", { locale: es })} —{" "}
            {format(addDays(start, 6), "MMM d, yyyy", { locale: es })}
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {items.length} {t.agenda.appointmentsCount} · {t.agenda.weekSuffix}
        </p>
      </div>

      <div className="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-card/85 backdrop-blur">
        <div className="border-r border-border" />
        {days.map((d) => {
          const today = isToday(d);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onDayClick(d)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 border-r border-border py-3 text-center transition-colors last:border-r-0 hover:bg-card/60",
                today && "bg-primary/[0.04]"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {format(d, "EEE", { locale: es })}
              </span>
              <span
                className={cn(
                  "font-mono text-base font-semibold tabular-nums",
                  today &&
                    "rounded-full bg-primary px-2 py-0.5 text-primary-foreground"
                )}
              >
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-x-auto">
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)]"
          style={{ minHeight: hours.length * HOUR_HEIGHT }}
        >
          <div className="border-r border-border">
            {hours.map((h) => (
              <div
                key={h}
                className="border-b border-border/60 px-2 pt-1 text-[10px] font-mono tabular-nums text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={eventsForDay(day)}
              onCreate={onCreate}
              onItemClick={onItemClick}
            />
          ))}
        </div>

        {showNowLine && nowTop >= 0 && nowTop <= hours.length * HOUR_HEIGHT && (
          <div
            className="pointer-events-none absolute left-[60px] right-0 z-10 flex items-center"
            style={{ top: nowTop }}
            aria-hidden
          >
            <span className="relative -ml-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
            </span>
            <div className="ml-0 h-px flex-1 border-t border-dashed border-primary/60" />
          </div>
        )}
      </div>
    </Card>
  );
}

function DayColumn({
  day,
  events,
  onCreate,
  onItemClick,
}: {
  day: Date;
  events: Appointment[];
  onCreate: (d?: Date) => void;
  onItemClick: (a: Appointment) => void;
}) {
  const { t } = useT();
  const today = isToday(day);
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i
  );

  function handleSlotClick(hour: number) {
    onCreate(setMinutes(setHours(day, hour), 0));
  }

  return (
    <div
      className={cn(
        "relative border-r border-border last:border-r-0",
        today && "bg-primary/[0.02]"
      )}
    >
      {hours.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => handleSlotClick(h)}
          className="block w-full border-b border-border/40 transition-colors hover:bg-foreground/[0.025]"
          style={{ height: HOUR_HEIGHT }}
          aria-label={`${t.agenda.createAppointmentAt} ${h}:00`}
        />
      ))}

      {events.map((ev) => (
        <WeekEventCard
          key={ev.id}
          event={ev}
          onClick={() => onItemClick(ev)}
        />
      ))}
    </div>
  );
}

function WeekEventCard({
  event,
  onClick,
}: {
  event: Appointment;
  onClick: () => void;
}) {
  const { t } = useT();
  const start = new Date(event.startAt);
  const end = event.endAt
    ? new Date(event.endAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const startMins = (start.getHours() - HOUR_START) * 60 + start.getMinutes();
  const durMins = Math.max(30, differenceInMinutes(end, start));
  const top = (startMins * HOUR_HEIGHT) / 60;
  const height = (durMins * HOUR_HEIGHT) / 60 - 2;

  const meta = STATUS_META[event.status] ?? STATUS_META.PENDIENTE;
  const isPending = event.status === "PENDIENTE";
  const isCompleted = event.status === "COMPLETADO";

  if (top < 0 || top > (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT) return null;

  const initials =
    (event.attendees ?? event.title ?? "—")
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "·";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute inset-x-1 z-[1] overflow-hidden rounded-lg border bg-background p-2 shadow-sm transition-all hover:z-[5] hover:shadow-md cursor-pointer",
        meta.border,
        isCompleted && "opacity-70"
      )}
      style={{ top, height }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="flex items-start gap-1.5">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className={cn("text-[9px] font-semibold", meta.bg)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold leading-tight">
            {event.attendees ?? t.agenda.client}
          </p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
            {event.title}
          </p>
        </div>
      </div>
      {height >= 56 && (
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 font-mono text-[9.5px] tabular-nums text-muted-foreground">
            <Clock className="h-2.5 w-2.5" strokeWidth={1.75} />
            {format(start, "HH:mm")} – {format(end, "HH:mm")}
          </span>
          {height >= 64 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider",
                isPending ? "bg-amber-500/15 text-amber-600" : meta.bg
              )}
            >
              {statusLabel(t, event.status)}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// DAY VIEW
// ============================================================

function DayView({
  date,
  onNavigate,
  items,
  onCreate,
  onItemClick,
}: {
  date: Date;
  onNavigate: (d: Date) => void;
  items: Appointment[];
  onCreate: (d?: Date) => void;
  onItemClick: (a: Appointment) => void;
}) {
  const { t } = useT();
  const dayEvents = items.filter((it) => isSameDay(new Date(it.startAt), date));
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i
  );
  const now = new Date();
  const showNowLine = isSameDay(date, now);
  const nowTop =
    ((now.getHours() - HOUR_START) * 60 + now.getMinutes()) *
    (HOUR_HEIGHT / 60);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onNavigate(addDays(date, -1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => onNavigate(new Date())}
            className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-card/80"
          >
            {t.agenda.today}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onNavigate(addDays(date, 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <div className="ml-2">
            <p className="text-sm font-semibold capitalize tracking-tight">
              {format(date, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {dayEvents.length}{" "}
              {dayEvents.length === 1
                ? t.agenda.appointmentSingular
                : t.agenda.appointmentsCount}
              {isToday(date) && ` · ${t.agenda.todaySuffix}`}
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-y-auto">
        <div
          className="grid grid-cols-[80px_1fr]"
          style={{ minHeight: hours.length * HOUR_HEIGHT }}
        >
          <div className="border-r border-border">
            {hours.map((h) => (
              <div
                key={h}
                className="border-b border-border/60 px-3 pt-1.5 text-[11px] font-mono tabular-nums text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div className="relative">
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onCreate(setMinutes(setHours(date, h), 0))}
                className="block w-full border-b border-border/40 transition-colors hover:bg-foreground/[0.025]"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {dayEvents.map((ev) => (
              <DayEventCard
                key={ev.id}
                event={ev}
                onClick={() => onItemClick(ev)}
              />
            ))}
          </div>
        </div>

        {showNowLine && nowTop >= 0 && nowTop <= hours.length * HOUR_HEIGHT && (
          <div
            className="pointer-events-none absolute left-[80px] right-0 z-10 flex items-center"
            style={{ top: nowTop }}
            aria-hidden
          >
            <span className="relative -ml-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
            </span>
            <div className="ml-0 h-px flex-1 border-t border-dashed border-primary/60" />
          </div>
        )}
      </div>
    </Card>
  );
}

function DayEventCard({
  event,
  onClick,
}: {
  event: Appointment;
  onClick: () => void;
}) {
  const { t } = useT();
  const start = new Date(event.startAt);
  const end = event.endAt
    ? new Date(event.endAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const startMins = (start.getHours() - HOUR_START) * 60 + start.getMinutes();
  const durMins = Math.max(30, differenceInMinutes(end, start));
  const top = (startMins * HOUR_HEIGHT) / 60;
  const height = (durMins * HOUR_HEIGHT) / 60 - 2;
  const meta = STATUS_META[event.status] ?? STATUS_META.PENDIENTE;

  const initials =
    (event.attendees ?? event.title ?? "—")
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "·";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute inset-x-3 z-[1] cursor-pointer overflow-hidden rounded-xl border bg-background p-3 shadow-sm transition-all hover:shadow-md",
        meta.border
      )}
      style={{ top, height }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
          <AvatarFallback className={cn("text-[10px] font-semibold", meta.bg)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {event.attendees ?? t.agenda.client}
          </p>
          <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
            {event.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Clock className="h-3 w-3" strokeWidth={1.75} />
              {format(start, "HH:mm")} – {format(end, "HH:mm")}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {event.location}
              </span>
            )}
            {event.propertyTitle && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" strokeWidth={1.75} />
                {event.propertyTitle}
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            meta.bg
          )}
        >
          {statusLabel(t, event.status)}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================
// YEAR VIEW — 12 mini-month heatmap
// ============================================================

function YearView({
  year,
  items,
  onMonthClick,
  onDayClick,
}: {
  year: number;
  items: Appointment[];
  onMonthClick: (m: number) => void;
  onDayClick: (d: Date) => void;
}) {
  const { t } = useT();
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      const d = new Date(it.startAt);
      if (d.getFullYear() !== year) continue;
      const k = format(d, "yyyy-MM-dd");
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [items, year]);

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <Card className="overflow-hidden p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-2xl font-semibold tracking-tight">{year}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {items.filter((it) => new Date(it.startAt).getFullYear() === year).length}{" "}
          {t.agenda.appointmentsThisYear}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {months.map((m) => (
          <MiniMonth
            key={m.toISOString()}
            month={m}
            byDay={byDay}
            onClick={() => onMonthClick(m.getMonth())}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </Card>
  );
}

function MiniMonth({
  month,
  byDay,
  onClick,
  onDayClick,
}: {
  month: Date;
  byDay: Map<string, number>;
  onClick: () => void;
  onDayClick: (d: Date) => void;
}) {
  const { t } = useT();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);
  const weekdayInitials = [
    t.agenda.weekdayInitialMon,
    t.agenda.weekdayInitialTue,
    t.agenda.weekdayInitialWed,
    t.agenda.weekdayInitialThu,
    t.agenda.weekdayInitialFri,
    t.agenda.weekdayInitialSat,
    t.agenda.weekdayInitialSun,
  ];

  let max = 0;
  for (const d of days) {
    const c = byDay.get(format(d, "yyyy-MM-dd")) ?? 0;
    if (c > max) max = c;
  }

  function intensity(c: number): string {
    if (c === 0) return "bg-card/40";
    const ratio = c / Math.max(max, 1);
    if (ratio >= 0.75) return "bg-primary text-primary-foreground";
    if (ratio >= 0.5) return "bg-primary/70 text-primary-foreground";
    if (ratio >= 0.25) return "bg-primary/45";
    return "bg-primary/25";
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <button
        type="button"
        onClick={onClick}
        className="mb-2 w-full text-left text-sm font-semibold capitalize tracking-tight transition-colors hover:text-primary"
      >
        {format(month, "MMMM", { locale: es })}
      </button>
      <div className="grid grid-cols-7 gap-1 text-[9px]">
        {weekdayInitials.map((d, i) => (
          <span
            key={i}
            className="text-center font-mono text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const today = isToday(d);
          const c = byDay.get(format(d, "yyyy-MM-dd")) ?? 0;
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onDayClick(d)}
              disabled={!inMonth}
              className={cn(
                "flex aspect-square items-center justify-center rounded font-mono text-[9px] transition-all tabular-nums",
                !inMonth && "opacity-20",
                inMonth && intensity(c),
                today && "ring-1 ring-foreground",
                c > 0 && "hover:scale-110"
              )}
              title={
                c > 0
                  ? `${c} ${c === 1 ? t.agenda.appointmentSingular : t.agenda.appointmentsCount}`
                  : ""
              }
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
