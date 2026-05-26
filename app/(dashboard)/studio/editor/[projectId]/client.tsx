"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PolotnoEditor = dynamic(
  () =>
    import("@/components/editor/PolotnoEditor").then((m) => m.PolotnoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Cargando editor...</p>
        </div>
      </div>
    ),
  }
);

type Props = {
  projectId: string;
  initialName: string;
  canvasData: string;
  width: number;
  height: number;
  format: string;
  propertyTitle: string | null;
};

export function EditorClient(props: Props) {
  return (
    <PolotnoEditor
      projectId={props.projectId}
      initialName={props.initialName}
      canvasData={props.canvasData}
      width={props.width}
      height={props.height}
    />
  );
}
