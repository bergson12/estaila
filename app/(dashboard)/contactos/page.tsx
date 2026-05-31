import Link from "next/link";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ContactsClient } from "@/components/contacts/contacts-client";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  type?: string;
  favs?: string;
  new?: string;
  edit?: string;
};

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const t = await getDict();

  const where = {
    userId: user.id,
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q } },
            { phone: { contains: sp.q } },
            { whatsapp: { contains: sp.q } },
            { email: { contains: sp.q } },
            { location: { contains: sp.q } },
            { notes: { contains: sp.q } },
          ],
        }
      : {}),
    ...(sp.type ? { type: sp.type } : {}),
    ...(sp.favs === "1" ? { favorite: true } : {}),
  } as const;

  const [contacts, total, favs, byTypeRaw, currentUser, tagsRaw, smartLists, stale60Count] =
    await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }],
        include: { tags: { include: { tag: true } } },
      }),
      prisma.contact.count({ where: { userId: user.id } }),
      prisma.contact.count({ where: { userId: user.id, favorite: true } }),
      prisma.contact.groupBy({
        by: ["type"],
        where: { userId: user.id },
        _count: true,
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, image: true },
      }),
      prisma.tag.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
        include: { _count: { select: { contactTags: true } } },
      }),
      prisma.smartList.findMany({
        where: { userId: user.id },
        orderBy: [{ pinned: "desc" }, { order: "asc" }, { name: "asc" }],
      }),
      prisma.contact.count({
        where: {
          userId: user.id,
          OR: [
            { lastContactedAt: null },
            {
              lastContactedAt: {
                lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      }),
    ]);

  const byType = Object.fromEntries(byTypeRaw.map((r) => [r.type, r._count]));

  const contactsForClient = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    location: c.location,
    rnc: c.rnc,
    reference: c.reference,
    notes: c.notes,
    favorite: c.favorite,
    ratings: c.ratings,
    profession: c.profession,
    updatedAt: c.updatedAt,
    lastContactedAt: c.lastContactedAt,
    tags: c.tags.map((ct) => ({
      id: ct.tag.id,
      name: ct.tag.name,
      color: ct.tag.color,
      icon: ct.tag.icon,
    })),
  }));

  const tags = tagsRaw.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    icon: t.icon,
    count: t._count.contactTags,
  }));

  const lists = smartLists.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    color: s.color,
    filters: JSON.parse(s.filters) as Record<string, unknown>,
    pinned: s.pinned,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={t.contactos.title}
        description={t.contactos.pageDescription}
        actions={
          <Button asChild variant="outline">
            <Link href="/importar?type=CONTACTS">
              <Upload className="mr-2 h-4 w-4" />
              {t.contactos.importCsv}
            </Link>
          </Button>
        }
      />
      <ContactsClient
        contacts={contactsForClient}
        counts={{ total, favs, byType, stale60: stale60Count }}
        owner={{
          name: currentUser?.name ?? user.name,
          image: currentUser?.image ?? null,
        }}
        tags={tags}
        smartLists={lists}
      />
    </div>
  );
}
