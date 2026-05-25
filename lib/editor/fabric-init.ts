"use client";

/**
 * Fabric.js helpers — wrappers around creating typed objects with stable IDs
 * and keeping them in sync with our editor store.
 */

import type {
  Canvas as FabricCanvas,
  Object as FabricObject,
  FabricImage,
  Textbox,
  Rect,
  Circle,
  Group,
} from "fabric";

export type LayerKind =
  | "image"
  | "text"
  | "rect"
  | "circle"
  | "shape"
  | "icon"
  | "badge"
  | "group";

const ID_PREFIX: Record<LayerKind, string> = {
  image: "img",
  text: "txt",
  rect: "rect",
  circle: "circ",
  shape: "shp",
  icon: "icn",
  badge: "bdg",
  group: "grp",
};

let counter = 0;
export function genId(kind: LayerKind): string {
  counter += 1;
  return `${ID_PREFIX[kind]}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Tag a Fabric object with our metadata. */
export function tag<T extends FabricObject>(
  obj: T,
  kind: LayerKind,
  name?: string
): T & { id: string; kind: LayerKind; name: string } {
  const id = genId(kind);
  Object.assign(obj, { id, kind, name: name ?? defaultName(kind) });
  return obj as T & { id: string; kind: LayerKind; name: string };
}

function defaultName(kind: LayerKind): string {
  return (
    {
      image: "Imagen",
      text: "Texto",
      rect: "Rectángulo",
      circle: "Círculo",
      shape: "Forma",
      icon: "Ícono",
      badge: "Badge",
      group: "Grupo",
    } as const
  )[kind];
}

/** Center the object on the current canvas. */
export function centerObject(canvas: FabricCanvas, obj: FabricObject): void {
  canvas.centerObject(obj);
  canvas.setActiveObject(obj);
  canvas.renderAll();
}

/** Serialize canvas to JSON string (with our id/kind props). */
export function serializeCanvas(canvas: FabricCanvas): string {
  // Fabric v6 toJSON accepts optional propertiesToInclude as a second arg through
  // the prototype but the typings disagree — cast to bypass.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return JSON.stringify((canvas as any).toJSON(["id", "kind", "name"]));
}

/** Restore canvas from JSON. Returns a promise. */
export async function loadCanvas(
  canvas: FabricCanvas,
  json: string
): Promise<void> {
  await canvas.loadFromJSON(json);
  canvas.renderAll();
}

/** Get all top-level objects (no controls/grid). */
export function listLayers(canvas: FabricCanvas): FabricObject[] {
  return canvas
    .getObjects()
    .filter((o) => !(o as unknown as { _internal?: boolean })._internal);
}

export type {
  FabricCanvas,
  FabricObject,
  FabricImage,
  Textbox,
  Rect,
  Circle,
  Group,
};
