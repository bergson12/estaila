// estaila — Resumen Ejecutivo (PDF branded)
// Genera un PDF multi-página con @react-pdf/renderer (sin navegador, puro Node).
// Uso: node scripts/exec-summary-pdf.mjs
import fs from "node:fs";
import path from "node:path";
import React from "react";
import * as ReactPDF from "@react-pdf/renderer";

const { Document, Page, Text, View, Image, StyleSheet, renderToFile } = ReactPDF;
const h = React.createElement;
const ROOT = process.cwd();

const b64 = (rel) =>
  "data:image/png;base64," +
  fs.readFileSync(path.join(ROOT, rel)).toString("base64");
const logoBlack = b64("public/logos/web-black-estaila.png");
const logoWhite = b64("public/logos/web-white-estaila.png");

const C = {
  brand: "#00BF63",
  brandDark: "#00904A",
  ink: "#16181B",
  body: "#3A4047",
  muted: "#6B7178",
  border: "#E5E8EA",
  soft: "#F7F8F8",
  accent: "#ECFBF3",
  accentBorder: "#CDEFDC",
  danger: "#C0392B",
  amber: "#B7791F",
  teal: "#0E7C66",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 66,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    color: C.body,
    fontSize: 10,
  },
  // Cover
  cover: { flex: 1, justifyContent: "space-between", paddingVertical: 14 },
  coverRule: {
    width: 54,
    height: 5,
    backgroundColor: C.brand,
    borderRadius: 3,
    marginBottom: 18,
  },
  coverEyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.brandDark,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  coverTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 42,
    color: C.ink,
    lineHeight: 1.04,
  },
  coverSub: {
    fontSize: 13,
    color: C.body,
    lineHeight: 1.5,
    marginTop: 16,
    maxWidth: 400,
  },
  coverMeta: {
    fontSize: 9.5,
    color: C.muted,
    letterSpacing: 0.4,
    marginTop: 26,
  },
  coverBand: {
    backgroundColor: C.brand,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  coverBandTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 1.3,
  },
  coverBandSub: {
    fontSize: 9.5,
    color: "#E6FFF1",
    marginTop: 6,
    lineHeight: 1.45,
    maxWidth: 420,
  },
  // Section
  eyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.brandDark,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 21, color: C.ink, lineHeight: 1.1 },
  h2rule: { width: 40, height: 3, backgroundColor: C.brand, borderRadius: 2, marginTop: 9, marginBottom: 16 },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 12, color: C.ink, marginTop: 14, marginBottom: 4 },
  p: { fontSize: 10, color: C.body, lineHeight: 1.55, marginBottom: 8 },
  // Stat cards
  statRow: { flexDirection: "row", gap: 9, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: C.accent,
    borderRadius: 8,
    padding: 11,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  statVal: { fontFamily: "Helvetica-Bold", fontSize: 16, color: C.brandDark },
  statLab: { fontSize: 7.3, color: C.muted, marginTop: 4, lineHeight: 1.3 },
  // Table
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 7, marginTop: 8, overflow: "hidden" },
  tr: { flexDirection: "row", alignItems: "stretch" },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.2,
    color: "#FFFFFF",
    paddingVertical: 7,
    paddingHorizontal: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  td: { fontSize: 9, color: C.body, paddingVertical: 6.5, paddingHorizontal: 8, lineHeight: 1.3 },
  tdFirst: { fontFamily: "Helvetica-Bold", color: C.ink },
  // Bullets
  bulletRow: { flexDirection: "row", marginBottom: 4.5, alignItems: "flex-start" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.brand, marginTop: 4.5, marginRight: 7 },
  bulletTxt: { flex: 1, fontSize: 9, color: C.body, lineHeight: 1.42 },
  // FODA
  fodaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14 },
  fodaCard: {
    width: "47.6%",
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderRadius: 7,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  fodaTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginBottom: 8 },
  // Callout
  callout: {
    backgroundColor: C.accent,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
    borderRadius: 6,
    padding: 12,
    marginTop: 14,
  },
  calloutTxt: { fontSize: 9.5, color: C.brandDark, lineHeight: 1.5, fontFamily: "Helvetica-Bold" },
  note: {
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 11,
    marginTop: 8,
  },
  noteTxt: { fontSize: 8.3, color: C.muted, lineHeight: 1.45 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footL: { fontSize: 7.5, color: C.muted, letterSpacing: 0.3 },
  footBrand: { fontFamily: "Helvetica-Bold", color: C.brandDark },
});

