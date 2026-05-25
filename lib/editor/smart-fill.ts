/**
 * Smart Fill — replace {{placeholders}} in canvas JSON with real CRM data.
 *
 * Used both at template instantiation time (NewProjectModal) and on demand
 * via the "Auto-rellenar" button when a project is linked to a property.
 */

import { formatCurrency } from "@/lib/utils";

export type SmartFillData = {
  title?: string;
  price?: number | null;
  oldPrice?: number | null;
  specs?: string;
  location?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  parking?: number | null;
  agentName?: string;
  agentPhone?: string;
  agentRole?: string;
  website?: string;
  openHouseDate?: string;
  testimonialQuote?: string;
  clientName?: string;
  propertyPhotoUrl?: string;
};

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n == null) return "—";
  return `${n}${suffix}`;
}

export function buildSpecs(d: SmartFillData): string {
  const parts: string[] = [];
  if (d.bedrooms) parts.push(`${d.bedrooms} hab`);
  if (d.bathrooms) parts.push(`${d.bathrooms} baños`);
  if (d.area) parts.push(`${d.area} m²`);
  return parts.join("  ·  ") || "—";
}

export function applySmartFill(canvasJson: string, data: SmartFillData): string {
  const specs = data.specs ?? buildSpecs(data);
  const tokens: Record<string, string> = {
    "{{title}}": data.title ?? "Propiedad sin título",
    "{{price}}":
      data.price != null ? formatCurrency(data.price, "USD") : "Consultar",
    "{{old_price}}":
      data.oldPrice != null ? formatCurrency(data.oldPrice, "USD") : "",
    "{{specs}}": specs,
    "{{location}}": data.location ?? "",
    "{{bedrooms}}": fmt(data.bedrooms),
    "{{bathrooms}}": fmt(data.bathrooms),
    "{{area}}": fmt(data.area),
    "{{parking}}": fmt(data.parking),
    "{{agent_name}}": data.agentName ?? "Tu nombre",
    "{{agent_phone}}": data.agentPhone ?? "+1 000 000 0000",
    "{{agent_role}}": data.agentRole ?? "Agente inmobiliario",
    "{{website}}": data.website ?? "estaila.com",
    "{{open_house_date}}": data.openHouseDate ?? "Sáb · 10:00",
    "{{testimonial_quote}}":
      data.testimonialQuote ?? "Una experiencia profesional de principio a fin.",
    "{{client_name}}": data.clientName ?? "Cliente satisfecho",
  };

  let out = canvasJson;
  for (const [k, v] of Object.entries(tokens)) {
    // Escape regex special chars in token
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(safe, "g"),
      v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    );
  }
  return out;
}
