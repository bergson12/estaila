import { MarketingPage } from "@/components/marketing-site/marketing-page";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://estaila.com";

export const metadata: Metadata = {
  title: "CRM inmobiliario con IA: vende más, con menos trabajo",
  description:
    "CRM + staging con IA + portal público + email marketing en una sola plataforma para agentes inmobiliarios. Sube una foto vacía y recíbela lista para vender en 60 segundos. Empieza gratis, sin tarjeta.",
  alternates: { canonical: "/welcome" },
};

// Structured data — Organization + SoftwareApplication (rich results / AI search).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "estaila",
      url: SITE_URL,
      logo: `${SITE_URL}/logos/iso-estaila.png`,
      description:
        "CRM inmobiliario con IA visual para agentes inmobiliarios independientes.",
    },
    {
      "@type": "SoftwareApplication",
      name: "estaila",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "CRM + staging con IA + portal público + email marketing en una sola plataforma para agentes inmobiliarios.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Plan gratis para empezar, sin tarjeta.",
      },
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
};

export default function WelcomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingPage />
    </>
  );
}
