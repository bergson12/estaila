"use client";

/**
 * Estaila Assistant — floating AI chatbot with:
 *   - Expanded "time saver" FAB (chip → icon once first chat starts)
 *   - Saved conversations rail (DB-persisted)
 *   - Wizard mode templates: Contacto / Propiedad / Cita
 *   - Action chips (navigate, ai_tool, create_*)
 */

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronLeft,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MessageSquarePlus,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Building2,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  realEstateChat,
  chatCreateContact,
  chatCreateProperty,
  chatCreateAppointment,
  listConversations,
  loadConversation,
  createConversation,
  saveConversationTurn,
  deleteConversation,
  pinConversation,
  setConversationWizard,
  type ChatTurn,
  type ChatAction,
  type ConversationSummary,
} from "@/lib/actions/ai-text";
import { cn } from "@/lib/utils";

const FAB_DISMISSED_KEY = "estaila:chatbot:fab-collapsed";

type WizardKind = "CONTACT" | "PROPERTY" | "APPOINTMENT";

type StoredTurn = ChatTurn & {
  actions?: ChatAction[];
  /** Mark this turn as an error so we render the pretty error card */
  errorCode?: "empty" | "quota" | "network" | "unknown";
  /** Original user message to allow retry */
  retryOf?: string;
};

const SUGGESTED = [
  "¿Cómo posicionar el precio de una casa en Punta Cana?",
  "Dame 3 ideas de post Instagram para casa de playa",
  "Plan marketing 30 días para listado nuevo",
  "¿Qué documentos pido a un comprador serio?",
];

const WIZARD_TEMPLATES: {
  kind: WizardKind;
  icon: typeof User;
  title: string;
  subtitle: string;
  firstMessage: string;
}[] = [
  {
    kind: "CONTACT",
    icon: User,
    title: "Agregar contacto",
    subtitle: "Te guío paso a paso",
    firstMessage:
      "Quiero agregar un contacto nuevo. Hazme las preguntas necesarias una a una.",
  },
  {
    kind: "PROPERTY",
    icon: Building2,
    title: "Crear propiedad",
    subtitle: "Recopilo los datos contigo",
    firstMessage:
      "Quiero crear una propiedad nueva. Hazme las preguntas necesarias paso a paso.",
  },
  {
    kind: "APPOINTMENT",
    icon: Calendar,
    title: "Agendar cita",
    subtitle: "Te pregunto fecha y detalles",
    firstMessage:
      "Quiero agendar una cita. Hazme las preguntas necesarias paso a paso.",
  },
];

// Per-plan character cap for the chatbot input. Bumps with tier.
const CHAR_LIMITS: Record<string, number> = {
  FREE: 280,
  SOLO: 800,
  PRO: 2000,
  TEAM: 3000,
  AGENCY: 8000,
};

function charLimitForPlan(plan: string): number {
  return CHAR_LIMITS[plan.toUpperCase()] ?? CHAR_LIMITS.FREE;
}

// Reserved for future plan badge in chatbot header
export const _PLAN_LABEL: Record<string, string> = {
  FREE: "Free",
  SOLO: "Solo",
  PRO: "Pro",
  TEAM: "Team",
  AGENCY: "Agency",
};

