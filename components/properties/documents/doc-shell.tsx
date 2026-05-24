"use client";

import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shared shell for legal document generators.
 * Pattern: left = form (fillable fields), right = live preview.
 * "Imprimir" triggers window.print() — browser saves as PDF natively.
 */

export function DocShell({
  open,
  onOpenChange,
  title,
  form,
  preview,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  form: React.ReactNode;
  preview: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[1200px] p-0 sm:max-w-[95vw] h-[92vh] flex flex-col gap-0"
      >
        {/* Header — hidden on print */}
        <div className="flex items-center justify-between border-b bg-card px-5 py-3 print:hidden">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Imprimir / Guardar PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body: 2-col layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Form column */}
          <div className="hide-scrollbar w-[380px] shrink-0 overflow-y-auto border-r bg-muted/20 p-5 print:hidden">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Datos del documento
            </p>
            {form}
          </div>

          {/* Preview column — legal paper (8.5" × 14") */}
          <div className="hide-scrollbar flex-1 overflow-y-auto bg-muted/30">
            <div className="mx-auto my-6 doc-page bg-white text-black shadow-lg print:m-0 print:shadow-none">
              <div className="doc-preview">{preview}</div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          /* Legal paper proportions on screen — 8.5" × 14" at ~96dpi → 816 × 1344 px */
          .doc-page {
            width: 816px;
            min-height: 1344px;
            max-width: 100%;
            padding: 64px 72px;
            box-sizing: border-box;
          }
          @media (max-width: 900px) {
            .doc-page {
              width: 100%;
              padding: 32px 24px;
            }
          }

          /* Print: legal size, no chrome */
          @media print {
            @page {
              size: 8.5in 14in;
              margin: 0.5in;
            }
            body * {
              visibility: hidden;
            }
            .doc-preview,
            .doc-preview * {
              visibility: visible;
            }
            .doc-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              color: black;
              padding: 0;
            }
          }

          /* Branded org header (logo + datos empresa) */
          .doc-preview .org-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            padding-bottom: 12px;
            margin: -8px 0 22px;
          }
          .doc-preview .org-header-logo img {
            max-height: 56px;
            max-width: 220px;
            object-fit: contain;
            display: block;
          }
          .doc-preview .org-header-meta {
            text-align: right;
            font-family: Georgia, serif;
            font-size: 10.5px;
            line-height: 1.45;
            color: #333;
          }
          .doc-preview .org-header-meta strong {
            font-size: 12px;
            color: #111;
          }

          /* Document body rich-text styles (for renderTemplate HTML output) */
          .doc-preview h1 {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 22px;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            border-bottom: 2px solid #111;
            padding-bottom: 14px;
            margin: 0 0 22px;
          }
          .doc-preview h2 {
            font-family: Georgia, serif;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin: 22px 0 8px;
          }
          .doc-preview h3 {
            font-family: Georgia, serif;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin: 18px 0 6px;
            color: #111;
          }
          .doc-preview p {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 13px;
            line-height: 1.7;
            text-align: justify;
            color: #1a1a1a;
            margin: 0 0 10px;
          }
          .doc-preview ul,
          .doc-preview ol {
            font-family: Georgia, serif;
            font-size: 13px;
            line-height: 1.7;
            color: #1a1a1a;
            padding-left: 22px;
            margin: 0 0 12px;
          }
          .doc-preview li {
            margin-bottom: 4px;
          }
          .doc-preview strong {
            font-weight: 700;
            color: #000;
          }
          .doc-preview em {
            font-style: italic;
          }
          .doc-preview .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            margin-top: 56px;
            padding-top: 48px;
          }
          .doc-preview .signatures > div {
            text-align: center;
          }
          .doc-preview .signatures p:first-child {
            border-top: 1px solid #111;
            padding-top: 8px;
            margin: 0;
          }
          .doc-preview .legal-footer {
            margin-top: 24px;
            font-size: 10px;
            color: #666;
            text-align: center;
            font-style: italic;
          }
          .doc-preview .receipt-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 2px solid #111;
            padding-bottom: 14px;
            margin-bottom: 22px;
          }
          .doc-preview .receipt-head h1 {
            border: none;
            text-align: left;
            margin: 0;
            padding: 0;
          }
          .doc-preview .receipt-number {
            text-align: right;
            font-family: ui-monospace, Menlo, monospace;
            font-size: 14px;
          }
          .doc-preview .receipt-amount {
            border: 2px solid #111;
            padding: 18px;
            margin: 18px 0;
            border-radius: 4px;
          }
          .doc-preview .receipt-amount .label {
            font-size: 10px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #555;
            margin: 0;
          }
          .doc-preview .receipt-amount .amount {
            font-family: ui-monospace, Menlo, monospace;
            font-size: 30px;
            font-weight: 700;
            margin: 6px 0 2px;
          }
          .doc-preview .receipt-amount .words {
            font-style: italic;
            color: #555;
            font-size: 12px;
            margin: 0;
          }
          .doc-preview .meta {
            font-size: 12px;
            color: #555;
          }
          .doc-preview .footer-note {
            margin-top: 20px;
            font-size: 11px;
            color: #555;
          }

          .hide-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .hide-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .hide-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.15);
            border-radius: 3px;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Common A4 document preview style.
 * Use inside `preview` slot of DocShell.
 */
export function DocPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-4 text-[13px] leading-[1.7] text-gray-900"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {children}
    </div>
  );
}

export function DocHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b-2 border-gray-900 pb-4 text-center">
      <h1
        className="text-2xl font-bold uppercase tracking-widest text-gray-900"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function DocClause({
  n,
  title,
  children,
}: {
  n: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <p className="font-bold uppercase tracking-wide text-gray-900">
        {n}
        {title && (
          <>
            <span className="mx-2">·</span>
            <span>{title}</span>
          </>
        )}
      </p>
      <div className="mt-1 text-justify text-gray-800">{children}</div>
    </section>
  );
}

export function DocField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <p>
      <span className="font-semibold text-gray-900">{label}:</span>{" "}
      <span className="border-b border-dotted border-gray-400 text-gray-800">
        {value || <span className="text-gray-400">—</span>}
      </span>
    </p>
  );
}

export function DocSignatures() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-12 pt-12">
      {["VENDEDOR", "COMPRADOR"].map((role) => (
        <div key={role} className="text-center">
          <div className="border-t border-gray-900 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-700">
              {role}
            </p>
            <p className="mt-1 text-[10px] text-gray-500">
              Firma y cédula
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Simple field input for the form column */
export function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      )}
    </label>
  );
}

/** Format USD currency for doc display */
export function formatCurrency(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "—";
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Number-to-Spanish-words for legal docs (US$1,000 → "MIL DÓLARES") */
export function numberToWords(n: number): string {
  if (!n || isNaN(n)) return "—";
  // Simplified: just show the formatted number for v1, with "DÓLARES" suffix.
  // Full word conversion is overkill — most contracts show both numeric + format.
  return `${new Intl.NumberFormat("es", { maximumFractionDigits: 0 }).format(n)} DÓLARES`;
}
