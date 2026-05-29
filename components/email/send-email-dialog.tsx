"use client";

/**
 * SendEmailDialog — reusable modal for sending templated emails.
 *
 * Usage:
 *   <SendEmailDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     contactIds={[contactId]}
 *     propertyId={propertyId}
 *     defaultKind="LEAD_REPLY"
 *   />
 *
 * Shows: template picker → custom fields (subject/body/datetime) →
 * preview/test → send.
 */

import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Home,
  Loader2,
  Mail,
  MessageSquare,
  PartyPopper,
  Send,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  sendTemplatedEmail,
  sendTestEmail,
  previewEmail,
} from "@/lib/actions/email";
import { defaultTemplateContent } from "@/lib/email/template-defaults";

type Kind =
  | "NEW_LISTING"
  | "PRICE_REDUCTION"
  | "OPEN_HOUSE"
  | "LEAD_REPLY"
  | "APPOINTMENT_CONFIRM"
  | "FOLLOWUP"
  | "CUSTOM";

const TEMPLATES: {
  kind: Kind;
  label: string;
  icon: typeof Mail;
  desc: string;
  needsProperty: boolean;
  needsDateTime?: boolean;
}[] = [
  {
    kind: "LEAD_REPLY",
    label: "Respuesta a lead",
    icon: MessageSquare,
    desc: "Primer contacto formal tras interés del cliente",
    needsProperty: false,
  },
  {
    kind: "NEW_LISTING",
    label: "Nueva propiedad",
    icon: Sparkles,
    desc: "Anuncia un listado nuevo a un contacto interesado",
    needsProperty: true,
  },
  {
    kind: "PRICE_REDUCTION",
    label: "Bajó el precio",
    icon: TrendingDown,
    desc: "Re-engancha contactos con cambio de precio",
    needsProperty: true,
  },
  {
    kind: "OPEN_HOUSE",
    label: "Open house",
    icon: PartyPopper,
    desc: "Invita a visita abierta el fin de semana",
    needsProperty: true,
    needsDateTime: true,
  },
  {
    kind: "APPOINTMENT_CONFIRM",
    label: "Confirmar visita",
    icon: CalendarIcon,
    desc: "Confirma fecha + lugar de visita",
    needsProperty: false,
    needsDateTime: true,
  },
  {
    kind: "FOLLOWUP",
    label: "Seguimiento",
    icon: Home,
    desc: "Re-engagement para leads dormidos",
    needsProperty: false,
  },
  {
    kind: "CUSTOM",
    label: "Mensaje libre",
    icon: Mail,
    desc: "Subject + cuerpo personalizado",
    needsProperty: false,
  },
];

