import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/**
 * Returns the owner contact for a property — used by the
 * SendInvoiceDialog "Propietario" recipient option.
 * Auth-gated: only the property owner (estaila user) can resolve it.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await ctx.params;

  const property = await prisma.property.findFirst({
    where: { id, userId: user.id },
    select: {
      owner: {
        select: {
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
        },
      },
    },
  });

  if (!property || !property.owner) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(property.owner);
}
