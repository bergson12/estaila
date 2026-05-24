import { PageHeader } from "@/components/shared/page-header";
import { SiteSettingsClient } from "@/components/site/site-settings-client";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MiSitioPage() {
  const user = await requireUser();
  const site = await prisma.site.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Mi Sitio"
        description="Tu portal inmobiliario público. Comparte el link con clientes."
      />
      <SiteSettingsClient
        defaultUserName={user.name}
        initial={
          site
            ? {
                slug: site.slug,
                template: site.template,
                title: site.title ?? "",
                tagline: site.tagline ?? "",
                about: site.about ?? "",
                primaryColor: site.primaryColor ?? "",
                logoUrl: site.logoUrl ?? "",
                coverUrl: site.coverUrl ?? "",
                phone: site.phone ?? "",
                whatsapp: site.whatsapp ?? "",
                email: site.email ?? "",
                facebookUrl: site.facebookUrl ?? "",
                instagramUrl: site.instagramUrl ?? "",
                tiktokUrl: site.tiktokUrl ?? "",
                published: site.published,
                fontPair: site.fontPair ?? "ELEGANT",
                language: site.language ?? "es",
                enabledSections: (() => {
                  try {
                    return JSON.parse(site.enabledSections);
                  } catch {
                    return [
                      "AMENITIES",
                      "FLOOR_PLANS",
                      "NEIGHBORHOOD",
                      "IMMERSIVE",
                      "FINISHES",
                    ];
                  }
                })(),
              }
            : null
        }
      />
    </div>
  );
}
