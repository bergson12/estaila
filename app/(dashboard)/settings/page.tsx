import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { LanguageToggle } from "@/components/settings/language-toggle";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getDict, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  // (Schema migrations run inside requireUser via ensureLightweightMigrations)

  const [dbUser, t, locale] = await Promise.all([
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
        agentRole: true,
        agentLocation: true,
        agentPhone: true,
        agentBio: true,
        createdAt: true,
      },
    }),
    getDict(),
    getLocale(),
  ]);

  if (!dbUser) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t.settings.title} description={t.settings.loadError} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.settings.title} description={t.settings.description} />
      <div className="space-y-6">
        <LanguageToggle initial={locale} />
        <ProfileForm user={dbUser} />
      </div>
    </div>
  );
}
