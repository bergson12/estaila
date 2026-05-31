"use client";

/**
 * Digital cards manager (Linktree-style).
 * List + Create/Edit dialog + Link manager + theme picker + QR + copy public link.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Camera,
  Globe,
  GripVertical,
  Hash,
  Home,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  QrCode,
  Settings2,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";

const Facebook = Hash;
const Instagram = Camera;
const Twitter = Hash;
const Youtube = Video;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUploader } from "@/components/cards/image-uploader";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CardQrFullscreen } from "@/components/marketing/card-qr-fullscreen";
import { CardAnalyticsDialog } from "@/components/marketing/card-analytics-dialog";

const ICONS: Record<string, LucideIcon> = {
  Link: LinkIcon,
  Globe,
  Mail,
  Phone: MessageCircle,
  MessageCircle,
  Calendar,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MapPin,
  ExternalLink,
  Sparkles,
  Home,
  Building2,
  Star,
};

const ICON_OPTIONS = Object.keys(ICONS);

const THEMES = [
  { key: "MINIMAL", label: "Minimal", swatch: ["#ffffff", "#e5e7eb"] },
  { key: "DARK", label: "Dark", swatch: ["#0a0a0a", "#1f2937"] },
  { key: "GLASS", label: "Glass", swatch: ["#a5b4fc", "#7dd3fc"] },
  { key: "BOLD", label: "Bold", swatch: ["#3B82F6", "#ec4899"] },
  { key: "TROPICAL", label: "Tropical", swatch: ["#fde68a", "#34d399"] },
];

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#0F172A", "#475569",
];

type CardLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  imageUrl: string | null;
  description: string | null;
  color: string | null;
  highlight: boolean;
  active: boolean;
  clicks: number;
  order: number;
};

type DigitalCard = {
  id: string;
  slug: string;
  title: string;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  theme: string;
  primaryColor: string;
  accentColor: string | null;
  isActive: boolean;
  showProperties: boolean;
  showWhatsapp: boolean;
  views: number;
  links: CardLink[];
  _count: { cardViews: number };
};

export function DigitalCardsClient({ cards }: { cards: DigitalCard[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DigitalCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCreate(input: { title: string; slug?: string }) {
    setPending(true);
    try {
      const { createDigitalCard } = await import("@/lib/actions/cards");
      const card = await createDigitalCard({
        title: input.title,
        slug: input.slug,
      });
      toast.success("Tarjeta creada");
      setCreating(false);
      router.refresh();
      return card;
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar tarjeta «${title}»? Sus estadísticas se pierden.`)) return;
    setPending(true);
    try {
      const { deleteDigitalCard } = await import("@/lib/actions/cards");
      await deleteDigitalCard(id);
      toast.success("Tarjeta eliminada");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {cards.length} {cards.length === 1 ? "tarjeta" : "tarjetas"} ·
            estilo Linktree para compartir tu marca
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nueva tarjeta
        </Button>
      </div>

      {cards.length === 0 && !creating ? (
        <Card className="p-12 text-center">
          <Share2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-base font-medium">Sin tarjetas digitales</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-sm text-muted-foreground">
            Crea una página tipo Linktree con todos tus links profesionales: WhatsApp, propiedades, redes sociales.
          </p>
          <Button onClick={() => setCreating(true)} className="mt-5">
            <Plus className="mr-1.5 h-4 w-4" />
            Crear primera tarjeta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <DigitalCardSummary
              key={c.id}
              card={c}
              onEdit={() => setEditing(c)}
              onDelete={() => handleDelete(c.id, c.title)}
            />
          ))}
        </div>
      )}

      <CreateCardDialog
        open={creating}
        onOpenChange={setCreating}
        onCreate={handleCreate}
        pending={pending}
      />

      {editing && (
        <EditCardDialog
          card={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// CARD SUMMARY
// ============================================================

function DigitalCardSummary({
  card,
  onEdit,
  onDelete,
}: {
  card: DigitalCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${card.slug}`
      : `/c/${card.slug}`;

  function copyLink() {
    navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
    >
      {/* Top gradient */}
      <div
        className="h-16"
        style={{
          background: `linear-gradient(135deg, ${card.primaryColor}, ${card.accentColor ?? card.primaryColor})`,
        }}
      />

      <div className="relative px-4 pb-4">
        <div className="-mt-7 flex items-end justify-between">
          <Avatar className="h-14 w-14 ring-4 ring-card">
            {card.avatarUrl && <AvatarImage src={card.avatarUrl} alt={card.title} />}
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ background: card.primaryColor }}
            >
              {card.title
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!card.isActive && (
            <Badge variant="outline" className="text-[9px]">
              <EyeOff className="mr-0.5 h-2.5 w-2.5" />
              Inactiva
            </Badge>
          )}
        </div>

        <div className="mt-3">
          <p className="truncate text-sm font-semibold">{card.title}</p>
          {card.role && (
            <p className="truncate text-[11px] text-muted-foreground">
              {card.role}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span className="font-mono tabular-nums">{card.views}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            <span className="font-mono tabular-nums">{card.links.length}</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px]">
            <Globe className="h-3 w-3" />
            <span className="truncate">/{card.slug}</span>
          </span>
        </div>

        {/* Modo presentación — QR grande para mostrar en persona */}
        <Button size="sm" className="mt-3 w-full" onClick={() => setQrOpen(true)}>
          <QrCode className="mr-1.5 h-3.5 w-3.5" />
          Pantalla completa
        </Button>

        {/* Actions */}
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link href={`/c/${card.slug}`} target="_blank">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={copyLink}
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setStatsOpen(true)}
            aria-label="Estadísticas"
          >
            <BarChart3 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={onEdit}
            aria-label="Editar"
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
          aria-label="Eliminar tarjeta"
        >
          <X className="h-3 w-3 text-destructive" />
        </button>
      </div>

      <CardQrFullscreen
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        slug={card.slug}
        title={card.title}
        role={card.role}
        avatarUrl={card.avatarUrl}
        primaryColor={card.primaryColor}
      />
      <CardAnalyticsDialog
        open={statsOpen}
        onOpenChange={setStatsOpen}
        title={card.title}
        views={card._count.cardViews || card.views}
        links={card.links}
      />
    </motion.div>
  );
}

