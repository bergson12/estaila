"use client";

/**
 * Asistente IA — página de chat estilo ChatGPT (full-screen).
 *
 * Reusa los server actions del chatbot flotante + sus piezas de UI
 * (ErrorCard, ActionChip). Pensada para usuarios acostumbrados a
 * herramientas de IA: historial lateral, thread amplio, composer cómodo
 * que NO pierde el foco al recibir respuesta.
 */

import {
  Bot,
  Building2,
  Calendar,
  Download,
  ImagePlus,
  Loader2,
  MessageSquarePlus,
  MessageSquareText,
  PanelLeft,
  Send,
  Sparkles,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
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
  setConversationWizard,
  type ChatAction,
  type ConversationSummary,
} from "@/lib/actions/ai-text";
import { ErrorCard, ActionChip } from "@/components/layout/estaila-chatbot";
import { GeneratePanel, type GenResult } from "./generate-panel";
import { BeforeAfter } from "@/components/studio/before-after";
import {
  DownloadModal,
  SaveToPropertyDialog,
  SendToContactDialog,
} from "@/components/studio/photo-dialogs";

type WizardKind = "CONTACT" | "PROPERTY" | "APPOINTMENT";

type Turn = {
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
  errorCode?: "empty" | "quota" | "network" | "unknown";
  retryOf?: string;
  /** Studio IA result rendered inline (before/after + photo actions). */
  image?: {
    beforeUrl: string;
    afterUrl: string;
    generationId: string;
    toolLabel: string;
  };
};

const CHAR_LIMITS: Record<string, number> = {
  FREE: 280,
  SOLO: 800,
  PRO: 2000,
  TEAM: 3000,
  AGENCY: 8000,
};

const WIZARDS: { kind: WizardKind; icon: typeof User; labelKey: string; msg: string }[] = [
  { kind: "CONTACT", icon: User, labelKey: "wizardContact", msg: "Quiero agregar un contacto nuevo. Hazme las preguntas una a una." },
  { kind: "PROPERTY", icon: Building2, labelKey: "wizardProperty", msg: "Quiero crear una propiedad nueva. Pregúntame paso a paso." },
  { kind: "APPOINTMENT", icon: Calendar, labelKey: "wizardAppointment", msg: "Quiero agendar una cita. Pregúntame fecha y detalles paso a paso." },
];

