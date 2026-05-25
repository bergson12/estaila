// Shared types for the Studio IA pipeline.

export type AIToolName =
  | "STAGING"
  | "DECLUTTER"
  | "ENHANCE"
  | "STYLE_CHANGE"
  | "SKY"
  | "TWILIGHT"
  | "POOL"
  | "LAWN"
  | "ADD_OBJECT"
  | "REMOVE_OBJECT";

export type StagingStyle =
  | "MODERN"
  | "SCANDINAVIAN"
  | "CARIBENO"
  | "COLONIAL"
  | "MINIMALISTA"
  | "LUXURY"
  | "INDUSTRIAL"
  | "COSTERO";

export type RoomType =
  | "LIVING"
  | "BEDROOM"
  | "KITCHEN"
  | "DINING"
  | "OFFICE"
  | "EXTERIOR";

export type ProcessOptions = {
  style?: StagingStyle | string;
  roomType?: RoomType | string;
  removeFurnitureFirst?: boolean;
  density?: "MINIMAL" | "BALANCED" | "FULL";
  // Extra staging knobs
  lightMood?: string;
  buyerTarget?: string;
  luxuryLevel?: string;
  extraPrompt?: string;
  // Brush mask data URL (white-on-black) restricting AI to that area
  maskDataUrl?: string;
  // Declutter
  declutterMode?: "AUTO" | "FURNITURE" | "PEOPLE" | "PERSONAL";
  // Enhance
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  whiteBalance?: number;
  preset?: string;
  // Sky / twilight
  skyMode?: "CLEAR" | "SUNSET" | "DRAMATIC" | "TROPICAL";
  // Add/Remove object — free-form text
  prompt?: string;
};

export type ProcessInput = {
  tool: AIToolName;
  inputUrl: string;
  options?: ProcessOptions;
  prompt?: string;
};

export type ProcessResult = {
  outputUrl: string;
  cssFilter?: string;
  processingTimeMs: number;
};

export interface ImageProcessor {
  process(input: ProcessInput): Promise<ProcessResult>;
}
