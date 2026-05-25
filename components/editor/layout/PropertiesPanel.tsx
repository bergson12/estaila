"use client";

import { Copy, Lock, Move, RotateCw, Trash2 } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

export function PropertiesPanel() {
  const canvas = useEditor((s) => s.canvas);
  const selectedIds = useEditor((s) => s.selectedIds);
  const bump = useEditor((s) => s.bump);
  // re-render on bump
  useEditor((s) => s.tick);

  const active = canvas?.getActiveObject() ?? null;

  if (!active || selectedIds.length === 0) {
    return (
      <aside className="flex h-full w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-[#15151B] p-4 text-white">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <Move className="mx-auto mb-2 h-5 w-5 text-white/40" />
          <p className="text-xs font-medium text-white/80">Sin selección</p>
          <p className="mt-1 text-[11px] text-white/50">
            Click un elemento del canvas o agrega uno desde la barra izquierda.
          </p>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Atajos
        </p>
        <ul className="space-y-0.5 text-[11px] text-white/60">
          <li>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              Cmd+Z
            </kbd>{" "}
            Deshacer
          </li>
          <li>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              Cmd+S
            </kbd>{" "}
            Guardar
          </li>
          <li>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              Del
            </kbd>{" "}
            Eliminar capa
          </li>
          <li>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              Cmd+D
            </kbd>{" "}
            Duplicar
          </li>
        </ul>
      </aside>
    );
  }

  const meta = active as unknown as {
    kind?: string;
    name?: string;
  };
  const isText = active.type === "Textbox" || active.type === "IText" || meta.kind === "text";
  const isImage = active.type === "Image" || meta.kind === "image";

  const update = (patch: Record<string, unknown>) => {
    Object.entries(patch).forEach(([k, v]) => active.set(k as never, v as never));
    canvas?.renderAll();
    canvas?.fire("object:modified", { target: active });
    bump();
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-[#15151B] text-white">
      {/* Action row */}
      <div className="flex items-center justify-between gap-1 border-b border-white/10 p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {meta.kind ?? active.type}
        </p>
        <div className="flex items-center gap-0.5">
          <ActionBtn
            icon={<Copy className="h-3 w-3" />}
            title="Duplicar"
            onClick={async () => {
              if (!canvas || !active) return;
              const cloned = await active.clone(["id", "kind", "name"] as never);
              const c = cloned as unknown as {
                left: number;
                top: number;
                id?: string;
              };
              c.left = (active.left ?? 0) + 20;
              c.top = (active.top ?? 0) + 20;
              c.id = `${meta.kind ?? "obj"}-${Date.now()}`;
              canvas.add(cloned);
              canvas.setActiveObject(cloned);
              canvas.renderAll();
            }}
          />
          <ActionBtn
            icon={<Trash2 className="h-3 w-3" />}
            title="Eliminar"
            destructive
            onClick={() => canvas && active && canvas.remove(active)}
          />
        </div>
      </div>

      {/* Position + size */}
      <Section title="Posición y tamaño">
        <div className="grid grid-cols-2 gap-1.5">
          <NumberField
            label="X"
            value={Math.round(active.left ?? 0)}
            onChange={(v) => update({ left: v })}
          />
          <NumberField
            label="Y"
            value={Math.round(active.top ?? 0)}
            onChange={(v) => update({ top: v })}
          />
          <NumberField
            label="W"
            value={Math.round((active.width ?? 0) * (active.scaleX ?? 1))}
            onChange={(v) => {
              const ratio = v / (active.width ?? 1);
              update({ scaleX: ratio });
            }}
          />
          <NumberField
            label="H"
            value={Math.round((active.height ?? 0) * (active.scaleY ?? 1))}
            onChange={(v) => {
              const ratio = v / (active.height ?? 1);
              update({ scaleY: ratio });
            }}
          />
        </div>
        <SliderField
          label="Rotación"
          icon={<RotateCw className="h-3 w-3" />}
          min={-180}
          max={180}
          value={active.angle ?? 0}
          onChange={(v) => update({ angle: v })}
          suffix="°"
        />
      </Section>

      {/* Apariencia */}
      <Section title="Apariencia">
        <SliderField
          label="Opacidad"
          min={0}
          max={1}
          step={0.05}
          value={active.opacity ?? 1}
          onChange={(v) => update({ opacity: v })}
        />
        {isText && (
          <>
            <NumberField
              label="Tamaño"
              value={
                (active as unknown as { fontSize?: number }).fontSize ?? 16
              }
              onChange={(v) => update({ fontSize: v })}
            />
            <ColorField
              label="Color"
              value={(active.fill as string) ?? "#000000"}
              onChange={(v) => update({ fill: v })}
            />
            <div className="grid grid-cols-3 gap-1">
              {[400, 600, 800].map((w) => (
                <button
                  key={w}
                  className={cn(
                    "rounded border px-2 py-1 text-[10px] transition-colors",
                    (active as unknown as { fontWeight?: number }).fontWeight === w
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  )}
                  onClick={() => update({ fontWeight: w })}
                  style={{ fontWeight: w }}
                >
                  {w === 400 ? "Light" : w === 600 ? "Bold" : "Black"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right"] as const).map((al) => (
                <button
                  key={al}
                  className={cn(
                    "rounded border px-2 py-1 text-[10px] transition-colors",
                    (active as unknown as { textAlign?: string }).textAlign === al
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  )}
                  onClick={() => update({ textAlign: al })}
                >
                  {al === "left" ? "Izq" : al === "center" ? "Centro" : "Der"}
                </button>
              ))}
            </div>
          </>
        )}
        {!isText && !isImage && (
          <ColorField
            label="Relleno"
            value={(active.fill as string) ?? "#000000"}
            onChange={(v) => update({ fill: v })}
          />
        )}
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-[10px] text-white/60">
      <span className="mb-0.5 inline-block">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-primary/40"
      />
    </label>
  );
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  icon,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[10px] text-white/60">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-mono tabular-nums">
          {step != null && step < 1 ? value.toFixed(2) : Math.round(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 inline-block text-[10px] text-white/60">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value === "transparent" ? "#000000" : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-primary/40"
        />
      </div>
    </label>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-white/60 transition-colors",
        destructive
          ? "hover:bg-red-500/20 hover:text-red-400"
          : "hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
    </button>
  );
}

// Reserve future
export const _LockRef = Lock;
