"use client";

/**
 * NewsletterStudio — unified Email Marketing + Newsletter module.
 *
 * List of campaigns (drafts + sent) → composer with:
 *  - settings (name, type campaign/newsletter, subject, template variant, audience, property)
 *  - content editor: BLOCKS (visual) | HTML (raw)
 *  - live email preview (iframe via previewCampaign)
 *  - save / test / send (sendCampaign)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Code2,
  Copy,
  Eye,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  Mail,
  Minus,
  MousePointerClick,
  Newspaper,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Type,
  Users,
  Heading,
  Loader2,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HtmlCodeEditor } from "@/components/marketing/html-code-editor";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { labelFor, CONTACT_TYPES } from "@/lib/constants";
import type { EmailAudienceContact } from "@/lib/actions/email";
import {
  saveCampaign,
  sendCampaign,
  deleteCampaign,
  duplicateCampaign,
  getCampaign,
  previewCampaign,
  type CampaignListItem,
} from "@/lib/actions/email-campaign";

type Property = { id: string; title: string };
type Variant = "MINIMAL" | "EDITORIAL";
type EditorMode = "BLOCKS" | "HTML";
type CampaignType = "CAMPAIGN" | "NEWSLETTER";

// ============================================================
// BLOCKS
// ============================================================

type Block =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; url: string; alt: string }
  | { id: string; type: "button"; label: string; url: string }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer"; size: number };

let _bid = 0;
function newId() {
  _bid += 1;
  return `b${_bid}_${_bid * 7}`;
}

function makeBlock(type: Block["type"]): Block {
  switch (type) {
    case "heading":
      return { id: newId(), type, text: "Título de sección" };
    case "text":
      return {
        id: newId(),
        type,
        text: "Escribe aquí tu mensaje. Puedes usar varios párrafos separados por una línea en blanco.",
      };
    case "image":
      return { id: newId(), type, url: "", alt: "" };
    case "button":
      return { id: newId(), type, label: "Ver más", url: "https://" };
    case "divider":
      return { id: newId(), type };
    case "spacer":
      return { id: newId(), type, size: 24 };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const GREEN = "#00bf63";

function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `<h2 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.25;color:#0a0a0a;">${escapeHtml(b.text)}</h2>`;
        case "text":
          return b.text
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map(
              (p) =>
                `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#0a0a0a;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
            )
            .join("");
        case "image":
          return b.url
            ? `<img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.alt)}" style="display:block;width:100%;height:auto;border-radius:8px;margin:0 0 14px;" />`
            : "";
        case "button":
          return `<div style="margin:6px 0 16px;"><a href="${escapeHtml(b.url)}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px;">${escapeHtml(b.label)}</a></div>`;
        case "divider":
          return `<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />`;
        case "spacer":
          return `<div style="height:${b.size}px;line-height:${b.size}px;">&nbsp;</div>`;
      }
    })
    .join("\n");
}

const DEFAULT_BLOCKS: Block[] = [
  { id: newId(), type: "heading", text: "Novedades de esta semana" },
  {
    id: newId(),
    type: "text",
    text: "Hola, te comparto una selección de novedades y oportunidades que pueden interesarte.\n\nSi quieres más detalles de cualquiera, respóndeme a este correo.",
  },
  { id: newId(), type: "button", label: "Ver propiedades", url: "https://estaila.com" },
];

// ============================================================
// ROOT
// ============================================================

export function NewsletterStudio({
  campaigns: initialCampaigns,
  audience,
  properties,
}: {
  campaigns: CampaignListItem[];
  audience: EmailAudienceContact[];
  properties: Property[];
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState<CampaignType | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const { listCampaigns } = await import("@/lib/actions/email-campaign");
    setCampaigns(await listCampaigns());
  }, []);

  async function openEditor(id: string) {
    setLoading(true);
    setEditingId(id);
    setLoading(false);
  }

  if (editingId || creating) {
    return (
      <CampaignEditor
        campaignId={editingId}
        initialType={creating ?? "CAMPAIGN"}
        audience={audience}
        properties={properties}
        onBack={async () => {
          setEditingId(null);
          setCreating(null);
          await refresh();
        }}
      />
    );
  }

  const sent = campaigns.filter((c) => c.status === "SENT");
  const drafts = campaigns.filter((c) => c.status !== "SENT");
  const totalReach = sent.reduce((a, c) => a + c.sentCount, 0);

  return (
    <div className="space-y-5">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <StatPill icon={Mail} label="Campañas" value={campaigns.length} />
          <StatPill icon={Send} label="Enviadas" value={sent.length} />
          <StatPill icon={Users} label="Alcance total" value={totalReach} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreating("CAMPAIGN")}>
            <Mail className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            Nueva campaña
          </Button>
          <Button size="sm" onClick={() => setCreating("NEWSLETTER")}>
            <Newspaper className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            Nuevo newsletter
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="font-display text-lg font-bold tracking-tight">
            Crea tu primer envío
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Diseña una campaña o un newsletter con bloques visuales o HTML, elige
            tu audiencia y envíalo con tu marca.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreating("CAMPAIGN")}>
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Campaña
            </Button>
            <Button size="sm" onClick={() => setCreating("NEWSLETTER")}>
              <Newspaper className="mr-1.5 h-3.5 w-3.5" /> Newsletter
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {drafts.length > 0 && (
            <Section title="Borradores" count={drafts.length}>
              {drafts.map((c) => (
                <CampaignCard
                  key={c.id}
                  c={c}
                  onOpen={() => openEditor(c.id)}
                  onChanged={refresh}
                />
              ))}
            </Section>
          )}
          {sent.length > 0 && (
            <Section title="Enviadas" count={sent.length}>
              {sent.map((c) => (
                <CampaignCard
                  key={c.id}
                  c={c}
                  onOpen={() => openEditor(c.id)}
                  onChanged={refresh}
                />
              ))}
            </Section>
          )}
        </div>
      )}
      {loading && null}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title} · {count}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div>
        <p className="font-display text-lg font-bold leading-none tabular-nums">
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function CampaignCard({
  c,
  onOpen,
  onChanged,
}: {
  c: CampaignListItem;
  onOpen: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const isNewsletter = c.type === "NEWSLETTER";
  const isSent = c.status === "SENT";

  async function dup() {
    setBusy(true);
    const r = await duplicateCampaign(c.id);
    setBusy(false);
    if (r.ok) {
      toast.success("Duplicada");
      await onChanged();
    } else toast.error(r.error);
  }
  async function del() {
    if (!confirm(`¿Eliminar "${c.name}"?`)) return;
    setBusy(true);
    const r = await deleteCampaign(c.id);
    setBusy(false);
    if (r.ok) {
      toast.success("Eliminada");
      await onChanged();
    } else toast.error(r.error ?? "Error");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/15"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            isNewsletter ? "bg-primary/10 text-primary" : "bg-secondary text-foreground/70"
          )}
        >
          {isNewsletter ? (
            <Newspaper className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isNewsletter ? "Newsletter" : "Campaña"}
        </span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isSent
              ? "bg-primary/10 text-primary"
              : "bg-amber-500/10 text-amber-600"
          )}
        >
          {isSent ? "Enviada" : "Borrador"}
        </span>
      </div>

      <button onClick={onOpen} className="mt-3 text-left">
        <p className="line-clamp-1 font-display text-[15px] font-bold tracking-tight">
          {c.name}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {c.subject || "Sin asunto"}
        </p>
      </button>

      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
        {isSent ? (
          <>
            <span className="tabular-nums">{c.sentCount} enviados</span>
            <span className="rounded-full bg-secondary px-1.5 py-0.5">{c.variant === "EDITORIAL" ? "Editorial" : "Minimal"}</span>
          </>
        ) : (
          <span className="rounded-full bg-secondary px-1.5 py-0.5">
            {c.variant === "EDITORIAL" ? "Editorial" : "Minimal"}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <IconBtn title="Editar" onClick={onOpen}>
            <Eye className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Duplicar" onClick={dup} disabled={busy}>
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Eliminar" onClick={del} disabled={busy}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// ============================================================
// EDITOR
// ============================================================

function CampaignEditor({
  campaignId,
  initialType,
  audience,
  properties,
  onBack,
}: {
  campaignId: string | null;
  initialType: CampaignType;
  audience: EmailAudienceContact[];
  properties: Property[];
  onBack: () => void;
}) {
  const [ready, setReady] = useState(campaignId === null);
  const [id, setId] = useState<string | null>(campaignId);
  const [type, setType] = useState<CampaignType>(initialType);
  const [name, setName] = useState(
    initialType === "NEWSLETTER" ? "Newsletter sin título" : "Campaña sin título"
  );
  const [subject, setSubject] = useState("");
  const [variant, setVariant] = useState<Variant>("MINIMAL");
  const [mode, setMode] = useState<EditorMode>("BLOCKS");
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
  const [htmlRaw, setHtmlRaw] = useState("");
  const [audienceType, setAudienceType] = useState("ALL");
  const [customIds, setCustomIds] = useState<Set<string>>(new Set());
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState("DRAFT");

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // Load existing campaign
  useEffect(() => {
    if (!campaignId) return;
    let active = true;
    (async () => {
      const c = await getCampaign(campaignId);
      if (!active || !c) {
        if (active) toast.error("No se pudo cargar la campaña");
        return;
      }
      setType((c.type as CampaignType) ?? "CAMPAIGN");
      setName(c.name);
      setSubject(c.subject);
      setVariant((c.variant as Variant) ?? "MINIMAL");
      setMode((c.editorMode as EditorMode) ?? "BLOCKS");
      setHtmlRaw(c.bodyHtml);
      setAudienceType(c.audienceType);
      setPropertyId(c.propertyId ?? "");
      setStatus(c.status);
      if (c.bodyJson) {
        try {
          const parsed = JSON.parse(c.bodyJson) as Block[];
          if (Array.isArray(parsed) && parsed.length) setBlocks(parsed);
        } catch {
          /* ignore */
        }
      }
      if (c.audienceType === "CUSTOM" && c.audienceJson) {
        try {
          setCustomIds(new Set(JSON.parse(c.audienceJson)));
        } catch {
          /* ignore */
        }
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [campaignId]);

  const bodyHtml = useMemo(
    () => (mode === "BLOCKS" ? renderBlocks(blocks) : htmlRaw),
    [mode, blocks, htmlRaw]
  );

  const recipientCount = useMemo(() => {
    if (audienceType === "ALL") return audience.length;
    if (audienceType === "CUSTOM") return customIds.size;
    if (audienceType.startsWith("TYPE:")) {
      const t = audienceType.slice(5);
      return audience.filter((a) => a.type === t).length;
    }
    return 0;
  }, [audienceType, audience, customIds]);

  // Debounced live preview
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const r = await previewCampaign({
        subject: subject || "Asunto de ejemplo",
        variant,
        bodyHtml,
        propertyId: propertyId || null,
      });
      if (r.ok) setPreviewHtml(r.html);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [ready, subject, variant, bodyHtml, propertyId]);

  function buildPayload() {
    return {
      id: id ?? undefined,
      type,
      name,
      subject,
      variant,
      editorMode: mode,
      bodyHtml,
      bodyJson: JSON.stringify(blocks),
      audienceType,
      audienceJson:
        audienceType === "CUSTOM" ? JSON.stringify(Array.from(customIds)) : null,
      propertyId: propertyId || null,
    };
  }

  async function doSave(silent = false): Promise<string | null> {
    setSaving(true);
    const r = await saveCampaign(buildPayload());
    setSaving(false);
    if (!r.ok) {
      toast.error(r.error);
      return null;
    }
    setId(r.id);
    if (!silent) toast.success("Guardado");
    return r.id;
  }

  async function doSend(test: boolean) {
    if (!subject.trim()) return toast.error("Ponle un asunto.");
    if (!bodyHtml.trim()) return toast.error("El contenido está vacío.");
    if (!test && recipientCount === 0)
      return toast.error("No hay destinatarios en esta audiencia.");
    if (!test && !confirm(`¿Enviar a ${recipientCount} destinatario(s)?`)) return;
    setSending(true);
    const savedId = await doSave(true);
    if (!savedId) {
      setSending(false);
      return;
    }
    const r = await sendCampaign(savedId, { test });
    setSending(false);
    if (!r.ok) return toast.error(r.error);
    if (test) toast.success("Email de prueba enviado a tu correo");
    else {
      toast.success(`Enviado a ${r.sent} · ${r.failed} fallidos`);
      setStatus("SENT");
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full truncate border-0 bg-transparent font-display text-lg font-bold tracking-tight outline-none"
            placeholder="Nombre interno"
          />
        </div>
        {status === "SENT" && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            Enviada
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => doSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Guardar
        </Button>
        <Button variant="outline" size="sm" onClick={() => doSend(true)} disabled={sending}>
          <Eye className="mr-1.5 h-3.5 w-3.5" /> Prueba
        </Button>
        <Button size="sm" onClick={() => doSend(false)} disabled={sending}>
          {sending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-3.5 w-3.5" />
          )}
          Enviar a {recipientCount}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_minmax(0,380px)]">
        {/* Settings */}
        <div className="space-y-4">
          <Field label="Asunto del email">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: 5 propiedades nuevas esta semana"
            />
          </Field>

          <div>
            <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plantilla
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <VariantCard
                active={variant === "MINIMAL"}
                onClick={() => setVariant("MINIMAL")}
                title="Minimal"
                desc="Limpia, blanca"
                tone="minimal"
              />
              <VariantCard
                active={variant === "EDITORIAL"}
                onClick={() => setVariant("EDITORIAL")}
                title="Editorial"
                desc="Banda de marca"
                tone="editorial"
              />
            </div>
          </div>

          <AudiencePicker
            audience={audience}
            audienceType={audienceType}
            setAudienceType={setAudienceType}
            customIds={customIds}
            setCustomIds={setCustomIds}
            recipientCount={recipientCount}
          />

          <Field label="Propiedad destacada (opcional)">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary/40"
            >
              <option value="">Ninguna</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            {propertyId && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Se añade su tarjeta al final del email.
              </p>
            )}
          </Field>
        </div>

        {/* Content editor */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-1 border-b border-border p-2">
            <ModeBtn active={mode === "BLOCKS"} onClick={() => setMode("BLOCKS")} icon={LayoutTemplate}>
              Bloques
            </ModeBtn>
            <ModeBtn
              active={mode === "HTML"}
              onClick={() => {
                if (mode === "BLOCKS") setHtmlRaw(renderBlocks(blocks));
                setMode("HTML");
              }}
              icon={Code2}
            >
              HTML
            </ModeBtn>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {mode === "BLOCKS" ? (
              <BlockEditor blocks={blocks} setBlocks={setBlocks} />
            ) : (
              <HtmlCodeEditor value={htmlRaw} onChange={setHtmlRaw} />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Vista previa
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary/30">
            <iframe
              title="preview"
              srcDoc={previewHtml}
              className="h-[62vh] w-full"
              sandbox=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EDITOR PARTS
// ============================================================

function ModeBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Code2;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {children}
    </button>
  );
}

const BLOCK_PALETTE: { type: Block["type"]; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Título", icon: Heading },
  { type: "text", label: "Texto", icon: Type },
  { type: "image", label: "Imagen", icon: ImageIcon },
  { type: "button", label: "Botón", icon: MousePointerClick },
  { type: "divider", label: "Separador", icon: Minus },
  { type: "spacer", label: "Espacio", icon: Plus },
];

function BlockEditor({
  blocks,
  setBlocks,
}: {
  blocks: Block[];
  setBlocks: (b: Block[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function update(id: string, patch: Partial<Block>) {
    setBlocks(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  }
  function remove(id: string) {
    setBlocks(blocks.filter((b) => b.id !== id));
  }
  function add(type: Block["type"]) {
    setBlocks([...blocks, makeBlock(type)]);
  }
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldI = blocks.findIndex((b) => b.id === active.id);
      const newI = blocks.findIndex((b) => b.id === over.id);
      if (oldI >= 0 && newI >= 0) setBlocks(arrayMove(blocks, oldI, newI));
    }
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.map((b) => (
              <SortableBlockRow
                key={b.id}
                block={b}
                update={update}
                onRemove={() => remove(b.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          Sin bloques todavía. Añade uno abajo.
        </p>
      )}

      {/* Palette */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-border p-2.5">
        {BLOCK_PALETTE.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.type}
              type="button"
              onClick={() => add(p.type)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortableBlockRow({
  block,
  update,
  onRemove,
}: {
  block: Block;
  update: (id: string, patch: Partial<Block>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-background p-3",
        isDragging ? "border-primary shadow-lg" : "border-border"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          className="cursor-grab touch-none text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {BLOCK_PALETTE.find((p) => p.type === block.type)?.label ?? block.type}
        </span>
        <div className="ml-auto">
          <MiniBtn title="Eliminar" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </MiniBtn>
        </div>
      </div>
      <BlockFields block={block} update={update} />
    </div>
  );
}

function BlockFields({
  block,
  update,
}: {
  block: Block;
  update: (id: string, patch: Partial<Block>) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <Input
          value={block.text}
          onChange={(e) => update(block.id, { text: e.target.value })}
          className="h-9 font-semibold"
        />
      );
    case "text":
      return (
        <Textarea
          value={block.text}
          onChange={(e) => update(block.id, { text: e.target.value })}
          rows={4}
          className="resize-none text-sm"
        />
      );
    case "image":
      return (
        <div className="space-y-2">
          <Input
            value={block.url}
            onChange={(e) => update(block.id, { url: e.target.value })}
            placeholder="URL de la imagen (https://…)"
            className="h-9 text-xs"
          />
          {block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.url}
              alt=""
              className="max-h-32 w-full rounded-lg object-cover"
            />
          ) : null}
        </div>
      );
    case "button":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={block.label}
            onChange={(e) => update(block.id, { label: e.target.value })}
            placeholder="Texto"
            className="h-9 text-xs"
          />
          <Input
            value={block.url}
            onChange={(e) => update(block.id, { url: e.target.value })}
            placeholder="Enlace"
            className="h-9 text-xs"
          />
        </div>
      );
    case "spacer":
      return (
        <input
          type="range"
          min={8}
          max={64}
          value={block.size}
          onChange={(e) => update(block.id, { size: parseInt(e.target.value, 10) })}
          className="w-full accent-primary"
        />
      );
    case "divider":
      return <div className="h-px bg-border" />;
  }
}

function MiniBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function VariantCard({
  active,
  onClick,
  title,
  desc,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  tone: "minimal" | "editorial";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-2.5 text-left transition-all",
        active ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/20"
      )}
    >
      <div className="mb-2 overflow-hidden rounded-md border border-border">
        {tone === "editorial" ? (
          <>
            <div className="h-3 bg-primary" />
            <div className="space-y-1 bg-background p-1.5">
              <div className="h-1.5 w-3/4 rounded bg-foreground/70" />
              <div className="h-1 w-full rounded bg-muted" />
              <div className="h-1 w-5/6 rounded bg-muted" />
            </div>
          </>
        ) : (
          <div className="space-y-1 bg-background p-1.5">
            <div className="h-1.5 w-1/2 rounded bg-muted" />
            <div className="h-1 w-full rounded bg-muted" />
            <div className="h-1 w-4/5 rounded bg-muted" />
            <div className="mt-1 h-2 w-1/3 rounded bg-primary" />
          </div>
        )}
      </div>
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
    </button>
  );
}

function AudiencePicker({
  audience,
  audienceType,
  setAudienceType,
  customIds,
  setCustomIds,
  recipientCount,
}: {
  audience: EmailAudienceContact[];
  audienceType: string;
  setAudienceType: (t: string) => void;
  customIds: Set<string>;
  setCustomIds: (s: Set<string>) => void;
  recipientCount: number;
}) {
  const [q, setQ] = useState("");
  const types = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const a of audience) acc[a.type] = (acc[a.type] ?? 0) + 1;
    return Object.keys(acc).sort((x, y) => acc[y] - acc[x]).map((t) => ({ t, n: acc[t] }));
  }, [audience]);

  const filtered = useMemo(() => {
    if (!q) return audience;
    const s = q.toLowerCase();
    return audience.filter(
      (a) => a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s)
    );
  }, [audience, q]);

  function toggle(id: string) {
    const next = new Set(customIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCustomIds(next);
  }

  return (
    <div>
      <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Audiencia · {recipientCount}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        <AudChip active={audienceType === "ALL"} onClick={() => setAudienceType("ALL")} label="Todos" count={audience.length} />
        {types.map(({ t, n }) => (
          <AudChip
            key={t}
            active={audienceType === `TYPE:${t}`}
            onClick={() => setAudienceType(`TYPE:${t}`)}
            label={labelFor(CONTACT_TYPES, t)}
            count={n}
          />
        ))}
        <AudChip active={audienceType === "CUSTOM"} onClick={() => setAudienceType("CUSTOM")} label="Elegir" count={customIds.size} />
      </div>
      {audienceType === "CUSTOM" && (
        <div className="mt-2 rounded-xl border border-border">
          <div className="border-b border-border p-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar contacto…"
              className="h-8 text-xs"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.slice(0, 200).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-secondary/50",
                  customIds.has(c.id) && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                    customIds.has(c.id) ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {initials(c.name)}
                </span>
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                {customIds.has(c.id) && <span className="text-primary">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AudChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span className={cn("rounded-full px-1 text-[9px] tabular-nums", active ? "bg-white/20" : "bg-secondary")}>
        {count}
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
