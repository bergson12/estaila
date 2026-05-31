import { listUsers } from "@/lib/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { AdminUsersTable } from "@/components/admin/users-table";
import { getDict } from "@/lib/i18n/server";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const t = await getDict();
  const users = await listUsers({
    search: sp.search,
    plan: (sp.plan as "FREE" | "PRO" | "TEAM" | "ALL") ?? "ALL",
  });

  return (
    <div>
      <PageHeader
        title={t.adminPanel.usersTitle}
        description={`${users.length} ${
          users.length === 1 ? t.adminPanel.usersShownSingular : t.adminPanel.usersShownPlural
        }`}
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
