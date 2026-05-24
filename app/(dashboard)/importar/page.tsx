import { requireUser } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { ImportWizard } from "@/components/importar/import-wizard";
import type { ImportType } from "@/lib/actions/import";

export const dynamic = "force-dynamic";

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const initialType: ImportType | undefined =
    sp.type === "CONTACTS" || sp.type === "PROPERTIES" ? sp.type : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Importar datos"
        description={
          initialType === "CONTACTS"
            ? "Sube un CSV con tus contactos. Compatible con HubSpot, Sherlock, Excel."
            : initialType === "PROPERTIES"
              ? "Sube un CSV con tus propiedades. Compatible con HubSpot, Sherlock, Excel."
              : "Migra contactos y propiedades desde HubSpot, Sherlock, Excel o cualquier CSV en 3 pasos."
        }
      />
      <ImportWizard initialType={initialType} />
    </div>
  );
}
