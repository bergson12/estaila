"use client";

import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Play,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteAppointment,
  updateAppointmentStatus,
} from "@/lib/actions/appointment";
import { cn } from "@/lib/utils";

// Local type — mirrors the Appointment shape from agenda-client.tsx.
// Date | string for cross-component compatibility (server passes strings).
export type Appointment = {
  id: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string | null;
  status: string;
  location: string | null;
  attendees: string | null;
  notes: string | null;
  propertyId: string | null;
  propertyTitle?: string | null;
};

const STATUS_META: Record<
  string,
  { label: string; bg: string; border: string; icon: typeof Clock }
> = {
  PENDIENTE: {
    label: "Pendiente",
    bg: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    border: "border-amber-500/30",
    icon: Clock,
  },
  EN_CURSO: {
    label: "En curso",
    bg: "bg-primary/15 text-primary border-primary/30",
    border: "border-primary/30",
    icon: Play,
  },
  COMPLETADO: {
    label: "Completado",
    bg: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  CANCELADO: {
    label: "Cancelado",
    bg: "bg-destructive/15 text-destructive border-destructive/30",
    border: "border-destructive/30",
    icon: X,
  },
};

const STATUS_OPTIONS = ["PENDIENTE", "EN_CURSO", "COMPLETADO", "CANCELADO"];

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  appointment,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  appointment: Appointment | null;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!appointment) return null;
  const a = appointment;

  const meta = STATUS_META[a.status] ?? STATUS_META.PENDIENTE;
  const start = new Date(a.startAt);
  const end = a.endAt
    ? new Date(a.endAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const StatusIcon = meta.icon;

  // Extract a possible reminder line from notes
  const reminderMatch = (a.notes ?? "").match(/🔔 Recordatorio:\s*([^\n]+)/);
  const reminder = reminderMatch ? reminderMatch[1].trim() : null;
  const cleanNotes = (a.notes ?? "")
    .replace(/🔔 Recordatorio:[^\n]+/g, "")
    .trim();

  function changeStatus(newStatus: string) {
    if (newStatus === a.status) return;
    startTransition(async () => {
      try {
        await updateAppointmentStatus(a.id, newStatus);
        toast.success(
          `Marcada como ${STATUS_META[newStatus]?.label.toLowerCase() ?? newStatus.toLowerCase()}`
        );
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${a.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteAppointment(a.id);
        toast.success("Cita eliminada");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  // Parse first attendee phone-like value for quick WhatsApp action
  const firstAttendee = (a.attendees ?? "").split(",")[0]?.trim() ?? "";
  const phoneMatch = firstAttendee.match(/(\+?\d[\d\s\-()]{6,})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/[^\d+]/g, "") : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-card/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                meta.bg
              )}
            >
              <StatusIcon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-lg leading-tight">
                {a.title}
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                <CalendarIcon className="h-3 w-3" strokeWidth={1.75} />
                {format(start, "EEE d MMM", { locale: es })}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalle de la cita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {/* Status + change */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                meta.bg
              )}
            >
              <StatusIcon className="h-3 w-3" strokeWidth={2} />
              {meta.label}
            </span>
            <Select
              value={a.status}
              onValueChange={changeStatus}
              disabled={pending}
            >
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    disabled={s === a.status}
                  >
                    {STATUS_META[s]?.label ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time block */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/40 p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Inicio
              </p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {format(start, "HH:mm")}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {format(start, "d MMM yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fin
              </p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {format(end, "HH:mm")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(start, { locale: es, addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Property */}
          {a.propertyId && (
            <Link
              href={`/propiedades/${a.propertyId}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-background"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Building2 className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Propiedad
                </p>
                <p className="mt-0.5 truncate text-sm font-medium">
                  {a.propertyTitle ?? "Ver propiedad"}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          )}

          {/* Location */}
          {a.location && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ubicación
                </p>
                <p className="mt-0.5 text-sm">{a.location}</p>
              </div>
            </div>
          )}

          {/* Attendees */}
          {a.attendees && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <Users className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Asistentes
                </p>
                <p className="mt-0.5 text-sm">{a.attendees}</p>
              </div>
              {phone && (
                <a
                  href={`https://wa.me/${phone.replace(/^\+/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Reminder */}
          {reminder && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs">
              <span className="text-base">🔔</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Recordatorio: {reminder}
              </span>
            </div>
          )}

          {/* Notes */}
          {cleanNotes && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notas
              </p>
              <p className="whitespace-pre-line rounded-xl border border-border bg-background/40 p-3 text-sm leading-relaxed">
                {cleanNotes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border bg-card/40 px-6 py-3 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Eliminar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button variant="ink" size="sm" onClick={onEdit}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
