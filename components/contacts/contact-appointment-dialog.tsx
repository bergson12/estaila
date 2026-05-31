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
import { useT } from "@/lib/i18n/provider";

/** Default start = next full hour from now, formatted for <input datetime-local>. */
function nextHourLocal() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const REMINDER_VALUES = [
  { value: "NONE", labelKey: "reminderNone" as const },
  { value: "10 min antes", labelKey: "reminder10min" as const },
  { value: "1 hora antes", labelKey: "reminder1hour" as const },
  { value: "1 día antes", labelKey: "reminder1day" as const },
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
  const { t, locale } = useT();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(nextHourLocal);
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState("1 hora antes");

  const reminderLabel = (value: string) => {
    const r = REMINDER_VALUES.find((x) => x.value === value);
    return r ? t.contactos[r.labelKey] : value;
  };

  // Reset + prefill each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTitle(`${t.contactos.apptWithPrefix} ${contactName}`);
    setStartDate(nextHourLocal());
    setEndDate("");
    setLocation("");
    setNotes("");
    setReminder("1 hora antes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contactName]);

  async function onSubmit() {
    if (!title.trim()) {
      toast.error(t.contactos.toastTitleRequired);
      return;
    }
    if (!startDate) {
      toast.error(t.contactos.toastStartRequired);
      return;
    }
    setSubmitting(true);
    try {
      const composedNotes =
        reminder !== "NONE"
          ? notes.trim()
            ? `${notes.trim()}\n\n🔔 ${t.contactos.reminderPrefix}: ${reminderLabel(reminder)}`
            : `🔔 ${t.contactos.reminderPrefix}: ${reminderLabel(reminder)}`
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

      toast.success(t.contactos.toastApptCreated, {
        description: `${format(new Date(startDate), "EEE d MMM, h:mm a", {
          locale: locale === "en" ? undefined : es,
        })}${reminder !== "NONE" ? ` · ${reminderLabel(reminder)}` : ""}`,
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
            {t.contactos.apptNewTitle}
          </DialogTitle>
          <DialogDescription>
            {t.contactos.apptDescPrefix} {contactName} {t.contactos.apptDescSuffix}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t.contactos.apptTitle}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.contactos.apptTitlePlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t.contactos.apptStart}</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.contactos.apptEnd}
              </Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t.contactos.apptPlace}</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.contactos.apptPlacePlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t.contactos.apptReminder}</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_VALUES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t.contactos[r.labelKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t.contactos.apptNotes}
            </Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.contactos.apptNotesPlaceholder}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t.contactos.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={submitting} variant="ink">
            {submitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t.contactos.apptCreateButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
