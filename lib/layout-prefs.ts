"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "estaila-layout";
export type LayoutMode = "sidebar" | "topbar";

/** Read the user's preferred layout mode (server-side). */
export async function getLayoutMode(): Promise<LayoutMode> {
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  return v === "topbar" ? "topbar" : "sidebar";
}

/** Toggle / set layout mode and refresh the route. */
export async function setLayoutMode(mode: LayoutMode) {
  const store = await cookies();
  store.set(COOKIE_NAME, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true, mode };
}
