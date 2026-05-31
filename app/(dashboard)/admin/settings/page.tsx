import { PageHeader } from "@/components/shared/page-header";
import { getAppSettings } from "@/lib/app-settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { getDict } from "@/lib/i18n/server";

export default async function AdminSettingsPage() {
  const [settings, t] = await Promise.all([getAppSettings(), getDict()]);
  return (
    <div>
      <PageHeader
        title={t.adminPanel.platformSettingsTitle}
        description={t.adminPanel.platformSettingsDescription}
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
