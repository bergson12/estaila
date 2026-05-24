"use client";

/**
 * Dialog genérico para generar documentos.
 *
 * Reemplaza los 4 dialogs viejos (contract-sale / sale-promise / rental-contract / payment-receipt).
 * Pattern:
 *   - Carga plantillas (system + usuario) según `kind`
 *   - Selector de plantilla
 *   - Form de datos (campos según `kind`)
 *   - Preview HTML renderizado vía renderTemplate()
 *   - Botón "Gestionar plantillas" → abre manager
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Settings2, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocShell, FormField } from "./doc-shell";
import {
  DOC_KIND_LABEL,
  type DocKind,
  formatCurrency,
  formatDateEs,
  numberToWords,
  renderTemplate,
} from "@/lib/document-templates";
import { getOrgContext, listTemplates } from "@/lib/actions/document-templates";
import { TemplatesManager } from "./templates-manager";

export type DocProperty = {
  title: string;
  category: string;
  priceUSD: number | null;
  location: string | null;
  address: string | null;
  metersSquared: number | null;
  bedrooms: number | null;
  bathrooms?: number | null;
  parking?: number | null;
};

type Template = {
  id: string;
  userId: string | null;
  kind: DocKind;
  name: string;
  description: string | null;
  body: string;
  source: "MANUAL" | "DOCX" | "SYSTEM";
  isDefault: boolean;
  isSystem: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

export function DocumentDialog({
  open,
  onOpenChange,
  kind,
  property,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: DocKind;
  property: DocProperty;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showManager, setShowManager] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [org, setOrg] = useState<Awaited<ReturnType<typeof getOrgContext>>>(null);

  // ---------- Load templates ----------
  async function loadTemplates() {
    setLoading(true);
    try {
      const rows = (await listTemplates(kind)) as Template[];
      setTemplates(rows);
      // Pick default for kind, fallback to first
      const def = rows.find((r) => r.isDefault) ?? rows[0];
      if (def) setSelectedId((curr) => curr || def.id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadTemplates();
      getOrgContext().then(setOrg).catch(() => setOrg(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  // ---------- Reset form when kind changes / dialog opens ----------
  useEffect(() => {
    if (!open) return;
    setForm(defaultForm(kind, property));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, property.title]);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ---------- Compute derived data ----------
  const data = useMemo(
    () => buildContext(kind, form, property, org),
    [kind, form, property, org]
  );

  // ---------- Render selected template ----------
  const selected = templates.find((t) => t.id === selectedId);
  const renderedHtml = selected ? renderTemplate(selected.body, data) : "";

  return (
    <>
      <DocShell
        open={open}
        onOpenChange={onOpenChange}
        title={DOC_KIND_LABEL[kind]}
        form={
          <>
            {/* Template selector */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Plantilla
                </span>
                <button
                  type="button"
                  onClick={() => setShowManager(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                >
                  <Settings2 className="h-3 w-3" aria-hidden /> Gestionar
                </button>
              </div>
              {loading ? (
                <div className="flex h-9 items-center rounded-md border bg-background px-3 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Cargando plantillas…
                </div>
              ) : templates.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                  Sin plantillas disponibles. Crea o sube una desde «Gestionar».
                </p>
              ) : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Elegir plantilla…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-1.5">
                          {t.isDefault && (
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
                          )}
                          {t.isSystem ? (
                            <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                          ) : null}
                          <span>{t.name}</span>
                          {t.isSystem && (
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                              · Sistema
                            </span>
                          )}
                          {t.source === "DOCX" && (
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                              · DOCX
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selected?.description && (
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  {selected.description}
                </p>
              )}
            </div>

            <div className="-mx-5 mb-4 border-t" />

            {/* Form fields per kind */}
            <FormFields kind={kind} form={form} set={set} />
          </>
        }
        preview={
          selected ? (
            <div
              className="doc-html"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
              Seleccione una plantilla para previsualizar.
            </div>
          )
        }
      />

      <TemplatesManager
        open={showManager}
        onOpenChange={(v) => {
          setShowManager(v);
          if (!v) loadTemplates(); // refrescar al cerrar
        }}
        kind={kind}
      />
    </>
  );
}

