"use client";

import { PolotnoEditor } from "@/components/editor/PolotnoEditor";

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
