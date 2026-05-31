"use client";

/**
 * Manager de plantillas de documentos.
 *
 * Funciones:
 *   - Listar plantillas (system + propias) por kind
 *   - Crear plantilla en blanco
 *   - Editar body con sidebar de placeholders insertables
 *   - Subir DOCX (mammoth lo convierte a HTML)
 *   - Duplicar plantilla del sistema para editarla
 *   - Marcar como default · eliminar propias
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  FileUp,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  setDefaultTemplate,
  updateTemplate,
  uploadDocxTemplate,
} from "@/lib/actions/document-templates";
import {
  DOC_KIND_LABEL,
  PLACEHOLDERS,
  type DocKind,
} from "@/lib/document-templates";

type Template = {
  id: string;
  userId: string | null;
  kind: DocKind;
  name: string;
  description: string | null;
  body: string;
  source: "MANUAL" | "DOCX" | "SYSTEM";
  isDefault: boolean;
  isSystem: boolean;
};

export function TemplatesManager({
  open,
  onOpenChange,
  kind: initialKind,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind?: DocKind;
}) {
  const [kind, setKind] = useState<DocKind>(initialKind ?? "CONTRACT_SALE");
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // sync external kind change
  useEffect(() => {
    if (initialKind) setKind(initialKind);
  }, [initialKind]);

  async function reload() {
    setLoading(true);
    try {
      const rows = (await listTemplates(kind)) as Template[];
      setItems(rows);
      // preserve selection if still present, else pick first
      if (selected) {
        const fresh = rows.find((r) => r.id === selected.id);
        if (fresh) {
          setSelected(fresh);
        } else {
          setSelected(rows[0] ?? null);
        }
      } else {
        setSelected(rows[0] ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  // load draft state when selection changes
  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setEditBody(selected.body);
      setDirty(false);
    } else {
      setEditName("");
      setEditBody("");
      setDirty(false);
    }
  }, [selected]);

  // ---------- Actions ----------
  async function handleSave() {
    if (!selected || selected.isSystem) return;
    setSaving(true);
    try {
      await updateTemplate(selected.id, { name: editName, body: editBody });
      await reload();
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBlank() {
    setSaving(true);
    try {
      const { id } = await createTemplate({
        kind,
        name: "Nueva plantilla",
        description: "Plantilla personalizada",
        body: defaultBlankBody(kind),
        source: "MANUAL",
      });
      await reload();
      const created = (await listTemplates(kind)) as Template[];
      const fresh = created.find((c) => c.id === id);
      if (fresh) setSelected(fresh);
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(t: Template) {
    setSaving(true);
    try {
      const { id } = await createTemplate({
        kind: t.kind,
        name: `${t.name} (copia)`,
        description: t.description ?? "Copia editable",
        body: t.body,
        source: "MANUAL",
      });
      await reload();
      const created = (await listTemplates(kind)) as Template[];
      const fresh = created.find((c) => c.id === id);
      if (fresh) setSelected(fresh);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Template) {
    if (t.isSystem) return;
    if (!confirm(`¿Eliminar la plantilla "${t.name}"? Esta acción no se puede deshacer.`)) return;
    await deleteTemplate(t.id);
    setSelected(null);
    await reload();
  }

  async function handleSetDefault(t: Template) {
    if (t.isSystem) return;
    await setDefaultTemplate(t.id);
    await reload();
  }

  async function handleUploadFile(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      // convert ArrayBuffer → base64
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const cleanName = file.name.replace(/\.docx?$/i, "");
      const { id } = await uploadDocxTemplate({
        kind,
        name: cleanName || "Plantilla DOCX",
        base64,
      });
      await reload();
      const created = (await listTemplates(kind)) as Template[];
      const fresh = created.find((c) => c.id === id);
      if (fresh) setSelected(fresh);
    } catch (e) {
      alert(
        `Error al procesar DOCX: ${e instanceof Error ? e.message : "desconocido"}`
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ---------- Insert placeholder at cursor ----------
  function insertAtCursor(token: string) {
    const ta = textareaRef.current;
    if (!ta || !selected || selected.isSystem) return;
    const start = ta.selectionStart ?? editBody.length;
    const end = ta.selectionEnd ?? editBody.length;
    const next = editBody.slice(0, start) + token + editBody.slice(end);
    setEditBody(next);
    setDirty(true);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const groupedPlaceholders = useMemo(() => {
    const all = PLACEHOLDERS[kind];
    const groups: Record<string, typeof all> = {};
    for (const p of all) {
      groups[p.group] = groups[p.group] || [];
      groups[p.group].push(p);
    }
    return groups;
  }, [kind]);

  const editable = selected && !selected.isSystem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[1200px] p-0 sm:max-w-[95vw] h-[90vh] flex flex-col gap-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-5 py-3">
          <div>
            <DialogTitle className="text-base font-semibold">
              Plantillas de documentos
            </DialogTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Sistema, personalizadas, y subidas desde DOCX
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as DocKind)}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DOC_KIND_LABEL) as DocKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {DOC_KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[240px_1fr_220px] lg:overflow-hidden">
          {/* Left: template list */}
          <aside className="hide-scrollbar flex max-h-[40vh] flex-col overflow-y-auto border-b bg-muted/20 lg:max-h-none lg:border-b-0 lg:border-r">
            <div className="space-y-1.5 p-3">
              <button
                type="button"
                onClick={handleCreateBlank}
                disabled={saving}
                className="flex w-full items-center gap-2 rounded-md border border-dashed bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Nueva plantilla en blanco
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center gap-2 rounded-md border border-dashed bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <FileUp className="h-3.5 w-3.5" aria-hidden />
                )}
                Subir DOCX…
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadFile(f);
                }}
              />
            </div>

            <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Disponibles
            </div>

            <div className="flex-1 space-y-1 px-2 pb-3">
              {loading ? (
                <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Cargando…
                </div>
              ) : items.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  Sin plantillas.
                </p>
              ) : (
                items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`group flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition ${
                      selected?.id === t.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:bg-muted/40"
                    }`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {t.isDefault ? (
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
                      ) : t.isSystem ? (
                        <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-snug">{t.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                        {t.isSystem ? "Sistema" : "Propia"}
                        {t.source === "DOCX" && <span>· DOCX</span>}
                        {t.isDefault && <span>· Default</span>}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Center: editor + preview */}
          <section className="flex flex-col overflow-hidden">
            {selected ? (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b bg-background/80 px-4 py-2">
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setDirty(true);
                      }}
                      disabled={!editable}
                      className="w-full max-w-[400px] rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    {selected.isSystem && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Solo lectura
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selected.isSystem ? (
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(selected)}>
                        <Upload className="mr-1.5 h-3.5 w-3.5 rotate-180" /> Duplicar para editar
                      </Button>
                    ) : (
                      <>
                        {!selected.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefault(selected)}
                          >
                            <Star className="mr-1.5 h-3.5 w-3.5" /> Marcar default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(selected)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={!dirty || saving}
                        >
                          {saving ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Guardar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Editor */}
                <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-2">
                  <div className="flex min-h-[260px] flex-col overflow-hidden border-b lg:min-h-0 lg:border-b-0 lg:border-r">
                    <div className="border-b bg-muted/30 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cuerpo HTML
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={editBody}
                      onChange={(e) => {
                        setEditBody(e.target.value);
                        setDirty(true);
                      }}
                      disabled={!editable}
                      spellCheck={false}
                      className="flex-1 resize-none border-0 bg-background p-4 font-mono text-[11.5px] leading-relaxed focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/20"
                    />
                  </div>
                  <div className="flex min-h-[260px] flex-col overflow-hidden lg:min-h-0">
                    <div className="border-b bg-muted/30 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Vista previa (HTML)
                    </div>
                    <div className="hide-scrollbar flex-1 overflow-y-auto bg-muted/30 p-4">
                      <div className="mx-auto rounded bg-white p-8 text-black shadow-sm">
                        <div
                          className="doc-preview"
                          dangerouslySetInnerHTML={{ __html: editBody }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Selecciona una plantilla
              </div>
            )}
          </section>

          {/* Right: placeholders */}
          <aside className="hide-scrollbar flex flex-col overflow-y-auto border-l bg-muted/20">
            <div className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Placeholders
            </div>
            <div className="space-y-4 p-3">
              {Object.entries(groupedPlaceholders).map(([group, list]) => (
                <div key={group}>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {list.map((p) => (
                      <button
                        key={p.token}
                        type="button"
                        onClick={() => insertAtCursor(p.token)}
                        disabled={!editable}
                        title={`Insertar ${p.token}`}
                        className="block w-full truncate rounded px-2 py-1 text-left text-[11px] transition hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="font-medium">{p.label}</span>
                        <span className="ml-1 font-mono text-[9.5px] text-muted-foreground">
                          {p.token}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function defaultBlankBody(kind: DocKind): string {
  if (kind === "PAYMENT_RECEIPT") {
    return `<h1>Recibo de pago</h1>
<p>Fecha: <strong>{{form.contractDate}}</strong> · Lugar: <strong>{{form.city}}</strong></p>
<p>Recibido de <strong>{{form.payerName}}</strong> la suma de <strong>{{form.amountFormatted}}</strong> ({{form.amountWords}}).</p>
<p>Concepto: {{form.concept}}</p>
<p>Método: {{form.method}}</p>`;
  }
  return `<h1>${DOC_KIND_LABEL[kind]}</h1>
<p>En <strong>{{form.city}}</strong>, a los <strong>{{form.contractDate}}</strong>, comparecen las partes:</p>

<h3>PRIMERA · Objeto</h3>
<p>Editar las cláusulas aquí. Usar los placeholders del panel derecho.</p>

<h3>SEGUNDA · …</h3>
<p>…</p>

<div class="signatures">
  <div><p>______________________________________</p><p><strong>PARTE 1</strong></p></div>
  <div><p>______________________________________</p><p><strong>PARTE 2</strong></p></div>
</div>`;
}
