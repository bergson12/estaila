import { listStylePresets } from "@/lib/actions/style-preset";
import { StylePresetsManager } from "@/components/admin/style-presets-manager";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fotos de muestra" };

export default async function AdminMuestrasPage() {
  const [presets, t] = await Promise.all([listStylePresets(), getDict()]); // requireAdmin dentro

  const rows = presets.map((p) => ({
    id: p.id,
    label: p.label,
    category: p.category,
    imageUrl: p.imageUrl,
    active: p.active,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.adminPanel.samplePhotosTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.adminPanel.samplePhotosLead}
        </p>
      </header>
      <StylePresetsManager presets={rows} />
    </div>
  );
}
