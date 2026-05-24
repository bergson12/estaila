import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PAGES = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const session = getSessionCookie(req);
  const path = req.nextUrl.pathname;
  const isAuthPage = AUTH_PAGES.includes(path);

  // Public portal routes (/p/*), digital cards (/c/*) and marketing (/welcome) are always accessible
  if (
    path.startsWith("/p/") ||
    path.startsWith("/c/") ||
    path.startsWith("/welcome") ||
    path.startsWith("/invitacion")
  ) {
    return NextResponse.next();
  }

  if (!session && !isAuthPage) {
    const url = new URL("/login", req.url);
    if (path !== "/") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif)$).*)",
  ],
};
