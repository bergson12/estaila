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
  Images,
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

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card
              className={`relative flex h-full flex-col overflow-hidden p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 sm:p-5 ${
                t.featured ? "ring-1 ring-primary/30" : ""
              }`}
            >
              {t.featured && (
                <Badge className="absolute right-2 top-2 bg-primary/15 px-1.5 py-0 text-[9px] text-primary hover:bg-primary/15 sm:right-3 sm:top-3 sm:text-xs">
                  Popular
                </Badge>
              )}
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110 sm:mb-4 sm:h-10 sm:w-10">
                <t.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                {t.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed">
                {t.desc}
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[10px] sm:mt-4 sm:text-xs">
                <span className="text-muted-foreground">
                  {t.cost} créd{t.cost > 1 ? "s" : ""}
                </span>
                <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir →
                </span>
              </div>
            </Card>
          </Link>
        ))}

        {/* Galería — destino de las fotos generadas */}
        <Link href="/studio/galeria" className="group">
          <Card className="relative flex h-full flex-col justify-between overflow-hidden border-dashed p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 sm:p-5">
            <div>
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110 sm:mb-4 sm:h-10 sm:w-10">
                <Images className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                Galería
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed">
                Tus fotos generadas: mover a propiedad, compartir o descargar.
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10px] sm:mt-4 sm:text-xs">
              <span className="text-muted-foreground">Sin costo</span>
              <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Abrir →
              </span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
