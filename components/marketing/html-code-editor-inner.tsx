"use client";

import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";

/** CodeMirror 6 HTML editor — loaded client-only (DOM-dependent). */
export function HtmlCodeEditorInner({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      height="52vh"
      theme={oneDark}
      extensions={[html()]}
      onChange={(v) => onChange(v)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        autocompletion: true,
        bracketMatching: true,
      }}
      style={{ fontSize: 12.5, borderRadius: 12, overflow: "hidden" }}
    />
  );
}
