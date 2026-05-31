"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  FileDown,
  Copy,
  MessageCircle,
  RefreshCw,
  Check,
  Wand2,
} from "lucide-react";
import { GeneratingBar } from "@/components/shared/generating-bar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { generateProposal, recordProposal } from "@/lib/actions/proposal";

type ProposalType = "VENTA" | "INVERSION" | "FINANCIAMIENTO" | "LUJO";
type ProposalTone = "CERCANO" | "FORMAL" | "CARIBENO" | "LUXURY";

type ProposalContent = {
  titulo: string;
  carta: string;
  perfilCliente: string;
  argumentos: string[];
  analisisFinanciero: string;
  barrio: string;
  proximosPasos: string;
  sobreAgente: string;
};

type PropertyLite = {
  id: string;
  title: string;
  location: string | null;
  priceUSD: number | null;
};
type ContactLite = { id: string; name: string; whatsapp: string | null };

const TYPES: { value: ProposalType; labelKey: string; descKey: string }[] = [
  { value: "VENTA", labelKey: "typeSaleLabel", descKey: "typeSaleDesc" },
  { value: "INVERSION", labelKey: "typeInvestmentLabel", descKey: "typeInvestmentDesc" },
  { value: "FINANCIAMIENTO", labelKey: "typeFinancingLabel", descKey: "typeFinancingDesc" },
  { value: "LUJO", labelKey: "typeLuxuryLabel", descKey: "typeLuxuryDesc" },
];

const TONES: { value: ProposalTone; labelKey: string }[] = [
  { value: "CERCANO", labelKey: "toneFriendly" },
  { value: "FORMAL", labelKey: "toneFormal" },
  { value: "CARIBENO", labelKey: "toneCaribbean" },
  { value: "LUXURY", labelKey: "toneLuxury" },
];

