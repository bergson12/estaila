"use client";

import {
  Archive,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createMarketingKit,
  deleteMarketingKit,
  updateMarketingKit,
} from "@/lib/actions/marketing-kit";
import { cn } from "@/lib/utils";
import {
  AUDIENCE_OPTIONS,
  GOAL_OPTIONS,
  TONE_OPTIONS,
  audienceLabel,
  goalLabel,
  toneLabel,
  type Audience,
  type Goal,
  type Tone,
} from "./kit-meta";
import { KitEditorDialog } from "./kit-editor-dialog";

type Kit = {
  id: string;
  name: string;
  audience: string | null;
  tone: string | null;
  goal: string | null;
  angle: string | null;
  captions: string;
  hashtags: string;
  bios: string;
  pickedCaption: number | null;
  pickedBio: number | null;
  status: string;
  updatedAt: Date | string;
};

export function KitSection({
  propertyId,
  initialKits,
}: {
  propertyId: string;
  initialKits: Kit[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingKitId, setEditingKitId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<Audience>("GENERAL");
  const [tone, setTone] = useState<Tone>("ELEGANT");
  const [goal, setGoal] = useState<Goal>("VISIT");
  const [angle, setAngle] = useState("");

  function resetForm() {
    setName("");
    setAudience("GENERAL");
    setTone("ELEGANT");
    setGoal("VISIT");
    setAngle("");
  }

  function createKit() {
    startTransition(async () => {
      try {
        const res = await createMarketingKit({
          propertyId,
          name: name.trim() || undefined,
          audience,
          tone,
          goal,
          angle: angle.trim() || undefined,
        });
        toast.success("Kit creado ✨", {
          description: "Texto generado y guardado como borrador.",
        });
        resetForm();
        router.refresh();
        setEditingKitId(res.id);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function archiveKit(id: string) {
    startTransition(async () => {
      try {
        await updateMarketingKit(id, { status: "ARCHIVED" });
        toast.success("Kit archivado");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function activateKit(id: string) {
    startTransition(async () => {
      try {
        await updateMarketingKit(id, { status: "ACTIVE" });
        toast.success("Kit marcado como en uso");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function removeKit(id: string) {
    if (!confirm("¿Eliminar este kit?")) return;
    startTransition(async () => {
      try {
        await deleteMarketingKit(id);
        toast.success("Kit eliminado");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const activeKits = initialKits.filter((k) => k.status !== "ARCHIVED");
  const archivedKits = initialKits.filter((k) => k.status === "ARCHIVED");

  return (
    <div className="space-y-4">
      {/* CREATE FORM */}
      <Card className="rounded-2xl border-border p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-primary" />
          Nuevo kit de marketing
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Personaliza audiencia, tono y objetivo. La IA genera 3 captions, 18+
          hashtags y 3 bios. Se guarda como borrador editable.
        </p>

        <div className="space-y-3">
          <Field label="Nombre del kit (opcional)">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Q2 · Familias jóvenes"
              maxLength={80}
            />
          </Field>

          <Field label="Audiencia objetivo">
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCE_OPTIONS.map((o) => (
                <ChipButton
                  key={o.key}
                  active={audience === o.key}
                  onClick={() => setAudience(o.key)}
                  label={`${o.emoji} ${o.label}`}
                />
              ))}
            </div>
          </Field>

          <Field label="Tono / personalidad">
            <div className="flex flex-wrap gap-1.5">
              {TONE_OPTIONS.map((o) => (
                <ChipButton
                  key={o.key}
                  active={tone === o.key}
                  onClick={() => setTone(o.key)}
                  label={o.label}
                  hint={o.hint}
                />
              ))}
            </div>
          </Field>

          <Field label="Objetivo">
            <div className="flex flex-wrap gap-1.5">
              {GOAL_OPTIONS.map((o) => (
                <ChipButton
                  key={o.key}
                  active={goal === o.key}
                  onClick={() => setGoal(o.key)}
                  label={o.label}
                  hint={o.hint}
                />
              ))}
            </div>
          </Field>

          <Field label="Ángulo libre (opcional)">
            <Textarea
              rows={2}
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="Ej. recién remodelada, cerca de la playa, financiamiento bancario, precio negociable..."
              maxLength={400}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              La IA inyectará este ángulo como bullet destacado en captions y
              hashtags derivados.
            </p>
          </Field>

          <Button
            onClick={createKit}
            disabled={pending}
            className="w-full bg-gradient-to-r from-primary to-emerald-500"
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generar kit personalizado
          </Button>
        </div>
      </Card>

      {/* SAVED KITS */}
      {activeKits.length > 0 && (
        <Card className="rounded-2xl border-border p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Kits guardados ({activeKits.length})
            </h3>
            {archivedKits.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                + {archivedKits.length} archivados
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {activeKits.map((k) => (
              <KitRow
                key={k.id}
                kit={k}
                pending={pending}
                onOpen={() => setEditingKitId(k.id)}
                onActivate={() => activateKit(k.id)}
                onArchive={() => archiveKit(k.id)}
                onDelete={() => removeKit(k.id)}
              />
            ))}
          </ul>
        </Card>
      )}

      {/* Editor */}
      {editingKitId && (
        <KitEditorDialog
          open
          onOpenChange={(b) => !b && setEditingKitId(null)}
          kitId={editingKitId}
        />
      )}
    </div>
  );
}

// ============================================================
// KIT ROW
// ============================================================

function KitRow({
  kit,
  pending,
  onOpen,
  onActivate,
  onArchive,
  onDelete,
}: {
  kit: Kit;
  pending: boolean;
  onOpen: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  let captionCount = 0;
  let hashtagCount = 0;
  let bioCount = 0;
  try {
    captionCount = (JSON.parse(kit.captions) as string[]).length;
    hashtagCount = (JSON.parse(kit.hashtags) as string[]).length;
    bioCount = (JSON.parse(kit.bios) as string[]).length;
  } catch {}

  const isActive = kit.status === "ACTIVE";

  return (
    <li
      className={cn(
        "group rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-background",
        isActive && "border-emerald-500/30 bg-emerald-500/[0.04]"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{kit.name}</p>
            {isActive && (
              <Badge className="rounded-full bg-emerald-500/15 px-1.5 py-0 text-[9px] text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                En uso
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            {kit.audience && (
              <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5">
                {audienceLabel(kit.audience)}
              </span>
            )}
            {kit.tone && (
              <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5">
                {toneLabel(kit.tone)}
              </span>
            )}
            {kit.goal && (
              <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5">
                {goalLabel(kit.goal)}
              </span>
            )}
            <span className="font-mono tabular-nums text-muted-foreground/70">
              · {captionCount}c · {hashtagCount}# · {bioCount}b
            </span>
          </div>
          {kit.angle && (
            <p className="mt-1 truncate text-[10px] italic text-muted-foreground">
              &ldquo;{kit.angle}&rdquo;
            </p>
          )}
        </button>

        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onOpen}
            disabled={pending}
            aria-label="Editar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!isActive && (
            <button
              type="button"
              onClick={onActivate}
              disabled={pending}
              aria-label="Marcar en uso"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-emerald-500/15 hover:text-emerald-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onArchive}
            disabled={pending}
            aria-label="Archivar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label="Eliminar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
        active
          ? "border-ink bg-ink text-ink-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
