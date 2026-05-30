/**
 * Seed script — populates demo data for estaila MVP.
 * Run: pnpm db:seed
 */
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../lib/db";

const DEMO_EMAIL = "demo@estaila.com";
const DEMO_PASSWORD = "demo123";

// Unsplash placeholders for property photos (royalty-free)
const PHOTO = {
  miraflores: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  plazaMarcella: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
  losRosales: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
  alamos: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
  merida: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
  aybResidences: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
  altInterior1: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  altInterior2: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
  altInterior3: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
};

async function ensureDemoUser() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    // Dynamic import — auth.ts pulls in server-only deps that break tsx
    // if loaded eagerly. Only import when we actually need it.
    try {
      const { auth } = await import("../lib/auth");
      await auth.api.signUpEmail({
        body: {
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          name: "Demo Agente",
        },
      });
    } catch (e) {
      console.log("signUpEmail note:", (e as Error).message);
    }
    user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  }
  if (!user) throw new Error("Could not create demo user");

  // Cuenta ANCLA: plan AGENCY (todos los módulos desbloqueados) + créditos altos
  // para que el visitante vea TODO el sistema funcionando y quiera suscribirse.
  user = await prisma.user.update({
    where: { id: user.id },
    data: { plan: "AGENCY", credits: 500, emailVerified: true },
  });

  // Garantiza la contraseña demo123 aunque la cuenta ya exista (hash oficial).
  try {
    const hashed = await hashPassword(DEMO_PASSWORD);
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashed },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: DEMO_EMAIL,
          password: hashed,
        },
      });
    }
  } catch (e) {
    console.log("password set note:", (e as Error).message);
  }
  return user;
}

async function ensureTesterUser() {
  const EMAIL = "tester@estaila.com";
  const PASSWORD = "tester123";
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  // Rol tester: módulos desbloqueados (AGENCY) + créditos IA capados (margen medio).
  // Creamos el usuario directo con prisma (auth.api.signUpEmail no carga bien bajo tsx).
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        name: "Tester estaila",
        emailVerified: true,
        isTester: true,
        plan: "AGENCY",
        credits: 150,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isTester: true, plan: "AGENCY", credits: 150, emailVerified: true },
    });
  }

  // Garantiza la contraseña aunque la cuenta ya exista (hash oficial).
  try {
    const hashed = await hashPassword(PASSWORD);
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashed },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: EMAIL,
          password: hashed,
        },
      });
    }
  } catch (e) {
    console.log("password set (tester) note:", (e as Error).message);
  }
  return user;
}

