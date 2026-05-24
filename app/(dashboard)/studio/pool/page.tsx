import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { StudioProvider } from "@/components/studio/studio-context";
import { PoolClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PoolPage({
  searchParams,
}: {
  searchParams: Promise<{ photoUrl?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true },
  });
  return (
    <StudioProvider
      tool="POOL"
      cost={1}
      initialCredits={dbUser?.credits ?? 0}
      initialImage={sp.photoUrl ? { url: sp.photoUrl } : null}
    >
      <PoolClient plan={dbUser?.plan ?? "FREE"} />
    </StudioProvider>
  );
}
