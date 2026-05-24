import "server-only";
import type { ImageProcessor, ProcessInput, ProcessResult } from "./types";

/**
 * ReplicateProcessor — placeholder for real AI integration.
 *
 * TODO: integrate Replicate SDK (@replicate/replicate).
 *
 * Suggested model mapping:
 *   STAGING        → adirik/interior-design  OR  jagilley/controlnet-hough
 *   DECLUTTER      → stability-ai/stable-diffusion-inpainting (with masking)
 *   ENHANCE        → nightmareai/real-esrgan (upscale + sharpen)
 *   STYLE_CHANGE   → adirik/interior-design with style prompt
 *   SKY            → cjwbw/sky-replacement OR custom inpainting prompt
 *   TWILIGHT       → adirik/twilight-photo OR LUT-based post-process
 *   POOL / LAWN    → custom inpaint with semantic mask + prompt
 *
 * Each tool will:
 *  1. Upload inputUrl to Replicate's file API (or proxy via public URL)
 *  2. Run the model with appropriate prompt + options
 *  3. Poll the prediction until succeeded
 *  4. Download the output and save it to /uploads/{userId}/generations/
 *  5. Return ProcessResult with outputUrl
 */
export class ReplicateProcessor implements ImageProcessor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private apiToken: string, private userId: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async process(_input: ProcessInput): Promise<ProcessResult> {
    throw new Error(
      "ReplicateProcessor not yet implemented — see TODO comments in this file."
    );
  }
}