async function main() {
  console.log("→ Seeding estaila...");

  // Production guard: never seed the public demo account in prod.
  // Override with ALLOW_DEMO_SEED=true if you really need it (staging etc).
  const isProd = process.env.NODE_ENV === "production";
  const explicitlyAllowed = process.env.ALLOW_DEMO_SEED === "true";
  if (isProd && !explicitlyAllowed) {
    console.log(
      "✗ Skipped: NODE_ENV=production. Set ALLOW_DEMO_SEED=true to override."
    );
    return;
  }

  const user = await ensureDemoUser();
  console.log(`✓ Demo user: ${user.email} (id=${user.id})`);

  const tester = await ensureTesterUser();
  console.log(
    `✓ Tester user: ${tester.email} (id=${tester.id}) — isTester, plan AGENCY, 150 créditos`
  );

  // Clean prior demo data (idempotent re-seed)
  await prisma.aIGeneration.deleteMany({ where: { userId: user.id } });
  await prisma.photo.deleteMany({ where: { userId: user.id } });
  // New tables (cascade-deleted via contact, but explicit for clarity)
  await prisma.contactActivity.deleteMany({
    where: { contact: { userId: user.id } },
  });
  await prisma.contactTag.deleteMany({
    where: { contact: { userId: user.id } },
  });
  await prisma.contactCustomField.deleteMany({
    where: { contact: { userId: user.id } },
  });
  await prisma.tag.deleteMany({ where: { userId: user.id } });
  await prisma.smartList.deleteMany({ where: { userId: user.id } });
  await prisma.maintenanceTicket.deleteMany({ where: { userId: user.id } });
  await prisma.rentalPayment.deleteMany({ where: { userId: user.id } });
  await prisma.tenant.deleteMany({ where: { userId: user.id } });
  await prisma.appointment.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.pipelineCard.deleteMany({ where: { userId: user.id } });
  await prisma.property.deleteMany({ where: { userId: user.id } });
  await prisma.contact.deleteMany({ where: { userId: user.id } });
  await prisma.marketingPost.deleteMany({ where: { userId: user.id } });

  // === CONTACTS ===
  const contacts = await Promise.all(
    [
      {
        name: "Carlos Almonte",
        type: "PROPIETARIO",
        phone: "+1 809-555-0101",
        whatsapp: "+1 809-555-0101",
        email: "calmonte@example.com",
        location: "Santo Domingo",
        ratings: JSON.stringify(["RESPONSABLE", "BUENA_PAGA"]),
        favorite: true,
      },
      {
        name: "María Hernández",
        type: "CLIENTE",
        phone: "+1 809-555-0202",
        whatsapp: "+1 809-555-0202",
        email: "maria.h@example.com",
        location: "Santiago",
        ratings: JSON.stringify(["MUY_INTERESADO"]),
        favorite: true,
      },
      {
        name: "Pedro Reyes",
        type: "INQUILINO",
        phone: "+1 829-555-0303",
        location: "Punta Cana",
      },
      {
        name: "Lic. Ana Sosa",
        type: "ABOGADO",
        phone: "+1 809-555-0404",
        email: "ana.sosa@bufete-rd.com",
        location: "Santo Domingo",
        profession: JSON.stringify(["ABOGADO"]),
      },
      {
        name: "Inmobiliaria Vista",
        type: "COLEGA_INMOBILIARIO",
        phone: "+1 809-555-0505",
        email: "contacto@vista.do",
        location: "Bávaro",
      },
      {
        name: "Juan Pérez",
        type: "PLOMERO",
        phone: "+1 849-555-0606",
        location: "Santo Domingo",
        profession: JSON.stringify(["PLOMERO"]),
        ratings: JSON.stringify(["RESPONSABLE"]),
      },
      {
        name: "Roberto Castillo",
        type: "ELECTRICISTA",
        phone: "+1 829-555-0707",
        profession: JSON.stringify(["ELECTRICISTA"]),
      },
      {
        name: "Constructora Norte",
        type: "CONTRATISTA",
        phone: "+1 809-555-0808",
        email: "info@norte-rd.com",
        rnc: "131-12345-6",
      },
      {
        name: "Familia Ramírez",
        type: "CLIENTE",
        phone: "+1 809-555-0909",
        location: "La Romana",
        ratings: JSON.stringify(["MUY_INTERESADO", "BUENA_PAGA"]),
      },
      {
        name: "Edesur",
        type: "UTILITY",
        phone: "+1 809-688-1118",
      },
    ].map((c) =>
      prisma.contact.create({
        data: {
          userId: user.id,
          name: c.name,
          type: c.type,
          phone: c.phone ?? null,
          whatsapp: c.whatsapp ?? null,
          email: c.email ?? null,
          location: c.location ?? null,
          rnc: c.rnc ?? null,
          ratings: c.ratings ?? "[]",
          profession: c.profession ?? "[]",
          favorite: c.favorite ?? false,
        },
      })
    )
  );
  console.log(`✓ Contacts: ${contacts.length}`);

  const owner1 = contacts[0]; // Carlos
  const owner2 = contacts[8]; // Ramírez

  // === PROPERTIES ===
  const props = await Promise.all([
    prisma.property.create({
      data: {
        userId: user.id,
        title: "Casa en Miraflores",
        description:
          "Casa familiar en sector residencial premium. Diseño moderno con acabados de primera, jardín privado y excelente iluminación natural en cada espacio.",
        customTagline: "Una casa que se siente como un retiro",
        category: "CASA",
        operation: "EN_VENTA",
        status: "DESLINDADA",
        priceUSD: 1_000_000,
        bedrooms: 3,
        bathrooms: 2,
        parking: 1,
        metersSquared: 220,
        location: "Miraflores, Santo Domingo",
        address: "Calle Mirador Norte 45, Miraflores",
        lat: 18.4861,
        lng: -69.9312,
        amenities: JSON.stringify([
          "POOL",
          "GARDEN",
          "SECURITY",
          "PARKING",
          "PET",
          "SMART_HOME",
        ]),
        finishes: JSON.stringify([
          "Porcelanato europeo importado",
          "Cocina Bosch con isla central",
          "Mármol Calacatta en baño principal",
          "Carpintería en roble natural",
          "Ventanería doble vidrio piso a techo",
          "Domótica integrada (Google Home)",
        ]),
        floorPlans: JSON.stringify([
          { type: "Casa completa", beds: 3, baths: 2, m2: 220, units: 1 },
        ]),
        nearbyPois: JSON.stringify([
          { key: "MALL", distance: "5 min" },
          { key: "RESTAURANTS", distance: "3 min" },
          { key: "CAFES", distance: "2 min" },
          { key: "HOSPITAL", distance: "8 min" },
          { key: "PARK", distance: "5 min" },
          { key: "UNIVERSITY", distance: "12 min" },
        ]),
        featuredPhoto: PHOTO.miraflores,
        ownerId: owner1.id,
      },
    }),
    prisma.property.create({
      data: {
        userId: user.id,
        title: "Local en Plaza Marcella",
        description:
          "Local comercial en plaza de alto tráfico. Ideal para retail boutique, café de especialidad o food service de nicho.",
        category: "LOCAL_COMERCIAL",
        operation: "EN_ALQUILER",
        status: "NUEVO",
        priceUSD: 150_000,
        metersSquared: 20,
        location: "Plaza Marcella, Naco",
        address: "Plaza Marcella, Av. Tiradentes, Naco",
        lat: 18.4738,
        lng: -69.9356,
        amenities: JSON.stringify(["PARKING", "SECURITY", "ELEVATOR"]),
        nearbyPois: JSON.stringify([
          { key: "RESTAURANTS", distance: "1 min" },
          { key: "CAFES", distance: "1 min" },
          { key: "MALL", distance: "0 min" },
        ]),
        featuredPhoto: PHOTO.plazaMarcella,
      },
    }),
    prisma.property.create({
      data: {
        userId: user.id,
        title: "Casa Los Rosales",
        description:
          "Casa contemporánea lista para entrega. Doble altura, ventanas panorámicas y jardín integrado al área social. Construcción 2024.",
        customTagline: "Donde la luz se convierte en arquitectura",
        category: "CASA",
        operation: "EN_VENTA",
        status: "DESLINDADA",
        priceUSD: 1_200_000,
        bedrooms: 3,
        bathrooms: 2,
        parking: 2,
        metersSquared: 250,
        location: "Los Rosales, Santiago",
        address: "Urb. Los Rosales, Calle Principal 12, Santiago",
        lat: 19.4517,
        lng: -70.697,
        amenities: JSON.stringify([
          "POOL",
          "GARDEN",
          "BBQ",
          "SECURITY",
          "PARKING",
          "PET",
          "SMART_HOME",
          "GYM",
        ]),
        finishes: JSON.stringify([
          "Pisos de mármol pulido importado",
          "Cocina Miele con isla y horno doble",
          "Baño principal con jacuzzi y vapor",
          "Carpintería en roble natural",
          "Ventanería de piso a techo con cristal templado",
          "Sistema de climatización VRF",
          "Iluminación arquitectónica LED programable",
        ]),
        floorPlans: JSON.stringify([
          { type: "Casa principal", beds: 3, baths: 2, m2: 250, units: 1 },
        ]),
        nearbyPois: JSON.stringify([
          { key: "MALL", distance: "8 min" },
          { key: "RESTAURANTS", distance: "5 min" },
          { key: "AIRPORT", distance: "15 min" },
          { key: "HOSPITAL", distance: "10 min" },
          { key: "UNIVERSITY", distance: "12 min" },
          { key: "PARK", distance: "3 min" },
        ]),
        featuredPhoto: PHOTO.losRosales,
        ownerId: owner1.id,
      },
    }),
    prisma.property.create({
      data: {
        userId: user.id,
        title: "Casa en Álamos II",
        description:
          "Proyecto residencial en plano. Casa de diseño arquitectónico con piscina infinity, vista panorámica al campo de golf y entrega en 18 meses. Excelente plusvalía.",
        customTagline: "Vive donde otros sueñan vacacionar",
        category: "CASA",
        operation: "EN_VENTA",
        status: "EN_PLANO",
        priceUSD: 2_120_000,
        bedrooms: 4,
        bathrooms: 4.5,
        parking: 3,
        metersSquared: 480,
        location: "Álamos II, Punta Cana",
        address: "Álamos II, Cap Cana, Punta Cana",
        lat: 18.5601,
        lng: -68.3725,
        amenities: JSON.stringify([
          "POOL",
          "ROOFTOP",
          "GYM",
          "GARDEN",
          "BBQ",
          "SECURITY",
          "PARKING",
          "PET",
          "SMART_HOME",
          "PLAYGROUND",
        ]),
        finishes: JSON.stringify([
          "Mármol Calacatta en áreas sociales",
          "Cocina Bulthaup con isla de 4 metros",
          "Baño principal con sauna privado",
          "Carpintería en wenge importada",
          "Ventanería estructural sin marcos visibles",
          "Domótica Crestron con escenas programables",
          "Climatización VRF por zonas",
          "Generador eléctrico full backup",
        ]),
        floorPlans: JSON.stringify([
          { type: "Tipo A — Casa estándar", beds: 4, baths: 4, m2: 480, units: 8 },
          { type: "Tipo B — Penthouse", beds: 5, baths: 5.5, m2: 650, units: 4 },
          { type: "Tipo C — Villa al campo de golf", beds: 5, baths: 6, m2: 850, units: 2 },
        ]),
        nearbyPois: JSON.stringify([
          { key: "BEACH", distance: "8 min" },
          { key: "AIRPORT", distance: "20 min" },
          { key: "RESTAURANTS", distance: "5 min" },
          { key: "MALL", distance: "12 min" },
          { key: "HOSPITAL", distance: "10 min" },
          { key: "PARK", distance: "2 min" },
        ]),
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        featuredPhoto: PHOTO.alamos,
      },
    }),
    prisma.property.create({
      data: {
        userId: user.id,
        title: "Solar en Mérida",
        description:
          "Solar deslindado con todos los papeles al día. Excelente ubicación para construir tu casa de ensueño con vista a las montañas.",
        category: "SOLAR",
        operation: "EN_VENTA",
        status: "DESLINDADA",
        priceUSD: 500_000,
        metersSquared: 800,
        location: "Mérida, Santiago",
        address: "Sector Mérida, Calle 5, Santiago",
        lat: 19.4634,
        lng: -70.7029,
        amenities: JSON.stringify(["GARDEN", "PARKING"]),
        nearbyPois: JSON.stringify([
          { key: "PARK", distance: "5 min" },
          { key: "MALL", distance: "15 min" },
          { key: "HOSPITAL", distance: "12 min" },
        ]),
        featuredPhoto: PHOTO.merida,
      },
    }),
    prisma.property.create({
      data: {
        userId: user.id,
        title: "A Y B Residences",
        description:
          "Torre residencial premium en Bella Vista. Apartamentos con vista al mar Caribe, amenidades de hotel 5 estrellas y entrega en 12 meses.",
        customTagline: "Vida urbana a otra altura",
        category: "APARTAMENTO",
        operation: "EN_VENTA",
        status: "EN_PLANO",
        priceUSD: 350_000,
        bedrooms: 3,
        bathrooms: 2.5,
        parking: 2,
        metersSquared: 145,
        location: "Bella Vista, Santo Domingo",
        address: "Av. Anacaona 28, Bella Vista, Santo Domingo",
        lat: 18.4621,
        lng: -69.9419,
        amenities: JSON.stringify([
          "POOL",
          "ROOFTOP",
          "GYM",
          "COWORK",
          "SECURITY",
          "PARKING",
          "PET",
          "SMART_HOME",
          "ELEVATOR",
          "PLAYGROUND",
        ]),
        finishes: JSON.stringify([
          "Porcelanato gran formato 120x120",
          "Cocina italiana con isla",
          "Baños con grifería Hansgrohe",
          "Ventanería antirruido doble vidrio",
          "Smart home con Alexa integrada",
          "Pre-instalación EV charging",
        ]),
        floorPlans: JSON.stringify([
          { type: "Tipo A — 2 hab", beds: 2, baths: 2, m2: 95, units: 18 },
          { type: "Tipo B — 3 hab estándar", beds: 3, baths: 2.5, m2: 145, units: 24 },
          { type: "Tipo C — Penthouse", beds: 4, baths: 4, m2: 280, units: 4 },
        ]),
        nearbyPois: JSON.stringify([
          { key: "BEACH", distance: "10 min" },
          { key: "MALL", distance: "3 min" },
          { key: "RESTAURANTS", distance: "1 min" },
          { key: "CAFES", distance: "1 min" },
          { key: "HOSPITAL", distance: "6 min" },
          { key: "UNIVERSITY", distance: "8 min" },
          { key: "AIRPORT", distance: "25 min" },
          { key: "PARK", distance: "4 min" },
        ]),
        featuredPhoto: PHOTO.aybResidences,
        ownerId: owner2.id,
      },
    }),
  ]);
  console.log(`✓ Properties: ${props.length}`);

  // === PHOTOS (extra interior shots for AI Studio demo) ===
  await prisma.photo.createMany({
    data: [
      { userId: user.id, propertyId: props[0].id, url: PHOTO.miraflores, order: 0 },
      { userId: user.id, propertyId: props[0].id, url: PHOTO.altInterior1, order: 1 },
      { userId: user.id, propertyId: props[0].id, url: PHOTO.altInterior2, order: 2 },
      { userId: user.id, propertyId: props[2].id, url: PHOTO.losRosales, order: 0 },
      { userId: user.id, propertyId: props[2].id, url: PHOTO.altInterior3, order: 1 },
      { userId: user.id, propertyId: props[5].id, url: PHOTO.aybResidences, order: 0 },
    ],
  });

  // === STUDIO IA — galería de generaciones (showcase del módulo estrella) ===
  await prisma.aIGeneration.deleteMany({ where: { userId: user.id } });
  await prisma.aIGeneration.createMany({
    data: [
      { userId: user.id, tool: "STAGING", inputUrl: PHOTO.altInterior1, outputUrl: PHOTO.miraflores, prompt: "Staging moderno, sala luminosa", style: "modern", roomType: "living", status: "COMPLETED", creditsUsed: 1, completedAt: new Date() },
      { userId: user.id, tool: "TWILIGHT", inputUrl: PHOTO.alamos, outputUrl: PHOTO.merida, prompt: "Atardecer cinematográfico", status: "COMPLETED", creditsUsed: 1, completedAt: new Date() },
      { userId: user.id, tool: "SKY", inputUrl: PHOTO.losRosales, outputUrl: PHOTO.aybResidences, prompt: "Cielo azul vibrante", status: "COMPLETED", creditsUsed: 1, completedAt: new Date() },
      { userId: user.id, tool: "DECLUTTER", inputUrl: PHOTO.altInterior2, outputUrl: PHOTO.altInterior3, prompt: "Espacio despejado y ordenado", status: "COMPLETED", creditsUsed: 1, completedAt: new Date() },
      { userId: user.id, tool: "POOL", inputUrl: PHOTO.merida, outputUrl: PHOTO.aybResidences, prompt: "Piscina con agua turquesa", status: "COMPLETED", creditsUsed: 1, completedAt: new Date() },
      { userId: user.id, tool: "ENHANCE", inputUrl: PHOTO.altInterior3, outputUrl: PHOTO.altInterior1, prompt: "Mejora de luz y nitidez", style: "luxury", roomType: "bedroom", status: "COMPLETED", creditsUsed: 1, completedAt: new Date() },
    ],
  });
  console.log("✓ AI gallery: 6 generaciones");

  // === TRANSACTIONS ===
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        propertyId: props[0].id,
        concept: "Reserva Casa Miraflores",
        amount: 10_000,
        category: "INGRESO",
        type: "RESERVA",
        status: "PAGADO",
        currency: "USD",
        date: new Date("2026-05-01"),
      },
      {
        userId: user.id,
        propertyId: props[2].id,
        concept: "Comisión venta Los Rosales (50%)",
        amount: 18_000,
        category: "INGRESO",
        type: "COMISION",
        status: "EN_PROGRESO",
        currency: "USD",
        date: new Date("2026-05-10"),
      },
      {
        userId: user.id,
        propertyId: props[1].id,
        concept: "Mantenimiento local",
        amount: 850,
        category: "GASTO",
        type: "MANTENIMIENTO",
        status: "PAGADO",
        currency: "USD",
        date: new Date("2026-04-22"),
      },
      {
        userId: user.id,
        concept: "Publicidad Instagram Ads",
        amount: 300,
        category: "GASTO",
        type: "PUBLICIDAD",
        status: "PAGADO",
        currency: "USD",
        date: new Date("2026-05-05"),
      },
      {
        userId: user.id,
        concept: "Suscripción Portales (PortalesRD)",
        amount: 75,
        category: "GASTO",
        type: "SUSCRIPCION",
        status: "PAGADO",
        currency: "USD",
        date: new Date("2026-05-01"),
      },
      {
        userId: user.id,
        propertyId: props[5].id,
        concept: "Reserva A Y B Residences",
        amount: 5_000,
        category: "INGRESO",
        type: "RESERVA",
        status: "PENDIENTE",
        currency: "USD",
        date: new Date("2026-05-15"),
      },
      {
        userId: user.id,
        concept: "Honorarios legales (Lic. Sosa)",
        amount: 1_200,
        category: "GASTO",
        type: "LEGAL",
        status: "PENDIENTE",
        currency: "USD",
        date: new Date("2026-05-12"),
      },
      {
        userId: user.id,
        concept: "Diseño folleto marketing Q2",
        amount: 450,
        category: "GASTO",
        type: "MARKETING",
        status: "PAGADO",
        currency: "USD",
        date: new Date("2026-04-28"),
      },
    ],
  });
  console.log(`✓ Transactions: 8`);

  // === APPOINTMENTS ===
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  await prisma.appointment.createMany({
    data: [
      {
        userId: user.id,
        propertyId: props[0].id,
        title: "Visita Casa Miraflores con cliente Ramírez",
        startAt: new Date(tomorrow.setHours(10, 0, 0, 0)),
        endAt: new Date(tomorrow.setHours(11, 0, 0, 0)),
        status: "PENDIENTE",
        location: "Miraflores",
        attendees: "Familia Ramírez",
      },
      {
        userId: user.id,
        propertyId: props[5].id,
        title: "Firma contrato A Y B Residences",
        startAt: new Date(nextWeek.setHours(15, 0, 0, 0)),
        endAt: new Date(nextWeek.setHours(16, 30, 0, 0)),
        status: "PENDIENTE",
        location: "Oficina Lic. Sosa",
        attendees: "María Hernández, Lic. Ana Sosa",
      },
      {
        userId: user.id,
        propertyId: props[2].id,
        title: "Llamada de seguimiento Los Rosales",
        startAt: new Date(today.setHours(14, 0, 0, 0)),
        status: "EN_CURSO",
        attendees: "Carlos Almonte",
      },
      {
        userId: user.id,
        propertyId: props[1].id,
        title: "Recorrido local Plaza Marcella",
        startAt: new Date(yesterday.setHours(11, 0, 0, 0)),
        endAt: new Date(yesterday.setHours(12, 0, 0, 0)),
        status: "COMPLETADO",
        location: "Plaza Marcella",
        attendees: "Inmobiliaria Vista",
      },
    ],
  });
  console.log(`✓ Appointments: 4`);

  // === PIPELINE CARDS ===
  await prisma.pipelineCard.createMany({
    data: [
      {
        userId: user.id,
        contactId: contacts[8].id, // Familia Ramírez
        propertyId: props[0].id,
        stage: "VISITA",
        value: 1_000_000,
        notes: "Muy interesados. Visita programada mañana 10am.",
        nextAction: "Confirmar asistencia visita",
        nextActionDate: tomorrow,
        order: 0,
      },
      {
        userId: user.id,
        contactId: contacts[1].id, // María
        propertyId: props[5].id,
        stage: "NEGOCIACION",
        value: 150_000,
        notes: "Pendiente firma contrato. Documentación en revisión legal.",
        nextAction: "Firmar contrato",
        nextActionDate: nextWeek,
        order: 0,
      },
      {
        userId: user.id,
        contactId: contacts[4].id, // Inmobiliaria Vista
        propertyId: props[1].id,
        stage: "CONTACTADO",
        value: 150_000,
        notes: "Interesados en alquilar para tienda. Esperan propuesta económica.",
        nextAction: "Enviar propuesta",
        order: 0,
      },
      {
        userId: user.id,
        contactId: contacts[2].id, // Pedro Reyes
        propertyId: props[3].id,
        stage: "NUEVO",
        value: 2_120_000,
        notes: "Llegó por anuncio en portal. Sin contactar aún.",
        nextAction: "Llamar y calificar",
        order: 0,
      },
    ],
  });
  console.log(`✓ Pipeline cards: 4`);

  // === MARKETING POSTS ===
  await prisma.marketingPost.createMany({
    data: [
      {
        userId: user.id,
        title: "Nueva propiedad: Casa Los Rosales",
        content:
          "✨ Casa moderna lista para entrega en Los Rosales. 3 hab / 2 baños / 2 parqueos. US$ 1,200,000.",
        channel: "INSTAGRAM",
        status: "DRAFT",
        imageUrl: PHOTO.losRosales,
      },
      {
        userId: user.id,
        title: "Oportunidad: Solar deslindado en Mérida",
        content:
          "🌴 Solar deslindado de 20m² en Mérida. Listo para construir. US$ 500,000.",
        channel: "FACEBOOK",
        status: "SCHEDULED",
        scheduledFor: tomorrow,
        imageUrl: PHOTO.merida,
      },
    ],
  });
  console.log(`✓ Marketing posts: 2`);

  // === TAGS ===
  const tags = await Promise.all(
    [
      { name: "Hot Lead", color: "#EF4444", icon: "Flame" },
      { name: "VIP", color: "#A855F7", icon: "Crown" },
      { name: "Cash Buyer", color: "#10B981", icon: "DollarSign" },
      { name: "Inversionista", color: "#F59E0B", icon: "TrendingUp" },
      { name: "Referido", color: "#06B6D4", icon: "Share2" },
      { name: "Necesita seguimiento", color: "#6366F1", icon: "Clock" },
    ].map((t) =>
      prisma.tag.create({
        data: { userId: user.id, name: t.name, color: t.color, icon: t.icon },
      })
    )
  );
  console.log(`✓ Tags: ${tags.length}`);

  const [tHot, tVip, tCash, tInv, tRef, tFollow] = tags;

  // === CONTACT TAGS (m:n) ===
  await prisma.contactTag.createMany({
    data: [
      { contactId: contacts[0].id, tagId: tVip.id }, // Carlos · VIP
      { contactId: contacts[0].id, tagId: tCash.id }, // Carlos · Cash
      { contactId: contacts[1].id, tagId: tHot.id }, // María · Hot Lead
      { contactId: contacts[1].id, tagId: tFollow.id }, // María · follow-up
      { contactId: contacts[2].id, tagId: tFollow.id }, // Pedro
      { contactId: contacts[5].id, tagId: tRef.id }, // Inmobiliaria Vista · Referido
      { contactId: contacts[8].id, tagId: tInv.id }, // Familia Ramírez · Inversionista
      { contactId: contacts[8].id, tagId: tHot.id }, // Familia Ramírez · Hot Lead
    ],
  });
  console.log(`✓ ContactTags: 8`);

  // === CONTACT ACTIVITIES (timeline backfill) ===
  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const hours = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000);

  const activities: Array<{
    contactId: string;
    type: string;
    title: string;
    content?: string;
    durationMin?: number;
    createdAt: Date;
  }> = [
    // Carlos Almonte (propietario, hot)
    {
      contactId: contacts[0].id,
      type: "WHATSAPP_SENT",
      title: "WhatsApp enviado",
      content: "Hola Carlos, tengo dos clientes interesados en Miraflores. ¿Cuándo podemos coordinar visitas esta semana?",
      createdAt: hours(3),
    },
    {
      contactId: contacts[0].id,
      type: "CALL",
      title: "Llamada · 12 min",
      content: "Hablamos sobre ajustar precio a US$ 365k. Acepta si se cierra antes del 30.",
      durationMin: 12,
      createdAt: days(2),
    },
    {
      contactId: contacts[0].id,
      type: "NOTE",
      title: "Nota",
      content: "Considera bajar de precio si se hacen 2 visitas sin oferta. Preguntó por refinanciar la hipoteca.",
      createdAt: days(5),
    },
    {
      contactId: contacts[0].id,
      type: "VISIT",
      title: "Visita en Miraflores",
      content: "Tour completo con familia Ramírez. Mucho interés.",
      createdAt: days(7),
    },
    // María Hernández (cliente, hot)
    {
      contactId: contacts[1].id,
      type: "WHATSAPP_SENT",
      title: "WhatsApp enviado",
      content: "María, te paso el dossier de A Y B Residences. La unidad 502 sigue disponible.",
      createdAt: hours(8),
    },
    {
      contactId: contacts[1].id,
      type: "EMAIL",
      title: "Email enviado",
      content: "Resumen ejecutivo de las 3 propiedades shortlisteadas.",
      createdAt: days(1),
    },
    {
      contactId: contacts[1].id,
      type: "CALL",
      title: "Llamada · 8 min",
      content: "Confirma presupuesto US$ 180-220k. Prefiere zona Santiago centro.",
      durationMin: 8,
      createdAt: days(3),
    },
    // Pedro Reyes (inquilino)
    {
      contactId: contacts[2].id,
      type: "WHATSAPP_SENT",
      title: "WhatsApp enviado",
      content: "Pedro, te recuerdo el pago de la renta vence el 5. Cualquier cosa me avisas.",
      createdAt: days(4),
    },
    {
      contactId: contacts[2].id,
      type: "NOTE",
      title: "Nota",
      content: "Pidió revisión del aire acondicionado del cuarto principal. Programar visita técnica.",
      createdAt: days(10),
    },
    // Ana Sosa (abogado)
    {
      contactId: contacts[3].id,
      type: "EMAIL",
      title: "Email enviado",
      content: "Borrador de contrato Casa Miraflores enviado para revisión.",
      createdAt: days(6),
    },
    // Inmobiliaria Vista (colega)
    {
      contactId: contacts[5].id,
      type: "CALL",
      title: "Llamada · 25 min",
      content: "Colaboración cruzada. Tienen comprador para Cap Cana, podemos compartir comisión 60/40.",
      durationMin: 25,
      createdAt: days(8),
    },
    // Familia Ramírez (cliente VIP)
    {
      contactId: contacts[8].id,
      type: "VISIT",
      title: "Visita Miraflores",
      content: "Vieron la casa 2 veces. Muy interesados, esperando aprobación bancaria.",
      createdAt: days(2),
    },
    {
      contactId: contacts[8].id,
      type: "CALL",
      title: "Llamada · 15 min",
      content: "Pre-aprobación bancaria al 80% del valor. Quieren cerrar antes de fin de mes.",
      durationMin: 15,
      createdAt: hours(20),
    },
  ];

  await prisma.contactActivity.createMany({
    data: activities.map((a) => ({
      contactId: a.contactId,
      userId: user.id,
      type: a.type,
      title: a.title,
      content: a.content ?? null,
      durationMin: a.durationMin ?? null,
      createdAt: a.createdAt,
    })),
  });
  console.log(`✓ Activities: ${activities.length}`);

  // Sync lastContactedAt to most recent activity per contact
  const lastByContact = new Map<string, Date>();
  for (const a of activities) {
    const cur = lastByContact.get(a.contactId);
    if (!cur || a.createdAt > cur) lastByContact.set(a.contactId, a.createdAt);
  }
  for (const [contactId, date] of lastByContact) {
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastContactedAt: date },
    });
  }

  // === CUSTOM FIELDS ===
  await prisma.contactCustomField.createMany({
    data: [
      { contactId: contacts[1].id, key: "Presupuesto", value: "US$ 180-220k" },
      { contactId: contacts[1].id, key: "Financiamiento", value: "Banco Popular" },
      { contactId: contacts[1].id, key: "Zona preferida", value: "Santiago centro" },
      { contactId: contacts[8].id, key: "Presupuesto", value: "US$ 350-400k" },
      { contactId: contacts[8].id, key: "Origen del lead", value: "Referido por Carlos Almonte" },
      { contactId: contacts[8].id, key: "Familia", value: "4 personas, 2 niños" },
      { contactId: contacts[0].id, key: "Banco hipoteca", value: "BHD" },
      { contactId: contacts[0].id, key: "Comisión acordada", value: "5%" },
      { contactId: contacts[2].id, key: "Trabajo", value: "Hotel Bávaro Beach" },
    ],
  });
  console.log(`✓ Custom fields: 9`);

  // === SMART LISTS ===
  await prisma.smartList.createMany({
    data: [
      {
        userId: user.id,
        name: "Hot Leads",
        icon: "Flame",
        color: "#EF4444",
        filters: JSON.stringify({ tagIds: [tHot.id], favorite: false }),
        pinned: true,
      },
      {
        userId: user.id,
        name: "VIP / Cash buyers",
        icon: "Crown",
        color: "#A855F7",
        filters: JSON.stringify({ tagIds: [tVip.id, tCash.id] }),
        pinned: true,
      },
      {
        userId: user.id,
        name: "Necesitan seguimiento",
        icon: "Clock",
        color: "#6366F1",
        filters: JSON.stringify({ tagIds: [tFollow.id] }),
        pinned: false,
      },
      {
        userId: user.id,
        name: "Sin contacto +30d",
        icon: "AlertCircle",
        color: "#F59E0B",
        filters: JSON.stringify({ daysSinceContact: 30 }),
        pinned: false,
      },
    ],
  });
  console.log(`✓ Smart lists: 4`);

  // === LINK APPOINTMENTS TO CONTACTS ===
  // The seed already created appointments with attendees text — back-fill contactId
  const apptsToLink = await prisma.appointment.findMany({
    where: { userId: user.id },
    select: { id: true, attendees: true, title: true },
  });
  for (const ap of apptsToLink) {
    // Naive match by attendees substring → contact name
    const match = contacts.find(
      (c) =>
        (ap.attendees && ap.attendees.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])) ||
        ap.title.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])
    );
    if (match) {
      await prisma.appointment.update({
        where: { id: ap.id },
        data: { contactId: match.id },
      });
    }
  }
  console.log(`✓ Appointments linked to contacts`);

  // === TENANTS + RENTAL PAYMENTS (Pedro renta una propiedad) ===
  // Pick a rental-operation property (or fallback to first property)
  const rentalProperty =
    props.find((p) => p.operation === "EN_ALQUILER") ?? props[3] ?? props[0];
  const tenant = await prisma.tenant.create({
    data: {
      userId: user.id,
      propertyId: rentalProperty.id,
      name: contacts[2].name, // Pedro Reyes
      email: contacts[2].email ?? null,
      phone: contacts[2].phone ?? null,
      whatsapp: contacts[2].whatsapp ?? null,
      monthlyRent: 850,
      deposit: 1700,
      currency: "USD",
      startDate: days(120),
      paymentDay: 5,
      status: "ACTIVE",
      notes: "Inquilino estable. Pago puntual.",
    },
  });
  console.log(`✓ Tenant: ${tenant.name}`);

  // 4 payments: 3 paid + 1 due this month
  await prisma.rentalPayment.createMany({
    data: [
      {
        userId: user.id,
        propertyId: rentalProperty.id,
        tenantId: tenant.id,
        amount: 850,
        currency: "USD",
        concept: "RENT",
        dueDate: days(95),
        paidDate: days(94),
        status: "PAID",
        method: "Transferencia",
      },
      {
        userId: user.id,
        propertyId: rentalProperty.id,
        tenantId: tenant.id,
        amount: 850,
        currency: "USD",
        concept: "RENT",
        dueDate: days(65),
        paidDate: days(63),
        status: "PAID",
        method: "Transferencia",
      },
      {
        userId: user.id,
        propertyId: rentalProperty.id,
        tenantId: tenant.id,
        amount: 850,
        currency: "USD",
        concept: "RENT",
        dueDate: days(35),
        paidDate: days(34),
        status: "PAID",
        method: "Efectivo",
      },
      {
        userId: user.id,
        propertyId: rentalProperty.id,
        tenantId: tenant.id,
        amount: 850,
        currency: "USD",
        concept: "RENT",
        dueDate: days(-3), // due in 3 days from now
        status: "PENDING",
      },
    ],
  });
  console.log(`✓ Rental payments: 4 (3 paid + 1 pending)`);

  // === MAINTENANCE TICKETS ===
  await prisma.maintenanceTicket.createMany({
    data: [
      {
        userId: user.id,
        propertyId: rentalProperty.id,
        title: "Aire acondicionado del cuarto principal",
        description: "Inquilino reporta que no enfría bien. Revisar gas y filtros.",
        category: "AC",
        priority: "HIGH",
        status: "IN_PROGRESS",
        vendor: "Roberto Castillo (Electricista)",
        cost: 3500,
      },
      {
        userId: user.id,
        propertyId: rentalProperty.id,
        title: "Pintura exterior",
        description: "Pared lateral muestra desgaste y manchas de humedad.",
        category: "PAINT",
        priority: "MEDIUM",
        status: "OPEN",
      },
      {
        userId: user.id,
        propertyId: props[0].id,
        title: "Filtración en el baño visitas",
        description: "Cliente reportó humedad en el techo del baño de visitas.",
        category: "PLUMBING",
        priority: "HIGH",
        status: "RESOLVED",
        vendor: "Juan Pérez (Plomero)",
        cost: 5200,
        resolvedAt: days(15),
      },
    ],
  });
  console.log(`✓ Maintenance tickets: 3`);

  // === SITE (public portal) ===
  await prisma.site.deleteMany({ where: { userId: user.id } });
  await prisma.site.create({
    data: {
      userId: user.id,
      slug: "demo",
      template: "LUXURY_DARK",
      title: "Demo Agente",
      tagline: "Tu próximo hogar te está esperando",
      about:
        "Asesor inmobiliario en República Dominicana. Más de 50 propiedades vendidas con clientes satisfechos en todo el país.",
      primaryColor: "#3B82F6",
      phone: "+1 809-555-0001",
      whatsapp: "+1 809-555-0001",
      email: DEMO_EMAIL,
      instagramUrl: "https://instagram.com/demoagente",
      facebookUrl: "https://facebook.com/demoagente",
      published: true,
    },
  });
  console.log(`✓ Site: 1 (slug=demo, template=LUXURY_DARK)`);

  console.log("\n✅ Seed complete!");
  console.log(`   Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
