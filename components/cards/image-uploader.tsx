"use client";

/**
 * Compact image uploader with optional crop step + size hints.
 * Drops in any form. Handles upload, preview, remove.
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Info, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarCropper, type CropShape } from "@/components/shared/avatar-cropper";

const SHAPE_HINTS: Record<
  "circle" | "square" | "wide",
  { recommended: string; max: string; cropShape: CropShape }
> = {
  circle: {
    recommended: "Cuadrada · 512×512px",
    max: "máx 5MB · JPG/PNG/WebP",
    cropShape: "circle",
  },
  square: {
    recommended: "Cuadrada · 1080×1080px",
    max: "máx 5MB · JPG/PNG/WebP",
    cropShape: "square",
  },
  wide: {
    recommended: "Portada · 1600×900px (16:9)",
    max: "máx 5MB · JPG/PNG/WebP",
    cropShape: "wide",
  },
};

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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const hint = SHAPE_HINTS[shape];

  function onPickFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `Imagen muy pesada (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 5MB.`
      );
      return;
    }
    // Open cropper with local URL
    setCropSrc(URL.createObjectURL(file));
  }

  async function uploadBlob(blob: Blob) {
    setUploading(true);
    try {
      const file = new File([blob], `image-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
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
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
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
        <div className="mt-0.5 flex items-start gap-1 text-[10px] text-muted-foreground">
          <Info className="mt-0.5 h-2.5 w-2.5 shrink-0 text-primary/60" />
          <div>
            <p>{hint.recommended}</p>
            <p className="opacity-70">{hint.max}</p>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          e.target.value = "";
        }}
      />

      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          shape={hint.cropShape}
          outputType="image/jpeg"
          quality={0.9}
          onConfirm={uploadBlob}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
}
