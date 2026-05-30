/**
 * Constantes + tipos compartidos de "Foto Pro del Agente".
 * Fuera del archivo "use server" (los Server Actions solo exportan funciones async).
 */

export const AGENT_PHOTO_COST = 4;

export const FRAMING = [
  { v: "closeup", l: "Primer plano" },
  { v: "bust", l: "Busto" },
  { v: "half", l: "Cuerpo medio" },
] as const;

export const LIGHTING = [
  { v: "studio", l: "Estudio" },
  { v: "natural", l: "Natural" },
  { v: "dramatic", l: "Dramática" },
  { v: "soft", l: "Suave" },
] as const;

export const EXPRESSION = [
  { v: "smile", l: "Sonrisa" },
  { v: "serious", l: "Seria" },
  { v: "confident", l: "Confiada" },
] as const;

export const RETOUCH = [
  { v: "natural", l: "Natural" },
  { v: "polished", l: "Pulido" },
] as const;

export const KEEP_OPTIONS = [
  { v: "beard", l: "Barba" },
  { v: "glasses", l: "Lentes" },
  { v: "hairstyle", l: "Peinado" },
  { v: "skintone", l: "Tono de piel" },
] as const;

export type AgentPhotoInput = {
  inputUrl: string;
  // Cada opción acepta un preset O texto libre (personalizado) → por eso son string.
  style: string;
  wardrobe: string;
  background: string;
  pose: string;
  size: "vertical" | "cuadrado" | "horizontal";
  framing: string;
  lighting: string;
  expression: string;
  retouch: string;
  /** valores de KEEP_OPTIONS a preservar exactos */
  keep: string[];
  /** id de StylePreset elegido como referencia de estilo (opcional) */
  referenceId?: string;
  extra?: string;
};
