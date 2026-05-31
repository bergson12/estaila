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
import { useT } from "@/lib/i18n/provider";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-amber-500/15 text-amber-600",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600",
  RESOLVED: "bg-emerald-500/15 text-emerald-600",
  CLOSED: "bg-muted text-muted-foreground",
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
  const { t, locale } = useT();
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const STATUS_LABEL: Record<string, string> = {
    OPEN: t.soporte.statusOpen,
    IN_PROGRESS: t.soporte.statusInProgress,
    RESOLVED: t.soporte.statusResolved,
    CLOSED: t.soporte.statusClosed,
  };
  const STATUS_LABEL_LOWER: Record<string, string> = {
    OPEN: t.soporte.statusOpenLower,
    IN_PROGRESS: t.soporte.statusInProgressLower,
    RESOLVED: t.soporte.statusResolvedLower,
    CLOSED: t.soporte.statusClosedLower,
  };
  const CATEGORY_LABEL: Record<string, string> = {
    BUG: t.soporte.catShortBug,
    QUESTION: t.soporte.catShortQuestion,
    BILLING: t.soporte.catShortBilling,
    FEATURE: t.soporte.catShortFeature,
    OTHER: t.soporte.catShortOther,
  };

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
      toast.success(t.soporte.toastMessageSent);
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
      toast.success(`${t.soporte.toastStatusPrefix}: ${STATUS_LABEL[status]}`);
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
              <span>{t.soporte.priorityLabel}: {ticket.priority}</span>
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
                    {t.soporte.internalNoteAdmins}
                  </p>
                )}
                <p
                  className="text-sm leading-relaxed"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {m.content}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString(
                    locale === "en" ? "en-US" : "es-DO",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
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
            placeholder={t.soporte.replyPlaceholder}
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
                {t.soporte.internalNoteHidden}
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
              {t.soporte.sendBtn}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t.soporte.closedTicketWord} {STATUS_LABEL_LOWER[ticket.status]}.{" "}
            {!isAdminView && (
              <a href={basePath} className="text-primary underline">
                {t.soporte.closedNewTicketLink}
              </a>
            )}{" "}
            {t.soporte.closedNeedMoreHelp}
          </p>
        </Card>
      )}
    </div>
  );
}
