"use client";

import { create } from "zustand";

/**
 * Estaila Editor — global state.
 *
 * Holds the Fabric canvas instance + UI flags + selection.
 * Mutations to actual canvas (add object, delete, etc.) happen against the
 * Fabric instance directly; we only mirror the bits the React UI needs to
 * render (selected object id, history pointer, dimensions, drawer open).
 */

import type { Canvas as FabricCanvas, Object as FabricObject } from "fabric";

export type DrawerKey =
  | null
  | "image"
  | "ai"
  | "text"
  | "elements"
  | "icons"
  | "brand"
  | "templates"
  | "background"
  | "size";

export type ExportFormat =
  | "SQUARE"
  | "STORY"
  | "LANDSCAPE"
  | "PORTRAIT"
  | "FLYER_A4"
  | "WHATSAPP"
  | "CUSTOM";

export const FORMAT_DIMENSIONS: Record<
  ExportFormat,
  { w: number; h: number; label: string }
> = {
  SQUARE: { w: 1080, h: 1080, label: "Cuadrado (Instagram Post)" },
  STORY: { w: 1080, h: 1920, label: "Story (Instagram / WhatsApp)" },
  LANDSCAPE: { w: 1200, h: 630, label: "Landscape (Facebook / OG)" },
  PORTRAIT: { w: 1080, h: 1350, label: "Portrait (Instagram tall)" },
  FLYER_A4: { w: 2480, h: 3508, label: "Flyer A4 imprimible" },
  WHATSAPP: { w: 1080, h: 1920, label: "WhatsApp Status" },
  CUSTOM: { w: 1080, h: 1080, label: "Personalizado" },
};

export type EditorState = {
  // Canvas instance (set by FabricCanvas once mounted)
  canvas: FabricCanvas | null;
  setCanvas: (c: FabricCanvas | null) => void;

  // Project metadata
  projectId: string | null;
  projectName: string;
  setProjectName: (n: string) => void;

  // Dimensions
  width: number;
  height: number;
  format: ExportFormat;
  setFormat: (f: ExportFormat) => void;
  setCustomSize: (w: number, h: number) => void;

  // Selection (object id list)
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;

  // Drawer
  drawer: DrawerKey;
  toggleDrawer: (key: DrawerKey) => void;

  // Layers panel
  layersOpen: boolean;
  toggleLayers: () => void;

  // History — separate stack of canvas JSON snapshots
  history: string[];
  historyIndex: number;
  pushHistory: (snapshot: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Dirty flag — true when there are unsaved changes
  dirty: boolean;
  setDirty: (v: boolean) => void;
  lastSavedAt: Date | null;
  markSaved: () => void;

  // Zoom (1 = 100%)
  zoom: number;
  setZoom: (z: number) => void;

  // Refresh tick — bump to force layers panel re-render
  tick: number;
  bump: () => void;
};

const MAX_HISTORY = 60;

export const useEditor = create<EditorState>((set, get) => ({
  canvas: null,
  setCanvas: (c) => set({ canvas: c }),

  projectId: null,
  projectName: "Proyecto sin título",
  setProjectName: (n) => set({ projectName: n, dirty: true }),

  width: 1080,
  height: 1080,
  format: "SQUARE",
  setFormat: (f) => {
    const dim = FORMAT_DIMENSIONS[f];
    const canvas = get().canvas;
    set({ format: f, width: dim.w, height: dim.h, dirty: true });
    if (canvas) {
      canvas.setDimensions({ width: dim.w, height: dim.h });
      canvas.renderAll();
    }
  },
  setCustomSize: (w, h) => {
    const canvas = get().canvas;
    set({ width: w, height: h, format: "CUSTOM", dirty: true });
    if (canvas) {
      canvas.setDimensions({ width: w, height: h });
      canvas.renderAll();
    }
  },

  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  drawer: null,
  toggleDrawer: (key) =>
    set((s) => ({ drawer: s.drawer === key ? null : key })),

  layersOpen: false,
  toggleLayers: () => set((s) => ({ layersOpen: !s.layersOpen })),

  history: [],
  historyIndex: -1,
  pushHistory: (snapshot) => {
    const { history, historyIndex } = get();
    // Drop everything after current index, then append
    const trimmed = history.slice(0, historyIndex + 1);
    const next = [...trimmed, snapshot].slice(-MAX_HISTORY);
    set({
      history: next,
      historyIndex: next.length - 1,
      dirty: true,
    });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex] ?? null;
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex] ?? null;
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  dirty: false,
  setDirty: (v) => set({ dirty: v }),
  lastSavedAt: null,
  markSaved: () => set({ dirty: false, lastSavedAt: new Date() }),

  zoom: 1,
  setZoom: (z) => {
    const canvas = get().canvas;
    const clamped = Math.max(0.1, Math.min(4, z));
    set({ zoom: clamped });
    if (canvas) {
      canvas.setZoom(clamped);
      canvas.renderAll();
    }
  },

  tick: 0,
  bump: () => set((s) => ({ tick: s.tick + 1 })),
}));

/** Cast helper for Fabric objects carrying a custom `id` field. */
export type EditorObject = FabricObject & { id?: string; name?: string };
