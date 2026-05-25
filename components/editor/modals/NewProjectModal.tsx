"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  TEMPLATES,
  type RealEstateTemplate,
} from "@/lib/editor/templates/real-estate-templates";
import {
  createProjectFromTemplate,
  listPropertiesForPicker,
} from "@/lib/actions/editor";
import { cn } from "@/lib/utils";

type PropPick = {
  id: string;
  title: string;
  location: string | null;
  photos: { url: string }[];
};

export function NewProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<RealEstateTemplate | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [props, setProps] = useState<PropPick[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setPropertyId(null);
    void listPropertiesForPicker().then((rows) =>
      setProps(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          location: r.location,
          photos: r.photos,
        }))
      )
    );
  }, [open]);

  if (!open) return null;

  async function handleCreate() {
    if (!selected) return;
    setCreating(true);
    try {
      const result = await createProjectFromTemplate({
        templateId: selected.id,
        propertyId: propertyId ?? undefined,
      });
      router.push(`/studio/editor/${result.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#15151B] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-semibold">Nuevo proyecto</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1fr_320px]">
          {/* Templates grid */}
          <div className="overflow-y-auto p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Elige una plantilla
            </p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={cn(
                    "group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                    selected?.id === t.id
                      ? "border-primary bg-primary/15 ring-2 ring-primary/30"
                      : "border-white/10 bg-white/5 hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <div className="flex h-20 w-full items-center justify-center rounded bg-white/10 text-3xl">
                    {t.thumbnail}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{t.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] text-white/50">
                      {t.description}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-primary/80">
                      {t.format}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Property picker */}
          <div className="border-t border-white/10 bg-black/30 p-4 md:border-l md:border-t-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Asociar a propiedad (opcional)
            </p>
            <p className="mb-3 text-[11px] text-white/60">
              Auto-rellena título, precio, specs, agente.
            </p>
            <button
              onClick={() => setPropertyId(null)}
              className={cn(
                "mb-2 w-full rounded-md border p-2 text-left text-xs transition-colors",
                propertyId === null
                  ? "border-primary/40 bg-primary/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:text-white"
              )}
            >
              Sin asociar
            </button>
            {!props ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-white/40" />
              </div>
            ) : (
              <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                {props.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPropertyId(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors",
                      propertyId === p.id
                        ? "border-primary/40 bg-primary/15 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                    )}
                  >
                    {p.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photos[0].url}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded bg-white/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{p.title}</p>
                      {p.location && (
                        <p className="truncate text-[10px] text-white/50">
                          {p.location}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <p className="text-[11px] text-white/60">
            {selected ? (
              <>
                <span className="font-semibold text-white">{selected.name}</span>
                {propertyId && props && (
                  <>
                    {" · "}
                    {props.find((p) => p.id === propertyId)?.title}
                  </>
                )}
              </>
            ) : (
              "Selecciona una plantilla para continuar"
            )}
          </p>
          <Button
            onClick={handleCreate}
            disabled={!selected || creating}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {creating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Crear proyecto
          </Button>
        </div>
      </div>
    </div>
  );
}
