import { PageHeader } from "@/components/shared/page-header";
import { PropertyForm } from "@/components/properties/property-form";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export default async function NuevaPropiedadPage() {
  const user = await requireUser();
  const [owners, currentUser] = await Promise.all([
    prisma.contact.findMany({
      where: { userId: user.id, type: "PROPIETARIO" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Nueva propiedad"
        description="Agrega una propiedad a tu inventario."
      />
      <PropertyForm
        ownerOptions={owners.map((o) => ({ value: o.id, label: o.name }))}
        userPlan={currentUser?.plan ?? "FREE"}
      />
    </div>
  );
}
