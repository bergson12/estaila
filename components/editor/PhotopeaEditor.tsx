"use client";

/**
 * Photopea-powered editor.
 *
 * Embeds the Photopea iframe (Photoshop-online, free, no React deps so it
 * works regardless of our React version). Communicates via postMessage:
 *  - Load: pass image URL via the URL fragment config.
 *  - Save: send a JS string via postMessage("...", "*"), Photopea evals it
 *    and replies with the bytes / status as messages.
 *
 * https://www.photopea.com/learn/api
 */

import { ArrowLeft, Download, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveProject } from "@/lib/actions/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  projectId: string;
  initialName: string;
  initialImageUrl?: string | null;
  /** Saved Photopea PSD bytes (base64) — restored on next load */
  canvasData: string;
};

function buildConfig(imageUrl: string | undefined): string {
  const config = {
    files: imageUrl ? [imageUrl] : [],
    environment: {
      localsave: false,
      customIO: {
        save: "app.activeDocument.saveToOE('png')",
      },
      theme: "dark",
      menus: [
        // Hide menus we don't need (helps focus the agent)
        [1, [], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
      ],
      vmode: 0,
      intro: false,
      eparams: { guides: true, grid: false, gsize: 32 },
    },
    server: {
      version: 1,
      url: "//localhost:8000/save",
      formats: ["psd:true", "png:true", "jpg:true"],
    },
  };
  return "#" + encodeURIComponent(JSON.stringify(config));
}

export function PhotopeaEditor({
  projectId,
  initialName,
  initialImageUrl,
  canvasData,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  // We use a tiny pending-export state to bridge postMessage → toast.
  const pendingExportRef = useRef<((data: ArrayBuffer | null) => void) | null>(null);

  const startImage = initialImageUrl ?? extractInitialImage(canvasData);
  const src = `https://www.photopea.com${buildConfig(startImage ?? undefined)}`;

  // Listen for messages from the iframe (Photopea sends "done" when ready, +
  // ArrayBuffer when we ask for export bytes).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;

      if (typeof e.data === "string") {
        if (e.data === "done") {
          setReady(true);
        }
      } else if (e.data instanceof ArrayBuffer) {
        // Got export bytes
        if (pendingExportRef.current) {
          pendingExportRef.current(e.data);
          pendingExportRef.current = null;
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function exportPng(): Promise<ArrayBuffer | null> {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return null;
    return new Promise((resolve) => {
      pendingExportRef.current = resolve;
      iframe.contentWindow!.postMessage(
        `app.activeDocument.saveToOE("png");`,
        "*"
      );
      // Timeout fallback
      setTimeout(() => {
        if (pendingExportRef.current) {
          pendingExportRef.current(null);
          pendingExportRef.current = null;
        }
      }, 10_000);
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      // Generate a small thumbnail by asking Photopea for PNG bytes
      const bytes = await exportPng();
      let thumbnail: string | undefined;
      if (bytes) {
        const blob = new Blob([bytes], { type: "image/png" });
        thumbnail = await blobToDataURL(blob);
      }
      // We store the source URL as canvasData so on reload we re-open with it.
      await saveProject(projectId, {
        name,
        canvasData: JSON.stringify({ image: startImage ?? null }),
        thumbnail,
      });
      toast.success("Guardado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function downloadPng() {
    setExportingPng(true);
    try {
      const bytes = await exportPng();
      if (!bytes) {
        toast.error("No se pudo exportar");
        return;
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "estaila"}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PNG descargado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportingPng(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-background">
      {/* Topbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/studio/editor"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 max-w-[260px] text-sm"
            placeholder="Nombre del proyecto"
          />
          {!ready && (
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground md:flex">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando Photopea...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPng}
            disabled={!ready || exportingPng}
          >
            {exportingPng ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            PNG
          </Button>
          <Button onClick={save} size="sm" disabled={saving || !ready}>
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Guardar
          </Button>
        </div>
      </header>

      <iframe
        ref={iframeRef}
        src={src}
        className="flex-1 border-0"
        allow="clipboard-write"
      />
    </div>
  );
}

function extractInitialImage(canvasData: string): string | null {
  try {
    const parsed = JSON.parse(canvasData);
    if (parsed?.image && typeof parsed.image === "string") return parsed.image;
    return null;
  } catch {
    return null;
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
