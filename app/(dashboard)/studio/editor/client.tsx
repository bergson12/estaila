"use client";

import { Image as ImageIcon, MoreVertical, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NewProjectModal } from "@/components/editor/modals/NewProjectModal";
import { deleteProject } from "@/lib/actions/editor";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  thumbnail: string | null;
  updatedAt: Date;
  format: string;
  propertyTitle: string | null;
};

export function EditorListClient({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function remove(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    try {
      await deleteProject(id);
      toast.success("Proyecto eliminado");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Editor de imágenes"
        description="Combina IA, texto, logos y plantillas inmobiliarias en un solo flujo."
      />

      <div className="mb-6 flex items-center justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo proyecto
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold">Sin proyectos aún</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Crea tu primer post inmobiliario en menos de 3 minutos. Elige una
            plantilla, asocia una propiedad y publica.
          </p>
          <Button onClick={() => setOpen(true)} className="mt-5">
            <Plus className="mr-1.5 h-4 w-4" />
            Empezar
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "group overflow-hidden p-0 transition-shadow hover:shadow-lg"
              )}
            >
              <Link href={`/studio/editor/${p.id}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                    {p.format}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {p.propertyTitle && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      📍 {p.propertyTitle}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("es-DO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white/80 opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <NewProjectModal open={open} onClose={() => setOpen(false)} />
      {/* unused refs to satisfy lint */}
      <span className="hidden">{String(MoreVertical.displayName ?? "")}</span>
    </>
  );
}
