import { requireUser } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { ImportWizard } from "@/components/importar/import-wizard";
import type { ImportType } from "@/lib/actions/import";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireUser();
  const t = await getDict();
  const sp = await searchParams;
  const initialType: ImportType | undefined =
    sp.type === "CONTACTS" || sp.type === "PROPERTIES" ? sp.type : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t.importar.pageTitle}
        description={
          initialType === "CONTACTS"
            ? t.importar.pageDescContacts
            : initialType === "PROPERTIES"
              ? t.importar.pageDescProperties
              : t.importar.pageDesc
        }
      />
      <ImportWizard initialType={initialType} />
    </div>
  );
}
