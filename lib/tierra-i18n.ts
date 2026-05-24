/**
 * TIERRA CARIBE — extension copy for the editorial cartographic landings.
 * Builds on top of existing MARKETING_T dict — this file only adds the
 * net-new strings specific to the TIERRA aesthetic.
 */

import type { Lang } from "./marketing-i18n";

export const TIERRA = {
  es: {
    // Top status bar
    status: {
      coordinatesLabel: "COORDENADAS",
      meridian: "MERIDIANO",
      issue: "EDICIÓN",
      issueValue: "VOL. I · 2026",
      sunrise: "SOL",
      tide: "MAREA",
      tideValue: "ALTA",
      sectionOf: "/ 06",
    },
    // Brand line
    brand: {
      name: "ESTAILA × TIERRA",
      sub: "Catálogo de Espacios",
      tagline: "Sistema operativo del agente del Caribe",
    },
    // Hero
    hero: {
      kicker: "Capítulo 01 · Apertura",
      h1Pre: "Un atlas para",
      h1Mid: "agentes",
      h1Post: "que venden la isla.",
      lead:
        "CRM, IA y portal público en una misma plataforma. Diseñado para el ritmo del Caribe — pausado en la forma, agresivo en la venta.",
      ctaPrimary: "Trazar mi territorio",
      ctaSecondary: "Ver el archivo",
      meta1: "Independencia",
      meta2: "Inteligencia artificial",
      meta3: "Caribe RD",
    },
    // Marquee
    marquee: [
      "Catálogo de propiedades",
      "Pipeline visual",
      "Staging virtual IA",
      "Portal del agente",
      "Cinematic landings",
      "Plantillas legales DOCX",
      "Agenda territorial",
      "Marketing automatizado",
    ],
    // Manifesto
    manifesto: {
      label: "MANIFIESTO · 02",
      n: "02",
      title: "El agente solo",
      titleAlt: "se vuelve un equipo",
      body: [
        "Cada agente independiente trabaja con tres oficios al mismo tiempo: fotógrafo, diseñador y vendedor.",
        "TIERRA combina los tres en una sola superficie editorial. El catálogo, las cláusulas, la inteligencia visual y el cierre — todo en la misma carta.",
      ],
      pillars: [
        { n: "01", word: "Catálogo", desc: "Cada propiedad como entrada de archivo." },
        { n: "02", word: "Atlas", desc: "Ubicación cartografiada, no listada." },
        { n: "03", word: "Estudio", desc: "Fotografía y staging desde tu celular." },
        { n: "04", word: "Cierre", desc: "Pipeline, contratos y agenda." },
      ],
    },
    // Atlas (features as map regions)
    atlas: {
      label: "ATLAS · 03",
      n: "03",
      title: "Seis regiones",
      titleAlt: "de operación",
      sub: "Cada herramienta es una región del mapa. Visítalas, no las uses.",
      regions: [
        {
          n: "I",
          title: "Catálogo",
          coord: "18.4861° N",
          desc: "Propiedades, contactos, pipeline, agenda y finanzas. Conectado.",
        },
        {
          n: "II",
          title: "Studio IA",
          coord: "69.9312° W",
          desc: "Staging virtual, despeje, mejora, cambio de estilo. En segundos.",
        },
        {
          n: "III",
          title: "Portal",
          coord: "Cap Cana",
          desc: "Sitio web con landing premium por propiedad. Cuatro plantillas.",
        },
        {
          n: "IV",
          title: "Pipeline",
          coord: "Santiago",
          desc: "Kanban drag & drop. De nuevo a cerrado en un gesto.",
        },
        {
          n: "V",
          title: "Marketing",
          coord: "Santo Domingo",
          desc: "Captions, hashtags, posts y campañas Meta — desde la propiedad.",
        },
        {
          n: "VI",
          title: "Atlas",
          coord: "Punta Cana",
          desc: "Mapa visual con calor, leads y rendimiento por zona.",
        },
      ],
    },
    // Archive — feature properties list (decorative)
    archive: {
      label: "ARCHIVO · 04",
      n: "04",
      title: "Catálogo",
      titleAlt: "del territorio",
      sub: "Cada propiedad cargada se vuelve una entrada catalogada — número, coordenada, año, m², estilo.",
      tableHead: {
        n: "N°",
        location: "UBICACIÓN",
        type: "TIPO",
        area: "ÁREA",
        year: "AÑO",
        status: "ESTADO",
      },
      entries: [
        { n: "001", location: "Cap Cana · 18.4831° N", type: "Villa frente al mar", area: "640 m²", year: "2024", status: "Activo" },
        { n: "002", location: "Piantini · Santo Domingo", type: "Penthouse", area: "210 m²", year: "2022", status: "Activo" },
        { n: "003", location: "Casa de Campo", type: "Estate residencial", area: "1,840 m²", year: "2019", status: "Reservado" },
        { n: "004", location: "Bávaro · Punta Cana", type: "Condo de playa", area: "98 m²", year: "2023", status: "Activo" },
        { n: "005", location: "Las Terrenas", type: "Casa colonial", area: "320 m²", year: "1998", status: "Activo" },
        { n: "006", location: "Jardines del Sur · STI", type: "Apartamento", area: "145 m²", year: "2025", status: "Pre-venta" },
        { n: "007", location: "Boca Chica", type: "Solar costero", area: "1,200 m²", year: "—", status: "Activo" },
      ],
    },
    // Studio section
    studio: {
      label: "ESTUDIO · 05",
      n: "05",
      title: "El fotógrafo",
      titleAlt: "que siempre tienes",
      sub: "Reemplaza fotógrafos, home stagers y editores con una IA entrenada en interiores caribeños y arquitectura tropical.",
      tools: [
        { name: "Staging virtual", desc: "Amueblar espacios vacíos." },
        { name: "Despeje", desc: "Eliminar muebles viejos." },
        { name: "Cielo", desc: "Reemplazar cielos grises por azul Caribe." },
        { name: "Césped", desc: "Reverdecer jardines y patios." },
        { name: "Piscina", desc: "Limpiar y agregar agua turquesa." },
        { name: "Estilo", desc: "Cambiar entre modern, luxury, colonial, japandi." },
      ],
      cta: "Probar Studio IA",
    },
    // Pricing
    pricing: {
      label: "INVERSIÓN · 06",
      n: "06",
      title: "Tarifas",
      titleAlt: "anuales del Caribe",
      sub: "Sin tarjeta para empezar. Sube cuando estés vendiendo más.",
      monthly: "Mensual",
      yearly: "Anual · −20%",
    },
    // Final CTA
    finalCta: {
      label: "FIRMA",
      title: "Levanta tu",
      titleAlt: "primera entrada",
      sub: "Cinco minutos. Sin tarjeta. Tu primer catálogo listo antes del café.",
      primary: "Abrir mi catálogo",
      secondary: "Hablar con un capitán",
    },
    // Footer
    footer: {
      lat: "18°28′10″ N",
      lng: "69°55′52″ W",
      island: "REPÚBLICA DOMINICANA · CARIBE",
      version: "TIERRA v1 · 2026",
      product: "Producto",
      company: "Compañía",
      resources: "Recursos",
      legal: "Legal",
      about: "Sobre nosotros",
      blog: "Diario",
      careers: "Carreras",
      terms: "Términos",
      privacy: "Privacidad",
      contact: "Contacto",
    },
    // Property landing (Cinematic re-skin)
    property: {
      sections: {
        overview: "Vista general",
        spaces: "Espacios",
        location: "Ubicación",
        materials: "Materiales",
        floorplan: "Planta",
        contact: "Contacto",
        gallery: "Galería",
      },
      labels: {
        coord: "Coordenada",
        type: "Tipo",
        area: "Área construida",
        lot: "Solar",
        bedrooms: "Habitaciones",
        bathrooms: "Baños",
        parking: "Parqueos",
        year: "Año",
        price: "Precio",
        request: "Solicitar visita",
        download: "Descargar dossier",
        share: "Compartir",
      },
    },
    // Portal agente
    portal: {
      hero: {
        kicker: "Capítulo 01",
        intro: "Soy",
        outro: "y este es mi catálogo del territorio.",
      },
      sections: {
        catalog: "Catálogo activo",
        manifesto: "Sobre mí",
        contact: "Hablemos",
      },
      contact: {
        whatsapp: "WhatsApp",
        email: "Correo",
        phone: "Teléfono",
        visit: "Agendar visita",
      },
    },
  },
  en: {
    status: {
      coordinatesLabel: "COORDINATES",
      meridian: "MERIDIAN",
      issue: "ISSUE",
      issueValue: "VOL. I · 2026",
      sunrise: "SUN",
      tide: "TIDE",
      tideValue: "HIGH",
      sectionOf: "/ 06",
    },
    brand: {
      name: "ESTAILA × TIERRA",
      sub: "Atlas of Spaces",
      tagline: "Operating system for Caribbean agents",
    },
    hero: {
      kicker: "Chapter 01 · Opening",
      h1Pre: "An atlas for",
      h1Mid: "agents",
      h1Post: "who sell the island.",
      lead:
        "CRM, AI and public portal on one editorial surface. Designed for Caribbean tempo — slow in form, aggressive in closing.",
      ctaPrimary: "Plot my territory",
      ctaSecondary: "Browse the archive",
      meta1: "Independence",
      meta2: "AI native",
      meta3: "Caribbean basin",
    },
    marquee: [
      "Property catalog",
      "Visual pipeline",
      "AI virtual staging",
      "Agent portal",
      "Cinematic landings",
      "DOCX legal templates",
      "Territorial agenda",
      "Automated marketing",
    ],
    manifesto: {
      label: "MANIFESTO · 02",
      n: "02",
      title: "The lone agent",
      titleAlt: "becomes a team",
      body: [
        "Every independent agent runs three jobs at once: photographer, designer and closer.",
        "TIERRA folds the three into a single editorial surface. The catalog, the clauses, the visual intelligence and the close — same letter.",
      ],
      pillars: [
        { n: "01", word: "Catalog", desc: "Every property as an archive entry." },
        { n: "02", word: "Atlas", desc: "Locations mapped, not listed." },
        { n: "03", word: "Studio", desc: "Photography and staging from your phone." },
        { n: "04", word: "Closing", desc: "Pipeline, contracts and agenda." },
      ],
    },
    atlas: {
      label: "ATLAS · 03",
      n: "03",
      title: "Six regions",
      titleAlt: "of operation",
      sub: "Each tool is a region on the map. Visit them, don't use them.",
      regions: [
        { n: "I", title: "Catalog", coord: "18.4861° N", desc: "Properties, contacts, pipeline, agenda, finance. Wired." },
        { n: "II", title: "AI Studio", coord: "69.9312° W", desc: "Virtual staging, declutter, enhance, restyle. Seconds." },
        { n: "III", title: "Portal", coord: "Cap Cana", desc: "Public website with premium landing per property." },
        { n: "IV", title: "Pipeline", coord: "Santiago", desc: "Drag & drop kanban. New to closed in one gesture." },
        { n: "V", title: "Marketing", coord: "Santo Domingo", desc: "Captions, hashtags, posts, Meta campaigns — from the property." },
        { n: "VI", title: "Atlas", coord: "Punta Cana", desc: "Heat map with leads and performance per zone." },
      ],
    },
    archive: {
      label: "ARCHIVE · 04",
      n: "04",
      title: "Catalog of",
      titleAlt: "the territory",
      sub: "Every uploaded property becomes a catalogued entry — number, coordinate, year, sqm, style.",
      tableHead: {
        n: "N°",
        location: "LOCATION",
        type: "TYPE",
        area: "AREA",
        year: "YEAR",
        status: "STATUS",
      },
      entries: [
        { n: "001", location: "Cap Cana · 18.4831° N", type: "Beachfront villa", area: "640 m²", year: "2024", status: "Active" },
        { n: "002", location: "Piantini · Santo Domingo", type: "Penthouse", area: "210 m²", year: "2022", status: "Active" },
        { n: "003", location: "Casa de Campo", type: "Residential estate", area: "1,840 m²", year: "2019", status: "Reserved" },
        { n: "004", location: "Bávaro · Punta Cana", type: "Beach condo", area: "98 m²", year: "2023", status: "Active" },
        { n: "005", location: "Las Terrenas", type: "Colonial house", area: "320 m²", year: "1998", status: "Active" },
        { n: "006", location: "Jardines del Sur · STI", type: "Apartment", area: "145 m²", year: "2025", status: "Pre-sale" },
        { n: "007", location: "Boca Chica", type: "Coastal lot", area: "1,200 m²", year: "—", status: "Active" },
      ],
    },
    studio: {
      label: "STUDIO · 05",
      n: "05",
      title: "The photographer",
      titleAlt: "you always have",
      sub: "Replace photographers, home stagers and editors with an AI trained on Caribbean interiors and tropical architecture.",
      tools: [
        { name: "Virtual staging", desc: "Furnish empty spaces." },
        { name: "Declutter", desc: "Remove old furniture." },
        { name: "Sky", desc: "Replace grey skies with Caribbean blue." },
        { name: "Lawn", desc: "Re-green gardens and patios." },
        { name: "Pool", desc: "Clean and add turquoise water." },
        { name: "Style", desc: "Modern, luxury, colonial, japandi." },
      ],
      cta: "Try AI Studio",
    },
    pricing: {
      label: "INVESTMENT · 06",
      n: "06",
      title: "Caribbean",
      titleAlt: "annual rates",
      sub: "No card to start. Upgrade when you're selling more.",
      monthly: "Monthly",
      yearly: "Yearly · −20%",
    },
    finalCta: {
      label: "SIGNATURE",
      title: "Open your",
      titleAlt: "first entry",
      sub: "Five minutes. No card. Your first catalog ready before the coffee.",
      primary: "Open my catalog",
      secondary: "Talk to a captain",
    },
    footer: {
      lat: "18°28′10″ N",
      lng: "69°55′52″ W",
      island: "DOMINICAN REPUBLIC · CARIBBEAN",
      version: "TIERRA v1 · 2026",
      product: "Product",
      company: "Company",
      resources: "Resources",
      legal: "Legal",
      about: "About",
      blog: "Journal",
      careers: "Careers",
      terms: "Terms",
      privacy: "Privacy",
      contact: "Contact",
    },
    property: {
      sections: {
        overview: "Overview",
        spaces: "Spaces",
        location: "Location",
        materials: "Materials",
        floorplan: "Floor plan",
        contact: "Contact",
        gallery: "Gallery",
      },
      labels: {
        coord: "Coordinate",
        type: "Type",
        area: "Built area",
        lot: "Lot",
        bedrooms: "Bedrooms",
        bathrooms: "Bathrooms",
        parking: "Parking",
        year: "Year",
        price: "Price",
        request: "Request visit",
        download: "Download dossier",
        share: "Share",
      },
    },
    portal: {
      hero: {
        kicker: "Chapter 01",
        intro: "I am",
        outro: "and this is my catalog of the territory.",
      },
      sections: {
        catalog: "Active catalog",
        manifesto: "About me",
        contact: "Let's talk",
      },
      contact: {
        whatsapp: "WhatsApp",
        email: "Email",
        phone: "Phone",
        visit: "Schedule visit",
      },
    },
  },
} as const;

export type TierraDict = (typeof TIERRA)["es"];

export function useTierra(lang: Lang): TierraDict {
  return TIERRA[lang] as unknown as TierraDict;
}
