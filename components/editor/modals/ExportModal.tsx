"use client";

import { Download, FileImage, FileType, Loader2, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileType = "png" | "jpg" | "pdf" | "webp";

export function ExportModal({
  open,
  onClose,
  propertyTitle,
}: {
  open: boolean;
  onClose: () => void;
  propertyTitle?: string;
}) {
  const canvas = useEditor((s) => s.canvas);
  const projectName = useEditor((s) => s.projectName);
  const [fileType, setFileType] = useState<FileType>("png");
  const [quality, setQuality] = useState<"standard" | "high" | "max">("high");
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  async function exportFile() {
    if (!canvas) return;
    setExporting(true);
    try {
      const multiplier = quality === "max" ? 3 : quality === "high" ? 2 : 1;
      let dataUrl: string;
      if (fileType === "jpg") {
        dataUrl = canvas.toDataURL({ format: "jpeg", quality: 0.92, multiplier });
      } else if (fileType === "webp") {
        dataUrl = canvas.toDataURL({ format: "webp" as never, quality: 0.92, multiplier });
      } else if (fileType === "pdf") {
        const png = canvas.toDataURL({ format: "png", multiplier });
        const { jsPDF } = await import("jspdf");
        const w = canvas.width ?? 1080;
        const h = canvas.height ?? 1080;
        const orientation: "portrait" | "landscape" = w >= h ? "landscape" : "portrait";
        const pdf = new jsPDF({ unit: "px", format: [w, h], orientation });
        pdf.addImage(png, "PNG", 0, 0, w, h);
        pdf.save(`${projectName || "estaila"}.pdf`);
        toast.success("PDF descargado");
        setExporting(false);
        onClose();
        return;
      } else {
        dataUrl = canvas.toDataURL({ format: "png", multiplier });
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${projectName || "estaila"}.${fileType}`;
      a.click();
      toast.success(`${fileType.toUpperCase()} descargado`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
      onClose();
    }
  }

  async function exportToWhatsApp() {
    if (!canvas) return;
    setExporting(true);
    try {
      const jpg = canvas.toDataURL({ format: "jpeg", quality: 0.8, multiplier: 1 });
      // Download first
      const a = document.createElement("a");
      a.href = jpg;
      a.download = `${projectName || "estaila"}-whatsapp.jpg`;
      a.click();
      // Open WhatsApp Web with prefilled text
      const text = encodeURIComponent(
        propertyTitle
          ? `🏡 ${propertyTitle}\n\nAcabo de preparar este post — adjunta la imagen.`
          : "🏡 Mira esta propiedad — adjunta la imagen."
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
      toast.success("Imagen lista para WhatsApp");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#15151B] p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Exportar</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Rápido
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button
            onClick={exportToWhatsApp}
            disabled={exporting}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            onClick={() => {
              setFileType("png");
              setQuality("high");
              exportFile();
            }}
            disabled={exporting}
            className="bg-pink-600 text-white hover:bg-pink-500"
          >
            <FileImage className="mr-1.5 h-3.5 w-3.5" />
            Instagram
          </Button>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Formato
        </p>
        <div className="mb-3 grid grid-cols-4 gap-1.5">
          {(["png", "jpg", "pdf", "webp"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFileType(t)}
              className={cn(
                "rounded border px-2 py-1.5 text-xs font-semibold uppercase transition-colors",
                fileType === t
                  ? "border-primary/50 bg-primary/15 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Calidad
        </p>
        <div className="mb-5 grid grid-cols-3 gap-1.5">
          {(["standard", "high", "max"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={cn(
                "rounded border px-2 py-2 text-[11px] font-medium transition-colors",
                quality === q
                  ? "border-primary/50 bg-primary/15 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              )}
            >
              {q === "standard" ? "1× Web" : q === "high" ? "2× Print" : "3× Max"}
            </button>
          ))}
        </div>

        <Button
          onClick={exportFile}
          disabled={exporting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {exporting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Descargar
        </Button>
      </div>
    </div>
  );
}

// Reserve future
export const _FileTypeRef = FileType;
