"use client";

/**
 * Estaila Assistant — floating chatbot widget with action chips.
 *
 * The bot returns { text, actions[] } JSON. Each action becomes a clickable
 * chip under the message bubble — navigate routes, or one-tap create
 * contact/property/appointment.
 */

import {
  ArrowRight,
  Calendar,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  User,
  Building2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  realEstateChat,
  chatCreateContact,
  chatCreateProperty,
  chatCreateAppointment,
  type ChatTurn,
  type ChatAction,
} from "@/lib/actions/ai-text";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "estaila:chatbot:history:v2";
const MAX_TURNS = 30;

const SUGGESTED = [
  "¿Cómo posicionar el precio de una casa en Punta Cana?",
  "Dame 3 ideas de post Instagram para casa de playa",
  "Crea un contacto: María López +1 829 555 1234",
  "Plan marketing 30 días para listado nuevo",
];

type StoredTurn = ChatTurn & { actions?: ChatAction[] };

export function EstailaChatbot() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<StoredTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredTurn[];
        if (Array.isArray(parsed)) setHistory(parsed.slice(-MAX_TURNS));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (history.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_TURNS)));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, open, sending]);

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setHistory((h) => [...h, { role: "user", content: text }]);
    setSending(true);
    try {
      const response = await realEstateChat({
        history: history.slice(-10).map((t) => ({
          role: t.role,
          content: t.content,
        })),
        message: text,
      });
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: response.text,
          actions: response.actions,
        },
      ]);
    } catch (e) {
      toast.error((e as Error).message);
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content:
            "Algo falló. ¿Intenta de nuevo? Si persiste, revisa DEEPSEEK_API_KEY.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function runAction(action: ChatAction) {
    const actionKey = `${action.type}-${action.label}`;
    setActing(actionKey);
    try {
      if (action.type === "navigate" || action.type === "ai_tool") {
        router.push(action.href);
        setOpen(false);
      } else if (action.type === "create_contact") {
        const result = await chatCreateContact(
          action.data as {
            name: string;
            phone?: string;
            email?: string;
            notes?: string;
          }
        );
        toast.success("Contacto creado", {
          description: action.data.name,
          action: {
            label: "Ver",
            onClick: () => router.push(`/contactos/${result.id}`),
          },
        });
      } else if (action.type === "create_property") {
        const result = await chatCreateProperty(
          action.data as Parameters<typeof chatCreateProperty>[0]
        );
        toast.success("Propiedad creada", {
          description: String(action.data.title ?? ""),
          action: {
            label: "Ver",
            onClick: () => router.push(`/propiedades/${result.id}`),
          },
        });
      } else if (action.type === "create_appointment") {
        const result = await chatCreateAppointment(
          action.data as Parameters<typeof chatCreateAppointment>[0]
        );
        toast.success("Cita agendada", {
          description: String(action.data.title ?? ""),
          action: {
            label: "Ver",
            onClick: () => router.push(`/agenda?focus=${result.id}`),
          },
        });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(null);
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Asistente IA"
        className={cn(
          "fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
          "shadow-primary/25 hover:scale-110 hover:shadow-xl hover:shadow-primary/40",
          open && "rotate-12 scale-95"
        )}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-5 z-40 flex h-[600px] w-[400px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-br from-primary/10 to-transparent px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Estaila Assistant</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pricing · Posts · Crear datos · Navegación
                  </p>
                </div>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  title="Limpiar historial"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MessageSquareText className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-background/50 p-3"
            >
              {history.length === 0 && (
                <div className="space-y-2">
                  <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                    Soy tu asistente IA. Te ayudo con estrategia, contenido,
                    onboarding y puedo <strong className="text-primary">crear datos</strong> en tu
                    CRM cuando me los digas (contactos, propiedades, citas).
                  </div>
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sugerencias
                  </p>
                  {SUGGESTED.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="block w-full rounded-lg border border-border bg-card p-2.5 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {history.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col",
                    m.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-card text-foreground"
                    )}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" &&
                    m.actions &&
                    m.actions.length > 0 && (
                      <div className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
                        {m.actions.map((action, idx) => (
                          <ActionChip
                            key={idx}
                            action={action}
                            disabled={acting !== null}
                            loading={acting === `${action.type}-${action.label}`}
                            onClick={() => runAction(action)}
                          />
                        ))}
                      </div>
                    )}
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg rounded-bl-sm border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Pensando...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-border bg-card p-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta o pide crear algo..."
                disabled={sending}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionChip({
  action,
  onClick,
  disabled,
  loading,
}: {
  action: ChatAction;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const meta = getActionMeta(action);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        "border-primary/40 bg-primary/10 text-primary",
        "hover:bg-primary hover:text-primary-foreground hover:shadow-sm hover:shadow-primary/20",
        "disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary"
      )}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <meta.Icon className="h-3 w-3" strokeWidth={2} />
      )}
      <span>{action.label}</span>
      {!loading && <ArrowRight className="h-2.5 w-2.5 opacity-60" />}
    </button>
  );
}

function getActionMeta(action: ChatAction): {
  Icon: typeof Sparkles;
} {
  switch (action.type) {
    case "navigate":
      return { Icon: ArrowRight };
    case "ai_tool":
      return { Icon: Sparkles };
    case "create_contact":
      return { Icon: User };
    case "create_property":
      return { Icon: Building2 };
    case "create_appointment":
      return { Icon: Calendar };
    default:
      return { Icon: ArrowRight };
  }
}

// Keep Link import lint-suppressed (reserved for future deep-links)
export const _LinkRef = Link;
