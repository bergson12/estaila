"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./html-code-editor-inner").then((m) => m.HtmlCodeEditorInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[52vh] items-center justify-center rounded-xl bg-[#282c34] text-xs text-white/50">
        Cargando editor…
      </div>
    ),
  }
);

export function HtmlCodeEditor(props: {
  value: string;
  onChange: (v: string) => void;
}) {
  return <Inner {...props} />;
}
