"use client";

import { useState, useMemo } from "react";
import {
  MessageCircle,
  Send,
  Sparkles,
  Calendar,
  FileText,
  Home,
  HandHeart,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Compositor de mensaje WhatsApp con templates pre-cargados.
 * Abre wa.me con el texto codificado al enviar.
 */

type Template = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** {name} y {agente} se reemplazan. Otros placeholders se dejan literal. */
  body: (ctx: { name: string; agent: string }) => string;
};

const TEMPLATES: Template[] = [
  {
    id: "saludo",
    label: "Saludo inicial",
    icon: HandHeart,
    body: ({ name, agent }) =>
      `Hola ${name}, soy ${agent}. Gracias por interesarte en nuestras propiedades. ¿En qué puedo ayudarte hoy?`,
  },
  {
    id: "propiedad",
    label: "Propiedad nueva",
    icon: Home,
    body: ({ name }) =>
      `Hola ${name}, tengo una propiedad que creo te puede interesar. ¿Te envío los detalles y fotos?`,
  },
  {
    id: "visita",
    label: "Confirmar visita",
    icon: Calendar,
    body: ({ name }) =>
      `Hola ${name}, te confirmo nuestra visita para [fecha] a las [hora] en [dirección]. Cualquier cambio me avisas. ¡Nos vemos!`,
  },
  {
    id: "seguimiento",
    label: "Seguimiento",
    icon: Sparkles,
    body: ({ name }) =>
      `Hola ${name}, espero estés muy bien. Quería darle seguimiento a nuestra conversación. ¿Sigue activo tu interés en la propiedad?`,
  },
  {
    id: "documento",
    label: "Documento listo",
    icon: FileText,
    body: ({ name }) =>
      `Hola ${name}, ya tengo listo el documento que te comenté. ¿Te lo envío por aquí o prefieres por correo?`,
  },
];

export function WhatsAppDialog({
  open,
  onOpenChange,
  contactId,
  contact,
  agentName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactId?: string;
  contact: { name: string; whatsapp: string | null; phone: string | null };
  agentName: string;
}) {
  const firstName = contact.name.split(/\s+/)[0] || contact.name;
  const phone = (contact.whatsapp ?? contact.phone ?? "").replace(/\D/g, "");

  const [selectedId, setSelectedId] = useState<string>("saludo");
  const [draft, setDraft] = useState<string>(() =>
    TEMPLATES[0].body({ name: firstName, agent: agentName })
  );

  function pickTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setSelectedId(id);
    setDraft(t.body({ name: firstName, agent: agentName }));
  }

  const canSend = phone.length >= 7 && draft.trim().length > 0;
  const charCount = draft.length;

  const waUrl = useMemo(() => {
    if (!canSend) return "#";
    return `https://wa.me/${phone}?text=${encodeURIComponent(draft)}`;
  }, [phone, draft, canSend]);

  async function handleSend() {
    if (!canSend) return;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    // Log activity (fire-and-forget; we don't want to delay opening WA)
    if (contactId) {
      try {
        const { logWhatsAppSent } = await import("@/lib/actions/contact-polish");
        await logWhatsAppSent({ contactId, message: draft });
      } catch {
        // silent — don't block UX
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600">
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
            </span>
            Enviar a {firstName} por WhatsApp
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>Personaliza el mensaje antes de enviarlo.</span>
            {phone ? (
              <Badge
                variant="outline"
                className="font-mono text-[10px] tabular-nums"
              >
                +{phone}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px]">
                Sin número
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Templates */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plantillas rápidas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              const active = selectedId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTemplate(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                    active
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="font-semibold">Mensaje</span>
            <span
              className={cn(
                "font-mono tabular-nums",
                charCount > 1000 && "text-amber-500",
                charCount > 4000 && "text-destructive"
              )}
            >
              {charCount} car.
            </span>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Escribe tu mensaje..."
            className="resize-none font-sans text-sm leading-relaxed"
          />
        </div>

        {/* Preview (WhatsApp-style bubble) */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            <MessageCircle className="h-3 w-3" strokeWidth={2} />
            Vista previa
          </p>
          <div className="rounded-lg rounded-tl-sm bg-card p-3 shadow-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {draft || (
                <span className="italic text-muted-foreground">
                  Vacío — escribe algo arriba
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="bg-emerald-500 hover:bg-emerald-500/90 text-white"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
