"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";
import { compressImage } from "@/lib/compress-image";
import { listPropertiesForPicker } from "@/lib/actions/editor";

type PropPick = {
  id: string;
  title: string;
  location: string | null;
  price: number | null;
  photos: { url: string }[];
};

export function ImageDrawer() {
  const canvas = useEditor((s) => s.canvas);
  const [tab, setTab] = useState<"upload" | "properties">("properties");
  const [props, setProps] = useState<PropPick[] | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (tab === "properties" && !props) {
      void listPropertiesForPicker().then((rows) => {
        setProps(rows);
      });
    }
  }, [tab, props]);

  async function addImageFromUrl(url: string) {
    if (!canvas) return;
    const { FabricImage } = await import("fabric");
    const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    // Scale to fit nicely
    const targetW = Math.min(canvas.width ?? 1080, 600);
    const scale = targetW / (img.width ?? targetW);
    img.scale(scale);
    tag(img, "image", "Imagen");
    centerObject(canvas, img);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const compressed = await compressImage(file, "default");
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Error al subir");
      const data = (await res.json()) as { url: string };
      await addImageFromUrl(data.url);
      toast.success("Imagen agregada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <DrawerShell title="Imagen">
      <div className="mb-3 grid grid-cols-2 gap-1">
        <TabBtn active={tab === "properties"} onClick={() => setTab("properties")}>
          Mis propiedades
        </TabBtn>
        <TabBtn active={tab === "upload"} onClick={() => setTab("upload")}>
          Subir
        </TabBtn>
      </div>

      {tab === "upload" && (
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/15 bg-white/5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <Loader2 className="mb-2 h-5 w-5 animate-spin text-primary" />
          ) : (
            <ImagePlus className="mb-2 h-5 w-5 text-primary" />
          )}
          <p className="text-xs font-medium">
            {uploading ? "Subiendo..." : "Click o arrastra"}
          </p>
          <p className="mt-1 text-[10px] text-white/40">JPG / PNG · ≤15MB</p>
        </label>
      )}

      {tab === "properties" && (
        <div>
          {!props ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          ) : props.length === 0 ? (
            <p className="px-3 py-6 text-center text-[11px] text-white/50">
              Sin propiedades. Crea una en el CRM primero.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {props.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    p.photos[0] && addImageFromUrl(p.photos[0].url)
                  }
                  className="group relative aspect-square overflow-hidden rounded-md border border-white/10 bg-white/5 transition-colors hover:border-primary/40"
                >
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photos[0].url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-white/40">
                      Sin foto
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-[10px] text-white">
                    {p.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </DrawerShell>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
        active
          ? "border-primary/40 bg-primary/15 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