export function EstailaChatbot({ plan = "FREE" }: { plan?: string }) {
  const maxChars = charLimitForPlan(plan);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [fabCollapsed, setFabCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<StoredTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardKind | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial: read FAB collapsed state
  useEffect(() => {
    try {
      const collapsed = localStorage.getItem(FAB_DISMISSED_KEY) === "1";
      setFabCollapsed(collapsed);
    } catch {
      // ignore
    }
  }, []);

  // Load conversations when opening history
  useEffect(() => {
    if (view === "history" && open) refreshConvos();
  }, [view, open]);

  // Autoscroll
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, open, sending]);

  // Focus input on open
  useEffect(() => {
    if (open && view === "chat") {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, view]);

  async function refreshConvos() {
    setLoadingConvos(true);
    try {
      const list = await listConversations();
      setConversations(list);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingConvos(false);
    }
  }

  function collapseFab() {
    setFabCollapsed(true);
    try {
      localStorage.setItem(FAB_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  async function openConvo(id: string) {
    try {
      const convo = await loadConversation(id);
      setConvoId(convo.id);
      setWizard(convo.wizard);
      setHistory(convo.messages);
      setView("chat");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function newChat(opts?: { wizard?: WizardKind; firstMessage?: string }) {
    setConvoId(null);
    setHistory([]);
    setWizard(opts?.wizard ?? null);
    setView("chat");
    if (opts?.firstMessage) {
      // Defer to allow state to settle
      setTimeout(() => send(opts.firstMessage), 50);
    }
  }

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || sending) return;
    if (!fabCollapsed) collapseFab();
    setInput("");
    setHistory((h) => [...h, { role: "user", content: text }]);
    setSending(true);

    // Ensure a conversation exists (create lazily on first message)
    let activeConvoId = convoId;
    try {
      if (!activeConvoId) {
        const created = await createConversation({
          title: text.slice(0, 60),
          wizard,
        });
        activeConvoId = created.id;
        setConvoId(created.id);
      }
    } catch (e) {
      // Persistence failure shouldn't block chat — log only
      console.warn("[chatbot] createConversation failed", e);
    }

    try {
      const response = await realEstateChat({
        history: history.slice(-10).map((t) => ({
          role: t.role,
          content: t.content,
        })),
        message: text,
        wizard,
      });

      // Classify error for nicer UX
      let errorCode: StoredTurn["errorCode"] | undefined;
      if (response.errorDetail) {
        const err = response.errorDetail.toLowerCase();
        if (err.includes("vacía") || err.includes("empty") || err.includes("finish_reason")) {
          errorCode = "empty";
        } else if (err.includes("quota") || err.includes("429") || err.includes("balance") || err.includes("credit")) {
          errorCode = "quota";
        } else if (err.includes("network") || err.includes("timeout") || err.includes("aborterror")) {
          errorCode = "network";
        } else {
          errorCode = "unknown";
        }
      }

      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: errorCode ? "" : response.text, // hide raw text on error
          actions: errorCode ? [] : response.actions,
          errorCode,
          retryOf: errorCode ? text : undefined,
        },
      ]);
      // No toast — the inline card is the feedback now

      // Persist turn only if it didn't fail
      if (activeConvoId && !response.errorDetail) {
        startTransition(() => {
          saveConversationTurn({
            conversationId: activeConvoId!,
            userMessage: text,
            assistantText: response.text,
            assistantActions: response.actions,
          }).catch((e) => {
            console.warn("[chatbot] saveConversationTurn failed", e);
          });
        });
      }
    } catch (e) {
      // Network / redacted RSC error. Show pretty card.
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "",
          errorCode: "network",
          retryOf: text,
        },
      ]);
    } finally {
      setSending(false);
      // Keep the composer focused so the user can keep typing without losing
      // focus / the mobile keyboard when the answer arrives.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  async function runAction(action: ChatAction) {
    const actionKey = `${action.type}-${action.label}`;
    setActing(actionKey);
    try {
      if (action.type === "navigate" || action.type === "ai_tool") {
        router.push(action.href);
        setOpen(false);
      } else if (action.type === "copy") {
        await navigator.clipboard.writeText(action.value);
        toast.success("Copiado al portapapeles", {
          description: action.value.slice(0, 60),
        });
      } else if (action.type === "external") {
        window.open(action.href, "_blank", "noopener,noreferrer");
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
        // End wizard
        if (wizard === "CONTACT") {
          setWizard(null);
          if (convoId) setConversationWizard({ id: convoId, wizard: null });
        }
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
        if (wizard === "PROPERTY") {
          setWizard(null);
          if (convoId) setConversationWizard({ id: convoId, wizard: null });
        }
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
        if (wizard === "APPOINTMENT") {
          setWizard(null);
          if (convoId) setConversationWizard({ id: convoId, wizard: null });
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(null);
    }
  }

  async function delConvo(id: string) {
    try {
      await deleteConversation(id);
      setConversations((c) => c.filter((x) => x.id !== id));
      if (convoId === id) {
        newChat();
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function togglePin(c: ConversationSummary) {
    try {
      await pinConversation({ id: c.id, pinned: !c.pinned });
      setConversations((list) =>
        list
          .map((x) => (x.id === c.id ? { ...x, pinned: !x.pinned } : x))
          .sort(
            (a, b) =>
              Number(b.pinned) - Number(a.pinned) ||
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      {/* FAB — expanded chip until first interaction, then collapses to icon */}
      <AnimatePresence mode="wait">
        {!open && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(true)}
            aria-label="Asistente IA · Ahorra tiempo"
            className={cn(
              "group fixed bottom-20 right-5 z-40 flex items-center overflow-hidden rounded-full shadow-lg transition-all md:bottom-5",
              "bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground",
              "shadow-primary/30 hover:shadow-xl hover:shadow-primary/50",
              fabCollapsed
                ? "h-12 w-12 justify-center"
                : "h-12 gap-2 pl-2.5 pr-4"
            )}
          >
            <span
              className={cn(
                "relative flex shrink-0 items-center justify-center rounded-full bg-white/15 transition-all",
                fabCollapsed ? "h-9 w-9" : "h-8 w-8"
              )}
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              <span className="absolute inset-0 animate-ping rounded-full bg-white/30 [animation-duration:2.5s]" />
            </span>
            {!fabCollapsed && (
              <span className="flex flex-col items-start text-left leading-tight">
                <span className="flex items-center gap-1 text-[11px] font-bold tracking-tight">
                  Tu asistente IA
                  <Zap className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <span className="text-[9px] font-medium opacity-80">
                  Te ahorra tiempo · Pregúntame
                </span>
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 right-5 z-40 flex h-[640px] w-[420px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-br from-primary/10 to-transparent px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                {view === "history" ? (
                  <button
                    onClick={() => setView("chat")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Volver al chat"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-card bg-emerald-400" />
                  </div>
                )}
                <div className="leading-tight">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {view === "history" ? "Conversaciones" : "Estaila"}
                    {wizard && view === "chat" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        <Wand2 className="h-2.5 w-2.5" />
                        {wizard === "CONTACT"
                          ? "Contacto"
                          : wizard === "PROPERTY"
                            ? "Propiedad"
                            : "Cita"}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {view === "history"
                      ? `${conversations.length} guardadas`
                      : "Asistente IA · Ahorra tiempo"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {view === "chat" && (
                  <>
                    <button
                      onClick={() => newChat()}
                      title="Nueva conversación"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setView("history")}
                      title="Conversaciones guardadas"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOpen(false)}
                  title="Cerrar"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            {view === "history" ? (
              <HistoryView
                conversations={conversations}
                loading={loadingConvos}
                activeId={convoId}
                onOpen={openConvo}
                onDelete={delConvo}
                onPin={togglePin}
                onNew={() => newChat()}
              />
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-3"
                >
                  {history.length === 0 && (
                    <EmptyState
                      onSuggest={(s) => send(s)}
                      onWizard={(w) => {
                        const tpl = WIZARD_TEMPLATES.find((t) => t.kind === w);
                        if (tpl) newChat({ wizard: w, firstMessage: tpl.firstMessage });
                      }}
                    />
                  )}
                  {history.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col",
                        m.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      {m.role === "assistant" && m.errorCode ? (
                        <ErrorCard
                          code={m.errorCode}
                          onRetry={
                            m.retryOf
                              ? () => {
                                  // Remove this error bubble + the last user msg
                                  // then resend
                                  setHistory((h) =>
                                    h.slice(0, Math.max(0, h.length - 2))
                                  );
                                  void send(m.retryOf);
                                }
                              : undefined
                          }
                          onUpgrade={() => {
                            router.push("/pricing");
                            setOpen(false);
                          }}
                        />
                      ) : (
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                            m.role === "user"
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm border border-border bg-card text-foreground"
                          )}
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {m.content}
                        </div>
                      )}
                      {m.role === "assistant" &&
                        !m.errorCode &&
                        m.actions &&
                        m.actions.length > 0 && (
                          <div className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
                            {m.actions.map((action, idx) => (
                              <ActionChip
                                key={idx}
                                action={action}
                                disabled={acting !== null}
                                loading={
                                  acting === `${action.type}-${action.label}`
                                }
                                onClick={() => runAction(action)}
                              />
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
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
                  className="border-t border-border bg-card p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        // Hard clip at maxChars even if paste exceeds (browser
                        // respects maxLength for typing but paste can sneak in)
                        const v = e.target.value;
                        setInput(v.length > maxChars ? v.slice(0, maxChars) : v);
                      }}
                      maxLength={maxChars}
                      placeholder={
                        wizard
                          ? "Responde una pregunta a la vez..."
                          : "Pregunta o pide crear algo..."
                      }
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary/40"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                    >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  </div>
                  {/* Char counter — only shown when getting close to limit */}
                  {input.length > maxChars * 0.7 && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span
                        className={cn(
                          "font-mono tabular-nums",
                          input.length >= maxChars
                            ? "font-semibold text-amber-600"
                            : input.length > maxChars * 0.9
                              ? "text-amber-600"
                              : "text-muted-foreground"
                        )}
                      >
                        {input.length} / {maxChars}
                      </span>
                      {input.length >= maxChars && plan !== "AGENCY" && (
                        <a
                          href="/pricing"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          <Zap className="h-2.5 w-2.5" />
                          Sube a {plan === "FREE" ? "Solo" : plan === "SOLO" ? "Pro" : plan === "PRO" ? "Team" : "Agency"} para más
                        </a>
                      )}
                    </div>
                  )}
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Empty State (welcome + wizards + suggestions)
// ============================================================

function EmptyState({
  onSuggest,
  onWizard,
}: {
  onSuggest: (s: string) => void;
  onWizard: (w: WizardKind) => void;
}) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5"
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-semibold leading-snug">
              Te ahorro horas cada semana
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Estrategia, contenido, navegación y{" "}
              <strong className="text-foreground">crear datos</strong> en tu
              CRM sin moverte de aquí.
            </p>
          </div>
        </div>
      </motion.div>

      <div>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Plantillas guiadas
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {WIZARD_TEMPLATES.map((tpl, i) => (
            <motion.button
              key={tpl.kind}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              onClick={() => onWizard(tpl.kind)}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <tpl.icon className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[10px] font-semibold leading-tight">
                  {tpl.title}
                </p>
                <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
                  {tpl.subtitle}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Sugerencias rápidas
        </p>
        <div className="space-y-1.5">
          {SUGGESTED.map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              onClick={() => onSuggest(s)}
              className="block w-full rounded-lg border border-border bg-card p-2 text-left text-[11px] leading-snug text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// History view (saved conversations)
// ============================================================

function HistoryView({
  conversations,
  loading,
  activeId,
  onOpen,
  onDelete,
  onPin,
  onNew,
}: {
  conversations: ConversationSummary[];
  loading: boolean;
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (c: ConversationSummary) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background/40">
      <div className="border-b border-border p-2.5">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Nueva conversación
        </button>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-3 w-3 animate-spin text-primary" />
            Cargando...
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs font-medium text-muted-foreground">
              Sin conversaciones aún
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Empieza una nueva y se guardará aquí.
            </p>
          </div>
        )}
        {!loading &&
          conversations.map((c) => (
            <ConvoRow
              key={c.id}
              convo={c}
              active={c.id === activeId}
              onOpen={() => onOpen(c.id)}
              onDelete={() => onDelete(c.id)}
              onPin={() => onPin(c)}
            />
          ))}
      </div>
    </div>
  );
}

function ConvoRow({
  convo,
  active,
  onOpen,
  onDelete,
  onPin,
}: {
  convo: ConversationSummary;
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const updated = new Date(convo.updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const stamp =
    diffMin < 1
      ? "Ahora"
      : diffMin < 60
        ? `${diffMin}m`
        : diffHr < 24
          ? `${diffHr}h`
          : diffDay < 7
            ? `${diffDay}d`
            : updated.toLocaleDateString("es-DO", {
                day: "numeric",
                month: "short",
              });

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-lg border p-2.5 transition-all",
        active
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {convo.pinned && (
              <Pin className="h-2.5 w-2.5 shrink-0 fill-primary text-primary" />
            )}
            {convo.wizard && (
              <Wand2 className="h-2.5 w-2.5 shrink-0 text-primary" />
            )}
            <p className="truncate text-xs font-semibold leading-tight">
              {convo.title}
            </p>
          </div>
          {convo.preview && (
            <p className="mt-1 truncate text-[10px] leading-relaxed text-muted-foreground">
              {convo.preview}
            </p>
          )}
        </div>
        <span className="shrink-0 font-mono text-[9px] text-muted-foreground/70">
          {stamp}
        </span>
      </div>
      <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          title={convo.pinned ? "Desfijar" : "Fijar"}
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
        >
          {convo.pinned ? (
            <PinOff className="h-2.5 w-2.5" />
          ) : (
            <Pin className="h-2.5 w-2.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("¿Eliminar esta conversación?")) onDelete();
          }}
          title="Eliminar"
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Action chip
// ============================================================

// ============================================================
// Pretty error card (replaces raw error text in the chat)
// ============================================================

export function ErrorCard({
  code,
  onRetry,
  onUpgrade,
}: {
  code: "empty" | "quota" | "network" | "unknown";
  onRetry?: () => void;
  onUpgrade?: () => void;
}) {
  const meta = {
    empty: {
      title: "El asistente tuvo un hipo",
      desc: "La IA no devolvió respuesta esta vez. Suele resolverse al reintentar — a veces el modelo se traba con preguntas ambiguas.",
      tip: "Si pasa seguido, intenta una pregunta más simple.",
      showUpgrade: false,
    },
    quota: {
      title: "Sin créditos de IA disponibles",
      desc: "Tu cuenta agotó los créditos del plan actual. Compra más créditos o sube de plan para seguir.",
      tip: "Los créditos se recargan cada mes automáticamente.",
      showUpgrade: true,
    },
    network: {
      title: "Conexión interrumpida",
      desc: "No pudimos contactar al asistente. Puede ser temporal de tu lado o del servicio de IA.",
      tip: "Verifica tu Internet y reintenta.",
      showUpgrade: false,
    },
    unknown: {
      title: "Algo salió mal",
      desc: "Ocurrió un error inesperado. Si persiste, abre un ticket de soporte.",
      tip: "El equipo fue notificado automáticamente.",
      showUpgrade: false,
    },
  }[code];

  return (
    <div className="w-full max-w-[85%] overflow-hidden rounded-2xl rounded-bl-sm border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
      <div className="flex items-start gap-3 p-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {meta.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {meta.desc}
          </p>
          <p className="mt-1.5 text-[11px] italic text-muted-foreground/80">
            💡 {meta.tip}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-amber-500/20 bg-amber-500/5 px-3 py-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        )}
        {meta.showUpgrade && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Zap className="h-3 w-3" />
            Comprar créditos
          </button>
        )}
        {!meta.showUpgrade && (
          <a
            href="/pricing"
            className="ml-auto text-[10px] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            ¿Necesitas más capacidad? →
          </a>
        )}
      </div>
    </div>
  );
}

export function ActionChip({
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
    case "copy":
      return { Icon: Copy };
    case "external":
      return { Icon: ExternalLink };
    default:
      return { Icon: ArrowRight };
  }
}

