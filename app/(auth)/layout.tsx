import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user already authenticated, bounce out of /login or /signup.
  const user = await getCurrentUser();
  if (user) redirect("/inicio");

  return <AuthShell>{children}</AuthShell>;
}
