/**
 * Textos por defecto de las plantillas de email — módulo COMPARTIDO
 * (sin "server-only") para que tanto el render del servidor como el diálogo
 * cliente puedan prellenar/editar el asunto y el mensaje.
 *
 * El "message" es la prosa editable (sin saludo ni tarjeta de propiedad;
 * esos los agrega el render). Párrafos separados por línea en blanco.
 */

export type TemplateKind =
  | "NEW_LISTING"
  | "PRICE_REDUCTION"
  | "OPEN_HOUSE"
  | "LEAD_REPLY"
  | "APPOINTMENT_CONFIRM"
  | "FOLLOWUP"
  | "CUSTOM";

/** Plantillas que requieren una propiedad asociada. */
export const PROPERTY_REQUIRED: TemplateKind[] = [
  "NEW_LISTING",
  "PRICE_REDUCTION",
  "OPEN_HOUSE",
];

/** Plantillas que usan fecha/hora. */
export const DATETIME_KINDS: TemplateKind[] = [
  "OPEN_HOUSE",
  "APPOINTMENT_CONFIRM",
];

export function defaultTemplateContent(args: {
  kind: TemplateKind;
  property?: { title: string; location: string | null } | null;
  dateTime?: string;
}): { subject: string; message: string } {
  const p = args.property ?? null;
  const dt = args.dateTime?.trim();

  switch (args.kind) {
    case "NEW_LISTING":
      return {
        subject: p?.location
          ? `Nueva propiedad en ${p.location}: ${p?.title ?? ""}`
          : `Nueva propiedad: ${p?.title ?? ""}`,
        message:
          "Tengo una propiedad nueva que coincide con lo que estás buscando. Échale un vistazo cuando puedas.\n\n¿Te interesa? Coordinemos una visita esta semana. Respóndeme a este email o escríbeme.",
      };
    case "PRICE_REDUCTION":
      return {
        subject: `🔻 Bajó de precio: ${p?.title ?? ""}`,
        message:
          "La propiedad que viste bajó de precio. Si todavía te interesa, este es un buen momento para verla.\n\n¿Coordinamos una visita?",
      };
    case "OPEN_HOUSE":
      return {
        subject: `Open house ${dt ?? "este fin de semana"} · ${p?.title ?? ""}`,
        message: `Estás invitado al open house ${
          dt ?? "este fin de semana"
        }. Sin cita previa, solo pásate.\n\nHabrá refrescos y podrás ver toda la propiedad con calma. Confirma tu asistencia respondiendo a este email.`,
      };
    case "LEAD_REPLY":
      return {
        subject: p?.title ? `Sobre tu interés en ${p.title}` : "Te respondo",
        message: `Gracias por escribirme. Vi tu interés${
          p?.title ? ` en ${p.title}` : ""
        } y quiero ayudarte personalmente.\n\n¿Cuál es el mejor horario para llamarte? Respóndeme a este email o escríbeme por WhatsApp.`,
      };
    case "APPOINTMENT_CONFIRM":
      return {
        subject: `Visita confirmada · ${dt ?? "la fecha acordada"}`,
        message: `Tu visita está confirmada para ${dt ?? "la fecha acordada"}${
          p?.title ? ` — ${p.title}` : ""
        }.\n\nTe espero en la dirección. Si necesitas cambiar la hora, avísame con tiempo.`,
      };
    case "FOLLOWUP":
      return {
        subject: "¿Sigue activa tu búsqueda?",
        message:
          "Quería retomar contacto: ¿sigue activa tu búsqueda? Tengo varias opciones nuevas que pueden interesarte.\n\nSi las prioridades cambiaron, no hay problema — solo respóndeme brevemente y ajusto la búsqueda.",
      };
    case "CUSTOM":
    default:
      return { subject: "Mensaje de tu agente", message: "" };
  }
}
