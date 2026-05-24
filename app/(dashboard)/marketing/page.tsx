import { PageHeader } from "@/components/shared/page-header";
import { MarketingClient } from "@/components/marketing/marketing-client";
import { MarketingHub } from "@/components/marketing/marketing-hub";
import { DigitalCardsClient } from "@/components/marketing/digital-cards-client";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const user = await requireUser();

  const [posts, properties, digitalCards] = await Promise.all([
    prisma.marketingPost.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.digitalCard.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        links: { orderBy: { order: "asc" } },
        _count: { select: { cardViews: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Marketing"
        description="Tarjetas digitales tipo Linktree y calendario editorial de posts."
      />
      <MarketingHub
        digitalView={
          <DigitalCardsClient
            cards={digitalCards.map((c) => ({
              id: c.id,
              slug: c.slug,
              title: c.title,
              role: c.role,
              bio: c.bio,
              avatarUrl: c.avatarUrl,
              coverUrl: c.coverUrl,
              theme: c.theme,
              primaryColor: c.primaryColor,
              accentColor: c.accentColor,
              isActive: c.isActive,
              showProperties: c.showProperties,
              showWhatsapp: c.showWhatsapp,
              views: c.views,
              links: c.links.map((l) => ({
                id: l.id,
                label: l.label,
                url: l.url,
                icon: l.icon,
                imageUrl: l.imageUrl,
                description: l.description,
                color: l.color,
                highlight: l.highlight,
                active: l.active,
                clicks: l.clicks,
                order: l.order,
              })),
              _count: { cardViews: c._count.cardViews },
            }))}
          />
        }
        postsView={<MarketingClient posts={posts} properties={properties} />}
      />
    </div>
  );
}
