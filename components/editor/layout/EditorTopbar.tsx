"use client";

import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { loadCanvas, serializeCanvas } from "@/lib/editor/fabric-init";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameProject, saveProject } from "@/lib/actions/editor";
import { cn } from "@/lib/utils";

export function EditorTopbar({
  projectId,
  onExport,
}: {
  projectId: string;
  onExport: () => void;
}) {
  const canvas = useEditor((s) => s.canvas);
  const projectName = useEditor((s) => s.projectName);
  const setProjectName = useEditor((s) => s.setProjectName);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.canUndo());
  const canRedo = useEditor((s) => s.canRedo());
  const dirty = useEditor((s) => s.dirty);
  const lastSavedAt = useEditor((s) => s.lastSavedAt);
  const markSaved = useEditor((s) => s.markSaved);
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const format = useEditor((s) => s.format);

  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  // Autosave every 30s when dirty
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      void save();
    }, 30_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  async function save() {
    if (!canvas) return;
    setSaving(true);
    try {
      const canvasData = serializeCanvas(canvas);
      const thumbnail = canvas.toDataURL({
        format: "jpeg",
        quality: 0.6,
        multiplier: 0.25,
      });
      await saveProject(projectId, {
        name: projectName,
        canvasData,
        thumbnail,
        width,
        height,
        format,
      });
      markSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (!canvas) return;
    const snapshot = undo();
    if (snapshot) void loadCanvas(canvas, snapshot);
  }

  function handleRedo() {
    if (!canvas) return;
    const snapshot = redo();
    if (snapshot) void loadCanvas(canvas, snapshot);
  }

  async function commitName() {
    setEditingName(false);
    if (projectName.trim()) {
      try {
        await renameProject(projectId, projectName.trim());
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  }

  const savedLabel =
    saving ? "Guardando..." : dirty ? "Cambios sin guardar" : lastSavedAt ? `Guardado ${formatRelTime(lastSavedAt)}` : "—";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a0f] px-3 text-white">
      <div className="flex items-center gap-2">
        <Link
          href="/studio/editor"
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {editingName ? (
          <Input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="h-8 max-w-[260px] border-white/10 bg-white/5 text-sm text-white"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="rounded-md px-2 py-1 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            {projectName}
          </button>
        )}

        <span className="hidden text-[11px] text-white/40 md:inline">·</span>
        <span className="hidden text-[11px] text-white/40 md:inline">
          {savedLabel}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ToolbarBtn
          icon={<Undo2 className="h-3.5 w-3.5" />}
          label="Deshacer (Cmd+Z)"
          onClick={handleUndo}
          disabled={!canUndo}
        />
        <ToolbarBtn
          icon={<Redo2 className="h-3.5 w-3.5" />}
          label="Rehacer (Cmd+Shift+Z)"
          onClick={handleRedo}
          disabled={!canRedo}
        />
        <div className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarBtn
          icon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          label="Guardar (Cmd+S)"
          onClick={save}
          disabled={saving}
        />
        <Button
          size="sm"
          onClick={onExport}
          className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar
        </Button>
      </div>
    </header>
  );
}

function ToolbarBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        "text-white/70 hover:bg-white/10 hover:text-white",
        "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white/70"
      )}
    >
      {icon}
    </button>
  );
}

function formatRelTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 5_000) return "ahora";
  if (diff < 60_000) return `${Math.round(diff / 1000)}s atrás`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m atrás`;
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

// Saved indicator (lint-suppress unused Check import)
export const _CheckRef = Check;
