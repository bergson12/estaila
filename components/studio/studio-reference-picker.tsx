"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useStudio } from "./studio-context";
import { listActivePresets } from "@/lib/actions/style-preset";
import { useT } from "@/lib/i18n/provider";

type P = { id: string; label: string; imageUrl: string };

/**
 * Selector de "foto de muestra / referencia de estilo" para las tools de
 * propiedades (Gemini). Lee las muestras activas de la categoría STAGING que el
 * admin sube en /admin/muestras. Si no hay, no renderiza nada.
 */
export function StudioReferencePicker() {
  const { referenceId, setReferenceId } = useStudio();
  const { t } = useT();
  const [presets, setPresets] = useState<P[]>([]);

  useEffect(() => {
    let alive = true;
    listActivePresets("STAGING")
      .then((rows) => {
        if (alive) setPresets(rows.map((r) => ({ id: r.id, label: r.label, imageUrl: r.imageUrl })));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (presets.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <p className="mb-1.5 text-[11px] font-semibold text-foreground">{t.studio.styleReferenceOptional}</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setReferenceId(null)}
          className={cn(
            "flex h-14 w-12 shrink-0 items-center justify-center rounded-md border text-[9px] font-medium transition-all",
            referenceId === null
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20"
          )}
        >
          {t.studio.none}
        </button>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setReferenceId(referenceId === p.id ? null : p.id)}
            title={p.label}
            className={cn(
              "shrink-0 overflow-hidden rounded-md border-2 transition-all",
              referenceId === p.id ? "border-primary" : "border-transparent hover:border-foreground/20"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.label} className="h-14 w-12 object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
