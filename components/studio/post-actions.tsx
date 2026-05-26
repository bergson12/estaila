"use client";

/**
 * Post-generation actions panel.
 *
 * After a Studio IA generation completes, the user can:
 *   - Download the image
 *   - Save it as a photo on one of their properties
 *   - Share via WhatsApp to a contact (with deep link)
 *   - Copy public URL
 *   - Pass to another Studio tool
 *
 * Renders inline (below the canvas) — no nested scroll on the parent.
 */

import {
  Building2,
  Check,
  Copy,
  Download,
  Link2,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Trash2,
  User,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  listMyPropertiesLite,
  listMyContactsLite,
  savePhotoToProperty,
  logPhotoSentToContact,
} from "@/lib/actions/ai";
import { NextToolMenu } from "./next-tool-menu";

type Property = {
  id: string;
  title: string;
  location: string | null;
  coverUrl: string | null;
};

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function PostActions({
  generationId,
  outputUrl,
  onRegenerate,
  onReset,
  isGenerating,
}: {
  generationId: string;
  outputUrl: string;
  onRegenerate?: () => void;
  onReset: () => void;
  isGenerating: boolean;
}) {
  const [propsOpen, setPropsOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(outputUrl);
    toast.success("URL copiada al portapapeles");
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button asChild size="sm" variant="outline">
          <a href={outputUrl} download target="_blank" rel="noreferrer">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Descargar
          </a>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setPropsOpen(true)}
        >
          <Building2 className="mr-1.5 h-3.5 w-3.5" />
          Guardar en propiedad
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setWhatsappOpen(true)}
        >
          <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
          Enviar a contacto
        </Button>

        <Button size="sm" variant="outline" onClick={copyUrl}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Copiar URL
        </Button>

        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerar
          </Button>
        )}

        <NextToolMenu />

        <Button size="sm" variant="ghost" onClick={onReset}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Cambiar foto
        </Button>
      </div>

      <SaveToPropertyDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        generationId={generationId}
      />
      <SendToContactDialog
        open={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
        generationId={generationId}
        outputUrl={outputUrl}
      />
    </>
  );
}

// ============================================================
// Save to property
// ============================================================

function SaveToPropertyDialog({
  open,
  onClose,
  generationId,
}: {
  open: boolean;
  onClose: () => void;
  generationId: string;
}) {
  const router = useRouter();
  const [props, setProps] = useState<Property[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listMyPropertiesLite()
      .then(setProps)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [open]);

  async function save(p: Property) {
    setSaving(p.id);
    try {
      await savePhotoToProperty(generationId, p.id);
      toast.success("Guardado", {
        description: p.title,
        action: {
          label: "Ver",
          onClick: () => router.push(`/propiedades/${p.id}`),
        },
      });
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  const filtered = props?.filter((p) =>
    query
      ? p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.location ?? "").toLowerCase().includes(query.toLowerCase())
      : true
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Guardar en propiedad
          </DialogTitle>
          <DialogDescription className="text-xs">
            La foto se agregará al final de la galería de la propiedad seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border px-5 py-2.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar propiedad..."
            className="h-9"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Cargando propiedades...
            </div>
          )}
          {!loading && filtered?.length === 0 && (
            <div className="px-3 py-8 text-center">
              <Building2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                {query ? "Sin resultados" : "Aún no tienes propiedades"}
              </p>
              {!query && (
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => router.push("/propiedades/nueva")}
                  className="mt-2"
                >
                  Crear primera propiedad
                </Button>
              )}
            </div>
          )}
          {!loading &&
            filtered?.map((p) => (
              <button
                key={p.id}
                onClick={() => save(p)}
                disabled={saving !== null}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-colors",
                  "hover:border-primary/30 hover:bg-primary/5",
                  saving === p.id && "opacity-50"
                )}
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.coverUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="m-auto h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  {p.location && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.location}
                    </p>
                  )}
                </div>
                {saving === p.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                )}
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Send via WhatsApp
// ============================================================

function SendToContactDialog({
  open,
  onClose,
  generationId,
  outputUrl,
}: {
  open: boolean;
  onClose: () => void;
  generationId: string;
  outputUrl: string;
}) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [message, setMessage] = useState(
    "Hola, te comparto esta foto que preparé con Studio IA. ¿Qué te parece?"
  );
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(null);
    listMyContactsLite()
      .then(setContacts)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [open]);

  async function send() {
    if (!selected?.phone) return;
    setSending(true);
    try {
      // Log the activity (best-effort — don't block on it)
      logPhotoSentToContact({
        generationId,
        contactId: selected.id,
        channel: "WHATSAPP",
        note: message,
      }).catch(() => {
        // ignore
      });

      // Compose WhatsApp deep link with image URL + message
      const fullMsg = `${message}\n\n${outputUrl}`;
      const phone = selected.phone.replace(/[^\d+]/g, "");
      const wa = `https://wa.me/${phone.replace(
        /^\+/,
        ""
      )}?text=${encodeURIComponent(fullMsg)}`;
      window.open(wa, "_blank", "noopener,noreferrer");

      toast.success("Abriendo WhatsApp con la foto", {
        description: selected.name,
      });
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const filtered = contacts?.filter((c) =>
    query
      ? c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.phone ?? "").includes(query)
      : true
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="h-4 w-4 text-primary" />
            Enviar por WhatsApp
          </DialogTitle>
          <DialogDescription className="text-xs">
            Selecciona un contacto, ajusta el mensaje y abrimos WhatsApp con la
            foto adjunta.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="border-b border-border px-5 py-2.5">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar contacto o teléfono..."
                className="h-9"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {loading && (
                <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Cargando contactos...
                </div>
              )}
              {!loading && filtered?.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <User className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    {query
                      ? "Sin resultados"
                      : "Aún no tienes contactos con teléfono"}
                  </p>
                </div>
              )}
              {!loading &&
                filtered?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {c.phone}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selected.name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {selected.phone}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(null)}
                  className="text-xs"
                >
                  Cambiar
                </Button>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Mensaje
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Escribe un mensaje..."
                />
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  La URL pública de la foto se adjunta automáticamente al final.
                </p>
              </div>
            </div>
            <DialogFooter className="border-t border-border px-5 py-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={send} disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Abrir WhatsApp
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Silence unused import warnings for placeholders
export const _Refs = { Wand2, Copy };
