/**
 * Marketing site copy in multiple languages.
 * Keep keys flat-nested for easy access.
 */

export type Lang = "es" | "en";

export const MARKETING_T = {
  es: {
    nav: {
      features: "Funciones",
      studio: "Studio IA",
      templates: "Plantillas",
      pricing: "Precios",
      login: "Iniciar sesión",
      cta: "Empezar gratis",
    },
    hero: {
      eyebrow: "El sistema operativo del agente moderno",
      title1: "El CRM que",
      title2: "vende mientras duermes",
      subtitle:
        "CRM + IA + Portal público + Studio de fotos en un mismo lugar. Construido para agentes inmobiliarios independientes.",
      ctaPrimary: "Empezar gratis",
      ctaSecondary: "Ver demo",
      stats: {
        agents: "Agentes activos",
        properties: "Propiedades gestionadas",
        ai: "Imágenes IA generadas",
      },
    },
    marquee: [
      "Smart Property Hub",
      "Virtual Staging IA",
      "Portal público con plantillas",
      "Pipeline visual",
      "Marketing automatizado",
      "Mapbox integrado",
    ],
    features: {
      eyebrow: "Todo en uno",
      title1: "Un solo lugar para",
      title2: "vender más rápido",
      subtitle:
        "Reemplaza fotógrafos, diseñadores, editores y equipos de marketing con una plataforma que entiende real estate.",
      items: {
        crm: {
          title: "CRM completo",
          desc: "Propiedades, contactos, pipeline, agenda y finanzas. Todo conectado.",
        },
        studio: {
          title: "Studio IA",
          desc: "Virtual staging, eliminar objetos, mejorar calidad, cambiar estilo. En segundos.",
        },
        portal: {
          title: "Portal público",
          desc: "Sitio web propio con landing premium por propiedad. 4 plantillas.",
        },
        pipeline: {
          title: "Pipeline visual",
          desc: "Kanban drag & drop. Mueve leads de Nuevo a Cerrado con un click.",
        },
        marketing: {
          title: "Marketing automatizado",
          desc: "Genera captions, hashtags, posts y campañas Meta desde cada propiedad.",
        },
        analytics: {
          title: "Analytics por propiedad",
          desc: "Mide visitas, leads, engagement y ROI de cada inmueble.",
        },
      },
    },
    studio: {
      eyebrow: "Studio IA",
      title1: "Tu fotógrafo",
      title2: "siempre disponible",
      subtitle:
        "Sube una foto vacía o desordenada. La IA la transforma en una imagen que vende.",
      tools: [
        "Virtual Staging (8 estilos)",
        "Eliminar objetos",
        "Mejorar calidad",
        "Cambiar estilo",
        "Cielo despejado",
        "Atardecer dorado",
        "Piscina cristalina",
        "Césped verde",
      ],
      cta: "Probar Studio IA",
    },
    templates: {
      eyebrow: "Tu marca",
      title1: "Cada agente, su",
      title2: "propio estilo",
      subtitle:
        "Elige entre 4 plantillas premium para tu portal público. Cambia colores, tipografías y secciones con un click.",
      items: {
        luxury: { name: "Luxury Dark", tag: "Premium" },
        tropical: { name: "Tropical", tag: "Cálido" },
        minimal: { name: "Minimal Classic", tag: "Editorial" },
        bold: { name: "Modern Bold", tag: "Brutalismo" },
      },
    },
    howItWorks: {
      eyebrow: "Cómo funciona",
      title1: "De cero a vendiendo",
      title2: "en 5 minutos",
      steps: [
        {
          n: "01",
          title: "Crea tu cuenta",
          desc: "Sin tarjeta de crédito. 5 créditos IA gratis para probar todo.",
        },
        {
          n: "02",
          title: "Sube tus propiedades",
          desc: "Importa fotos, datos y propietarios. La IA hace el resto.",
        },
        {
          n: "03",
          title: "Publica tu portal",
          desc: "Cada propiedad tiene su landing premium en segundos. Comparte el link.",
        },
        {
          n: "04",
          title: "Cierra ventas",
          desc: "Pipeline visual, agenda y comunicación con clientes desde un solo lugar.",
        },
      ],
    },
    pricing: {
      eyebrow: "Precios",
      title1: "Inversión que",
      title2: "se paga sola",
      subtitle:
        "Empieza gratis. Sube de plan cuando estés vendiendo más.",
      plans: {
        free: {
          name: "Free",
          tag: "Para empezar",
          price: "0",
          features: [
            "CRM completo",
            "10 créditos IA / mes",
            "Hasta 5 propiedades",
            "Hasta 10 contactos",
            "1 plantilla de portal",
          ],
          cta: "Empezar gratis",
        },
        pro: {
          name: "Solo",
          tag: "Más popular",
          price: "12",
          features: [
            "Todo en Free",
            "60 créditos IA / mes",
            "Propiedades y contactos ilimitados",
            "Las 4 plantillas",
            "Sin marca de agua",
            "Soporte chat",
          ],
          cta: "Probar Solo",
        },
        team: {
          name: "Equipo",
          tag: "Equipos",
          price: "29",
          features: [
            "Todo en Solo",
            "200 créditos IA / mes",
            "Hasta 5 usuarios",
            "Dominio propio",
            "Branding propio",
            "Marketing IA",
          ],
          cta: "Probar Equipo",
        },
      },
      monthly: "Mensual",
      yearly: "Anual (2 meses gratis)",
    },
    testimonials: {
      eyebrow: "Voces reales",
      title1: "Agentes que ya",
      title2: "venden más",
      items: [
        {
          quote:
            "Antes pagaba $300 al mes en fotógrafo y editor. Ahora hago todo desde mi celular en 5 minutos.",
          name: "María Hernández",
          role: "Agente independiente",
        },
        {
          quote:
            "El portal con landing personalizada me cerró una venta de $850k en 2 semanas. Inversión recuperada el primer mes.",
          name: "Carlos Almonte",
          role: "Broker senior",
        },
        {
          quote:
            "La automatización de marketing me ahorra 10 horas a la semana. Y mis posts se ven mil veces mejor.",
          name: "Pedro Reyes",
          role: "Real estate consultant",
        },
      ],
    },
    finalCta: {
      eyebrow: "Empieza hoy",
      title1: "Tu próximo cierre",
      title2: "empieza aquí",
      subtitle:
        "Sin tarjeta de crédito. Sin compromisos. 5 minutos para crear tu cuenta.",
      primary: "Crear cuenta gratis",
      secondary: "Hablar con ventas",
    },
    footer: {
      tagline: "El sistema operativo del agente moderno",
      links: {
        product: "Producto",
        features: "Funciones",
        studio: "Studio IA",
        templates: "Plantillas",
        pricing: "Precios",
        company: "Compañía",
        about: "Sobre nosotros",
        blog: "Blog",
        careers: "Carreras",
        legal: "Legal",
        terms: "Términos",
        privacy: "Privacidad",
        cookies: "Cookies",
      },
      copyright: "© 2026 estaila. Todos los derechos reservados.",
      language: "Idioma",
    },
  },

  en: {
    nav: {
      features: "Features",
      studio: "AI Studio",
      templates: "Templates",
      pricing: "Pricing",
      login: "Sign in",
      cta: "Start free",
    },
    hero: {
      eyebrow: "The operating system for modern agents",
      title1: "The CRM that",
      title2: "sells while you sleep",
      subtitle:
        "CRM + AI + Public portal + Photo studio in one place. Built for independent real estate agents.",
      ctaPrimary: "Start free",
      ctaSecondary: "View demo",
      stats: {
        agents: "Active agents",
        properties: "Properties managed",
        ai: "AI images generated",
      },
    },
    marquee: [
      "Smart Property Hub",
      "AI Virtual Staging",
      "Public portal with templates",
      "Visual pipeline",
      "Marketing automation",
      "Mapbox integrated",
    ],
    features: {
      eyebrow: "All in one",
      title1: "One place to",
      title2: "sell faster",
      subtitle:
        "Replace photographers, designers, editors and marketing teams with a platform that understands real estate.",
      items: {
        crm: {
          title: "Complete CRM",
          desc: "Properties, contacts, pipeline, calendar and finances. All connected.",
        },
        studio: {
          title: "AI Studio",
          desc: "Virtual staging, decluttering, enhancement, style swap. In seconds.",
        },
        portal: {
          title: "Public portal",
          desc: "Your own website with premium landing per property. 4 templates.",
        },
        pipeline: {
          title: "Visual pipeline",
          desc: "Drag-and-drop kanban. Move leads from New to Closed with one click.",
        },
        marketing: {
          title: "Marketing automation",
          desc: "Generate captions, hashtags, posts and Meta campaigns from each property.",
        },
        analytics: {
          title: "Per-property analytics",
          desc: "Track visits, leads, engagement and ROI for every listing.",
        },
      },
    },
    studio: {
      eyebrow: "AI Studio",
      title1: "Your photographer,",
      title2: "always available",
      subtitle:
        "Upload an empty or cluttered photo. AI transforms it into an image that sells.",
      tools: [
        "Virtual Staging (8 styles)",
        "Object removal",
        "Quality enhancement",
        "Style change",
        "Sky replacement",
        "Golden twilight",
        "Crystal pool",
        "Green lawn",
      ],
      cta: "Try AI Studio",
    },
    templates: {
      eyebrow: "Your brand",
      title1: "Every agent, their",
      title2: "own style",
      subtitle:
        "Choose between 4 premium templates for your public portal. Change colors, typography and sections with one click.",
      items: {
        luxury: { name: "Luxury Dark", tag: "Premium" },
        tropical: { name: "Tropical", tag: "Warm" },
        minimal: { name: "Minimal Classic", tag: "Editorial" },
        bold: { name: "Modern Bold", tag: "Brutalist" },
      },
    },
    howItWorks: {
      eyebrow: "How it works",
      title1: "From zero to selling",
      title2: "in 5 minutes",
      steps: [
        {
          n: "01",
          title: "Create your account",
          desc: "No credit card needed. 5 AI credits free to try everything.",
        },
        {
          n: "02",
          title: "Upload your properties",
          desc: "Import photos, data and owners. AI does the rest.",
        },
        {
          n: "03",
          title: "Publish your portal",
          desc: "Each property has its premium landing in seconds. Share the link.",
        },
        {
          n: "04",
          title: "Close deals",
          desc: "Visual pipeline, calendar and client communication in one place.",
        },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title1: "An investment that",
      title2: "pays for itself",
      subtitle: "Start free. Upgrade when you're selling more.",
      plans: {
        free: {
          name: "Free",
          tag: "Get started",
          price: "0",
          features: [
            "Complete CRM",
            "10 AI credits / month",
            "Up to 5 properties",
            "Up to 10 contacts",
            "1 portal template",
          ],
          cta: "Start free",
        },
        pro: {
          name: "Solo",
          tag: "Most popular",
          price: "12",
          features: [
            "Everything in Free",
            "60 AI credits / month",
            "Unlimited properties & contacts",
            "All 4 templates",
            "No watermark",
            "Chat support",
          ],
          cta: "Try Solo",
        },
        team: {
          name: "Team",
          tag: "Teams",
          price: "29",
          features: [
            "Everything in Solo",
            "200 AI credits / month",
            "Up to 5 users",
            "Custom domain",
            "Custom branding",
            "Marketing AI",
          ],
          cta: "Try Team",
        },
      },
      monthly: "Monthly",
      yearly: "Yearly (2 months free)",
    },
    testimonials: {
      eyebrow: "Real voices",
      title1: "Agents who are",
      title2: "selling more",
      items: [
        {
          quote:
            "I used to spend $300 a month on photographer and editor. Now I do it all from my phone in 5 minutes.",
          name: "Maria Hernandez",
          role: "Independent agent",
        },
        {
          quote:
            "The portal with custom landing closed me an $850k sale in 2 weeks. Investment recovered in the first month.",
          name: "Carlos Almonte",
          role: "Senior broker",
        },
        {
          quote:
            "Marketing automation saves me 10 hours a week. And my posts look a thousand times better.",
          name: "Pedro Reyes",
          role: "Real estate consultant",
        },
      ],
    },
    finalCta: {
      eyebrow: "Start today",
      title1: "Your next deal",
      title2: "starts here",
      subtitle:
        "No credit card. No commitments. 5 minutes to create your account.",
      primary: "Create free account",
      secondary: "Talk to sales",
    },
    footer: {
      tagline: "The operating system for modern agents",
      links: {
        product: "Product",
        features: "Features",
        studio: "AI Studio",
        templates: "Templates",
        pricing: "Pricing",
        company: "Company",
        about: "About us",
        blog: "Blog",
        careers: "Careers",
        legal: "Legal",
        terms: "Terms",
        privacy: "Privacy",
        cookies: "Cookies",
      },
      copyright: "© 2026 estaila. All rights reserved.",
      language: "Language",
    },
  },
} as const;

export type MarketingDict = (typeof MARKETING_T)["es"];
