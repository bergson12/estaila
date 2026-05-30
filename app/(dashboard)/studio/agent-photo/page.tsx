import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { AgentPhotoClient } from "./client";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // tope de función (Vercel Hobby) para la generación
export const metadata = { title: "Foto Pro" };

export default async function AgentPhotoPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true },
  });
  return (
    <AgentPhotoClient
      initialCredits={dbUser?.credits ?? 0}
      plan={dbUser?.plan ?? "FREE"}
    />
  );
}
