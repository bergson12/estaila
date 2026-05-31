import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ContactDetailClient } from "@/components/contacts/contact-detail-client";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getDict();

  const [
    contact,
    ownedProperties,
    pipelineCards,
    currentUser,
    activities,
    appointments,
    customFields,
    contactTags,
    documents,
  ] = await Promise.all([
      prisma.contact.findFirst({
        where: { id, userId: user.id },
      }),
      // Properties they OWN (PROPIETARIO)
      prisma.property.findMany({
        where: { userId: user.id, ownerId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          featuredPhoto: true,
          priceUSD: true,
          category: true,
          operation: true,
          status: true,
          bedrooms: true,
          bathrooms: true,
          parking: true,
          metersSquared: true,
          location: true,
          address: true,
        },
      }),
      // Pipeline cards (properties they're INTERESTED IN)
      prisma.pipelineCard.findMany({
        where: { userId: user.id, contactId: id },
        orderBy: { updatedAt: "desc" },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              featuredPhoto: true,
              priceUSD: true,
              category: true,
              operation: true,
              status: true,
              bedrooms: true,
              bathrooms: true,
              parking: true,
              metersSquared: true,
              location: true,
              address: true,
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, image: true },
      }),
      prisma.contactActivity.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.appointment.findMany({
        where: { userId: user.id, contactId: id },
        orderBy: { startAt: "desc" },
        include: { property: { select: { id: true, title: true } } },
      }),
      prisma.contactCustomField.findMany({
        where: { contactId: id },
        orderBy: { key: "asc" },
      }),
      prisma.contactTag.findMany({
        where: { contactId: id },
        include: { tag: true },
      }),
      // Documents — since we don't have a Document table yet, we surface
      // BillingEvent entries that reference this contact via metadata.
      // For now an empty array — will populate when document generation
      // stores per-contact records.
      Promise.resolve([] as { id: string; type: string; title: string; createdAt: Date }[]),
    ]);

  if (!contact) notFound();

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/contactos"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.contactos.backToContacts}
      </Link>
      <ContactDetailClient
        contact={{
          id: contact.id,
          name: contact.name,
          type: contact.type,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          email: contact.email,
          location: contact.location,
          rnc: contact.rnc,
          reference: contact.reference,
          notes: contact.notes,
          favorite: contact.favorite,
          ratings: contact.ratings,
          profession: contact.profession,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        }}
        ownedProperties={ownedProperties.map((p) => ({
          ...p,
          priceUSD: p.priceUSD ? Number(p.priceUSD) : null,
          bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
        }))}
        pipelineProperties={pipelineCards
          .filter((c) => c.property)
          .map((c) => ({
            ...c.property!,
            priceUSD: c.property!.priceUSD ? Number(c.property!.priceUSD) : null,
            bathrooms: c.property!.bathrooms
              ? Number(c.property!.bathrooms)
              : null,
            stage: c.stage,
          }))}
        agent={{
          name: currentUser?.name ?? user.name,
          image: currentUser?.image ?? null,
        }}
        activities={activities.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          content: a.content,
          durationMin: a.durationMin,
          propertyId: a.propertyId,
          appointmentId: a.appointmentId,
          metadata: a.metadata,
          createdAt: a.createdAt.toISOString(),
        }))}
        appointments={appointments.map((a) => ({
          id: a.id,
          title: a.title,
          startAt: a.startAt.toISOString(),
          endAt: a.endAt?.toISOString() ?? null,
          status: a.status,
          location: a.location,
          notes: a.notes,
          propertyTitle: a.property?.title ?? null,
        }))}
        customFields={customFields.map((c) => ({
          key: c.key,
          value: c.value,
        }))}
        tags={contactTags.map((ct) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
          icon: ct.tag.icon,
        }))}
        documents={documents}
      />
    </div>
  );
}
