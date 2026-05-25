"use client";

import { useEffect, useState } from "react";
import { EditorTopbar } from "@/components/editor/layout/EditorTopbar";
import { EditorSidebar } from "@/components/editor/layout/EditorSidebar";
import { PropertiesPanel } from "@/components/editor/layout/PropertiesPanel";
import { LayersPanel } from "@/components/editor/layout/LayersPanel";
import { FabricCanvas } from "@/components/editor/canvas/FabricCanvas";
import { EditorHotkeys } from "@/components/editor/EditorHotkeys";
import { ImageDrawer } from "@/components/editor/drawers/ImageDrawer";
import { AIDrawer } from "@/components/editor/drawers/AIDrawer";
import { TextDrawer } from "@/components/editor/drawers/TextDrawer";
import { ElementsDrawer } from "@/components/editor/drawers/ElementsDrawer";
import { IconsDrawer } from "@/components/editor/drawers/IconsDrawer";
import { BrandDrawer } from "@/components/editor/drawers/BrandDrawer";
import { TemplatesDrawer } from "@/components/editor/drawers/TemplatesDrawer";
import { BackgroundDrawer } from "@/components/editor/drawers/BackgroundDrawer";
import { SizeDrawer } from "@/components/editor/drawers/SizeDrawer";
import { ExportModal } from "@/components/editor/modals/ExportModal";
import { useEditor, type ExportFormat } from "@/lib/editor/store";
import { serializeCanvas } from "@/lib/editor/fabric-init";
import { saveProject } from "@/lib/actions/editor";
import { toast } from "sonner";

export function EditorClient({
  projectId,
  initialName,
  canvasData,
  width,
  height,
  format,
  propertyTitle,
}: {
  projectId: string;
  initialName: string;
  canvasData: string;
  width: number;
  height: number;
  format: string;
  propertyTitle: string | null;
}) {
  const drawer = useEditor((s) => s.drawer);
  const setProjectName = useEditor((s) => s.setProjectName);
  const setCustomSize = useEditor((s) => s.setCustomSize);
  const setFormat = useEditor((s) => s.setFormat);
  const canvas = useEditor((s) => s.canvas);
  const projectName = useEditor((s) => s.projectName);
  const markSaved = useEditor((s) => s.markSaved);

  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setProjectName(initialName);
    if (["SQUARE", "STORY", "LANDSCAPE", "PORTRAIT", "FLYER_A4", "WHATSAPP"].includes(format)) {
      setFormat(format as ExportFormat);
    } else {
      setCustomSize(width, height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!canvas) return;
    try {
      const data = serializeCanvas(canvas);
      const thumbnail = canvas.toDataURL({
        format: "jpeg",
        quality: 0.6,
        multiplier: 0.25,
      });
      await saveProject(projectId, {
        name: projectName,
        canvasData: data,
        thumbnail,
      });
      markSaved();
      toast.success("Guardado");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#0a0a0f] text-white">
      <EditorTopbar projectId={projectId} onExport={() => setExportOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />

        {drawer === "image" && <ImageDrawer />}
        {drawer === "ai" && <AIDrawer />}
        {drawer === "text" && <TextDrawer />}
        {drawer === "elements" && <ElementsDrawer />}
        {drawer === "icons" && <IconsDrawer />}
        {drawer === "brand" && <BrandDrawer />}
        {drawer === "templates" && <TemplatesDrawer />}
        {drawer === "background" && <BackgroundDrawer />}
        {drawer === "size" && <SizeDrawer />}

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <FabricCanvas initialJson={canvasData} width={width} height={height} />
          </div>
          <LayersPanel />
        </div>

        <PropertiesPanel />
      </div>

      <EditorHotkeys onSave={handleSave} />
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        propertyTitle={propertyTitle ?? undefined}
      />
    </div>
  );
}