export function AsistenteChat({
  plan,
  userName,
  initialConversations,
}: {
  plan: string;
  userName: string;
  initialConversations: ConversationSummary[];
}) {
  const router = useRouter();
  const { t } = useT();
  const maxChars = CHAR_LIMITS[plan.toUpperCase()] ?? CHAR_LIMITS.FREE;

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardKind | null>(null);
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [railOpen, setRailOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [downloadFor, setDownloadFor] = useState<{ url: string } | null>(null);
  const [saveFor, setSaveFor] = useState<{ id: string } | null>(null);
  const [shareFor, setShareFor] = useState<{ id: string; url: string } | null>(
    null
  );
  const [, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Autoscroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, sending]);

  // Focus composer on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  async function refreshConvos() {
    try {
      setConversations(await listConversations());
    } catch {
      /* ignore */
    }
  }

  async function openConvo(id: string) {
    try {
      const convo = await loadConversation(id);
      setConvoId(convo.id);
      setWizard(convo.wizard);
      setHistory(convo.messages);
      setRailOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function newChat(opts?: { wizard?: WizardKind; firstMessage?: string }) {
    setConvoId(null);
    setHistory([]);
    setWizard(opts?.wizard ?? null);
    setRailOpen(false);
    if (opts?.firstMessage) setTimeout(() => send(opts.firstMessage), 50);
    else setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setHistory((h) => [...h, { role: "user", content: text }]);
    setSending(true);

    let activeConvoId = convoId;
    try {
      if (!activeConvoId) {
        const created = await createConversation({ title: text.slice(0, 60), wizard });
        activeConvoId = created.id;
        setConvoId(created.id);
        refreshConvos();
      }
    } catch (e) {
      console.warn("[asistente] createConversation", e);
    }

    try {
      const response = await realEstateChat({
        history: history.slice(-10).map((t) => ({ role: t.role, content: t.content })),
        message: text,
        wizard,
      });

      let errorCode: Turn["errorCode"] | undefined;
      if (response.errorDetail) {
        const err = response.errorDetail.toLowerCase();
        if (err.includes("vacía") || err.includes("empty") || err.includes("finish_reason")) errorCode = "empty";
        else if (err.includes("quota") || err.includes("429") || err.includes("balance") || err.includes("credit")) errorCode = "quota";
        else if (err.includes("network") || err.includes("timeout") || err.includes("aborterror")) errorCode = "network";
        else errorCode = "unknown";
      }

      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: errorCode ? "" : response.text,
          actions: errorCode ? [] : response.actions,
          errorCode,
          retryOf: errorCode ? text : undefined,
        },
      ]);

      if (activeConvoId && !response.errorDetail) {
        startTransition(() => {
          saveConversationTurn({
            conversationId: activeConvoId!,
            userMessage: text,
            assistantText: response.text,
            assistantActions: response.actions,
          }).catch(() => {});
        });
      }
    } catch {
      setHistory((h) => [...h, { role: "assistant", content: "", errorCode: "network", retryOf: text }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  async function runAction(action: ChatAction) {
    const key = `${action.type}-${action.label}`;
    setActing(key);
    try {
      if (action.type === "navigate" || action.type === "ai_tool") {
        router.push(action.href);
      } else if (action.type === "copy") {
        await navigator.clipboard.writeText(action.value);
        toast.success(t.asistente.toastCopied, { description: action.value.slice(0, 60) });
      } else if (action.type === "external") {
        window.open(action.href, "_blank", "noopener,noreferrer");
      } else if (action.type === "create_contact") {
        const r = await chatCreateContact(action.data as Parameters<typeof chatCreateContact>[0]);
        toast.success(t.asistente.toastContactCreated, {
          description: action.data.name,
          action: { label: t.asistente.viewAction, onClick: () => router.push(`/contactos/${r.id}`) },
        });
        if (wizard === "CONTACT") { setWizard(null); if (convoId) setConversationWizard({ id: convoId, wizard: null }); }
      } else if (action.type === "create_property") {
        const r = await chatCreateProperty(action.data as Parameters<typeof chatCreateProperty>[0]);
        toast.success(t.asistente.toastPropertyCreated, {
          description: String(action.data.title ?? ""),
          action: { label: t.asistente.viewAction, onClick: () => router.push(`/propiedades/${r.id}`) },
        });
        if (wizard === "PROPERTY") { setWizard(null); if (convoId) setConversationWizard({ id: convoId, wizard: null }); }
      } else if (action.type === "create_appointment") {
        const r = await chatCreateAppointment(action.data as Parameters<typeof chatCreateAppointment>[0]);
        toast.success(t.asistente.toastAppointmentScheduled, {
          description: String(action.data.title ?? ""),
          action: { label: t.asistente.viewAction, onClick: () => router.push(`/agenda?focus=${r.id}`) },
        });
        if (wizard === "APPOINTMENT") { setWizard(null); if (convoId) setConversationWizard({ id: convoId, wizard: null }); }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(null);
    }
  }

  async function delConvo(id: string) {
    if (!confirm(t.asistente.confirmDeleteConvo)) return;
    try {
      await deleteConversation(id);
      setConversations((c) => c.filter((x) => x.id !== id));
      if (convoId === id) newChat();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function handleGenResult(r: GenResult) {
    setHistory((h) => [
      ...h,
      {
        role: "assistant",
        content:
          (r.fallbackUsed === "mock"
            ? `${t.asistente.genPreviewFallback} `
            : `${t.asistente.genDone} · ${r.toolLabel}. `) +
          (r.remaining === 1
            ? t.asistente.genCreditsLeftOne
            : t.asistente.genCreditsLeftMany.replace("{n}", String(r.remaining))),
        image: {
          beforeUrl: r.beforeUrl,
          afterUrl: r.afterUrl,
          generationId: r.generationId,
          toolLabel: r.toolLabel,
        },
      },
    ]);
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  const empty = history.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100dvh-9.5rem)] min-h-[460px] max-w-6xl gap-4">
      {/* ===== Rail de conversaciones ===== */}
      <ConversationRail
        conversations={conversations}
        activeId={convoId}
        onNew={() => newChat()}
        onOpen={openConvo}
        onDelete={delConvo}
        railOpen={railOpen}
        onClose={() => setRailOpen(false)}
      />

      {/* ===== Columna principal ===== */}
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card/40">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <button
            onClick={() => setRailOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
            title={t.asistente.conversationsTitle}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">Estaila Assistant</p>
            <p className="text-[11px] text-muted-foreground">
              {wizard ? t.asistente.guidedModeActive : t.asistente.headerSubtitle}
            </p>
          </div>
          <button
            onClick={() => newChat()}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:flex"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            {t.asistente.newShort}
          </button>
        </div>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {empty ? (
            <EmptyState
              userName={userName}
              onSuggest={(s) => send(s)}
              onWizard={(w) => newChat({ wizard: w, firstMessage: WIZARDS.find((x) => x.kind === w)!.msg })}
            />
          ) : (
            history.map((m, i) => (
              <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                {m.role === "assistant" && m.errorCode ? (
                  <ErrorCard
                    code={m.errorCode}
                    onRetry={
                      m.retryOf
                        ? () => {
                            setHistory((h) => h.slice(0, Math.max(0, h.length - 2)));
                            void send(m.retryOf);
                          }
                        : undefined
                    }
                    onUpgrade={() => router.push("/pricing")}
                  />
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-card text-foreground"
                    )}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {m.content}
                  </div>
                )}
                {m.image && (
                  <div className="mt-2 w-full max-w-[80%] space-y-2">
                    <BeforeAfter
                      beforeUrl={m.image.beforeUrl}
                      afterUrl={m.image.afterUrl}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <ImgChip
                        icon={Download}
                        label={t.asistente.imgDownload}
                        onClick={() => setDownloadFor({ url: m.image!.afterUrl })}
                      />
                      <ImgChip
                        icon={Building2}
                        label={t.asistente.imgSaveToProperty}
                        onClick={() => setSaveFor({ id: m.image!.generationId })}
                      />
                      <ImgChip
                        icon={MessageSquareText}
                        label={t.asistente.imgShare}
                        onClick={() =>
                          setShareFor({
                            id: m.image!.generationId,
                            url: m.image!.afterUrl,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                {m.role === "assistant" && !m.errorCode && m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex max-w-[80%] flex-wrap gap-1.5">
                    {m.actions.map((a, idx) => (
                      <ActionChip
                        key={idx}
                        action={a}
                        disabled={acting !== null}
                        loading={acting === `${a.type}-${a.label}`}
                        onClick={() => runAction(a)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                {t.asistente.thinking}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border p-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/40">
            <button
              type="button"
              onClick={() => setGenOpen(true)}
              title={t.asistente.generateWithStudio}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-primary/10"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                const v = e.target.value;
                setInput(v.length > maxChars ? v.slice(0, maxChars) : v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={maxChars}
              rows={1}
              placeholder={wizard ? t.asistente.composerWizardPlaceholder : t.asistente.composerPlaceholder}
              className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {input.length > maxChars * 0.7 && (
            <div className="mt-1 px-1 text-right text-[10px] font-mono tabular-nums text-muted-foreground">
              {input.length} / {maxChars}
            </div>
          )}
        </form>
      </div>

      {/* Studio IA inline (P-006) */}
      <GeneratePanel
        open={genOpen}
        onClose={() => setGenOpen(false)}
        onResult={handleGenResult}
      />
      <DownloadModal
        open={!!downloadFor}
        onClose={() => setDownloadFor(null)}
        outputUrl={downloadFor?.url ?? ""}
        filename={`estaila-${Date.now().toString(36)}.png`}
      />
      {saveFor && (
        <SaveToPropertyDialog
          open={!!saveFor}
          onClose={() => setSaveFor(null)}
          generationId={saveFor.id}
        />
      )}
      {shareFor && (
        <SendToContactDialog
          open={!!shareFor}
          onClose={() => setShareFor(null)}
          generationId={shareFor.id}
          outputUrl={shareFor.url}
        />
      )}
    </div>
  );
}

function ImgChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function EmptyState({
  userName,
  onSuggest,
  onWizard,
}: {
  userName: string;
  onSuggest: (s: string) => void;
  onWizard: (w: WizardKind) => void;
}) {
  const { t } = useT();
  const suggested = [
    t.asistente.suggestLastContact,
    t.asistente.suggestLastStudioPhoto,
    t.asistente.suggestCardLink,
    t.asistente.suggestMarketingPlan,
    t.asistente.suggestMlsDescription,
    t.asistente.suggestThisWeekAppts,
  ];
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <Sparkles className="h-6 w-6" strokeWidth={2} />
      </div>
      <h2 className="mt-4 text-xl font-semibold">{t.asistente.greeting}, {userName.split(" ")[0]}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.asistente.emptyDescription}
      </p>

      <div className="mt-6 flex w-full flex-wrap justify-center gap-2">
        {WIZARDS.map((w) => (
          <button
            key={w.kind}
            onClick={() => onWizard(w.kind)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <w.icon className="h-3.5 w-3.5 text-primary" />
            {t.asistente[w.labelKey as keyof typeof t.asistente]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {suggested.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggest(s)}
            className="rounded-xl border border-border bg-card p-3 text-left text-xs leading-snug text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationRail({
  conversations,
  activeId,
  onNew,
  onOpen,
  onDelete,
  railOpen,
  onClose,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  railOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  return (
    <>
      {/* Mobile overlay */}
      {railOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "flex w-64 shrink-0 flex-col rounded-2xl border border-border bg-card/40",
          "max-md:fixed max-md:inset-y-4 max-md:left-4 max-md:z-50 max-md:w-72 max-md:shadow-2xl",
          railOpen ? "max-md:flex" : "max-md:hidden"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <button
            onClick={onNew}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            {t.asistente.newConversation}
          </button>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
              {t.asistente.noConversationsYet}
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onOpen(c.id)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                c.id === activeId
                  ? "border-primary/40 bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              )}
            >
              {c.wizard && <Wand2 className="h-3 w-3 shrink-0 text-primary" />}
              <p className="min-w-0 flex-1 truncate text-xs font-medium">{c.title}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="hidden shrink-0 rounded p-1 text-muted-foreground hover:text-destructive group-hover:block"
                title={t.asistente.deleteAction}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
