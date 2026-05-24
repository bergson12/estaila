import type { PortalAgent, PortalSite } from "./types";

export function portalFormatCurrency(
  value: number | null | undefined,
  currency: string = "USD"
) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PoweredByFooter({ template }: { template: string }) {
  const colors: Record<string, string> = {
    LUXURY_DARK: "border-white/10 text-white/40",
    TROPICAL_BRIGHT: "border-amber-900/10 text-amber-900/50",
    MINIMAL_CLASSIC: "border-black/10 text-black/40",
    MODERN_BOLD: "border-white/10 text-white/40",
  };
  return (
    <div
      className={`border-t ${colors[template] ?? colors.LUXURY_DARK} mt-20 py-6 text-center text-xs`}
    >
      <p>
        Powered by{" "}
        <a
          href="/login"
          className="font-semibold transition-colors hover:text-current"
        >
          estaila
        </a>
        {" · "}
        <span>CRM + Studio IA</span>
      </p>
    </div>
  );
}

export function buildWhatsAppLink(site: PortalSite, propertyTitle?: string) {
  if (!site.whatsapp) return null;
  const phone = site.whatsapp.replace(/\D/g, "");
  const msg = propertyTitle
    ? `Hola, me interesa la propiedad: ${propertyTitle}`
    : `Hola, quisiera más información sobre sus propiedades.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function agentDisplayName(site: PortalSite, agent: PortalAgent) {
  return site.title ?? agent.name;
}
