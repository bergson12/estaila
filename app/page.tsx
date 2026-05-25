import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";

// Root: logged → /inicio, otherwise → /welcome (marketing landing canonical URL).
export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inicio");
  redirect("/welcome");
}
