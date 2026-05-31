"use client";

import {
  Calendar,
  Camera,
  Hash,
  Megaphone,
  Plus,
  Send,
  Sparkles,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  Target,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import {
  createMarketingPost,
  generatePostFromProperty,
} from "@/lib/actions/marketing";
import { PostDetailModal } from "./post-detail-modal";
import { CampaignManagerDialog } from "./campaign-manager-dialog";

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
  { icon: string; label: string; gradient: string }
> = {
  INSTAGRAM: {
    icon: "📷",
    label: "Instagram",
    gradient: "from-pink-500 via-purple-500 to-indigo-500",
  },
  FACEBOOK: {
    icon: "📘",
    label: "Facebook",
    gradient: "from-blue-600 to-blue-400",
  },
  WHATSAPP: {
    icon: "💬",
    label: "WhatsApp",
    gradient: "from-emerald-500 to-emerald-400",
  },
  EMAIL: {
    icon: "✉️",
    label: "Email",
    gradient: "from-amber-500 to-amber-400",
  },
};

const STATUS_META: Record<
  string,
  { labelKey: string; badgeKey: string; icon: LucideIcon; color: string }
> = {
  DRAFT: {
    labelKey: "statusDrafts",
    badgeKey: "statusDraft",
    icon: FileText,
    color:
      "border-stone-500/40 bg-stone-500/15 text-stone-500 shadow-stone-500/10",
  },
  SCHEDULED: {
    labelKey: "statusScheduledPlural",
    badgeKey: "statusScheduled",
    icon: Clock,
    color:
      "border-amber-500/40 bg-amber-500/15 text-amber-500 shadow-amber-500/10",
  },
  PUBLISHED: {
    labelKey: "statusPublishedPlural",
    badgeKey: "statusPublished",
    icon: CheckCircle2,
    color:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-500 shadow-emerald-500/10",
  },
};

export function MarketingClient({
  posts,
  properties,
}: {
  posts: Post[];
  properties: { id: string; title: string }[];
}) {
  const { t } = useT();
  const [newDialog, setNewDialog] = useState(false);
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [filter, setFilter] = useState("ALL");

  const filtered = posts.filter((p) =>
    filter === "ALL" ? true : p.status === filter
  );

  const counts = {
    ALL: posts.length,
    DRAFT: posts.filter((p) => p.status === "DRAFT").length,
    SCHEDULED: posts.filter((p) => p.status === "SCHEDULED").length,
    PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
            icon={Layers}
            label={t.marketing.filterAll}
            count={counts.ALL}
          />
          {(["DRAFT", "SCHEDULED", "PUBLISHED"] as const).map((s) => {
            const meta = STATUS_META[s];
            return (
              <FilterPill
                key={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                icon={meta.icon}
                label={t.marketing[meta.labelKey]}
                count={counts[s]}
                colorClass={meta.color}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCampaignDialog(true)}
            className="gap-2"
          >
            <Target className="h-4 w-4 text-primary" />
            {t.marketing.createCampaign}
          </Button>
          <Button onClick={() => setNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.marketing.newPost}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t.marketing.postsEmptyTitle}
          description={
            posts.length === 0
              ? t.marketing.postsEmptyDescription
              : t.marketing.postsNoMatch
          }
          action={
            <div className="flex gap-2">
              <Button onClick={() => setNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t.marketing.createPost}
              </Button>
              <Button variant="outline" onClick={() => setCampaignDialog(true)}>
                <Target className="mr-2 h-4 w-4" />
                {t.marketing.createCampaign}
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((p, i) => (
              <PostCard
                key={p.id}
                post={p}
                index={i}
                onClick={() => setDetailPost(p)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onOpenChange={(o) => !o && setDetailPost(null)}
      />
      <CampaignManagerDialog
        open={campaignDialog}
        onOpenChange={setCampaignDialog}
        properties={properties}
      />
      <NewPostDialog
        open={newDialog}
        onOpenChange={setNewDialog}
        properties={properties}
      />
    </>
  );
}

function FilterPill({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  colorClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  count?: number;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? colorClass
            ? `${colorClass} shadow-sm`
            : "border-primary/40 bg-primary/15 text-primary shadow-sm shadow-primary/10"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      <Icon
        className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
        strokeWidth={1.75}
      />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums",
            active ? "" : "bg-muted text-muted-foreground"
          )}
          style={
            active
              ? {
                  backgroundColor:
                    "color-mix(in oklch, currentColor 20%, transparent)",
                }
              : undefined
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}

function PostCard({
  post,
  index,
  onClick,
}: {
  post: Post;
  index: number;
  onClick: () => void;
}) {
  const { t } = useT();
  const channel = CHANNEL_META[post.channel] ?? CHANNEL_META.INSTAGRAM;
  const status = STATUS_META[post.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 6) * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card
        onClick={onClick}
        className="group relative h-full cursor-pointer overflow-hidden p-0 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                "flex h-full items-center justify-center bg-gradient-to-br",
                channel.gradient
              )}
            >
              <Camera className="h-12 w-12 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {status && (
            <div
              className={cn(
                "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md",
                status.color
              )}
            >
              <status.icon className="h-2.5 w-2.5" />
              {t.marketing[status.badgeKey]}
            </div>
          )}

          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            <span>{channel.icon}</span>
            {channel.label}
          </div>

          <div className="absolute inset-x-0 bottom-0 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <div className="px-4 pb-3">
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                {t.marketing.viewDetail}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {post.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {post.content.split("\n")[0]}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
            {post.scheduledFor ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(post.scheduledFor), "d MMM", { locale: es })}
              </span>
            ) : post.publishedAt ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <Send className="h-3 w-3" />
                {format(new Date(post.publishedAt), "d MMM", { locale: es })}
              </span>
            ) : (
              <span>{t.marketing.notScheduled}</span>
            )}
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {(post.content.match(/#\w+/g) ?? []).length}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function NewPostDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  properties: { id: string; title: string }[];
}) {
  const { t } = useT();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("INSTAGRAM");
  const [status, setStatus] = useState("DRAFT");
  const [imageUrl, setImageUrl] = useState("");

  async function generateFromProperty(propertyId: string) {
    if (!propertyId) return;
    setGenerating(true);
    try {
      const result = await generatePostFromProperty(propertyId);
      setTitle(result.title);
      setContent(result.content);
      if (result.imageUrl) setImageUrl(result.imageUrl);
      toast.success(t.marketing.toastGeneratedFromProperty);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function onSubmit() {
    if (!title.trim() || !content.trim()) {
      toast.error(t.marketing.toastTitleContentRequired);
      return;
    }
    setSubmitting(true);
    try {
      await createMarketingPost({
        title,
        content,
        channel,
        status,
        imageUrl: imageUrl || undefined,
      });
      toast.success(t.marketing.toastPostCreated);
      onOpenChange(false);
      setTitle("");
      setContent("");
      setImageUrl("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t.marketing.newPost}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              {t.marketing.generateFromProperty}
            </Label>
            <Select onValueChange={generateFromProperty}>
              <SelectTrigger>
                <SelectValue placeholder={t.marketing.selectToAutofill} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {generating && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> {t.marketing.generating}
              </p>
            )}
          </div>

          <Field label={t.marketing.fieldTitleRequired}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label={t.marketing.fieldContentRequired}>
            <Textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.marketing.postContentPlaceholder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.marketing.fieldChannel}>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTAGRAM">📷 Instagram</SelectItem>
                  <SelectItem value="FACEBOOK">📘 Facebook</SelectItem>
                  <SelectItem value="WHATSAPP">💬 WhatsApp</SelectItem>
                  <SelectItem value="EMAIL">✉️ Email</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.marketing.fieldStatus}>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{t.marketing.statusDraft}</SelectItem>
                  <SelectItem value="SCHEDULED">{t.marketing.statusScheduled}</SelectItem>
                  <SelectItem value="PUBLISHED">{t.marketing.statusPublished}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t.marketing.fieldImageUrl}>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t.marketing.imageUrlPlaceholder}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t.marketing.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.marketing.createPost}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
