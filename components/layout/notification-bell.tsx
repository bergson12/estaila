"use client";

import {
  Bell,
  BellOff,
  BellRing,
  Calendar,
  ChevronRight,
  Loader2,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getLiveNotifications,
  type LiveNotification,
} from "@/lib/actions/notifications";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function readPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as PermissionState;
}

const TYPE_META: Record<
  LiveNotification["type"],
  { icon: typeof Bell; tone: string; label: string }
> = {
  APPOINTMENT: { icon: Calendar, tone: "text-blue-500", label: "Cita" },
  LEAD: { icon: UserPlus, tone: "text-emerald-500", label: "Lead" },
  PIPELINE: { icon: TrendingUp, tone: "text-amber-500", label: "Pipeline" },
  PROPERTY: { icon: TrendingUp, tone: "text-purple-500", label: "Propiedad" },
  SYSTEM: { icon: Bell, tone: "text-muted-foreground", label: "Sistema" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LiveNotification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("default");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Permission state hydration
  useEffect(() => {
    setPermission(readPermission());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLiveNotifications();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on first open + refresh every 60s while open
  useEffect(() => {
    if (!open) return;
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [open, load]);

  // Background poll for unread badge — runs every 5 min regardless of open state
  useEffect(() => {
    void load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    if (result === "granted") {
      // Show a welcome notification so the user sees what they're enabling.
      new Notification("Notificaciones activadas en estaila", {
        body: "Te avisaremos de citas, leads nuevos y recordatorios.",
        icon: "/logos/iso-estaila.png",
        badge: "/logos/iso-estaila.png",
      });
    }
  }

  // Fire native push for any new high-urgency items once permission is granted.
  // Tracks "seen" IDs in localStorage so we don't notify twice.
  useEffect(() => {
    if (permission !== "granted" || !items) return;
    const seenKey = "estaila:notifications:seen";
    let seen: string[];
    try {
      seen = JSON.parse(localStorage.getItem(seenKey) ?? "[]");
    } catch {
      seen = [];
    }
    const fresh = items.filter(
      (i) => i.urgency === "high" && i.unread && !seen.includes(i.id)
    );
    for (const n of fresh) {
      try {
        new Notification(n.title, {
          body: n.description,
          icon: n.imageUrl ?? "/logos/iso-estaila.png",
          tag: n.id,
        });
      } catch {
        // ignore
      }
    }
    if (fresh.length > 0) {
      const newSeen = [...seen, ...fresh.map((f) => f.id)].slice(-200);
      localStorage.setItem(seenKey, JSON.stringify(newSeen));
    }
  }, [items, permission]);

  const unreadCount = items?.filter((i) => i.unread).length ?? 0;
  const hasHigh = items?.some((i) => i.urgency === "high");

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative"
      >
        <Bell
          className={cn(
            "h-4 w-4 transition-transform",
            hasHigh && "animate-[wiggle_1.6s_ease-in-out_infinite]"
          )}
        />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white",
              hasHigh ? "bg-red-500" : "bg-primary"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-1.5rem)] origin-top-right overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/10 dark:shadow-black/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notificaciones</p>
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} sin leer`
                    : "Todo al día"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Push permission banner */}
            {permission === "default" && (
              <div className="border-b border-border bg-primary/5 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <BellRing
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight">
                      Activa notificaciones del navegador
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Recibe avisos de citas y leads aunque no tengas estaila
                      abierto.
                    </p>
                    <button
                      onClick={requestPermission}
                      className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Activar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {permission === "denied" && (
              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <BellOff className="h-3 w-3" />
                  Notificaciones bloqueadas. Cambia el permiso en tu navegador.
                </p>
              </div>
            )}

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading && items === null ? (
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cargando notificaciones
                </div>
              ) : !items || items.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin notificaciones</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Cuando tengas citas, leads o tareas urgentes aparecerán aquí.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const meta = TYPE_META[n.type];
                    const Icon = meta.icon;
                    const Wrap = n.href
                      ? (props: { children: React.ReactNode }) => (
                          <Link
                            href={n.href!}
                            onClick={() => setOpen(false)}
                            className="block transition-colors hover:bg-muted/60"
                          >
                            {props.children}
                          </Link>
                        )
                      : (props: { children: React.ReactNode }) => (
                          <div>{props.children}</div>
                        );
                    return (
                      <li key={n.id}>
                        <Wrap>
                          <div className="flex items-start gap-3 px-4 py-3">
                            {n.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={n.imageUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted",
                                  meta.tone
                                )}
                              >
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p className="line-clamp-2 flex-1 text-sm font-medium leading-tight">
                                  {n.title}
                                </p>
                                {n.urgency === "high" && (
                                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                {n.description}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                                <span className={cn("font-medium", meta.tone)}>
                                  {meta.label}
                                </span>
                              </div>
                            </div>
                            {n.href && (
                              <ChevronRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                        </Wrap>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer quick links */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/30 text-center text-[11px]">
              <Link
                href="/agenda"
                onClick={() => setOpen(false)}
                className="py-2 transition-colors hover:bg-muted/60"
              >
                Agenda
              </Link>
              <Link
                href="/pipeline"
                onClick={() => setOpen(false)}
                className="py-2 transition-colors hover:bg-muted/60"
              >
                Pipeline
              </Link>
              <Link
                href="/contactos"
                onClick={() => setOpen(false)}
                className="py-2 transition-colors hover:bg-muted/60"
              >
                Contactos
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
