import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { loadProject } from "@/lib/actions/editor";
import { prisma } from "@/lib/db";
import { EditorClient } from "./client";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireUser();
  const { projectId } = await params;
  try {
    const project = await loadProject(projectId);

    // If linked to a property, pre-load the first photo so Photopea opens with it
    let initialImageUrl: string | null = null;
    if (project.propertyId) {
      const photo = await prisma.photo.findFirst({
        where: { propertyId: project.propertyId },
        select: { url: true },
        orderBy: { order: "asc" },
      });
      initialImageUrl = photo?.url ?? null;
    }

    return (
      <EditorClient
        projectId={project.id}
        initialName={project.name}
        canvasData={project.canvasData}
        initialImageUrl={initialImageUrl}
      />
    );
  } catch {
    notFound();
  }
}
