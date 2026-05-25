/**
 * CRM context block fed into the DeepSeek system prompt so the chatbot knows:
 *   - Which routes exist (to suggest navigation)
 *   - Which entities it can create (to suggest "create_*" actions)
 *   - The general feature map of estaila
 */

export const CRM_ROUTES = `
RUTAS DEL CRM (sugiérelas como navigate actions cuando aplique):
- /inicio — Dashboard principal con KPIs
- /propiedades — Lista de propiedades (CRUD)
- /propiedades/nueva — Crear nueva propiedad
- /propiedades/[id] — Detalle de propiedad (Smart Hub: overview, social kit, landing, analytics)
- /contactos — Lista de contactos (CRM)
- /contactos/[id] — Detalle contacto con timeline, pipeline, citas
- /pipeline — Kanban de ventas (4 vistas: Kanban/Lista/Forecast/Stats)
- /agenda — Calendario de citas (Day/Week/Month/Year)
- /finanzas — Transacciones, ingresos, gastos
- /studio — Estudio IA (8 herramientas: Staging, Declutter, Enhance, etc)
- /studio/editor — Editor Canva-style con plantillas inmobiliarias
- /marketing — Posts, tarjetas digitales, kits sociales
- /analisis — Analytics global
- /documentos — Plantillas legales
- /empresa — Branding, equipo, dominio, facturación
- /pricing — Planes y créditos
- /settings — Perfil del agente
- /sitio — Portal público del agente
`.trim();

export const CRM_ENTITIES = `
ENTIDADES QUE PUEDES CREAR (sugiere create_* actions cuando el usuario dé datos):

create_contact { name (req), phone?, email?, notes? }
  → Para guardar leads, prospectos, referidos.

create_property { title (req), category?, operation?, priceUSD?, bedrooms?, bathrooms?, metersSquared?, location?, description? }
  → category: CASA|APARTAMENTO|SOLAR|TERRENO|LOCAL_COMERCIAL
  → operation: EN_VENTA|EN_ALQUILER

create_appointment { title (req), startAt (req, ISO date), endAt?, contactId?, propertyId?, location?, notes? }
  → Para agendar visitas, llamadas, firmas.

Reglas:
- Solo sugiere create_* cuando el usuario te DA datos concretos.
- Pide los campos faltantes con preguntas concisas antes de ejecutar.
- Si el usuario dice "mañana 3pm" calcula startAt en ISO. Hoy: ${new Date().toISOString()}.
`.trim();

export const RESPONSE_SHAPE = `
FORMATO DE RESPUESTA (JSON estricto, sin markdown fences):
{
  "text": "Tu respuesta conversacional al usuario. Concisa, bullets si ayuda. Markdown OK.",
  "actions": [
    // Optional. Hasta 4 chips clickeables. Sugiere las más útiles para el contexto.
    {
      "type": "navigate",
      "label": "Texto del botón (3-5 palabras)",
      "href": "/ruta-del-crm"
    },
    {
      "type": "create_contact",
      "label": "Crear contacto Juan Pérez",
      "data": { "name": "Juan Pérez", "phone": "+1 829 123 4567" }
    },
    {
      "type": "create_property",
      "label": "Crear propiedad Casa Miraflores",
      "data": { "title": "Casa Miraflores", "operation": "EN_VENTA", "priceUSD": 250000 }
    },
    {
      "type": "create_appointment",
      "label": "Agendar visita mañana 10am",
      "data": { "title": "Visita Casa Miraflores", "startAt": "2026-05-26T10:00:00.000Z" }
    },
    {
      "type": "ai_tool",
      "label": "Abrir Virtual Staging",
      "href": "/studio/staging"
    }
  ]
}

Reglas:
- Devuelve SOLO el JSON, nada antes ni después.
- "actions" puede ser [] si no aplica.
- href siempre absoluto al CRM (empieza con /).
- Para fechas, usa ISO 8601 con zona UTC.
`.trim();
