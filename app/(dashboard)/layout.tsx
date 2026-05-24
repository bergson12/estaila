import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TopNav } from "@/components/layout/top-nav";
import { PageTransition } from "@/components/shared/page-transition";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { getAppSettings } from "@/lib/app-settings";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { getActiveOrgBranding } from "@/lib/org-branding";
import { getLayoutMode } from "@/lib/layout-prefs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [dbUser, settings, layoutMode] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        credits: true,
        role: true,
      },
    }),
    getAppSettings(),
    getLayoutMode(),
  ]);

  const sidebarUser = dbUser ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    plan: "FREE",
    credits: 0,
    role: "USER",
  };

  // Maintenance mode — only admins bypass
  if (settings.maintenanceMode && sidebarUser.role !== "ADMIN") {
    return <MaintenanceScreen />;
  }

  // Org branding override (logo + colors)
  const orgBranding = await getActiveOrgBranding(sidebarUser.id);

  const isTopbar = layoutMode === "topbar";

  return (
    <div
      data-layout={layoutMode}
      className="relative flex min-h-screen flex-col bg-background"
      style={
        orgBranding
          ? ({
              ["--org-primary" as never]: orgBranding.primaryColor,
              ["--org-secondary" as never]: orgBranding.secondaryColor,
              ["--org-accent" as never]: orgBranding.accentColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      {isTopbar ? (
        // ===================== HORIZONTAL MODE =====================
        <>
          <AnnouncementBanner />
          <TopNav
            user={sidebarUser}
            branding={orgBranding}
            layoutMode={layoutMode}
          />
          <main className="relative flex-1">
            <div className="ambient-glow" />
            <div
              className="pointer-events-none absolute inset-0 bg-dots opacity-40"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
              aria-hidden
            />
            <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </>
      ) : (
        // ===================== VERTICAL MODE (default) =====================
        <div className="flex flex-1">
          <Sidebar
            user={sidebarUser}
            branding={orgBranding}
            layoutMode={layoutMode}
          />
          <div className="relative flex flex-1 flex-col md:pl-[var(--sidebar-w,240px)] [transition:padding-left_0.3s_cubic-bezier(0.22,1,0.36,1)]">
            <AnnouncementBanner />
            <Topbar user={sidebarUser} branding={orgBranding} />
            <main className="relative flex-1">
              <div className="ambient-glow" />
              <div
                className="pointer-events-none absolute inset-0 bg-dots opacity-40"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
                aria-hidden
              />
              <div className="relative px-4 py-6 sm:px-6 sm:py-8">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
