import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/**
 * Lite contacts endpoint — minimal payload for selectors / pickers.
 * Used by the SendInvoiceDialog to populate the contact picker.
 */
export async function GET() {
  const user = await requireUser();
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      type: true,
    },
    take: 200,
  });
  return NextResponse.json(contacts);
}
