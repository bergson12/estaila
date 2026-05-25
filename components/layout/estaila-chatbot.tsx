"use client";

/**
 * Estaila Assistant — floating chatbot widget.
 *
 * Lives in the dashboard layout, bottom-right. Powered by DeepSeek for cheap
 * real-estate Q&A: pricing strategy, post copy, buyer personas, negotiation tips.
 */

import {
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { realEstateChat, type ChatTurn } from "@/lib/actions/ai-text";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "estaila:chatbot:history";
const MAX_TURNS = 30;

const SUGGESTED = [
  "¿Cómo posicionar el precio de una casa en Punta Cana?",
  "Dame 3 ideas de post Instagram para una casa de playa.",
  "¿Qué buyer atrae una propiedad de US$350k en zona colonial?",
  "Plan marketing 30 días para listado nuevo.",
];

export function EstailaChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatTurn[];
        if (Array.isArray(parsed)) setHistory(parsed.slice(-MAX_TURNS));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist
  useEffect(() => {
    if (history.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(-MAX_TURNS))
      );
    } catch {
      // ignore
    }
  }, [history]);

  // Auto-scroll
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, open, sending]);

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || sending) return;
    setInput("");
    const turn: ChatTurn = { role: "user", content: text };
    setHistory((h) => [...h, turn]);
    setSending(true);
    try {
      const response = await realEstateChat({
        history: history.slice(-10),
        message: text,
      });
      setHistory((h) => [...h, { role: "assistant", content: response }]);
    } catch (e) {
      toast.error((e as Error).message);
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content:
            "Algo falló. ¿Intenta de nuevo? Si persiste, verifica DEEPSEEK_API_KEY en Vercel.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      {/* FAB */}
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
            className="fixed bottom-20 right-5 z-40 flex h-[560px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-br from-primary/10 to-transparent px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Estaila Assistant</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pregúntame sobre pricing, posts, buyer personas…
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

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-background/50 p-3"
            >
              {history.length === 0 && (
                <div className="space-y-2">
                  <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                    Soy tu asistente IA. Te ayudo con estrategia de pricing,
                    contenido para redes, negociación y más. Pregunta lo que
                    quieras.
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
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-card text-foreground"
                    )}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {m.content}
                  </div>
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

            {/* Input */}
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
                placeholder="Pregunta lo que quieras..."
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
