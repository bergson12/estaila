"use client";

import { Loader2, ImagePlus, ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudio } from "./studio-context";
import { compressImage, formatBytes } from "@/lib/compress-image";
import { useT } from "@/lib/i18n/provider";

export function UploadZone() {
  const { setImage } = useStudio();
  const { t } = useT();
  const [isOver, setIsOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<"" | "compress" | "upload">("");

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t.studio.toastOnlyImages);
        return;
      }
      setUploading(true);
      try {
        const originalSize = file.size;
        setStage("compress");
        const compressed = await compressImage(file, "raw");
        const saved =
          compressed.size < originalSize
            ? `${Math.round(((originalSize - compressed.size) / originalSize) * 100)}% ${t.studio.lighter}`
            : null;

        setStage("upload");
        const form = new FormData();
        form.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t.studio.uploadError);
        setImage({ url: data.url, filename: data.filename });
        toast.success(t.studio.toastPhotoUploaded, {
          description: saved
            ? `${formatBytes(originalSize)} → ${formatBytes(compressed.size)} · ${saved}`
            : `${formatBytes(compressed.size)}`,
        });
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
        setStage("");
      }
    },
    [setImage, t]
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
        {stage === "compress"
          ? t.studio.compressing
          : stage === "upload"
            ? t.studio.uploading
            : t.studio.uploadTitle}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {t.studio.uploadHintLine1}<br />
        {t.studio.uploadHintFormats}
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        {t.studio.uploadRecommended}
      </div>
    </label>
  );
}