export function SendEmailDialog({
  open,
  onClose,
  contactIds,
  contactCount,
  propertyId,
  propertyTitle,
  defaultKind = "LEAD_REPLY",
}: {
  open: boolean;
  onClose: () => void;
  contactIds: string[];
  contactCount?: number;
  propertyId?: string | null;
  propertyTitle?: string | null;
  defaultKind?: Kind;
}) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customDateTime, setCustomDateTime] = useState("");
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  // Remembers the auto-filled default so we only send overrides when edited.
  const defaultsRef = useRef<{ subject: string; message: string }>({
    subject: "",
    message: "",
  });

  const selectedTemplate = TEMPLATES.find((t) => t.kind === kind)!;
  const propertyMissing = selectedTemplate.needsProperty && !propertyId;
  const count = contactCount ?? contactIds.length;

  // Prefill the editable subject + message with the template's default text
  // whenever the template, property, or date/time changes. The user can then
  // tweak it; unchanged fields fall back to the (richer) server default.
  useEffect(() => {
    const d = defaultTemplateContent({
      kind,
      property: propertyTitle ? { title: propertyTitle, location: null } : null,
      dateTime: customDateTime || undefined,
    });
    defaultsRef.current = d;
    setCustomSubject(d.subject);
    setCustomBody(d.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, propertyTitle, customDateTime]);

  // ----- Live preview -----
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (selectedTemplate.needsProperty && !propertyId) {
      setPreviewHtml(null);
      setPreviewError("Selecciona una propiedad para ver la vista previa.");
      return;
    }
    if (kind === "CUSTOM" && !customBody.trim()) {
      setPreviewHtml(null);
      setPreviewError("Escribe el mensaje para ver la vista previa.");
      return;
    }
    setPreviewLoading(true);
    const handle = setTimeout(async () => {
      const res = await previewEmail({
        kind,
        propertyId: propertyId ?? undefined,
        customSubject: customSubject.trim() || undefined,
        customBody: customBody.trim() || undefined,
        customDateTime: customDateTime.trim() || undefined,
      });
      if (res.ok) {
        setPreviewHtml(res.html);
        setPreviewError(null);
      } else {
        setPreviewHtml(null);
        setPreviewError(res.error);
      }
      setPreviewLoading(false);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, propertyId, customSubject, customBody, customDateTime]);

  /** Send the field only if the user edited it away from the default. */
  function overrides() {
    const d = defaultsRef.current;
    const subj = customSubject.trim();
    const body = customBody.trim();
    if (kind === "CUSTOM") {
      return {
        customSubject: subj || undefined,
        customBody: body || undefined,
      };
    }
    return {
      customSubject: subj && subj !== d.subject ? subj : undefined,
      customBody: body && body !== d.message ? body : undefined,
    };
  }

  async function send() {
    if (count === 0) {
      toast.error("Selecciona al menos un contacto");
      return;
    }
    if (propertyMissing) {
      toast.error("Esta plantilla requiere una propiedad");
      return;
    }
    if (kind === "CUSTOM" && !customBody.trim()) {
      toast.error("Escribe el contenido del mensaje");
      return;
    }
    setSending(true);
    try {
      const res = await sendTemplatedEmail({
        kind,
        contactIds,
        propertyId: propertyId ?? undefined,
        ...overrides(),
        customDateTime: customDateTime.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error, { duration: 10000 });
        return;
      }
      if (res.sent === 0) {
        toast.error(
          `No se envió ningún email. Errores: ${
            res.details
              .filter((d) => !d.ok)
              .slice(0, 3)
              .map((d) => d.error)
              .join("; ") || "desconocido"
          }`,
          { duration: 10000 }
        );
        return;
      }
      const msg =
        res.failed > 0
          ? `Enviados ${res.sent}, fallaron ${res.failed}`
          : `Enviados ${res.sent} ✓`;
      toast.success(msg);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function testSend() {
    if (propertyMissing) {
      toast.error("Esta plantilla requiere una propiedad");
      return;
    }
    if (kind === "CUSTOM" && !customBody.trim()) {
      toast.error("Escribe el contenido del mensaje");
      return;
    }
    setTesting(true);
    try {
      const res = await sendTestEmail({
        kind,
        propertyId: propertyId ?? undefined,
        ...overrides(),
        customDateTime: customDateTime.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error, { duration: 10000 });
        return;
      }
      toast.success("Email de prueba enviado a tu correo");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !sending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            Enviar email
            {count > 0 && (
              <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {count} contacto{count !== 1 ? "s" : ""}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Plantillas predefinidas con la marca del agente. Reply-to apunta a
            tu correo personal.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[74vh] grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          <div className="space-y-4 p-5 lg:overflow-y-auto">
          {/* Property context */}
          {propertyTitle && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2 text-xs">
              <Home className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Propiedad:</span>
              <span className="truncate text-muted-foreground">
                {propertyTitle}
              </span>
            </div>
          )}

          {/* Template picker */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plantilla
            </label>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {TEMPLATES.map((t) => {
                const active = kind === t.kind;
                const disabled = t.needsProperty && !propertyId;
                return (
                  <button
                    key={t.kind}
                    onClick={() => !disabled && setKind(t.kind)}
                    disabled={disabled}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card/50 hover:border-foreground/20",
                      disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          active ? "text-primary" : ""
                        )}
                      >
                        {t.label}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                        {t.desc}
                      </p>
                      {disabled && (
                        <p className="mt-1 text-[10px] text-amber-600">
                          Necesita propiedad asociada
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DateTime field (for OPEN_HOUSE, APPOINTMENT_CONFIRM) — feeds the
              default subject/message below */}
          {selectedTemplate.needsDateTime && (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fecha y hora
              </label>
              <Input
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                placeholder='Ej: "sábado 8 dic, 3pm" o "mañana a las 10:30am"'
                className="h-9"
              />
            </div>
          )}

          {/* Asunto — editable en todas las plantillas */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Asunto
            </label>
            <Input
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Asunto del email..."
              className="h-9"
            />
          </div>

          {/* Mensaje — prellenado con el texto de la plantilla y editable */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mensaje
            </label>
            <Textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              rows={6}
              placeholder="Escribe el contenido del email..."
              className="resize-none"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Texto sugerido de la plantilla — edítalo a tu gusto. El saludo, tu
              firma{propertyTitle ? ", la tarjeta de la propiedad" : ""} y el
              branding se agregan automáticamente.
            </p>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Sin dominio verificado en Resend, los emails llegan vía
              estaila.com. Para enviar desde tu dominio, conéctalo en{" "}
              <strong>Empresa → Email</strong> (próximamente).
            </span>
          </div>
          </div>

          {/* Live preview */}
          <div className="border-t border-border bg-muted/20 p-4 lg:border-l lg:border-t-0 lg:overflow-y-auto">
            <PreviewPane
              html={previewHtml}
              loading={previewLoading}
              error={previewError}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 border-t border-border px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={testSend}
            disabled={testing || sending}
          >
            {testing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Enviar prueba
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={sending || count === 0}>
            {sending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            {count > 1 ? `Enviar a ${count}` : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewPane({
  html,
  loading,
  error,
}: {
  html: string | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Vista previa
        </p>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </div>
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-white">
        {html ? (
          <iframe
            srcDoc={html}
            title="Vista previa del email"
            sandbox=""
            className="h-[460px] w-full lg:h-full lg:min-h-[460px]"
          />
        ) : (
          <div className="flex h-[460px] items-center justify-center p-6 text-center text-xs text-muted-foreground">
            {error ?? "Generando vista previa..."}
          </div>
        )}
      </div>
    </div>
  );
}
