"use client";

import { X } from "lucide-react";
import { useEditor } from "@/lib/editor/store";

export function DrawerShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const close = () => useEditor.getState().toggleDrawer(useEditor.getState().drawer);
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-[#15151B] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
}
