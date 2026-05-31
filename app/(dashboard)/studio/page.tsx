import {
  Sparkles,
  Camera,
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
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireUser();
  const [dbUser, t] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true, plan: true },
    }),
    getDict(),
  ]);
  const credits = dbUser?.credits ?? 0;
  const plan = dbUser?.plan ?? "FREE";

  const TOOLS = [
    {
      href: "/studio/agent-photo",
      icon: Camera,
      title: t.studio.toolAgentPhotoTitle,
      desc: t.studio.toolAgentPhotoDesc,
      cost: 4,
      featured: true,
    },
    {
      href: "/studio/staging",
      icon: Sofa,
      title: t.studio.toolStagingTitle,
      desc: t.studio.toolStagingDesc,
      cost: 2,
      featured: true,
    },
    {
      href: "/studio/declutter",
      icon: Eraser,
      title: t.studio.toolDeclutterTitle,
      desc: t.studio.toolDeclutterDesc,
      cost: 1,
    },
    {
      href: "/studio/enhance",
      icon: Wand2,
      title: t.studio.toolEnhanceTitle,
      desc: t.studio.toolEnhanceDesc,
      cost: 1,
    },
    {
      href: "/studio/style",
      icon: Palette,
      title: t.studio.toolStyleTitle,
      desc: t.studio.toolStyleDesc,
      cost: 2,
    },
    {
      href: "/studio/sky",
      icon: Sun,
      title: t.studio.toolSkyTitle,
      desc: t.studio.toolSkyDesc,
      cost: 1,
    },
    {
      href: "/studio/twilight",
      icon: Sunset,
      title: t.studio.toolTwilightTitle,
      desc: t.studio.toolTwilightDesc,
      cost: 1,
    },
    {
      href: "/studio/pool",
      icon: Waves,
      title: t.studio.toolPoolTitle,
      desc: t.studio.toolPoolDesc,
      cost: 1,
    },
    {
      href: "/studio/lawn",
      icon: Trees,
      title: t.studio.toolLawnTitle,
      desc: t.studio.toolLawnDesc,
      cost: 1,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={
          <>
            <Sparkles className="h-6 w-6 text-primary" />
            Studio IA
          </>
        }
        description={t.studio.pageDescription}
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/studio/galeria">
              <Button className="gap-1.5 rounded-lg">
                <Images className="h-4 w-4" />
                {t.studio.photoGallery}
              </Button>
            </Link>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t.studio.credits}</p>
                <p className="font-mono text-sm font-semibold tabular-nums">{credits}</p>
              </div>
              <Badge variant="secondary" className="bg-primary/15 text-primary">
                {plan}
              </Badge>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card
              className={`relative flex h-full flex-col overflow-hidden p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 sm:p-5 ${
                tool.featured ? "ring-1 ring-primary/30" : ""
              }`}
            >
              {tool.featured && (
                <Badge className="absolute right-2 top-2 z-10 bg-primary/15 px-1.5 py-0 text-[9px] text-primary hover:bg-primary/15 sm:right-3 sm:top-3 sm:text-xs">
                  {t.studio.popular}
                </Badge>
              )}
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110 sm:mb-4 sm:h-10 sm:w-10">
                <tool.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[13px] font-semibold leading-tight sm:text-sm">
                {tool.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed">
                {tool.desc}
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[10px] sm:mt-4 sm:text-xs">
                <span className="text-muted-foreground">
                  {tool.cost} {tool.cost > 1 ? t.studio.creditsShort : t.studio.creditShort}
                </span>
                <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t.studio.open}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
