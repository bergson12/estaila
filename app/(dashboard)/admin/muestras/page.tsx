import { listStylePresets } from "@/lib/actions/style-preset";
import { StylePresetsManager } from "@/components/admin/style-presets-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fotos de muestra" };

export default async function AdminMuestrasPage() {
  const presets = await listStylePresets(); // requireAdmin dentro

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fotos de muestra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Biblioteca de referencias de estilo. El agente elige una en el Studio y la IA imita su look.
        </p>
      </header>
      <StylePresetsManager presets={rows} />
    </div>
  );
}
