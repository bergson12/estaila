import {
  Download,
  FileText,
  Folder,
  Mail,
  MessageCircle,
  Plus,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TEMPLATE_META: Record<string, { label: string; color: string }> = {
  BROCHURE: { label: "Brochure", color: "bg-primary/15 text-primary border-primary/30" },
  FINANCIAL: { label: "Financiero", color: "bg-success/15 text-success border-success/30" },
  INVESTMENT: { label: "Inversión", color: "bg-warning/15 text-warning border-warning/30" },
  MINIMAL: { label: "Minimal", color: "bg-secondary text-foreground border-border" },
  PROPOSAL: { label: "Propuesta IA", color: "bg-primary/15 text-primary border-primary/30" },
};

export default async function DocumentosPage() {
  const user = await requireUser();

  const [pdfsRecent, pdfStats, propsWithDocs] = await Promise.all([
    prisma.pdfGeneration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        property: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.pdfGeneration.groupBy({
      by: ["template"],
      where: { userId: user.id },
      _count: true,
    }),
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        title: true,
        location: true,
        featuredPhoto: true,
        slug: true,
        _count: { select: { pdfs: true } },
      },
    }),
  ]);

  const totalPdfs = pdfStats.reduce((a, s) => a + s._count, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Documentos"
        description="PDFs generados, plantillas legales y archivos de cada propiedad."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/documentos/propuesta-ia"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Propuesta con IA
            </Link>
            <Link
              href="/propiedades"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Generar nuevo
            </Link>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="PDFs generados"
          value={totalPdfs}
          icon={<FileText className="h-4 w-4" />}
        />
        <KpiTile
          label="Brochures"
          value={pdfStats.find((s) => s.template === "BROCHURE")?._count ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          accent="primary"
        />
        <KpiTile
          label="Propiedades activas"
          value={propsWithDocs.length}
          icon={<Folder className="h-4 w-4" />}
        />
        <KpiTile
          label="Plantillas disponibles"
          value={4}
          icon={<FileText className="h-4 w-4" />}
          sub="Brochure · Financiero · Inversión · Minimal"
        />
      </div>

      {/* Recent PDFs */}
      <Card className="mt-6 rounded-2xl border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Historial
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              PDFs generados recientes
            </h2>
          </div>
        </div>

        {pdfsRecent.length === 0 ? (
          <EmptyState
            text="Aún no has generado documentos. Genera tu primer brochure desde una propiedad."
            ctaHref="/propiedades"
            ctaLabel="Ir a propiedades"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Documento</th>
                  <th className="px-3 py-2 text-left font-medium">Propiedad</th>
                  <th className="px-3 py-2 text-left font-medium">Destinatario</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-right font-medium">Fecha</th>
                  <th className="w-20 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pdfsRecent.map((p) => {
                  const meta = TEMPLATE_META[p.template] ?? TEMPLATE_META.BROCHURE;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-card/40"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium">
                            {meta.label} · {p.property?.title ?? "Propiedad"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {p.property ? (
                          <Link
                            href={`/propiedades/${p.property.id}`}
                            className="hover:text-foreground hover:underline"
                          >
                            {p.property.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {p.recipientName ? (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-2.5 w-2.5 text-muted-foreground" />
                            <span>{p.recipientName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Genérico</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={cn("rounded-full text-[10px]", meta.color)}
                        >
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.recipientPhone && (
                            <a
                              href={`https://wa.me/${p.recipientPhone.replace(/[^\d+]/g, "").replace(/^\+/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-emerald-500/15 hover:text-emerald-600"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {p.recipientEmail && (
                            <a
                              href={`mailto:${p.recipientEmail}`}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                              title="Email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Properties with documents */}
      <Card className="mt-4 rounded-2xl border-border p-6">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Por propiedad
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">
            Genera documentos
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Click en cualquier propiedad para abrir el tab Documentos y generar
            contratos, brochures, recibos.
          </p>
        </div>

        {propsWithDocs.length === 0 ? (
          <EmptyState
            text="Crea tu primera propiedad para empezar a generar documentos."
            ctaHref="/propiedades/nueva"
            ctaLabel="Nueva propiedad"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {propsWithDocs.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/propiedades/${p.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-background"
                >
                  {p.featuredPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.featuredPhoto}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.location ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {p._count.pdfs}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      PDFs
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  accent?: "primary";
}) {
  return (
    <Card className="rounded-2xl border-border p-5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight",
          accent === "primary" && "text-primary"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {sub}
        </p>
      )}
    </Card>
  );
}

function EmptyState({
  text,
  ctaHref,
  ctaLabel,
}: {
  text: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Download className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="max-w-[40ch] text-sm text-muted-foreground">{text}</p>
      <Link
        href={ctaHref}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-ink-foreground hover:opacity-90"
      >
        <Plus className="h-3 w-3" />
        {ctaLabel}
      </Link>
    </div>
  );
}