// ---- helpers ----
const P = (txt, extra) => h(Text, { style: extra ? [s.p, extra] : s.p }, txt);
const Eyebrow = (t) => h(Text, { style: s.eyebrow }, t);
const H2 = (t) =>
  h(View, {}, [
    h(Text, { key: "t", style: s.h2 }, t),
    h(View, { key: "r", style: s.h2rule }),
  ]);
const Bullet = (txt, color = C.brand) =>
  h(View, { style: s.bulletRow }, [
    h(View, { key: "d", style: [s.dot, { backgroundColor: color }] }),
    h(Text, { key: "t", style: s.bulletTxt }, txt),
  ]);
const Stat = (val, lab) =>
  h(View, { style: s.stat }, [
    h(Text, { key: "v", style: s.statVal }, val),
    h(Text, { key: "l", style: s.statLab }, lab),
  ]);

function Table(cols, rows, headerBg = C.brand) {
  return h(View, { style: s.table }, [
    h(
      View,
      { key: "head", style: [s.tr, { backgroundColor: headerBg }] },
      cols.map((c, i) =>
        h(Text, { key: i, style: [s.th, { flex: c.w, textAlign: c.align || "left" }] }, c.label)
      )
    ),
    ...rows.map((r, ri) =>
      h(
        View,
        {
          key: ri,
          style: [
            s.tr,
            { borderTopWidth: 1, borderTopColor: C.border },
            ri % 2 === 1 ? { backgroundColor: C.soft } : null,
          ],
        },
        r.map((cell, ci) =>
          h(
            Text,
            {
              key: ci,
              style: [
                s.td,
                { flex: cols[ci].w, textAlign: cols[ci].align || "left" },
                ci === 0 ? s.tdFirst : null,
              ],
            },
            String(cell)
          )
        )
      )
    ),
  ]);
}

