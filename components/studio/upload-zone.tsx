"use client";

import { Upload, Loader2, ImagePlus, ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudio } from "./studio-context";

export function UploadZone() {
  const { setImage } = useStudio();
  const [isOver, setIsOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo imágenes");
        return;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al subir");
        setImage({ url: data.url, filename: data.filename });
        toast.success("Foto subida");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [setImage]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <label
      onDragEnter={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/30 text-center transition-all",
        isOver && "border-primary/60 bg-primary/5 scale-[1.01]",
        uploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card ring-1 ring-border">
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <ImagePlus className="h-6 w-6 text-primary" strokeWidth={1.5} />
        )}
      </div>
      <h3 className="text-base font-semibold">
        {uploading ? "Subiendo..." : "Sube una foto"}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Arrastra una imagen o haz click para seleccionar.<br />
        JPG, PNG, WEBP · máx 15MB
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        Recomendado: ≥ 1024×1024px para mejores resultados
      </div>
    </label>
  );
}
