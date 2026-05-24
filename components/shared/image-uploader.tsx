"use client";

import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UploadedFile = {
  url: string;
  filename: string;
};

async function uploadOne(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error al subir");
  return data;
}

export function ImageUploader({
  value,
  onChange,
  className,
  maxFiles = 8,
  hint = "Arrastra fotos o haz click",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  className?: string;
  maxFiles?: number;
  hint?: string;
}) {
  const [isOver, setIsOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      if (value.length + arr.length > maxFiles) {
        toast.error(`Máximo ${maxFiles} fotos`);
        return;
      }
      setUploading(true);
      try {
        const results = await Promise.all(arr.map(uploadOne));
        onChange([...value, ...results.map((r) => r.url)]);
        toast.success(`${results.length} foto${results.length > 1 ? "s" : ""} subida${results.length > 1 ? "s" : ""}`);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [value, maxFiles, onChange]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveFirst(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  }

  return (
    <div className={cn("space-y-3", className)}>
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
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-card",
          isOver && "border-primary/60 bg-primary/5",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm font-medium">{hint}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG, WEBP · máx 15MB cada una · hasta {maxFiles} fotos
        </p>
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Portada
                </span>
              )}
              <div className="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => moveFirst(i)}
                  >
                    Portada
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6"
                  onClick={() => removeAt(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
