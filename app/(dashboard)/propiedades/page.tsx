import { Building2, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyFilters } from "@/components/properties/property-filters";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  cat?: string;
  op?: string;
  status?: string;
};

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const where = {
    userId: user.id,
    ...(sp.q
      ? {
          OR: [
            { title: { contains: sp.q } },
            { location: { contains: sp.q } },
            { description: { contains: sp.q } },
          ],
        }
      : {}),
    ...(sp.cat ? { category: sp.cat } : {}),
    ...(sp.op ? { operation: sp.op } : {}),
    ...(sp.status ? { status: sp.status } : {}),
  } as const;

  const [properties, total, byCategoryRaw, byOperationRaw] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        featuredPhoto: true,
        priceUSD: true,
        priceDOP: true,
        category: true,
        operation: true,
        status: true,
        bedrooms: true,
        bathrooms: true,
        parking: true,
        metersSquared: true,
        location: true,
      },
    }),
    prisma.property.count({ where: { userId: user.id } }),
    prisma.property.groupBy({
      by: ["category"],
      where: { userId: user.id },
      _count: true,
    }),
    prisma.property.groupBy({
      by: ["operation"],
      where: { userId: user.id },
      _count: true,
    }),
  ]);

  const byCategory = Object.fromEntries(
    byCategoryRaw.map((r) => [r.category, r._count])
  );
  const byOperation = Object.fromEntries(
    byOperationRaw.map((r) => [r.operation, r._count])
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Propiedades"
        description={`${properties.length} de ${total} propiedades`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/importar?type=PROPERTIES">
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/propiedades/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva propiedad
              </Link>
            </Button>
          </div>
        }
      />

      <PropertyFilters counts={{ total, byCategory, byOperation }} />

      {properties.length === 0 ? (
        total === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aún no tienes propiedades"
            description="Empieza agregando tu primera propiedad para verla aquí en la galería."
            action={
              <Button asChild>
                <Link href="/propiedades/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar primera propiedad
                </Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Building2}
            title="Sin resultados"
            description="Ningún inmueble coincide con los filtros aplicados."
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((p, i) => (
            <PropertyCard
              key={p.id}
              index={i}
              property={{
                ...p,
                priceUSD: p.priceUSD?.toString() ?? null,
                priceDOP: p.priceDOP?.toString() ?? null,
                bathrooms: p.bathrooms?.toString() ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
