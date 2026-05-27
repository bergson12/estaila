"use client";

import {
  Check,
  Copy,
  Hash,
  Loader2,
  RefreshCw,
  Save,
  Star,
  StickyNote,
  Type,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getMarketingKit,
  regenerateMarketingKit,
  updateMarketingKit,
} from "@/lib/actions/marketing-kit";
import { cn } from "@/lib/utils";
import {
  AUDIENCE_OPTIONS,
  GOAL_OPTIONS,
  TONE_OPTIONS,
  type Audience,
  type Goal,
  type Tone,
} from "./kit-meta";

type Tab = "captions" | "hashtags" | "bios" | "config";

export function KitEditorDialog({
  open,
  onOpenChange,
  kitId,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  kitId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, startSave] = useTransition();
  const [regenerating, startRegen] = useTransition();
  const [tab, setTab] = useState<Tab>("captions");

  const [name, setName] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [bios, setBios] = useState<string[]>([]);
  const [pickedCaption, setPickedCaption] = useState<number | null>(null);
  const [pickedBio, setPickedBio] = useState<number | null>(null);

  // Params (for regenerate)
  const [audience, setAudience] = useState<Audience>("GENERAL");
  const [tone, setTone] = useState<Tone>("ELEGANT");
  const [goal, setGoal] = useState<Goal>("VISIT");
  const [angle, setAngle] = useState("");

  // ----------------------------------------------------------
  // Load kit
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open || !kitId) return;
    setLoading(true);
    getMarketingKit(kitId)
      .then((k) => {
        setName(k.name);
        try {
          setCaptions(JSON.parse(k.captions));
        } catch {
          setCaptions([]);
        }
        try {
          setHashtags(JSON.parse(k.hashtags));
        } catch {
          setHashtags([]);
        }
        try {
          setBios(JSON.parse(k.bios));
        } catch {
          setBios([]);
        }
        setPickedCaption(k.pickedCaption ?? null);
        setPickedBio(k.pickedBio ?? null);
        setAudience((k.audience as Audience) ?? "GENERAL");
        setTone((k.tone as Tone) ?? "ELEGANT");
        setGoal((k.goal as Goal) ?? "VISIT");
        setAngle(k.angle ?? "");
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, kitId]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  }

  function save() {
    startSave(async () => {
      try {
        await updateMarketingKit(kitId, {
          name: name.trim() || undefined,
          captions,
          hashtags,
          bios,
          pickedCaption,
          pickedBio,
        });
        toast.success("Cambios guardados");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function regenerate() {
    if (!confirm("Esto reemplazará los textos generados. ¿Continuar?")) return;
    startRegen(async () => {
      try {
        await regenerateMarketingKit(kitId, {
          audience,
          tone,
          goal,
          angle: angle.trim() || undefined,
        });
        // Re-load
        const k = await getMarketingKit(kitId);
        try {
          setCaptions(JSON.parse(k.captions));
        } catch {}
        try {
          setHashtags(JSON.parse(k.hashtags));
        } catch {}
        try {
          setBios(JSON.parse(k.bios));
        } catch {}
        setPickedCaption(null);
        setPickedBio(null);
        toast.success("Regenerado con nuevos params ✨");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border bg-card/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <StickyNote className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del kit"
              className="h-8 max-w-md border-0 bg-transparent text-base font-semibold focus-visible:ring-0"
            />
          </DialogTitle>
          <DialogDescription className="sr-only">
            Editor de kit de marketing
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border bg-card/30 px-3">
          <TabButton
            active={tab === "captions"}
            onClick={() => setTab("captions")}
            icon={Type}
            label="Captions"
            count={captions.length}
          />
          <TabButton
            active={tab === "hashtags"}
            onClick={() => setTab("hashtags")}
            icon={Hash}
            label="Hashtags"
            count={hashtags.length}
          />
          <TabButton
            active={tab === "bios"}
            onClick={() => setTab("bios")}
            icon={StickyNote}
            label="Bios"
            count={bios.length}
          />
          <TabButton
            active={tab === "config"}
            onClick={() => setTab("config")}
            icon={RefreshCw}
            label="Regenerar"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando kit...
            </div>
          ) : (
            <>
              {tab === "captions" && (
                <VariantList
                  items={captions}
                  picked={pickedCaption}
                  onChange={setCaptions}
                  onPick={setPickedCaption}
                  onCopy={copyText}
                  rows={9}
                  placeholder="Caption..."
                />
              )}
              {tab === "bios" && (
                <VariantList
                  items={bios}
                  picked={pickedBio}
                  onChange={setBios}
                  onPick={setPickedBio}
                  onCopy={copyText}
                  rows={4}
                  placeholder="Bio..."
                />
              )}
              {tab === "hashtags" && (
                <HashtagsEditor
                  items={hashtags}
                  onChange={setHashtags}
                  onCopy={copyText}
                />
              )}
              {tab === "config" && (
                <ConfigForm
                  audience={audience}
                  tone={tone}
                  goal={goal}
                  angle={angle}
                  setAudience={setAudience}
                  setTone={setTone}
                  setGoal={setGoal}
                  setAngle={setAngle}
                  onRegenerate={regenerate}
                  regenerating={regenerating}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-card/40 px-6 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={save} disabled={saving || loading} variant="ink">
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// VARIANT LIST (captions / bios)
// ============================================================

function VariantList({
  items,
  picked,
  onChange,
  onPick,
  onCopy,
  rows,
  placeholder,
}: {
  items: string[];
  picked: number | null;
  onChange: (next: string[]) => void;
  onPick: (idx: number | null) => void;
  onCopy: (text: string) => void;
  rows: number;
  placeholder: string;
}) {
  function update(idx: number, value: string) {
    const next = [...items];
    next[idx] = value;
    onChange(next);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
        Sin variantes. Ve a la pestaña &quot;Regenerar&quot; para generar
        nuevas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((text, i) => {
        const isPicked = picked === i;
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border border-border bg-background/40 p-3 transition-colors",
              isPicked && "border-amber-500/40 bg-amber-500/[0.04]"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Variante {i + 1}
                {isPicked && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    FAVORITO
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPick(isPicked ? null : i)}
                  aria-label="Marcar favorito"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    isPicked
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Star
                    className={cn("h-3.5 w-3.5", isPicked && "fill-current")}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(text)}
                  aria-label="Copiar"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Textarea
              value={text}
              onChange={(e) => update(i, e.target.value)}
              rows={rows}
              placeholder={placeholder}
              className="font-mono text-xs leading-relaxed"
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// HASHTAGS EDITOR — chips with add/remove
// ============================================================

function HashtagsEditor({
  items,
  onChange,
  onCopy,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  onCopy: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim().replace(/^#?/, "#");
    if (!v || v.length < 2) return;
    if (items.includes(v)) {
      toast.message("Ya existe ese hashtag");
      return;
    }
    onChange([...items, v]);
    setDraft("");
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  const allString = items.join(" ");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="#agregarNuevo"
          maxLength={60}
        />
        <Button variant="outline" size="sm" onClick={add}>
          Agregar
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
          Sin hashtags.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {items.map((h, i) => (
              <span
                key={`${h}-${i}`}
                className="group inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
              >
                {h}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Texto plano (copiar todo)
            </p>
            <div className="flex items-start gap-2">
              <code className="flex-1 break-all text-[11px] leading-relaxed">
                {allString}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(allString)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// CONFIG FORM — regenerate with new params
// ============================================================

function ConfigForm({
  audience,
  tone,
  goal,
  angle,
  setAudience,
  setTone,
  setGoal,
  setAngle,
  onRegenerate,
  regenerating,
}: {
  audience: Audience;
  tone: Tone;
  goal: Goal;
  angle: string;
  setAudience: (v: Audience) => void;
  setTone: (v: Tone) => void;
  setGoal: (v: Goal) => void;
  setAngle: (v: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-amber-700 dark:text-amber-400">
        ⚠️ Regenerar reemplazará los captions, hashtags y bios actuales. Los
        cambios manuales se perderán.
      </p>

      <Field label="Audiencia objetivo">
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCE_OPTIONS.map((o) => (
            <ChipButton
              key={o.key}
              active={audience === o.key}
              onClick={() => setAudience(o.key)}
              label={o.label}
            />
          ))}
        </div>
      </Field>

      <Field label="Tono">
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

      <Field label="Ángulo libre">
        <Textarea
          rows={3}
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="Ej. recién remodelada, cerca de la playa..."
          maxLength={400}
        />
      </Field>

      <Button
        onClick={onRegenerate}
        disabled={regenerating}
        variant="ink"
        size="lg"
        className="w-full"
      >
        {regenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Regenerar con estos params
      </Button>
    </div>
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

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Hash;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
      {count != null && (
        <span className="font-mono tabular-nums text-muted-foreground/70">
          · {count}
        </span>
      )}
      {active && (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
