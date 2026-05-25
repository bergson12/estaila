"use client";

/**
 * Polotno-powered editor wrapper.
 *
 * Polotno is a Canva-style design SDK (templates, text, images, shapes,
 * layers, export). We persist the entire store JSON in EditorProject.canvasData
 * and load it back on mount.
 *
 * Free public demo key is used here. For production use, register at
 * https://polotno.com to get a private key (still free for self-host).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { createStore } from "polotno/model/store";
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from "polotno";
import { Workspace } from "polotno/canvas/workspace";
import { Toolbar } from "polotno/toolbar/toolbar";
import { ZoomButtons } from "polotno/toolbar/zoom-buttons";
import { PagesTimeline } from "polotno/pages-timeline";
import { SidePanel } from "polotno/side-panel";

import { saveProject } from "@/lib/actions/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Public demo key — replace with your own from polotno.com for production
const POLOTNO_KEY = "nFA5H9elEytDyPyvKL7T";

type Props = {
  projectId: string;
  initialName: string;
  canvasData: string;
  width: number;
  height: number;
};

export function PolotnoEditor({
  projectId,
  initialName,
  canvasData,
  width,
  height,
}: Props) {
  const router = useRouter();
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [ready, setReady] = useState(false);

  // Initialize store once
  if (!storeRef.current) {
    storeRef.current = createStore({
      key: POLOTNO_KEY,
      showCredit: false,
    });
  }
  const store = storeRef.current;

  // Load saved state once
  useEffect(() => {
    if (!store) return;
    try {
      const parsed = JSON.parse(canvasData);
      // If the legacy Fabric JSON doesn't have a "pages" array (Polotno format),
      // create a fresh page with our dimensions instead.
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        store.loadJSON(parsed);
      } else {
        store.setSize(width, height);
        store.addPage();
      }
    } catch {
      store.setSize(width, height);
      store.addPage();
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark dirty whenever the store changes
  useEffect(() => {
    if (!store) return;
    const unsub = store.on("change", () => setDirty(true));
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [store]);

  // Autosave every 45s when dirty
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      void save();
    }, 45_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  async function save() {
    if (!store || saving) return;
    setSaving(true);
    try {
      const json = JSON.stringify(store.toJSON());
      const thumbnail = await store.toDataURL({
        pixelRatio: 0.25,
        mimeType: "image/jpeg",
      });
      const firstPage = store.pages[0];
      const pageW =
        typeof firstPage?.width === "number" ? firstPage.width : width;
      const pageH =
        typeof firstPage?.height === "number" ? firstPage.height : height;
      await saveProject(projectId, {
        name,
        canvasData: json,
        thumbnail,
        width: pageW,
        height: pageH,
      });
      setDirty(false);
    } catch (e) {
      toast.error((e as Error).message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-background">
      {/* Topbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/studio/editor"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="h-8 w-64 text-sm"
            placeholder="Nombre del proyecto"
          />
          <span className="hidden text-[11px] text-muted-foreground md:inline">
            {saving
              ? "Guardando..."
              : dirty
                ? "Cambios sin guardar"
                : "Todo guardado"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={save}
            disabled={saving || !ready}
            size="sm"
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Guardar
          </Button>
        </div>
      </header>

      {/* Polotno workspace */}
      <div className="flex-1 overflow-hidden">
        {!ready ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <PolotnoContainer style={{ width: "100%", height: "100%" }}>
            <SidePanelWrap>
              <SidePanel store={store} />
            </SidePanelWrap>
            <WorkspaceWrap>
              <Toolbar store={store} downloadButtonEnabled />
              <Workspace store={store} />
              <ZoomButtons store={store} />
              <PagesTimeline store={store} />
            </WorkspaceWrap>
          </PolotnoContainer>
        )}
      </div>
    </div>
  );
}
