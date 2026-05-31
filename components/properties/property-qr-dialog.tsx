"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  QrCode,
  Download,
  Share2,
  Loader2,
  Phone,
  Mail,
  Check,
  Link2,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ensurePropertySlug } from "@/lib/actions/property-share";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

type Props = {
  propertyId: string;
  title: string;
  priceUSD: number | null;
  agentId: string;
  agentName: string;
  agentPhone: string | null;
  agentEmail: string | null;
};

/** Botón + diálogo de QR para una propiedad (use case: cliente frente a la
 * propiedad escanea el QR del celular del agente y abre la landing pública). */
export function PropertyQrButton(props: Props) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <QrCode className="mr-2 h-4 w-4 text-primary" />
        {t.propDialogs.qr}
      </Button>
      {open && <PropertyQrDialog open={open} onOpenChange={setOpen} {...props} />}
    </>
  );
}

function PropertyQrDialog({
  open,
  onOpenChange,
  propertyId,
  title,
  priceUSD,
  agentId,
  agentName,
  agentPhone,
  agentEmail,
}: Props & { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { t } = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const svgWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolver el slug (lo crea si no existe) y armar la URL pública con ?ref.
  useEffect(() => {
    startTransition(async () => {
      try {
        const s = await ensurePropertySlug(propertyId);
        const origin =
          typeof window !== "undefined" ? window.location.origin : "https://estaila.com";
        setSlug(s);
        setUrl(`${origin}/propiedad/${s}?ref=${encodeURIComponent(agentId)}`);
      } catch (e) {
        setError((e as Error).message || t.propDialogs.qrLinkError);
      }
    });
  }, [propertyId, agentId]);

  const fileBase = `qr-${slug ?? propertyId}`;
  const priceStr = priceUSD != null ? formatCurrency(priceUSD) : t.propDialogs.askPrice;

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${fileBase}.png`;
    a.click();
    toast.success(t.propDialogs.qrDownloadedPng);
  }

  function downloadSvg() {
    const svg = svgWrapRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `${fileBase}.svg`;
    a.click();
    URL.revokeObjectURL(objUrl);
    toast.success(t.propDialogs.qrDownloadedSvg);
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.propDialogs.copyFail);
    }
  }

  async function share() {
    if (!url) return;
    const text = `${title} — ${priceStr}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* cancelado */
      }
      return;
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.propDialogs.qrDialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          <h3 className="line-clamp-2 text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-primary">
            {priceStr}
          </p>

          {/* Marco blanco siempre (escanea igual en dark mode) */}
          <div
            ref={svgWrapRef}
            className="my-4 flex h-[244px] w-[244px] items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            {url ? (
              <QRCodeSVG
                value={url}
                size={212}
                level="M"
                marginSize={0}
                fgColor="#16181B"
                bgColor="#ffffff"
              />
            ) : error ? (
              <p className="px-4 text-xs text-destructive">{error}</p>
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t.propDialogs.qrScanHint}
          </p>

          {/* Datos del agente */}
          <div className="mt-3 w-full rounded-xl border border-border bg-card/50 p-3 text-left">
            <p className="text-sm font-medium">{agentName}</p>
            <div className="mt-1 space-y-0.5">
              {agentPhone && (
                <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
                  <Phone className="h-3 w-3" /> {agentPhone}
                </p>
              )}
              {agentEmail && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {agentEmail}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={downloadPng} disabled={!url}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={downloadSvg} disabled={!url}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              SVG
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink} disabled={!url}>
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? t.propDialogs.copied : t.propDialogs.copy}
            </Button>
            <Button variant="ink" size="sm" onClick={share} disabled={!url}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              {t.propDialogs.share}
            </Button>
          </div>
        </div>

        {/* Canvas oculto en alta resolución para exportar PNG nítido (impresión) */}
        {url && (
          <QRCodeCanvas
            ref={canvasRef}
            value={url}
            size={1024}
            level="M"
            marginSize={2}
            fgColor="#16181B"
            bgColor="#ffffff"
            className="hidden"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
