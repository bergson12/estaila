"use client";

import {
  Building2,
  Download,
  ImageOff,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

export function GalleryGrid({ initial }: { initial: GalleryItem[] }) {
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [downloadFor, setDownloadFor] = useState<GalleryItem | null>(null);
  const [saveFor, setSaveFor] = useState<GalleryItem | null>(null);
  const [shareFor, setShareFor] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(item: GalleryItem) {
    if (
      !window.confirm(
        "¿Eliminar esta foto de la galería? No se borrará de las propiedades donde ya la guardaste."
      )
    )
      return;
    setDeleting(item.id);
    // Optimistic
    const prev = items;
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    try {
      await deleteGeneration(item.id);
      toast.success("Foto eliminada de la galería");
    } catch (e) {
      setItems(prev); // rollback
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
          Las fotos que generes con Studio IA aparecerán aquí
          automáticamente, listas para mover a una propiedad o compartir.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/studio">Abrir Studio IA</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.outputUrl}
                alt={TOOL_LABELS[item.tool] ?? item.tool}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {/* Overlay actions */}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/55 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
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
                  <IconBtn
                    title="Compartir por WhatsApp"
                    onClick={() => setShareFor(item)}
                  >
                    <MessageSquareText className="h-3.5 w-3.5" />
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
                      <DropdownMenuItem onClick={() => setDownloadFor(item)}>
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSaveFor(item)}>
                        <Building2 className="mr-2 h-3.5 w-3.5" />
                        Mover a propiedad
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShareFor(item)}>
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
          </div>
        ))}
      </div>

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
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-primary hover:text-primary-foreground"
      )}
    >
      {children}
    </button>
  );
}
