import {
  Sparkles,
  Sofa,
  Eraser,
  Wand2,
  Palette,
  Sun,
  Sunset,
  Waves,
  Trees,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";

const TOOLS = [
  {
    href: "/studio/staging",
    icon: Sofa,
    title: "Virtual Staging",
    desc: "Amuebla habitaciones vacías con estilos: Caribeño, Colonial, Moderno…",
    cost: 2,
    featured: true,
  },
  {
    href: "/studio/declutter",
    icon: Eraser,
    title: "Eliminar Objetos",
    desc: "Quita muebles, personas u objetos personales de la foto.",
    cost: 1,
  },
  {
    href: "/studio/enhance",
    icon: Wand2,
    title: "Mejorar Calidad",
    desc: "Brillo, contraste, saturación y nitidez con un click.",
    cost: 1,
  },
  {
    href: "/studio/style",
    icon: Palette,
    title: "Cambiar Estilo",
    desc: "Mantén el layout, cambia la decoración (8 estilos).",
    cost: 2,
  },
  {
    href: "/studio/sky",
    icon: Sun,
    title: "Cielo Despejado",
    desc: "Reemplaza cielos nublados por azul tropical o atardecer.",
    cost: 1,
  },
  {
    href: "/studio/twilight",
    icon: Sunset,
    title: "Atardecer Dorado",
    desc: "Convierte fotos de día a twilight. +35% CTR según data.",
    cost: 1,
  },
  {
    href: "/studio/pool",
    icon: Waves,
    title: "Piscina Cristalina",
    desc: "Limpia agua y agrega reflejos naturales.",
    cost: 1,
  },
  {
    href: "/studio/lawn",
    icon: Trees,
    title: "Césped Verde",
    desc: "Reemplaza grama seca por césped exuberante.",
    cost: 1,
  },
];

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true },
  });
  const credits = dbUser?.credits ?? 0;
  const plan = dbUser?.plan ?? "FREE";

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={
          <>
            <Sparkles className="h-6 w-6 text-primary" />
            Studio IA
          </>
        }
        description="Herramientas de edición de fotos inmobiliarias con IA."
        actions={
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Créditos</p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {credits}
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary">
              {plan}
            </Badge>
          </div>
        }
      />

      {/* Hero — Editor Avanzado destacado */}
      <Link href="/studio/editor" className="group block">
        <Card className="relative mb-6 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 transition-all hover:border-primary/60 hover:shadow-xl hover:shadow-primary/15">
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-3 w-3" />
            Nuevo · Pro
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
              <LayoutGrid className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight">
                Editor Avanzado
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Editor tipo Canva integrado al CRM: <strong className="text-foreground">200+ plantillas inmobiliarias</strong>, texto editable, logos, formas, capas, exportación PNG/JPG/PDF.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Instagram Post", "Story", "Flyer A4", "WhatsApp", "Logos PNG", "Smart Text IA"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-border"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 shadow-sm ring-1 ring-border">
              <span className="text-xs text-muted-foreground">Gratis</span>
              <span className="text-xs font-medium text-primary">Abrir →</span>
            </div>
          </div>
        </Card>
      </Link>

      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Herramientas IA
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card
              className={`relative h-full overflow-hidden p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${
                t.featured ? "ring-1 ring-primary/30" : ""
              }`}
            >
              {t.featured && (
                <Badge className="absolute right-3 top-3 bg-primary/15 text-primary hover:bg-primary/15">
                  Popular
                </Badge>
              )}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <t.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold">{t.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t.desc}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t.cost} crédito{t.cost > 1 ? "s" : ""}
                </span>
                <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
