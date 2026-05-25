"use client";

/**
 * Global hotkey listener for the editor canvas.
 *
 * Lives inside the editor route and listens for keyboard shortcuts as long as
 * the user isn't typing in an input/textarea/contentEditable.
 */

import { useHotkeys } from "react-hotkeys-hook";
import { useEditor } from "@/lib/editor/store";
import { loadCanvas } from "@/lib/editor/fabric-init";

export function EditorHotkeys({ onSave }: { onSave: () => void }) {
  const canvas = useEditor((s) => s.canvas);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const toggleDrawer = useEditor((s) => s.toggleDrawer);

  useHotkeys(
    "mod+z",
    (e) => {
      e.preventDefault();
      if (!canvas) return;
      const snap = undo();
      if (snap) void loadCanvas(canvas, snap);
    },
    { preventDefault: true, enableOnFormTags: false }
  );

  useHotkeys(
    "mod+shift+z, mod+y",
    (e) => {
      e.preventDefault();
      if (!canvas) return;
      const snap = redo();
      if (snap) void loadCanvas(canvas, snap);
    },
    { preventDefault: true, enableOnFormTags: false }
  );

  useHotkeys(
    "mod+s",
    (e) => {
      e.preventDefault();
      onSave();
    },
    { preventDefault: true, enableOnFormTags: false }
  );

  useHotkeys(
    "mod+d",
    async (e) => {
      e.preventDefault();
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (!active) return;
      const cloned = await active.clone(["id", "kind", "name"] as never);
      const c = cloned as unknown as { left: number; top: number; id?: string };
      c.left = (active.left ?? 0) + 20;
      c.top = (active.top ?? 0) + 20;
      c.id = `dup-${Date.now()}`;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    },
    { preventDefault: true, enableOnFormTags: false }
  );

  useHotkeys(
    "delete, backspace",
    (e) => {
      if (!canvas) return;
      const active = canvas.getActiveObjects();
      if (active.length === 0) return;
      e.preventDefault();
      active.forEach((o) => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    { preventDefault: true, enableOnFormTags: false }
  );

  useHotkeys(
    "t",
    () => toggleDrawer("text"),
    { enableOnFormTags: false }
  );
  useHotkeys(
    "i",
    () => toggleDrawer("image"),
    { enableOnFormTags: false }
  );
  useHotkeys(
    "a",
    () => toggleDrawer("ai"),
    { enableOnFormTags: false }
  );
  useHotkeys(
    "e",
    () => toggleDrawer("elements"),
    { enableOnFormTags: false }
  );

  return null;
}
