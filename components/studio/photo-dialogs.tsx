"use client";

/**
 * Shared photo-action dialogs used by both the post-generation panel
 * (PostActions) and the Studio gallery grid.
 *
 *   - DownloadModal       — preview + real client-side download (fetch→blob)
 *   - SaveToPropertyDialog — append the photo to a property's gallery
 *   - SendToContactDialog  — open WhatsApp deep link with the photo URL
 */

import {
  Building2,
  Check,
  Download,
  Link2,
  Loader2,
  MessageSquareText,
  Send,
  User,
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
import { brandedImageUrl } from "@/lib/public-url";
import {
  listMyPropertiesLite,
  listMyContactsLite,
  savePhotoToProperty,
  logPhotoSentToContact,
} from "@/lib/actions/ai";

export type Property = {
  id: string;
  title: string;
  location: string | null;
  coverUrl: string | null;
};

export type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

// ============================================================
// Download modal
// ============================================================

export function DownloadModal({
  open,
  onClose,
  outputUrl,
  filename = "estaila.png",
}: {
  open: boolean;
  onClose: () => void;
  outputUrl: string;
  filename?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      // Fetch the blob so the browser truly downloads it instead of
      // navigating to the (cross-origin) URL, which just shows the image.
      const res = await fetch(outputUrl, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Descarga iniciada", { description: filename });
      onClose();
    } catch {
      // CORS or network fallback — open in a new tab so the user can
      // long-press / right-click → save.
      window.open(outputUrl, "_blank", "noopener,noreferrer");
      toast.message("Abrimos la foto en otra pestaña", {
        description: "Mantén presionado o clic derecho → Guardar imagen.",
      });
      onClose();
    } finally {
      setDownloading(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(brandedImageUrl(outputUrl));
    toast.success("URL copiada al portapapeles");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Descargar foto
          </DialogTitle>
          <DialogDescription className="text-xs">
            Vista previa y descarga en alta resolución (PNG).
          </DialogDescription>
        </DialogHeader>

        <div className="p-4">
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outputUrl}
              alt="Vista previa"
              className="mx-auto block max-h-[50vh] w-auto object-contain"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 border-t border-border px-5 py-3 sm:justify-between">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Copiar URL
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Descargar imagen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Save to property
// ============================================================

export function SaveToPropertyDialog({
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
      toast.success("Guardado en propiedad", {
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
            Mover a propiedad
          </DialogTitle>
          <DialogDescription className="text-xs">
            La foto se agregará al final de la galería de la propiedad
            seleccionada.
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

export function SendToContactDialog({
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
      logPhotoSentToContact({
        generationId,
        contactId: selected.id,
        channel: "WHATSAPP",
        note: message,
      }).catch(() => {
        // ignore — best effort
      });

      const fullMsg = `${message}\n\n${brandedImageUrl(outputUrl)}`;
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
            Compartir por WhatsApp
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
