import "server-only";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ImageProcessor,
  ProcessInput,
  ProcessResult,
} from "./types";

/**
 * MockProcessor — simulates AI image generation for MVP.
 *
 * TODO: replace with real Replicate/fal.ai integration. See replicate-processor.ts stub.
 *
 * Strategy:
 *  1. Sleep N seconds (per tool) to feel real.
 *  2. Copy source file to /uploads/{userId}/generations/{uuid}.{ext}
 *     so download/share works on a distinct file.
 *  3. Return a CSS filter that approximates the visual transformation.
 *     The client applies this filter to the "after" image so the slider
 *     reveals a perceptible difference.
 */

const SLEEP_BY_TOOL: Record<string, number> = {
  STAGING: 3500,
  DECLUTTER: 2200,
  ENHANCE: 1500,
  STYLE_CHANGE: 3200,
  SKY: 2000,
  TWILIGHT: 2500,
  POOL: 1800,
  LAWN: 1800,
  ADD_OBJECT: 2400,
  REMOVE_OBJECT: 2200,
};

const FILTER_BY_TOOL: Record<string, string> = {
  STAGING: "saturate(1.15) brightness(1.05) contrast(1.06)",
  DECLUTTER: "contrast(1.04) brightness(1.04) blur(0.2px)",
  ENHANCE: "contrast(1.15) saturate(1.18) brightness(1.06)",
  STYLE_CHANGE: "hue-rotate(15deg) saturate(1.1) brightness(1.02)",
  SKY: "brightness(1.08) saturate(1.3) contrast(1.05)",
  TWILIGHT: "sepia(0.25) hue-rotate(-12deg) saturate(1.35) brightness(0.95)",
  POOL: "brightness(1.05) saturate(1.45) contrast(1.05)",
  LAWN: "hue-rotate(8deg) saturate(1.35) brightness(1.05)",
  ADD_OBJECT: "saturate(1.1) brightness(1.04)",
  REMOVE_OBJECT: "contrast(1.05) brightness(1.04)",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function publicToFsPath(publicUrl: string): string {
  // e.g. /uploads/abc/img.jpg → <cwd>/public/uploads/abc/img.jpg
  return path.join(process.cwd(), "public", publicUrl.replace(/^\//, ""));
}

export class MockProcessor implements ImageProcessor {
  constructor(private userId: string) {}

  async process(input: ProcessInput): Promise<ProcessResult> {
    const startedAt = Date.now();
    const sleepMs = SLEEP_BY_TOOL[input.tool] ?? 2000;
    await sleep(sleepMs);

    // Copy original to /uploads/{userId}/generations/{uuid}.{ext}
    const srcFs = publicToFsPath(input.inputUrl);
    const ext = path.extname(srcFs) || ".jpg";
    const outName = `${randomUUID()}${ext}`;
    const outDirFs = path.join(
      process.cwd(),
      "public",
      "uploads",
      this.userId,
      "generations"
    );
    const outFs = path.join(outDirFs, outName);

    try {
      await mkdir(outDirFs, { recursive: true });
      await copyFile(srcFs, outFs);
    } catch (e) {
      // If copy fails (file missing, e.g. seeded with remote URL), fall back
      // to reusing the input URL — the cssFilter still differentiates after.
      return {
        outputUrl: input.inputUrl,
        cssFilter: FILTER_BY_TOOL[input.tool],
        processingTimeMs: Date.now() - startedAt,
      };
    }

    return {
      outputUrl: `/uploads/${this.userId}/generations/${outName}`,
      cssFilter: FILTER_BY_TOOL[input.tool],
      processingTimeMs: Date.now() - startedAt,
    };
  }
}
