import { Images, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/studio/gallery-grid";
import { listMyGenerations } from "@/lib/actions/ai";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const items = await listMyGenerations();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={
          <>
            <Images className="h-6 w-6 text-primary" />
            Galería
          </>
        }
        description="Todas tus fotos generadas con Studio IA. Muévelas a una propiedad, compártelas o descárgalas."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/studio">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Generar nueva
            </Link>
          </Button>
        }
      />

      <GalleryGrid initial={items} />
    </div>
  );
}
