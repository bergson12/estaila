import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { listActivePresets } from "@/lib/actions/style-preset";
import { AgentPhotoClient } from "./client";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // tope de función (Vercel Hobby) para la generación
export const metadata = { title: "Foto Pro" };

export default async function AgentPhotoPage() {
  const user = await requireUser();
  const [dbUser, presets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true, plan: true },
    }),
    listActivePresets("AGENT_PHOTO").catch(() => []),
  ]);
  return (
    <AgentPhotoClient
      initialCredits={dbUser?.credits ?? 0}
      plan={dbUser?.plan ?? "FREE"}
      presets={presets.map((p) => ({ id: p.id, label: p.label, imageUrl: p.imageUrl }))}
    />
  );
}
