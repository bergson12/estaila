import { requireUser } from "@/lib/auth-server";
import { listProjects } from "@/lib/actions/editor";
import { EditorListClient } from "./client";

export const dynamic = "force-dynamic";

export default async function EditorListPage() {
  await requireUser();
  const projects = await listProjects();
  return <EditorListClient projects={projects} />;
}
