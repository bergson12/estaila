import { PageHeader } from "@/components/shared/page-header";
import { AgendaClient } from "@/components/agenda/agenda-client";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const user = await requireUser();

  const [appointments, properties] = await Promise.all([
    prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { startAt: "asc" },
      include: { property: { select: { title: true } } },
    }),
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const items = appointments.map((a) => ({
    id: a.id,
    title: a.title,
    startAt: a.startAt,
    endAt: a.endAt,
    status: a.status,
    location: a.location,
    attendees: a.attendees,
    notes: a.notes,
    propertyId: a.propertyId,
    propertyTitle: a.property?.title ?? null,
  }));

  const pending = items.filter((i) => i.status === "PENDIENTE").length;
  const inProgress = items.filter((i) => i.status === "EN_CURSO").length;

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        title="Agenda"
        description={`${items.length} citas · ${pending} pendientes · ${inProgress} en curso`}
      />
      <AgendaClient appointments={items} properties={properties} />
    </div>
  );
}
