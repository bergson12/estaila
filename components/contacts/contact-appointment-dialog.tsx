"use client";

import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointment } from "@/lib/actions/appointment";

/** Default start = next full hour from now, formatted for <input datetime-local>. */
function nextHourLocal() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const REMINDERS = [
  { value: "NONE", label: "Sin recordatorio" },
  { value: "10 min antes", label: "10 minutos antes" },
  { value: "1 hora antes", label: "1 hora antes" },
  { value: "1 día antes", label: "1 día antes" },
];

export function ContactAppointmentDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  contactPhone,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  contactId: string;
  contactName: string;
  contactPhone?: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(nextHourLocal);
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState("1 hora antes");

  // Reset + prefill each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTitle(`Cita con ${contactName}`);
    setStartDate(nextHourLocal());
    setEndDate("");
    setLocation("");
    setNotes("");
    setReminder("1 hora antes");
  }, [open, contactName]);

  async function onSubmit() {
    if (!title.trim()) {
      toast.error("Título requerido");
      return;
    }
    if (!startDate) {
      toast.error("Fecha de inicio requerida");
      return;
    }
    setSubmitting(true);
    try {
      const composedNotes =
        reminder !== "NONE"
          ? notes.trim()
            ? `${notes.trim()}\n\n🔔 Recordatorio: ${reminder}`
            : `🔔 Recordatorio: ${reminder}`
          : notes.trim() || undefined;

      // attendees: dejamos rastro del contacto para la vista de agenda.
      const attendees = contactPhone
        ? `${contactName} · ${contactPhone}`
        : contactName;

      await createAppointment({
        title: title.trim(),
        contactId,
        startAt: new Date(startDate),
        endAt: endDate ? new Date(endDate) : undefined,
        location: location.trim() || undefined,
        attendees,
        notes: composedNotes,
      });

      toast.success("Cita creada", {
        description: `${format(new Date(startDate), "EEE d MMM, h:mm a", {
          locale: es,
        })}${reminder !== "NONE" ? ` · ${reminder}` : ""}`,
      });
      onOpenChange(false);
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
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CalendarIcon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            Nueva cita
          </DialogTitle>
          <DialogDescription>
            Se vincula automáticamente a {contactName} y aparece en su pestaña
            de citas y en tu agenda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Visita a propiedad"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Inicio</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Fin (opcional)
              </Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Lugar</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Oficina, propiedad, videollamada…"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Recordatorio</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDERS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Notas (opcional)
            </Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles, agenda de la reunión…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting} variant="ink">
            {submitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            )}
            Crear cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
