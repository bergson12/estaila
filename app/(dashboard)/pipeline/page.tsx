import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await requireUser();

  const [cards, contacts, properties] = await Promise.all([
    prisma.pipelineCard.findMany({
      where: { userId: user.id },
      orderBy: [{ stage: "asc" }, { order: "asc" }],
      include: {
        contact: { select: { name: true } },
        property: { select: { title: true } },
      },
    }),
    prisma.contact.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const initialCards = cards.map((c) => ({
    id: c.id,
    contactId: c.contactId,
    contactName: c.contact.name,
    propertyId: c.propertyId,
    propertyTitle: c.property?.title ?? null,
    stage: c.stage,
    value: c.value ? Number(c.value) : null,
    notes: c.notes,
    nextAction: c.nextAction,
    nextActionDate: c.nextActionDate ? c.nextActionDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-[1700px]">
      <KanbanBoard
        initialCards={initialCards}
        contacts={contacts}
        properties={properties}
      />
    </div>
  );
}
