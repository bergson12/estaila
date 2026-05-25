"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/lib/editor/store";
import {
  serializeCanvas,
  loadCanvas,
} from "@/lib/editor/fabric-init";

type Props = {
  initialJson: string;
  width: number;
  height: number;
};

export function FabricCanvas({ initialJson, width, height }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const setCanvas = useEditor((s) => s.setCanvas);
  const setSelectedIds = useEditor((s) => s.setSelectedIds);
  const pushHistory = useEditor((s) => s.pushHistory);
  const bump = useEditor((s) => s.bump);
  const setDirty = useEditor((s) => s.setDirty);

  useEffect(() => {
    let mounted = true;
    let cleanup = () => {};

    (async () => {
      // Lazy import Fabric (~150KB)
      const { Canvas } = await import("fabric");
      if (!mounted || !canvasElRef.current) return;

      const canvas = new Canvas(canvasElRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        selection: true,
      });

      // Fit to container — scale down if needed
      const fitToView = () => {
        const container = containerRef.current;
        if (!container) return;
        const padding = 48;
        const availW = container.clientWidth - padding;
        const availH = container.clientHeight - padding;
        const scale = Math.min(availW / width, availH / height, 1);
        const w = width * scale;
        const h = height * scale;
        // Visual size only — internal coordinates stay in design units
        const el = canvas.getElement();
        const wrap = el.parentElement;
        if (wrap) {
          wrap.style.width = `${w}px`;
          wrap.style.height = `${h}px`;
        }
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        const upper = wrap?.querySelector("canvas.upper-canvas") as
          | HTMLCanvasElement
          | null;
        if (upper) {
          upper.style.width = `${w}px`;
          upper.style.height = `${h}px`;
        }
      };
      fitToView();
      window.addEventListener("resize", fitToView);

      // Load initial state
      try {
        await loadCanvas(canvas, initialJson);
        fitToView();
      } catch (e) {
        console.error("[editor] failed to load JSON:", e);
      }

      // Initial history snapshot
      pushHistory(serializeCanvas(canvas));

      // ----- Selection sync -----
      const syncSelection = () => {
        const active = canvas.getActiveObjects();
        setSelectedIds(
          active.map((o) => (o as unknown as { id?: string }).id ?? "").filter(Boolean)
        );
        bump();
      };

      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", () => {
        setSelectedIds([]);
        bump();
      });

      // ----- History snapshot on every mutation -----
      const snapshot = () => {
        pushHistory(serializeCanvas(canvas));
        setDirty(true);
        bump();
      };
      canvas.on("object:added", snapshot);
      canvas.on("object:modified", snapshot);
      canvas.on("object:removed", snapshot);

      setCanvas(canvas);

      cleanup = () => {
        window.removeEventListener("resize", fitToView);
        canvas.dispose();
        setCanvas(null);
      };
    })();

    return () => {
      mounted = false;
      cleanup();
    };
    // Intentionally only run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#0B0B0F",
        backgroundImage:
          "linear-gradient(45deg, #1a1a22 25%, transparent 25%), linear-gradient(-45deg, #1a1a22 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a22 75%), linear-gradient(-45deg, transparent 75%, #1a1a22 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
      }}
    >
      <div className="relative shadow-2xl shadow-black/40">
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}
