"use client";

/**
 * Compact image uploader.
 * Drops in any form. Handles upload, preview, remove.
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  shape = "circle",
  size = 80,
  label,
  disabled,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  shape?: "circle" | "square" | "wide";
  size?: number;
  label?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => null);
        throw new Error(err?.error ?? "Error al subir");
      }
      const data = await r.json();
      onChange(data.url ?? data.path ?? null);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const aspectClass =
    shape === "circle"
      ? "rounded-full aspect-square"
      : shape === "square"
        ? "rounded-xl aspect-square"
        : "rounded-xl aspect-[16/9]";

  return (
    <div className={cn("flex items-center gap-3", shape === "wide" && "flex-col items-stretch")}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-muted",
          aspectClass,
          shape === "wide" && "w-full"
        )}
        style={shape !== "wide" ? { width: size, height: size } : undefined}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label ?? "Imagen"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Camera className="h-5 w-5" strokeWidth={1.5} />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {value && !uploading && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100 sm:opacity-100"
            aria-label="Quitar imagen"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col gap-1", shape === "wide" && "items-center")}>
        {label && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            "inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:border-foreground/30 hover:bg-card disabled:opacity-50",
            shape === "wide" && "self-center"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3" />
              {value ? "Cambiar" : "Subir"}
            </>
          )}
        </button>
        {shape === "wide" && (
          <p className="text-[10px] text-muted-foreground">
            JPG/PNG/WebP · máx 5MB
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