// ============================================================
// CREATE DIALOG
// ============================================================

function CreateCardDialog({
  open,
  onOpenChange,
  onCreate,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: { title: string; slug?: string }) => Promise<unknown>;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  async function handleSubmit() {
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), slug: slug.trim() || undefined });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Reset al cerrar (cualquier vía: Esc, overlay, cancelar) — sin useEffect.
        if (!v) {
          setTitle("");
          setSlug("");
        }
        onOpenChange(v);
      }}
    >
      <DialogContent aria-describedby={undefined} className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Nueva tarjeta digital</DialogTitle>
          <DialogDescription>
            Crea una página pública con todos tus links profesionales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Título visible
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Carlos Almonte"
              maxLength={80}
              autoFocus
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Slug (opcional)
            </label>
            <div className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground">/c/</span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                placeholder="carlos-almonte"
                maxLength={40}
                className="flex-1 bg-transparent focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Si lo dejas vacío se genera del título.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || pending}>
            {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// EDIT DIALOG (with link manager)
// ============================================================

function EditCardDialog({
  card,
  onClose,
}: {
  card: DigitalCard;
  onClose: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"info" | "links" | "design">("info");
  const [pending, setPending] = useState(false);

  // Editable state
  const [state, setState] = useState({
    title: card.title,
    role: card.role ?? "",
    bio: card.bio ?? "",
    slug: card.slug,
    avatarUrl: card.avatarUrl,
    coverUrl: card.coverUrl,
    theme: card.theme,
    primaryColor: card.primaryColor,
    accentColor: card.accentColor ?? "",
    isActive: card.isActive,
    showProperties: card.showProperties,
    showWhatsapp: card.showWhatsapp,
  });
  const [links, setLinks] = useState<CardLink[]>(card.links);

  function set<K extends keyof typeof state>(k: K, v: (typeof state)[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  async function handleSave() {
    setPending(true);
    try {
      const { updateDigitalCard } = await import("@/lib/actions/cards");
      await updateDigitalCard(card.id, {
        title: state.title,
        role: state.role || null,
        bio: state.bio || null,
        slug: state.slug,
        avatarUrl: state.avatarUrl,
        coverUrl: state.coverUrl,
        theme: state.theme,
        primaryColor: state.primaryColor,
        accentColor: state.accentColor || null,
        isActive: state.isActive,
        showProperties: state.showProperties,
        showWhatsapp: state.showWhatsapp,
      });
      toast.success("Tarjeta actualizada");
      onClose();
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="overflow-hidden p-0 sm:max-w-[680px]"
      >
        <DialogHeader className="border-b border-border bg-card/40 px-5 py-4">
          <DialogTitle className="text-base">Editar tarjeta digital</DialogTitle>
          <DialogDescription className="text-xs">
            /c/{state.slug} · {card.views} vistas
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border bg-card/30">
          {[
            { key: "info" as const, label: "Información" },
            { key: "links" as const, label: `Links (${links.length})` },
            { key: "design" as const, label: "Diseño" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex-1 px-4 py-3 text-xs font-medium transition-colors",
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {tab === t.key && (
                <motion.span
                  layoutId="card-edit-tab"
                  className="absolute inset-x-0 bottom-0 h-[2px] bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-5">
          {tab === "info" && (
            <div className="space-y-4">
              <FieldRow label="Foto de perfil">
                <ImageUploader
                  value={state.avatarUrl}
                  onChange={(url) => set("avatarUrl", url)}
                  shape="circle"
                  size={72}
                />
              </FieldRow>
              <FieldRow label="Imagen de portada (opcional)">
                <ImageUploader
                  value={state.coverUrl}
                  onChange={(url) => set("coverUrl", url)}
                  shape="wide"
                />
              </FieldRow>
              <FieldRow label="Slug público">
                <div className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm">
                  <span className="text-muted-foreground">/c/</span>
                  <input
                    value={state.slug}
                    onChange={(e) =>
                      set(
                        "slug",
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                      )
                    }
                    maxLength={40}
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                </div>
              </FieldRow>
              <FieldRow label="Título">
                <input
                  value={state.title}
                  onChange={(e) => set("title", e.target.value)}
                  maxLength={80}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </FieldRow>
              <FieldRow label="Rol / cargo">
                <input
                  value={state.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="Ej. Agente inmobiliario · Mi Ciudad"
                  maxLength={120}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </FieldRow>
              <FieldRow label="Bio corta">
                <textarea
                  value={state.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="Describe brevemente quién eres y qué ofreces."
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </FieldRow>

              <div className="space-y-2 border-t border-border pt-4">
                <ToggleRow
                  label="Tarjeta activa"
                  desc="Si está apagada, devuelve 404"
                  value={state.isActive}
                  onChange={(v) => set("isActive", v)}
                />
                <ToggleRow
                  label="Mostrar propiedades destacadas"
                  desc="Las 3 más recientes en venta/alquiler"
                  value={state.showProperties}
                  onChange={(v) => set("showProperties", v)}
                />
                <ToggleRow
                  label="WhatsApp prominente"
                  desc="Auto-incluye botón WhatsApp arriba"
                  value={state.showWhatsapp}
                  onChange={(v) => set("showWhatsapp", v)}
                />
              </div>
            </div>
          )}

          {tab === "links" && (
            <LinksManager
              cardId={card.id}
              links={links}
              onLinksChange={setLinks}
            />
          )}

          {tab === "design" && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tema
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {THEMES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => set("theme", t.key)}
                      className={cn(
                        "rounded-lg border p-2 transition-all",
                        state.theme === t.key
                          ? "border-foreground shadow-md"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <div
                        className="mb-1.5 h-10 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                        }}
                      />
                      <p className="text-[10px] font-medium">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Color primario
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("primaryColor", c)}
                      className={cn(
                        "h-7 w-7 rounded-full transition-all hover:scale-110",
                        state.primaryColor === c &&
                          "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Color acento (opcional)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => set("accentColor", "")}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border border-dashed transition-all",
                      !state.accentColor &&
                        "border-foreground bg-foreground/5"
                    )}
                    title="Sin acento"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("accentColor", c)}
                      className={cn(
                        "h-7 w-7 rounded-full transition-all hover:scale-110",
                        state.accentColor === c &&
                          "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview gradient */}
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vista previa
                </p>
                <div
                  className="h-20 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${state.primaryColor}, ${state.accentColor || state.primaryColor})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-card/30 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// LINKS MANAGER
// ============================================================

function LinksManager({
  cardId,
  links,
  onLinksChange,
}: {
  cardId: string;
  links: CardLink[];
  onLinksChange: (links: CardLink[]) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function handleCreate(input: Omit<CardLink, "id" | "clicks" | "order">) {
    setPending(true);
    try {
      const { createCardLink } = await import("@/lib/actions/cards");
      const link = await createCardLink({
        cardId,
        label: input.label,
        url: input.url,
        icon: input.icon,
        imageUrl: input.imageUrl,
        description: input.description,
        color: input.color,
        highlight: input.highlight,
      });
      onLinksChange([
        ...links,
        {
          id: link.id,
          label: link.label,
          url: link.url,
          icon: link.icon,
          imageUrl: link.imageUrl,
          description: link.description,
          color: link.color,
          highlight: link.highlight,
          active: link.active,
          clicks: link.clicks,
          order: link.order,
        },
      ]);
      setShowAdd(false);
      toast.success("Link añadido");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleUpdate(id: string, patch: Partial<CardLink>) {
    setPending(true);
    try {
      const { updateCardLink } = await import("@/lib/actions/cards");
      await updateCardLink(id, patch);
      onLinksChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      setEditingId(null);
      toast.success("Link actualizado");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este link?")) return;
    setPending(true);
    try {
      const { deleteCardLink } = await import("@/lib/actions/cards");
      await deleteCardLink(id);
      onLinksChange(links.filter((l) => l.id !== id));
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  // Drag-reorder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = links.findIndex((l) => l.id === active.id);
    const newIdx = links.findIndex((l) => l.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(links, oldIdx, newIdx);
    onLinksChange(reordered);
    try {
      const { reorderCardLinks } = await import("@/lib/actions/cards");
      await reorderCardLinks(
        cardId,
        reordered.map((l) => l.id)
      );
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      // revert
      onLinksChange(links);
    }
  }

  return (
    <div className="space-y-3">
      {/* Add button or form */}
      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir link
        </button>
      ) : (
        <LinkEditor
          mode="create"
          onSave={handleCreate}
          onCancel={() => setShowAdd(false)}
          pending={pending}
        />
      )}

      {/* List */}
      {links.length === 0 && !showAdd ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sin links todavía. Empieza por uno arriba.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-1.5">
              {links.map((l) => {
                const editing = editingId === l.id;
                return (
                  <li key={l.id}>
                    {editing ? (
                      <LinkEditor
                        mode="edit"
                        initial={l}
                        onSave={(patch) => handleUpdate(l.id, patch)}
                        onCancel={() => setEditingId(null)}
                        pending={pending}
                      />
                    ) : (
                      <SortableLinkRow
                        link={l}
                        onEdit={() => setEditingId(l.id)}
                        onDelete={() => handleDelete(l.id)}
                        pending={pending}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ============================================================
// SORTABLE LINK ROW
// ============================================================

function SortableLinkRow({
  link: l,
  onEdit,
  onDelete,
  pending,
}: {
  link: CardLink;
  onEdit: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: l.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  const Icon = ICONS[l.icon] ?? LinkIcon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card/40 p-2.5 transition-colors hover:bg-card",
        l.highlight && "border-amber-500/30 bg-amber-500/[0.05]",
        isDragging && "cursor-grabbing shadow-xl ring-2 ring-primary/30"
      )}
    >
      <button
        type="button"
        className="flex h-7 w-5 cursor-grab touch-none items-center justify-center text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {l.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={l.imageUrl}
          alt={l.label}
          className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-border"
        />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: `${l.color ?? "#3B82F6"}15`,
            color: l.color ?? "#3B82F6",
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{l.label}</p>
          {l.highlight && (
            <Star
              className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400"
              strokeWidth={0}
            />
          )}
        </div>
        {l.description && (
          <p className="truncate text-[11px] text-muted-foreground">
            {l.description}
          </p>
        )}
        <p className="truncate font-mono text-[10px] text-muted-foreground/70">
          {l.url}
        </p>
      </div>
      {l.clicks > 0 && (
        <Badge variant="outline" className="text-[9px]">
          {l.clicks} clicks
        </Badge>
      )}
      <div className="flex items-center">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onEdit}
          disabled={pending}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={pending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// LINK EDITOR (create or edit single link)
// ============================================================

function LinkEditor({
  mode,
  initial,
  onSave,
  onCancel,
  pending,
}: {
  mode: "create" | "edit";
  initial?: CardLink;
  onSave: (data: Omit<CardLink, "id" | "clicks" | "order"> & { active?: boolean }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Link");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [color, setColor] = useState(initial?.color ?? "");
  const [highlight, setHighlight] = useState(initial?.highlight ?? false);

  function handleSubmit() {
    if (!label.trim() || !url.trim()) return;
    onSave({
      label: label.trim(),
      url: url.trim(),
      description: description.trim() || null,
      icon,
      imageUrl,
      color: color || null,
      highlight,
      active: true,
    });
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {mode === "edit" ? "Editar link" : "Nuevo link"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Image (replaces icon when set) */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Imagen del link (opcional)
          </p>
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            shape="square"
            size={56}
            label=""
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Si no subes imagen, se usa el ícono.
          </p>
        </div>

        {/* Icon fallback */}
        {!imageUrl && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ícono
            </p>
            <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
              {ICON_OPTIONS.map((i) => {
                const Icon = ICONS[i] ?? LinkIcon;
                const active = icon === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md border transition-colors",
                      active
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                    title={i}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Etiqueta *
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej. Agenda una llamada"
            maxLength={60}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            URL *
          </p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://... · tel:... · mailto:... · wa.me/..."
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm font-mono focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Descripción (opcional)
          </p>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Aparece debajo de la etiqueta"
            maxLength={120}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Color de acento
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setColor("")}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border border-dashed",
                !color && "border-foreground bg-foreground/5"
              )}
              title="Sin color"
            >
              <X className="h-2.5 w-2.5" />
            </button>
            {[
              "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
              "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#0F172A",
            ].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full transition-all hover:scale-110",
                  color === c &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHighlight(!highlight)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all",
            highlight
              ? "border-amber-500/40 bg-amber-500/[0.06]"
              : "border-border bg-card/40 hover:bg-card"
          )}
        >
          <Star
            className={cn(
              "h-4 w-4 shrink-0",
              highlight ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            )}
            strokeWidth={highlight ? 0 : 1.75}
          />
          <div className="flex-1">
            <p className="text-xs font-medium">Destacar este link</p>
            <p className="text-[10px] text-muted-foreground">
              Se muestra con borde dorado en la tarjeta pública
            </p>
          </div>
        </button>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={pending || !label.trim() || !url.trim()}
          >
            {pending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {mode === "edit" ? "Guardar" : "Añadir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5 text-left transition-colors hover:bg-card"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow",
            value ? "right-0.5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
