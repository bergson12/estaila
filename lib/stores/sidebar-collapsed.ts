"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Shared "is the sidebar collapsed?" flag.
 * Persisted to localStorage so the choice survives page navigation + refresh,
 * and the same store is read by the sidebar (to render compact mode) and by
 * the topbar (to render the small collapse toggle next to the Home icon).
 */

type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
};

export const useSidebarCollapsed = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (v) => set({ collapsed: v }),
    }),
    {
      name: "estaila:sidebar-collapsed",
      version: 1,
    }
  )
);
