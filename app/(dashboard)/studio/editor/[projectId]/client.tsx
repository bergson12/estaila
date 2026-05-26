"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PhotopeaEditor = dynamic(
  () =>
    import("@/components/editor/PhotopeaEditor").then(
      (m) => m.PhotopeaEditor
    ),
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
  initialImageUrl?: string | null;
};

export function EditorClient(props: Props) {
  return (
    <PhotopeaEditor
      projectId={props.projectId}
      initialName={props.initialName}
      initialImageUrl={props.initialImageUrl}
      canvasData={props.canvasData}
    />
  );
}