export function ProposalWizard({
  properties,
  contacts,
  agentName,
}: {
  properties: PropertyLite[];
  contacts: ContactLite[];
  agentName: string;
}) {
  const { t, locale } = useT();
  const [step, setStep] = useState<"form" | "result">("form");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [propertyId, setPropertyId] = useState("");
  const [mode, setMode] = useState<"contact" | "manual">(
    contacts.length > 0 ? "contact" : "manual"
  );
  const [contactId, setContactId] = useState("");
  const [manualName, setManualName] = useState("");
  const [type, setType] = useState<ProposalType>("VENTA");
  const [tone, setTone] = useState<ProposalTone>("CERCANO");

  const [content, setContent] = useState<ProposalContent | null>(null);
  const [recipientName, setRecipientName] = useState("");

  const property = useMemo(
    () => properties.find((p) => p.id === propertyId) ?? null,
    [properties, propertyId]
  );

  async function onGenerate() {
    if (!propertyId) {
      toast.error(t.documentos.errChooseProperty);
      return;
    }
    setGenerating(true);
    try {
      const r = await generateProposal({
        propertyId,
        contactId: mode === "contact" ? contactId || null : null,
        recipientName: mode === "manual" ? manualName : undefined,
        type,
        tone,
      });
      if (r.ok) {
        setContent(r.content);
        setRecipientName(r.recipientName);
        setSaved(false);
        setStep("result");
      } else {
        toast.error(r.error);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function patch<K extends keyof ProposalContent>(key: K, value: ProposalContent[K]) {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  }

  function plainText(): string {
    if (!content) return "";
    return [
      content.titulo,
      "",
      content.carta,
      "",
      property
        ? `${property.title}${property.location ? ` · ${property.location}` : ""}${
            property.priceUSD != null ? ` · ${formatCurrency(property.priceUSD)}` : ""
          }`
        : "",
      "",
      t.documentos.whyThisPropertyPlain,
      ...content.argumentos.map((a) => `• ${a}`),
      "",
      content.analisisFinanciero,
      "",
      content.barrio,
      "",
      content.proximosPasos,
      "",
      content.sobreAgente,
    ]
      .filter((l) => l !== undefined)
      .join("\n");
  }

  async function recordOnce() {
    if (saved || !property) return;
    try {
      await recordProposal({
        propertyId,
        contactId: mode === "contact" ? contactId || null : null,
        recipientName,
        titulo: content?.titulo ?? t.documentos.proposalFallbackTitle,
      });
      setSaved(true);
    } catch {
      /* no bloquear export por el registro */
    }
  }

  async function onExportPdf() {
    if (!content) return;
    setExporting(true);
    try {
      const html = buildProposalHtml(content, property, recipientName, agentName, {
        locale,
        whyTitle: t.documentos.htmlWhyTitle,
        sectionCarta: t.documentos.fieldCoverLetter,
        sectionFinancial: t.documentos.fieldFinancial,
        sectionBarrio: t.documentos.htmlNeighborhood,
        sectionNextSteps: t.documentos.fieldNextSteps,
        sectionAgent: t.documentos.htmlAboutAgent,
        footerPrefix: t.documentos.htmlFooterPreparedBy,
        footerFor: t.documentos.htmlFooterFor,
      });
      const w = window.open("", "_blank");
      if (!w) {
        toast.error(t.documentos.errPopupBlocked);
        return;
      }
      w.document.write(html);
      w.document.close();
      w.onload = () => {
        w.focus();
        w.print();
      };
      await recordOnce();
    } finally {
      setExporting(false);
    }
  }

  async function onCopy() {
    await navigator.clipboard.writeText(plainText());
    setCopied(true);
    toast.success(t.documentos.toastTextCopied);
    setTimeout(() => setCopied(false), 1800);
    recordOnce();
  }

  function onWhatsApp() {
    const contact = contacts.find((c) => c.id === contactId);
    const phone = contact?.whatsapp?.replace(/[^\d]/g, "");
    const text = encodeURIComponent(plainText());
    window.open(
      phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
    recordOnce();
  }

  // ---------- FORM ----------
  if (step === "form") {
    return (
      <Card className="mx-auto max-w-2xl p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t.documentos.wizardTitle}</h2>
            <p className="text-xs text-muted-foreground">
              {t.documentos.wizardSubtitle}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.documentos.propertyLabel}
            </Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder={t.documentos.choosePropertyPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {properties.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                {t.documentos.noPropertiesWarning}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.documentos.forWhomLabel}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("contact")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  mode === "contact"
                    ? "border-primary/50 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-card/50"
                )}
              >
                {t.documentos.existingContact}
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  mode === "manual"
                    ? "border-primary/50 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-card/50"
                )}
              >
                {t.documentos.newClient}
              </button>
            </div>
            {mode === "contact" ? (
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t.documentos.chooseContactPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={t.documentos.clientNamePlaceholder}
                className="mt-1.5"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.documentos.proposalTypeLabel}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    type === opt.value
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:bg-card/50"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-medium",
                      type === opt.value && "text-primary"
                    )}
                  >
                    {t.documentos[opt.labelKey]}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t.documentos[opt.descKey]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.documentos.toneLabel}
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TONES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTone(opt.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                    tone === opt.value
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-card/50"
                  )}
                >
                  {t.documentos[opt.labelKey]}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={onGenerate}
            disabled={generating || !propertyId}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.documentos.writingWithAi}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t.documentos.generateProposalBtn}
              </>
            )}
          </Button>
          {generating && (
            <GeneratingBar
              durationMs={15000}
              label={t.documentos.writingYourProposal}
              className="mt-3"
            />
          )}
        </div>
      </Card>
    );
  }

  // ---------- RESULT / EDITOR ----------
  if (!content) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep("form")} className="self-start sm:self-auto">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {t.documentos.backBtn}
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={generating} className="w-full sm:w-auto">
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t.documentos.regenerateBtn}
          </Button>
          <Button variant="outline" size="sm" onClick={onCopy} className="w-full sm:w-auto">
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t.documentos.copyBtn}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onWhatsApp}
            className="w-full text-emerald-600 dark:text-emerald-400 sm:w-auto"
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button size="sm" onClick={onExportPdf} disabled={exporting} className="w-full sm:w-auto">
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t.documentos.exportPdfBtn}
          </Button>
        </div>
      </div>

      <Card className="space-y-5 p-6">
        <EditField label={t.documentos.fieldTitle} value={content.titulo} onChange={(v) => patch("titulo", v)} />
        <EditArea label={t.documentos.fieldCoverLetter} value={content.carta} onChange={(v) => patch("carta", v)} />
        {content.perfilCliente && (
          <EditArea
            label={t.documentos.fieldClientDiagnosis}
            value={content.perfilCliente}
            onChange={(v) => patch("perfilCliente", v)}
          />
        )}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.documentos.fieldArguments}
          </Label>
          <Textarea
            rows={5}
            value={content.argumentos.join("\n")}
            onChange={(e) =>
              patch(
                "argumentos",
                e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </div>
        <EditArea
          label={t.documentos.fieldFinancial}
          value={content.analisisFinanciero}
          onChange={(v) => patch("analisisFinanciero", v)}
        />
        <EditArea label={t.documentos.fieldNeighborhood} value={content.barrio} onChange={(v) => patch("barrio", v)} />
        <EditArea
          label={t.documentos.fieldNextSteps}
          value={content.proximosPasos}
          onChange={(v) => patch("proximosPasos", v)}
        />
        <EditArea label={t.documentos.fieldAboutAgent} value={content.sobreAgente} onChange={(v) => patch("sobreAgente", v)} />
      </Card>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function EditArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** HTML branded para imprimir/exportar a PDF (ventana nueva → print). */
function buildProposalHtml(
  c: ProposalContent,
  property: PropertyLite | null,
  recipientName: string,
  agentName: string,
  i18n: {
    locale: string;
    whyTitle: string;
    sectionCarta: string;
    sectionFinancial: string;
    sectionBarrio: string;
    sectionNextSteps: string;
    sectionAgent: string;
    footerPrefix: string;
    footerFor: string;
  }
): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const priceLine =
    property?.priceUSD != null ? formatCurrency(property.priceUSD) : "";
  const args = c.argumentos.map((a) => `<li>${esc(a)}</li>`).join("");
  const section = (title: string, body: string) =>
    body?.trim()
      ? `<section><h2>${esc(title)}</h2><p>${esc(body).replace(/\n/g, "<br>")}</p></section>`
      : "";

  return `<!doctype html><html lang="${i18n.locale}"><head><meta charset="utf-8">
<title>${esc(c.titulo)}</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #16181B; line-height: 1.6; margin: 0; }
  .cover { background: #00BF63; color: #fff; padding: 40px; border-radius: 16px; margin-bottom: 28px; }
  .cover h1 { font-size: 26px; margin: 0 0 8px; }
  .cover .prop { font-size: 14px; opacity: .92; }
  .cover .price { font-size: 22px; font-weight: 700; margin-top: 12px; font-variant-numeric: tabular-nums; }
  section { margin-bottom: 22px; page-break-inside: avoid; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #00BF63; margin: 0 0 6px; }
  p { margin: 0; font-size: 14px; }
  ul { margin: 6px 0 0; padding-left: 18px; font-size: 14px; }
  li { margin-bottom: 5px; }
  .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 12px; color: #6b7280; }
  @media print { .noprint { display: none; } }
</style></head>
<body>
  <div class="cover">
    <h1>${esc(c.titulo)}</h1>
    ${
      property
        ? `<div class="prop">${esc(property.title)}${
            property.location ? ` · ${esc(property.location)}` : ""
          }</div>${priceLine ? `<div class="price">${esc(priceLine)}</div>` : ""}`
        : ""
    }
  </div>
  ${section(i18n.sectionCarta, c.carta)}
  ${c.argumentos.length ? `<section><h2>${esc(i18n.whyTitle)}</h2><ul>${args}</ul></section>` : ""}
  ${section(i18n.sectionFinancial, c.analisisFinanciero)}
  ${section(i18n.sectionBarrio, c.barrio)}
  ${section(i18n.sectionNextSteps, c.proximosPasos)}
  ${section(i18n.sectionAgent, c.sobreAgente)}
  <div class="footer">${esc(i18n.footerPrefix)} ${esc(agentName)} ${esc(i18n.footerFor)} ${esc(recipientName)} · estaila</div>
</body></html>`;
}
