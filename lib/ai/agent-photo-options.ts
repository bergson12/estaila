/**
 * Constantes + tipos compartidos de "Foto Pro del Agente".
 *
 * Vive FUERA del archivo `"use server"` porque los módulos de Server Actions
 * solo pueden exportar funciones async — exportar una const o tipos desde ahí
 * rompe el build de Next/Turbopack.
 */

export const AGENT_PHOTO_COST = 4;

export type AgentPhotoInput = {
  inputUrl: string;
  style: "corporativo" | "moderno" | "calido" | "editorial" | "exterior" | "lujo";
  wardrobe: "traje" | "business_casual" | "blazer" | "camisa" | "actual";
  background: "estudio_gris" | "blanco" | "oficina" | "ciudad" | "interior_lujo" | "marca";
  pose: "frontal" | "brazos" | "tres_cuartos" | "casual" | "actual";
  size: "vertical" | "cuadrado" | "horizontal";
  extra?: string;
};
