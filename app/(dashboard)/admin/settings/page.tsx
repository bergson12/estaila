import { PageHeader } from "@/components/shared/page-header";
import { getAppSettings } from "@/lib/app-settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();
  return (
    <div>
      <PageHeader
        title="Configuración de plataforma"
        description="Feature flags, anuncios, comportamiento global. Cambios se aplican a todos los usuarios al instante."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
