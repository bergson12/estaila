"use client";

import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  Send,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { cn, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

type Tx = {
  id: string;
  concept: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  propertyId: string | null;
  propertyTitle: string | null;
};

type ContactOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  type: string;
};

type RecipientKind = "contact" | "owner" | "manual";
type Channel = "whatsapp" | "email";

export function SendInvoiceDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  transaction: Tx;
}) {
  const { t } = useT();
  const [recipientKind, setRecipientKind] = useState<RecipientKind>("manual");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);

  const invoiceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/i/${transaction.id}`
      : `/i/${transaction.id}`;

  // ----------------------------------------------------------
  // Default message body
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const isIncome = transaction.category === "INGRESO";
    const verb = isIncome ? t.finanzas.msgVerbReceipt : t.finanzas.msgVerbVoucher;
    const amt = formatCurrency(transaction.amount, transaction.currency as "USD" | "DOP");
    const propertyLine = transaction.propertyTitle
      ? `\n${t.finanzas.msgPropertyLine.replace("{property}", transaction.propertyTitle)}`
      : "";
    setMessage(
      t.finanzas.msgBody
        .replace("{verb}", verb)
        .replace("{concept}", transaction.concept)
        .replace("{amount}", amt)
        .replace("{propertyLine}", propertyLine)
        .replace("{url}", invoiceUrl)
    );
  }, [open, transaction, invoiceUrl, t]);

  // ----------------------------------------------------------
  // Load contacts when needed
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open || recipientKind !== "contact" || contacts.length > 0) return;
    setLoadingContacts(true);
    fetch("/api/contacts/lite")
      .then((r) => r.json())
      .then((data: ContactOption[]) => setContacts(data))
      .catch(() => toast.error(t.finanzas.toastContactsError))
      .finally(() => setLoadingContacts(false));
  }, [open, recipientKind, contacts.length, t]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );

  // ----------------------------------------------------------
  // Resolved recipient (email/phone) for the chosen kind
  // ----------------------------------------------------------
  const recipient = useMemo(() => {
    if (recipientKind === "contact" && selectedContact) {
      return {
        name: selectedContact.name,
        email: selectedContact.email ?? null,
        phone: selectedContact.whatsapp ?? selectedContact.phone ?? null,
      };
    }
    if (recipientKind === "manual") {
      return {
        name: manualName.trim() || t.finanzas.recipientFallback,
        email: manualEmail.trim() || null,
        phone: manualPhone.trim() || null,
      };
    }
    return { name: "", email: null, phone: null };
  }, [recipientKind, selectedContact, manualName, manualEmail, manualPhone, t]);

  // ----------------------------------------------------------
  // Send via channel
  // ----------------------------------------------------------
  function send() {
    if (channel === "whatsapp") {
      const phone = (recipient.phone || "").replace(/[^\d+]/g, "");
      if (!phone) {
        toast.error(t.finanzas.toastNeedWhatsapp);
        return;
      }
      const cleaned = phone.startsWith("+") ? phone.slice(1) : phone;
      const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success(t.finanzas.toastOpeningWhatsapp);
      onOpenChange(false);
      return;
    }
    if (channel === "email") {
      if (!recipient.email) {
        toast.error(t.finanzas.toastNeedEmail);
        return;
      }
      const subject = t.finanzas.emailSubject.replace("{concept}", transaction.concept);
      const url = `mailto:${recipient.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(message)}`;
      window.location.href = url;
      toast.success(t.finanzas.toastOpeningEmail);
      onOpenChange(false);
      return;
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(invoiceUrl).then(() => {
      toast.success(t.finanzas.toastLinkCopied);
    });
  }

  const canSend =
    channel === "whatsapp"
      ? !!recipient.phone
      : channel === "email"
        ? !!recipient.email
        : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-card/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            {t.finanzas.sendDialogTitle}
          </DialogTitle>
          <DialogDescription>
            {t.finanzas.sendDialogDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Public link preview + copy */}
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.finanzas.publicLinkLabel}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-secondary/60 px-2 py-1 font-mono text-[11px]">
                {invoiceUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLink}
              >
                <Copy className="mr-1.5 h-3 w-3" />
                {t.finanzas.copy}
              </Button>
            </div>
          </div>

          {/* Channel selector */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.finanzas.channel}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ChannelButton
                active={channel === "whatsapp"}
                onClick={() => setChannel("whatsapp")}
                icon={MessageCircle}
                label="WhatsApp"
                hint={t.finanzas.channelWhatsappHint}
              />
              <ChannelButton
                active={channel === "email"}
                onClick={() => setChannel("email")}
                icon={Mail}
                label="Email"
                hint={t.finanzas.channelEmailHint}
              />
            </div>
          </div>

          {/* Recipient kind */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.finanzas.recipient}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <RecipientButton
                active={recipientKind === "manual"}
                onClick={() => setRecipientKind("manual")}
                icon={UserIcon}
                label={t.finanzas.recipientNew}
              />
              <RecipientButton
                active={recipientKind === "contact"}
                onClick={() => setRecipientKind("contact")}
                icon={Users}
                label={t.finanzas.recipientContact}
              />
              <RecipientButton
                active={recipientKind === "owner"}
                onClick={() => setRecipientKind("owner")}
                icon={Building2}
                label={t.finanzas.recipientOwner}
                disabled={!transaction.propertyId}
              />
            </div>

            {/* Form per kind */}
            <div className="mt-3">
              {recipientKind === "manual" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t.finanzas.recipientName}>
                    <Input
                      placeholder={t.finanzas.recipientNamePlaceholder}
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </Field>
                  <Field label={t.finanzas.recipientEmail}>
                    <Input
                      type="email"
                      placeholder={t.finanzas.recipientEmailPlaceholder}
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </Field>
                  <Field
                    label={t.finanzas.recipientPhone}
                    className="sm:col-span-2"
                  >
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
                      {t.finanzas.loadingContacts}
                    </p>
                  ) : contacts.length === 0 ? (
                    <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                      {t.finanzas.noContacts}
                    </p>
                  ) : (
                    <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
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
                                {c.email ?? c.whatsapp ?? c.phone ?? "—"}
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

              {recipientKind === "owner" && (
                <OwnerLookup
                  propertyId={transaction.propertyId}
                  onResolved={(email, phone, name) => {
                    setManualEmail(email ?? "");
                    setManualPhone(phone ?? "");
                    setManualName(name);
                  }}
                />
              )}
            </div>
          </div>

          {/* Message editor */}
          <div>
            <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.finanzas.message}
            </Label>
            <Textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {t.finanzas.messageHint}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-card/40 px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t.finanzas.cancel}
          </Button>
          <Button onClick={send} disabled={!canSend} variant="ink">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {channel === "whatsapp" ? t.finanzas.sendViaWhatsapp : t.finanzas.sendViaEmail}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// CHANNEL BUTTON
// ============================================================

function ChannelButton({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-ink bg-ink text-ink-foreground"
          : "border-border bg-card hover:border-foreground/20 hover:bg-secondary/50"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-white/15" : "bg-secondary text-primary"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p
          className={cn(
            "text-[10px]",
            active ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {hint}
        </p>
      </div>
    </button>
  );
}

function RecipientButton({
  active,
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40"
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

// ============================================================
// OWNER LOOKUP — fetches property owner via API
// ============================================================

function OwnerLookup({
  propertyId,
  onResolved,
}: {
  propertyId: string | null;
  onResolved: (
    email: string | null,
    phone: string | null,
    name: string
  ) => void;
}) {
  const { t } = useT();
  const [owner, setOwner] = useState<{
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    fetch(`/api/properties/${propertyId}/owner`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setOwner(data);
          onResolved(
            data.email,
            data.whatsapp ?? data.phone,
            data.name
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  if (!propertyId) {
    return (
      <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        {t.finanzas.ownerNoProperty}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        {t.finanzas.ownerLoading}
      </p>
    );
  }

  if (!owner) {
    return (
      <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        {t.finanzas.ownerNotConfigured}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Building2 className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{owner.name}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          {owner.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-2.5 w-2.5" />
              {owner.email}
            </span>
          )}
          {(owner.whatsapp || owner.phone) && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" />
              {owner.whatsapp ?? owner.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
