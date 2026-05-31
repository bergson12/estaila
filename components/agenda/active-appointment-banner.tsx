"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getActiveAppointment,
  completeAppointment,
} from "@/lib/actions/appointment";

type ActiveAppt = {
  id: string;
  title: string;
  startAt: string | Date;
  endAt: string | Date | null;
  location: string | null;
  propertyId: string | null;
  contactId: string | null;
  propertyTitle: string | null;
};

function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Banner global que aparece automáticamente cuando hay una cita en curso.
 * Persiste en todos los módulos del dashboard. Se minimiza a un pill. */
export function ActiveAppointmentBanner() {
  const router = useRouter();
  const [appt, setAppt] = useState<ActiveAppt | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    // setState ocurre SOLO tras el await → no es síncrono dentro del effect.
    const tick = async () => {
      try {
        const a = await getActiveAppointment();
        if (!active) return;
        setAppt((a as ActiveAppt | null) ?? null);
        if (!a) setMinimized(false);
      } catch {
        /* silencioso: no romper el dashboard por el polling */
      }
    };
    void tick();
    const id = setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  async function onFinish() {
    if (!appt) return;
    setSaving(true);
    try {
      await completeAppointment(appt.id, notes);
      toast.success("Cita finalizada");
      setEndOpen(false);
      setNotes("");
      setAppt(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!appt) return null;

  const timeRange = `${fmtTime(appt.startAt)}${
    appt.endAt ? `–${fmtTime(appt.endAt)}` : ""
  }`;

  return (
    <>
      <AnimatePresence mode="wait">
        {minimized ? (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setMinimized(false)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 z-40 flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-700 shadow-lg backdrop-blur-md dark:text-amber-300 md:bottom-6"
          >
            <PulseDot />
            En cita
          </motion.button>
        ) : (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[4.5rem] z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 shadow-lg backdrop-blur-xl sm:px-4">
              <PulseDot />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  En cita ahora · {timeRange}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {appt.title}
                  {appt.propertyTitle && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {appt.propertyTitle}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden h-8 px-2 text-xs sm:inline-flex"
                >
                  <Link href="/agenda">Ver</Link>
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-amber-600 px-2.5 text-xs text-white hover:bg-amber-600/90"
                  onClick={() => setEndOpen(true)}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Finalizar
                </Button>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="rounded-md p-1 text-amber-700/70 transition-colors hover:bg-amber-500/20 dark:text-amber-300/70"
                  aria-label="Minimizar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={endOpen} onOpenChange={setEndOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <p className="text-sm font-medium">{appt.title}</p>
              {appt.propertyTitle && (
                <p className="text-xs text-muted-foreground">
                  {appt.propertyTitle}
                </p>
              )}
              {appt.location && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {appt.location}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                ¿Cómo fue la cita?
              </label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas, próximos pasos, interés del cliente…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEndOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={onFinish}
              disabled={saving}
              className="bg-amber-600 text-white hover:bg-amber-600/90"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar completada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PulseDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
    </span>
  );
}
