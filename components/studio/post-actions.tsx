"use client";

/**
 * Post-generation actions panel.
 *
 * After a Studio IA generation completes, the user can:
 *   - Download the image (modal with real download)
 *   - Save it to one of their properties
 *   - Share via WhatsApp to a contact
 *   - Copy public URL
 *   - Pass to another Studio tool
 *
 * Renders inline (below the canvas) — no nested scroll on the parent.
 */

import {
  Building2,
  Download,
  Link2,
  MessageSquareText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { brandedImageUrl } from "@/lib/public-url";
import {
  DownloadModal,
  SaveToPropertyDialog,
  SendToContactDialog,
} from "./photo-dialogs";
import { NextToolMenu } from "./next-tool-menu";

export function PostActions({
  generationId,
  outputUrl,
  onRegenerate,
  onReset,
  isGenerating,
}: {
  generationId: string;
  outputUrl: string;
  onRegenerate?: () => void;
  onReset: () => void;
  isGenerating: boolean;
}) {
  const [propsOpen, setPropsOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(brandedImageUrl(outputUrl));
    toast.success("URL copiada al portapapeles");
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => setDownloadOpen(true)}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Descargar
        </Button>

        <Button size="sm" variant="outline" onClick={() => setPropsOpen(true)}>
          <Building2 className="mr-1.5 h-3.5 w-3.5" />
          Guardar en propiedad
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setWhatsappOpen(true)}
        >
          <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
          Enviar a contacto
        </Button>

        <Button size="sm" variant="outline" onClick={copyUrl}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Copiar URL
        </Button>

        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerar
          </Button>
        )}

        <NextToolMenu />

        <Button size="sm" variant="ghost" onClick={onReset}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Cambiar foto
        </Button>
      </div>

      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        outputUrl={outputUrl}
        filename={`estaila-${generationId.slice(0, 8)}.png`}
      />
      <SaveToPropertyDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        generationId={generationId}
      />
      <SendToContactDialog
        open={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
        generationId={generationId}
        outputUrl={outputUrl}
      />
    </>
  );
}