const Footer = () =>
  h(View, { style: s.footer, fixed: true }, [
    h(Text, { key: "l", style: s.footL }, [
      h(Text, { key: "b", style: s.footBrand }, "estaila"),
      "   Resumen Ejecutivo  ·  Documento interno · Confidencial",
    ]),
    h(Text, {
      key: "r",
      style: s.footL,
      render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`,
    }),
  ]);

const FodaCard = (title, color, items) =>
  h(View, { style: [s.fodaCard, { borderLeftColor: color }] }, [
    h(Text, { key: "t", style: [s.fodaTitle, { color }] }, title),
    ...items.map((it, i) => h(View, { key: i }, Bullet(it, color))),
  ]);

// ---- pages ----
const Cover = () =>
  h(Page, { size: "A4", style: s.page }, [
    h(View, { key: "c", style: s.cover }, [
      h(Image, { key: "logo", src: logoBlack, style: { width: 150 } }),
      h(View, { key: "mid" }, [
        h(View, { key: "rule", style: s.coverRule }),
        h(Text, { key: "eb", style: s.coverEyebrow }, "Análisis estratégico"),
        h(Text, { key: "ti", style: s.coverTitle }, "Resumen\nEjecutivo"),
        h(
          Text,
          { key: "su", style: s.coverSub },
          "CRM inmobiliario con IA. Visión del producto, análisis de mercado, FODA, estrategia de precios y proyección financiera."
        ),
        h(Text, { key: "me", style: s.coverMeta }, "Mayo 2026   ·   Preparado para la dirección de estaila"),
      ]),
      h(View, { key: "band", style: s.coverBand }, [
        h(
          Text,
          { key: "bt", style: s.coverBandTitle },
          "El equipo de marketing de una inmobiliaria, hecho con IA."
        ),
        h(
          Text,
          { key: "bs", style: s.coverBandSub },
          "CRM + staging virtual + portal público + email, en una sola plataforma y a precio de agente."
        ),
      ]),
    ]),
  ]);

const PageResumen = () =>
  h(Page, { size: "A4", style: s.page }, [
    Eyebrow("Resumen ejecutivo"),
    H2("Qué es estaila y por qué importa"),
    P(
      "estaila es un CRM inmobiliario con inteligencia artificial pensado para el agente independiente y las oficinas pequeñas. En una sola plataforma reúne la gestión de clientes y propiedades, un Studio de IA que hace staging virtual y edición de fotos en menos de 60 segundos, un portal público de propiedades y herramientas de email y newsletter."
    ),
    P(
      "La tesis es simple: hoy un agente paga por separado un CRM, un fotógrafo o home stager, una web y una herramienta de email. estaila junta todo a precio de agente. El staging con IA cuesta entre 95% y 99% menos que el staging físico y se entrega en segundos, no en días."
    ),
    P(
      "El momento es favorable: cerca del 68% de los agentes ya usan IA y más del 50% usan staging virtual. El mercado de CRM inmobiliario crece a doble dígito y el nicho hispanohablante está mal atendido por los líderes, que son caros y en inglés."
    ),
    h(View, { key: "stats", style: s.statRow }, [
      h(View, { key: 1, style: { flex: 1 } }, Stat("USD 4.7 mil M", "Mercado CRM inmobiliario en 2025")),
      h(View, { key: 2, style: { flex: 1 } }, Stat("~11% anual", "Crecimiento del sector (CAGR)")),
      h(View, { key: 3, style: { flex: 1 } }, Stat("95-99%", "Más barato que el staging físico")),
      h(View, { key: 4, style: { flex: 1 } }, Stat("~84%", "Margen bruto objetivo por usuario")),
    ]),
    h(View, { key: "co", style: s.callout }, [
      h(
        Text,
        { style: s.calloutTxt },
        "En una frase: estaila reemplaza 4 o 5 herramientas sueltas por una sola, con IA visual incluida, a una fracción del costo de las suites del mercado."
      ),
    ]),
    Footer(),
  ]);

const PageMercado = () =>
  h(Page, { size: "A4", style: s.page }, [
    Eyebrow("Mercado"),
    H2("Dónde juega estaila"),
    h(Text, { key: "h3a", style: s.h3 }, "CRM inmobiliario"),
    P(
      "El software CRM para bienes raíces movió cerca de USD 4.7 mil millones en 2025 y crece a un ritmo aproximado de 11% anual, camino a más de USD 14 mil millones hacia 2035. La demanda la empujan la digitalización del agente y la automatización del seguimiento de leads."
    ),
    h(Text, { key: "h3b", style: s.h3 }, "Staging virtual y edición con IA"),
    P(
      "El staging y la edición de fotos con IA es la ola disruptiva del sector. Una imagen con IA cuesta entre USD 1 y 15, frente a USD 16 a 24 por foto de los servicios manuales y miles de dólares del staging físico. El impacto en ventas es medible: las propiedades con staging se venden hasta 73% más rápido y generan más visitas y más tiempo en el anuncio."
    ),
    h(Text, { key: "h3c", style: s.h3 }, "Competidores y precios de referencia"),
    Table(
      [
        { w: 2.2, label: "Herramienta" },
        { w: 1.6, label: "Precio", align: "left" },
        { w: 2.6, label: "Nota" },
      ],
      [
        ["Wise Agent (CRM)", "$32 / mes", "CRM económico, sin staging IA"],
        ["Follow Up Boss (CRM)", "~$69 / usuario", "CRM popular, sin imagen IA"],
        ["Lofty / BoldTrail (kvCORE)", "$449-1,500 / mes", "Suite cara, enfoque enterprise"],
        ["BoxBrownie (edición)", "$24 / imagen", "Edición manual, cobro por foto"],
        ["VirtualStaging.AI", "$0.28-1 / imagen", "Solo staging, sin CRM ni portal"],
        ["estaila", "$12-99 / mes", "CRM + staging IA + portal + email"],
      ]
    ),
    h(View, { key: "co", style: s.callout }, [
      h(
        Text,
        { style: s.calloutTxt },
        "El hueco de mercado: nadie reúne CRM, staging con IA, portal y email a precio de agente. Los CRM baratos no traen IA visual; las suites con IA arrancan en $449 al mes."
      ),
    ]),
    Footer(),
  ]);

const PageFoda = () =>
  h(Page, { size: "A4", style: s.page }, [
    Eyebrow("Análisis FODA"),
    H2("Fortalezas, debilidades, oportunidades y amenazas"),
    h(View, { key: "grid", style: s.fodaGrid }, [
      h(View, { key: 1, style: { width: "47.6%" } }, FodaCard("Fortalezas", C.brand, [
        "Todo-en-uno: CRM + staging IA + portal + email",
        "Staging fotorrealista en menos de 60 segundos",
        "Portal público y tarjetas con opción white-label",
        "Mobile-first / PWA, diseño enfocado y simple",
        "Precio de agente, no de enterprise",
      ])),
      h(View, { key: 2, style: { width: "47.6%" } }, FodaCard("Debilidades", C.amber, [
        "Marca nueva, sin historial ni reseñas",
        "Dependencia de APIs externas (Gemini) en costo y calidad",
        "Falta rate limiting en el backend (riesgo de abuso)",
        "SEO bilingüe aún incompleto; sin blog de contenido",
        "Equipo pequeño; soporte y roadmap limitados",
      ])),
      h(View, { key: 3, style: { width: "47.6%" } }, FodaCard("Oportunidades", C.teal, [
        "Mercado CRM de USD 4.7 mil M creciendo ~11%",
        "Staging IA 95-99% más barato que el físico",
        "Nicho hispanohablante desatendido por los líderes",
        "Bundling: reemplaza 4 o 5 herramientas sueltas",
        "WhatsApp como canal de captación (módulo futuro)",
      ])),
      h(View, { key: 4, style: { width: "47.6%" } }, FodaCard("Amenazas", C.danger, [
        "Líderes (Lofty, kvCORE) bajando precio o sumando IA",
        "Canva / Adobe agregando staging con IA",
        "Cambios de precio o política en las APIs de IA",
        "Comoditización del staging IA",
        "Reglas de MLS sobre fotos editadas (disclosure)",
      ])),
    ]),
    Footer(),
  ]);

const PagePrecios = () =>
  h(Page, { size: "A4", style: s.page }, [
    Eyebrow("Estrategia de precios"),
    H2("Precios para arrancar y crecer la base"),
    P(
      "Para construir una base de usuarios primero hay que reducir la fricción de entrada. Recomendación: bajar los precios en el lanzamiento, capturar usuarios con un precio fundador bloqueado de por vida, y subir las tarifas una vez que haya tracción y testimonios."
    ),
    Table(
      [
        { w: 1.1, label: "Plan" },
        { w: 1, label: "Actual", align: "left" },
        { w: 1.2, label: "Lanzamiento", align: "left" },
        { w: 3, label: "Para quién" },
      ],
      [
        ["Free", "$0", "$0", "Prueba y ancla: 5 créditos, 3 propiedades, marca de agua"],
        ["Solo", "$15", "$12", "Agente independiente que está arrancando"],
        ["Pro", "$39", "$29", "Agente activo, el plan más popular"],
        ["Agency", "$199", "$99", "Equipos y oficinas, con white-label"],
      ]
    ),
    h(Text, { key: "h3", style: s.h3 }, "Tácticas de lanzamiento"),
    Bullet("Anual con 20% de descuento (dos meses gratis) para asegurar caja por adelantado."),
    Bullet("Precio fundador: los primeros 100 a 200 usuarios conservan su tarifa para siempre (urgencia + lealtad)."),
    Bullet("Free como ancla: la cuenta demo muestra todo el sistema; la gratis bloquea módulos clave para empujar el upgrade."),
    Bullet("Subir precios a $15 / $39 / $149 una vez consolidada la tracción y con testimonios reales."),
    h(View, { key: "co", style: s.callout }, [
      h(
        Text,
        { style: s.calloutTxt },
        "Posicionamiento: más completo que un CRM barato (que no trae IA) y mucho más accesible que una suite enterprise (que cuesta $449+ al mes)."
      ),
    ]),
    Footer(),
  ]);

const PageProyeccion = () =>
  h(Page, { size: "A4", style: s.page }, [
    Eyebrow("Proyección financiera"),
    H2("Ingresos y costos por número de usuarios"),
    h(View, { key: "assume", style: s.note }, [
      h(
        Text,
        { style: s.noteTxt },
        "Supuestos: ingreso medio por usuario pago (ARPU) de aprox. $24/mes con la mezcla de planes de lanzamiento (mayoría Solo). Se asume 1 usuario pago por cada 5 gratuitos. Costo de IA aprox. $1.20 por usuario pago/mes (uso medio de créditos Gemini) y $0.15 por usuario gratis. Infraestructura fija de $60 a $300/mes según escala (Vercel, Turso, Resend, Blob). Pasarela de pago aprox. 6% de los ingresos. Cifras estimadas, no garantizadas."
      ),
    ]),
    Table(
      [
        { w: 1.3, label: "Usuarios pago", align: "left" },
        { w: 1, label: "Gratis", align: "left" },
        { w: 1.5, label: "Ingreso bruto/mes", align: "left" },
        { w: 1.2, label: "Costos/mes", align: "left" },
        { w: 1.2, label: "Neto/mes", align: "left" },
        { w: 0.9, label: "Margen", align: "left" },
      ],
      [
        ["50", "250", "$1,200", "~$230", "~$970", "~81%"],
        ["200", "1,000", "$4,800", "~$780", "~$4,020", "~84%"],
        ["500", "2,500", "$12,000", "~$1,875", "~$10,125", "~84%"],
        ["1,000", "5,000", "$24,000", "~$3,690", "~$20,310", "~85%"],
      ]
    ),
    h(Text, { key: "h3", style: s.h3 }, "Economía por usuario"),
    P(
      "Servir a un usuario Pro ($29/mes) cuesta alrededor de $3.2: IA $1.2, infraestructura $0.3 y pasarela de pago $1.7. El margen bruto por usuario ronda el 89%. A 1,000 usuarios de pago, los ingresos brutos anuales se acercan a los USD 288 mil con costos por debajo de USD 45 mil al año."
    ),
    h(View, { key: "co", style: s.callout }, [
      h(
        Text,
        { style: s.calloutTxt },
        "Es un modelo de software de alto margen: el costo variable real (IA) es bajo y está acotado por el sistema de créditos de cada plan."
      ),
    ]),
    Footer(),
  ]);

const PageConclusion = () =>
  h(Page, { size: "A4", style: s.page }, [
    Eyebrow("Conclusión"),
    H2("Veredicto y próximos pasos"),
    P(
      "estaila ataca un mercado grande y en crecimiento con una propuesta clara: darle a cada agente un equipo completo de marketing, staging y diseño sin contratar a nadie. El modelo es de alto margen (software más IA barata) y el riesgo principal es de ejecución y posicionamiento, no de mercado."
    ),
    h(Text, { key: "h3", style: s.h3 }, "Próximos pasos priorizados"),
    Bullet("1. Seguridad: implementar rate limiting (Better-Auth + Upstash) antes de escalar el tráfico."),
    Bullet("2. Activación: completar el bloqueo de módulos del plan Free para empujar el upgrade."),
    Bullet("3. SEO bilingüe: rutas /es y /en con hreflang, más un blog de contenido para captar tráfico orgánico."),
    Bullet("4. Confianza: publicar la cuenta demo como ancla y recoger testimonios reales de agentes."),
    Bullet("5. Crecimiento: programa de referidos y captación por WhatsApp como canales de bajo costo."),
    h(View, { key: "co", style: s.callout }, [
      h(
        Text,
        { style: s.calloutTxt },
        "Recomendación: lanzar con precios de fundador agresivos, blindar la seguridad y la activación, y convertir el ahorro frente al staging tradicional en el argumento de venta central."
      ),
    ]),
    h(View, { key: "src", style: s.note }, [
      h(
        Text,
        { style: s.noteTxt },
        "Fuentes de mercado (2025): reportes públicos de tamaño y crecimiento del mercado de CRM inmobiliario y de staging virtual / fotografía con IA, y precios publicados de Wise Agent, Follow Up Boss, Lofty/kvCORE, BoxBrownie y VirtualStaging.AI. Las proyecciones financieras son estimaciones internas basadas en los precios actuales de estaila y costos de infraestructura."
      ),
    ]),
    Footer(),
  ]);

const Doc = () =>
  h(Document, {
    title: "estaila — Resumen Ejecutivo",
    author: "estaila",
    subject: "Análisis estratégico, mercado y proyección financiera",
    creator: "estaila",
  }, [
    Cover(),
    PageResumen(),
    PageMercado(),
    PageFoda(),
    PagePrecios(),
    PageProyeccion(),
    PageConclusion(),
  ]);

const out = path.join(ROOT, "estaila-Resumen-Ejecutivo.pdf");
await renderToFile(h(Doc), out);
console.log("OK ->", out);
