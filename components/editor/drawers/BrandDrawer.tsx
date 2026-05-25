"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";
import { compressImage } from "@/lib/compress-image";
import {
  createBrandAsset,
  deleteBrandAsset,
  listBrandAssets,
} from "@/lib/actions/editor";

type Asset = {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  fileSize: number;
};

export function BrandDrawer() {
  const canvas = useEditor((s) => s.canvas);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const list = await listBrandAssets();
    setAssets(list);
  };

  useEffect(() => {
    void load();
  }, []);

  async function handleUpload(file: File, type: string) {
    setUploading(true);
    try {
      const compressed = await compressImage(file, "avatar");
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Error al subir");
      const data = (await res.json()) as { url: string };
      await createBrandAsset({
        type,
        name: file.name.replace(/\.[^.]+$/, ""),
        fileUrl: data.url,
        fileSize: compressed.size,
      });
      await load();
      toast.success("Asset agregado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function addToCanvas(url: string, name: string) {
    if (!canvas) return;
    const { FabricImage } = await import("fabric");
    const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    img.scale(Math.min(200 / (img.width ?? 200), 1));
    tag(img, "image", name);
    centerObject(canvas, img);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este asset?")) return;
    await deleteBrandAsset(id);
    await load();
  }

  return (
    <DrawerShell title="Marca">
      <label className="mb-4 flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/15 bg-white/5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, "LOGO");
            e.target.value = "";
          }}
        />
        {uploading ? (
          <Loader2 className="mb-1 h-4 w-4 animate-spin text-primary" />
        ) : (
          <ImagePlus className="mb-1 h-4 w-4 text-primary" />
        )}
        <p className="text-[11px] text-white">
          {uploading ? "Subiendo..." : "Subir logo / marca de agua"}
        </p>
      </label>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Mis assets
      </p>
      {!assets ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-white/40" />
        </div>
      ) : assets.length === 0 ? (
        <p className="px-3 py-6 text-center text-[11px] text-white/50">
          Sin assets. Sube tu logo arriba.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-white/10 bg-white/5"
            >
              <button
                onClick={() => addToCanvas(a.fileUrl, a.name)}
                className="absolute inset-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.fileUrl}
                  alt={a.name}
                  className="h-full w-full object-contain p-2"
                />
              </button>
              <button
                onClick={() => remove(a.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white/70 opacity-0 transition-opacity hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </DrawerShell>
  );
}
