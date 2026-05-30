"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createStylePreset,
  deleteStylePreset,
  toggleStylePreset,
} from "@/lib/actions/style-preset";

type Preset = {
  id: string;
  label: string;
  category: string;
  imageUrl: string;
  active: boolean;
};

const CATEGORIES = [
  { v: "AGENT_PHOTO", l: "Foto Pro (agente)" },
  { v: "STAGING", l: "Staging (propiedades)" },
  { v: "GENERIC", l: "Genérico" },
] as const;

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.v, c.l])
);

const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export function StylePresetsManager({ presets }: { presets: Preset[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<string>("AGENT_PHOTO");
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!label.trim()) {
      toast.error("Escribe un nombre para la muestra primero.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo subir la imagen.");
      }
      const { url } = await res.json();
      await createStylePreset({ label: label.trim(), category: category as never, imageUrl: url });
      toast.success("Muestra agregada.");
      setLabel("");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function del(id: string) {
    start(async () => {
      try {
        await deleteStylePreset(id);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }
  function toggle(id: string, active: boolean) {
    start(async () => {
      try {
        await toggleStylePreset(id, active);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Subir */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Agregar foto de muestra</p>
        <p className="mb-3 text-xs text-muted-foreground">
          El agente la elige como referencia de estilo al generar (la IA imita su look).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nombre (ej. Ejecutivo fondo gris)"
            className={cn(inputCls, "min-w-[220px] flex-1")}
            maxLength={120}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(inputCls, "max-w-[200px]")}>
            {CATEGORIES.map((c) => (
              <option key={c.v} value={c.v}>
                {c.l}
              </option>
            ))}
          </select>
          <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1.5 h-4 w-4" />}
            Subir muestra
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      </div>

      {/* Lista */}
      {presets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aún no hay fotos de muestra. Sube la primera arriba.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {presets.map((p) => (
            <div
              key={p.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border bg-card",
                !p.active && "opacity-50"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.label} className="aspect-[3/4] w-full object-cover" />
              <div className="space-y-1 p-2.5">
                <p className="truncate text-xs font-medium text-foreground">{p.label}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {CAT_LABEL[p.category] ?? p.category}
                </p>
                <div className="flex items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => toggle(p.id, !p.active)}
                    disabled={pending}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    title={p.active ? "Ocultar" : "Activar"}
                  >
                    {p.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {p.active ? "Activa" : "Oculta"}
                  </button>
                  <button
                    type="button"
                    onClick={() => del(p.id)}
                    disabled={pending}
                    className="ml-auto flex items-center gap-1 text-[11px] text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
