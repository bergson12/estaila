"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de progreso para esperas SIN porcentaje real (generación de imágenes,
 * OCR, propuestas IA…). Sube rápido al inicio y desacelera acercándose a ~94%
 * con una curva easeOut; al desmontarse (cuando termina) desaparece. Da
 * sensación de avance para que el usuario no quede "en el aire".
 */
export function GeneratingBar({
  className,
  durationMs = 45000,
  label,
}: {
  className?: string;
  durationMs?: number;
  label?: string;
}) {
  const [pct, setPct] = useState(8);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) / durationMs;
      // easeOut hacia 94%: nunca llega a 100 hasta que el proceso real termina.
      const target = 94 * (1 - Math.exp(-2.4 * t));
      setPct(Math.max(8, Math.min(95, target)));
    }, 400);
    return () => clearInterval(id);
  }, [durationMs]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
