import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { MarketingPage } from "@/components/marketing-site/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "estaila — The operating system for modern agents",
  description:
    "CRM + AI + Public portal + Photo studio. The all-in-one platform for independent real estate agents.",
};

// Public root: logged users → /inicio, otherwise marketing landing.
export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inicio");
  return <MarketingPage />;
}
