"use client";

import { Eye, EyeOff, Image as ImageIcon, Lock, Trash2, Type, Square, Layers } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { listLayers } from "@/lib/editor/fabric-init";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const canvas = useEditor((s) => s.canvas);
  const selectedIds = useEditor((s) => s.selectedIds);
  const open = useEditor((s) => s.layersOpen);
  const toggle = useEditor((s) => s.toggleLayers);
  // re-render on bump
  useEditor((s) => s.tick);

  const layers = canvas ? listLayers(canvas).reverse() : [];

  return (
    <div className="flex shrink-0 flex-col border-t border-white/10 bg-[#15151B] text-white">
      <button
        onClick={toggle}
        className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/5"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="h-3 w-3" />
          Capas ({layers.length})
        </span>
        <span className="text-[10px]">{open ? "▼" : "▲"}</span>
      </button>
      {open && (
        <ul className="max-h-40 overflow-y-auto p-1">
          {layers.length === 0 && (
            <li className="px-3 py-4 text-center text-[11px] text-white/40">
              Sin capas. Agrega texto, imagen o forma desde la barra izquierda.
            </li>
          )}
          {layers.map((obj) => {
            const meta = obj as unknown as {
              id?: string;
              kind?: string;
              name?: string;
              visible?: boolean;
              evented?: boolean;
            };
            const id = meta.id ?? "";
            const active = selectedIds.includes(id);
            const Icon = pickIcon(meta.kind);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!canvas) return;
                    canvas.setActiveObject(obj);
                    canvas.renderAll();
                  }}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "bg-primary/15 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">
                    {meta.name ?? meta.kind ?? "Capa"}
                  </span>
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <Mini
                      onClick={(e) => {
                        e.stopPropagation();
                        obj.set("visible", !meta.visible);
                        canvas?.renderAll();
                      }}
                      icon={meta.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    />
                    <Mini
                      onClick={(e) => {
                        e.stopPropagation();
                        canvas?.remove(obj);
                      }}
                      icon={<Trash2 className="h-3 w-3" />}
                      destructive
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function pickIcon(kind?: string): typeof ImageIcon {
  if (kind === "text") return Type;
  if (kind === "image") return ImageIcon;
  return Square;
}

function Mini({
  icon,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded text-white/60 transition-colors",
        destructive ? "hover:bg-red-500/20 hover:text-red-400" : "hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
    </button>
  );
}

// Lock import kept for future feature
export const _LockRef = Lock;
