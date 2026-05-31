"use client";

import {
  Calendar,
  Camera,
  Copy,
  Edit3,
  Hash,
  Heart,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Trash2,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import {
  deleteMarketingPost,
  updateMarketingStatus,
} from "@/lib/actions/marketing";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Post = {
  id: string;
  title: string;
  content: string;
  channel: string;
  status: string;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  imageUrl: string | null;
};

const CHANNEL_META: Record<
  string,
  { label: string; icon: string; gradient: string }
> = {
  INSTAGRAM: {
    label: "Instagram",
    icon: "📷",
    gradient: "from-pink-500 via-purple-500 to-indigo-500",
  },
  FACEBOOK: {
    label: "Facebook",
    icon: "📘",
    gradient: "from-blue-600 to-blue-400",
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: "💬",
    gradient: "from-emerald-500 to-emerald-400",
  },
  EMAIL: { label: "Email", icon: "✉️", gradient: "from-amber-500 to-amber-400" },
};

const STATUS_LABEL_KEY: Record<string, string> = {
  DRAFT: "statusDraft",
  SCHEDULED: "statusScheduled",
  PUBLISHED: "statusPublished",
};

export function PostDetailModal({
  post,
  open,
  onOpenChange,
}: {
  post: Post | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"preview" | "content">("preview");

  if (!post) return null;

  const channel = CHANNEL_META[post.channel] ?? CHANNEL_META.INSTAGRAM;

  // Extract hashtags from content
  const hashtagsInContent = post.content.match(/#\w+/g) ?? [];

  function copyContent() {
    if (!post) return;
    navigator.clipboard.writeText(post.content);
    toast.success(t.marketing.toastContentCopied);
  }

  function changeStatus(status: string) {
    if (!post) return;
    startTransition(async () => {
      try {
        await updateMarketingStatus(post.id, status);
        toast.success(
          `${t.marketing.toastMarkedAs} ${t.marketing[STATUS_LABEL_KEY[status]].toLowerCase()}`
        );
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!post) return;
    if (!confirm(t.marketing.confirmDeletePost)) return;
    startTransition(async () => {
      try {
        await deleteMarketingPost(post.id);
        toast.success(t.marketing.toastPostDeleted);
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-4xl">
        <div className="grid max-h-[80vh] grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT: Visual preview (Instagram-style) */}
          <div
            className={cn(
              "relative overflow-hidden p-6",
              post.channel === "INSTAGRAM"
                ? "bg-gradient-to-br"
                : "bg-muted/40",
              post.channel === "INSTAGRAM" && channel.gradient
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />

            <div className="relative mx-auto max-w-sm">
              {/* Phone-like mockup */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/20 bg-card shadow-2xl"
              >
                {/* Instagram header */}
                <div className="flex items-center gap-2.5 border-b border-border p-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-0.5">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-card">
                      <span className="text-xs font-bold">RX</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight">
                      realestate.x
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.marketing.sponsored}
                    </p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Image */}
                <div className="relative aspect-square bg-muted">
                  {post.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-border p-3">
                  <div className="mb-2 flex items-center gap-3">
                    <Heart className="h-5 w-5" strokeWidth={1.5} />
                    <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
                    <Share2 className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-semibold">
                    {Math.floor(Math.random() * 800 + 200)} {t.marketing.likes}
                  </p>
                  <p className="mt-1 line-clamp-3 text-xs">
                    <span className="font-semibold">realestate.x</span>{" "}
                    {post.content.split("\n")[0]}
                  </p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {format(new Date(), "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </motion.div>

              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
                {t.marketing.previewLabel} · {channel.label}
              </p>
            </div>
          </div>

          {/* RIGHT: Details + actions */}
          <div className="flex flex-col overflow-y-auto bg-card">
            {/* Header */}
            <div className="border-b border-border p-5">
              <div className="mb-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 text-[10px]",
                    post.status === "PUBLISHED"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : post.status === "SCHEDULED"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                        : ""
                  )}
                >
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                  {t.marketing[STATUS_LABEL_KEY[post.status]]}
                </Badge>
                <span className="text-xs">{channel.icon}</span>
                <span className="text-xs font-medium">{channel.label}</span>
              </div>
              <h2 className="text-lg font-bold leading-tight">{post.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                {post.scheduledFor && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t.marketing.scheduledLabel}{" "}
                    {format(new Date(post.scheduledFor), "d MMM, h:mm a", {
                      locale: es,
                    })}
                  </span>
                )}
                {post.publishedAt && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <Send className="h-3 w-3" />
                    {t.marketing.publishedLabel}{" "}
                    {format(new Date(post.publishedAt), "d MMM", { locale: es })}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-5 pt-3">
              <div className="flex gap-4">
                {(["preview", "content"] as const).map((tk) => (
                  <button
                    key={tk}
                    onClick={() => setTab(tk)}
                    className={cn(
                      "relative pb-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                      tab === tk
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tk === "preview" ? t.marketing.tabSummary : t.marketing.tabContent}
                    {tab === tk && (
                      <motion.span
                        layoutId="tab-underline"
                        className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "preview" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.marketing.estimatedMetrics}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <MetricCell label={t.marketing.metricReach} value="2.4k" trend="+12%" />
                      <MetricCell label={t.marketing.metricEngagement} value="3.8%" trend="+5%" />
                      <MetricCell label={t.marketing.metricSaves} value="48" trend="+18%" />
                    </div>
                  </div>

                  {hashtagsInContent.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Hash className="-mt-0.5 mr-1 inline h-3 w-3" />
                        {t.marketing.hashtags} ({hashtagsInContent.length})
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {hashtagsInContent.slice(0, 15).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3 w-3" />
                      {t.marketing.aiTip}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {post.status === "DRAFT"
                        ? t.marketing.aiTipDraft
                        : post.status === "SCHEDULED"
                          ? t.marketing.aiTipScheduled
                          : t.marketing.aiTipPublished}
                    </p>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {post.content}
                </pre>
              )}
            </div>

            {/* Action footer */}
            <div className="border-t border-border bg-muted/40 p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={copyContent}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {t.marketing.copy}
                </Button>
                {post.status === "DRAFT" && (
                  <Button
                    size="sm"
                    onClick={() => changeStatus("SCHEDULED")}
                  >
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    {t.marketing.schedule}
                  </Button>
                )}
                {post.status !== "PUBLISHED" && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400"
                    onClick={() => changeStatus("PUBLISHED")}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {t.marketing.publish}
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {t.marketing.deletePost}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCell({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold text-emerald-500">{trend}</p>
    </div>
  );
}
