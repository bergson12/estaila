import { NextResponse } from "next/server";
import { trackShareClick } from "@/lib/actions/property-share";

/**
 * Tracked redirect: /r/{trackingId} → /propiedad/{slug}?ref={trackingId}
 * Counts the click against PropertyShare and forwards to the canonical URL.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await ctx.params;
  const slug = await trackShareClick(trackingId);
  if (!slug) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const target = new URL(`/propiedad/${slug}`, req.url);
  target.searchParams.set("ref", trackingId);
  return NextResponse.redirect(target);
}
