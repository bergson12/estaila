"use client";

import {
  Building2,
  Download,
  Grid2x2,
  Grid3x3,
  ImageOff,
  LayoutGrid,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Rows3,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DownloadModal,
  SaveToPropertyDialog,
  SendToContactDialog,
} from "./photo-dialogs";
import { deleteGeneration, type GalleryItem } from "@/lib/actions/ai";

const TOOL_LABELS: Record<string, string> = {
  STAGING: "Virtual Staging",
  DECLUTTER: "Eliminar objetos",
  ENHANCE: "Mejorar calidad",
  STYLE_CHANGE: "Cambiar estilo",
  SKY: "Cielo despejado",
  TWILIGHT: "Atardecer",
  POOL: "Piscina",
  LAWN: "Césped",
  ADD_OBJECT: "Colocar objeto",
  REMOVE_OBJECT: "Quitar objeto",
};

const COL_CLASS: Record<number, string> = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-3 sm:grid-cols-4",
  5: "grid-cols-4 sm:grid-cols-5 lg:grid-cols-6",
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** iOS "Moments"-style bucket label for a date. */
function bucketLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const dayMs = 86_400_000;
  const t = d.getTime();
  if (t >= startOfToday) return "Hoy";
  if (t >= startOfToday - dayMs) return "Ayer";
  if (t >= startOfToday - 7 * dayMs) return "Esta semana";
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    return "Este mes";
  const label = d.toLocaleDateString("es", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type View = "grid" | "cards";

export function GalleryGrid({ initial }: { initial: GalleryItem[] }) {
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [filter, setFilter] = useState<string>("ALL");
  const [view, setView] = useState<View>("grid");
  const [cols, setCols] = useState<number>(4);
  const [downloadFor, setDownloadFor] = useState<GalleryItem | null>(null);
  const [saveFor, setSaveFor] = useState<GalleryItem | null>(null);
  const [shareFor, setShareFor] = useState<GalleryItem | null>(null);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Counts per tool (for filter pills)
  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const i of items) acc[i.tool] = (acc[i.tool] ?? 0) + 1;
    return acc;
  }, [items]);

  const tools = useMemo(
    () => Object.keys(counts).sort((a, b) => counts[b] - counts[a]),
    [counts]
  );

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((i) => i.tool === filter)),
    [items, filter]
  );

  // Group filtered items into date buckets (preserve newest-first order)
  const sections = useMemo(() => {
    const map = new Map<string, GalleryItem[]>();
    for (const it of filtered) {
      const label = bucketLabel(it.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function remove(item: GalleryItem) {
    if (
      !window.confirm(
        "¿Eliminar esta foto de la galería? No se borrará de las propiedades donde ya la guardaste."
      )
    )
      return;
    setDeleting(item.id);
    const prev = items;
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    setLightbox(null);
    try {
      await deleteGeneration(item.id);
      toast.success("Foto eliminada de la galería");
    } catch (e) {
      setItems(prev);
      toast.error((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
        <ImageOff className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">Tu galería está vacía</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Las fotos que generes con Studio IA aparecerán aquí automáticamente,
          listas para mover a una propiedad o compartir.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/studio">Abrir Studio IA</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* ===== Toolbar: filtros + vista ===== */}
      <div className="sticky top-0 z-20 -mx-1 mb-3 flex flex-col gap-2.5 bg-background/85 px-1 py-2 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Filter pills */}
        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterPill
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
            label="Todas"
            count={items.length}
          />
          {tools.map((t) => (
            <FilterPill
              key={t}
              active={filter === t}
              onClick={() => setFilter(t)}
              label={TOOL_LABELS[t] ?? t}
              count={counts[t]}
            />
          ))}
        </div>

        {/* View segmented control + zoom */}
        <div className="flex shrink-0 items-center gap-2">
          {view === "grid" && (
            <Segmented<number>
              value={cols}
              onChange={setCols}
              options={[
                { value: 5, icon: Grid3x3, title: "Pequeño" },
                { value: 4, icon: Grid2x2, title: "Mediano" },
                { value: 3, icon: LayoutGrid, title: "Grande" },
              ]}
            />
          )}
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: "grid", icon: LayoutGrid, title: "Cuadrícula" },
              { value: "cards", icon: Rows3, title: "Tarjetas" },
            ]}
          />
        </div>
      </div>

      {/* ===== Sections by date ===== */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 py-12 text-center text-xs text-muted-foreground">
          Sin fotos en este filtro.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(([label, group]) => (
            <section key={label}>
              <h2 className="mb-2 text-sm font-semibold tracking-tight">
                {label}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {group.length}
                </span>
              </h2>

              {view === "grid" ? (
                <div className={cn("grid gap-1.5", COL_CLASS[cols])}>
                  {group.map((item) => (
                    <motion.button
                      key={item.id}
                      layout
                      onClick={() => setLightbox(item)}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border/60 transition-shadow hover:ring-primary/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.outputUrl}
                        alt={TOOL_LABELS[item.tool] ?? item.tool}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                        {TOOL_LABELS[item.tool] ?? item.tool}
                      </span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <button
                        onClick={() => setLightbox(item)}
                        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.outputUrl}
                          alt={TOOL_LABELS[item.tool] ?? item.tool}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </button>
                      {/* Hover actions */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="pointer-events-auto flex items-center gap-1">
                          <IconBtn
                            title="Descargar"
                            onClick={() => setDownloadFor(item)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn
                            title="Mover a propiedad"
                            onClick={() => setSaveFor(item)}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                          </IconBtn>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                                title="Más"
                              >
                                {deleting === item.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => setShareFor(item)}
                              >
                                <MessageSquareText className="mr-2 h-3.5 w-3.5" />
                                Compartir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => remove(item)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {/* Meta */}
                      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                        <span className="truncate text-[11px] font-medium">
                          {TOOL_LABELS[item.tool] ?? item.tool}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {fmtDate(item.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* ===== Lightbox (iOS detail view) ===== */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col bg-black/90 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {TOOL_LABELS[lightbox.tool] ?? lightbox.tool}
                </p>
                <p className="text-[11px] text-white/60">
                  {fmtDate(lightbox.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Image */}
            <div
              className="flex flex-1 items-center justify-center overflow-hidden px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={lightbox.id}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                src={lightbox.outputUrl}
                alt=""
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>

            {/* Bottom action bar */}
            <div
              className="flex items-center justify-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <LightboxAction
                icon={Download}
                label="Descargar"
                onClick={() => setDownloadFor(lightbox)}
              />
              <LightboxAction
                icon={Building2}
                label="A propiedad"
                onClick={() => setSaveFor(lightbox)}
              />
              <LightboxAction
                icon={MessageSquareText}
                label="Compartir"
                onClick={() => setShareFor(lightbox)}
              />
              <LightboxAction
                icon={Trash2}
                label="Eliminar"
                danger
                onClick={() => remove(lightbox)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Dialogs (shared) ===== */}
      <DownloadModal
        open={!!downloadFor}
        onClose={() => setDownloadFor(null)}
        outputUrl={downloadFor?.outputUrl ?? ""}
        filename={`estaila-${downloadFor?.tool?.toLowerCase() ?? "foto"}-${
          downloadFor?.id?.slice(0, 8) ?? ""
        }.png`}
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
          outputUrl={shareFor.outputUrl}
        />
      )}
    </>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary/40 bg-primary text-primary-foreground"
          : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] tabular-nums",
          active ? "bg-white/20" : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: {
    value: T;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }[];
}) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-card/50 p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            title={o.title}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join("-")}`}
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </button>
  );
}

function LightboxAction({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-white transition-colors",
        danger ? "hover:bg-destructive/30" : "hover:bg-white/10"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
