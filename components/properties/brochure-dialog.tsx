"use client";

import {
  Check,
  FileText,
  Loader2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { GeneratingBar } from "@/components/shared/generating-bar";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

type ContactOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

type RecipientKind = "none" | "contact" | "manual";

export function BrochureDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  propertyId: string;
  propertyTitle: string;
}) {
  const { t } = useT();
  const [recipientKind, setRecipientKind] = useState<RecipientKind>("none");
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Default greeting when recipient changes
  useEffect(() => {
    if (!open) return;
    if (recipientKind === "contact" && selectedContactId) {
      const c = contacts.find((x) => x.id === selectedContactId);
      if (c) {
        const first = c.name.split(" ")[0];
        setPersonalMessage(
          `${t.propDialogs.greetHi} ${first},\n\n${t.propDialogs.brochureMsgContact}`
        );
      }
    } else if (recipientKind === "manual" && manualName) {
      setPersonalMessage(
        `${t.propDialogs.greetHi} ${manualName.split(" ")[0]},\n\n${t.propDialogs.brochureMsgManual}`
      );
    } else {
      setPersonalMessage("");
    }
  }, [open, recipientKind, selectedContactId, manualName, contacts, t]);

  // Load contacts when needed
  useEffect(() => {
    if (!open || recipientKind !== "contact" || contacts.length > 0) return;
    setLoadingContacts(true);
    fetch("/api/contacts/lite")
      .then((r) => r.json())
      .then((data: ContactOption[]) => setContacts(data))
      .catch(() => toast.error(t.propDialogs.contactsLoadError))
      .finally(() => setLoadingContacts(false));
  }, [open, recipientKind, contacts.length]);

  async function generate() {
    setGenerating(true);
    try {
      const body: Record<string, unknown> = {
        personalMessage: personalMessage.trim() || null,
      };
      if (recipientKind === "contact" && selectedContactId) {
        body.contactId = selectedContactId;
      } else if (recipientKind === "manual") {
        body.recipientName = manualName.trim() || null;
        body.recipientEmail = manualEmail.trim() || null;
        body.recipientPhone = manualPhone.trim() || null;
      }

      // 1) Server returns the JSON payload (Cloudflare Workers can't run
      //    @react-pdf/renderer because it relies on Node-only APIs).
      const res = await fetch(`/api/properties/${propertyId}/brochure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const payload = (await res.json()) as {
        property: import("@/components/property-public/pdf/brochure-standard").BrochureData["property"];
        agent: import("@/components/property-public/pdf/brochure-standard").BrochureData["agent"];
        recipient: import("@/components/property-public/pdf/brochure-standard").BrochureData["recipient"];
        personalMessage: string | null;
        publicUrl: string;
        generatedAtISO: string;
      };

      // 2) Dynamic-import the PDF renderer so it never lands in the
      //    edge-runtime bundle. Render in browser memory, then download.
      const [{ pdf }, { BrochureStandard }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/property-public/pdf/brochure-standard"),
      ]);

      const doc = BrochureStandard({
        data: {
          ...payload,
          generatedAt: new Date(payload.generatedAtISO),
        },
      });
      const blob = await pdf(doc).toBlob();

      // 3) Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = propertyTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60);
      a.download = `brochure-${safe}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(t.propDialogs.brochureGenerated, {
        description: t.propDialogs.brochureDownloading,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border bg-card/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            {t.propDialogs.brochureTitle}
          </DialogTitle>
          <DialogDescription>
            {t.propDialogs.brochureDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Recipient kind */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.propDialogs.forWhom}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <RecipientButton
                active={recipientKind === "none"}
                onClick={() => setRecipientKind("none")}
                icon={FileText}
                label={t.propDialogs.recipientGeneric}
              />
              <RecipientButton
                active={recipientKind === "contact"}
                onClick={() => setRecipientKind("contact")}
                icon={Users}
                label={t.propDialogs.recipientContact}
              />
              <RecipientButton
                active={recipientKind === "manual"}
                onClick={() => setRecipientKind("manual")}
                icon={UserIcon}
                label={t.propDialogs.recipientNew}
              />
            </div>

            <div className="mt-3">
              {recipientKind === "none" && (
                <p className="rounded-xl border border-dashed border-border bg-background/40 p-3 text-[11px] text-muted-foreground">
                  {t.propDialogs.brochureGenericHint}
                </p>
              )}

              {recipientKind === "manual" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t.propDialogs.fieldName} className="sm:col-span-2">
                    <Input
                      placeholder="María Rodríguez"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </Field>
                  <Field label={t.propDialogs.fieldEmail}>
                    <Input
                      type="email"
                      placeholder="cliente@email.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </Field>
                  <Field label={t.propDialogs.fieldWhatsapp}>
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
                      {t.propDialogs.loadingContacts}
                    </p>
                  ) : contacts.length === 0 ? (
                    <p className="rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                      {t.propDialogs.noContactsYet}
                    </p>
                  ) : (
                    <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
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
            </div>
          </div>

          {/* Personal message */}
          <div>
            <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.propDialogs.personalMessageLabel}
            </Label>
            <Textarea
              rows={5}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder={t.propDialogs.personalMessagePlaceholder}
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {t.propDialogs.personalMessageHint}
            </p>
          </div>
        </div>

        {generating && (
          <GeneratingBar
            durationMs={20000}
            label={t.propDialogs.brochureGenerating}
            className="px-6 pb-1"
          />
        )}

        <DialogFooter className="border-t border-border bg-card/40 px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            {t.propDialogs.cancel}
          </Button>
          <Button onClick={generate} disabled={generating} variant="ink">
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t.propDialogs.generateDownload}
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
  icon: typeof FileText;
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
