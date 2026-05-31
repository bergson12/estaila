"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Loader2,
  Building2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";
import {
  createUploadedDocument,
  updateDocStatus,
  deleteUploadedDocument,
} from "@/lib/actions/document";

type DocRow = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string | null;
  kind: string;
  status: string;
  propertyId: string | null;
  contactId: string | null;
  createdAt: string | Date;
};

const KIND_LABEL: Record<string, string> = {
  PROPUESTA: "Propuesta",
  CONTRATO: "Contrato",
  RECIBO: "Recibo",
  OTRO: "Otro",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDIENTE: { label: "Pendiente", cls: "bg-muted text-muted-foreground" },
  ENVIADO: { label: "Enviado", cls: "bg-blue-500/15 text-blue-500" },
  FIRMADO: { label: "Firmado", cls: "bg-emerald-500/15 text-emerald-500" },
  CERRADO: { label: "Cerrado", cls: "bg-violet-500/15 text-violet-500" },
  RECHAZADO: { label: "Rechazado", cls: "bg-destructive/15 text-destructive" },
};

const STATUS_TABS = ["ALL", "PENDIENTE", "ENVIADO", "FIRMADO", "CERRADO"] as const;

export function DocumentsManager({
  docs,
  properties,
  contacts,
}: {
  docs: DocRow[];
  properties: { id: string; title: string }[];
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof STATUS_TABS)[number]>("ALL");
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState("OTRO");
  const [propertyId, setPropertyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const propMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties]
  );
  const contactMap = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.id, c.name])),
    [contacts]
  );

  const filtered = filter === "ALL" ? docs : docs.filter((d) => d.status === filter);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, "default"); // PDFs/DOCX pasan intactos
      const fd = new FormData();
      fd.append("file", compressed);
      const up = await fetch("/api/upload/document", { method: "POST", body: fd });
      const data = await up.json();
      if (!up.ok) throw new Error(data.error ?? "Error al subir el documento");
      const r = await createUploadedDocument({
        name: file.name,
        fileUrl: data.url as string,
        mimeType: (data.mime as string) ?? null,
        kind,
        propertyId: propertyId || null,
        contactId: contactId || null,
      });
      if (!r.ok) throw new Error(r.error);
      toast.success("Documento subido");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await updateDocStatus(id, status);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? No se puede deshacer.`)) return;
    setBusyId(id);
    try {
      await deleteUploadedDocument(id);
      toast.success("Documento eliminado");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="mt-4 rounded-2xl border-border p-6">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Mis documentos
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight">
          Sube y organiza documentos
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, Word o imágenes (máx 25MB). Vincula a una propiedad o contacto y
          controla su estado.
        </p>
      </div>

      {/* Upload row */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border bg-card/40 p-3">
        <div className="min-w-[120px] flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo
          </label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROPUESTA">Propuesta</SelectItem>
              <SelectItem value="CONTRATO">Contrato</SelectItem>
              <SelectItem value="RECIBO">Recibo</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedad (opcional)
          </label>
          <Select
            value={propertyId || "__none"}
            onValueChange={(v) => setPropertyId(v === "__none" ? "" : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sin propiedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Sin propiedad</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contacto (opcional)
          </label>
          <Select
            value={contactId || "__none"}
            onValueChange={(v) => setContactId(v === "__none" ? "" : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sin contacto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Sin contacto</SelectItem>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild disabled={uploading} className="h-9">
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            Subir documento
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,image/*"
              className="hidden"
              disabled={uploading}
              onChange={onPick}
            />
          </label>
        </Button>
      </div>

      {/* Status filter */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === s
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-card/50"
            )}
          >
            {s === "ALL" ? "Todos" : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {docs.length === 0
            ? "Aún no has subido documentos. Sube el primero arriba."
            : "Sin documentos en este estado."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((d) => {
            const Icon = d.mimeType?.startsWith("image/") ? ImageIcon : FileText;
            const meta = STATUS_META[d.status] ?? STATUS_META.PENDIENTE;
            const link = d.propertyId ? propMap[d.propertyId] : null;
            const person = d.contactId ? contactMap[d.contactId] : null;
            return (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-background"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {d.name}
                    </a>
                    <Badge variant="outline" className="text-[9px]">
                      {KIND_LABEL[d.kind] ?? d.kind}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {formatDate(d.createdAt)}
                    </span>
                    {link && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {link}
                      </span>
                    )}
                    {person && (
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {person}
                      </span>
                    )}
                  </p>
                </div>

                <Badge className={cn("shrink-0 text-[10px]", meta.cls)}>
                  {meta.label}
                </Badge>

                <Select
                  value={d.status}
                  onValueChange={(v) => changeStatus(d.id, v)}
                  disabled={busyId === d.id}
                >
                  <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_META).map(([key, m]) => (
                      <SelectItem key={key} value={key}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button asChild size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(d.id, d.name)}
                  disabled={busyId === d.id}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
