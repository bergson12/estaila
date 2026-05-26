import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function OptionsPanel({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-3", className)}>
      {title && (
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      {children}
    </Card>
  );
}
