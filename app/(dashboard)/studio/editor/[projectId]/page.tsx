import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { loadProject } from "@/lib/actions/editor";
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
    return (
      <EditorClient
        projectId={project.id}
        initialName={project.name}
        canvasData={project.canvasData}
        width={project.width}
        height={project.height}
        format={project.format}
        propertyTitle={null}
      />
    );
  } catch {
    notFound();
  }
}
