"use client";

import { Loader2, Send, Shield, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  replyToTicket,
  updateTicketStatus,
  type TicketDetail,
  type TicketStatus,
} from "@/lib/actions/support";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-amber-500/15 text-amber-600",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600",
  RESOLVED: "bg-emerald-500/15 text-emerald-600",
  CLOSED: "bg-muted text-muted-foreground",
};
const CATEGORY_LABEL: Record<string, string> = {
  BUG: "🐛 Error",
  QUESTION: "❓ Pregunta",
  BILLING: "💳 Billing",
  FEATURE: "💡 Sugerencia",
  OTHER: "✉️ Otro",
};

export function TicketThread({
  ticket,
  basePath,
  isAdminView,
}: {
  ticket: TicketDetail;
  basePath: string;
  isAdminView?: boolean;
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await replyToTicket({
        ticketId: ticket.id,
        content: reply,
        internal,
      });
      if (!res.ok) {
        toast.error(res.error, { duration: 10000 });
        return;
      }
      toast.success("Mensaje enviado");
      setReply("");
      setInternal(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: TicketStatus) {
    setUpdating(true);
    try {
      const res = await updateTicketStatus({ ticketId: ticket.id, status });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Estado: ${STATUS_LABEL[status]}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  const closed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                {ticket.subject}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  STATUS_COLOR[ticket.status]
                )}
              >
                {STATUS_LABEL[ticket.status]}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{CATEGORY_LABEL[ticket.category]}</span>
              <span>·</span>
              <span>Prioridad: {ticket.priority}</span>
              {isAdminView && (
                <>
                  <span>·</span>
                  <span className="font-medium">
                    {ticket.user.name} ({ticket.user.email})
                  </span>
                </>
              )}
            </div>
          </div>
          {isAdminView && (
            <div className="flex shrink-0 flex-wrap gap-1.5">
              {(
                ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]
              ).map((s) =>
                s === ticket.status ? null : (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    onClick={() => changeStatus(s)}
                    disabled={updating}
                    className="h-7 text-[11px]"
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Messages */}
      <div className="space-y-3">
        {ticket.messages.map((m) => {
          const isAdmin = m.authorRole === "admin";
          return (
            <div
              key={m.id}
              className={cn(
                "flex gap-3",
                isAdmin ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isAdmin
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isAdmin ? (
                  <Shield className="h-3.5 w-3.5" />
                ) : (
                  <UserIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl border p-3",
                  isAdmin
                    ? "rounded-tr-sm border-primary/30 bg-primary/5"
                    : "rounded-tl-sm border-border bg-card",
                  m.internal && "border-amber-500/40 bg-amber-500/5"
                )}
              >
                {m.internal && (
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                    Nota interna (solo admins)
                  </p>
                )}
                <p
                  className="text-sm leading-relaxed"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {m.content}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString("es-DO", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply */}
      {!closed ? (
        <Card className="p-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            placeholder="Escribe tu respuesta..."
            className="resize-none"
            maxLength={8000}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            {isAdminView ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={internal}
                  onCheckedChange={(v) => setInternal(!!v)}
                />
                Nota interna (no visible al usuario)
              </label>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                {reply.length} / 8000
              </p>
            )}
            <Button
              onClick={send}
              disabled={sending || !reply.trim()}
              size="sm"
            >
              {sending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Enviar
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Ticket {STATUS_LABEL[ticket.status].toLowerCase()}.{" "}
            {!isAdminView && (
              <a href={basePath} className="text-primary underline">
                Abre un nuevo ticket
              </a>
            )}{" "}
            si necesitas más ayuda.
          </p>
        </Card>
      )}
    </div>
  );
}
