import { listUsers } from "@/lib/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { AdminUsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const users = await listUsers({
    search: sp.search,
    plan: (sp.plan as "FREE" | "PRO" | "TEAM" | "ALL") ?? "ALL",
  });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description={`${users.length} usuario${users.length === 1 ? "" : "s"} mostrado${users.length === 1 ? "" : "s"}`}
      />
      <AdminUsersTable
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        initialSearch={sp.search ?? ""}
        initialPlan={(sp.plan as "FREE" | "PRO" | "TEAM" | "ALL") ?? "ALL"}
      />
    </div>
  );
}