// ============================================================
// FORM FIELDS PER KIND
// ============================================================

function FormFields({
  kind,
  form,
  set,
}: {
  kind: DocKind;
  form: Record<string, string>;
  set: (k: string, v: string) => void;
}) {
  if (kind === "CONTRACT_SALE") {
    return (
      <>
        <FormField label="Fecha" type="date" value={form.contractDate || ""} onChange={(v) => set("contractDate", v)} />
        <FormField label="Ciudad" value={form.city || ""} onChange={(v) => set("city", v)} />
        <SectionLabel>Vendedor</SectionLabel>
        <FormField label="Nombre" value={form.sellerName || ""} onChange={(v) => set("sellerName", v)} placeholder="Juan Pérez" />
        <FormField label="Cédula" value={form.sellerId || ""} onChange={(v) => set("sellerId", v)} placeholder="001-1234567-8" />
        <SectionLabel>Comprador</SectionLabel>
        <FormField label="Nombre" value={form.buyerName || ""} onChange={(v) => set("buyerName", v)} placeholder="María Rodríguez" />
        <FormField label="Cédula" value={form.buyerId || ""} onChange={(v) => set("buyerId", v)} placeholder="001-7654321-0" />
        <SectionLabel>Términos</SectionLabel>
        <FormField label="Precio de venta (USD)" type="number" value={form.salePrice || ""} onChange={(v) => set("salePrice", v)} />
        <FormField label="Inicial / depósito (USD)" type="number" value={form.deposit || ""} onChange={(v) => set("deposit", v)} placeholder="20000" />
        <FormField label="Fecha de cierre" type="date" value={form.closingDate || ""} onChange={(v) => set("closingDate", v)} />
        <FormField label="Notario público" value={form.notary || ""} onChange={(v) => set("notary", v)} placeholder="Dr. ..." />
      </>
    );
  }

  if (kind === "SALE_PROMISE") {
    return (
      <>
        <FormField label="Fecha" type="date" value={form.contractDate || ""} onChange={(v) => set("contractDate", v)} />
        <FormField label="Ciudad" value={form.city || ""} onChange={(v) => set("city", v)} />
        <SectionLabel>Promitente vendedor</SectionLabel>
        <FormField label="Nombre" value={form.sellerName || ""} onChange={(v) => set("sellerName", v)} />
        <FormField label="Cédula" value={form.sellerId || ""} onChange={(v) => set("sellerId", v)} />
        <SectionLabel>Promitente comprador</SectionLabel>
        <FormField label="Nombre" value={form.buyerName || ""} onChange={(v) => set("buyerName", v)} />
        <FormField label="Cédula" value={form.buyerId || ""} onChange={(v) => set("buyerId", v)} />
        <SectionLabel>Términos</SectionLabel>
        <FormField label="Precio total (USD)" type="number" value={form.salePrice || ""} onChange={(v) => set("salePrice", v)} />
        <FormField label="Reserva (USD)" type="number" value={form.reservationAmount || ""} onChange={(v) => set("reservationAmount", v)} placeholder="5000" />
        <FormField label="Plazo para firmar" type="date" value={form.signDeadline || ""} onChange={(v) => set("signDeadline", v)} />
        <FormField label="Penalidad (USD, opcional)" type="number" value={form.penalty || ""} onChange={(v) => set("penalty", v)} placeholder="Default = reserva" />
      </>
    );
  }

  if (kind === "RENTAL_CONTRACT") {
    return (
      <>
        <FormField label="Fecha" type="date" value={form.contractDate || ""} onChange={(v) => set("contractDate", v)} />
        <FormField label="Ciudad" value={form.city || ""} onChange={(v) => set("city", v)} />
        <SectionLabel>Arrendador</SectionLabel>
        <FormField label="Nombre" value={form.landlordName || ""} onChange={(v) => set("landlordName", v)} />
        <FormField label="Cédula" value={form.landlordId || ""} onChange={(v) => set("landlordId", v)} />
        <SectionLabel>Inquilino</SectionLabel>
        <FormField label="Nombre" value={form.tenantName || ""} onChange={(v) => set("tenantName", v)} />
        <FormField label="Cédula" value={form.tenantId || ""} onChange={(v) => set("tenantId", v)} />
        <SectionLabel>Términos</SectionLabel>
        <FormField label="Renta mensual (USD)" type="number" value={form.monthlyRent || ""} onChange={(v) => set("monthlyRent", v)} placeholder="1500" />
        <FormField label="Depósito (USD)" type="number" value={form.deposit || ""} onChange={(v) => set("deposit", v)} placeholder="Default = 1 mes" />
        <FormField label="Duración (meses)" type="number" value={form.duration || ""} onChange={(v) => set("duration", v)} />
        <FormField label="Inicio" type="date" value={form.startDate || ""} onChange={(v) => set("startDate", v)} />
        <FormField label="Día de pago" type="number" value={form.paymentDay || ""} onChange={(v) => set("paymentDay", v)} />
        <FormField label="Uso del inmueble" value={form.purpose || ""} onChange={(v) => set("purpose", v)} />
      </>
    );
  }

  // PAYMENT_RECEIPT
  return (
    <>
      <FormField label="N° de recibo" value={form.receiptNumber || ""} onChange={(v) => set("receiptNumber", v)} />
      <FormField label="Fecha" type="date" value={form.contractDate || ""} onChange={(v) => set("contractDate", v)} />
      <FormField label="Ciudad" value={form.city || ""} onChange={(v) => set("city", v)} />
      <SectionLabel>Pagador</SectionLabel>
      <FormField label="Nombre" value={form.payerName || ""} onChange={(v) => set("payerName", v)} />
      <FormField label="Cédula" value={form.payerId || ""} onChange={(v) => set("payerId", v)} />
      <SectionLabel>Receptor</SectionLabel>
      <FormField label="Nombre / empresa" value={form.receiverName || ""} onChange={(v) => set("receiverName", v)} />
      <SectionLabel>Pago</SectionLabel>
      <FormField label="Monto (USD)" type="number" value={form.amount || ""} onChange={(v) => set("amount", v)} />
      <FormField label="Concepto" value={form.concept || ""} onChange={(v) => set("concept", v)} placeholder="Reserva / Inicial / etc." />
      <FormField label="Método" value={form.method || ""} onChange={(v) => set("method", v)} placeholder="Transferencia, Efectivo, …" />
      <FormField label="Referencia" value={form.reference || ""} onChange={(v) => set("reference", v)} placeholder="N° transferencia, opcional" />
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

// ============================================================
// FORM DEFAULTS + DATA CONTEXT
// ============================================================

function defaultForm(kind: DocKind, property: DocProperty): Record<string, string> {
  const t = today();
  const city = property.location ?? "Ciudad";
  if (kind === "CONTRACT_SALE") {
    return {
      contractDate: t,
      city,
      sellerName: "",
      sellerId: "",
      buyerName: "",
      buyerId: "",
      salePrice: String(property.priceUSD ?? ""),
      deposit: "",
      closingDate: "",
      notary: "",
    };
  }
  if (kind === "SALE_PROMISE") {
    return {
      contractDate: t,
      city,
      sellerName: "",
      sellerId: "",
      buyerName: "",
      buyerId: "",
      salePrice: String(property.priceUSD ?? ""),
      reservationAmount: "",
      signDeadline: "",
      penalty: "",
    };
  }
  if (kind === "RENTAL_CONTRACT") {
    return {
      contractDate: t,
      city,
      landlordName: "",
      landlordId: "",
      tenantName: "",
      tenantId: "",
      monthlyRent: "",
      deposit: "",
      duration: "12",
      startDate: t,
      paymentDay: "5",
      purpose: "Vivienda residencial",
    };
  }
  // PAYMENT_RECEIPT
  return {
    receiptNumber: `R-${Date.now().toString().slice(-6)}`,
    contractDate: t,
    city,
    payerName: "",
    payerId: "",
    receiverName: "",
    amount: "",
    concept: "Reserva",
    method: "Transferencia",
    reference: "",
  };
}

function buildContext(
  kind: DocKind,
  form: Record<string, string>,
  property: DocProperty,
  org: Awaited<ReturnType<typeof getOrgContext>> | null
): Record<string, unknown> {
  const num = (k: string) => parseFloat(form[k] || "0") || 0;

  const salePrice = num("salePrice");
  const deposit = num("deposit");
  const reservation = num("reservationAmount");
  const penalty = num("penalty") || reservation;
  const monthlyRent = num("monthlyRent");
  const rentalDeposit = deposit || monthlyRent;
  const amount = num("amount");
  const balance = Math.max(0, salePrice - deposit);

  // endDate calculado para rental
  let endDate = "";
  if (kind === "RENTAL_CONTRACT" && form.startDate) {
    const months = parseInt(form.duration || "12", 10) || 12;
    const d = new Date(form.startDate + "T00:00:00");
    d.setMonth(d.getMonth() + months);
    endDate = d.toISOString().slice(0, 10);
  }

  // formato de fechas (humano)
  const fmtDate = (k: string) => (form[k] ? formatDateEs(form[k]) : "");

  const orgCtx = org
    ? {
        name: org.name ?? "",
        legalName: org.legalName ?? "",
        taxId: org.taxId ?? "",
        email: org.email ?? "",
        phone: org.phone ?? "",
        website: org.website ?? "",
        address: org.address ?? "",
        logoUrl: org.logoUrl ?? "",
        logo: org.logoUrl
          ? `<img src="${org.logoUrl}" alt="${org.name ?? ""}" />`
          : "",
        primaryColor: org.primaryColor ?? "",
        headerBlock: org.headerBlock || "",
      }
    : {
        name: "",
        legalName: "",
        taxId: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        logoUrl: "",
        logo: "",
        primaryColor: "",
        headerBlock: "",
      };

  return {
    today: formatDateEs(today()),
    org: orgCtx,
    property: {
      title: property.title,
      category: property.category,
      address: property.address ?? "",
      location: property.location ?? "",
      metersSquared: property.metersSquared ?? "",
      bedrooms: property.bedrooms ?? "",
      bathrooms: property.bathrooms ?? "",
      parking: property.parking ?? "",
    },
    form: {
      ...form,
      contractDate: fmtDate("contractDate"),
      closingDate: fmtDate("closingDate"),
      signDeadline: fmtDate("signDeadline"),
      startDate: fmtDate("startDate"),
      endDate: endDate ? formatDateEs(endDate) : "",
      // amounts numéricos vienen del form, agrego formatted/words:
      salePriceFormatted: salePrice ? formatCurrency(salePrice) : "",
      salePriceWords: salePrice ? numberToWords(salePrice) : "",
      depositFormatted: deposit ? formatCurrency(deposit) : "",
      balance: balance,
      balanceFormatted: balance ? formatCurrency(balance) : "",
      reservationAmountFormatted: reservation ? formatCurrency(reservation) : "",
      penaltyFormatted: penalty ? formatCurrency(penalty) : "",
      monthlyRentFormatted: monthlyRent ? formatCurrency(monthlyRent) : "",
      depositFormatted_rental: rentalDeposit ? formatCurrency(rentalDeposit) : "",
      amountFormatted: amount ? formatCurrency(amount) : "",
      amountWords: amount ? numberToWords(amount) : "",
    },
  };
}
