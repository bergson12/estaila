import { MarketingPage } from "@/components/marketing-site/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "estaila — The operating system for modern agents",
  description:
    "CRM + AI + Public portal + Photo studio. The all-in-one platform for independent real estate agents.",
};

export default function WelcomePage() {
  return <MarketingPage />;
}
