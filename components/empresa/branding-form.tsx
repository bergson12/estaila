"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Globe,
  Image as ImageIcon,
  Lock,
  Palette,
  Save,
  Type,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { updateBranding } from "@/lib/actions/organization";

type OrgInitial = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontPair: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  customDomain: string | null;
  whiteLabel: boolean;
  plan: string;
};

const FONT_PAIRS = [
  { value: "ELEGANT", labelKey: "fontElegant", desc: "Cormorant Garamond + Inter", preview: "Cormorant" },
  { value: "EDITORIAL", labelKey: "fontEditorial", desc: "Playfair Display + Inter", preview: "Playfair" },
  { value: "MODERN", labelKey: "fontModern", desc: "Inter Bold + Inter", preview: "Inter" },
  { value: "MINIMAL", labelKey: "fontMinimal", desc: "Inter Light + Inter", preview: "Inter" },
] as const;

export function BrandingForm({
  initial,
  canEdit,
}: {
  initial: OrgInitial;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useT();
  const [state, setState] = useState({
    name: initial.name,
    logoUrl: initial.logoUrl ?? "",
    primaryColor: initial.primaryColor ?? "#3B82F6",
    secondaryColor: initial.secondaryColor ?? "#8B5CF6",
    accentColor: initial.accentColor ?? "#D9C7A7",
    fontPair: initial.fontPair,
    legalName: initial.legalName ?? "",
    taxId: initial.taxId ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    website: initial.website ?? "",
    address: initial.address ?? "",
    customDomain: initial.customDomain ?? "",
    whiteLabel: initial.whiteLabel,
  });
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAgency = initial.plan === "AGENCY" || initial.plan === "ENTERPRISE";

  function set<K extends keyof typeof state>(k: K, v: (typeof state)[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function save() {
    startTransition(async () => {
      try {
        await updateBranding(initial.id, state as Parameters<typeof updateBranding>[1]);
        toast.success(t.empresa.toastSettingsSaved);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  async function onUploadLogo(file: File) {
    setUploading(true);
    try {
      const { compressImage } = await import("@/lib/compress-image");
      const compressed = await compressImage(file, "avatar");
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error ?? t.empresa.errUpload);
      }
      const data = (await res.json()) as { url: string };
      set("logoUrl", data.url);
      toast.success(t.empresa.toastLogoUploaded);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const dirty = JSON.stringify(initial) !== JSON.stringify({ ...initial, ...state });

  return (
    <div className="space-y-6 pb-32">
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="h-3.5 w-3.5" />
          {t.empresa.onlyOwnerAdminEdit}
        </div>
      )}

      {/* Identity */}
      <Card className="p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          {t.empresa.identity}
        </h3>
        <p className="mb-5 text-xs text-muted-foreground">
          {t.empresa.identityHint}
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">{t.empresa.commercialName}</Label>
            <Input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
              placeholder={t.empresa.commercialNamePlaceholder}
            />
          </div>

          {/* Logo */}
          <div>
            <Label className="text-xs">{t.empresa.logo}</Label>
            <div className="mt-1 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {state.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.logoUrl}
                    alt={state.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadLogo(f);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={!canEdit || uploading}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {uploading ? t.empresa.uploading : t.empresa.uploadLogo}
                </Button>
                {state.logoUrl && canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => set("logoUrl", "")}
                    className="ml-2 text-muted-foreground"
                  >
                    {t.empresa.remove}
                  </Button>
                )}
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {t.empresa.logoHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Colors */}
      <Card className="p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          {t.empresa.brandColors}
        </h3>
        <p className="mb-5 text-xs text-muted-foreground">
          {t.empresa.brandColorsHint}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ColorField
            label={t.empresa.colorPrimary}
            value={state.primaryColor}
            onChange={(v) => set("primaryColor", v)}
            disabled={!canEdit}
          />
          <ColorField
            label={t.empresa.colorSecondary}
            value={state.secondaryColor}
            onChange={(v) => set("secondaryColor", v)}
            disabled={!canEdit}
          />
          <ColorField
            label={t.empresa.colorAccent}
            value={state.accentColor}
            onChange={(v) => set("accentColor", v)}
            disabled={!canEdit}
          />
        </div>

        {/* Live preview */}
        <div className="mt-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.empresa.preview}
          </p>
          <div
            className="flex items-center justify-between rounded-lg p-5 text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${state.primaryColor}, ${state.secondaryColor})`,
            }}
          >
            <div>
              <p
                className="text-xl font-semibold tracking-tight"
                style={{
                  fontFamily:
                    state.fontPair === "ELEGANT"
                      ? "var(--font-cormorant)"
                      : state.fontPair === "EDITORIAL"
                        ? "var(--font-playfair)"
                        : "var(--font-inter)",
                }}
              >
                {state.name || t.empresa.yourCompany}
              </p>
              <p className="text-xs opacity-90">{t.empresa.previewWithColors}</p>
            </div>
            <button
              className="rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: state.accentColor, color: "#0A0908" }}
            >
              CTA
            </button>
          </div>
        </div>
      </Card>

      {/* Typography */}
      <Card className="p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Type className="h-3.5 w-3.5" />
          {t.empresa.typography}
        </h3>
        <p className="mb-5 text-xs text-muted-foreground">
          {t.empresa.typographyHint}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FONT_PAIRS.map((fp) => (
            <button
              key={fp.value}
              onClick={() => canEdit && set("fontPair", fp.value)}
              disabled={!canEdit}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-lg border p-4 text-left transition-all",
                state.fontPair === fp.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/30 hover:bg-muted/50",
                !canEdit && "cursor-not-allowed opacity-60"
              )}
            >
              <div>
                <p className="text-sm font-semibold">{t.empresa[fp.labelKey]}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{fp.desc}</p>
              </div>
              <span
                className="text-2xl"
                style={{
                  fontFamily:
                    fp.value === "ELEGANT"
                      ? "var(--font-cormorant)"
                      : fp.value === "EDITORIAL"
                        ? "var(--font-playfair)"
                        : "var(--font-inter)",
                  fontWeight: fp.value === "MINIMAL" ? 300 : fp.value === "MODERN" ? 700 : 400,
                }}
              >
                Aa
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Business info */}
      <Card className="p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          {t.empresa.legalInfo}
        </h3>
        <p className="mb-5 text-xs text-muted-foreground">
          {t.empresa.legalInfoHint}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">{t.empresa.legalName}</Label>
            <Input
              value={state.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
              placeholder={t.empresa.legalNamePlaceholder}
            />
          </div>
          <div>
            <Label className="text-xs">{t.empresa.taxId}</Label>
            <Input
              value={state.taxId}
              onChange={(e) => set("taxId", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">{t.empresa.businessEmail}</Label>
            <Input
              type="email"
              value={state.email}
              onChange={(e) => set("email", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">{t.empresa.phone}</Label>
            <Input
              value={state.phone}
              onChange={(e) => set("phone", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">{t.empresa.website}</Label>
            <Input
              value={state.website}
              onChange={(e) => set("website", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
              placeholder="https://"
            />
          </div>
          <div>
            <Label className="text-xs">{t.empresa.address}</Label>
            <Input
              value={state.address}
              onChange={(e) => set("address", e.target.value)}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Custom domain + white label (AGENCY) */}
      <Card className={cn("p-6", !isAgency && "opacity-60")}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              {t.empresa.advancedAgency}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.empresa.advancedAgencyHint}
            </p>
          </div>
          {!isAgency && (
            <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-200/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 ring-1 ring-amber-400/30">
              <Lock className="h-2.5 w-2.5" />
              {t.empresa.planAgency}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">{t.empresa.customDomain}</Label>
            <Input
              value={state.customDomain}
              onChange={(e) => set("customDomain", e.target.value)}
              disabled={!canEdit || !isAgency}
              placeholder="agencia.com"
              className="mt-1"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {t.empresa.cnamePrefix} <code className="rounded bg-muted px-1">portals.estaila.com</code>
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">{t.empresa.whiteLabelMode}</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.empresa.whiteLabelHint}
              </p>
            </div>
            <Switch
              checked={state.whiteLabel}
              onCheckedChange={(v) => set("whiteLabel", v)}
              disabled={!canEdit || !isAgency}
            />
          </div>
        </div>
      </Card>

      {/* Save bar */}
      {canEdit && (
        <div
          className={cn(
            "pointer-events-auto fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all",
            dirty ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {!dirty && <Save className="h-4 w-4 text-muted-foreground" />}
          {dirty && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <span className="text-sm font-medium">
            {dirty ? t.empresa.unsavedChanges : t.empresa.allSaved}
          </span>
          {dirty && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState({
                  name: initial.name,
                  logoUrl: initial.logoUrl ?? "",
                  primaryColor: initial.primaryColor ?? "#3B82F6",
                  secondaryColor: initial.secondaryColor ?? "#8B5CF6",
                  accentColor: initial.accentColor ?? "#D9C7A7",
                  fontPair: initial.fontPair,
                  legalName: initial.legalName ?? "",
                  taxId: initial.taxId ?? "",
                  email: initial.email ?? "",
                  phone: initial.phone ?? "",
                  website: initial.website ?? "",
                  address: initial.address ?? "",
                  customDomain: initial.customDomain ?? "",
                  whiteLabel: initial.whiteLabel,
                })}
                disabled={pending}
              >
                {t.empresa.discard}
              </Button>
              <Button size="sm" onClick={save} disabled={pending}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {t.empresa.save}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent disabled:cursor-not-allowed"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-7 border-0 bg-transparent p-0 font-mono text-xs uppercase shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
