"use client";

import {
  Briefcase,
  Building2,
  Camera,
  Check,
  Copy,
  ExternalLink,
  Hash,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  User as UserIcon,
  Users,
} from "lucide-react";

// lucide-react@1.16 lacks Facebook/Instagram/LinkedIn — use thematic substitutes
const Facebook = Hash;
const Instagram = Camera;
const Linkedin = Briefcase;
import { useEffect, useMemo, useState, useTransition } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPropertyShare } from "@/lib/actions/property-share";
import type { ShareChannel } from "@/lib/share-channels";
import { cn, formatCurrency } from "@/lib/utils";

type Property = {
  id: string;
  title: string;
  location: string | null;
  priceUSD: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  category: string;
  operation: string;
};

type ContactOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  type: string;
};

type RecipientKind = "contact" | "manual" | "anyone";

export function SharePropertyDialog({
  open,
  onOpenChange,
  property,
  agentName,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  property: Property;
  agentName: string;
}) {
  const [recipientKind, setRecipientKind] = useState<RecipientKind>("anyone");
  const [channel, setChannel] = useState<ShareChannel>("WHATSAPP");
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [message, setMessage] = useState("");
  const [tracked, setTracked] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ----------------------------------------------------------
  // Pre-fill message when dialog opens
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    setShareUrl(null);
    const specs = [
      property.bedrooms != null ? `${property.bedrooms} hab` : null,
      property.bathrooms != null ? `${property.bathrooms} baños` : null,
      property.metersSquared != null ? `${property.metersSquared}m²` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const price = formatCurrency(property.priceUSD ?? 0);
    const recipientName =
      recipientKind === "contact" && selectedContactId
        ? contacts.find((c) => c.id === selectedContactId)?.name.split(" ")[0] ??
          "amigo"
        : recipientKind === "manual" && manualName
          ? manualName.split(" ")[0]
          : "";
    const greet = recipientName ? `Hola ${recipientName}` : "Hola";
    setMessage(
      `${greet} 👋\n\nTe comparto esta propiedad que creo te puede interesar 🏠\n\n*${property.title}*\n💰 ${price}${
        specs ? `\n${specs}` : ""
      }${property.location ? `\n📍 ${property.location}` : ""}\n\nMira los detalles aquí:\n{LINK}\n\nCualquier duda me avisas 👋\n— ${agentName}`
    );
  }, [
    open,
    property,
    recipientKind,
    selectedContactId,
    manualName,
    contacts,
    agentName,
  ]);

  // ----------------------------------------------------------
  // Load contacts when needed
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open || recipientKind !== "contact" || contacts.length > 0) return;
    setLoadingContacts(true);
    fetch("/api/contacts/lite")
      .then((r) => r.json())
      .then((data: ContactOption[]) => setContacts(data))
      .catch(() => toast.error("No pude cargar contactos"))
      .finally(() => setLoadingContacts(false));
  }, [open, recipientKind, contacts.length]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );

  // Resolved recipient phone/email for the chosen channel
  const recipient = useMemo(() => {
    if (recipientKind === "contact" && selectedContact) {
      return {
        name: selectedContact.name,
        contactId: selectedContact.id,
        email: selectedContact.email ?? null,
        phone: selectedContact.whatsapp ?? selectedContact.phone ?? null,
      };
    }
    if (recipientKind === "manual") {
      return {
        name: manualName.trim(),
        contactId: undefined,
        email: manualEmail.trim() || null,
        phone: manualPhone.trim() || null,
      };
    }
    return { name: "", contactId: undefined, email: null, phone: null };
  }, [
    recipientKind,
    selectedContact,
    manualName,
    manualEmail,
    manualPhone,
  ]);

  // ----------------------------------------------------------
  // Build the URL (with tracking if enabled), then act on it
  // ----------------------------------------------------------
  function buildAndAct(performAction: (url: string) => void) {
    startTransition(async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        let path = `/propiedad/`;
        let url = "";

        if (tracked) {
          const share = await createPropertyShare({
            propertyId: property.id,
            channel,
            contactId: recipient.contactId,
            message,
          });
          url = `${origin}/r/${share.trackingId}`;
        } else {
          // Need to know the slug — call ensureSlug via createPropertyShare
          // but with a "non-tracking" channel? Simplest: still create share but
          // build /propiedad/{slug} directly.
          const share = await createPropertyShare({
            propertyId: property.id,
            channel: "COPY_LINK",
          });
          url = `${origin}/propiedad/${share.slug}`;
          path = `/propiedad/${share.slug}`;
        }

        setShareUrl(url);
        performAction(url);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function doWhatsApp() {
    if (!recipient.phone && recipientKind !== "anyone") {
      toast.error("Necesito un número de WhatsApp del destinatario.");
      return;
    }
    buildAndAct((url) => {
      const finalMessage = message.replace("{LINK}", url);
      const phone = (recipient.phone || "").replace(/[^\d+]/g, "");
      const cleaned = phone.startsWith("+") ? phone.slice(1) : phone;
      const waUrl = cleaned
        ? `https://wa.me/${cleaned}?text=${encodeURIComponent(finalMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast.success("Abriendo WhatsApp...");
      onOpenChange(false);
    });
  }

  function doEmail() {
    if (!recipient.email) {
      toast.error("Necesito un email del destinatario.");
      return;
    }
    buildAndAct((url) => {
      const finalMessage = message.replace("{LINK}", url);
      const subject = `Propiedad: ${property.title}`;
      const mailto = `mailto:${recipient.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(finalMessage)}`;
      window.location.href = mailto;
      toast.success("Abriendo cliente de correo...");
      onOpenChange(false);
    });
  }

  function doCopy() {
    buildAndAct((url) => {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copiado al portapapeles");
      });
    });
  }

  function doSocial(network: ShareChannel) {
    setChannel(network);
    buildAndAct((url) => {
      const text = message.replace("{LINK}", url);
      let target = "";
      if (network === "FACEBOOK") {
        target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      } else if (network === "LINKEDIN") {
        target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      } else if (network === "INSTAGRAM") {
        navigator.clipboard.writeText(text);
        toast.message("Instagram no permite share por URL. Link copiado.");
        return;
      }
      if (target) window.open(target, "_blank", "noopener,noreferrer");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border bg-card/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            Compartir propiedad
          </DialogTitle>
          <DialogDescription>
            Genera link compartible con tracking opcional. Cada click queda
            registrado en tus analytics.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Recipient kind */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Destinatario
            </p>
            <div className="grid grid-cols-3 gap-2">
              <RecipientButton
                active={recipientKind === "anyone"}
                onClick={() => setRecipientKind("anyone")}
                icon={Users}
                label="Cualquiera"
              />
              <RecipientButton
                active={recipientKind === "contact"}
                onClick={() => setRecipientKind("contact")}
                icon={Users}
                label="Contacto"
              />
              <RecipientButton
                active={recipientKind === "manual"}
                onClick={() => setRecipientKind("manual")}
                icon={UserIcon}
                label="Nuevo"
              />
            </div>

            <div className="mt-3">
              {recipientKind === "anyone" && (
                <p className="rounded-xl border border-dashed border-border bg-background/40 p-3 text-[11px] text-muted-foreground">
                  Sin destinatario fijo. Útil para compartir en redes sociales o
                  pegar el link en grupos.
                </p>
              )}

              {recipientKind === "manual" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Nombre" className="sm:col-span-2">
                    <Input
                      placeholder="María Rodríguez"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      placeholder="cliente@email.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="WhatsApp / Teléfono">
                    <Input
                      placeholder="+1 555 0100"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {recipientKind === "contact" && (
                <div>
                  {loadingContacts ? (
                    <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                      Cargando contactos...
                    </p>
                  ) : contacts.length === 0 ? (
                    <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                      No tienes contactos. Usa &quot;Nuevo&quot; para ingresar
                      manualmente.
                    </p>
                  ) : (
                    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
                      {contacts.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedContactId(c.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                              selectedContactId === c.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-secondary/50"
                            )}
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                              {c.name
                                .split(" ")
                                .slice(0, 2)
                                .map((p) => p[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {c.name}
                              </p>
                              <p className="truncate text-[10px] text-muted-foreground">
                                {c.whatsapp ?? c.phone ?? c.email ?? "—"}
                              </p>
                            </div>
                            {selectedContactId === c.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message editor */}
          <div>
            <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mensaje
            </Label>
            <Textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              <code className="rounded bg-secondary/60 px-1">{`{LINK}`}</code> se
              reemplaza por el link de la propiedad al enviar.
            </p>
          </div>

          {/* Tracking option */}
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-background">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  tracked
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <Building2 className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-medium">Trackear este link</p>
                <p className="text-[11px] text-muted-foreground">
                  Saber cuántas veces se abrió + de qué canal vino
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={tracked}
              onChange={(e) => setTracked(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
          </label>

          {/* Generated link preview */}
          {shareUrl && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Link generado
              </p>
              <code className="mt-1 block break-all rounded-md bg-background/60 p-2 font-mono text-[10px]">
                {shareUrl}
              </code>
            </div>
          )}
        </div>

        {/* Channel actions */}
        <DialogFooter className="grid grid-cols-2 gap-2 border-t border-border bg-card/40 p-3 sm:grid-cols-5">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={doCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => doSocial("FACEBOOK")}
          >
            <Facebook className="h-3.5 w-3.5" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => doSocial("LINKEDIN")}
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={doEmail}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </Button>
          <Button
            variant="ink"
            size="sm"
            disabled={pending}
            onClick={doWhatsApp}
            className="col-span-2 sm:col-span-1"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" />
            )}
            WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecipientButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
