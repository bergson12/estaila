import { z } from "zod";
import {
  CATEGORIES,
  OPERATIONS,
  PROPERTY_STATUSES,
  CONTACT_TYPES,
  PIPELINE_STAGES,
  AI_TOOLS,
} from "./constants";

const enumFrom = <T extends ReadonlyArray<{ value: string }>>(list: T) =>
  z.enum(list.map((x) => x.value) as [string, ...string[]]);

export const PropertySchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: enumFrom(CATEGORIES),
  operation: enumFrom(OPERATIONS),
  status: enumFrom(PROPERTY_STATUSES),
  priceUSD: z.coerce.number().nonnegative().optional().or(z.nan().transform(() => undefined)),
  priceDOP: z.coerce.number().nonnegative().optional().or(z.nan().transform(() => undefined)),
  bedrooms: z.coerce.number().int().nonnegative().optional().or(z.nan().transform(() => undefined)),
  bathrooms: z.coerce.number().nonnegative().optional().or(z.nan().transform(() => undefined)),
  parking: z.coerce.number().int().nonnegative().optional().or(z.nan().transform(() => undefined)),
  metersSquared: z.coerce.number().int().nonnegative().optional().or(z.nan().transform(() => undefined)),
  location: z.string().max(200).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  mapsUrl: z.string().url().optional().or(z.literal("")),
  featuredPhoto: z.string().optional().or(z.literal("")),
  ownerId: z.string().optional().or(z.literal("")),

  // Luxury landing fields
  premiumLanding: z.boolean().optional(),
  lat: z.coerce.number().optional().or(z.nan().transform(() => undefined)),
  lng: z.coerce.number().optional().or(z.nan().transform(() => undefined)),
  customTagline: z.string().max(200).optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
  walkthroughUrl: z.string().optional().or(z.literal("")),
  amenities: z.string().optional().or(z.literal("")), // JSON-stringified array
  finishes: z.string().optional().or(z.literal("")), // JSON-stringified array
  nearbyPois: z.string().optional().or(z.literal("")), // JSON-stringified array
  floorPlans: z.string().optional().or(z.literal("")), // JSON-stringified array
});
export type PropertyInput = z.input<typeof PropertySchema>;
export type PropertyOutput = z.output<typeof PropertySchema>;

export const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  type: enumFrom(CONTACT_TYPES),
  phone: z.string().max(40).optional().or(z.literal("")),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  rnc: z.string().max(40).optional().or(z.literal("")),
  reference: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  favorite: z.boolean(),
});
export type ContactInput = z.input<typeof ContactSchema>;

export const PipelineCardSchema = z.object({
  contactId: z.string(),
  propertyId: z.string().optional().or(z.literal("")),
  stage: enumFrom(PIPELINE_STAGES).default("NUEVO"),
  value: z.coerce.number().nonnegative().optional().or(z.nan().transform(() => undefined)),
  notes: z.string().max(2000).optional().or(z.literal("")),
  nextAction: z.string().max(200).optional().or(z.literal("")),
  nextActionDate: z.coerce.date().optional(),
});

export const AIGenerateSchema = z.object({
  tool: enumFrom(AI_TOOLS),
  inputUrl: z.string().min(1),
  photoId: z.string().optional(),
  prompt: z.string().max(500).optional(),
  style: z.string().max(50).optional(),
  roomType: z.string().max(50).optional(),
  options: z.record(z.string(), z.any()).optional(),
});
export type AIGenerateInput = z.infer<typeof AIGenerateSchema>;
