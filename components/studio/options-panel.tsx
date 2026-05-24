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
    <Card className={cn("p-5", className)}>
      {title && (
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      {children}
    </Card>
  );
}
