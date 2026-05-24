"use client";

/**
 * Custom Domain Configuration — DNS-verify flow.
 *
 * Steps:
 *  1. User enters a domain → server generates verify token
 *  2. UI shows DNS records to add (TXT for verification + CNAME for routing)
 *  3. User clicks "Verificar" → server queries DNS TXT for token match
 *  4. Status: Pendiente / Verificado / Error
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Globe,
  Lock,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLAN_HAS_CUSTOM_DOMAIN, type PlanKey } from "@/lib/billing-config";

export function DomainSection({
  orgId,
  plan,
  customDomain,
  domainVerifyToken,
  domainVerifiedAt,
  canEdit,
}: {
  orgId: string;
  plan: string;
  customDomain: string | null;
  domainVerifyToken: string | null;
  domainVerifiedAt: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [domain, setDomain] = useState("");
  const [pending, setPending] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; detail: string } | null>(null);

  const planSupported = PLAN_HAS_CUSTOM_DOMAIN[plan as PlanKey] ?? false;
  const verified = !!domainVerifiedAt;

  async function handleSave() {
    if (!domain.trim()) return;
    setPending(true);
    try {
      const { setCustomDomain } = await import("@/lib/actions/team");
      const r = await setCustomDomain(orgId, domain.trim());
      toast.success(`Dominio configurado: ${r.domain}`);
      setDomain("");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleVerify() {
    setPending(true);
    setVerifyResult(null);
    try {
      const { verifyCustomDomain } = await import("@/lib/actions/team");
      const r = await verifyCustomDomain(orgId);
      setVerifyResult({ ok: r.verified, detail: r.detail });
      if (r.verified) {
        toast.success("Dominio verificado");
        startTransition(() => router.refresh());
      } else {
        toast.error("Verificación fallida");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleClear() {
    if (!confirm("¿Quitar el dominio personalizado?")) return;
    setPending(true);
    try {
      const { clearCustomDomain } = await import("@/lib/actions/team");
      await clearCustomDomain(orgId);
      toast.success("Dominio eliminado");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              Dominio personalizado
              {!planSupported && <Badge variant="outline" className="text-[9px]"><Lock className="mr-0.5 h-2.5 w-2.5" /> Business+</Badge>}
              {verified && (
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                  <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Verificado
                </Badge>
              )}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sirve tu portal y emails desde tu propio dominio (ej. <code className="rounded bg-muted px-1 text-[10px]">tudominio.com</code>).
            </p>
          </div>
        </div>
      </div>

      {!planSupported ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
                Dominio personalizado disponible en Business y Agency
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tu plan actual <span className="font-mono">{plan}</span> no incluye esta función.
              </p>
              <Button asChild size="sm" className="mt-3">
                <a href="/pricing">Ver planes</a>
              </Button>
            </div>
          </div>
        </div>
      ) : !customDomain ? (
        // No domain set — show form
        <div className="space-y-3">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tu dominio
          </label>
          <div className="flex gap-2">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="tudominio.com"
              disabled={!canEdit || pending}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <Button onClick={handleSave} disabled={!canEdit || !domain.trim() || pending}>
              {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Globe className="mr-1.5 h-3.5 w-3.5" />}
              Configurar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Necesitas acceso a los registros DNS del dominio. Funciona con cualquier registrar (GoDaddy, Namecheap, Cloudflare).
          </p>
        </div>
      ) : (
        // Domain set — show DNS instructions + verify
        <div className="space-y-5">
          {/* Current domain pill */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  verified ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                )}
              >
                {verified ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-mono text-sm font-semibold">{customDomain}</p>
                <p className="text-[11px] text-muted-foreground">
                  {verified
                    ? `Verificado · ${new Date(domainVerifiedAt!).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Pendiente de verificación DNS"}
                </p>
              </div>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleClear}
                disabled={pending}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Quitar
              </Button>
            )}
          </div>

          {/* DNS records */}
          {!verified && domainVerifyToken && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Configura estos registros DNS
              </p>
              <DnsRecord
                type="TXT"
                host={`_rex-verify.${customDomain}`}
                value={domainVerifyToken}
                note="Verifica la propiedad del dominio"
              />
              <DnsRecord
                type="CNAME"
                host={customDomain}
                value="portal.estaila.com"
                note="Apunta el tráfico web al portal estaila"
              />

              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
                <div className="flex items-start gap-2.5 text-sm">
                  <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                  <div>
                    <p className="font-medium">¿Ya agregaste los registros?</p>
                    <p className="text-[11px] text-muted-foreground">
                      La propagación DNS puede tardar entre minutos y 48h.
                    </p>
                  </div>
                </div>
                <Button onClick={handleVerify} disabled={pending} size="sm">
                  {pending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Verificar ahora
                </Button>
              </div>

              <AnimatePresence>
                {verifyResult && !verifyResult.ok && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 rounded-lg border border-destructive/30 bg-destructive/[0.05] p-3 text-xs"
                  >
                    <p className="font-medium text-destructive">Verificación fallida</p>
                    <p className="mt-1 text-muted-foreground">{verifyResult.detail}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {verified && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="text-sm">
                  <p className="font-medium">Dominio activo</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Tu portal está disponible en{" "}
                    <a
                      href={`https://${customDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-foreground underline"
                    >
                      https://{customDomain}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// DNS Record block (copyable)
// ============================================================

function DnsRecord({
  type,
  host,
  value,
  note,
}: {
  type: "TXT" | "CNAME" | "A";
  host: string;
  value: string;
  note?: string;
}) {
  const [copied, setCopied] = useState<"host" | "value" | null>(null);

  function copy(field: "host" | "value", text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card/40">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5">
        <Badge variant="outline" className="font-mono text-[10px]">
          {type}
        </Badge>
        {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
      </div>
      <div className="divide-y divide-border">
        <DnsRow
          label="Host / Nombre"
          value={host}
          onCopy={() => copy("host", host)}
          copied={copied === "host"}
        />
        <DnsRow
          label="Valor / Apunta a"
          value={value}
          onCopy={() => copy("value", value)}
          copied={copied === "value"}
        />
      </div>
    </div>
  );
}

function DnsRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr_auto] items-center gap-3 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <code className="overflow-x-auto whitespace-nowrap font-mono text-[11px] text-foreground">
        {value}
      </code>
      <button
        type="button"
        onClick={onCopy}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Copiar"
      >
        {copied ? (
          <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Clipboard className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
